<template>
  <header class="bg-white/90 backdrop-blur-lg shadow-sm sticky top-0 z-50 transition-all duration-300 border-b border-slate-100" :class="{ 'bg-white/95 shadow-md': scrolled }">
    <div class="container mx-auto px-4 py-4">
      <div class="flex justify-between items-center">
        <!-- Logo -->
        <router-link to="/" class="flex items-center space-x-3 group">
          <div class="w-12 h-12 bg-gradient-to-br from-sky-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-105">
            <svg class="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
            </svg>
          </div>
          <div>
            <h1 class="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent group-hover:from-sky-600 group-hover:to-indigo-600 transition-all duration-300">DSK-UG</h1>
            <p class="text-xs text-slate-500">Monteurunterkünfte</p>
          </div>
        </router-link>

        <!-- Navigation -->
        <nav class="hidden md:flex space-x-1">
          <router-link 
            v-for="item in navItems" 
            :key="item.key"
            :to="item.path" 
            class="relative text-slate-600 hover:text-sky-600 font-medium transition-all duration-300 py-2 px-4 rounded-lg hover:bg-sky-50 group"
            active-class="text-sky-600 bg-sky-50"
          >
            {{ $t(`nav.${item.key}`) }}
          </router-link>
        </nav>

        <!-- Right Side Actions -->
        <div class="flex items-center space-x-4">
          <!-- CTA Button -->
          <router-link 
            to="/buchung" 
            class="hidden sm:inline-flex bg-gradient-to-r from-sky-500 to-indigo-500 text-white px-6 py-2.5 rounded-full font-semibold text-sm hover:from-sky-400 hover:to-indigo-400 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
          >
            {{ $t('hero.cta1') }}
          </router-link>

          <!-- Language Switcher -->
          <div class="relative">
            <button 
              @click="toggleLanguageDropdown"
              class="flex items-center space-x-2 border border-slate-200 rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 hover:border-sky-300 hover:bg-sky-50 transition-all duration-300 bg-white"
            >
              <img :src="getCurrentFlag()" :alt="currentLocale" class="w-5 h-4 object-cover rounded-sm" />
              <span class="font-medium text-slate-700">{{ currentLocale.toUpperCase() }}</span>
              <svg class="w-4 h-4 transition-transform duration-200 text-slate-500" :class="{ 'rotate-180': languageDropdownOpen }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>
            
            <!-- Language Dropdown -->
            <div 
              v-if="languageDropdownOpen" 
              class="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-fade-in"
            >
              <button
                v-for="lang in languages"
                :key="lang.code"
                @click="selectLanguage(lang.code)"
                class="w-full flex items-center space-x-3 px-4 py-2.5 text-sm hover:bg-sky-50 transition-colors duration-200"
                :class="{ 'bg-sky-50 text-sky-600 font-semibold': currentLocale === lang.code }"
              >
                <img :src="lang.flag" :alt="lang.code" class="w-5 h-4 object-cover rounded-sm" />
                <span>{{ lang.name }}</span>
              </button>
            </div>
          </div>

          <!-- Mobile menu button -->
          <button 
            @click="toggleMobileMenu" 
            class="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors duration-200"
          >
            <svg class="w-6 h-6 text-slate-600 transition-transform duration-300" :class="{ 'rotate-90': mobileMenuOpen }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path v-if="!mobileMenuOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
              <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </div>

      <!-- Mobile Navigation -->
      <transition name="mobile-menu">
        <div v-if="mobileMenuOpen" class="md:hidden mt-4 pb-4 border-t border-slate-100">
          <nav class="flex flex-col space-y-1 pt-4">
            <router-link 
              v-for="item in navItems" 
              :key="item.key"
              :to="item.path" 
              @click="mobileMenuOpen = false"
              class="text-slate-600 hover:text-sky-600 hover:bg-sky-50 font-medium py-3 px-4 rounded-xl transition-all duration-200"
              active-class="text-sky-600 bg-sky-50 font-semibold"
            >
              {{ $t(`nav.${item.key}`) }}
            </router-link>
            
            <!-- Mobile CTA -->
            <router-link 
              to="/buchung" 
              @click="mobileMenuOpen = false"
              class="bg-gradient-to-r from-sky-500 to-indigo-500 text-white px-4 py-3 rounded-full font-semibold text-center mt-4 hover:from-sky-400 hover:to-indigo-400 transition-all duration-300 shadow-md"
            >
              {{ $t('hero.cta1') }}
            </router-link>
          </nav>
        </div>
      </transition>
    </div>
  </header>
</template>

<script>
import { useI18n } from 'vue-i18n'
import deFlag from '../assets/flags/de.svg'
import enFlag from '../assets/flags/en.svg'
import plFlag from '../assets/flags/pl.svg'
import roFlag from '../assets/flags/ro.svg'
import ruFlag from '../assets/flags/ru.svg'
import ukFlag from '../assets/flags/uk.svg'

export default {
  name: 'Header',
  setup() {
    const { locale } = useI18n()
    return { locale }
  },
  data() {
    return {
      mobileMenuOpen: false,
      languageDropdownOpen: false,
      scrolled: false,
      currentLocale: 'de',
      languages: [
        { code: 'de', name: 'Deutsch', flag: deFlag },
        { code: 'en', name: 'English', flag: enFlag },
        { code: 'pl', name: 'Polski', flag: plFlag },
        { code: 'ro', name: 'Română', flag: roFlag },
        { code: 'ru', name: 'Русский', flag: ruFlag },
        { code: 'uk', name: 'Українська', flag: ukFlag }
      ],
      navItems: [
        { key: 'home', path: '/' },
        { key: 'accommodations', path: '/unterkuenfte' },
        { key: 'booking', path: '/buchung' },
        { key: 'about', path: '/ueber-uns' },
        { key: 'contact', path: '/kontakt' },
        { key: 'faq', path: '/faq' }
      ]
    }
  },
  mounted() {
    this.currentLocale = this.locale
    this.handleScroll()
    window.addEventListener('scroll', this.handleScroll)
    document.addEventListener('click', this.handleClickOutside)
  },
  beforeUnmount() {
    window.removeEventListener('scroll', this.handleScroll)
    document.removeEventListener('click', this.handleClickOutside)
  },
  methods: {
    toggleMobileMenu() {
      this.mobileMenuOpen = !this.mobileMenuOpen
    },
    toggleLanguageDropdown() {
      this.languageDropdownOpen = !this.languageDropdownOpen
    },
    selectLanguage(langCode) {
      this.currentLocale = langCode
      this.locale = langCode
      this.languageDropdownOpen = false
    },
    changeLanguage() {
      this.locale = this.currentLocale
    },
    getCurrentFlag() {
      const lang = this.languages.find(l => l.code === this.currentLocale)
      return lang ? lang.flag : deFlag
    },
    handleScroll() {
      this.scrolled = window.scrollY > 50
    },
    handleClickOutside(event) {
      if (!event.target.closest('.relative')) {
        this.languageDropdownOpen = false
      }
    }
  }
}
</script>

<style scoped>
/* Mobile menu transitions */
.mobile-menu-enter-active,
.mobile-menu-leave-active {
  transition: all 0.3s ease;
}

.mobile-menu-enter-from,
.mobile-menu-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Language dropdown animation */
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(-10px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.animate-fade-in {
  animation: fade-in 0.2s ease-out;
}

/* Glassmorphism backdrop support */
@supports (backdrop-filter: blur(10px)) {
  .backdrop-blur-md {
    backdrop-filter: blur(12px);
  }
  .backdrop-blur-sm {
    backdrop-filter: blur(4px);
  }
}

/* Hover effects for navigation underline */
.group:hover .group-hover\:w-full {
  width: 100%;
}

/* Smooth scroll behavior - verhindert beim Neuladen */
html {
  scroll-behavior: smooth;
}

html:not(:target) {
  scroll-behavior: auto;
}
</style>
