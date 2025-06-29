import { describe, it, expect, vi } from 'vitest'

describe('action selection validation', () => {
  it('prevents multiple simultaneous actions', () => {
    const mockDispatch = vi.fn()
    let isProcessing = false

    const handleActionSelect = (action: string) => {
      if (isProcessing) return false

      isProcessing = true
      mockDispatch({ type: 'SELECT_ACTION', payload: action })

      setTimeout(() => {
        isProcessing = false
      }, 100)

      return true
    }

    expect(handleActionSelect('MOVE')).toBe(true)
    expect(mockDispatch).toHaveBeenCalledTimes(1)

    expect(handleActionSelect('CLAIM')).toBe(false)
    expect(mockDispatch).toHaveBeenCalledTimes(1)
  })
})
