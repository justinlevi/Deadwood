import { test, expect } from '@playwright/test'

async function startGame(page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Start Game' }).click()
  await expect(page.locator('text=Round 1 \u2022')).toBeVisible()
}

test('displays colored stars for each player', async ({ page }) => {
  // Set a larger viewport to ensure desktop layout
  await page.setViewportSize({ width: 1280, height: 800 })
  await startGame(page)

  // Wait for the game to fully load
  await expect(page.locator('text=Round 1').first()).toBeVisible()
  await page.waitForTimeout(500)

  // Check current player display - look for star symbol
  const currentPlayerSection = page.locator('div').filter({
    has: page.locator('text=/Your turn|You/')
  }).first()
  
  // Should see a star somewhere in the current player display
  await expect(currentPlayerSection.locator('text=★').first()).toBeVisible()

  // Check other players display - look for AI players with stars
  const otherPlayersSection = page.locator('div').filter({
    has: page.locator('text=/AI Player/')
  })
  
  // Should have at least one other player visible
  await expect(otherPlayersSection.first()).toBeVisible()
  
  // Each other player should have a star
  const firstOtherPlayer = otherPlayersSection.first()
  await expect(firstOtherPlayer.locator('text=★').first()).toBeVisible()
})
