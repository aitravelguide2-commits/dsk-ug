<template>
  <div class="min-h-screen bg-white">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center min-h-screen">
      <div class="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
    </div>

    <!-- Not Found State -->
    <div v-else-if="!accommodation" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <h2 class="text-2xl font-bold text-gray-800 mb-4">{{ errorMsg || $t('common.notFound') }}</h2>
        <p class="text-gray-600 mb-6">{{ $t('accommodations.notFoundMessage') }}</p>
        <router-link to="/unterkuenfte" class="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors">
          {{ $t('accommodations.backToList') }}
        </router-link>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center mb-4">
          <button @click="$router.go(-1)" class="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <h1 class="text-3xl font-bold text-gray-900">{{ accommodation.name }}</h1>
        </div>
        
          <div class="flex items-center space-x-4 text-sm text-gray-600">
          <div class="flex items-center">
            <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
            </svg>
            {{ getLocationName(accommodation.location) }}
          </div>
          <div class="flex items-center">
            <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
            </svg>
            {{ accommodation.capacity }} {{ $t('accommodations.persons') }}
          </div>
        </div>
      </div>

      <!-- Image Gallery -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-12 rounded-2xl overflow-hidden">
        <div class="lg:row-span-2">
          <img 
            v-if="accommodation.image"
            :src="accommodation.image" 
            :alt="accommodation.name"
            class="w-full h-96 lg:h-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
            @click="openLightbox(0)"
          />
          <div v-else class="w-full h-96 lg:h-full bg-gray-100 flex items-center justify-center text-gray-500">
            {{ $t('common.notFound') }}
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <template v-if="additionalImages.length">
            <img 
              v-for="(image, index) in additionalImages" 
              :key="index"
              :src="image" 
              :alt="`${accommodation.name} ${index + 1}`"
              class="w-full h-44 object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
              @click="openLightbox(index + 1)"
            />
          </template>
          <div v-else class="col-span-2 w-full h-44 bg-gray-100 flex items-center justify-center text-gray-500">
            {{ $t('common.notFound') }}
          </div>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="grid lg:grid-cols-3 gap-12">
        <!-- Left Column - Details -->
        <div class="lg:col-span-2 space-y-8">
          <!-- Host Info -->
          <div class="border-b border-gray-200 pb-8">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-2xl font-semibold text-gray-900 mb-2">
                  {{ $t('accommodationDetail.title', { location: getLocationName(accommodation.location) }) }}
                </h2>
                <p class="text-gray-600">
                  {{ $t('accommodationDetail.hostLabel') }}: DSK-UG Monteurunterkünfte
                </p>
              </div>
              <div class="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                <span class="text-white font-bold text-lg">D</span>
              </div>
            </div>
          </div>

          <!-- Description -->
          <div class="border-b border-gray-200 pb-8">
            <h3 class="text-xl font-semibold text-gray-900 mb-4">{{ $t('accommodationDetail.about') }}</h3>
            <p class="text-gray-700 leading-relaxed">{{ accommodation.about || accommodation.description }}</p>
          </div>

          <!-- Features -->
          <div class="border-b border-gray-200 pb-8">
            <h3 class="text-xl font-semibold text-gray-900 mb-6">{{ $t('accommodationDetail.featuresTitle') }}</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div 
                v-for="feature in accommodation.features" 
                :key="feature"
                class="flex items-center p-4 bg-gray-50 rounded-xl"
              >
                <span class="text-2xl mr-3" v-html="getFeatureIcon(feature)"></span>
                <span class="text-gray-800 font-medium">{{ $t(`accommodations.features.${feature}`) }}</span>
              </div>
            </div>
          </div>

          <!-- Location -->
          <div class="border-b border-gray-200 pb-8">
            <h3 class="text-xl font-semibold text-gray-900 mb-6">{{ $t('accommodationDetail.whereStay') }}</h3>
            <div class="bg-gray-50 rounded-2xl p-6">
              <div class="mb-4">
                <h4 class="font-semibold text-gray-800 mb-2">{{ getLocationName(accommodation.location) }}</h4>
                <p class="text-gray-600">{{ $t('accommodationDetail.location.subtitle') }}</p>
              </div>
              <InteractiveMap
                :center="getAccommodationLocation(accommodation)"
                :zoom="15"
                :height="'300px'"
                :markers="[getAccommodationMarker(accommodation)]"
                :showDirections="true"
                :showSurroundingsLink="true"
              />
            </div>
          </div>

          <!-- Reviews Section -->
          <div class="border-b border-gray-200 pb-8">
            <div class="flex items-center mb-6">
              <svg class="w-6 h-6 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
              <h3 class="text-xl font-semibold text-gray-900">4.8 · 24 {{ $t('accommodationDetail.reviews.title') }}</h3>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="bg-white border border-gray-200 rounded-xl p-6">
                <div class="flex items-center mb-3">
                  <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                    <span class="text-white font-semibold text-sm">MK</span>
                  </div>
                  <div>
                    <p class="font-semibold text-gray-900">Michael K.</p>
                    <p class="text-sm text-gray-600">{{ $t('common.months.march') }} 2024</p>
                  </div>
                </div>
                <p class="text-gray-700">"{{ $t('accommodationDetail.reviews.sample1') }}"</p>
              </div>
              
              <div class="bg-white border border-gray-200 rounded-xl p-6">
                <div class="flex items-center mb-3">
                  <div class="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-3">
                    <span class="text-white font-semibold text-sm">AS</span>
                  </div>
                  <div>
                    <p class="font-semibold text-gray-900">Andreas S.</p>
                    <p class="text-sm text-gray-600">{{ $t('common.months.february') }} 2024</p>
                  </div>
                </div>
                <p class="text-gray-700">"{{ $t('accommodationDetail.reviews.sample2') }}"</p>
              </div>
            </div>
          </div>

          <!-- House Rules -->
          <div>
            <h3 class="text-xl font-semibold text-gray-900 mb-6">{{ $t('accommodationDetail.houseRules') }}</h3>
            <div class="space-y-4">
              <div class="flex items-center">
                <svg class="w-5 h-5 text-gray-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span class="text-gray-700">{{ $t('accommodationDetail.rules.checkinRange') }}</span>
              </div>
              <div class="flex items-center">
                <svg class="w-5 h-5 text-gray-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span class="text-gray-700">{{ $t('accommodationDetail.rules.checkoutUntil') }}</span>
              </div>
              <div class="flex items-center">
                <svg class="w-5 h-5 text-gray-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728"/>
                </svg>
                <span class="text-gray-700">{{ $t('accommodationDetail.rules.noSmoking') }}</span>
              </div>
              <div class="flex items-center">
                <svg class="w-5 h-5 text-gray-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728"/>
                </svg>
                <span class="text-gray-700">{{ $t('accommodationDetail.rules.noPets') }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column - Booking Card -->
        <div class="lg:col-span-1">
          <div class="sticky top-8">
            <div class="bg-white border border-gray-200 rounded-2xl shadow-xl p-6">
              <div class="flex items-center justify-between mb-6">
                <div>
                  <span class="text-3xl font-bold text-gray-900">€{{ accommodation.price }}</span>
                  <span class="text-gray-600 ml-1">{{ $t('accommodations.perNight') }}</span>
                </div>
                <div class="flex items-center">
                  <svg class="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                  <span class="text-sm font-semibold">4.8</span>
                </div>
              </div>

              <!-- Date Selection -->
              <div class="mb-4">
                <DateRangePicker 
                  :availabilityMap="availabilityMap"
                  :locale="'de-DE'"
                  :minDate="minDatePlusOne"
                  v-model="dateRange"
                  @rangeSelected="onRangeSelected"
                  :labels="{checkin: $t('booking.form.checkin'), checkout: $t('booking.form.checkout'), available: $t('booking.calendar.available'), booked: $t('booking.calendar.booked'), selected: 'Ausgewählt', cancel: $t('common.cancel') || 'Abbrechen', apply: 'Übernehmen'}"
                />
              </div>
              <div class="border border-gray-300 rounded-xl mb-4 p-3">
                <label class="block text-xs font-semibold text-gray-700 mb-1">{{ $t('accommodationDetail.guests') }}</label>
                <select v-model="guests" class="w-full text-sm border-none focus:outline-none">
                  <option v-for="n in accommodation.capacity" :key="n" :value="n">
                    {{ n }} {{ n === 1 ? $t('common.guest') : $t('common.guests') }}
                  </option>
                </select>
              </div>

              <!-- Book Button -->
              <button 
                @click="bookNow"
                :disabled="!checkInDate || !checkOutDate || nights <= 0"
                class="w-full bg-gradient-to-r from-pink-500 to-red-500 text-white py-4 rounded-xl font-semibold text-lg hover:from-pink-600 hover:to-red-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
              >
                {{ $t('accommodations.book') }}
              </button>

              <button 
                type="button"
                @click="openInquiry"
                class="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 mb-2"
              >
                Verfügbarkeit anfragen
              </button>

              <p class="text-center text-sm text-gray-600 mb-4">
                {{ $t('accommodationDetail.notChargedYet') }}
              </p>

              <!-- Price Breakdown -->
              <div v-if="checkInDate && checkOutDate" class="space-y-3 pt-4 border-t border-gray-200">
                <div class="flex justify-between">
                  <span class="text-gray-700">€{{ accommodation.price }} x {{ nights }} {{ $t('booking.summary.nights') }}</span>
                  <span class="text-gray-900">€{{ totalPrice }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-700">{{ $t('accommodationDetail.cleaningFee') }}</span>
                  <span class="text-gray-900">€25</span>
                </div>
                <div class="flex justify-between pt-3 border-t border-gray-200 font-semibold">
                  <span class="text-gray-900">{{ $t('accommodationDetail.total') }}</span>
                  <span class="text-gray-900">€{{ totalPrice + 25 }}</span>
                </div>
              </div>
            </div>

            <!-- Contact Card -->
            <div class="mt-6 bg-gray-50 rounded-2xl p-6">
              <div class="flex items-center mb-4">
                <div class="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mr-4">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                  </svg>
                </div>
                <div>
                  <h4 class="font-semibold text-gray-900">{{ $t('accommodationDetail.questions') }}</h4>
                  <p class="text-sm text-gray-600">{{ $t('accommodationDetail.contactUsDirect') }}</p>
                </div>
              </div>
              <a 
                href="tel:+4915171421923"
                class="block w-full bg-white border border-gray-300 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors text-center"
              >
                +49 151 71421923
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-if="showInquiry" class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Verfügbarkeit anfragen" @click.self="closeInquiry">
    <div class="mx-auto bg-white rounded-2xl shadow-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto mt-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-bold text-gray-900">Verfügbarkeit anfragen</h2>
        <button class="px-3 py-1 rounded hover:bg-gray-100" @click="closeInquiry">Schließen</button>
      </div>
      <div class="space-y-6">
        <div>
          <h3 class="text-lg font-semibold text-gray-800 mb-2">Reisedaten</h3>
          <DateRangePicker 
            :availabilityMap="availabilityMap"
            :locale="'de-DE'"
            :minDate="minDatePlusOne"
            v-model="dateRange"
            @rangeSelected="onRangeSelected"
            :labels="{checkin: $t('booking.form.checkin'), checkout: $t('booking.form.checkout'), available: $t('booking.calendar.available'), booked: $t('booking.calendar.booked'), selected: 'Ausgewählt', cancel: $t('common.cancel') || 'Abbrechen', apply: 'Übernehmen'}"
          />
          <div class="mt-3 grid grid-cols-2 gap-4">
            <div class="border border-gray-300 rounded-xl p-3">
              <label class="block text-xs font-semibold text-gray-700 mb-1">Erwachsene</label>
              <div class="flex items-center justify-between">
                <button class="px-3 py-2 rounded bg-gray-100" @click="decAdults">-</button>
                <div class="text-lg font-semibold">{{ inquiryAdults }}</div>
                <button class="px-3 py-2 rounded bg-gray-100" @click="incAdults">+</button>
              </div>
            </div>
            <div class="border border-gray-300 rounded-xl p-3">
              <label class="block text-xs font-semibold text-gray-700 mb-1">Kinder</label>
              <div class="flex items-center justify-between">
                <button class="px-3 py-2 rounded bg-gray-100" @click="decKids">-</button>
                <div class="text-lg font-semibold">{{ inquiryKids }}</div>
                <button class="px-3 py-2 rounded bg-gray-100" @click="incKids">+</button>
              </div>
            </div>
          </div>
          <div v-if="inquiryNights > 0" class="mt-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200 flex items-center justify-between">
            <div class="text-blue-700 font-semibold">{{ inquiryNights }} {{ inquiryNights === 1 ? 'Nacht' : 'Nächte' }}</div>
            <div class="text-2xl font-bold text-blue-600">€{{ inquiryTotalPrice }}</div>
          </div>
        </div>
        <div>
          <h3 class="text-lg font-semibold text-gray-800 mb-2">Deine Daten</h3>
          <div class="grid md:grid-cols-2 gap-4">
            <input type="text" v-model="inquiry.firstName" placeholder="Vorname" class="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 bg-white" />
            <input type="text" v-model="inquiry.lastName" placeholder="Nachname" class="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 bg-white" />
            <input type="email" v-model="inquiry.email" placeholder="E-Mail" class="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 bg-white" />
            <input type="tel" v-model="inquiry.phone" placeholder="Telefon (optional)" class="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 bg-white" />
          </div>
          <textarea rows="3" v-model="inquiry.message" placeholder="Haben Sie besondere Wünsche oder Anforderungen?" class="mt-3 w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 bg-white"></textarea>
        </div>
        <div>
          <h3 class="text-lg font-semibold text-gray-800 mb-2">Zusammenfassung</h3>
          <div class="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-1">
            <div class="font-semibold">Unterkunft: {{ accommodation.name }}</div>
            <div>Datum: {{ new Date(dateRange.checkin).toLocaleDateString('de-DE') }} – {{ new Date(dateRange.checkout).toLocaleDateString('de-DE') }} · {{ inquiryNights }} {{ inquiryNights === 1 ? 'Nacht' : 'Nächte' }}</div>
            <div>Gäste: {{ inquiryAdults }} Erwachsene, {{ inquiryKids }} Kinder</div>
            <div class="font-semibold">Preis: €{{ inquiryTotalPrice }}</div>
            <label class="mt-2 inline-flex items-center">
              <input type="checkbox" v-model="inquiryAcceptedPrivacy" class="mr-2">
              <span>Ich akzeptiere die DSGVO-Bedingungen</span>
            </label>
          </div>
        </div>
        <div>
          <button 
            :disabled="!inquiryFormValid || inquirySubmitting"
            @click="submitInquiry"
            class="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Kostenlos & unverbindlich anfragen
          </button>
          <div v-if="inquiryError" class="mt-2 text-red-600 text-sm">{{ inquiryError }}</div>
        </div>
        <div v-if="inquirySuccess" class="mt-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-xl">
          <div class="font-semibold">Vielen Dank! Wir melden uns innerhalb von 24 h bei Ihnen.</div>
          <div class="mt-3 grid grid-cols-2 gap-3">
            <router-link to="/unterkuenfte" class="text-center px-3 py-2 rounded bg-green-600 text-white hover:bg-green-700">Weitere Unterkünfte ansehen</router-link>
            <button class="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200" @click="closeInquiry">Zurück zur Unterkunft</button>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="md:hidden fixed bottom-4 left-0 right-0 px-4 z-40">
    <button @click="openInquiry" class="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-semibold text-lg shadow-lg">Verfügbarkeit anfragen</button>
  </div>
</template>

<Lightbox :show="showLightbox" :images="imagesAll" :startIndex="lightboxIndex" @close="closeLightbox"/>

<script>
import InteractiveMap from './InteractiveMap.vue'
import DateRangePicker from './DateRangePicker.vue'
import Lightbox from './Lightbox.vue'
import { accommodationService } from '../services/api.js'
import { useEmailService } from '../composables/useEmailService.js'

export default {
  name: 'AccommodationDetail',
  components: {
    InteractiveMap,
    DateRangePicker,
    Lightbox
  },
  setup() {
    const emailService = useEmailService()
    return { emailService }
  },
  data() {
    return {
      accommodation: null,
      loading: true,
      checkInDate: '',
      checkOutDate: '',
      guests: 1,
      additionalImages: [],
      availabilityMap: {},
      dateRange: { checkin: '', checkout: '' },
      errorMsg: '',
      showLightbox: false,
      lightboxIndex: 0
      ,
      rangeObserver: null,
      showInquiry: false,
      inquiry: { firstName: '', lastName: '', email: '', phone: '', message: '' },
      inquiryAdults: 2,
      inquiryKids: 0,
      inquiryAcceptedPrivacy: false,
      inquirySubmitting: false,
      inquiryError: '',
      inquirySuccess: false
    }
  },
  computed: {
    minDate() {
      return new Date().toISOString().split('T')[0]
    },
    minDatePlusOne() {
      const d = new Date()
      d.setDate(d.getDate() + 1)
      return d.toISOString().split('T')[0]
    },
    minCheckOutDate() {
      if (!this.checkInDate) return this.minDate
      const checkIn = new Date(this.checkInDate)
      checkIn.setDate(checkIn.getDate() + 1)
      return checkIn.toISOString().split('T')[0]
    },
    nights() {
      if (!this.checkInDate || !this.checkOutDate) return 0
      const checkIn = new Date(this.checkInDate)
      const checkOut = new Date(this.checkOutDate)
      const diffTime = checkOut.getTime() - checkIn.getTime()
      if (diffTime <= 0) return 0
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    },
    totalPrice() {
      return this.nights * (this.accommodation?.price || 0)
    },
    imagesAll() {
      const first = this.accommodation?.image ? [this.accommodation.image] : []
      return [...first, ...(this.additionalImages || [])]
    },
    inquiryNights() {
      try {
        if (!this.dateRange.checkin || !this.dateRange.checkout) return 0
        const ci = new Date(this.dateRange.checkin)
        const co = new Date(this.dateRange.checkout)
        const diff = co.getTime() - ci.getTime()
        if (diff <= 0) return 0
        return Math.ceil(diff / (1000 * 60 * 60 * 24))
      } catch { return 0 }
    },
    inquiryTotalPrice() {
      const p = this.accommodation?.price || 0
      return this.inquiryNights > 0 ? p * this.inquiryNights : 0
    },
    inquiryGuestsTotal() {
      return (this.inquiryAdults || 0) + (this.inquiryKids || 0)
    },
    inquiryFormValid() {
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.inquiry.email)
      const namesOk = !!this.inquiry.firstName && !!this.inquiry.lastName
      const datesOk = !!this.dateRange.checkin && !!this.dateRange.checkout && this.inquiryNights > 0 && this.inquiryNights <= 30
      const privacyOk = !!this.inquiryAcceptedPrivacy
      return emailOk && namesOk && datesOk && privacyOk && this.inquiryGuestsTotal > 0
    }
  },
  mounted() {
    this.loadAccommodation()
    this.$nextTick(() => {
      this.attachRangeObserver()
      this.syncDatesFromSummary()
    })
  },
  watch: {
    '$route'() {
      this.loadAccommodation()
    },
    dateRange: {
      deep: true,
      handler(v) {
        const ci = this.normalizeDateStr(v?.checkin || '')
        const co = this.normalizeDateStr(v?.checkout || '')
        if (ci) this.checkInDate = ci
        if (co) this.checkOutDate = co
      }
    },
    checkInDate(newVal) {
      if (!newVal) return
      const min = this.minDate
      const nv = this.normalizeDateStr(newVal)
      if (nv < min) {
        this.checkInDate = min
      }
      if (this.checkOutDate) {
        const minOut = this.minCheckOutDate
        const co = this.normalizeDateStr(this.checkOutDate)
        if (co < minOut) {
          this.checkOutDate = minOut
        }
      }
    },
    checkOutDate(newVal) {
      if (!newVal) return
      const minOut = this.minCheckOutDate
      const nv = this.normalizeDateStr(newVal)
      if (nv < minOut) {
        this.checkOutDate = minOut
      }
    }
  },
  beforeUnmount() {
    try { this.rangeObserver && this.rangeObserver.disconnect() } catch {}
  },
  methods: {
    openInquiry() {
      this.inquiryError = ''
      this.inquirySuccess = false
      this.showInquiry = true
      document.body.style.overflow = 'hidden'
    },
    closeInquiry() {
      this.showInquiry = false
      document.body.style.overflow = ''
    },
    async loadAccommodation() {
      try {
        this.loading = true
        const raw = String(this.$route.params.id || '')
        const id = parseInt(raw.replace(/[^0-9]/g, ''))
        if (!Number.isInteger(id) || id <= 0) {
          this.errorMsg = this.$t('common.notFound') + ` (Ungültige ID: "${raw}")`
          this.accommodation = null
          return
        }
        const res = await accommodationService.getById(id)
        const data = res.data
        this.accommodation = data
        this.additionalImages = (data.images || []).filter(u => u !== data.image)
        this.guests = 1
        this.updateSEO()
        await this.loadAvailability()
      } catch (e) {
        const status = e?.status || e?.code || ''
        const msg = e?.msg || e?.message || ''
        this.errorMsg = `${this.$t('common.notFound')} ${status ? `(Status ${status})` : ''} ${msg ? `– ${msg}` : ''}`.trim()
        this.accommodation = null
      } finally {
        this.loading = false
      }
    },
    async loadAvailability() {
      if (!this.accommodation?.id) return
      try {
        const today = new Date()
        const startDate = today.toISOString().slice(0, 10)
        const end = new Date(today)
        end.setDate(end.getDate() + 60)
        const endDate = end.toISOString().slice(0, 10)
        const res = await accommodationService.checkAvailability(this.accommodation.id, startDate, endDate)
        const days = res?.data?.availability || []
        const map = {}
        days.forEach(d => { map[d.date] = d.isAvailable })
        this.availabilityMap = map
      } catch (e) {
        this.availabilityMap = {}
      }
    },
    
    updateSEO() {
      if (this.accommodation) {
        document.title = `${this.accommodation.name} - DSK UG Monteurunterkünfte Leipzig`
        const metaDescription = document.querySelector('meta[name="description"]')
        if (metaDescription) {
          metaDescription.setAttribute('content', (this.accommodation.about || this.accommodation.description || '').slice(0, 160))
        }
      }
    },
    
    getLocationName(loc) {
      if (!loc) return ''
      const key = 'locations.' + this.computeLocationKey(loc)
      const trans = this.$t(key)
      return trans === key ? loc : trans
    },
    
    getFeatureIcon(feature) {
      const icons = {
        wifi: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.07 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/></svg>',
        kitchen: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2.01L6 2c-1.1 0-2 .89-2 2v16c0 1.11.89 2 2 2h12c1.1 0 2-.89 2-2V4c0-1.11-.89-1.99-2-1.99zM18 20H6v-9.02h12V20zm0-11H6V4h12v5zM8 5h2v3H8zm3 0h2v3h-2z"/></svg>',
        parking: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M13 3H6v18h4v-6h3c3.31 0 6-2.69 6-6s-2.69-6-6-6zm.2 8H10V7h3.2c1.1 0 2 .9 2 2s-.9 2-2 2z"/></svg>',
        tv: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5l-1 1v2h8v-2l-1-1h5c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 12H3V5h18v10z"/></svg>',
        washing_machine: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2.01L6 2c-1.1 0-2 .89-2 2v16c0 1.11.89 2 2 2h12c1.1 0 2-.89 2-2V4c0-1.11-.89-1.99-2-1.99zM18 20H6V4h12v16zM12 6c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 8c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"/></svg>',
        balcony: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M10 10v2H8v-2h2zm6 2v-2h2v2h-2zm-3 0V8h-2v4h2zm-1-9L2 8v13h20V8l-10-5zM4.5 19v-7.5h15V19h-15z"/></svg>',
        bathroom: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20 13V4.83C20 3.27 18.73 2 17.17 2c-.75 0-1.47.3-2 .83l-1.25 1.25c-.16-.05-.33-.08-.5-.08-.85 0-1.63.42-2.12 1.09l-.63-.63C10.13 3.92 9.59 3.67 9 3.67c-1.84 0-3.33 1.49-3.33 3.33 0 .17.02.34.05.5L2.5 10.75c-.5.5-.5 1.3 0 1.8l1.7 1.7c.5.5 1.3.5 1.8 0l3.25-3.25c.16.03.33.05.5.05 1.84 0 3.33-1.49 3.33-3.33 0-.59-.15-1.14-.42-1.63l.63-.63c.2-.2.45-.31.71-.31.26 0 .51.11.71.31l1.25 1.25c.5.5 1.3.5 1.8 0 .5-.5.5-1.3 0-1.8l-1.25-1.25c.16-.05.33-.08.5-.08.28 0 .5.22.5.5v8.17c0 1.1.9 2 2 2s2-.9 2-2zM4.2 12.55l-1.7-1.7 3.25-3.25.85.85-2.4 4.1z"/></svg>',
        private_bathroom: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20 13V4.83C20 3.27 18.73 2 17.17 2c-.75 0-1.47.3-2 .83l-1.25 1.25c-.16-.05-.33-.08-.5-.08-.85 0-1.63.42-2.12 1.09l-.63-.63C10.13 3.92 9.59 3.67 9 3.67c-1.84 0-3.33 1.49-3.33 3.33 0 .17.02.34.05.5L2.5 10.75c-.5.5-.5 1.3 0 1.8l1.7 1.7c.5.5 1.3.5 1.8 0l3.25-3.25c.16.03.33.05.5.05 1.84 0 3.33-1.49 3.33-3.33 0-.59-.15-1.14-.42-1.63l.63-.63c.2-.2.45-.31.71-.31.26 0 .51.11.71.31l1.25 1.25c.5.5 1.3.5 1.8 0 .5-.5.5-1.3 0-1.8l-1.25-1.25c.16-.05.33-.08.5-.08.28 0 .5.22.5.5v8.17c0 1.1.9 2 2 2s2-.9 2-2zM4.2 12.55l-1.7-1.7 3.25-3.25.85.85-2.4 4.1z"/></svg>'
      }
      return icons[feature] || '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>'
    },
    
    getAccommodationLocation(accommodation) {
      const key = String(accommodation.location || '').toLowerCase()
      if (!key) return [51.3397, 12.3731]
      if (key.includes('zentrum')) return [51.3397, 12.3731]
      if (key.includes('nord')) return [51.3600, 12.3700]
      if (key.includes('süd') || key.includes('sued')) return [51.3200, 12.3800]
      if (key.includes('ost')) return [51.3400, 12.4000]
      if (key.includes('west')) return [51.3400, 12.3400]
      if (key.includes('connewitz')) return [51.3090, 12.3690]
      return [51.3397, 12.3731]
    },
    computeLocationKey(loc) {
      const s = String(loc || '').trim().toLowerCase()
      const mapUml = (x) => x
        .replace(/ä/g, 'ae')
        .replace(/ö/g, 'oe')
        .replace(/ü/g, 'ue')
        .replace(/ß/g, 'ss')
      return mapUml(s)
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/--+/g, '-')
        .replace(/^-|-$|/g, '')
    },
    
    getAccommodationMarker(accommodation) {
      const [lat, lng] = this.getAccommodationLocation(accommodation)
      return {
        lat,
        lng,
        popup: `<strong>${accommodation.name}</strong><br>${this.getLocationName(accommodation.location)}<br>${accommodation.price}€ ${this.$t('accommodations.perNight')}`,
        tooltip: accommodation.name
      }
    },
    
    openImageModal() {
      this.openLightbox(0)
    },
    openLightbox(idx) {
      this.lightboxIndex = idx
      this.showLightbox = true
    },
    closeLightbox() { this.showLightbox = false },
    onRangeSelected(range) {
      this.checkInDate = this.normalizeDateStr(range.checkin)
      this.checkOutDate = this.normalizeDateStr(range.checkout)
    },
    normalizeDateStr(val) {
      if (!val) return ''
      // Accept ISO (YYYY-MM-DD) as-is
      if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val
      // Convert common DE format DD.MM.YYYY to ISO
      const m = val.match(/^([0-3]?\d)\.([0-1]?\d)\.(\d{4})$/)
      if (m) {
        const dd = m[1].padStart(2, '0')
        const mm = m[2].padStart(2, '0')
        const yyyy = m[3]
        return `${yyyy}-${mm}-${dd}`
      }
      // Fallback: try Date parsing
      const d = new Date(val)
      if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10)
      return ''
    },
    attachRangeObserver() {
      try {
        const obs = new MutationObserver(() => {
          this.syncDatesFromSummary()
        })
        obs.observe(this.$el, { subtree: true, childList: true, attributes: true })
        this.rangeObserver = obs
      } catch {}
    },
    syncDatesFromSummary() {
      try {
        const el = this.$el.querySelector('[data-range-summary="true"]')
        if (!el) return
        const ci = this.normalizeDateStr(el.getAttribute('data-checkin') || '')
        const co = this.normalizeDateStr(el.getAttribute('data-checkout') || '')
        if (ci) this.checkInDate = ci
        if (co) this.checkOutDate = co
      } catch {}
    },
    
    bookNow() {
      if (!this.checkInDate || !this.checkOutDate) {
        alert(this.$t('accommodationDetail.validation.selectDates'))
        return
      }
      
      // Navigate to booking page with pre-filled data
      this.$router.push({
        path: '/buchung',
        query: {
          accommodationId: this.accommodation.id,
          checkIn: this.checkInDate,
          checkOut: this.checkOutDate,
          guests: this.guests
        }
      })
    },
    async submitInquiry() {
      if (!this.inquiryFormValid || !this.accommodation) return
      this.inquirySubmitting = true
      this.emailService.resetState()
      this.inquiryError = ''
      try {
        const payload = {
          accommodationId: this.accommodation.id,
          accommodationName: this.accommodation.name,
          guestName: `${this.inquiry.firstName} ${this.inquiry.lastName}`.trim(),
          guestEmail: this.inquiry.email,
          guestPhone: this.inquiry.phone,
          checkIn: this.dateRange.checkin,
          checkOut: this.dateRange.checkout,
          guests: this.inquiryGuestsTotal,
          totalPrice: this.inquiryTotalPrice,
          specialRequests: this.inquiry.message
        }
        const res = await this.emailService.sendBookingEmail(payload)
        if (!res.success) throw new Error('Fehler beim Senden der Buchungsanfrage')
        this.inquirySuccess = true
      } catch (e) {
        this.inquiryError = e?.message || 'Es ist ein Fehler aufgetreten.'
      } finally {
        this.inquirySubmitting = false
      }
    },
    incAdults() { if (this.inquiryAdults < 10) this.inquiryAdults++ },
    decAdults() { if (this.inquiryAdults > 1) this.inquiryAdults-- },
    incKids() { if (this.inquiryKids < 10) this.inquiryKids++ },
    decKids() { if (this.inquiryKids > 0) this.inquiryKids-- }
  }
}
</script>

<style scoped>
/* Custom styles for enhanced Airbnb-like experience */
.sticky {
  position: sticky;
}

/* Smooth transitions for interactive elements */
.transition-transform {
  transition: transform 0.3s ease;
}

.transition-colors {
  transition: color 0.2s ease, background-color 0.2s ease;
}

.transition-all {
  transition: all 0.2s ease;
}

/* Hover effects */
.hover\:scale-105:hover {
  transform: scale(1.05);
}

.hover\:bg-gray-100:hover {
  background-color: #f3f4f6;
}

.hover\:bg-gray-50:hover {
  background-color: #f9fafb;
}

.hover\:bg-blue-700:hover {
  background-color: #1d4ed8;
}

.hover\:from-pink-600:hover {
  background-image: linear-gradient(to right, #db2777, #dc2626);
}

.hover\:to-red-600:hover {
  background-image: linear-gradient(to right, #db2777, #dc2626);
}

/* Gradient backgrounds */
.bg-gradient-to-r {
  background-image: linear-gradient(to right, var(--tw-gradient-stops));
}

.from-blue-500 {
  --tw-gradient-from: #3b82f6;
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(59, 130, 246, 0));
}

.to-indigo-500 {
  --tw-gradient-to: #6366f1;
}

.from-pink-500 {
  --tw-gradient-from: #ec4899;
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(236, 72, 153, 0));
}

.to-red-500 {
  --tw-gradient-to: #ef4444;
}

/* Animation for loading spinner */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* Custom scrollbar for better UX */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Focus styles for accessibility */
input:focus,
select:focus,
button:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .lg\:grid-cols-2 {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }
  
  .lg\:col-span-2 {
    grid-column: span 1 / span 1;
  }
  
  .lg\:row-span-2 {
    grid-row: span 1 / span 1;
  }
  
  .lg\:h-full {
    height: 24rem;
  }
}

/* Enhanced shadow for booking card */
.shadow-xl {
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

/* Disabled state styling */
.disabled\:opacity-50:disabled {
  opacity: 0.5;
}

.disabled\:cursor-not-allowed:disabled {
  cursor: not-allowed;
}
</style>
    async loadAvailability() {
      if (!this.accommodation?.id) return
      try {
        const today = new Date()
        const startDate = today.toISOString().slice(0, 10)
        const end = new Date(today)
        end.setDate(end.getDate() + 60)
        const endDate = end.toISOString().slice(0, 10)
        const res = await accommodationService.checkAvailability(this.accommodation.id, startDate, endDate)
        const days = res?.data?.availability || []
        const map = {}
        days.forEach(d => { map[d.date] = d.isAvailable })
        this.availabilityMap = map
      } catch (e) {
        this.availabilityMap = {}
      }
    },
    onRangeSelected(range) {
      this.checkInDate = range.checkin
      this.checkOutDate = range.checkout
    },
