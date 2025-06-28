import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import DeadwoodGame from '../src/DeadwoodGame'

export const renderGame = () => render(<DeadwoodGame />)

export const startGame = async (playerCount: number = 2) => {
  const { getByText, getByLabelText } = renderGame()
  const playerSelect = getByLabelText(/Number of Players/i)
  fireEvent.change(playerSelect, { target: { value: playerCount } })
  fireEvent.click(getByText(/Start Game/i))
  await waitFor(() => expect(getByText(/Turn 1/i)).toBeInTheDocument())
}

export const selectAction = (actionName: string) => {
  const actionButton = screen.getByRole('button', {
    name: new RegExp(actionName, 'i'),
  })
  fireEvent.click(actionButton)
}

export const clickLocation = (locationName: string) => {
  const location = screen.getByText(locationName).closest('div')
  if (location) fireEvent.click(location)
}

export const confirmAction = () => {
  const confirmButton = screen.getByText(/Confirm/i)
  fireEvent.click(confirmButton)
}
