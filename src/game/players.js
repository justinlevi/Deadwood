import { LOCATIONS } from './board';
export const CHARACTERS = [
    {
        id: 'al',
        name: 'Al Swearengen',
        ability: 'Gains +1 gold when another player enters Gem Saloon',
        description: 'The ruthless owner of the Gem Saloon',
    },
    {
        id: 'seth',
        name: 'Seth Bullock',
        ability: 'Challenge actions cost 1 less gold (minimum 1)',
        description: 'The principled sheriff of Deadwood',
    },
    {
        id: 'cy',
        name: 'Cy Tolliver',
        ability: 'Can challenge opponents from adjacent locations',
        description: 'The cunning owner of the Bella Union',
    },
    {
        id: 'jane',
        name: 'Calamity Jane',
        ability: 'All movement is free',
        description: 'The fearless frontierswoman',
    },
];
export const PLAYER_COLORS = ['#ff4500', '#1e90ff', '#32cd32', '#ffd700'];
export const createPlayers = (playerCount) => {
    const shuffledCharacters = [...CHARACTERS].sort(() => Math.random() - 0.5);
    const players = [];
    for (let i = 0; i < playerCount; i++) {
        players.push({
            id: `player-${i}`,
            name: i === 0 ? 'You' : `AI Player ${i}`,
            character: shuffledCharacters[i],
            color: PLAYER_COLORS[i % PLAYER_COLORS.length],
            position: Math.floor(Math.random() * LOCATIONS.length),
            gold: 3,
            totalInfluence: 0,
            isAI: i !== 0,
            actionsRemaining: 2,
        });
    }
    return players;
};
