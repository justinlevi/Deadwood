import { test, expect } from '@playwright/test'

// Wait for AI to finish its queued actions
async function waitForAI(page, ms = 5000) {
  await page.waitForTimeout(ms)
}

test('AI completes its turn automatically', async ({ page }) => {
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
            name: 'AI 1',
            color: '#000',
            position: 0,
            gold: 3,
            totalInfluence: 0,
            isAI: true,
            character: { id: 'al', name: 'Al', ability: '' },
            actionsRemaining: 2,
          },
          {
            id: 'player-1',
            name: 'AI 2',
            color: '#000',
            position: 1,
            gold: 3,
            totalInfluence: 0,
            isAI: true,
            character: { id: 'seth', name: 'Seth', ability: '' },
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
        roundCount: 1,
        completedActions: [],
        pendingAction: undefined,
        message: "AI 1's turn",
        gameConfig: { playerCount: 2, aiDifficulty: 'medium' },
        actionHistory: [],
      },
    })
  })

  await waitForAI(page)

  const state = await page.evaluate(() => (window as any).getGameState())
  expect(state.pendingAction).toBeUndefined()
  expect(state.currentPlayer).toBe(1)
})
