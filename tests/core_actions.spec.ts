import { test, expect } from '@playwright/test'
import { startGameWithState, TestStates, setGameState } from './helpers/gameStateHelper'

test.describe('Core Actions - Focused Tests', () => {
  test('move action works correctly', async ({ page }) => {
    const state = TestStates.midGame()
    state.players[0].position = 0 // Start at Gem Saloon
    await startGameWithState(page, state)

    // Select move action
    await page.getByRole('button', { name: /Move/ }).click()
    await expect(page.locator('text=Select a location to move to')).toBeVisible()

    // Click on Hardware Store (adjacent, should cost 1)
    await page.getByRole('heading', { name: 'Hardware Store' }).click()
    await page.getByRole('button', { name: /Confirm move/ }).click()

    // Verify player moved
    await expect(page.locator('text=Select your final action')).toBeVisible()
    
    // Check that move button is now selected (green)
    const moveButton = page.getByRole('button', { name: /Move/ })
    const isSelected = await moveButton.getAttribute('data-selected')
    expect(isSelected).toBe('true')
  })

  test('claim action respects constraints', async ({ page }) => {
    const state = TestStates.readyToClaim()
    state.players[0].gold = 2 // Limited gold
    state.board[0].maxInfluence = 3
    state.board[0].influences['player-0'] = 1 // Already has 1
    await startGameWithState(page, state)

    // Select claim action
    await page.getByRole('button', { name: /Claim/ }).click()
    
    // Dropdown should show max 2 (limited by both gold and space)
    const options = await page.locator('select option').allTextContents()
    expect(options).toContain('1')
    expect(options).toContain('2')
    expect(options).not.toContain('3')

    // Claim 2
    await page.locator('select').selectOption('2')
    await page.getByRole('button', { name: /Confirm claim/ }).click()

    await expect(page.locator('text=Select your final action')).toBeVisible()
  })

  test('challenge action with single target', async ({ page }) => {
    const state = TestStates.readyToChallenge()
    await startGameWithState(page, state)

    // Select challenge action
    await page.getByRole('button', { name: /Challenge/ }).click()
    await expect(page.locator('text=Select a player to challenge')).toBeVisible()

    // Click on location with opponent
    await page.getByRole('heading', { name: 'Gem Saloon' }).click()
    await page.getByRole('button', { name: /Confirm challenge/ }).click()

    await expect(page.locator('text=Select your final action')).toBeVisible()
  })

  test('rest action grants gold immediately', async ({ page }) => {
    const state = TestStates.noGold()
    await startGameWithState(page, state)

    // Check initial gold
    await expect(page.locator('text=Gold: 0')).toBeVisible()

    // Select rest action
    await page.getByRole('button', { name: /Rest/ }).click()

    // Should immediately get gold and be ready for second action
    await expect(page.locator('text=Gold: 1')).toBeVisible()
    await expect(page.locator('text=Select your final action')).toBeVisible()
  })

  test('cannot select unavailable actions', async ({ page }) => {
    const state = TestStates.noGold()
    state.board[0].influences['player-0'] = 3 // Location full
    await startGameWithState(page, state)

    // Move should be disabled (no gold)
    await expect(page.getByRole('button', { name: /Move/ })).toBeDisabled()
    
    // Claim should be disabled (location full)
    await expect(page.getByRole('button', { name: /Claim/ })).toBeDisabled()
    
    // Challenge should be disabled (no gold)
    await expect(page.getByRole('button', { name: /Challenge/ })).toBeDisabled()
    
    // Rest should be enabled
    await expect(page.getByRole('button', { name: /Rest/ })).toBeEnabled()
  })

  test('action cancellation works', async ({ page }) => {
    const state = TestStates.midGame()
    await startGameWithState(page, state)

    // Start move action
    await page.getByRole('button', { name: /Move/ }).click()
    await expect(page.locator('text=Select a location to move to')).toBeVisible()

    // Cancel
    await page.getByRole('button', { name: /Cancel/ }).click()
    await expect(page.locator('text=Select 2 actions')).toBeVisible()

    // All buttons should be re-enabled
    await expect(page.getByRole('button', { name: /Move/ })).toBeEnabled()
    await expect(page.getByRole('button', { name: /Rest/ })).toBeEnabled()
  })

  test('completed actions show visual feedback', async ({ page }) => {
    const state = TestStates.oneActionCompleted()
    await startGameWithState(page, state)

    // Rest button should show as selected
    const restButton = page.getByRole('button', { name: /Rest/ })
    const isSelected = await restButton.getAttribute('data-selected')
    expect(isSelected).toBe('true')

    // Should show we're on second action
    await expect(page.locator('text=Select your final action')).toBeVisible()
  })

  test('turn ends after two actions', async ({ page }) => {
    const state = TestStates.midGame()
    await startGameWithState(page, state)

    // First action: Rest
    await page.getByRole('button', { name: /Rest/ }).click()
    await expect(page.locator('text=Select your final action')).toBeVisible()

    // Second action: Rest again
    await page.getByRole('button', { name: /Rest/ }).click()

    // Should advance to next player (AI)
    await expect(page.locator('text=AI Player')).toBeVisible({ timeout: 1000 })
  })
})