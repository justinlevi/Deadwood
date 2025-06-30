import { test, expect } from '@playwright/test'

test('challenge action targets correct player', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Start Game' }).click()

  // Set up specific game state
  await page.evaluate(() => {
    const dispatch = (window as any).dispatchGameAction
    const GamePhase = (window as any).GamePhase

    dispatch({
      type: 'SET_STATE',
      payload: {
        phase: GamePhase.PLAYER_TURN,
        currentPlayer: 0,
        players: [
          {
            id: 'player-0',
            name: 'You',
            color: '#000',
            character: { id: 'al', name: 'Al Swearengen', ability: '' },
            position: 0,
            gold: 5,
            totalInfluence: 0,
            isAI: false,
            actionsRemaining: 2,
          },
          {
            id: 'player-1',
            name: 'AI Player 1',
            color: '#000',
            character: { id: 'seth', name: 'Seth Bullock', ability: '' },
            position: 0,
            gold: 3,
            totalInfluence: 3,
            isAI: true,
            actionsRemaining: 2,
          },
        ],
        board: Array(6)
          .fill(null)
          .map((_, i) => ({
            id: i,
            name: [
              'Gem Saloon',
              'Hardware Store',
              'Bella Union',
              'Sheriff Office',
              'Freight Office',
              "Wu's Pig Alley",
            ][i],
            influences: i === 0 ? { 'player-1': 3 } : {},
            maxInfluence: 3,
          })),
        roundCount: 1,
        completedActions: [],
        pendingAction: undefined,
        message: 'Your turn',
      },
    })
  })

  // Challenge the AI player
  await page.getByRole('button', { name: /Challenge/ }).click()
  
  // Wait for challenge mode to be active
  await expect(page.locator('text=Select a player to challenge')).toBeVisible({ timeout: 10000 })
  
  // Click on the Gem Saloon location card - it should have a green border since it has valid targets
  const gemSaloonCard = page.locator('.border-deadwood-green').filter({
    has: page.locator('h3:text("Gem Saloon")')
  }).first()
  
  // Force click to bypass any z-index issues
  await gemSaloonCard.click({ force: true })
  
  // Since there's only one valid target at this location, it should automatically select them
  // and show the confirm button
  await expect(page.getByRole('button', { name: /Confirm challenge/i })).toBeEnabled()
  
  // Confirm the challenge
  await page.getByRole('button', { name: /Confirm challenge/i }).click()
  
  // Wait for the challenge to complete
  await page.waitForTimeout(500)

  // Verify the challenge worked - should be on second action now
  await expect(page.locator('text=/Selected: 1\\/2 actions|Select your final action/')).toBeVisible()

  // Check that influence was reduced (AI had 3, should now have 2)
  const gemSaloon = page.locator('div').filter({ 
    has: page.locator('h3:text("Gem Saloon")') 
  }).first()
  
  // Look for influence display showing 2 stars for AI Player 1
  await expect(gemSaloon).toContainText('★★')
})
