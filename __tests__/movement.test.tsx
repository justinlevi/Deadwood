import { executeAction, createInitialBoard, CHARACTERS, ActionType, GamePhase } from '../src/gameLogic';
import type { GameState, Player } from '../src/gameLogic';

function createState(charId: string, position = 0, gold = 3): GameState {
  const player: Player = {
    id: 'p1',
    name: 'P1',
    character: CHARACTERS.find(c => c.id === charId)!,
    position,
    gold,
    totalInfluence: 0,
    isAI: false,
    actionsRemaining: 2
  };
  const other: Player = {
    id: 'p2',
    name: 'P2',
    character: CHARACTERS.find(c => c.id === 'al')!,
    position: 0,
    gold: 3,
    totalInfluence: 0,
    isAI: true,
    actionsRemaining: 2
  };
  return {
    phase: GamePhase.PLAYER_TURN,
    currentPlayer: 0,
    players: [player, other],
    board: createInitialBoard(),
    turnCount: 1,
    gameConfig: { playerCount: 2, aiDifficulty: 'medium' },
    actionHistory: [],
    completedActions: [],
    pendingAction: undefined,
    message: ''
  };
}

describe('Movement', () => {
  test('moving to adjacent location is free', () => {
    const state = createState('al', 0, 3);
    const newState = executeAction(state, { type: ActionType.MOVE, target: 1 });
    expect(newState.players[0].position).toBe(1);
    expect(newState.players[0].gold).toBe(3);
  });

  test('moving to non-adjacent location costs 1 gold', () => {
    const state = createState('al', 0, 3);
    const newState = executeAction(state, { type: ActionType.MOVE, target: 2 });
    expect(newState.players[0].position).toBe(2);
    expect(newState.players[0].gold).toBe(2);
  });

  test('Calamity Jane moves anywhere for free', () => {
    const state = createState('jane', 0, 1);
    const newState = executeAction(state, { type: ActionType.MOVE, target: 5 });
    expect(newState.players[0].position).toBe(5);
    expect(newState.players[0].gold).toBe(1);
  });
});
