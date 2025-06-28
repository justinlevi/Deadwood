import { screen, waitFor } from '@testing-library/react'
import {
  startGame,
  selectAction,
  clickLocation,
  confirmAction,
} from './helpers'

// Simplified movement test

describe('Movement Action', () => {
  test('moving to adjacent location is free', async () => {
    await startGame()
    const currentLoc = screen.getAllByText(
      /Gem Saloon|Hardware Store|Bella Union|Sheriff Office|Freight Office|Wu's Pig Alley/
    )[0]
    selectAction('Move')
    clickLocation('Hardware Store')
    confirmAction()
    await waitFor(() =>
      expect(screen.getByText(/Location: Hardware Store/i)).toBeInTheDocument()
    )
    expect(screen.getByText(/Gold: 3/)).toBeInTheDocument()
  })
})
