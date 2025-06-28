## Testing

run: npm ci && npm run lint && npm test && npm run build

## Style

reject_commits_without: npm run lint

## Guidelines

- No secrets in logs
- Follow Conventional Commits
- Run the full test and build suite before each commit to avoid unused imports and similar issues
