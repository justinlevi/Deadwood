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

  await page.getByRole('button', { name: /Move/ }).click()
  await page.getByRole('heading', { name: 'Gem Saloon' }).click()
  await page.getByRole('button', { name: /Confirm move/i }).click()

  const alInfo = page.locator('text=Al').locator('..')
  const goldText = await alInfo.getByText(/Gold:/).textContent()
  expect(goldText).toContain('4')
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

  await page.getByRole('button', { name: /Move/ }).click()
  await page.getByRole('heading', { name: 'Gem Saloon' }).click()
  await page.getByRole('button', { name: /Confirm move/i }).click()

  const gold = await page.locator('text=Gold:').locator('strong').first().textContent()
  expect(gold).toBe('3')
})
