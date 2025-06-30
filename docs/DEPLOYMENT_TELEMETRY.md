# Deploying Telemetry with GitHub Actions

## Overview

When deploying to GitHub Pages via GitHub Actions, environment variables need to be injected at build time since GitHub Pages only hosts static files.

## Setup Steps

### 1. Add GitHub Secrets

In your GitHub repository settings:

1. Go to Settings → Secrets and variables → Actions
2. Add these repository secrets:
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key (safe for client-side)

### 2. Update GitHub Actions Workflow

Modify your `.github/workflows/deploy.yml` (or similar) to inject the environment variables during build:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Build with environment variables
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
        run: npm run build

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### 3. Optional: Telemetry Feature Flag

To make telemetry optional (e.g., disable for forks or development), add a feature flag:

1. Add to `.env.example`:

```bash
VITE_ENABLE_TELEMETRY=false
```

2. Add to GitHub Secrets:

```
VITE_ENABLE_TELEMETRY=true
```

3. Update `src/logging.ts`:

```typescript
const telemetryEnabled = import.meta.env.VITE_ENABLE_TELEMETRY === 'true'

export async function logEvent(evt: Omit<Insert, 'id' | 'session_id'>) {
  // Skip if telemetry is disabled
  if (!telemetryEnabled) {
    return
  }

  // ... rest of the function
}
```

### 4. Fork-Friendly Setup

To make the project work without telemetry for forks:

1. Update `src/logging.ts` to check if Supabase is configured:

```typescript
const isConfigured =
  supabaseUrl &&
  supabaseUrl !== 'https://placeholder.supabase.co' &&
  supabaseKey &&
  supabaseKey !== 'placeholder-key'

export async function logEvent(evt: Omit<Insert, 'id' | 'session_id'>) {
  if (!isConfigured) {
    console.debug('Telemetry not configured, skipping event:', evt.event_type)
    return
  }
  // ... rest of the function
}
```

## Security Considerations

1. **Anon Key is Public**: The `VITE_SUPABASE_ANON_KEY` is safe to expose as it's designed for client-side use
2. **Row Level Security**: The database is protected by RLS policies that only allow inserts
3. **No Sensitive Data**: Never log personally identifiable information or sensitive game data
4. **Service Key**: Never expose `SUPABASE_SERVICE_ROLE_KEY` in client code or GitHub Actions

## Testing the Deployment

After deployment, verify telemetry is working:

1. Visit your GitHub Pages site
2. Open browser DevTools → Network tab
3. Play a game action
4. Look for requests to `supabase.co/rest/v1/game_logs`
5. Should see 200/201 responses

## Troubleshooting

If telemetry isn't working:

1. **Check Build Logs**: Ensure environment variables are being set during build
2. **Verify Secrets**: Double-check GitHub secrets are correctly named
3. **Browser Console**: Look for any errors in console.debug logs
4. **CORS**: Ensure your Supabase project allows requests from your GitHub Pages domain

## Disabling Telemetry

To disable telemetry completely:

1. Don't set the GitHub secrets
2. Or set `VITE_ENABLE_TELEMETRY=false`
3. The game will function normally without telemetry
