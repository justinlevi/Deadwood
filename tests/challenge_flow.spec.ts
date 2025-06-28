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
        turnCount: 1,
        completedActions: [],
        pendingAction: undefined,
        message: 'Your turn',
      },
    })
  })

  // Challenge the AI player
  await page.getByRole('button', { name: /Challenge/ }).click()
  await page.getByRole('heading', { name: 'Gem Saloon' }).click()
  await page.getByRole('button', { name: /Confirm challenge/i }).click()

  // Verify the challenge worked
  await expect(page.locator('text=Select your final action')).toBeVisible()

  const gemSaloon = page
    .locator('div')
    .filter({ has: page.locator('h3:text("Gem Saloon")') })
    .first()
  const stars = await gemSaloon.locator('text=/★{2}[^★]|★{2}$/').count()
  expect(stars).toBeGreaterThan(0)
})
