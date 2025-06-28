import { checkVictoryConditions, createInitialBoard, CHARACTERS, GamePhase, ActionType, executeAction } from '../src/gameLogic';
import type { GameState, Player } from '../src/gameLogic';

function basePlayer(): Player {
  return {
    id: 'p1',
    name: 'P1',
    character: CHARACTERS[0],
    position: 2,
    gold: 3,
    totalInfluence: 0,
    isAI: false,
    actionsRemaining: 2
  };
}

function baseState(board = createInitialBoard()): GameState {
  return {
    phase: GamePhase.PLAYER_TURN,
    currentPlayer: 0,
    players: [basePlayer()],
    board,
    turnCount: 1,
    gameConfig: { playerCount: 1, aiDifficulty: 'medium' },
    actionHistory: [],
    completedActions: [],
    pendingAction: undefined,
    message: ''
  };
}

describe('Victory Conditions', () => {
  test('win by controlling three locations', () => {
    const board = createInitialBoard();
    board[0].influences['p1'] = 3;
    board[1].influences['p1'] = 3;
    board[2].influences['p1'] = 2;
    const state = baseState(board);
    state.players[0].position = 2;
    state.players[0].totalInfluence = 8;
    const newState = executeAction(state, { type: ActionType.CLAIM, amount: 1 });
    const winner = checkVictoryConditions(newState);
    expect(winner).toBe(0);
  });

  test('win by reaching 12 total influence', () => {
    const board = createInitialBoard();
    board[0].influences['p1'] = 3;
    board[1].influences['p1'] = 3;
    board[2].influences['p1'] = 3;
    board[3].influences['p1'] = 2;
    const state = baseState(board);
    state.players[0].position = 3;
    state.players[0].totalInfluence = 11;
    const newState = executeAction(state, { type: ActionType.CLAIM, amount: 1 });
    const winner = checkVictoryConditions(newState);
    expect(winner).toBe(0);
  });
});
