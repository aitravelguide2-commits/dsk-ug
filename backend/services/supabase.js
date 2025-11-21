import { createClient } from '@supabase/supabase-js'

let client
export const getSupabase = () => {
  if (!client) {
    const url = process.env.SUPABASE_PROJECT_URL
    const key = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVIDE_ROLE
    
    // Debug: Log environment variables
    if (!url || !key) {
      console.error('❌ Supabase config missing in getSupabase!', {
        url: !!url,
        key: !!key,
        envKeys: Object.keys(process.env).filter(k => k.includes('SUPABASE'))
      })
      // Return a dummy client that throws informative errors when used
      return {
        from: () => ({ select: () => Promise.reject(new Error('Supabase not configured')) }),
        auth: { getUser: () => Promise.reject(new Error('Supabase not configured')) }
      }
    }
    
    try {
      client = createClient(url, key)
    } catch (err) {
      console.error('❌ Error creating Supabase client:', err)
      throw err
    }
  }
  return client
}
export default getSupabase