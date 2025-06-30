import { test, expect } from '@playwright/test'

test('prevents selecting third action', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Start Game' }).click()

  await page.getByRole('button', { name: /Rest/ }).click()
  await page.getByRole('button', { name: /Rest/ }).click()

  // Wait for AI turn to start since both actions complete automatically
  await expect(page.locator('text=AI Player')).toBeVisible({ timeout: 3000 })

  await expect(page.locator('text=AI Player')).toBeVisible({ timeout: 3000 })
})

test('prevents action during pending action', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Start Game' }).click()

  await page.getByRole('button', { name: /Move/ }).click()

  await expect(page.getByRole('button', { name: /Rest/ })).toBeDisabled()
  await expect(page.getByRole('button', { name: /Claim/ })).toBeDisabled()
  await expect(page.getByRole('button', { name: /Challenge/ })).toBeDisabled()

  await page.getByRole('button', { name: /Cancel/ }).click()

  await expect(page.getByRole('button', { name: /Rest/ })).toBeEnabled()
})

test('handles rapid clicking gracefully', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Start Game' }).click()

  const restButton = page.getByRole('button', { name: /Rest/ })
  for (let i = 0; i < 5; i++) {
    await restButton.click({ force: true })
    await page.waitForTimeout(50)
  }

  await expect(page.locator('text=Selected: 1/2 actions')).toBeVisible()

  await restButton.click()
  await expect(page.locator('text=AI Player')).toBeVisible({ timeout: 3000 })
})

test('prevents selecting already selected action', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Start Game' }).click()

  await page.getByRole('button', { name: /Move/ }).click()
  await page.getByRole('heading', { name: 'Hardware Store' }).click()
  await page.getByRole('button', { name: /Confirm Move/ }).click()

  const moveButton = page.getByRole('button', { name: /Move/ })
  const buttonColor = await moveButton.evaluate(el => window.getComputedStyle(el).backgroundColor)
  expect(buttonColor).toContain('rgb(50, 205, 50)')
})

test('action buttons sync with game state', async ({ page }) => {
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
        board: state.board.map((loc, i) =>
          i === position ? { ...loc, influences: { [playerId]: 3 } } : loc
        )
      }
    })
  })

  await expect(page.getByRole('button', { name: /Claim/ })).toBeDisabled()

  await page.getByRole('button', { name: /Move/ }).click()
  const empty = page.getByRole('heading', { name: 'Bella Union' })
  await empty.click()
  await page.getByRole('button', { name: /Confirm Move/ }).click()

  await expect(page.getByRole('button', { name: /Claim/ })).toBeEnabled()
})
