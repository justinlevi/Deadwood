import { test, expect } from '@playwright/test'

async function startGame(page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Start Game' }).click()
  await expect(page.locator('text=Round 1 \u2022')).toBeVisible()
}

test('displays colored stars for each player', async ({ page }) => {
  await startGame(page)

  const currentStar = page.getByTestId('current-player-star')
  await expect(currentStar).toBeVisible()

  const others = page.getByTestId(/other-player-/)
  await expect(others.first().getByTestId('player-star')).toBeVisible()
})
