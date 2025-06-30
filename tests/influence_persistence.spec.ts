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
  await expect(page.locator('div').filter({ hasText: /^Round \d/ }).first()).toBeVisible()
  await page.waitForTimeout(1000)

  // Start of next round - claim 1 more to reach 3
  await page.getByRole('button', { name: /Claim/ }).click()
  await page.locator('select').selectOption('1')
  await page.getByRole('button', { name: /Confirm claim/i }).click()

  // Rest to end turn
  await page.getByRole('button', { name: /Rest/ }).click()
  await expect(page.locator('div').filter({ hasText: /^Round \d/ }).first()).toBeVisible()
  await page.waitForTimeout(1000)

  const gemSaloon = getLocationCard(page, 'Gem Saloon')
  // Check for 3 influence stars - look for the influence element with data-current attribute
  const influenceElement = gemSaloon.locator('[data-current="true"]').filter({ hasText: /★+/ })
  const influenceDisplay = await influenceElement.textContent()
  expect(influenceDisplay).toBe('★★★')
})

test('influence stars remain after player moves away', async ({ page }) => {
  await startGame(page)

  await page.getByRole('button', { name: /Claim/ }).click()
  await page.locator('select').selectOption('1')
  await page.getByRole('button', { name: /Confirm claim/i }).click()

  // Move to a different location and end turn
  await page.getByRole('button', { name: /Move/ }).click()
  await page.getByRole('heading', { name: 'Hardware Store' }).click()
  await page.getByRole('button', { name: /Confirm move/i }).click()
  await page.getByRole('button', { name: /Rest/ }).click()
  await expect(page.locator('div').filter({ hasText: /^Round \d/ }).first()).toBeVisible()
  await page.waitForTimeout(1000)

  const gemSaloon = getLocationCard(page, 'Gem Saloon')
  // Check for influence stars - look for the influence element with data-current attribute
  const influenceElement = gemSaloon.locator('[data-current="true"]').filter({ hasText: /★+/ })
  const influenceDisplay = await influenceElement.textContent()
  expect(influenceDisplay).toBe('★')
})

