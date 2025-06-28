## Testing

run: npm ci && npm run lint && npm test && npm run build

## Style

reject_commits_without: npm run lint

## Guidelines

- No secrets in logs
- Follow Conventional Commits
- Run the full test and build suite before each commit to avoid unused imports and similar issues

## Progress Tracking

- After you make any changes, document them in `docs/task-update.md`.
- Each entry must contain the current UTC date and time, a brief summary, and a "What's next" list for any remaining work.

### Example Entry Format

```
### [2025-06-28 23:45 UTC] Short summary
- Did X, Y, Z
- What's next: A, B
```
