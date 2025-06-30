import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (_req) => {
  try {
    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Missing required environment variables')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    // Calculate timestamp for 3 days ago
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
    const cutoffDate = threeDaysAgo.toISOString()

    // Delete old logs
    const { data, error, count } = await supabase
      .from('game_logs')
      .delete()
      .lt('ts', cutoffDate)
      .select('id', { count: 'exact', head: true })

    if (error) {
      throw error
    }

    // Return success response with deletion count
    return new Response(
      JSON.stringify({
        success: true,
        message: `Deleted ${count || 0} log entries older than ${cutoffDate}`,
        deletedCount: count || 0,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    // Return error response
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
