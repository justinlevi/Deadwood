import { generateAIActions, createInitialBoard, CHARACTERS, GamePhase } from '../src/gameLogic';
import type { GameState, Player } from '../src/gameLogic';
import { ActionType } from '../src/gameLogic';

function aiState(): GameState {
  const ai: Player = { id:'p1', name:'AI', character: CHARACTERS.find(c=>c.id==='seth')!, position:0, gold:3, totalInfluence:0, isAI:true, actionsRemaining:2 };
  return {
    phase: GamePhase.PLAYER_TURN,
    currentPlayer:0,
    players:[ai],
    board:createInitialBoard(),
    turnCount:1,
    gameConfig:{playerCount:1, aiDifficulty:'medium'},
    actionHistory:[],
    completedActions:[],
    pendingAction:undefined,
    message:''
  };
}

describe('AI Actions', () => {
  test('AI generates two actions', () => {
    const state = aiState();
    const actions = generateAIActions(state);
    expect(actions.length).toBeGreaterThan(0);
    expect(actions.length).toBeLessThanOrEqual(2);
    actions.forEach(a => expect(Object.values(ActionType)).toContain(a.type));
  });
});
