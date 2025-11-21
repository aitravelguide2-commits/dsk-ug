import express from 'express'

const router = express.Router()

// In-Memory Cache & Performance Stats
const cache = { geocode: new Map(), pois: new Map() }
const perf = { total: 0, success: 0, fail: 0, avgMs: 0 }
const TTL_MS = 10 * 60 * 1000

function getCache(map, key) {
  const it = map.get(key)
  return it && (Date.now() - it.ts < TTL_MS) ? it.value : null
}
function setCache(map, key, value) { map.set(key, { value, ts: Date.now() }) }

// Helpers
async function geocodeAddress(fullAddress) {
  const key = `geo:${fullAddress}`
  const hit = getCache(cache.geocode, key)
  if (hit) return hit
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(fullAddress)}`
  const t0 = Date.now()
  const resp = await fetch(url, { headers: { 'User-Agent': 'DSK-UG/1.0' } })
  const dt = Date.now() - t0
  if (!resp.ok) throw new Error(`Geocoding fehlgeschlagen (${resp.status}) in ${dt}ms`)
  const arr = await resp.json()
  if (!arr?.length) throw new Error('Adresse nicht gefunden')
  const value = { lat: Number(arr[0].lat), lon: Number(arr[0].lon), display_name: arr[0].display_name }
  setCache(cache.geocode, key, value)
  return value
}

function buildUnifiedOverpassQuery(lat, lon, radiusM) {
  return `[out:json][timeout:60];
(
  node["shop"~"supermarket|convenience|department_store|mall|chemist"](around:${radiusM},${lat},${lon});
  way["shop"~"supermarket|convenience|department_store|mall|chemist"](around:${radiusM},${lat},${lon});

  node["amenity"~"restaurant|cafe|fast_food|bar|pub|marketplace|pharmacy|hospital|bank|post_office|fuel|doctors|clinic"](around:${radiusM},${lat},${lon});
  way["amenity"~"restaurant|cafe|fast_food|bar|pub|marketplace|pharmacy|hospital|bank|post_office|clinic"](around:${radiusM},${lat},${lon});

  node["highway"="bus_stop"](around:${radiusM},${lat},${lon});

  node["railway"~"station|stop|halt|tram_stop"](around:${radiusM},${lat},${lon});
  way["railway"~"station|stop|halt"](around:${radiusM},${lat},${lon});

  node["public_transport"~"stop_position|platform|station"](around:${radiusM},${lat},${lon});
  way["public_transport"~"platform|station"](around:${radiusM},${lat},${lon});

  node["healthcare"~"doctor|hospital|clinic|dentist"](around:${radiusM},${lat},${lon});
  way["healthcare"~"doctor|hospital|clinic|dentist"](around:${radiusM},${lat},${lon});

  node["leisure"~"park|playground|fitness_centre|sports_centre|garden"](around:${radiusM},${lat},${lon});
  way["leisure"~"park|playground|fitness_centre|sports_centre|garden"](around:${radiusM},${lat},${lon});

  node["tourism"="attraction"](around:${radiusM},${lat},${lon});
  way["tourism"="attraction"](around:${radiusM},${lat},${lon});
);
out center;`
}

async function overpassUnified(lat, lon, radiusM) {
  const key = `pois:${lat.toFixed(6)}:${lon.toFixed(6)}:${radiusM}`
  const cached = getCache(cache.pois, key)
  if (cached) return { elements: cached, cached: true, ms: 0 }

  const data = buildUnifiedOverpassQuery(lat, lon, radiusM)
  const urls = [ 'https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter' ]
  let lastErr = null
  const t0 = Date.now()
  for (const u of urls) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000)
      const resp = await fetch(u, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ data }), signal: controller.signal })
      clearTimeout(timeoutId)
      if (resp.ok) {
        const json = await resp.json()
        const elements = json.elements || []
        const ms = Date.now() - t0
        perf.total++; perf.success++; perf.avgMs = perf.avgMs ? Math.round((perf.avgMs * (perf.success - 1) + ms) / perf.success) : ms
        setCache(cache.pois, key, elements)
        console.log(`✅ Overpass OK (${u}) in ${ms}ms, Elemente=${elements.length}, avgMs=${perf.avgMs}`)
        return { elements, cached: false, ms }
      }
      lastErr = new Error(`Overpass Fehler (${resp.status})`)
      console.warn(`⚠️ Overpass Status ${resp.status} bei ${u}`)
    } catch (e) {
      lastErr = e
      console.warn(`⚠️ Overpass Fehler ${u}: ${e.message}`)
    }
  }
  const ms = Date.now() - t0
  perf.total++; perf.fail++
  console.error(`❌ Overpass fehlgeschlagen in ${ms}ms`)
  throw lastErr || new Error('Overpass unbekannter Fehler')
}

function haversine(lat1, lon1, lat2, lon2) {
  const toRad = (v) => v * Math.PI / 180
  const R = 6371000
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c)
}

function normalizeEntry(e, origin) {
  const lat = e.center?.lat ?? e.lat
  const lon = e.center?.lon ?? e.lon
  const name = e.tags?.name || e.tags?.brand || e.tags?.operator || 'Unbenannt'
  const street = e.tags?.['addr:street'] || ''
  const housenr = e.tags?.['addr:housenumber'] || ''
  const postcode = e.tags?.['addr:postcode'] || ''
  const city = e.tags?.['addr:city'] || ''
  return {
    name,
    typ: Object.entries(e.tags || {})
      .filter(([k]) => ['amenity','shop','railway','highway','leisure','healthcare','public_transport','tourism'].includes(k))
      .map(([k,v]) => `${k}:${v}`)
      .join(', '),
    entfernung_m: haversine(origin.lat, origin.lon, lat, lon),
    adresse: [street, housenr].filter(Boolean).join(' ') + (postcode || city ? `, ${[postcode, city].filter(Boolean).join(' ')}` : ''),
  }
}

router.post('/connectivity', async (req, res) => {
  const { address = '', postal_code = '', city = '', location = '' } = req.body || {}
  try {
    const fullAddress = [address, postal_code, city || 'Leipzig'].filter(Boolean).join(', ')
    console.log('🏠 Connectivity Request:', fullAddress)
    const tTotal = Date.now()
    const origin = await geocodeAddress(fullAddress)
    const radius = 1200
    const { elements, cached, ms } = await overpassUnified(origin.lat, origin.lon, radius)

    const cats = { einkauf: [], gastronomie: [], oepnv: [], medizin: [], parks: [], weitere: [] }
    elements.forEach(e => {
      const t = e.tags || {}
      const entry = normalizeEntry(e, origin)
      if (t.shop && ['supermarket','department_store','mall','chemist','convenience'].includes(t.shop)) cats.einkauf.push(entry)
      else if (t.amenity && ['marketplace'].includes(t.amenity)) cats.einkauf.push(entry)
      else if (t.amenity && ['restaurant','cafe','fast_food','bar','pub'].includes(t.amenity)) cats.gastronomie.push(entry)
      else if ((t.highway && t.highway === 'bus_stop') || (t.railway && ['station','stop','halt','tram_stop'].includes(t.railway)) || (t.public_transport && ['stop_position','platform','station'].includes(t.public_transport))) cats.oepnv.push(entry)
      else if ((t.healthcare && ['doctor','hospital','clinic','dentist'].includes(t.healthcare)) || (t.amenity && ['pharmacy','hospital','doctors','clinic'].includes(t.amenity))) cats.medizin.push(entry)
      else if (t.leisure && ['park','playground','fitness_centre','sports_centre','garden'].includes(t.leisure)) cats.parks.push(entry)
      else if (t.amenity && ['bank','post_office','fuel','atm'].includes(t.amenity)) cats.weitere.push(entry)
      else if (t.tourism && t.tourism === 'attraction') cats.weitere.push(entry)
    })

    const sortByDist = (a,b) => a.entfernung_m - b.entfernung_m
    Object.keys(cats).forEach(k => cats[k] = cats[k].sort(sortByDist).slice(0, 10))

    const payload = {
      adresse: fullAddress,
      koordinaten: { lat: origin.lat, lon: origin.lon },
      radius_m: radius,
      kategorien: cats,
      zusammenfassung: `Standortanalyse für ${location || city || 'Leipzig'} im Umkreis von ${(radius/1000).toFixed(1)} km.`,
      qualitaetspruefung: { plausibel: elements.length > 0, datenquellen: ['OpenStreetMap/Overpass'] },
      metrics: { overpass_ms: ms, cached, total_ms: Date.now() - tTotal, avg_ms: perf.avgMs, success: perf.success, fail: perf.fail }
    }

    // Optional: DeepSeek strukturierte Ausgabe basierend auf verifizierten Daten
    let text = ''
    try {
      const apiKey = process.env.DEEPSEEK_API_KEY
      if (apiKey && elements.length) {
        const system = 'Antwort ausschließlich auf Deutsch. Verwende NUR die gelieferten Daten. Keine erfundenen Orte. Formatiere übersichtlich.'
        const user = { aufgabe: 'Standortanalyse strukturieren', adresse: payload.adresse, radius_m: payload.radius_m, kategorien: payload.kategorien }
        const resp = await fetch('https://api.deepseek.com/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ model: 'deepseek-chat', messages: [ { role: 'system', content: system }, { role: 'user', content: JSON.stringify(user) } ], temperature: 0.1, max_tokens: 1000 }) })
        if (resp.ok) { const js = await resp.json(); text = js?.choices?.[0]?.message?.content || '' }
      }
    } catch (e) { console.warn('⚠️ DeepSeek Fehler:', e.message) }

    return res.json({ success: true, data: { ...payload, text } })
  } catch (err) {
    perf.total++; perf.fail++
    console.error('❌ Connectivity Fehler:', err.message)
    return res.status(200).json({ success: true, data: { adresse: [address, postal_code, city].filter(Boolean).join(', '), koordinaten: { lat: 0, lon: 0 }, radius_m: 1200, kategorien: { einkauf: [], gastronomie: [], oepnv: [], medizin: [], parks: [], weitere: [] }, zusammenfassung: 'Analyse nicht möglich (Geocoding/POI)', qualitaetspruefung: { plausibel: false, fehler: err.message }, metrics: { avg_ms: perf.avgMs, success: perf.success, fail: perf.fail } } })
  }
})

export default router
