import { createPlayers } from '../src/gameLogic';

describe('Game Setup', () => {
  test('starting a 2-player game gives correct defaults', () => {
    const rand = jest.spyOn(Math, 'random').mockReturnValue(0);
    const players = createPlayers(2);
    expect(players).toHaveLength(2);
    players.forEach((p, i) => {
      expect(p.gold).toBe(3);
      expect(p.totalInfluence).toBe(0);
      if (i === 0) expect(p.isAI).toBe(false);
      else expect(p.isAI).toBe(true);
    });
    expect(players[0].character.id).not.toBe(players[1].character.id);
    rand.mockRestore();
  });
});
