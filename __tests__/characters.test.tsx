import { executeAction, createInitialBoard, CHARACTERS, ActionType, GamePhase } from '../src/gameLogic';
import type { GameState, Player } from '../src/gameLogic';

function alAbilityState(): GameState {
  const al: Player = { id:'p1', name:'Al', character: CHARACTERS.find(c=>c.id==='al')!, position:1, gold:3, totalInfluence:0, isAI:false, actionsRemaining:2 };
  const mover: Player = { id:'p2', name:'Mover', character: CHARACTERS.find(c=>c.id==='seth')!, position:1, gold:3, totalInfluence:0, isAI:false, actionsRemaining:2 };
  return {
    phase: GamePhase.PLAYER_TURN,
    currentPlayer: 1,
    players:[al, mover],
    board:createInitialBoard(),
    turnCount:1,
    gameConfig:{playerCount:2, aiDifficulty:'medium'},
    actionHistory:[],
    completedActions:[],
    pendingAction:undefined,
    message:''
  };
}

describe('Character Abilities', () => {
  test('Al Swearengen gains gold when players enter Gem Saloon', () => {
    const state = alAbilityState();
    const newState = executeAction(state, { type: ActionType.MOVE, target: 0 });
    expect(newState.players[0].gold).toBe(4);
    expect(newState.players[1].position).toBe(0);
  });
});
