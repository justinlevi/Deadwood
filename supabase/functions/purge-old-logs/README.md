# Purge Old Logs Edge Function

This Edge Function automatically deletes game log entries older than 3 days to manage data retention.

## Deployment

```bash
supabase functions deploy purge-old-logs
```

## Scheduling

After deployment, schedule this function to run daily via the Supabase Dashboard:

1. Go to the Supabase Dashboard
2. Navigate to Edge Functions
3. Find `purge-old-logs`
4. Set up a cron schedule: `0 2 * * *` (runs daily at 2 AM UTC)

## Manual Invocation

To run manually:

```bash
curl -X POST https://[PROJECT_REF].supabase.co/functions/v1/purge-old-logs \
  -H "Authorization: Bearer [ANON_KEY]" \
  -H "Content-Type: application/json"
```

## Response

Success:
```json
{
  "success": true,
  "message": "Deleted 150 log entries older than 2025-06-27T02:00:00.000Z",
  "deletedCount": 150
}
```

Error:
```json
{
  "success": false,
  "error": "Error message here"
}
```