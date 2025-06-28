import React, { useReducer, useState, useEffect } from 'react';

// Type Definitions
export interface GameConfig {
  playerCount: number;
  aiDifficulty: 'easy' | 'medium' | 'hard';
}

export interface Character {
  id: string;
  name: string;
  ability: string;
  description: string;
}

export interface Player {
  id: string;
  name: string;
  character: Character;
  position: number;
  gold: number;
  totalInfluence: number;
  isAI: boolean;
  actionsRemaining: number;
}

export interface Location {
  id: number;
  name: string;
  influences: { [playerId: string]: number };
  maxInfluence: number;
}

export interface PendingAction {
  type: ActionType;
  target?: number;
  amount?: number;
}

export interface GameState {
  phase: GamePhase;
  currentPlayer: number;
  players: Player[];
  _board: Location[];
  turnCount: number;
  gameConfig: GameConfig;
  actionHistory: Action[];
  winner?: number;
  completedActions: PendingAction[];
  pendingAction?: PendingAction;
  message: string;
}

export enum GamePhase {
  SETUP = 'setup',
  PLAYER_TURN = 'player_turn',
  ACTION_SELECTION = 'action_selection',
  ACTION_RESOLUTION = 'action_resolution',
  GAME_OVER = 'game_over'
}

export enum ActionType {
  MOVE = 'move',
  CLAIM = 'claim',
  CHALLENGE = 'challenge',
  REST = 'rest'
}

export interface Action {
  type: ActionType;
  playerId: string;
  target?: number;
  amount?: number;
  cost: number;
}

export type GameAction =
  | { type: 'START_GAME'; payload: GameConfig }
  | { type: 'SELECT_ACTION'; payload: ActionType }
  | { type: 'SET_ACTION_TARGET'; payload: { target?: number; amount?: number } }
  | { type: 'CONFIRM_ACTION' }
  | { type: 'CANCEL_ACTION' }
  | { type: 'EXECUTE_ACTIONS' }
  | { type: 'END_TURN' }
  | { type: 'SET_STATE'; payload: GameState }
  | { type: 'RESET_GAME' }
  | { type: 'SET_MESSAGE'; payload: string };

// Character definitions
export const CHARACTERS: Character[] = [
  {
    id: 'al',
    name: 'Al Swearengen',
    ability: 'Gains +1 gold when any player enters Gem Saloon',
    description: 'The ruthless owner of the Gem Saloon'
  },
  {
    id: 'seth',
    name: 'Seth Bullock',
    ability: 'Challenge actions cost 1 less gold (minimum 1)',
    description: 'The principled sheriff of Deadwood'
  },
  {
    id: 'cy',
    name: 'Cy Tolliver',
    ability: 'Can challenge opponents from adjacent locations',
    description: 'The cunning owner of the Bella Union'
  },
  {
    id: 'jane',
    name: 'Calamity Jane',
    ability: 'All movement is free',
    description: 'The fearless frontierswoman'
  }
];

// Board layout
const LOCATIONS = [
  { id: 0, name: 'Gem Saloon', adjacent: [1, 3] },
  { id: 1, name: 'Hardware Store', adjacent: [0, 2, 4] },
  { id: 2, name: 'Bella Union', adjacent: [1, 5] },
  { id: 3, name: 'Sheriff Office', adjacent: [0, 4] },
  { id: 4, name: 'Freight Office', adjacent: [1, 3, 5] },
  { id: 5, name: "Wu's Pig Alley", adjacent: [2, 4] }
];

// Helper functions
export const createInitialBoard = (): Location[] => {
  return LOCATIONS.map((loc) => ({
    id: loc.id,
    name: loc.name,
    influences: {},
    maxInfluence: 3
  }));
};

export const createPlayers = (playerCount: number): Player[] => {
  const shuffledCharacters = [...CHARACTERS].sort(() => Math.random() - 0.5);
  const players: Player[] = [];

  for (let i = 0; i < playerCount; i++) {
    players.push({
      id: `player-${i}`,
      name: i === 0 ? 'You' : `AI Player ${i}`,
      character: shuffledCharacters[i],
      position: Math.floor(Math.random() * 6),
      gold: 3,
      totalInfluence: 0,
      isAI: i !== 0,
      actionsRemaining: 2
    });
  }

  return players;
};

export const isAdjacent = (from: number, to: number): boolean => {
  return LOCATIONS[from].adjacent.includes(to);
};

export const getMoveCost = (player: Player, from: number, to: number): number => {
  if (player.character.id === 'jane') return 0;
  return isAdjacent(from, to) ? 0 : 1;
};

export const getChallengeCost = (player: Player): number => {
  return player.character.id === 'seth' ? 1 : 2;
};

export const canChallenge = (player: Player, target: Player, _board: Location[]): boolean => {
  if (player.character.id === 'cy') {
    return player.position === target.position || isAdjacent(player.position, target.position);
  }
  return player.position === target.position;
};

export const getLocationInfluence = (location: Location, playerId: string): number => {
  return location.influences[playerId] || 0;
};

export const getTotalInfluence = (_board: Location[], playerId: string): number => {
  return board.reduce((total, loc) => total + getLocationInfluence(loc, playerId), 0);
};

export const checkVictoryConditions = (state: GameState): number | undefined => {
  for (const player of state.players) {
    // Check location control victory (3 locations at max influence)
    let maxInfluenceCount = 0;
    for (const location of state.board) {
      if (getLocationInfluence(location, player.id) === 3) {
        maxInfluenceCount++;
      }
    }
    if (maxInfluenceCount >= 3) return state.players.indexOf(player);

    // Check total influence victory
    if (player.totalInfluence >= 12) return state.players.indexOf(player);
  }

  // Check turn limit
  if (state.turnCount >= 20) {
    let maxInfluence = -1;
    let winner = 0;
    state.players.forEach((player, index) => {
      if (player.totalInfluence > maxInfluence) {
        maxInfluence = player.totalInfluence;
        winner = index;
      } else if (player.totalInfluence === maxInfluence && player.gold > state.players[winner].gold) {
        winner = index;
      }
    });
    return winner;
  }

  return undefined;
};

export const executeAction = (state: GameState, action: PendingAction): GameState => {
  const currentPlayer = state.players[state.currentPlayer];
  let newBoard = [...state.board];
  let newPlayers = [...state.players];

  switch (action.type) {
    case ActionType.MOVE: {
      if (action.target === undefined) break;
      const moveCost = getMoveCost(currentPlayer, currentPlayer.position, action.target);
      newPlayers[state.currentPlayer] = {
        ...currentPlayer,
        position: action.target,
        gold: currentPlayer.gold - moveCost
      };
      if (action.target === 0) {
        const alPlayer = newPlayers.find((p) => p.character.id === 'al');
        if (alPlayer) {
          const alIndex = newPlayers.indexOf(alPlayer);
          newPlayers[alIndex] = {
            ...alPlayer,
            gold: alPlayer.gold + 1
          };
        }
      }
      break;
    }
    case ActionType.CLAIM: {
      const amount = action.amount || 1;
      const location = newBoard[currentPlayer.position];
      const currentInfluence = getLocationInfluence(location, currentPlayer.id);
      const actualAmount = Math.min(amount, location.maxInfluence - currentInfluence);

      if (actualAmount > 0) {
        newBoard[currentPlayer.position] = {
          ...location,
          influences: {
            ...location.influences,
            [currentPlayer.id]: currentInfluence + actualAmount
          }
        };

        newPlayers[state.currentPlayer] = {
          ...currentPlayer,
          gold: currentPlayer.gold - actualAmount,
          totalInfluence: currentPlayer.totalInfluence + actualAmount
        };
      }
      break;
    }
    case ActionType.CHALLENGE: {
      if (action.target === undefined) break;
      const challengeCost = getChallengeCost(currentPlayer);
      const targetPlayer = newPlayers.find((p) => p.id === `player-${action.target}`);

      if (targetPlayer) {
        const location = newBoard[targetPlayer.position];
        const targetInfluence = getLocationInfluence(location, targetPlayer.id);

        if (targetInfluence > 0) {
          newBoard[targetPlayer.position] = {
            ...location,
            influences: {
              ...location.influences,
              [targetPlayer.id]: targetInfluence - 1
            }
          };

          const targetIndex = newPlayers.findIndex((p) => p.id === targetPlayer.id);
          newPlayers[targetIndex] = {
            ...targetPlayer,
            totalInfluence: targetPlayer.totalInfluence - 1
          };

          newPlayers[state.currentPlayer] = {
            ...currentPlayer,
            gold: currentPlayer.gold - challengeCost
          };
        }
      }
      break;
    }
    case ActionType.REST: {
      newPlayers[state.currentPlayer] = {
        ...currentPlayer,
        gold: currentPlayer.gold + 2
      };
      break;
    }
  }

  return {
    ...state,
    board: newBoard,
    players: newPlayers
  };
};

export const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'START_GAME': {
      const players = createPlayers(action.payload.playerCount);
      return {
        phase: GamePhase.PLAYER_TURN,
        currentPlayer: 0,
        players,
        board: createInitialBoard(),
        turnCount: 1,
        gameConfig: action.payload,
        actionHistory: [],
        completedActions: [],
        pendingAction: undefined,
        message: `Turn 1 • ${players[0].character.name}'s turn`
      };
    }
    case 'SELECT_ACTION': {
      const actionType = action.payload;
      const currentPlayer = state.players[state.currentPlayer];
      if (actionType === ActionType.REST) {
        const newState = executeAction(state, { type: ActionType.REST });
        return {
          ...newState,
          completedActions: [...state.completedActions, { type: ActionType.REST }],
          message: state.completedActions.length === 0 ? 'Select your final action' : 'Turn complete!'
        };
      }
      if (actionType === ActionType.CLAIM) {
        const location = state.board[currentPlayer.position];
        const currentInfluence = getLocationInfluence(location, currentPlayer.id);
        const maxClaim = Math.min(currentPlayer.gold, location.maxInfluence - currentInfluence);
        if (maxClaim > 0) {
          return {
            ...state,
            pendingAction: { type: ActionType.CLAIM, amount: 1 },
            message: 'Select claim amount and confirm'
          };
        }
      }
      return {
        ...state,
        pendingAction: { type: actionType },
        message: actionType === ActionType.MOVE ? 'Select a location to move to' : 'Select a player to challenge'
      };
    }
    case 'SET_ACTION_TARGET': {
      if (!state.pendingAction) return state;
      return {
        ...state,
        pendingAction: {
          ...state.pendingAction,
          target: action.payload.target,
          amount: action.payload.amount !== undefined ? action.payload.amount : state.pendingAction.amount
        }
      };
    }
    case 'CONFIRM_ACTION': {
      if (!state.pendingAction) return state;
      const newState = executeAction(state, state.pendingAction);
      const newCompletedActions = [...state.completedActions, state.pendingAction];
      if (newCompletedActions.length >= 2) {
        const winner = checkVictoryConditions(newState);
        if (winner !== undefined) {
          return {
            ...newState,
            phase: GamePhase.GAME_OVER,
            winner,
            completedActions: newCompletedActions,
            pendingAction: undefined,
            message: `${newState.players[winner].name} wins!`
          };
        }
        const nextPlayer = (state.currentPlayer + 1) % state.players.length;
        const isNewRound = nextPlayer === 0;
        return {
          ...newState,
          currentPlayer: nextPlayer,
          turnCount: isNewRound ? state.turnCount + 1 : state.turnCount,
          completedActions: [],
          pendingAction: undefined,
          message: `Turn ${isNewRound ? state.turnCount + 1 : state.turnCount} • ${newState.players[nextPlayer].character.name}'s turn`
        };
      }
      return {
        ...newState,
        completedActions: newCompletedActions,
        pendingAction: undefined,
        message: 'Select your final action'
      };
    }
    case 'CANCEL_ACTION': {
      return {
        ...state,
        pendingAction: undefined,
        message: state.completedActions.length === 0 ? 'Select 2 actions' : 'Select your final action'
      };
    }
    case 'END_TURN': {
      const winner = checkVictoryConditions(state);
      if (winner !== undefined) {
        return {
          ...state,
          phase: GamePhase.GAME_OVER,
          winner,
          message: `${state.players[winner].name} wins!`
        };
      }
      const nextPlayer = (state.currentPlayer + 1) % state.players.length;
      const isNewRound = nextPlayer === 0;
      return {
        ...state,
        currentPlayer: nextPlayer,
        turnCount: isNewRound ? state.turnCount + 1 : state.turnCount,
        completedActions: [],
        pendingAction: undefined,
        message: `Turn ${isNewRound ? state.turnCount + 1 : state.turnCount} • ${state.players[nextPlayer].character.name}'s turn`
      };
    }
    case 'SET_STATE': {
      return action.payload;
    }
    case 'SET_MESSAGE': {
      return {
        ...state,
        message: action.payload
      };
    }
    case 'RESET_GAME': {
      return {
        phase: GamePhase.SETUP,
        currentPlayer: 0,
        players: [],
        board: createInitialBoard(),
        turnCount: 0,
        gameConfig: { playerCount: 2, aiDifficulty: 'medium' },
        actionHistory: [],
        completedActions: [],
        pendingAction: undefined,
        message: ''
      };
    }
    default:
      return state;
  }
};

export const generateAIActions = (state: GameState): PendingAction[] => {
  const currentPlayer = state.players[state.currentPlayer];
  const actions: PendingAction[] = [];
  const location = state.board[currentPlayer.position];
  const currentInfluence = getLocationInfluence(location, currentPlayer.id);
  const maxClaim = Math.min(currentPlayer.gold, location.maxInfluence - currentInfluence);
  if (maxClaim > 0) {
    actions.push({ type: ActionType.CLAIM, amount: Math.min(2, maxClaim) });
  }
  if (currentPlayer.gold >= getChallengeCost(currentPlayer)) {
    const validTargets = state.players.filter((p, i) =>
      i !== state.currentPlayer &&
      canChallenge(currentPlayer, p, state.board) &&
      state.board[p.position].influences[p.id] > 0
    );
    if (validTargets.length > 0) {
      actions.push({ type: ActionType.CHALLENGE, target: state.players.indexOf(validTargets[0]) });
    }
  }
  while (actions.length < 2) {
    if (currentPlayer.gold < 2) {
      actions.push({ type: ActionType.REST });
    } else {
      const adjacentLocs = LOCATIONS[currentPlayer.position].adjacent;
      const targetLoc = adjacentLocs[Math.floor(Math.random() * adjacentLocs.length)];
      actions.push({ type: ActionType.MOVE, target: targetLoc });
    }
  }
  return actions.slice(0, 2);
};

const GameSetup: React.FC<{ onStartGame: (config: GameConfig) => void }> = ({ onStartGame }) => {
  const [playerCount, setPlayerCount] = useState(2);
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  return (
    <div>
      <h1>Deadwood Showdown</h1>
      <div>
        <label>Number of Players:</label>
        <select value={playerCount} onChange={(e) => setPlayerCount(Number(e.target.value))}>
          <option value={2}>2 Players</option>
          <option value={3}>3 Players</option>
          <option value={4}>4 Players</option>
        </select>
      </div>
      <div>
        <label>AI Difficulty:</label>
        <select value={aiDifficulty} onChange={(e) => setAiDifficulty(e.target.value as any)}>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>
      <button onClick={() => onStartGame({ playerCount, aiDifficulty })}>Start Game</button>
    </div>
  );
};

const GameOver: React.FC<{ gameState: GameState; onNewGame: () => void }> = ({ gameState, onNewGame }) => {
  const winner = gameState.players[gameState.winner!];
  return (
    <div>
      <h1>Game Over!</h1>
      <h2>
        {winner.name} ({winner.character.name}) Wins!
      </h2>
      <button onClick={onNewGame}>New Game</button>
    </div>
  );
};

const DeadwoodGame: React.FC = () => {
  const initialState: GameState = {
    phase: GamePhase.SETUP,
    currentPlayer: 0,
    players: [],
    board: createInitialBoard(),
    turnCount: 0,
    gameConfig: { playerCount: 2, aiDifficulty: 'medium' },
    actionHistory: [],
    completedActions: [],
    pendingAction: undefined,
    message: ''
  };

  const [gameState, dispatch] = useReducer(gameReducer, initialState);

  useEffect(() => {
    if (
      gameState.phase === GamePhase.PLAYER_TURN &&
      gameState.players[gameState.currentPlayer]?.isAI &&
      !gameState.pendingAction &&
      gameState.completedActions.length === 0
    ) {
      const timer = setTimeout(() => {
        const aiActions = generateAIActions(gameState);
        aiActions.forEach((action) => {
          dispatch({ type: 'SELECT_ACTION', payload: action.type });
          if (action.target !== undefined || action.amount !== undefined) {
            dispatch({ type: 'SET_ACTION_TARGET', payload: { target: action.target, amount: action.amount } });
          }
          dispatch({ type: 'CONFIRM_ACTION' });
        });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [gameState]);

  if (gameState.phase === GamePhase.SETUP) {
    return <GameSetup onStartGame={(config) => dispatch({ type: 'START_GAME', payload: config })} />;
  }

  if (gameState.phase === GamePhase.GAME_OVER) {
    return <GameOver gameState={gameState} onNewGame={() => dispatch({ type: 'RESET_GAME' })} />;
  }

  return (
    <div>
      <h2>{gameState.message}</h2>
      {/* Game UI would go here */}
    </div>
  );
};

export default DeadwoodGame;
