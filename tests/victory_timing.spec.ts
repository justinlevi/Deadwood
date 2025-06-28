import { test, expect } from '@playwright/test'

test('game ends immediately when reaching 12 influence', async ({ page }) => {
  await page.goto('/')

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
            gold: 3,
            totalInfluence: 11,
            isAI: false,
            actionsRemaining: 2,
          },
          {
            id: 'player-1',
            name: 'AI Player 1',
            character: { id: 'seth', name: 'Seth Bullock', ability: '' },
            position: 1,
            gold: 3,
            totalInfluence: 5,
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
            influences: i === 0 ? { 'player-0': 2 } : {},
            maxInfluence: 3,
          })),
        roundCount: 1,
        completedActions: [],
        pendingAction: undefined,
        message: 'Your turn',
        gameConfig: { playerCount: 2, aiDifficulty: 'medium' },
        actionHistory: [],
      },
    })
  })

  await page.getByRole('button', { name: /Claim/ }).click()
  await page.getByRole('button', { name: /Confirm CLAIM/i }).click()

  await expect(page.locator('text=Game Over!')).toBeVisible()
  await expect(page.locator('text=You (Al Swearengen) Wins!')).toBeVisible()
  await expect(page.locator('text=Select your final action')).not.toBeVisible()
})

test('game ends after first action with location control victory', async ({ page }) => {
  await page.goto('/')

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
            position: 2,
            gold: 3,
            totalInfluence: 8,
            isAI: false,
            actionsRemaining: 2,
          },
          {
            id: 'player-1',
            name: 'AI Player 1',
            character: { id: 'seth', name: 'Seth Bullock', ability: '' },
            position: 3,
            gold: 3,
            totalInfluence: 2,
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
            influences: {
              'player-0': i === 0 ? 3 : i === 1 ? 3 : i === 2 ? 2 : 0,
            },
            maxInfluence: 3,
          })),
        roundCount: 1,
        completedActions: [],
        pendingAction: undefined,
        message: 'Your turn',
        gameConfig: { playerCount: 2, aiDifficulty: 'medium' },
        actionHistory: [],
      },
    })
  })

  await page.getByRole('button', { name: /Claim/ }).click()
  await page.getByRole('button', { name: /Confirm CLAIM/i }).click()

  await expect(page.locator('text=Game Over!')).toBeVisible()
  await expect(page.locator('text=You (Al Swearengen) Wins!')).toBeVisible()
})

test('game continues normally when no victory condition met', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Start Game' }).click()

  await page.getByRole('button', { name: /Rest/ }).click()

  await expect(page.locator('text=Select your final action')).toBeVisible()
  await expect(page.locator('text=Game Over!')).not.toBeVisible()
})
