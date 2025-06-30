import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key'

const supabase = createClient(supabaseUrl, supabaseKey)

const SESSION_ID = (() => {
  // Check if we're in a browser environment
  if (typeof sessionStorage === 'undefined') {
    // In test environment, use a simple UUID fallback
    return 'test-session-' + Math.random().toString(36).substr(2, 9)
  }
  
  const k = 'dw-session'
  let v = sessionStorage.getItem(k)
  if (!v) {
    v = crypto.randomUUID()
    sessionStorage.setItem(k, v)
  }
  return v
})()

type Insert = {
  session_id: string
  ts: string
  event_type: string
  round?: number
  player_id?: string
  data: Record<string, unknown>
}

export async function logEvent(evt: Omit<Insert, 'id' | 'session_id'>) {
  // Skip logging in test environment or if Supabase is not configured
  if (supabaseUrl === 'https://placeholder.supabase.co') {
    return
  }
  
  // fire-and-forget
  supabase
    .from('game_logs')
    .insert({ ...evt, session_id: SESSION_ID })
    .throwOnError()
    .then()
    .catch((error) => {
      // Silently catch errors to not disrupt gameplay
      console.debug('Telemetry error:', error)
    })
}
