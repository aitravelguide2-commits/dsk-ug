<template>
  <q-page class="q-pa-md">
    <div class="text-h4 q-mb-lg">Buchungsverwaltung</div>
    
    <q-banner v-if="error" rounded class="bg-warning text-dark q-mb-md">
      <template #avatar><q-icon name="warning" color="dark"/></template>
      Keine Backend-Verbindung. Es werden Demo-Buchungen angezeigt.
    </q-banner>

    <q-card>
      <q-tabs
        v-model="tab"
        dense
        class="text-grey"
        active-color="primary"
        indicator-color="primary"
        align="justify"
        narrow-indicator
      >
        <q-tab name="requests" label="Anfragen" icon="mail" >
          <q-badge color="red" floating v-if="pendingCount > 0">{{ pendingCount }}</q-badge>
        </q-tab>
        <q-tab name="bookings" label="Buchungen" icon="book" />
      </q-tabs>

      <q-separator />

      <q-tab-panels v-model="tab" animated>
        <q-tab-panel name="requests">
          <div class="text-h6 q-mb-md">Offene Anfragen</div>
          <q-table :rows="pendingBookings" :columns="columns" row-key="id" flat bordered>
            <template #body-cell-status="props">
              <q-td :props="props"><q-badge :color="statusColor(props.row.status)">{{ props.row.status }}</q-badge></q-td>
            </template>
            <template #body-cell-actions="props">
              <q-td :props="props">
                <q-btn flat round color="positive" icon="check" @click="updateStatus(props.row.id, 'confirmed')" title="Bestätigen" />
                <q-btn flat round color="negative" icon="close" @click="updateStatus(props.row.id, 'cancelled')" title="Ablehnen" />
              </q-td>
            </template>
          </q-table>
          <div v-if="pendingBookings.length === 0" class="text-center q-pa-md text-grey">
            Keine offenen Anfragen.
          </div>
        </q-tab-panel>

        <q-tab-panel name="bookings">
          <div class="text-h6 q-mb-md">Bestätigte Buchungen</div>
          <q-table :rows="confirmedBookings" :columns="columns" row-key="id" flat bordered>
            <template #body-cell-status="props">
              <q-td :props="props"><q-badge :color="statusColor(props.row.status)">{{ props.row.status }}</q-badge></q-td>
            </template>
            <template #body-cell-actions="props">
              <q-td :props="props">
                <q-btn flat round color="negative" icon="close" @click="updateStatus(props.row.id, 'cancelled')" title="Stornieren" size="sm" />
              </q-td>
            </template>
          </q-table>
        </q-tab-panel>
      </q-tab-panels>
    </q-card>
  </q-page>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue'
import { Loading, Notify } from 'quasar'
import api from '../services/api.js'

const bookings = ref([])
const error = ref(null)
const tab = ref('requests')

const columns = [
  { name: 'guest_name', field: 'guest_name', label: 'Gast', align: 'left' },
  { name: 'guest_email', field: 'guest_email', label: 'E-Mail', align: 'left' },
  { name: 'Accommodation.name', field: row => row.Accommodation?.name || row.accommodation_name || 'Unbekannt', label: 'Unterkunft', align: 'left' },
  { name: 'check_in', field: 'check_in', label: 'Von', format: v => new Date(v).toLocaleDateString(), align: 'left' },
  { name: 'check_out', field: 'check_out', label: 'Bis', format: v => new Date(v).toLocaleDateString(), align: 'left' },
  { name: 'guests', field: row => {
    // Try to parse guests from notes field
    const match = row.notes?.match(/Gäste:\s*(\d+)/);
    return match ? match[1] : '-';
  }, label: 'Personen', align: 'center' },
  { name: 'total_price', field: 'total_price', label: 'Preis', format: v => `€ ${v}`, align: 'right' },
  { name: 'status', field: 'status', label: 'Status', align: 'center' },
  { name: 'actions', label: 'Aktionen', field: 'actions', align: 'center' }
]

const pendingBookings = computed(() => bookings.value.filter(b => b.status === 'pending'))
const confirmedBookings = computed(() => bookings.value.filter(b => ['confirmed', 'completed'].includes(b.status)))
const pendingCount = computed(() => pendingBookings.value.length)

onMounted(async () => {
  await loadBookings()
})

async function loadBookings() {
  try {
    bookings.value = (await api.get('/bookings')).data
    error.value = null
  } catch (err) {
    error.value = err
    // Demo data fallback
    bookings.value = [
      { id: 'd1', guest_name: 'Max Mustermann', Accommodation: { name: 'Demo Apartment Mitte' }, check_in: new Date(), check_out: new Date(), total_price: 150, status: 'pending' },
      { id: 'd2', guest_name: 'Erika Muster', Accommodation: { name: 'Demo Studio Süd' }, check_in: new Date(), check_out: new Date(), total_price: 300, status: 'confirmed' }
    ]
  }
}

async function updateStatus(id, status) {
  try {
    // Optimistic update
    const booking = bookings.value.find(b => b.id === id)
    if (booking) booking.status = status
    
    await api.put(`/bookings/${id}`, { status })
    
    if (status === 'confirmed') {
      try {
        Loading.show({ message: 'Sende Bestätigungs-E-Mail...' })
        await api.post(`/mail/send-confirmation/${id}`)
        Notify.create({ type: 'positive', message: 'Buchung bestätigt und E-Mail gesendet' })
      } catch (e) {
        console.error('Failed to send confirmation email', e)
        Notify.create({ type: 'warning', message: 'Buchung bestätigt, aber E-Mail konnte nicht gesendet werden.' })
      } finally {
        Loading.hide()
      }
    } else {
      Notify.create({ type: 'positive', message: 'Status aktualisiert' })
    }

    await loadBookings() // Reload to be sure
  } catch (err) {
    console.error('Update failed', err)
    Notify.create({ type: 'negative', message: 'Fehler beim Aktualisieren' })
    await loadBookings() // Revert on error
  }
}

function statusColor(s) {
  return { pending: 'orange', confirmed: 'positive', cancelled: 'negative', completed: 'info' }[s] || 'grey'
}
</script>

