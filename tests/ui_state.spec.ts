import { test, expect } from '@playwright/test'
import { startGameWithState, TestStates, createDefaultGameState } from './helpers/gameStateHelper'

test.describe('UI State Display - Focused Tests', () => {
  test('displays round and turn information', async ({ page }) => {
    const state = TestStates.midGame()
    state.roundCount = 10
    await startGameWithState(page, state)

    // Check round display
    await expect(page.locator('text=/Round 10 of 20/')).toBeVisible()
    await expect(page.locator('text=/Your turn/')).toBeVisible()
  })

  test('displays player resources correctly', async ({ page }) => {
    const state = TestStates.midGame()
    state.players[0].gold = 5
    state.players[0].totalInfluence = 8
    await startGameWithState(page, state)

    await expect(page.locator('text=Gold: 5')).toBeVisible()
    await expect(page.locator('text=Influence: 8')).toBeVisible()
  })

  test('shows action count correctly', async ({ page }) => {
    const state = TestStates.oneActionCompleted()
    await startGameWithState(page, state)

    await expect(page.locator('text=Selected: 1/2 actions')).toBeVisible()
  })

  test('displays influence stars on locations', async ({ page }) => {
    const state = createDefaultGameState()
    state.board[0].influences['player-0'] = 3
    state.board[1].influences['player-1'] = 2
    state.players[0].totalInfluence = 3
    state.players[1].totalInfluence = 2
    await startGameWithState(page, state)

    // Check Gem Saloon has 3 stars for current player
    const gemSaloon = page.locator('div').filter({ 
      has: page.locator('h3:text("Gem Saloon")') 
    }).first()
    // Look for influence div that contains exactly 3 stars
    await expect(gemSaloon.locator('div').filter({ hasText: /^★★★$/ }).first()).toBeVisible()

    // Check Hardware Store has 2 stars (opponent's)
    const hardwareStore = page.locator('div').filter({ 
      has: page.locator('h3:text("Hardware Store")') 
    }).first()
    // Look for influence div that contains exactly 2 stars
    await expect(hardwareStore.locator('div').filter({ hasText: /^★★$/ }).first()).toBeVisible()
  })

  test('shows player positions correctly', async ({ page }) => {
    const state = createDefaultGameState()
    state.players[0].position = 0 // Gem Saloon
    state.players[1].position = 0 // Also at Gem Saloon
    await startGameWithState(page, state)

    // Wait for UI to render
    await page.waitForTimeout(300)

    const gemSaloon = page.locator('div').filter({ 
      has: page.locator('h3:text("Gem Saloon")') 
    }).first()

    // Both players should be visible at location (first names only)
    await expect(gemSaloon.locator('text="Seth"')).toBeVisible()
    await expect(gemSaloon.locator('text="Al"')).toBeVisible()
  })

  test('shows current player at their location', async ({ page }) => {
    const state = createDefaultGameState()
    state.players[0].position = 2 // Bella Union
    await startGameWithState(page, state)

    // Wait a bit for UI to update
    await page.waitForTimeout(300)

    const bellaUnion = page.locator('div').filter({ 
      has: page.locator('h3:text("Bella Union")') 
    }).first()

    // Current player (Seth) should be visible at Bella Union
    await expect(bellaUnion.locator('text="Seth"')).toBeVisible()
  })

  test('shows move costs correctly', async ({ page }) => {
    const state = createDefaultGameState()
    state.players[0].position = 0 // Gem Saloon
    await startGameWithState(page, state)

    // Start move action
    await page.getByRole('button', { name: /Move/ }).click()

    // Wait for UI to update
    await page.waitForTimeout(200)

    // Non-adjacent location should show 1g move cost
    const freightOffice = page.locator('div').filter({ 
      has: page.locator('h3:text("The Freight Office")') 
    }).first()
    // Look for move cost indicator specifically
    await expect(freightOffice.locator('[data-testid="move-cost"]').first()).toContainText('1g')
  })

  test('error messages display correctly', async ({ page }) => {
    const state = TestStates.noGold()
    state.pendingAction = { type: 'claim', amount: 1 }
    state.message = 'Not enough gold'
    await startGameWithState(page, state)

    // Look for the message text specifically, allowing for multiple matches
    await expect(page.locator('text="Not enough gold"').first()).toBeVisible()
  })
})