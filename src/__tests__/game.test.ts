import { getMoveCost, BasicPlayer } from '../helpers';

describe('getMoveCost', () => {
  const jane: BasicPlayer = { character: { id: 'jane' } };
  const al: BasicPlayer = { character: { id: 'al' } };

  it('returns 0 for Jane regardless of adjacency', () => {
    expect(getMoveCost(jane, 0, 2)).toBe(0);
  });

  it('charges 1 when moving non-adjacent', () => {
    expect(getMoveCost(al, 0, 2)).toBe(1);
  });
});
