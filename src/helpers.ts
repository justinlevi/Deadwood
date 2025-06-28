export interface BasicPlayer {
  character: { id: string };
}

export const isAdjacent = (from: number, to: number): boolean => {
  const LOCATIONS = [
    { id: 0, adjacent: [1, 3] },
    { id: 1, adjacent: [0, 2, 4] },
    { id: 2, adjacent: [1, 5] },
    { id: 3, adjacent: [0, 4] },
    { id: 4, adjacent: [1, 3, 5] },
    { id: 5, adjacent: [2, 4] },
  ];
  return LOCATIONS[from].adjacent.includes(to);
};

export const getMoveCost = (player: BasicPlayer, from: number, to: number): number => {
  if (player.character.id === 'jane') return 0;
  return isAdjacent(from, to) ? 0 : 1;
};
