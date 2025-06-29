import { test, expect } from '@playwright/test'

test('handles corrupted game state gracefully', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Start Game' }).click()
  await page.evaluate(() => {
    const dispatch = (window as any).dispatchGameAction
    const state = (window as any).getGameState()
    dispatch({
      type: 'SET_STATE',
      payload: { ...state, currentPlayer: 99 },
    })
  })
  await expect(page.locator('text=Error: Invalid game state')).toBeVisible()
  await page.getByRole('button', { name: 'Reset Game' }).click()
  await expect(page.getByRole('heading', { name: 'Deadwood Showdown' })).toBeVisible()
})

test('AI handles invalid positions gracefully', async ({ page }) => {
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
        players: state.players.map((p: any, i: number) =>
          i === 1 ? { ...p, position: 99 } : p
        ),
      },
    })
  })
  await page.waitForTimeout(3000)
  await expect(page.locator('#app')).toBeVisible()
})

test('challenge with invalid target index', async ({ page }) => {
  await page.goto('/')
  const result = await page.evaluate(() => {
    const dispatch = (window as any).dispatchGameAction
    const GamePhase = (window as any).GamePhase
    const ActionType = (window as any).ActionType
    dispatch({
      type: 'SET_STATE',
      payload: {
        phase: GamePhase.PLAYER_TURN,
        currentPlayer: 0,
        players: [
          {
            id: 'player-0',
            name: 'Test',
            position: 0,
            gold: 3,
            totalInfluence: 0,
            isAI: false,
            character: { id: 'test', name: 'Test', ability: '' },
          },
        ],
        board: Array(6)
          .fill(null)
          .map((_, i) => ({
            id: i,
            name: `Location ${i}`,
            influences: {},
            maxInfluence: 3,
          })),
        roundCount: 1,
        completedActions: [],
        pendingAction: { type: ActionType.CHALLENGE, target: 5 },
        message: 'Test',
        gameConfig: { playerCount: 1, aiDifficulty: 'medium' },
      },
    })
    dispatch({ type: 'CONFIRM_ACTION' })
    const newState = (window as any).getGameState()
    return { gold: newState.players[0].gold, crashed: false }
  })
  expect(result.crashed).toBe(false)
  expect(result.gold).toBe(3)
})

