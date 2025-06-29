import { test, expect } from '@playwright/test'

test('claim amount dropdown shows correct options', async ({ page }) => {
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
            character: { id: 'al', name: 'Al Swearengen', ability: '' },
            position: 0,
            gold: 2,
            totalInfluence: 0,
            isAI: false,
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
            influences: i === 0 ? { 'player-0': 1 } : {},
            maxInfluence: 3,
          })),
        turnCount: 1,
        completedActions: [],
        pendingAction: undefined,
        message: 'Your turn',
        gameConfig: { playerCount: 1, aiDifficulty: 'medium' },
      },
    })
  })

  await page.getByRole('button', { name: /Claim/ }).click()

  const dropdown = page.locator('select')

  await expect(dropdown.locator('option:not([disabled])').nth(0)).toHaveText(
    '1 Gold = 1 Influence'
  )
  await expect(dropdown.locator('option:not([disabled])').nth(1)).toHaveText(
    '2 Gold = 2 Influence'
  )

  const option3 = dropdown.locator('option[value="3"]')
  await expect(option3).toBeDisabled()
  await expect(option3).toHaveText('3 Gold (Not available)')
})

test('claim validation prevents overspending', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Start Game' }).click()

  await page.evaluate(() => {
    const dispatch = (window as any).dispatchGameAction
    const state = (window as any).getGameState()

    dispatch({
      type: 'SET_STATE',
      payload: {
        ...state,
        players: state.players.map((p: any, i: number) =>
          i === 0 ? { ...p, gold: 1 } : p
        ),
      },
    })
  })

  await page.getByRole('button', { name: /Claim/ }).click()

  const dropdown = page.locator('select')
  await expect(dropdown.locator('option[value="2"]')).toBeDisabled()

  await dropdown.selectOption('1')
  await page.getByRole('button', { name: /Confirm claim/i }).click()

  const goldElement = page.locator('text=Gold:').locator('..').locator('strong').first()
  await expect(goldElement).toHaveText('0')
})

test('location full prevents claiming', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Start Game' }).click()

  await page.evaluate(() => {
    const dispatch = (window as any).dispatchGameAction
    const state = (window as any).getGameState()
    const playerId = state.players[0].id
    const position = state.players[0].position

    dispatch({
      type: 'SET_STATE',
      payload: {
        ...state,
        board: state.board.map((loc: any, i: number) =>
          i === position ? { ...loc, influences: { [playerId]: 3 } } : loc
        ),
      },
    })
  })

  const claimButton = page.getByRole('button', { name: /Claim/ })
  await expect(claimButton).toBeDisabled()
})
