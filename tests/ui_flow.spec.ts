import { test, expect } from '@playwright/test'

const locations = ['Gem Saloon', 'Hardware Store', 'Bella Union', 'Sheriff Office', 'Freight Office', "Wu's Pig Alley"]

async function startGame(page) {
  await page.addInitScript(() => {
    Math.random = () => 0.1
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'Start Game' }).click()
  await expect(page.locator('text=Turn 1')).toBeVisible()
}

function getCurrentPlayerInfo(page) {
  return page.locator('div').filter({ hasText: 'Gold:' }).locator('..')
}

async function getInfluence(page) {
  const text = await page.getByText('Influence:', { exact: false }).locator('strong').textContent()
  return parseInt(text || '0', 10)
}

test('starting the game with default options', async ({ page }) => {
  await page.addInitScript(() => {
    Math.random = () => 0.1
  })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Deadwood Showdown' })).toBeVisible()
  const selects = page.locator('select')
  await expect(selects.nth(0)).toHaveValue('2')
  await expect(selects.nth(1)).toHaveValue('medium')
  await page.getByRole('button', { name: 'Start Game' }).click()
  await expect(page.locator('text=Turn 1')).toBeVisible()
})

test('moving to another location and claiming influence', async ({ page }) => {
  await startGame(page)
  await page.getByRole('button', { name: /Move/ }).click()
  for (const name of locations) {
    await page.getByRole('heading', { name }).click()
    const confirm = page.getByRole('button', { name: /Confirm MOVE/i })
    if (await confirm.isEnabled()) {
      await confirm.click()
      break
    }
  }
  await page.getByRole('button', { name: /Claim/ }).click()
  await page.getByRole('button', { name: /Confirm CLAIM/i }).click()
  await expect.poll(() => getInfluence(page)).toBeGreaterThan(0)
})

test('resting adds gold', async ({ page }) => {
  await startGame(page)
  const info = getCurrentPlayerInfo(page)
  const initialGold = parseInt(await info.getByText(/Gold:/).locator('strong').textContent() || '0', 10)
  await page.getByRole('button', { name: /Rest/ }).click()
  const goldAfter = parseInt(await info.getByText(/Gold:/).locator('strong').textContent() || '0', 10)
  expect(goldAfter).toBe(initialGold + 2)
})

