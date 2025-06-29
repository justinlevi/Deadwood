### [2025-06-28 23:17 UTC] Initialize progress log

- Created `docs` folder and `task-update.md` for tracking.
- Updated `AGENTS.md` with instructions for maintaining this log.
- What's next: implement bug fixes and update this file after changes.

### [2025-06-28 23:28 UTC] Implement challenge target selection

- Added UI and reducer logic for choosing a specific challenge target
- Created unit and e2e tests covering this flow
- Updated cancel action to clear challenge target list
- What's next: review remaining bug fixes

### [2025-06-28 23:45 UTC] Fix challenge validation bug

- Implemented robust backend claim validation
- Improved dropdown options and added UI feedback
- Updated action availability logic
- Added comprehensive unit and e2e tests
- What's next: ensure all tests pass and finalize PR

### [2025-06-29 00:01 UTC] Restore reducer tests

- Resolved merge conflict markers in reducer.test.ts
- Re-ran lint, tests, and build successfully
- What's next: monitor CI results

### [2025-06-29 00:45 UTC] Implement bounds safety checks

- Added safe accessor functions and replaced direct array access across reducer, UI, and AI
- Created comprehensive unit and e2e tests for invalid indices
- Updated DeadwoodGame to show error UI on corrupted state
- What's next: verify tests pass and finalize PR

### [2025-06-29 02:03 UTC] Fix AI timer reset issue

- Updated AI scheduling effect in DeadwoodGame to avoid clearing timers mid-turn
- Added regression test to ensure AI completes its queued actions
- What's next: verify tests pass and finalize PR

### [2025-06-29 11:32 UTC] Adjust AI regression test

- Updated ai_flow_complete test expectation to match end-of-turn state
- What's next: ensure full test suite stability

### [2025-06-29 12:42 UTC] Fix failing unit tests

- Updated unit test imports to reference specific modules
- Replaced deprecated `turnCount` with `roundCount`
- Formatted changed tests with Prettier
- What's next: run full test suite and ensure build passes
