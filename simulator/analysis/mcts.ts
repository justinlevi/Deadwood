import type { GameState, PendingAction, GameAction } from '../../src/game/types'
import { ActionType } from '../../src/game/types'
import gameReducer from '../core/game-reducer-wrapper'
import {
  getLocationInfluence,
  getChallengeCost,
  canChallenge,
  getMoveCost,
} from '../../src/game/utils'
import { LOCATIONS } from '../../src/game/board'
import { randomAI } from '../ai/strategies'

interface MCTSNode {
  state: GameState
  parent: MCTSNode | null
  children: Map<string, MCTSNode>
  action?: PendingAction
  visits: number
  totalScore: number
  playerIndex: number
  untriedActions: PendingAction[]
}

export class MonteCarloTreeSearch {
  private explorationConstant: number = Math.sqrt(2)
  private maxIterations: number = 1000
  private maxDepth: number = 20

  constructor(explorationConstant?: number, maxIterations?: number) {
    if (explorationConstant !== undefined)
      this.explorationConstant = explorationConstant
    if (maxIterations !== undefined) this.maxIterations = maxIterations
  }

  findBestActions(state: GameState, playerIndex: number): PendingAction[] {
    // Create root node
    const root: MCTSNode = {
      state,
      parent: null,
      children: new Map(),
      visits: 0,
      totalScore: 0,
      playerIndex,
      untriedActions: this.getPossibleActions(state, playerIndex),
    }

    // Run MCTS iterations
    for (let i = 0; i < this.maxIterations; i++) {
      const node = this.select(root)
      const score = this.simulate(node)
      this.backpropagate(node, score)
    }

    // Select best two actions based on visit count
    const actionScores: Array<{ action: PendingAction; visits: number }> = []

    root.children.forEach((child, actionKey) => {
      if (child.action) {
        actionScores.push({
          action: child.action,
          visits: child.visits,
        })
      }
    })

    // Sort by visit count (most visited = best)
    actionScores.sort((a, b) => b.visits - a.visits)

    // Return top 2 actions
    return actionScores.slice(0, 2).map((a) => a.action)
  }

  private select(node: MCTSNode): MCTSNode {
    // Selection phase: traverse tree using UCB1
    let current = node
    let depth = 0

    while (
      current.untriedActions.length === 0 &&
      current.children.size > 0 &&
      depth < this.maxDepth
    ) {
      current = this.selectBestChild(current)
      depth++
    }

    // Expansion phase: add a new child
    if (current.untriedActions.length > 0 && depth < this.maxDepth) {
      const actionIndex = Math.floor(
        Math.random() * current.untriedActions.length
      )
      const action = current.untriedActions[actionIndex]
      current.untriedActions.splice(actionIndex, 1)

      const newState = this.applyAction(current.state, action)
      const child: MCTSNode = {
        state: newState,
        parent: current,
        children: new Map(),
        action,
        visits: 0,
        totalScore: 0,
        playerIndex: current.playerIndex,
        untriedActions: [],
      }

      const actionKey = this.actionToKey(action)
      current.children.set(actionKey, child)
      return child
    }

    return current
  }

  private selectBestChild(node: MCTSNode): MCTSNode {
    let bestChild: MCTSNode | null = null
    let bestUCB = -Infinity

    node.children.forEach((child) => {
      const ucb = this.calculateUCB1(child, node.visits)
      if (ucb > bestUCB) {
        bestUCB = ucb
        bestChild = child
      }
    })

    return bestChild!
  }

  private calculateUCB1(node: MCTSNode, parentVisits: number): number {
    if (node.visits === 0) return Infinity

    const exploitation = node.totalScore / node.visits
    const exploration =
      this.explorationConstant * Math.sqrt(Math.log(parentVisits) / node.visits)

    return exploitation + exploration
  }

  private simulate(node: MCTSNode): number {
    // Simulation phase: play out random game from this position
    let state = { ...node.state }
    let depth = 0

    // Continue simulation until game over or max depth
    while (state.phase !== 'game_over' && depth < this.maxDepth) {
      const currentPlayerIndex = state.currentPlayer

      // Use random AI for simulation
      const actions = randomAI(state, currentPlayerIndex)

      // Apply actions
      for (const action of actions) {
        state = this.applyAction(state, action)
        if (state.phase === 'game_over') break
      }

      depth++
    }

    // Evaluate final position
    return this.evaluateState(state, node.playerIndex)
  }

  private backpropagate(node: MCTSNode, score: number): void {
    // Backpropagation phase: update statistics up the tree
    let current: MCTSNode | null = node

    while (current !== null) {
      current.visits++
      current.totalScore += score
      current = current.parent
    }
  }

  private applyAction(state: GameState, action: PendingAction): GameState {
    // Apply a single action to the game state
    let newState = state

    // Select action
    newState = gameReducer(newState, {
      type: 'SELECT_ACTION',
      payload: action.type,
    })

    // Set target/amount if needed
    if (action.target !== undefined || action.amount !== undefined) {
      newState = gameReducer(newState, {
        type: 'SET_ACTION_TARGET',
        payload: { target: action.target, amount: action.amount },
      })
    }

    // Confirm action
    newState = gameReducer(newState, { type: 'CONFIRM_ACTION' })

    return newState
  }

  private evaluateState(state: GameState, playerIndex: number): number {
    // Evaluate game state from perspective of playerIndex
    if (state.winner !== undefined) {
      return state.winner === playerIndex ? 1 : 0
    }

    // Heuristic evaluation
    const player = state.players[playerIndex]
    const maxInfluence = Math.max(...state.players.map((p) => p.totalInfluence))

    let score = 0

    // Influence score (0-0.4)
    score += (player.totalInfluence / 12) * 0.4

    // Relative influence (0-0.3)
    if (maxInfluence > 0) {
      score += (player.totalInfluence / maxInfluence) * 0.3
    }

    // Gold score (0-0.1)
    score += Math.min(player.gold / 10, 1) * 0.1

    // Position score (0-0.2)
    const location = state.board[player.position]
    const locationInfluence = getLocationInfluence(location, player.id)
    score += (locationInfluence / 3) * 0.2

    return Math.max(0, Math.min(1, score))
  }

  private getPossibleActions(
    state: GameState,
    playerIndex: number
  ): PendingAction[] {
    const player = state.players[playerIndex]
    const actions: PendingAction[] = []

    // Always can rest
    actions.push({ type: ActionType.REST })

    // Check claim
    const location = state.board[player.position]
    const currentInfluence = getLocationInfluence(location, player.id)
    const maxClaim = Math.min(
      player.gold,
      location.maxInfluence - currentInfluence
    )

    for (let i = 1; i <= maxClaim; i++) {
      actions.push({ type: ActionType.CLAIM, amount: i })
    }

    // Check moves
    for (let i = 0; i < LOCATIONS.length; i++) {
      if (i !== player.position) {
        const cost = getMoveCost(player, player.position, i)
        if (player.gold >= cost) {
          actions.push({ type: ActionType.MOVE, target: i })
        }
      }
    }

    // Check challenges
    if (player.gold >= getChallengeCost(player)) {
      state.players.forEach((target, targetIndex) => {
        if (targetIndex !== playerIndex && canChallenge(player, target)) {
          const targetLocation = state.board[target.position]
          if (getLocationInfluence(targetLocation, target.id) > 0) {
            actions.push({ type: ActionType.CHALLENGE, target: targetIndex })
          }
        }
      })
    }

    return actions
  }

  private actionToKey(action: PendingAction): string {
    return `${action.type}-${action.target || 0}-${action.amount || 0}`
  }
}

// MCTS-based AI strategy
export const mctsAI = (
  state: GameState,
  playerIndex: number
): PendingAction[] => {
  const mcts = new MonteCarloTreeSearch(1.4, 500) // Tuned parameters
  const actions = mcts.findBestActions(state, playerIndex)

  // Ensure we return exactly 2 actions
  while (actions.length < 2) {
    actions.push({ type: ActionType.REST })
  }

  return actions.slice(0, 2)
}
