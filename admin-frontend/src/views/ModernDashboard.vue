<template>
  <q-page class="q-pa-md">
    <!-- Header / Branding -->
    <div class="row items-center q-mb-md">
      <div class="col-auto">
        <q-avatar square size="48px" class="bg-primary text-white flex flex-center">
          <q-icon name="dashboard" size="28px" />
        </q-avatar>
      </div>
      <div class="col">
        <div class="text-h5">DSK-UG Admin</div>
        <div class="text-subtitle2 text-grey-7">Monteuerunterkünfte Leipzig – Übersicht & Steuerung</div>
      </div>
      <div class="col-auto">
        <q-btn unelevated color="primary" icon="language" label="DE" class="q-mr-sm"/>
        <q-btn flat color="grey-8" icon="light_mode"/>
      </div>
    </div>

    <!-- Stat Grid -->
    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-12 col-sm-6 col-md-3" v-for="(s, i) in stats" :key="i">
        <StatCard :title="s.title" :value="s.value" :icon="s.icon" :color="s.color"/>
      </div>
    </div>

    <div class="row q-col-gutter-md">
      <!-- Recent Bookings -->
      <div class="col-12 col-md-6">
        <q-card>
          <q-card-section class="row items-center">
            <div class="text-h6">Aktuelle Buchungen</div>
            <q-space />
            <q-btn flat icon="refresh" @click="reloadBookings" />
          </q-card-section>
          <q-separator />
          <q-card-section>
            <q-table
              :rows="recentBookings"
              :columns="bookingColumns"
              row-key="id"
              flat
              dense
            >
              <template #body-cell-status="props">
                <q-td :props="props">
                  <q-chip :color="statusColor(props.row.status)" text-color="white" dense>
                    {{ props.row.status }}
                  </q-chip>
                </q-td>
              </template>
            </q-table>
          </q-card-section>
        </q-card>
      </div>

      <!-- Accommodations Cards -->
      <div class="col-12 col-md-6">
        <q-card>
          <q-card-section class="row items-center">
            <div class="text-h6">Unterkünfte</div>
            <q-space />
            <q-btn flat icon="home" :to="{ name: 'accommodations' }" label="Alle anzeigen" />
          </q-card-section>
          <q-separator />
          <q-card-section>
            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-6" v-for="a in accommodationCards" :key="a.id">
                <q-card class="fit">
                  <q-img :src="a.image" :ratio="16/9" class="bg-grey-3">
                    <div class="absolute-bottom bg-black bg-opacity-40 text-white q-pa-xs">
                      <div class="text-subtitle2">{{ a.name }}</div>
                    </div>
                  </q-img>
                  <q-card-section class="q-pt-sm">
                    <div class="row items-center">
                      <div class="col">
                        <div class="text-body2">{{ a.guests }} Gäste • {{ a.beds }} Betten</div>
                        <div class="text-caption text-grey-7">{{ a.location }}</div>
                      </div>
                      <div class="col-auto text-bold">{{ a.price }}</div>
                    </div>
                  </q-card-section>
                  <q-separator />
                  <q-card-actions align="right">
                    <q-btn flat icon="edit" :to="{ name: 'accommodation-edit', params: { id: a.id } }" label="Bearbeiten" />
                  </q-card-actions>
                </q-card>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import StatCard from '../components/ui/StatCard.vue'
import { useAccommodations } from '../stores/accommodations'

const stats = [
  { title: 'Auslastung', value: '68%', icon: 'trending_up', color: 'positive' },
  { title: 'Einnahmen/Monat', value: '€ 24.200', icon: 'euro', color: 'primary' },
  { title: 'Aktive Buchungen', value: '12', icon: 'event', color: 'accent' },
  { title: 'Stornierungen', value: '3', icon: 'cancel', color: 'negative' }
]

const recentBookings = ref([
  { id: 1, guestName: 'Max Mustermann', accommodationName: 'Leipzig Zentrum Loft', checkIn: '2025-11-10', checkOut: '2025-11-15', totalPrice: 620, status: 'bestätigt' },
  { id: 2, guestName: 'Erika Muster', accommodationName: 'Nord Vorstadt Appartement', checkIn: '2025-11-12', checkOut: '2025-11-14', totalPrice: 280, status: 'ausstehend' },
  { id: 3, guestName: 'John Doe', accommodationName: 'Süd Zwei-Zimmer', checkIn: '2025-11-08', checkOut: '2025-11-11', totalPrice: 360, status: 'storniert' }
])

const bookingColumns = [
  { name: 'guestName', label: 'Gast', field: 'guestName', align: 'left' },
  { name: 'accommodationName', label: 'Unterkunft', field: 'accommodationName', align: 'left' },
  { name: 'checkIn', label: 'Check-in', field: 'checkIn', align: 'left' },
  { name: 'checkOut', label: 'Check-out', field: 'checkOut', align: 'left' },
  { name: 'totalPrice', label: 'Preis (€)', field: 'totalPrice', align: 'right', format: (v) => `€ ${v}` },
  { name: 'status', label: 'Status', field: 'status', align: 'left' }
]

function statusColor(status) {
  switch (status) {
    case 'bestätigt': return 'positive'
    case 'ausstehend': return 'warning'
    case 'storniert': return 'negative'
    default: return 'grey'
  }
}

function reloadBookings() {
  // Demo reload; in echter Integration hier API-Call
  recentBookings.value = [...recentBookings.value]
}

const store = useAccommodations()
const accommodationCards = computed(() => {
  const items = store.items || []
  return items.slice(0, 6).map((it, idx) => ({
    id: it.id || idx + 1,
    name: it.name || 'Unterkunft',
    guests: it.max_guests || it.guests || 4,
    beds: it.beds || Math.max(1, Math.round((it.max_guests || 4) / 2)),
    location: it.location || 'Leipzig',
    price: it.price_per_night ? `€ ${it.price_per_night}/Nacht` : 'Preis n/a',
    image: (it.images && it.images[0] && it.images[0].url) || placeholderImage(idx)
  }))
})

function placeholderImage(idx) {
  const pics = [
    'https://images.unsplash.com/photo-1504534463564-60d7be3b15df?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1504534463564-60d7be3b15df?q=80&w=1200&auto=format&fit=crop'
  ]
  return pics[idx % pics.length]
}

onMounted(async () => {
  try {
    await store.fetchAll()
  } catch (e) {
    // Fallbacks sind im Store implementiert
  }
})
</script>

<style scoped>
.text-bold { font-weight: 700; }
</style>

