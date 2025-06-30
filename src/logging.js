import { createClient } from '@supabase/supabase-js'
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
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
// In-memory event buffer for offline queueing
const eventBuffer = []
let isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true
let flushTimer = null
// Listen for online/offline events
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    isOnline = true
    flushBuffer()
  })
  window.addEventListener('offline', () => {
    isOnline = false
  })
}
// Flush buffer when events accumulate
function scheduleFlush() {
  if (flushTimer) return
  flushTimer = setTimeout(() => {
    flushTimer = null
    if (isOnline) {
      flushBuffer()
    }
  }, 5000) // Flush every 5 seconds
}
async function flushBuffer() {
  if (eventBuffer.length === 0) return
  if (supabaseUrl === 'https://placeholder.supabase.co') return
  // Copy buffer and clear it
  const eventsToSend = [...eventBuffer]
  eventBuffer.length = 0
  try {
    const eventsWithSession = eventsToSend.map((evt) => ({
      ...evt,
      session_id: SESSION_ID,
    }))
    const { error } = await supabase.from('game_logs').insert(eventsWithSession)
    if (error) {
      // Put events back in buffer on error
      eventBuffer.unshift(...eventsToSend)
      console.debug('Telemetry batch error:', error)
    }
  } catch (error) {
    // Put events back in buffer on error
    eventBuffer.unshift(...eventsToSend)
    console.debug('Telemetry batch error:', error)
  }
}
export async function logEvent(evt) {
  // Skip logging in test environment or if Supabase is not configured
  if (supabaseUrl === 'https://placeholder.supabase.co') {
    return
  }
  // Add to buffer
  eventBuffer.push(evt)
  // Keep buffer size reasonable (max 100 events)
  if (eventBuffer.length > 100) {
    eventBuffer.shift() // Remove oldest event
  }
  // Try to send immediately if online, otherwise schedule flush
  if (isOnline && eventBuffer.length === 1) {
    // Send immediately for first event
    flushBuffer()
  } else {
    // Schedule batch send
    scheduleFlush()
  }
}
