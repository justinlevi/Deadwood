import React from 'react'
import { ActionType } from '../game/types'

interface Props {
  action: ActionType
  isSelected: boolean
  isDisabled: boolean
  onClick: () => void
  cost?: number
}

const actionInfo = {
  [ActionType.MOVE]: { label: 'Move', icon: '→' },
  [ActionType.CLAIM]: { label: 'Claim', icon: '★' },
  [ActionType.CHALLENGE]: { label: 'Challenge', icon: '⚔' },
  [ActionType.REST]: { label: 'Rest', icon: '+2g' },
} as const

const ActionButton: React.FC<Props> = ({
  action,
  isSelected,
  isDisabled,
  onClick,
  cost,
}) => {
  const info = actionInfo[action]
  
  const baseClasses = "flex-1 flex flex-col items-center justify-center py-3 px-2 rounded font-bold text-sm md:text-base transition-all duration-200"
  
  const getButtonClasses = () => {
    if (isDisabled) {
      return `${baseClasses} bg-gray-400 text-gray-600 cursor-not-allowed opacity-60`
    }
    if (isSelected) {
      return `${baseClasses} bg-deadwood-gold text-white shadow-lg ring-2 ring-yellow-600`
    }
    return `${baseClasses} bg-deadwood-brown text-white hover:bg-deadwood-sienna hover:shadow-md active:scale-95`
  }
  
  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={getButtonClasses()}
      data-selected={isSelected}
    >
      <div className="text-xl mb-1">{info.icon}</div>
      <div>{info.label}</div>
      {cost !== undefined && cost > 0 && (
        <div className="text-xs opacity-90">({cost}g)</div>
      )}
    </button>
  )
}

export default ActionButton
