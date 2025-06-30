import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
)

const SESSION_ID = (() => {
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
  // fire-and-forget
  supabase
    .from('game_logs')
    .insert({ ...evt, session_id: SESSION_ID })
    .throwOnError()
    .then()
}
