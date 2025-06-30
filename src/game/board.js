export const LOCATIONS = [
  { id: 0, name: 'Gem Saloon', adjacent: [1, 3] },
  { id: 1, name: 'Hardware Store', adjacent: [0, 2, 4] },
  { id: 2, name: 'Bella Union', adjacent: [1, 5] },
  { id: 3, name: 'Sheriff Office', adjacent: [0, 4] },
  { id: 4, name: 'Freight Office', adjacent: [1, 3, 5] },
  { id: 5, name: "Wu's Pig Alley", adjacent: [2, 4] },
]
export const createInitialBoard = () => {
  return LOCATIONS.map((loc) => ({
    id: loc.id,
    name: loc.name,
    influences: {},
    maxInfluence: 3,
  }))
}
export const isAdjacent = (from, to) => {
  return LOCATIONS[from].adjacent.includes(to)
}
