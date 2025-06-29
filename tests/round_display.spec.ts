import { test, expect } from '@playwright/test'

test('displays round information clearly', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Start Game' }).click()

  await expect(page.locator('text=Round 1 of 20')).toBeVisible()
  await expect(page.locator('text=/Player 1 of 2/')).toBeVisible()

  await page.getByRole('button', { name: /Rest/ }).click()
  await page.getByRole('button', { name: /Rest/ }).click()

  await expect(page.locator('text=Round 1 of 20')).toBeVisible()
  await expect(page.locator('text=/Player 2 of 2/')).toBeVisible()

  await page.waitForTimeout(5000)

  await expect(page.locator('text=Round 2 of 20')).toBeVisible()
  await expect(page.locator('text=/Player 1 of 2/')).toBeVisible()
})

test('game ends after 20 complete rounds', async ({ page }) => {
  await page.goto('/')

  await page.evaluate(() => {
    const dispatch = (window as any).dispatchGameAction
    const GamePhase = (window as any).GamePhase

    dispatch({
      type: 'SET_STATE',
      payload: {
        phase: GamePhase.PLAYER_TURN,
        currentPlayer: 1,
        players: [
          {
            id: 'player-0',
            name: 'You',
            color: '#000',
            character: { id: 'al', name: 'Al Swearengen', ability: '' },
            position: 0,
            gold: 10,
            totalInfluence: 8,
            isAI: false,
            actionsRemaining: 2,
          },
          {
            id: 'player-1',
            name: 'AI Player 1',
            color: '#000',
            character: { id: 'seth', name: 'Seth Bullock', ability: '' },
            position: 1,
            gold: 5,
            totalInfluence: 6,
            isAI: true,
            actionsRemaining: 2,
          },
        ],
        board: Array(6).fill(null).map((_, i) => ({
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
        roundCount: 20,
        completedActions: [],
        pendingAction: undefined,
        message: "Round 20 • AI Player 1's turn",
        gameConfig: { playerCount: 2, aiDifficulty: 'medium' },
      },
    })
  })

  await page.waitForTimeout(5000)

  await expect(page.locator('text=Game Over!')).toBeVisible()
  await expect(page.locator('text=wins!')).toBeVisible()
})

test('round counter visible in all game states', async ({ page }) => {
  await page.goto('/')
  await page.locator('select').first().selectOption('4')
  await page.getByRole('button', { name: 'Start Game' }).click()

  for (let i = 0; i < 8; i++) {
    await expect(page.locator('text=/Round \\d of/')).toBeVisible()
    await expect(page.locator('text=/Player \\d of 4/')).toBeVisible()

    const isHuman = await page.locator('text=Your turn').count() > 0
    if (isHuman) {
      await page.getByRole('button', { name: /Rest/ }).click()
      await page.getByRole('button', { name: /Rest/ }).click()
    } else {
      await page.waitForTimeout(5000)
    }
  }

  await expect(page.locator('text=Round 3 of 20')).toBeVisible()
})
