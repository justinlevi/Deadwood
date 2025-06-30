# Incremental Supabase Telemetry Implementation

## Summary
- ✅ Step 1: Environment configuration - Added Supabase URL and anon key to .env files
- ✅ Step 2: Database schema - Created migration for game_logs table with RLS policies
- ✅ Step 3: Dependencies - Installed @supabase/supabase-js client library
- ✅ Step 4: Logging utility - Created src/logging.ts with session management and logEvent function
- ✅ Step 5: Game instrumentation - Added telemetry logging to all game actions and events
- ✅ Step 6: Buffer & retry - Implemented offline queue with automatic retry on reconnection
- ✅ Step 7: Data retention - Created Supabase Edge Function for automated log cleanup

## Telemetry Events Captured
- `game_started` - When a new game begins (includes player count, AI difficulty, character selections)
- `move` - Player movement actions (from/to positions, cost, AI flag)
- `claim` - Influence claim actions (location, amount claimed, requested amount)
- `challenge` - Challenge actions (target player, position, cost)
- `rest` - Rest actions (gold gained)
- `game_over` - When game ends (winner, final scores for all players)

## Features Implemented
1. **Session Management** - Unique session ID per browser tab stored in sessionStorage
2. **Offline Support** - Events are buffered when offline and sent when connection restored
3. **Batch Sending** - Events are batched every 5 seconds to reduce API calls
4. **Buffer Limits** - Maximum 100 events in buffer to prevent memory issues
5. **Error Handling** - Graceful error handling that doesn't disrupt gameplay
6. **Data Retention** - Edge Function to automatically delete logs older than 3 days

## Testing
All unit tests pass. The telemetry system gracefully handles test environments where Supabase is not configured.

## Deployment Steps
1. Apply the migration file to the Supabase project:
   ```bash
   supabase db push
   ```
2. Deploy the Edge Function:
   ```bash
   supabase functions deploy purge-old-logs
   ```
3. Schedule the Edge Function to run daily in Supabase Dashboard (cron: `0 2 * * *`)
4. Ensure .env file with actual anon key is configured (not committed)

## Implementation Details
- Events use NDJSON format (one JSON object per line)
- Fire-and-forget pattern ensures gameplay is never blocked
- Test environment automatically skips telemetry to avoid test pollution
- Online/offline detection with automatic buffer flushing
- Service worker compatible (uses sessionStorage and navigator.onLine)