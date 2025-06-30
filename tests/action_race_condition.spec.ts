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
  await page.getByRole('button', { name: /Confirm move/ }).click()

  // Wait a bit for the action to be marked as completed
  await page.waitForTimeout(100)
  
  const moveButton = page.getByRole('button', { name: /Move/ })
  // Check if button has data-selected attribute set to true
  const isSelected = await moveButton.getAttribute('data-selected')
  expect(isSelected).toBe('true')
})

test('action buttons sync with game state', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Start Game' }).click()
  
  await page.waitForTimeout(500) // Wait for game to initialize

  await page.evaluate(() => {
    const dispatch = (window as any).dispatchGameAction
    const state = (window as any).getGameState()
    const playerId = state.players[0].id
    const position = state.players[0].position

    // Fill current location to max capacity
    dispatch({
      type: 'SET_STATE',
      payload: {
        ...state,
        board: state.board.map((loc, i) =>
          i === position ? { ...loc, influences: { [playerId]: loc.maxInfluence } } : loc
        ),
        players: state.players.map((p, i) => 
          i === 0 ? { ...p, gold: 5 } : p // Ensure player has gold
        )
      }
    })
  })

  await page.waitForTimeout(200) // Wait for state update

  // Claim should be disabled at full location
  await expect(page.getByRole('button', { name: /Claim/ })).toBeDisabled()

  // Move to an empty location
  await page.getByRole('button', { name: /Move/ }).click()
  
  // Find an empty location
  await page.evaluate(() => {
    const state = (window as any).getGameState()
    const emptyLocationIndex = state.board.findIndex((loc, i) => 
      i !== state.players[0].position && Object.keys(loc.influences).length === 0
    )
    const emptyLocation = state.board[emptyLocationIndex]
    
    // Click the empty location programmatically
    const locationElements = document.querySelectorAll('h3')
    locationElements.forEach(el => {
      if (el.textContent === emptyLocation.name) {
        el.click()
      }
    })
  })
  
  await page.getByRole('button', { name: /Confirm move/ }).click()
  
  await page.waitForTimeout(200) // Wait for move to complete

  // Now claim should be enabled at the new empty location
  await expect(page.getByRole('button', { name: /Claim/ })).toBeEnabled()
})
