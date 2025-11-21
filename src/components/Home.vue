<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Hero Section -->
    <section class="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-20 sm:py-32 overflow-hidden">
      <!-- Background decoration -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute -top-40 -right-40 w-96 h-96 bg-sky-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
        <div class="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
        <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('/grid-pattern.svg')] opacity-5"></div>
      </div>
      
      <div class="relative container mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
        <div class="inline-block mb-4 px-4 py-1.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-sm font-medium text-sky-200 animate-fade-in-up">
          ✨ Die Nr. 1 für Monteurunterkünfte in Leipzig
        </div>
        <h1 class="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight mb-6 sm:mb-8 leading-tight animate-fade-in-up bg-clip-text text-transparent bg-gradient-to-r from-white via-sky-100 to-indigo-100">
          {{ pageContent.hero_title || $t('hero.title') }}
        </h1>
        <p class="text-lg sm:text-xl md:text-2xl mb-8 sm:mb-12 text-slate-300 max-w-3xl mx-auto leading-relaxed animate-fade-in-up stagger-1">
          {{ pageContent.hero_subtitle || $t('hero.subtitle') }}
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up stagger-2">
          <button 
            @click="$router.push('/buchung')"
            class="group bg-gradient-to-r from-sky-500 to-indigo-500 text-white px-8 py-4 rounded-full font-bold text-lg hover:from-sky-400 hover:to-indigo-400 transition-all shadow-lg shadow-sky-500/20 hover:shadow-sky-500/40 hover:-translate-y-1 flex items-center justify-center gap-2"
          >
            {{ pageContent.hero_cta1 || $t('hero.cta1') }}
            <svg class="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>
          </button>
          <button 
            @click="$router.push('/unterkuenfte')"
            class="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white/20 transition-all hover:-translate-y-1"
          >
            {{ pageContent.hero_cta2 || $t('hero.cta2') }}
          </button>
        </div>
      </div>
    </section>

    <!-- About Section -->
    <section class="py-20 sm:py-24 bg-white relative z-10 -mt-8 rounded-t-[2.5rem]">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div class="max-w-4xl mx-auto text-center mb-16">
          <h2 class="text-3xl sm:text-4xl font-bold text-slate-900 mb-6 fade-in-on-scroll">
            {{ $t('about.title') }}
          </h2>
          <p class="text-lg text-slate-600 leading-relaxed fade-in-on-scroll">
            {{ $t('about.description') }}
          </p>
        </div>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div v-for="(feature, index) in features" :key="feature.id" class="group p-6 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-xl transition-all duration-300 border border-slate-100 fade-in-on-scroll" :class="`stagger-${index + 1}`">
            <div class="w-14 h-14 bg-gradient-to-br from-sky-100 to-indigo-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <svg class="w-7 h-7 text-sky-600" :viewBox="feature.viewBox || '0 0 24 24'" fill="currentColor">
                <path :d="feature.iconPath" />
              </svg>
            </div>
            <h3 class="font-bold text-slate-900 mb-3 text-lg">{{ $t(`about.features.${feature.key}`) }}</h3>
            <p class="text-slate-600 text-sm leading-relaxed">{{ feature.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Featured Accommodations -->
    <section class="py-20 sm:py-24 bg-slate-50">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col sm:flex-row justify-between items-end mb-12 gap-4">
          <div>
            <h2 class="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              {{ $t('accommodations.title') }}
            </h2>
            <p class="text-slate-600 max-w-xl">Entdecken Sie unsere beliebtesten Unterkünfte für Ihren Aufenthalt.</p>
          </div>
          <button 
            @click="$router.push('/unterkuenfte')"
            class="hidden sm:flex items-center text-sky-600 font-semibold hover:text-sky-700 transition-colors group"
          >
            Alle ansehen 
            <svg class="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
          </button>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div 
            v-for="(accommodation, index) in featuredAccommodations" 
            :key="accommodation.id"
            class="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-slate-100 fade-in-on-scroll hover:-translate-y-1"
            :class="`stagger-${index + 1}`"
          >
            <div class="h-56 bg-gray-200 relative overflow-hidden">
              <img 
                v-if="accommodation.image"
                :src="accommodation.image" 
                :alt="accommodation.name"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                @error="handleImgError(accommodation)"
              />
              <div v-else class="w-full h-full flex items-center justify-center text-gray-400 bg-slate-100">
                <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              </div>
              <div class="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-slate-900 px-3 py-1.5 rounded-full text-sm font-bold shadow-sm">
                €{{ accommodation.price }} <span class="text-xs font-normal text-slate-500">/ {{ $t('booking.summary.perNight') }}</span>
              </div>
            </div>
            
            <div class="p-6">
              <h3 class="text-xl font-bold text-slate-900 mb-2">{{ accommodation.name }}</h3>
              <p class="text-slate-600 mb-4 text-sm line-clamp-2">{{ accommodation.description || accommodation.about || '' }}</p>
              
              <div class="flex items-center text-sm text-slate-500 mb-4">
                <svg class="w-4 h-4 mr-2 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                {{ accommodation.capacity }} {{ $t('accommodations.filter.persons') }}
              </div>
              
              <div class="flex flex-wrap gap-2 mb-6">
                <span 
                  v-for="feature in (accommodation.features || []).slice(0, 3)" 
                  :key="feature"
                  class="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-xs font-medium"
                >
                  {{ $t(`accommodations.features.${feature}`) }}
                </span>
                <span v-if="(accommodation.features || []).length > 3" class="text-xs text-slate-400 self-center">+{{ (accommodation.features || []).length - 3 }}</span>
              </div>
              
              <button 
                @click="$router.push(`/unterkunft/${accommodation.id}`)"
                class="w-full bg-gradient-to-r from-slate-800 to-slate-900 text-white py-3 rounded-xl font-semibold hover:from-sky-600 hover:to-indigo-600 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                {{ $t('accommodations.book') }}
              </button>
            </div>
          </div>
        </div>
        
        <div class="text-center mt-12 sm:hidden">
          <button 
            @click="$router.push('/unterkuenfte')"
            class="bg-white border border-slate-200 text-slate-700 px-8 py-3 rounded-xl font-semibold hover:bg-slate-50 transition-colors w-full"
          >
            {{ pageContent.hero_cta2 || $t('hero.cta2') }}
          </button>
        </div>
      </div>
    </section>

    <!-- Trust Elements -->
    <TrustElements class="bg-white py-16" />

    <!-- Map Preview -->
    <section class="py-20 bg-slate-50">
      <div class="container mx-auto px-4">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold text-slate-900 mb-4">
            Standorte in Leipzig
          </h2>
          <p class="text-slate-600">Finden Sie die perfekte Lage für Ihr Team</p>
        </div>
        <div class="rounded-2xl overflow-hidden shadow-xl border border-slate-200">
          <InteractiveMap 
            :center="[51.3397, 12.3731]"
            :zoom="12"
            height="400px"
            :markers="mapMarkers"
          />
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import TrustElements from './TrustElements.vue'
import InteractiveMap from './InteractiveMap.vue'

import { useSEO, seoData } from '../composables/useSEO.js'
import { useStructuredData, structuredDataTemplates } from '../composables/useStructuredData.js'
import { useI18n } from 'vue-i18n'
import { accommodationService, contentService } from '../services/api.js'
import { ref } from 'vue'

export default {
  name: 'Home',
  components: {
    TrustElements,
    InteractiveMap
  },
  setup() {
    const { setPageSEO } = useSEO()
    const { addStructuredData } = useStructuredData()
    const { locale } = useI18n()
    const pageContent = ref({})
    
    // Map markers for accommodations
    const mapMarkers = [
      {
        lat: 51.3397,
        lng: 12.3731,
        popup: '<b>DSK UG Monteurunterkünfte</b><br>Zentrale Lage in Leipzig',
        tooltip: 'Hauptstandort'
      },
      {
        lat: 51.3450,
        lng: 12.3800,
        popup: '<b>Moderne Apartments</b><br>Nähe Stadtzentrum',
        tooltip: 'Apartment-Komplex Nord'
      },
      {
        lat: 51.3350,
        lng: 12.3650,
        popup: '<b>Komfortable Unterkünfte</b><br>Ruhige Wohnlage',
        tooltip: 'Apartment-Komplex Süd'
      }
    ]
    
    return {
      setPageSEO,
      addStructuredData,
      locale,
      mapMarkers,
      pageContent
    }
  },
  mounted() {
    this.initScrollAnimations()
    this.updateSEO()
    this.loadFeatured()
    this.loadContent()
  },
  watch: {
    locale() {
      this.updateSEO()
    }
  },
  beforeUnmount() {
    if (this.observer) {
      this.observer.disconnect()
    }
  },
  methods: {
    async loadContent() {
      try {
        const data = await contentService.getPageContent('home')
        // API returns array of entries for the page. We want section='main'
        const entry = Array.isArray(data) ? data.find(d => d.section === 'main') : data
        if (entry && entry.content) {
          this.pageContent = entry.content
        }
      } catch (e) {
        console.error('Failed to load page content', e)
      }
    },
    updateSEO() {
      const currentSeoData = seoData.home[this.locale] || seoData.home.de
      this.setPageSEO({
        ...currentSeoData,
        canonical: `${window.location.origin}/`,
        ogUrl: `${window.location.origin}/`,
        ogImage: `${window.location.origin}/images/hero-image.jpg`
      })
      
      // Add structured data for homepage
      const structuredData = {
        "@context": "https://schema.org",
        "@graph": [
          structuredDataTemplates.organization,
          structuredDataTemplates.website,
          structuredDataTemplates.lodgingBusiness,
          structuredDataTemplates.localBusiness
        ]
      }
      this.addStructuredData(structuredData)
    },
    initScrollAnimations() {
      // Intersection Observer for scroll animations
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
          }
        })
      }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      })

      // Observe all elements with fade-in-on-scroll class
      this.$nextTick(() => {
        const elements = this.$el.querySelectorAll('.fade-in-on-scroll')
        elements.forEach(el => {
          this.observer.observe(el)
        })
      })
    },
    async loadFeatured() {
      try {
        const res = await accommodationService.getAll({
          isActive: true,
          limit: 3,
          sortBy: 'id',
          sortOrder: 'asc'
        })
        let accommodations = res?.data || []
        this.featuredAccommodations = accommodations.slice(0, 3).map(acc => {
          const normalized = { ...acc }
          if (!normalized.image && Array.isArray(normalized.images) && normalized.images.length > 0) {
            const first = normalized.images[0]
            normalized.image = typeof first === 'string' ? first : (first?.url || '')
          }
          if (normalized.image && !String(normalized.image).startsWith('http')) {
            const baseUrl = import.meta?.env?.VITE_API_URL || 'https://backend-dsk.tripvega.com'
            normalized.image = `${baseUrl}${normalized.image.startsWith('/') ? '' : '/'}${normalized.image}`
          }
          if (!Array.isArray(normalized.features)) {
            normalized.features = []
          }
          return normalized
        })
        this.$nextTick(() => {
          try {
            const elements = this.$el.querySelectorAll('.fade-in-on-scroll')
            elements.forEach(el => {
              if (this.observer) this.observer.observe(el)
              const rect = el.getBoundingClientRect()
              const inView = rect.top < window.innerHeight && rect.bottom > 0
              if (inView) el.classList.add('visible')
            })
          } catch {}
        })
      } catch (e) {
        console.error('❌ Fehler beim Laden der Featured Unterkünfte:', e)
        this.featuredAccommodations = []
      }
    },
    handleImgError(acc) {
      if (acc && typeof acc === 'object') {
        acc.image = ''
      }
    }
  },
  data() {
    return {
      features: [
        { 
          id: 1, 
          key: 'feature1',
          iconPath: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
          description: 'Schnell erreichbar von allen Baustellen' 
        },
        { 
          id: 2, 
          key: 'feature2',
          iconPath: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
          viewBox: '0 0 24 24',
          description: 'Voll ausgestattet für Ihren Komfort' 
        },
        { 
          id: 3, 
          key: 'feature3',
          iconPath: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
          viewBox: '0 0 24 24',
          description: 'Anpassbar an Ihre Projektzeiten' 
        },
        { 
          id: 4, 
          key: 'feature4',
          description: 'Immer für Sie da',
          iconPath: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
          viewBox: '0 0 24 24'
        }
      ],
      featuredAccommodations: []
    }
  }
}
</script>

