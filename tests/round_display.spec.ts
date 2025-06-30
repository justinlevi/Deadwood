import { test, expect } from '@playwright/test'
import { startGameWithState, createDefaultGameState } from './helpers/gameStateHelper'

test('displays round information clearly', async ({ page }) => {
  const state = createDefaultGameState()
  state.roundCount = 5
  await startGameWithState(page, state)

  await expect(page.locator('text=Round 5 of 20')).toBeVisible()
  await expect(page.locator('text=/Player 1 of 2/')).toBeVisible()
})

test('game ends immediately at round 20', async ({ page }) => {
  const state = createDefaultGameState()
  state.roundCount = 20
  state.players[0].totalInfluence = 8
  state.players[1].totalInfluence = 6
  await startGameWithState(page, state)

  // Complete the turn to trigger end game
  await page.getByRole('button', { name: /Rest/ }).click()
  await page.getByRole('button', { name: /Rest/ }).click()

  await expect(page.locator('text=Game Over!')).toBeVisible()
  await expect(page.locator('text=/You.*Wins/i')).toBeVisible()
})

test('round advances after all players complete turns', async ({ page }) => {
  const state = createDefaultGameState()
  // Set up so completing current turn will advance round
  state.currentPlayer = 1 // Player 2 (last player)
  state.roundCount = 1
  await startGameWithState(page, state)

  // Complete turn as last player
  await page.getByRole('button', { name: /Rest/ }).click()
  await page.getByRole('button', { name: /Rest/ }).click()

  // Wait for round to advance
  await page.waitForTimeout(500)

  // Should advance to round 2
  await expect(page.locator('text=/Round 2 of 20/')).toBeVisible()
})