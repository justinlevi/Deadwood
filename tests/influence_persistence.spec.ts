import { test, expect } from '@playwright/test'

async function startGame(page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Start Game' }).click()
  await expect(page.locator('text=Round 1 \u2022')).toBeVisible()
}

function getLocationCard(page, name: string) {
  return page
    .locator('div')
    .filter({ has: page.locator(`h3:text("${name}")`) })
    .first()
}

test('influence stars persist after reaching three', async ({ page }) => {
  await startGame(page)

  // Claim 2 influence at starting location
  await page.getByRole('button', { name: /Claim/ }).click()
  await page.locator('select').selectOption('2')
  await page.getByRole('button', { name: /Confirm claim/i }).click()

  // End turn with a rest
  await page.getByRole('button', { name: /Rest/ }).click()
  await page.getByRole('button', { name: /Rest/ }).click()
  await expect(page.locator('text=AI Player')).toBeVisible()
  await page.waitForTimeout(1000)

  // Start of next round - claim 1 more to reach 3
  await page.getByRole('button', { name: /Claim/ }).click()
  await page.locator('select').selectOption('1')
  await page.getByRole('button', { name: /Confirm claim/i }).click()

  // Rest to end turn
  await page.getByRole('button', { name: /Rest/ }).click()
  await expect(page.locator('text=AI Player')).toBeVisible()
  await page.waitForTimeout(1000)

  const gemSaloon = getLocationCard(page, 'Gem Saloon')
  const starText = await gemSaloon.locator('text=★★★').first().textContent()
  expect(starText).toBe('★★★')
})

