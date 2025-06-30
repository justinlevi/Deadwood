import { test, expect } from '@playwright/test'

// Wait for AI actions to settle
async function waitForAI(page, ms = 4000) {
  await page.waitForTimeout(ms)
}

test('AI actions are cancelled when game ends', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Start Game' }).click()

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
            totalInfluence: 11,
            gold: 3,
            position: 0,
            isAI: false,
            character: { id: 'al', name: 'Al Swearengen', ability: '' },
            actionsRemaining: 2,
          },
          {
            id: 'player-1',
            name: 'AI Player 1',
            color: '#000',
            isAI: true,
            position: 1,
            gold: 3,
            totalInfluence: 0,
            character: { id: 'seth', name: 'Seth Bullock', ability: '' },
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
            influences: i === 0 ? { 'player-0': 2 } : {},
            maxInfluence: 3,
          })),
        turnCount: 1,
        completedActions: [],
        pendingAction: undefined,
        message: 'Your turn',
        gameConfig: { playerCount: 2, aiDifficulty: 'medium' },
      },
    })
  })

  await page.getByRole('button', { name: /Claim/ }).click()
  await page.getByRole('button', { name: /Confirm Claim/i }).click()

  await expect(page.locator('text=wins!')).toBeVisible()
  await waitForAI(page)
  await expect(page.locator('text=wins!')).toBeVisible()
  await expect(page.locator('text=AI Player.*turn')).not.toBeVisible()

  const consoleErrors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })
  await page.waitForTimeout(1000)
  expect(consoleErrors).toHaveLength(0)
})

test('AI timers clean up on component unmount', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Start Game' }).click()

  await page.evaluate(() => {
    const dispatch = (window as any).dispatchGameAction
    const state = (window as any).getGameState()
    dispatch({
      type: 'SET_STATE',
      payload: {
        ...state,
        currentPlayer: 1,
        completedActions: [],
        message: "AI Player 1's turn",
      },
    })
  })

  await page.waitForTimeout(500)

  await page.evaluate(() => {
    const dispatch = (window as any).dispatchGameAction
    dispatch({ type: 'RESET_GAME' })
  })

  await expect(page.getByRole('heading', { name: 'Deadwood Showdown' })).toBeVisible()
  await page.waitForTimeout(3000)
  await expect(page.getByRole('heading', { name: 'Deadwood Showdown' })).toBeVisible()
})

test('AI handles rapid state changes gracefully', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Start Game' }).click()

  for (let i = 0; i < 5; i++) {
    await page.evaluate((index) => {
      const dispatch = (window as any).dispatchGameAction
      const state = (window as any).getGameState()
      dispatch({
        type: 'SET_STATE',
        payload: {
          ...state,
          currentPlayer: index % 2,
          completedActions: [],
          message: index % 2 === 0 ? 'Your turn' : "AI's turn",
        },
      })
    }, i)
    await page.waitForTimeout(300)
  }

  await page.getByRole('button', { name: /Rest/ }).click()
  await expect(page.locator('text=Select your final action')).toBeVisible()
})
