import React from 'react'

interface Props {
  isOpen: boolean
  title: string
  message?: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  disabled?: boolean
  children?: React.ReactNode
}

const ConfirmModal: React.FC<Props> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  disabled = false,
  children,
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onCancel}
      />
      
      {/* Modal */}
      <div className="relative bg-deadwood-tan rounded-lg shadow-2xl border-4 border-deadwood-dark-brown max-w-md w-full animate-slide-up">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-deadwood-dark-brown mb-4">{title}</h2>
          
          {message && (
            <p className="text-deadwood-brown mb-4">{message}</p>
          )}
          
          {children}
          
          <div className="flex gap-3 mt-6">
            <button
              className="flex-1 py-3 px-4 bg-deadwood-red text-white rounded font-bold hover:bg-red-700 transition-colors"
              onClick={onCancel}
            >
              {cancelText}
            </button>
            <button
              className="flex-[2] py-3 px-4 bg-deadwood-green text-white rounded font-bold hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              onClick={onConfirm}
              disabled={disabled}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal