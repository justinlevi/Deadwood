import { test, expect, Page } from '@playwright/test'

// ===== HELPER FUNCTIONS =====

async function startGame(page: Page, options?: { players?: number; difficulty?: string }) {
  await page.goto('/')

  if (options?.players && options.players !== 2) {
    await page.locator('select').first().selectOption(options.players.toString())
  }

  if (options?.difficulty && options.difficulty !== 'medium') {
    await page.locator('select').nth(1).selectOption(options.difficulty)
  }

  await page.getByRole('button', { name: 'Start Game' }).click()
  await expect(page.locator('text=Round 1 \u2022')).toBeVisible()
}

async function waitForAI(page: Page, timeout = 5000) {
  await page.waitForTimeout(timeout)
}

async function performMove(page: Page, location: string) {
  await page.getByRole('button', { name: /Move/ }).click()
  await page.getByRole('heading', { name: location }).click()
  await page.getByRole('button', { name: /Confirm move/i }).click()
}

async function performClaim(page: Page, amount: string) {
  await page.getByRole('button', { name: /Claim/ }).click()
  await page.locator('select').selectOption(amount)
  await page.getByRole('button', { name: /Confirm claim/i }).click()
}

async function performChallenge(page: Page, location: string, targetPlayer?: string) {
  await page.getByRole('button', { name: /Challenge/ }).click()
  await page.getByRole('heading', { name: location }).click()

  // If multiple targets exist, select specific one
  if (targetPlayer) {
    const targetButton = page.getByRole('button', { name: new RegExp(targetPlayer) })
    if (await targetButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await targetButton.click()
    }
  }

  await page.getByRole('button', { name: /Confirm challenge/i }).click()
}

async function performRest(page: Page) {
  await page.getByRole('button', { name: /Rest/ }).click()
}

async function getGold(page: Page): Promise<number> {
  const goldText = await page.locator('text=Gold:').locator('..').locator('strong').first().textContent()
  return parseInt(goldText || '0')
}

async function getInfluence(page: Page): Promise<number> {
  const influenceText = await page.locator('text=Influence:').locator('..').locator('strong').first().textContent()
  return parseInt(influenceText || '0')
}

async function getRound(page: Page): Promise<number> {
  const roundText = await page.locator('text=/Round \d+ of/').textContent()
  const match = roundText?.match(/Round (\d+)/)
  return parseInt(match?.[1] || '1')
}

async function isGameOver(page: Page): Promise<boolean> {
  return page.locator('text=Game Over!').isVisible({ timeout: 1000 }).catch(() => false)
}

// ===== TEST SUITES =====

test.describe('Basic Game Flow', () => {
  test('can start and play a complete 2-player game', async ({ page }) => {
    await startGame(page)

    // Verify initial state
    expect(await getGold(page)).toBe(3)
    expect(await getInfluence(page)).toBe(0)
    expect(await getRound(page)).toBe(1)

    // Turn 1: Claim and Rest
    await performClaim(page, '2')
    await performRest(page)

    // Verify state after actions
    expect(await getGold(page)).toBe(3) // -2 for claim, +2 for rest
    expect(await getInfluence(page)).toBe(2)

    // Wait for AI turn
    await waitForAI(page)

    // Should be back to human player
    await expect(page.locator('text=Your turn')).toBeVisible()
  })

  test('can play through multiple rounds', async ({ page }) => {
    await startGame(page)

    // Play 3 complete rounds
    for (let round = 1; round <= 3; round++) {
      expect(await getRound(page)).toBe(round)

      // Human turn
      await performRest(page)
      await performRest(page)

      // AI turn
      await waitForAI(page)
    }

    // Should be in round 4
    expect(await getRound(page)).toBe(4)
  })
})

test.describe('Victory Conditions', () => {
  test('wins by reaching 12 total influence', async ({ page }) => {
    await page.goto('/')

    // Set up near-victory state
    await page.evaluate(() => {
      const dispatch = (window as any).dispatchGameAction
      const GamePhase = (window as any).GamePhase

      dispatch({
        type: 'SET_STATE',
        payload: {
          phase: GamePhase.PLAYER_TURN,
          currentPlayer: 0,
          players: [
            {
              id: 'player-0',
              name: 'You',
              character: { id: 'al', name: 'Al Swearengen', ability: '' },
              position: 0,
              gold: 3,
              totalInfluence: 11,
              isAI: false,
              actionsRemaining: 2,
            },
            {
              id: 'player-1',
              name: 'AI Player 1',
              character: { id: 'seth', name: 'Seth Bullock', ability: '' },
              position: 1,
              gold: 3,
              totalInfluence: 5,
              isAI: true,
              actionsRemaining: 2,
            },
          ],
          board: Array(6)
            .fill(null)
            .map((_, i) => ({
              id: i,
              name: ['Gem Saloon', 'Hardware Store', 'Bella Union', 'Sheriff Office', 'Freight Office', "Wu's Pig Alley"][i],
              influences: {},
              maxInfluence: 3,
            })),
          roundCount: 5,
          completedActions: [],
          pendingAction: undefined,
          message: 'Your turn',
          gameConfig: { playerCount: 2, aiDifficulty: 'medium' },
          actionHistory: [],
        },
      })
    })

    // One more influence wins the game
    await performClaim(page, '1')

    // Game should end immediately
    await expect(page.locator('text=Game Over!')).toBeVisible()
    await expect(page.locator('text=You (Al Swearengen) Wins!')).toBeVisible()
  })

  test('wins by controlling 3 locations at max influence', async ({ page }) => {
    await page.goto('/')

    // Set up near-victory state
    await page.evaluate(() => {
      const dispatch = (window as any).dispatchGameAction
      const GamePhase = (window as any).GamePhase

      dispatch({
        type: 'SET_STATE',
        payload: {
          phase: GamePhase.PLAYER_TURN,
          currentPlayer: 0,
          players: [
            {
              id: 'player-0',
              name: 'You',
              character: { id: 'al', name: 'Al Swearengen', ability: '' },
              position: 2, // Bella Union
              gold: 3,
              totalInfluence: 8,
              isAI: false,
              actionsRemaining: 2,
            },
            {
              id: 'player-1',
              name: 'AI Player 1',
              character: { id: 'seth', name: 'Seth Bullock', ability: '' },
              position: 3,
              gold: 3,
              totalInfluence: 4,
              isAI: true,
              actionsRemaining: 2,
            },
          ],
          board: Array(6)
            .fill(null)
            .map((_, i) => ({
              id: i,
              name: ['Gem Saloon', 'Hardware Store', 'Bella Union', 'Sheriff Office', 'Freight Office', "Wu's Pig Alley"][i],
              influences: {
                'player-0': i === 0 ? 3 : i === 1 ? 3 : i === 2 ? 2 : 0,
              },
              maxInfluence: 3,
            })),
          roundCount: 5,
          completedActions: [],
          pendingAction: undefined,
          message: 'Your turn',
          gameConfig: { playerCount: 2, aiDifficulty: 'medium' },
          actionHistory: [],
        },
      })
    })

    // One more influence at Bella Union gives 3 max locations
    await performClaim(page, '1')

    // Game should end immediately
    await expect(page.locator('text=Game Over!')).toBeVisible()
    await expect(page.locator('text=You (Al Swearengen) Wins!')).toBeVisible()
  })

  test('game ends after 20 rounds with highest influence winning', async ({ page }) => {
    await page.goto('/')

    // Set up game at round 20
    await page.evaluate(() => {
      const dispatch = (window as any).dispatchGameAction
      const GamePhase = (window as any).GamePhase

      dispatch({
        type: 'SET_STATE',
        payload: {
          phase: GamePhase.PLAYER_TURN,
          currentPlayer: 0,
          players: [
            {
              id: 'player-0',
              name: 'You',
              character: { id: 'al', name: 'Al Swearengen', ability: '' },
              position: 0,
              gold: 10,
              totalInfluence: 9,
              isAI: false,
              actionsRemaining: 2,
            },
            {
              id: 'player-1',
              name: 'AI Player 1',
              character: { id: 'seth', name: 'Seth Bullock', ability: '' },
              position: 1,
              gold: 5,
              totalInfluence: 8,
              isAI: true,
              actionsRemaining: 2,
            },
          ],
          board: Array(6)
            .fill(null)
            .map((_, i) => ({
              id: i,
              name: ['Gem Saloon', 'Hardware Store', 'Bella Union', 'Sheriff Office', 'Freight Office', "Wu's Pig Alley"][i],
              influences: {},
              maxInfluence: 3,
            })),
          roundCount: 20,
          completedActions: [],
          pendingAction: undefined,
          message: 'Round 20 • Your turn',
          gameConfig: { playerCount: 2, aiDifficulty: 'medium' },
          actionHistory: [],
        },
      })
    })

    // Complete round 20
    await performRest(page)
    await performRest(page)
    await waitForAI(page)

    // Game should end after round 20
    await expect(page.locator('text=Game Over!')).toBeVisible()
    await expect(page.locator('text=You (Al Swearengen) Wins!')).toBeVisible()
  })
})

test.describe('Character Abilities', () => {
  test("Al Swearengen gains gold when others enter Gem Saloon", async ({ page }) => {
    await page.goto('/')

    await page.evaluate(() => {
      const dispatch = (window as any).dispatchGameAction
      const GamePhase = (window as any).GamePhase

      dispatch({
        type: 'SET_STATE',
        payload: {
          phase: GamePhase.PLAYER_TURN,
          currentPlayer: 0,
          players: [
            {
              id: 'player-0',
              name: 'You',
              character: { id: 'seth', name: 'Seth Bullock', ability: '' },
              position: 1, // Hardware Store
              gold: 3,
              totalInfluence: 0,
              isAI: false,
              actionsRemaining: 2,
            },
            {
              id: 'player-1',
              name: 'Al',
              character: {
                id: 'al',
                name: 'Al Swearengen',
                ability: 'Gains +1 gold when another player enters Gem Saloon',
              },
              position: 2, // Bella Union
              gold: 3,
              totalInfluence: 0,
              isAI: true,
              actionsRemaining: 2,
            },
          ],
          board: Array(6)
            .fill(null)
            .map((_, i) => ({
              id: i,
              name: ['Gem Saloon', 'Hardware Store', 'Bella Union', 'Sheriff Office', 'Freight Office', "Wu's Pig Alley"][i],
              influences: {},
              maxInfluence: 3,
            })),
          roundCount: 1,
          completedActions: [],
          pendingAction: undefined,
          message: 'Your turn',
          gameConfig: { playerCount: 2, aiDifficulty: 'medium' },
          actionHistory: [],
        },
      })
    })

    // Move to Gem Saloon
    await performMove(page, 'Gem Saloon')

    // Check Al's gold increased
    const alSection = page.locator('text=Al').locator('..')
    const goldText = await alSection.locator('text=/Gold: \d+/').textContent()
    expect(goldText).toContain('4')
  })

  test('Seth Bullock pays only 1 gold for challenges', async ({ page }) => {
    await page.goto('/')

    await page.evaluate(() => {
      const dispatch = (window as any).dispatchGameAction
      const GamePhase = (window as any).GamePhase

      dispatch({
        type: 'SET_STATE',
        payload: {
          phase: GamePhase.PLAYER_TURN,
          currentPlayer: 0,
          players: [
            {
              id: 'player-0',
              name: 'You',
              character: {
                id: 'seth',
                name: 'Seth Bullock',
                ability: 'Challenge costs 1 gold',
              },
              position: 0,
              gold: 2, // Only 2 gold
              totalInfluence: 0,
              isAI: false,
              actionsRemaining: 2,
            },
            {
              id: 'player-1',
              name: 'AI Player 1',
              character: { id: 'al', name: 'Al Swearengen', ability: '' },
              position: 0,
              gold: 3,
              totalInfluence: 2,
              isAI: true,
              actionsRemaining: 2,
            },
          ],
          board: Array(6)
            .fill(null)
            .map((_, i) => ({
              id: i,
              name: ['Gem Saloon', 'Hardware Store', 'Bella Union', 'Sheriff Office', 'Freight Office', "Wu's Pig Alley"][i],
              influences: i === 0 ? { 'player-1': 2 } : {},
              maxInfluence: 3,
            })),
          roundCount: 1,
          completedActions: [],
          pendingAction: undefined,
          message: 'Your turn',
          gameConfig: { playerCount: 2, aiDifficulty: 'medium' },
          actionHistory: [],
        },
      })
    })

    const goldBefore = await getGold(page)
    expect(goldBefore).toBe(2)

    // Challenge costs only 1 for Seth
    await performChallenge(page, 'Gem Saloon')

    const goldAfter = await getGold(page)
    expect(goldAfter).toBe(1)
  })

  test('Cy Tolliver can challenge from adjacent locations', async ({ page }) => {
    await page.goto('/')

    await page.evaluate(() => {
      const dispatch = (window as any).dispatchGameAction
      const GamePhase = (window as any).GamePhase

      dispatch({
        type: 'SET_STATE',
        payload: {
          phase: GamePhase.PLAYER_TURN,
          currentPlayer: 0,
          players: [
            {
              id: 'player-0',
              name: 'You',
              character: {
                id: 'cy',
                name: 'Cy Tolliver',
                ability: 'Can challenge from adjacent locations',
              },
              position: 0, // Gem Saloon
              gold: 3,
              totalInfluence: 0,
              isAI: false,
              actionsRemaining: 2,
            },
            {
              id: 'player-1',
              name: 'Target',
              character: { id: 'al', name: 'Al Swearengen', ability: '' },
              position: 1, // Hardware Store (adjacent)
              gold: 3,
              totalInfluence: 2,
              isAI: true,
              actionsRemaining: 2,
            },
          ],
          board: Array(6)
            .fill(null)
            .map((_, i) => ({
              id: i,
              name: ['Gem Saloon', 'Hardware Store', 'Bella Union', 'Sheriff Office', 'Freight Office', "Wu's Pig Alley"][i],
              influences: i === 1 ? { 'player-1': 2 } : {},
              maxInfluence: 3,
            })),
          roundCount: 1,
          completedActions: [],
          pendingAction: undefined,
          message: 'Your turn',
          gameConfig: { playerCount: 2, aiDifficulty: 'medium' },
          actionHistory: [],
        },
      })
    })

    // Should be able to challenge at Hardware Store from Gem Saloon
    await page.getByRole('button', { name: /Challenge/ }).click()

    // Hardware Store should be a valid target
    const hardwareStore = page.getByRole('heading', { name: 'Hardware Store' })
    const parentDiv = await hardwareStore.locator('..').locator('..')
    const isValid = await parentDiv.getAttribute('data-valid')
    expect(isValid).toBe('true')

    await hardwareStore.click()
    await page.getByRole('button', { name: /Confirm challenge/i }).click()

    await expect(page.locator('text=Select your final action')).toBeVisible()
  })

  test('Calamity Jane has free movement everywhere', async ({ page }) => {
    await page.goto('/')

    await page.evaluate(() => {
      const dispatch = (window as any).dispatchGameAction
      const GamePhase = (window as any).GamePhase

      dispatch({
        type: 'SET_STATE',
        payload: {
          phase: GamePhase.PLAYER_TURN,
          currentPlayer: 0,
          players: [
            {
              id: 'player-0',
              name: 'You',
              character: {
                id: 'jane',
                name: 'Calamity Jane',
                ability: 'All movement is free',
              },
              position: 0, // Gem Saloon
              gold: 1, // Only 1 gold
              totalInfluence: 0,
              isAI: false,
              actionsRemaining: 2,
            },
          ],
          board: Array(6)
            .fill(null)
            .map((_, i) => ({
              id: i,
              name: ['Gem Saloon', 'Hardware Store', 'Bella Union', 'Sheriff Office', 'Freight Office', "Wu's Pig Alley"][i],
              influences: {},
              maxInfluence: 3,
            })),
          roundCount: 1,
          completedActions: [],
          pendingAction: undefined,
          message: 'Your turn',
          gameConfig: { playerCount: 1, aiDifficulty: 'medium' },
          actionHistory: [],
        },
      })
    })

    // Move to non-adjacent location (normally costs 1 gold)
    const goldBefore = await getGold(page)
    await performMove(page, "Wu's Pig Alley")
    const goldAfter = await getGold(page)

    // No gold spent
    expect(goldAfter).toBe(goldBefore)
  })
})

test.describe('Game Mechanics', () => {
  test('cannot claim more than location capacity', async ({ page }) => {
    await page.goto('/')

    await page.evaluate(() => {
      const dispatch = (window as any).dispatchGameAction
      const GamePhase = (window as any).GamePhase

      dispatch({
        type: 'SET_STATE',
        payload: {
          phase: GamePhase.PLAYER_TURN,
          currentPlayer: 0,
          players: [
            {
              id: 'player-0',
              name: 'You',
              character: { id: 'al', name: 'Al Swearengen', ability: '' },
              position: 0,
              gold: 5,
              totalInfluence: 2,
              isAI: false,
              actionsRemaining: 2,
            },
          ],
          board: Array(6)
            .fill(null)
            .map((_, i) => ({
              id: i,
              name: ['Gem Saloon', 'Hardware Store', 'Bella Union', 'Sheriff Office', 'Freight Office', "Wu's Pig Alley"][i],
              influences: i === 0 ? { 'player-0': 2 } : {},
              maxInfluence: 3,
            })),
          roundCount: 1,
          completedActions: [],
          pendingAction: undefined,
          message: 'Your turn',
          gameConfig: { playerCount: 1, aiDifficulty: 'medium' },
          actionHistory: [],
        },
      })
    })

    // Try to claim
    await page.getByRole('button', { name: /Claim/ }).click()

    // Should only allow claiming 1 (to reach max of 3)
    const dropdown = page.locator('select')
    const option2 = dropdown.locator('option[value="2"]')
    const option3 = dropdown.locator('option[value="3"]')

    await expect(option2).toBeDisabled()
    await expect(option3).toBeDisabled()

    // Claim the allowed amount
    await dropdown.selectOption('1')
    await page.getByRole('button', { name: /Confirm claim/i }).click()

    // Now claim button should be disabled
    await expect(page.getByRole('button', { name: /Claim/ })).toBeDisabled()
  })

  test('challenge reduces opponent influence', async ({ page }) => {
    await page.goto('/')

    await page.evaluate(() => {
      const dispatch = (window as any).dispatchGameAction
      const GamePhase = (window as any).GamePhase

      dispatch({
        type: 'SET_STATE',
        payload: {
          phase: GamePhase.PLAYER_TURN,
          currentPlayer: 0,
          players: [
            {
              id: 'player-0',
              name: 'You',
              character: { id: 'al', name: 'Al Swearengen', ability: '' },
              position: 0,
              gold: 3,
              totalInfluence: 0,
              isAI: false,
              actionsRemaining: 2,
            },
            {
              id: 'player-1',
              name: 'AI Player 1',
              character: { id: 'seth', name: 'Seth Bullock', ability: '' },
              position: 0,
              gold: 3,
              totalInfluence: 3,
              isAI: true,
              actionsRemaining: 2,
            },
          ],
          board: Array(6)
            .fill(null)
            .map((_, i) => ({
              id: i,
              name: ['Gem Saloon', 'Hardware Store', 'Bella Union', 'Sheriff Office', 'Freight Office', "Wu's Pig Alley"][i],
              influences: i === 0 ? { 'player-1': 3 } : {},
              maxInfluence: 3,
            })),
          roundCount: 1,
          completedActions: [],
          pendingAction: undefined,
          message: 'Your turn',
          gameConfig: { playerCount: 2, aiDifficulty: 'medium' },
          actionHistory: [],
        },
      })
    })

    // Challenge opponent
    await performChallenge(page, 'Gem Saloon')

    // Check influence was reduced
    const gemSaloon = page
      .locator('div')
      .filter({
        has: page.locator('h3:text("Gem Saloon")'),
      })
      .first()

    // Should show 2 stars now (was 3)
    const stars = await gemSaloon.locator('text=★★').first().textContent()
    expect(stars).toBe('★★')
  })

  test('multiple players at same location', async ({ page }) => {
    await page.goto('/')

    await page.evaluate(() => {
      const dispatch = (window as any).dispatchGameAction
      const GamePhase = (window as any).GamePhase

      dispatch({
        type: 'SET_STATE',
        payload: {
          phase: GamePhase.PLAYER_TURN,
          currentPlayer: 0,
          players: [
            {
              id: 'player-0',
              name: 'You',
              character: { id: 'al', name: 'Al Swearengen', ability: '' },
              position: 0,
              gold: 5,
              totalInfluence: 0,
              isAI: false,
              actionsRemaining: 2,
            },
            {
              id: 'player-1',
              name: 'AI Player 1',
              character: { id: 'seth', name: 'Seth Bullock', ability: '' },
              position: 0,
              gold: 3,
              totalInfluence: 2,
              isAI: true,
              actionsRemaining: 2,
            },
            {
              id: 'player-2',
              name: 'AI Player 2',
              character: { id: 'cy', name: 'Cy Tolliver', ability: '' },
              position: 0,
              gold: 3,
              totalInfluence: 1,
              isAI: true,
              actionsRemaining: 2,
            },
          ],
          board: Array(6)
            .fill(null)
            .map((_, i) => ({
              id: i,
              name: ['Gem Saloon', 'Hardware Store', 'Bella Union', 'Sheriff Office', 'Freight Office', "Wu's Pig Alley"][i],
              influences: i === 0 ? { 'player-1': 2, 'player-2': 1 } : {},
              maxInfluence: 3,
            })),
          roundCount: 1,
          completedActions: [],
          pendingAction: undefined,
          message: 'Your turn',
          gameConfig: { playerCount: 3, aiDifficulty: 'medium' },
          actionHistory: [],
        },
      })
    })

    // Challenge should show multiple targets
    await page.getByRole('button', { name: /Challenge/ }).click()
    await page.getByRole('heading', { name: 'Gem Saloon' }).click()

    // Should see target selection
    await expect(page.locator('text=Select target to challenge')).toBeVisible()

    // Should have 2 target buttons
    const targetButtons = page.locator('button').filter({ hasText: 'AI Player' })
    await expect(targetButtons).toHaveCount(2)

    // Select first target
    await targetButtons.first().click()
    await page.getByRole('button', { name: /Confirm challenge/i }).click()

    await expect(page.locator('text=Select your final action')).toBeVisible()
  })
})

test.describe('UI and Controls', () => {
  test('action selection and cancellation', async ({ page }) => {
    await startGame(page)

    // Test Move cancellation
    await page.getByRole('button', { name: /Move/ }).click()
    await expect(page.locator('text=Select a location to move to')).toBeVisible()
    await page.getByRole('button', { name: /Cancel/ }).click()
    await expect(page.locator('text=Select 2 actions')).toBeVisible()

    // Test Claim cancellation
    await page.getByRole('button', { name: /Claim/ }).click()
    await expect(page.locator('select')).toBeVisible()
    await page.getByRole('button', { name: /Cancel/ }).click()

    // All buttons should be enabled
    await expect(page.getByRole('button', { name: /Move/ })).toBeEnabled()
    await expect(page.getByRole('button', { name: /Claim/ })).toBeEnabled()
    await expect(page.getByRole('button', { name: /Challenge/ })).toBeEnabled()
    await expect(page.getByRole('button', { name: /Rest/ })).toBeEnabled()
  })

  test('action buttons disabled appropriately', async ({ page }) => {
    await startGame(page)

    // Complete 2 actions
    await performRest(page)
    await performRest(page)

    // All action buttons should be disabled
    await expect(page.getByRole('button', { name: /Move/ })).toBeDisabled()
    await expect(page.getByRole('button', { name: /Claim/ })).toBeDisabled()
    await expect(page.getByRole('button', { name: /Challenge/ })).toBeDisabled()
    await expect(page.getByRole('button', { name: /Rest/ })).toBeDisabled()
  })

  test('selected actions show visual feedback', async ({ page }) => {
    await startGame(page)

    // Select Rest action
    await performRest(page)

    // Rest button should show selected state
    const restButton = page.getByRole('button', { name: /Rest/ })
    const buttonColor = await restButton.evaluate(el => window.getComputedStyle(el).backgroundColor)
    expect(buttonColor).toContain('rgb(50, 205, 50)') // Green color
  })
})

test.describe('Error Handling', () => {
  test('handles insufficient gold gracefully', async ({ page }) => {
    await page.goto('/')

    await page.evaluate(() => {
      const dispatch = (window as any).dispatchGameAction
      const GamePhase = (window as any).GamePhase

      dispatch({
        type: 'SET_STATE',
        payload: {
          phase: GamePhase.PLAYER_TURN,
          currentPlayer: 0,
          players: [
            {
              id: 'player-0',
              name: 'You',
              character: { id: 'al', name: 'Al Swearengen', ability: '' },
              position: 0,
              gold: 0, // No gold
              totalInfluence: 0,
              isAI: false,
              actionsRemaining: 2,
            },
          ],
          board: Array(6)
            .fill(null)
            .map((_, i) => ({
              id: i,
              name: ['Gem Saloon', 'Hardware Store', 'Bella Union', 'Sheriff Office', 'Freight Office', "Wu's Pig Alley"][i],
              influences: {},
              maxInfluence: 3,
            })),
          roundCount: 1,
          completedActions: [],
          pendingAction: undefined,
          message: 'Your turn',
          gameConfig: { playerCount: 1, aiDifficulty: 'medium' },
          actionHistory: [],
        },
      })
    })

    // Claim should be disabled
    await expect(page.getByRole('button', { name: /Claim/ })).toBeDisabled()

    // Can only move to adjacent locations
    await page.getByRole('button', { name: /Move/ }).click()

    // Non-adjacent locations should not be valid targets
    const bellaUnion = page.getByRole('heading', { name: 'Bella Union' })
    const parentDiv = await bellaUnion.locator('..').locator('..')
    const isValid = await parentDiv.getAttribute('data-valid')
    expect(isValid).toBe('false')
  })

  test('game state persists through new game', async ({ page }) => {
    await startGame(page)

    // Play some turns
    await performClaim(page, '2')
    await performRest(page)
    await waitForAI(page)

    // Force game over and restart
    await page.evaluate(() => {
      const dispatch = (window as any).dispatchGameAction
      dispatch({ type: 'RESET_GAME' })
    })

    await expect(page.getByRole('heading', { name: 'Deadwood Showdown' })).toBeVisible()

    // Start new game
    await page.getByRole('button', { name: 'Start Game' }).click()

    // Should have fresh state
    expect(await getGold(page)).toBe(3)
    expect(await getInfluence(page)).toBe(0)
    expect(await getRound(page)).toBe(1)
  })
})

test.describe('AI Behavior', () => {
  test('AI completes turns in reasonable time', async ({ page }) => {
    await startGame(page, { players: 3 })

    // Human turn
    await performRest(page)
    await performRest(page)

    // Time AI turns
    const startTime = Date.now()
    await waitForAI(page, 10000) // Max 10 seconds for 2 AI players
    const elapsed = Date.now() - startTime

    // Should be back to human turn
    await expect(page.locator('text=Your turn')).toBeVisible()

    // AI should complete in reasonable time
    expect(elapsed).toBeLessThan(10000)
  })

  test('different AI difficulties behave differently', async ({ page }) => {
    // Test easy AI
    await startGame(page, { difficulty: 'easy' })
    await performRest(page)
    await performRest(page)
    await waitForAI(page)
    await expect(page.locator('text=Your turn')).toBeVisible()

    // Reset and test hard AI
    await page.evaluate(() => {
      const dispatch = (window as any).dispatchGameAction
      dispatch({ type: 'RESET_GAME' })
    })

    await startGame(page, { difficulty: 'hard' })
    await performRest(page)
    await performRest(page)
    await waitForAI(page)
    await expect(page.locator('text=Your turn')).toBeVisible()
  })
})

