import React from 'react'
import { ActionType } from '../game/types'
import styles from './ActionButton.module.css'

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
  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={styles.button}
      data-selected={isSelected}
    >
      <div className={styles.icon}>{info.icon}</div>
      <div>{info.label}</div>
      {cost !== undefined && cost > 0 && (
        <div className={styles.cost}>({cost}g)</div>
      )}
    </button>
  )
}

export default ActionButton
