import { createClient } from '@supabase/supabase-js'

let client
export const getSupabase = () => {
  if (!client) {
    const url = process.env.SUPABASE_PROJECT_URL
    const key = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVIDE_ROLE
    
    // Debug: Log environment variables
    console.log('🔍 Debug Supabase ENV:', {
      url: url ? '✅ SET' : '❌ MISSING',
      key: key ? '✅ SET' : '❌ MISSING',
      allEnvKeys: Object.keys(process.env).filter(k => k.includes('SUPABASE'))
    })
    
    if (!url || !key) {
      throw new Error(`Supabase config missing: url=${!!url}, key=${!!key}`)
    }
    
    client = createClient(url, key)
  }
  return client
}
export default getSupabase