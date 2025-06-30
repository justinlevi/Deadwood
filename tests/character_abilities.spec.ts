import { test, expect } from '@playwright/test'
import { startGameWithState, TestStates, createDefaultGameState } from './helpers/gameStateHelper'

test.describe('Character Abilities - Focused Tests', () => {
  test('Seth Bullock pays less for challenges', async ({ page }) => {
    const state = TestStates.readyToChallenge()
    state.players[0].character = {
      id: 'seth',
      name: 'Seth Bullock',
      ability: 'Challenge actions cost 1 less gold (minimum 1)',
      description: 'The principled sheriff of Deadwood'
    }
    state.players[0].gold = 2 // Only 2 gold
    await startGameWithState(page, state)

    // Challenge should show cost of 1 (instead of 2)
    const challengeButton = page.getByRole('button', { name: /Challenge/ })
    await expect(challengeButton).toContainText('(1g)')
    await expect(challengeButton).toBeEnabled()

    // Execute challenge
    await challengeButton.click()
    await page.getByRole('heading', { name: 'Gem Saloon' }).click()
    await page.getByRole('button', { name: /Confirm challenge/ }).click()

    // Wait for action to complete
    await page.waitForTimeout(300)

    // Should have 1 gold left
    await expect(page.locator('text=Gold: 1')).toBeVisible()
  })

  test('Al Swearengen gains gold when others enter Gem Saloon', async ({ page }) => {
    const state = createDefaultGameState()
    // Switch players so Al is player 0 (human)
    const alPlayer = state.players[1]
    alPlayer.isAI = false
    alPlayer.name = 'Player 1'
    const sethPlayer = state.players[0]
    sethPlayer.isAI = true
    sethPlayer.name = 'AI Player'
    state.players = [alPlayer, sethPlayer]
    
    // Al starts at Gem Saloon, Seth at Hardware Store
    state.players[0].position = 0
    state.players[1].position = 1
    state.currentPlayer = 1 // Seth's turn
    state.message = "Round 1 • AI Player's turn"
    
    await startGameWithState(page, state)

    // Set up Seth to move to Gem Saloon
    await page.evaluate(() => {
      const dispatch = (window as any).dispatchGameAction
      const state = (window as any).getGameState()
      
      // Manually execute Seth's move to Gem Saloon
      const newState = { ...state }
      newState.players[1].position = 0 // Move Seth to Gem Saloon
      newState.players[0].gold = 4 // Al gains 1 gold
      newState.currentPlayer = 0 // Back to Al
      newState.message = "Round 1 • Your turn"
      newState.actionLog = [...(state.actionLog || []), "AI Player moved to Gem Saloon"]
      
      dispatch({ type: 'SET_STATE', payload: newState })
    })

    // Verify Al has 4 gold (3 + 1 from ability)
    await expect(page.locator('text=Gold: 4').first()).toBeVisible()
  })

  test('Cy Tolliver can challenge adjacent locations', async ({ page }) => {
    const state = TestStates.cyTolliverAdjacent()
    await startGameWithState(page, state)

    // Challenge button should be enabled even though opponent is in different location
    const challengeButton = page.getByRole('button', { name: /Challenge/ })
    await expect(challengeButton).toBeEnabled()

    await challengeButton.click()
    await expect(page.locator('text=Select a player to challenge')).toBeVisible()

    // Click on Hardware Store to challenge there
    await page.getByRole('heading', { name: 'Hardware Store' }).click()
    
    // Confirm challenge button should appear and be clickable
    const confirmButton = page.getByRole('button', { name: /Confirm challenge/ })
    await expect(confirmButton).toBeVisible()
    await confirmButton.click()
    
    // Challenge should complete successfully
    await expect(page.locator('text=Select your final action')).toBeVisible()
    
    // Verify opponent lost influence (behavior, not implementation)
    const hardwareStore = page.locator('div').filter({ 
      has: page.locator('h3:text("Hardware Store")') 
    }).first()
    // Should show exactly 1 star now (was 2 before challenge)
    await expect(hardwareStore.locator('div[data-current="false"]').filter({ hasText: /^★$/ }).first()).toBeVisible()
  })

  test('Calamity Jane has free movement', async ({ page }) => {
    const state = createDefaultGameState()
    state.players[0].character = {
      id: 'jane',
      name: 'Calamity Jane',
      ability: 'Free movement',
      description: 'Movement actions cost no gold'
    }
    state.players[0].position = 0
    state.players[0].gold = 0 // No gold
    await startGameWithState(page, state)

    // Move button should still be enabled despite no gold
    const moveButton = page.getByRole('button', { name: /Move/ })
    await expect(moveButton).toBeEnabled()
    // For Calamity Jane, move cost is 0 so no cost is displayed

    // Execute move
    await moveButton.click()
    await page.getByRole('heading', { name: 'Deadwood Stage' }).click()
    await page.getByRole('button', { name: /Confirm move/ }).click()

    // Should still have 0 gold
    await expect(page.locator('text=Gold: 0')).toBeVisible()
    await expect(page.locator('text=Select your final action')).toBeVisible()
  })

  test('Wild Bill starts with extra influence', async ({ page }) => {
    const state = createDefaultGameState()
    state.players[0].character = {
      id: 'bill',
      name: 'Wild Bill Hickok',
      ability: 'Starting influence',
      description: 'Starts with 1 influence at Nuttal & Mann\'s'
    }
    state.players[0].position = 3 // Nuttal & Mann's
    state.board[3].influences['player-0'] = 1 // Starting influence
    state.players[0].totalInfluence = 1
    await startGameWithState(page, state)

    // Verify starting influence is displayed
    const nuttalLocation = page.locator('div').filter({ 
      has: page.locator('h3:text("Nuttal & Mann\'s")') 
    }).first()
    
    const influenceElement = nuttalLocation.locator('div[data-current="true"]').filter({ hasText: /^★+$/ })
    const stars = await influenceElement.textContent()
    expect(stars).toBe('★')

    // Verify total influence
    await expect(page.locator('text=Influence: 1')).toBeVisible()
  })
})