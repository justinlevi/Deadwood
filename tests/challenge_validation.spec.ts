import { test, expect } from '@playwright/test'

test('cannot challenge player with no influence', async ({ page }) => {
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
            character: {
              id: 'seth',
              name: 'Seth Bullock',
              ability: 'Challenge costs 1 gold',
            },
            position: 0,
            gold: 3,
            totalInfluence: 0,
            isAI: false,
            actionsRemaining: 2,
          },
          {
            id: 'player-1',
            name: 'AI Player 1',
            color: '#000',
            character: { id: 'al', name: 'Al Swearengen', ability: '' },
            position: 0,
            gold: 3,
            totalInfluence: 0,
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
            influences: {},
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

  const challengeButton = page.getByRole('button', { name: /Challenge/ })
  await expect(challengeButton).toBeDisabled()

  const goldElement = page
    .locator('text=Gold:')
    .locator('..')
    .locator('strong')
    .first()
  await expect(goldElement).toHaveText('3')
})

test('challenge only deducts gold when successful', async ({ page }) => {
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
            character: {
              id: 'seth',
              name: 'Seth Bullock',
              ability: 'Challenge costs 1 gold',
            },
            position: 0,
            gold: 3,
            totalInfluence: 0,
            isAI: false,
            actionsRemaining: 2,
          },
          {
            id: 'player-1',
            name: 'AI Player 1',
            color: '#000',
            character: { id: 'al', name: 'Al Swearengen', ability: '' },
            position: 0,
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
            influences: i === 0 ? { 'player-1': 2 } : {},
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

  const challengeButton = page.getByRole('button', { name: /Challenge/ })
  await expect(challengeButton).toBeEnabled()

  await challengeButton.click()
  await page.getByRole('heading', { name: 'Gem Saloon' }).click()
  await page.getByRole('button', { name: /Confirm challenge/i }).click()

  const goldElement = page
    .locator('text=Gold:')
    .locator('..')
    .locator('strong')
    .first()
  await expect(goldElement).toHaveText('2')

  const gemSaloon = page
    .locator('div')
    .filter({ has: page.locator('h3:text("Gem Saloon")') })
    .first()
  const starCount = await gemSaloon.locator('text=★').count()
  expect(starCount).toBeGreaterThan(0)
})
