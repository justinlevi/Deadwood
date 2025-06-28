### [2025-06-28 23:17 UTC] Initialize progress log

- Created `docs` folder and `task-update.md` for tracking.
- Updated `AGENTS.md` with instructions for maintaining this log.
- What's next: implement bug fixes and update this file after changes.

### [2025-06-28 23:28 UTC] Implement challenge target selection

- Added UI and reducer logic for choosing a specific challenge target
- Created unit and e2e tests covering this flow
- Updated cancel action to clear challenge target list
- What's next: review remaining bug fixes

### [2025-06-28 23:36 UTC] Fix AI timer state mutation

- Rewrote AI effect to track and clear timers safely
- Added phase validation in reducer
- Created e2e and unit tests for timer cleanup and phase checks
- What's next: monitor other bug reports
