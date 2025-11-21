<template>
  <div>
    <div class="uploader-toolbar q-mb-sm">
      <q-btn flat dense icon="auto_fix_high" label="Auto-arrange" @click="autoArrange" />
      <q-separator vertical inset class="q-mx-sm" />
      <q-select v-model="quality" :options="qualityOptions" label="Qualität" dense outlined style="min-width: 160px" />
      <q-btn color="primary" dense class="q-ml-sm" @click="$refs.fileInput.click()">Bilder hinzufügen</q-btn>
      <input ref="fileInput" type="file" multiple accept=".jpg,.jpeg,.png,.webp" @change="handleFiles" style="display:none" />
      <q-space />
      <div class="text-caption text-grey-7">Max 30 Bilder · jpg/jpeg/png/webp · 10MB</div>
    </div>
    <q-uploader
      label="Bilder auswählen (Drag & Drop)"
      multiple
      accept=".jpg,.jpeg,.png,.webp"
      :url="uploadUrl"
      :headers="authHeader"
      :field-name="'images'"
      :batch="true"
      :max-files="30"
      :max-file-size="10 * 1024 * 1024"
      :disable="!id"
      auto-upload
      hide-upload-btn
      @uploaded="onUpload"
      @removed="onRemove"
      @rejected="onRejected"
      @failed="onFailed"
      class="q-mb-md uploader-area"
    />
    <div class="image-grid q-mt-md">
      <q-card
        v-for="(img, idx) in images"
        :key="img.filename"
        class="image-card"
        draggable="true"
        @dragstart="onDragStart(idx)"
        @dragover.prevent
        @drop="onDrop(idx)"
      >
        <q-img :src="displayUrl(img.url)" fit="cover" class="image-preview" @click="openLightbox(idx)" />
        <div class="image-actions">
          <q-btn dense flat round icon="drag_indicator" class="drag-handle" title="Ziehen zum Sortieren" />
          <div class="spacer" />
          <q-btn dense flat round icon="zoom_in" @click="openPreview(img)" title="Vorschau" />
          <q-btn dense flat round icon="star" :color="idx === 0 ? 'yellow-8' : 'grey-6'" @click="onSetCover(idx)" :title="idx === 0 ? 'Titelbild' : 'Als Titelbild setzen'" />
          <q-btn dense flat round icon="chevron_left" @click="onMoveLeft(idx)" :disable="idx === 0" title="Nach links" />
          <q-btn dense flat round icon="chevron_right" @click="onMoveRight(idx)" :disable="idx === images.length - 1" title="Nach rechts" />
          
        </div>
        <q-btn dense flat round icon="delete" color="negative" class="image-delete" @click.stop="confirmRemove(img.filename)" title="Löschen" />
        <div v-if="progress[img.filename] >= 0" class="progress">
          <div class="bar" :style="{ width: (progress[img.filename] || 0) + '%' }"></div>
        </div>
        <q-badge v-if="idx === 0" color="primary" class="title-badge">Titelbild</q-badge>
        <div class="caption-row q-pa-xs">
          <q-input v-model="img.title" dense filled placeholder="Bildtitel / Caption" />
        </div>
      </q-card>
    </div>

    <div v-if="preview" class="lightbox" @click="closeLightbox">
      <button class="lightbox-close" @click.stop="closeLightbox" aria-label="Schließen">
        ✕
      </button>
      <div class="lightbox-count">{{ current + 1 }} / {{ images.length }}</div>
      <button v-if="images.length > 1" class="lightbox-prev" @click.stop="prevImage" aria-label="Vorheriges Bild">‹</button>
      <button v-if="images.length > 1" class="lightbox-next" @click.stop="nextImage" aria-label="Nächstes Bild">›</button>
      <div class="lightbox-body" @click.stop>
        <img :src="displayUrl(images[current]?.url)" :alt="images[current]?.title || ''" class="lightbox-img" />
        <div class="lightbox-caption">
          <div class="title">{{ images[current]?.title }}</div>
          <div class="sub">Bild {{ current + 1 }} von {{ images.length }}</div>
        </div>
      </div>
      <div class="lightbox-thumbs">
        <button v-for="(img, idx) in images" :key="img.filename || idx" @click.stop="setCurrent(idx)" :class="['thumb', idx === current ? 'thumb-active' : '']">
          <img :src="displayUrl(img.url)" alt="" />
        </button>
      </div>
      <div class="lightbox-help">← → Navigation · ESC Schließen</div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { useQuasar } from 'quasar'

const props = defineProps(['id', 'images'])
const emit = defineEmits(['uploaded', 'delete-image'])
const $q = useQuasar()
const dragIndex = ref(null)

const baseURL = (import.meta.env.VITE_API_URL ?? 'https://backend-dsk.tripvega.com/api')
const uploadsBase = computed(() => baseURL.replace(/\/$/, '').replace(/\/api$/, ''))
const quality = ref('none')
const qualityOptions = [
  { label: 'Keine Komprimierung', value: 'none' },
  { label: 'Hoch', value: 'high' },
  { label: 'Mittel', value: 'medium' },
  { label: 'Niedrig', value: 'low' }
]
const uploadUrl = computed(() => {
  const q = quality.value && quality.value !== 'none' ? `?quality=${quality.value}` : ''
  return `${baseURL}/accommodations/${props.id}/images${q}`
})
const authHeader = computed(() => {
  const t = localStorage.token
  return t ? [{ name: 'Authorization', value: `Bearer ${t}` }] : []
})
const preview = ref(false)
const previewImg = ref(null)
const current = ref(0)
const progress = ref({})

function onUpload(info) {
  try {
    const respText = String(info?.xhr?.responseText || '[]')
    const resp = JSON.parse(respText)
    const next = Array.isArray(resp) ? resp.map(r => ({
      ...r,
      url: r?.url?.startsWith('/uploads') ? `${uploadsBase.value}${r.url}` : r.url
    })) : props.images
    normalizeOrderAndCover(next)
    emit('uploaded', next)
  } catch (e) {
    $q.notify({ message: 'Upload-Antwort konnte nicht gelesen werden', color: 'negative', icon: 'error', position: 'top-right' })
  }
}
function onRemove({ files }) {
  emit('delete-image', files[0].name)
}

function onRejected(info) {
  const reason = Array.isArray(info?.rejected) && info.rejected.length
    ? info.rejected[0]
    : 'Abgelehntes Datei-Format oder Größenlimit überschritten.'
  $q.notify({
    message: typeof reason === 'string' ? reason : 'Upload abgelehnt',
    color: 'negative',
    icon: 'error',
    position: 'top-right'
  })
}

function onFailed(file) {
  $q.notify({ message: `Upload fehlgeschlagen: ${file.name || ''}`, color: 'negative', icon: 'error', position: 'top-right' })
}

function onSetCover(idx) {
  if (idx === 0) return
  const next = props.images.slice()
  const [item] = next.splice(idx, 1)
  next.unshift(item)
  normalizeOrderAndCover(next)
  emit('uploaded', next)
}

function onMoveLeft(idx) {
  if (idx <= 0) return
  const next = props.images.slice()
  const tmp = next[idx - 1]
  next[idx - 1] = next[idx]
  next[idx] = tmp
  normalizeOrderAndCover(next)
  emit('uploaded', next)
}

function onMoveRight(idx) {
  if (idx >= props.images.length - 1) return
  const next = props.images.slice()
  const tmp = next[idx + 1]
  next[idx + 1] = next[idx]
  next[idx] = tmp
  normalizeOrderAndCover(next)
  emit('uploaded', next)
}

function onDragStart(idx) {
  dragIndex.value = idx
}

function onDrop(targetIdx) {
  if (dragIndex.value === null || dragIndex.value === targetIdx) return
  const next = props.images.slice()
  const [moved] = next.splice(dragIndex.value, 1)
  next.splice(targetIdx, 0, moved)
  dragIndex.value = null
  normalizeOrderAndCover(next)
  emit('uploaded', next)
}

function confirmRemove(filename) {
  $q.dialog({
    title: 'Bild löschen?',
    message: 'Möchtest du dieses Bild wirklich löschen?',
    cancel: true,
    ok: {
      label: 'Löschen',
      color: 'negative'
    }
  }).onOk(() => emit('delete-image', filename))
}

function normalizeOrderAndCover(list) {
  list.forEach((img, i) => { img.order = i; img.isCover = i === 0 })
}

function autoArrange() {
  const next = props.images.slice().sort((a, b) => String(a.filename).localeCompare(String(b.filename)))
  normalizeOrderAndCover(next)
  emit('uploaded', next)
}

function openPreview(img) { previewImg.value = img; preview.value = true }
function openLightbox(idx) { current.value = idx; preview.value = true }
function closeLightbox() { preview.value = false }
function nextImage() { current.value = (current.value + 1) % (props.images?.length || 1) }
function prevImage() { current.value = (current.value - 1 + (props.images?.length || 1)) % (props.images?.length || 1) }
function setCurrent(idx) { current.value = idx }

function onKey(e) {
  if (!preview.value) return
  if (e.key === 'Escape') closeLightbox()
  if (e.key === 'ArrowRight') nextImage()
  if (e.key === 'ArrowLeft') prevImage()
}

watch(preview, (val) => {
  if (val) {
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
  } else {
    document.body.style.overflow = ''
    window.removeEventListener('keydown', onKey)
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKey)
  document.body.style.overflow = ''
})

function displayUrl(url) {
  if (!url) return ''
  return url.startsWith('/uploads') ? `${uploadsBase.value}${url}` : url
}

async function handleFiles(e) {
  const files = Array.from(e.target.files || [])
  if (!files.length) return
  for (const f of files) {
    if (!['image/jpeg','image/jpg','image/png','image/webp'].includes(f.type)) {
      $q.notify({ message: `${f.name}: Ungültiges Format`, color: 'negative', icon: 'error' }); continue
    }
    if (f.size > 10 * 1024 * 1024) { $q.notify({ message: `${f.name}: Datei zu groß (max 10MB)`, color: 'negative', icon: 'error' }); continue }
    const processed = await compressClient(f, quality.value)
    await uploadWithProgress(processed)
  }
  e.target.value = ''
}

function compressClient(file, q) {
  const type = file.type
  const noResize = true
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        const qualityMap = { high: 0.9, medium: 0.85, low: 0.75 }
        const mime = type === 'image/jpeg' || type === 'image/jpg' ? 'image/jpeg' : (type === 'image/webp' ? 'image/webp' : 'image/png')
        const qv = (mime === 'image/png' || q === 'none') ? undefined : (qualityMap[q] || 0.85)
        canvas.toBlob((blob) => {
          if (!blob) return reject(new Error('Blob leer'))
          const out = new File([blob], file.name, { type: mime, lastModified: Date.now() })
          resolve(out)
        }, mime, qv)
      }
      img.onerror = reject
      img.src = ev.target.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function uploadWithProgress(file) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const url = `${baseURL}/accommodations/${props.id}/images?quality=none`
    xhr.open('POST', url)
    const t = localStorage.token
    if (t) xhr.setRequestHeader('Authorization', `Bearer ${t}`)
    const fd = new FormData()
    fd.append('images', file)
    progress.value[file.name] = 0
    xhr.upload.onprogress = (evt) => { if (evt.lengthComputable) progress.value[file.name] = Math.round((evt.loaded / evt.total) * 100) }
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const resp = JSON.parse(xhr.responseText)
            const next = Array.isArray(resp) ? resp.map(r => ({ ...r, url: r?.url?.startsWith('/uploads') ? `${uploadsBase.value}${r.url}` : r.url })) : props.images
            normalizeOrderAndCover(next)
            emit('uploaded', next)
            resolve(resp)
          } catch (e) { reject(e) }
        } else { reject(new Error(`HTTP ${xhr.status}`)) }
        progress.value[file.name] = 100
      }
    }
    xhr.onerror = () => { progress.value[file.name] = 0; reject(new Error('Upload-Fehler')) }
    xhr.send(fd)
  })
}
</script>

<style scoped>
.uploader-toolbar { display: flex; align-items: center; }
.image-card {
  width: 150px;
  height: 150px;
  position: relative;
  overflow: hidden;
}
.image-preview {
  width: 100%;
  height: 100%;
}
.image-actions {
  position: absolute;
  bottom: 4px;
  left: 4px;
  right: 4px;
  display: flex;
  gap: 6px;
  justify-content: space-between;
  background: rgba(0,0,0,0.25);
  padding: 4px 6px;
  border-radius: 6px;
}
.image-delete { position: absolute; top: 6px; right: 6px; background: rgba(0,0,0,0.35); color: #fff; z-index: 5; }
.title-badge {
  position: absolute;
  top: 6px;
  left: 6px;
}
.uploader-area {
  min-height: 260px;
}
.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
}
.drag-handle { cursor: grab; }
.caption-row { background: rgba(255,255,255,0.9); }
.lightbox { position: fixed; inset: 0; background: rgba(0,0,0,0.95); z-index: 2000; display: flex; align-items: center; justify-content: center; }
.lightbox-close { position: absolute; top: 16px; right: 16px; background: rgba(255,255,255,0.1); color: #fff; border: 0; border-radius: 999px; padding: 12px; cursor: pointer; }
.lightbox-count { position: absolute; top: 16px; left: 16px; color: #fff; background: rgba(255,255,255,0.1); padding: 8px 12px; border-radius: 999px; }
.lightbox-prev, .lightbox-next { position: absolute; top: 50%; transform: translateY(-50%); background: rgba(255,255,255,0.1); color: #fff; border: 0; border-radius: 999px; padding: 16px; cursor: pointer; font-size: 24px; }
.lightbox-prev { left: 16px; }
.lightbox-next { right: 16px; }
.lightbox-body { max-width: 90vw; max-height: 90vh; }
.lightbox-img { max-width: 90vw; max-height: 80vh; object-fit: contain; border-radius: 8px; }
.lightbox-caption { position: relative; margin-top: 8px; color: #fff; }
.lightbox-caption .title { font-weight: 600; }
.lightbox-caption .sub { opacity: 0.8; font-size: 12px; }
.lightbox-thumbs { position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%); display: flex; gap: 8px; padding: 8px; background: rgba(255,255,255,0.1); border-radius: 999px; overflow-x: auto; max-width: 90vw; }
.thumb { width: 64px; height: 64px; border-radius: 8px; overflow: hidden; border: 0; padding: 0; background: transparent; cursor: pointer; }
.thumb img { width: 100%; height: 100%; object-fit: cover; }
.thumb-active { outline: 2px solid #fff; transform: scale(1.05); }
.lightbox-help { position: absolute; bottom: 72px; left: 50%; transform: translateX(-50%); color: rgba(255,255,255,0.7); font-size: 12px; }
</style>
