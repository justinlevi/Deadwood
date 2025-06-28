### [2025-06-28 23:17 UTC] Initialize progress log

- Created `docs` folder and `task-update.md` for tracking.
- Updated `AGENTS.md` with instructions for maintaining this log.
- What's next: implement bug fixes and update this file after changes.

### [2025-06-28 23:28 UTC] Implement challenge target selection

- Added UI and reducer logic for choosing a specific challenge target
- Created unit and e2e tests covering this flow
- Updated cancel action to clear challenge target list
- What's next: review remaining bug fixes

### [2025-06-28 23:47 UTC] Clarify rounds and update tests

- Replaced remaining `turnCount` references with `roundCount`
- Added round info display in UI and initial state defaults
- Updated victory condition and created new round counting tests
- What's next: ensure all tests pass and build succeeds
