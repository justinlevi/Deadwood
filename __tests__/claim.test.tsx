import { executeAction, createInitialBoard, CHARACTERS, ActionType, GamePhase } from '../src/gameLogic';
import type { GameState, Player } from '../src/gameLogic';

function createState(): GameState {
  const player: Player = {
    id: 'p1',
    name: 'P1',
    character: CHARACTERS[0],
    position: 0,
    gold: 3,
    totalInfluence: 0,
    isAI: false,
    actionsRemaining: 2
  };
  return {
    phase: GamePhase.PLAYER_TURN,
    currentPlayer: 0,
    players: [player],
    board: createInitialBoard(),
    turnCount: 1,
    gameConfig: { playerCount: 1, aiDifficulty: 'medium' },
    actionHistory: [],
    completedActions: [],
    pendingAction: undefined,
    message: ''
  };
}

describe('Claim Action', () => {
  test('claiming influence spends gold and increases influence', () => {
    const state = createState();
    const newState = executeAction(state, { type: ActionType.CLAIM, amount: 2 });
    expect(newState.board[0].influences['p1']).toBe(2);
    expect(newState.players[0].gold).toBe(1);
    expect(newState.players[0].totalInfluence).toBe(2);
  });

  test('cannot exceed location max influence', () => {
    const state = createState();
    state.board[0].influences['p1'] = 2;
    const newState = executeAction(state, { type: ActionType.CLAIM, amount: 2 });
    expect(newState.board[0].influences['p1']).toBe(3);
  });
});
