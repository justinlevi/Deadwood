import { executeAction, gameReducer, checkVictoryConditions, createInitialBoard, CHARACTERS, ActionType, GamePhase } from '../src/gameLogic';
import type { GameState, Player } from '../src/gameLogic';

describe('Rest Action', () => {
  function stateWithPlayer(gold = 1): GameState {
    const player: Player = { id:'p1', name:'P1', character: CHARACTERS[0], position:0, gold, totalInfluence:0, isAI:false, actionsRemaining:2 };
    return {
      phase: GamePhase.PLAYER_TURN,
      currentPlayer:0,
      players:[player],
      board:createInitialBoard(),
      turnCount:1,
      gameConfig:{ playerCount:1, aiDifficulty:'medium'},
      actionHistory:[],
      completedActions:[],
      pendingAction:undefined,
      message:''
    };
  }

  test('resting gains two gold', () => {
    const state = stateWithPlayer(1);
    const newState = executeAction(state, { type: ActionType.REST });
    expect(newState.players[0].gold).toBe(3);
  });
});

describe('Action Management', () => {
  function baseTwoPlayerState(): GameState {
    const p1: Player = { id:'player-0', name:'P1', character: CHARACTERS[0], position:0, gold:3, totalInfluence:0, isAI:false, actionsRemaining:2 };
    const p2: Player = { id:'player-1', name:'P2', character: CHARACTERS[1], position:0, gold:3, totalInfluence:0, isAI:false, actionsRemaining:2 };
    return {
      phase: GamePhase.PLAYER_TURN,
      currentPlayer:0,
      players:[p1,p2],
      board:createInitialBoard(),
      turnCount:1,
      gameConfig:{ playerCount:2, aiDifficulty:'medium'},
      actionHistory:[],
      completedActions:[],
      pendingAction:undefined,
      message:''
    };
  }

  test('cancel action clears pending action', () => {
    const state = baseTwoPlayerState();
    const withPending: GameState = { ...state, pendingAction:{ type: ActionType.MOVE }, message:'Select a location to move to' };
    const newState = gameReducer(withPending, { type: 'CANCEL_ACTION' });
    expect(newState.pendingAction).toBeUndefined();
    expect(newState.message).toBe('Select 2 actions');
  });

  test('confirming second action ends turn', () => {
    const state = baseTwoPlayerState();
    const moved = executeAction(state, { type: ActionType.MOVE, target:1 });
    const firstDone: GameState = {
      ...moved,
      completedActions:[{ type: ActionType.MOVE, target:1 }],
      pendingAction:{ type: ActionType.CLAIM, amount:1 },
      message:'Select your final action'
    };
    const finalState = gameReducer(firstDone, { type: 'CONFIRM_ACTION' });
    expect(finalState.currentPlayer).toBe(1);
    expect(finalState.completedActions).toHaveLength(0);
    expect(finalState.pendingAction).toBeUndefined();
    expect(finalState.message).toContain(finalState.players[1].character.name);
  });
});

describe('Turn Limit Victory', () => {
  test('highest influence wins on turn limit', () => {
    const board = createInitialBoard();
    const p1: Player = { id:'p1', name:'P1', character: CHARACTERS[0], position:0, gold:2, totalInfluence:5, isAI:false, actionsRemaining:2 };
    const p2: Player = { id:'p2', name:'P2', character: CHARACTERS[1], position:0, gold:4, totalInfluence:7, isAI:false, actionsRemaining:2 };
    const state: GameState = {
      phase: GamePhase.PLAYER_TURN,
      currentPlayer:0,
      players:[p1,p2],
      board,
      turnCount:20,
      gameConfig:{ playerCount:2, aiDifficulty:'medium'},
      actionHistory:[],
      completedActions:[],
      pendingAction:undefined,
      message:''
    };
    const winner = checkVictoryConditions(state);
    expect(winner).toBe(1);
  });
});

