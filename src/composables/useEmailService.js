import { ref } from 'vue'
import api from '../services/api.js'

export function useEmailService() {
  const isLoading = ref(false)
  const error = ref(null)
  const success = ref(false)

  // Send contact form email
  const sendContactEmail = async (contactData) => {
    isLoading.value = true
    error.value = null
    success.value = false

    try {
      // Send via backend API
      await api.post('/contact/send', contactData)

      success.value = true
      return { success: true }

    } catch (err) {
      error.value = err.msg || err.message || 'Fehler beim Senden der Nachricht'
      console.error('Contact email error:', err)
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  // Send booking request email
  const sendBookingEmail = async (bookingData) => {
    isLoading.value = true
    error.value = null
    success.value = false

    try {
      // Trigger mail via backend (Microsoft Graph) which also saves to DB
      await api.post('/mail/send-booking', bookingData)

      success.value = true
      return { success: true }

    } catch (err) {
      error.value = err.msg || err.message || 'Fehler beim Senden der Buchungsanfrage'
      console.error('Booking email error:', err)
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  // Reset state
  const resetState = () => {
    isLoading.value = false
    error.value = null
    success.value = false
  }

  return {
    isLoading,
    error,
    success,
    sendContactEmail,
    sendBookingEmail,
    resetState
  }
}