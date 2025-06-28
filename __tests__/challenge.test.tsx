import { executeAction, createInitialBoard, CHARACTERS, ActionType, GamePhase } from '../src/gameLogic';
import type { GameState, Player } from '../src/gameLogic';

function createState(charId: string, gold = 2): GameState {
  const player: Player = {
    id: 'player-0',
    name: 'P1',
    character: CHARACTERS.find(c => c.id === charId)!,
    position: 0,
    gold,
    totalInfluence: 0,
    isAI: false,
    actionsRemaining: 2
  };
  const target: Player = {
    id: 'player-1',
    name: 'P2',
    character: CHARACTERS.find(c => c.id === 'al')!,
    position: 0,
    gold: 3,
    totalInfluence: 2,
    isAI: false,
    actionsRemaining: 2
  };
  const board = createInitialBoard();
  board[0].influences[target.id] = 2;
  return {
    phase: GamePhase.PLAYER_TURN,
    currentPlayer: 0,
    players: [player, target],
    board,
    turnCount: 1,
    gameConfig: { playerCount: 2, aiDifficulty: 'medium' },
    actionHistory: [],
    completedActions: [],
    pendingAction: undefined,
    message: ''
  };
}

describe('Challenge Action', () => {
  test('basic challenge reduces opponent influence and costs gold', () => {
    const state = createState('al', 2);
    const newState = executeAction(state, { type: ActionType.CHALLENGE, target: 1 });
    expect(newState.board[0].influences['player-1']).toBe(1);
    expect(newState.players[0].gold).toBe(0);
  });

  test('Seth Bullock pays only 1 gold to challenge', () => {
    const state = createState('seth', 1);
    const newState = executeAction(state, { type: ActionType.CHALLENGE, target: 1 });
    expect(newState.players[0].gold).toBe(0);
  });
});
