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

### [2025-06-29 13:06 UTC] Attempted e2e fixes

- Simplified action selection logic and removed processing debounce
- Kept action buttons visible across game states, disabling them when AI is active
- Updated DeadwoodGame to reflect these changes
- What's next: resolve remaining Playwright test failures

### [2025-06-29 13:44 UTC] Add complete gameplay test suite

- Added comprehensive Playwright tests covering all mechanics
- Created helper functions and multiple scenarios
- What's next: monitor CI performance and optimize if needed

### [2025-06-29 14:35 UTC] Fix race condition and update tests

- Added boolean attribute strings in LocationCard for reliable test queries
- Introduced synchronous disabled action tracking to prevent multi-click issues
- Adjusted startGame helper and round display waits in e2e tests
- What's next: verify all tests pass

### [2025-06-29 15:28 UTC] Add requirements builder files

- Added rizethereum-claude-code-requirements-builder directory with commands, examples, and docs
- What's next: ensure tests pass and monitor integration

### [2025-06-29 16:08 UTC] Move requirements builder

- Relocated files into `.claude` directory and removed subdirectory
- What's next: verify tests pass

### [2025-06-29 16:27 UTC] Add AI turn failsafe

- Implemented automatic end-turn timer for AI players
- Clear failsafe on turn completion or exit
- What's next: monitor AI behavior under stress

### [2025-06-29 17:23 UTC] Color code influence stars

- Added `color` property to `Player` type and assigned colors on player creation
- Updated LocationCard to style influence stars using each player's color
- Adjusted unit and e2e tests for new property
- What's next: ensure tests and build succeed

### [2025-06-29 17:47 UTC] Add influence persistence test

- Created Playwright spec to ensure claim stars remain visible after reaching three influence
- What's next: verify tests and build succeed

### [2025-06-29 18:14 UTC] Add player color indicators

- Added colored stars and border styling for current and other players
- Introduced data-testid attributes for reliable selectors
- Created Playwright test verifying star visibility
- What's next: ensure lint, test and build pass

### [2025-06-29 18:26 UTC] Fix influence star persistence

- Updated `LocationCard` to reference all players when rendering influences so
  stars remain visible after players move away
- Passed `allPlayers` from `DeadwoodGame`
- Added Playwright test covering influence persistence when moving to another
  location
- What's next: run full test suite and ensure build succeeds
