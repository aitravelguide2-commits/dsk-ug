import express from 'express'
import { Op } from 'sequelize'
import { Booking, Accommodation } from '../models/index.js'
import { getSupabase } from '../services/supabase.js'

const router = express.Router()

// Public: List accommodations (active by default)
router.get('/accommodations', async (req, res, next) => {
  try {
    console.log('🔍 Catalog Route - Environment check:', {
      hasSupabaseURL: !!process.env.SUPABASE_PROJECT_URL,
      hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE,
      urlValue: process.env.SUPABASE_PROJECT_URL ? 'SET' : 'MISSING',
      keyValue: process.env.SUPABASE_SERVICE_ROLE ? 'SET (length: ' + process.env.SUPABASE_SERVICE_ROLE?.length + ')' : 'MISSING'
    });
    
    const { minGuests, isActive } = req.query
    console.log('📞 Calling getSupabase()...');
    const supa = getSupabase()
    console.log('✅ getSupabase() returned successfully');
    let q = supa.from('accommodations').select('*').order('updated_at', { ascending: false })
    if (isActive !== 'all') q = q.eq('is_active', true)
    if (minGuests) q = q.gte('max_guests', Number(minGuests))
    const { data: list, error } = await q
    if (error) throw error
    const normalizeUrl = (u) => {
      if (!u) return ''
      let clean = u.replace(/\\/g, '/').replace(/\/+/g, '/')
      clean = clean.replace(/^\/uploads\/images\//, '/uploads/')
      // Fix malformed protocol like 'http:/host' → 'http://host'
      if (clean.startsWith('http:/') && !clean.startsWith('http://')) {
        clean = clean.replace(/^http:\//, 'http://')
      }
      if (clean.startsWith('https:/') && !clean.startsWith('https://')) {
        clean = clean.replace(/^https:\//, 'https://')
      }
      return clean
    }
    const makeAbs = (url) => {
      const u = normalizeUrl(url)
      if (!u) return ''
      if (u.startsWith('http')) return u
      const base = `${req.protocol}://${req.get('host')}`
      return u.startsWith('/') ? `${base}${u}` : `${base}/${u}`
    }
    const data = (list || []).map(acc => ({
      id: acc.id,
      name: acc.name,
      description: acc.details || acc.description,
      price: Number(acc.price_per_night),
      capacity: acc.max_guests,
      location: acc.location || 'Zentrum',
      address: acc.address || '',
      features: acc.amenities || [],
      image: makeAbs(((acc.images || []).find(i => i?.isCover) || (acc.images || [])[0])?.url || ''),
      images: (acc.images || []).map(i => makeAbs(i.url)),
      isActive: !!acc.is_active,
      about: acc.about || '',
      connectivity: acc.connectivity || '',
      houseRules: acc.house_rules || '',
      reviews: acc.reviews || [],
      minStay: acc.min_stay_nights || 1
    }))
    res.json({ success: true, data })
  } catch (err) { next(err) }
})

// Public: Get single accommodation
router.get('/accommodations/:id', async (req, res, next) => {
  try {
    const supa = getSupabase()
    const { data: acc, error } = await supa.from('accommodations').select('*').eq('id', req.params.id).single()
    if (error?.code === 'PGRST116') return res.status(404).json({ success: false, msg: 'Nicht gefunden' })
    if (error) throw error
    if (!acc || !acc.is_active) return res.status(404).json({ success: false, msg: 'Nicht gefunden' })
    const normalizeUrl = (u) => {
      if (!u) return ''
      let clean = u.replace(/\\/g, '/').replace(/\/+/g, '/')
      clean = clean.replace(/^\/uploads\/images\//, '/uploads/')
      if (clean.startsWith('http:/') && !clean.startsWith('http://')) {
        clean = clean.replace(/^http:\//, 'http://')
      }
      if (clean.startsWith('https:/') && !clean.startsWith('https://')) {
        clean = clean.replace(/^https:\//, 'https://')
      }
      return clean
    }
    const makeAbs = (url) => {
      const u = normalizeUrl(url)
      if (!u) return ''
      if (u.startsWith('http')) return u
      const base = `${req.protocol}://${req.get('host')}`
      return u.startsWith('/') ? `${base}${u}` : `${base}/${u}`
    }
    const data = {
      id: acc.id,
      name: acc.name,
      description: acc.details || acc.description,
      price: Number(acc.price_per_night),
      capacity: acc.max_guests,
      location: acc.location || 'Zentrum',
      address: acc.address || '',
      features: acc.amenities || [],
      image: makeAbs(((acc.images || []).find(i => i?.isCover) || (acc.images || [])[0])?.url || ''),
      images: (acc.images || []).map(i => makeAbs(i.url)),
      isActive: !!acc.is_active,
      about: acc.about || '',
      connectivity: acc.connectivity || '',
      houseRules: acc.house_rules || '',
      reviews: acc.reviews || [],
      minStay: acc.min_stay_nights || 1
    }
    res.json({ success: true, data })
  } catch (err) { next(err) }
})

// Public: Availability for a date range
router.get('/accommodations/:id/availability', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query
    if (!startDate || !endDate) return res.status(400).json({ success: false, msg: 'startDate und endDate erforderlich' })
    const accId = Number(req.params.id)
    const bookings = await Booking.findAll({
      where: {
        accommodation_id: accId,
        status: { [Op.not]: 'cancelled' },
        [Op.or]: [
          // booking overlaps with range
          { check_in: { [Op.lte]: endDate }, check_out: { [Op.gte]: startDate } },
        ]
      }
    })

    const dayMs = 24 * 60 * 60 * 1000
    const start = new Date(startDate)
    const end = new Date(endDate)
    const days = []
    for (let d = new Date(start); d <= end; d = new Date(d.getTime() + dayMs)) {
      const dateStr = d.toISOString().slice(0, 10)
      const isBooked = bookings.some(b => (new Date(b.check_in) <= d) && (new Date(b.check_out) >= d))
      days.push({ date: dateStr, isAvailable: !isBooked })
    }
    res.json({ success: true, data: { accommodationId: accId, availability: days } })
  } catch (err) { next(err) }
})

export default router

// Public: Price estimate incl. cleaning fee
router.get('/accommodations/:id/price', async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const { checkIn, checkOut } = req.query
    if (!checkIn || !checkOut) return res.status(400).json({ success: false, msg: 'checkIn und checkOut erforderlich' })
    const inDate = new Date(String(checkIn))
    const outDate = new Date(String(checkOut))
    if (isNaN(inDate) || isNaN(outDate) || outDate <= inDate) return res.status(400).json({ success: false, msg: 'Ungültiger Zeitraum' })

    const dayMs = 24 * 60 * 60 * 1000
    const nights = Math.ceil((outDate.getTime() - inDate.getTime()) / dayMs)

    const { data: acc, error } = await getSupabase().from('accommodations').select('id,price_per_night').eq('id', id).single()
    if (error?.code === 'PGRST116') return res.status(404).json({ success: false, msg: 'Nicht gefunden' })
    if (error) throw error
    const pricePerNight = Number(acc?.price_per_night || 0)
    const base = pricePerNight * nights

    const cleaningFeeDefault = Number(process.env.CLEANING_FEE || 40)
    const cleaningThresholdDefault = Number(process.env.CLEANING_FEE_THRESHOLD || 4)
    const cleaningFee = Number(req.query.cleaningFee ?? cleaningFeeDefault)
    const cleaningFeeThreshold = Number(req.query.cleaningFeeThreshold ?? cleaningThresholdDefault)
    const applies = nights >= cleaningFeeThreshold
    const total = base + (applies ? cleaningFee : 0)

    res.json({ success: true, data: {
      nights,
      basePrice: base,
      cleaningFeeApplied: applies,
      cleaningFee,
      cleaningFeeThreshold,
      total
    } })
  } catch (err) { next(err) }
})
