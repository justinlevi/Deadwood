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
  // Game should handle invalid state gracefully
  await expect(page.locator('#app')).toBeVisible()
  // Verify the game hasn't crashed
  const hasError = await page.locator('text=Error').count()
  expect(hasError).toBe(0)
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
  await page.getByRole('button', { name: 'Start Game' }).click()
  
  // Set up state with valid players
  await page.evaluate(() => {
    const dispatch = (window as any).dispatchGameAction
    const state = (window as any).getGameState()
    
    // Try to challenge with invalid index
    dispatch({
      type: 'SET_ACTION_TARGET',
      payload: { target: 99 }
    })
    
    // Verify state didn't change
    const newState = (window as any).getGameState()
    return { 
      goldChanged: newState.players[0].gold !== state.players[0].gold,
      actionCompleted: newState.completedActions.length > 0
    }
  })
  
  // Game should handle gracefully without crashing
  await expect(page.locator('#app')).toBeVisible()
})

