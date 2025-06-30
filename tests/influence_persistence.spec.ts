import { test, expect } from '@playwright/test'
import { startGameWithState, createDefaultGameState } from './helpers/gameStateHelper'

function getLocationCard(page, name: string) {
  return page
    .locator('div')
    .filter({ has: page.locator(`h3:text("${name}")`) })
    .first()
}

test('influence stars display correctly', async ({ page }) => {
  const state = createDefaultGameState()
  state.board[0].influences['player-0'] = 3
  state.players[0].totalInfluence = 3
  await startGameWithState(page, state)

  const gemSaloon = getLocationCard(page, 'Gem Saloon')
  // Check for 3 influence stars
  const influenceElement = gemSaloon.locator('div[data-current="true"]').filter({ hasText: /^★+$/ })
  const influenceDisplay = await influenceElement.textContent()
  expect(influenceDisplay).toBe('★★★')
})

test('influence persists after player moves', async ({ page }) => {
  const state = createDefaultGameState()
  state.board[0].influences['player-0'] = 1 // Player has 1 influence at Gem Saloon
  state.players[0].position = 1 // Player is now at Hardware Store
  state.players[0].totalInfluence = 1
  await startGameWithState(page, state)

  const gemSaloon = getLocationCard(page, 'Gem Saloon')
  // Check for influence star - should still be there even though player moved
  const influenceElements = gemSaloon.locator('div').filter({ hasText: /^★+$/ })
  const count = await influenceElements.count()
  expect(count).toBeGreaterThan(0)
  
  // Get the first influence element and check it has one star
  const firstInfluence = await influenceElements.first().textContent()
  expect(firstInfluence).toBe('★')
})

test('multiple players influence at same location', async ({ page }) => {
  const state = createDefaultGameState()
  state.board[2].influences = {
    'player-0': 2,
    'player-1': 1
  }
  await startGameWithState(page, state)

  const bellaUnion = getLocationCard(page, 'Bella Union')
  
  // Should show both players' influence
  const allInfluence = await bellaUnion.locator('div').filter({ hasText: /^★+$/ }).allTextContents()
  expect(allInfluence).toContain('★★') // Player 0's influence
  expect(allInfluence).toContain('★')  // Player 1's influence
})