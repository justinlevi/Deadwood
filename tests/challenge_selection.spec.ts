import { test, expect } from '@playwright/test'

async function startGame(page) {
  await page.addInitScript(() => {
    Math.random = () => 0.1
  })
  await page.goto('/')
  await page.locator('select').first().selectOption('3')
  await page.getByRole('button', { name: 'Start Game' }).click()
  await expect(page.locator('text=Round 1 •')).toBeVisible()
}

test('select challenge target when multiple players present', async ({ page }) => {
  await startGame(page)

  // put all players at Gem Saloon with influence
  await page.evaluate(() => {
    const dispatch = (window as any).dispatchGameAction
    const getState = (window as any).getGameState
    const state = getState()
    dispatch({
      type: 'SET_STATE',
      payload: {
        ...state,
        players: state.players.map((p: any, i: number) => ({
          ...p,
          position: 0,
          gold: 5
        })),
        board: state.board.map((loc: any, idx: number) =>
          idx === 0
            ? { ...loc, influences: { 'player-1': 2, 'player-2': 1 } }
            : loc
        )
      }
    })
  })

  // choose challenge
  await page.getByRole('button', { name: /Challenge/ }).click()
  await page.getByRole('heading', { name: 'Gem Saloon' }).click()
  await expect(page.getByText('Select target to challenge')).toBeVisible()

  const buttons = page.locator('button').filter({ hasText: 'AI Player' })
  await expect(buttons).toHaveCount(2)
  await buttons.nth(1).click()
  await page.getByRole('button', { name: /Confirm challenge/i }).click()

  await expect(page.locator('text=Select your final action')).toBeVisible()
})
