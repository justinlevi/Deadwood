Feature: Deadwood Showdown UI/UX test plan
  # This feature file documents high level scenarios to cover the game's
  # critical user flows. It is meant as guidance for writing Playwright
  # tests. Each scenario describes expected behaviour and suggests stable
  # selectors to avoid flaky tests.

  Background:
    Given the application is started
    And the page has loaded

  Scenario: Starting the game with default options
    When the user views the setup screen
    Then the title "Deadwood Showdown" is visible
    And the player count selector defaults to "2 Players"
    And the AI difficulty selector defaults to "Medium"
    When the user clicks the "Start Game" button
    Then the game board should appear
    And the turn message should contain "Round 1"

  Scenario: Moving to another location and claiming influence
    Given a deterministic starting state for easy assertions
    When the user selects the "Move" action
    Then all reachable locations should highlight as valid targets
    When the user clicks a highlighted location and confirms
    Then the player's position and gold should update accordingly
    And the turn message should prompt for the final action
    When the user selects "Claim" and chooses amount "1" gold
    And confirms the claim action
    Then the current location should show the player with one influence star
    And the player's gold total should decrease by one
    And the turn should advance to the next player

  Scenario: Challenging an opponent
    Given the opponent has at least one influence star at the same location
    When the user selects the "Challenge" action
    Then the opponent should highlight as a valid target
    When the user confirms the challenge
    Then the opponent's influence is reduced by one
    And the user's gold decreases by the correct challenge cost
    And the turn message should update appropriately

  Scenario: Resting for gold
    When the user selects "Rest"
    Then two gold are immediately added to the player's total
    And the turn message prompts for the final action

  Scenario: Disabled actions when not allowed
    Given the current location is at max influence for the player
    Then the "Claim" button should be disabled
    Given the player lacks enough gold or targets
    Then the "Challenge" button should be disabled

  Scenario: Automatic AI turn after the player completes two actions
    When the human player finishes their second action
    Then the next player (AI) should begin their turn automatically
    And the board should update once the AI completes its actions

  Scenario: Victory and starting a new game
    Given a victory condition is met
    Then a "Game Over" screen should display the winner and final scores
    When the user clicks "New Game"
    Then the setup screen should appear again
