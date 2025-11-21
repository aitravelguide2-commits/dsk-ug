<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-lg">
      <div class="text-h4">Unterkünfte</div>
      <q-space />
      <q-btn label="Neue Unterkunft" color="primary" icon="add" @click="$router.push('/accommodations/new')" />
    </div>

    <q-banner v-if="store.demo" rounded class="bg-warning text-dark q-mb-md">
      <template #avatar><q-icon name="info" color="dark"/></template>
      Demodaten werden angezeigt (Backend nicht verbunden).
    </q-banner>
    <q-banner v-else-if="store.error" rounded class="bg-warning text-dark q-mb-md">
      <template #avatar><q-icon name="warning" color="dark"/></template>
      Fehler beim Laden der Daten. Bitte Backend prüfen.
    </q-banner>

    <q-table
      :rows="items"
      :columns="columns"
      row-key="id"
      flat
      bordered
      :loading="!items.length && !store.error"
    >
      <template #body-cell-images="props">
        <q-td>
          <q-img v-if="props.row.images && props.row.images.length" :src="props.row.images[0].url" width="60px" height="40px" fit="cover" class="rounded-borders" />
        </q-td>
      </template>
      <template #body-cell-is_active="props">
        <q-td>
          <q-badge :color="props.row.is_active ? 'positive' : 'negative'">{{ props.row.is_active ? 'Aktiv' : 'Inaktiv' }}</q-badge>
        </q-td>
      </template>
      <template #body-cell-actions="props">
        <q-td class="q-gutter-xs">
          <q-btn flat dense icon="edit" color="primary" @click="$router.push(`/accommodations/${props.row.id}`)" />
          <q-btn flat dense icon="delete" color="negative" @click="remove(props.row.id)" />
        </q-td>
      </template>
    </q-table>
  </q-page>
</template>

<script setup>
import { onMounted, computed } from 'vue'
import { useAccommodations } from '../stores/accommodations.js'

const store = useAccommodations()
onMounted(() => store.fetchAll())

const items = computed(() => store.items)

const columns = [
  { name: 'name', field: 'name', label: 'Name', align: 'left' },
  { name: 'price_per_night', field: 'price_per_night', label: 'Preis/Nacht', format: v => `€ ${v}` },
  { name: 'max_guests', field: 'max_guests', label: 'Gäste' },
  { name: 'images', label: 'Bild' },
  { name: 'is_active', label: 'Status' },
  { name: 'actions', label: '' }
]

const remove = async id => { await store.delete(id) }
</script>
