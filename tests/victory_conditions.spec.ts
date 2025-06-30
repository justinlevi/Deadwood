import { test, expect } from '@playwright/test'
import { startGameWithState, TestStates } from './helpers/gameStateHelper'

test.describe('Victory Conditions - Focused Tests', () => {
  test('wins immediately at 12 total influence', async ({ page }) => {
    const state = TestStates.nearInfluenceVictory()
    state.players[0].totalInfluence = 11
    state.board[0].influences['player-0'] = 2
    state.players[0].gold = 1
    await startGameWithState(page, state)

    // Claim 1 more influence to reach 12
    await page.getByRole('button', { name: /Claim/ }).click()
    await page.locator('select').selectOption('1')
    await page.getByRole('button', { name: /Confirm claim/ }).click()

    // Wait for game state to update
    await page.waitForTimeout(500)

    // Should win immediately
    await expect(page.locator('text=Game Over!')).toBeVisible()
    await expect(page.locator('text=/You.*[Ww]ins/i')).toBeVisible()
  })

  test('wins by controlling 3 locations at max', async ({ page }) => {
    const state = TestStates.nearLocationVictory()
    // Player controls 2 locations at max, almost max at third
    state.board[2].influences['player-0'] = 2 // One away from max
    state.players[0].gold = 1
    await startGameWithState(page, state)

    // Claim the last influence needed
    await page.getByRole('button', { name: /Claim/ }).click()
    await page.locator('select').selectOption('1')
    await page.getByRole('button', { name: /Confirm claim/ }).click()

    // Wait for game state to update
    await page.waitForTimeout(500)

    // Should win immediately
    await expect(page.locator('text=Game Over!')).toBeVisible()
    await expect(page.locator('text=/You.*[Ww]ins/i')).toBeVisible()
  })

  test('game continues when victory not met', async ({ page }) => {
    const state = TestStates.midGame()
    state.players[0].totalInfluence = 10 // Close but not 12
    await startGameWithState(page, state)

    // Do an action
    await page.getByRole('button', { name: /Rest/ }).click()

    // Game should continue
    await expect(page.locator('text=Select your final action')).toBeVisible()
    await expect(page.locator('text=Game Over!')).not.toBeVisible()
  })

  test('shows winner with highest influence at round 20', async ({ page }) => {
    const state = TestStates.midGame()
    state.roundCount = 20
    state.currentPlayer = 1 // Set to last player so game ends after their turn
    state.players[0].totalInfluence = 8
    state.players[1].totalInfluence = 6
    state.players[1].isAI = false // Make last player human so we can control actions
    state.players[1].name = 'Player 2'
    await startGameWithState(page, state)

    // Complete turn to trigger end game check
    await page.getByRole('button', { name: /Rest/ }).click()
    await page.getByRole('button', { name: /Rest/ }).click()

    // Wait for game state to update
    await page.waitForTimeout(1000)

    // Should end game with player 1 winning
    await expect(page.locator('text=Game Over!')).toBeVisible()
    await expect(page.locator('text=/You.*[Ww]ins/i')).toBeVisible()
  })

  test('handles tie at round 20', async ({ page }) => {
    const state = TestStates.midGame()
    state.roundCount = 20
    state.currentPlayer = 1 // Set to last player so game ends after their turn
    state.players[0].totalInfluence = 7
    state.players[1].totalInfluence = 7
    state.players[1].isAI = false // Make last player human so we can control actions
    state.players[1].name = 'Player 2'
    await startGameWithState(page, state)

    // Wait for UI to be ready
    await page.waitForTimeout(500)
    
    // Complete turn
    const restButton = page.getByRole('button', { name: /Rest/ })
    await expect(restButton).toBeEnabled({ timeout: 5000 })
    await restButton.click()
    
    // Wait for first action
    await page.waitForTimeout(500)
    await restButton.click()

    // Wait for game to process end condition
    await page.waitForTimeout(2000)

    // Should show tie - both players win
    await expect(page.locator('text=Game Over!')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=wins!')).toBeVisible()
  })
})