import { isAdjacent } from './board';
export const getMoveCost = (player, from, to) => {
    if (player.character.id === 'jane')
        return 0;
    return isAdjacent(from, to) ? 0 : 1;
};
export const getChallengeCost = (player) => {
    return player.character.id === 'seth' ? 1 : 2;
};
export const canChallenge = (player, target) => {
    if (player.character.id === 'cy') {
        return (player.position === target.position ||
            isAdjacent(player.position, target.position));
    }
    return player.position === target.position;
};
export const getLocationInfluence = (location, playerId) => {
    return location.influences[playerId] || 0;
};
export const getPlayerSafe = (players, index) => {
    if (index < 0 || index >= players.length) {
        console.error(`Invalid player index: ${index}, array length: ${players.length}`);
        return undefined;
    }
    return players[index];
};
export const getLocationSafe = (board, index) => {
    if (index < 0 || index >= board.length) {
        console.error(`Invalid location index: ${index}, array length: ${board.length}`);
        return undefined;
    }
    return board[index];
};
export const findPlayerIndexSafe = (players, playerId) => {
    const index = players.findIndex((p) => p.id === playerId);
    if (index === -1) {
        console.error(`Player not found: ${playerId}`);
    }
    return index;
};
export const getPlayerByIdSafe = (players, playerId) => {
    const player = players.find((p) => p.id === playerId);
    if (!player) {
        console.error(`Player not found: ${playerId}`);
    }
    return player;
};
