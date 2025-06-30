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
    await startGameWithState(page, state)

    // Check Gem Saloon has 3 stars
    const gemSaloon = page.locator('div').filter({ 
      has: page.locator('h3:text("Gem Saloon")') 
    }).first()
    const gemInfluence = gemSaloon.locator('div[data-current="true"]').filter({ hasText: /^★+$/ })
    await expect(gemInfluence).toHaveText('★★★')

    // Check Hardware Store has 2 stars (opponent's)
    const hardwareStore = page.locator('div').filter({ 
      has: page.locator('h3:text("Hardware Store")') 
    }).first()
    const hardwareInfluence = hardwareStore.locator('div').filter({ hasText: /^★+$/ })
    await expect(hardwareInfluence).toHaveText('★★')
  })

  test('shows player positions correctly', async ({ page }) => {
    const state = createDefaultGameState()
    state.players[0].position = 0 // Gem Saloon
    state.players[1].position = 0 // Also at Gem Saloon
    await startGameWithState(page, state)

    const gemSaloon = page.locator('div').filter({ 
      has: page.locator('h3:text("Gem Saloon")') 
    }).first()

    // Both players should be visible at location
    await expect(gemSaloon.locator('text=Seth')).toBeVisible()
    await expect(gemSaloon.locator('text=Al')).toBeVisible()
  })

  test('highlights current player location', async ({ page }) => {
    const state = createDefaultGameState()
    state.players[0].position = 2 // Bella Union
    await startGameWithState(page, state)

    const bellaUnion = page.locator('div').filter({ 
      has: page.locator('h3:text("Bella Union")') 
    }).first()

    // Should have data-current="true"
    const isCurrent = await bellaUnion.getAttribute('data-current')
    expect(isCurrent).toBe('true')
  })

  test('shows move costs correctly', async ({ page }) => {
    const state = createDefaultGameState()
    state.players[0].position = 0 // Gem Saloon
    await startGameWithState(page, state)

    // Start move action
    await page.getByRole('button', { name: /Move/ }).click()

    // Adjacent location should show 1g
    const hardwareStore = page.locator('div').filter({ 
      has: page.locator('h3:text("Hardware Store")') 
    }).first()
    await expect(hardwareStore.locator('text=1g')).toBeVisible()

    // Non-adjacent should show 2g
    const freightOffice = page.locator('div').filter({ 
      has: page.locator('h3:text("The Freight Office")') 
    }).first()
    await expect(freightOffice.locator('text=2g')).toBeVisible()
  })

  test('error messages display correctly', async ({ page }) => {
    const state = TestStates.noGold()
    state.pendingAction = { type: 'claim', amount: 1 }
    state.message = 'Not enough gold'
    await startGameWithState(page, state)

    await expect(page.locator('text=Not enough gold')).toBeVisible()
  })
})