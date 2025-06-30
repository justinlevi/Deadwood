import { test, expect } from '@playwright/test'

async function setupGame(page, players) {
  await page.goto('/')
  await page.evaluate(({ players }) => {
    const dispatch = (window as any).dispatchGameAction
    dispatch({
      type: 'SET_STATE',
      payload: {
        phase: (window as any).GamePhase.PLAYER_TURN,
        currentPlayer: 0,
        players,
        board: Array(6).fill(null).map((_, i) => ({
          id: i,
          name: ['Gem Saloon', 'Hardware Store', 'Bella Union', 'Sheriff Office', 'Freight Office', "Wu's Pig Alley"][i],
          influences: {},
          maxInfluence: 3
        })),
        roundCount: 1,
        completedActions: [],
        pendingAction: undefined,
        gameConfig: { playerCount: players.length, aiDifficulty: 'easy' },
        message: 'Your turn'
      }
    })
  }, { players })
}

test('Al gains gold when another player enters Gem Saloon', async ({ page }) => {
  await setupGame(page, [
    {
      id: 'player-0',
      name: 'Seth',
      character: { id: 'seth', name: 'Seth', ability: '' },
      position: 1,
      gold: 3,
      totalInfluence: 0,
      isAI: false,
      actionsRemaining: 2
    },
    {
      id: 'player-1',
      name: 'Al',
      character: { id: 'al', name: 'Al', ability: 'Gains +1 gold when another player enters Gem Saloon' },
      position: 2,
      gold: 3,
      totalInfluence: 0,
      isAI: true,
      actionsRemaining: 2
    }
  ])

  // Click Move action button
  await page.getByRole('button', { name: /Move/ }).click()
  
  // Wait for move mode to be active
  await expect(page.locator('text=Select a location to move to')).toBeVisible({ timeout: 10000 })
  
  // Click on the Gem Saloon location card - find the clickable card with green border
  // The card should have a green border when it's a valid target
  const gemSaloonCard = page.locator('div.border-deadwood-green').filter({
    has: page.locator('h3:text("Gem Saloon")')
  }).first()
  
  // Click the card
  await gemSaloonCard.click()
  
  // Wait a bit for the selection to register
  await page.waitForTimeout(200)
  
  // Confirm the move - wait for it to be enabled
  const confirmButton = page.getByRole('button', { name: /Confirm move/i })
  await expect(confirmButton).toBeEnabled({ timeout: 5000 })
  await confirmButton.click()
  
  // Wait for the move to complete and ability to trigger
  await page.waitForTimeout(1000)

  // Debug: Take a screenshot to see what's on the page
  // await page.screenshot({ path: 'debug-al-test.png' })

  // Check Al's gold - look for any element containing "Al" and check its gold
  // Try multiple selectors to find Al's info
  const alPlayerInfo = page.locator('div').filter({
    hasText: /Al.*Gold:/
  }).first()
  
  // Check that Al now has 4 gold
  await expect(alPlayerInfo).toContainText('Gold: 4')
})

test("Al doesn't gain gold for entering his own saloon", async ({ page }) => {
  await setupGame(page, [
    {
      id: 'player-0',
      name: 'Al',
      character: { id: 'al', name: 'Al', ability: 'Gains +1 gold when another player enters Gem Saloon' },
      position: 1,
      gold: 3,
      totalInfluence: 0,
      isAI: false,
      actionsRemaining: 2
    }
  ])

  // Click Move action button
  await page.getByRole('button', { name: /Move/ }).click()
  
  // Wait for move mode to be active
  await expect(page.locator('text=Select a location to move to')).toBeVisible({ timeout: 10000 })
  
  // Click on the Gem Saloon location card - find the clickable card with green border
  const gemSaloonCard = page.locator('div.border-deadwood-green').filter({
    has: page.locator('h3:text("Gem Saloon")')
  }).first()
  
  // Click the card
  await gemSaloonCard.click()
  
  // Confirm the move
  await page.getByRole('button', { name: /Confirm move/i }).click()
  
  // Wait for the move to complete
  await page.waitForTimeout(500)

  // Check Al's gold hasn't changed - should still be 3
  const alPlayerInfo = page.locator('div').filter({
    hasText: /Al.*Gold:/
  }).first()
  
  // Check that Al still has 3 gold
  await expect(alPlayerInfo).toContainText('Gold: 3')
})
