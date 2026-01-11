import React from 'react';
import './ConfirmationModal.css';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  icon?: 'success' | 'info' | 'warning';
  primaryButtonLabel: string;
  secondaryButtonLabel?: string;
  onPrimaryAction: () => void;
  onSecondaryAction?: () => void;
  onClose: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  icon = 'success',
  primaryButtonLabel,
  secondaryButtonLabel = 'Đóng',
  onPrimaryAction,
  onSecondaryAction,
  onClose,
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSecondary = () => {
    if (onSecondaryAction) {
      onSecondaryAction();
    } else {
      onClose();
    }
  };

  return (
    <div className="confirmation-modal-backdrop" onClick={handleBackdropClick}>
      <div className="confirmation-modal">
        <div className={`confirmation-modal-icon confirmation-modal-icon-${icon}`}>
          {icon === 'success' && <i className="fas fa-check-circle"></i>}
          {icon === 'info' && <i className="fas fa-info-circle"></i>}
          {icon === 'warning' && <i className="fas fa-exclamation-triangle"></i>}
        </div>

        <h3 className="confirmation-modal-title">{title}</h3>
        <p className="confirmation-modal-message">{message}</p>

        <div className="confirmation-modal-actions">
          <button 
            className="confirmation-modal-btn confirmation-modal-btn-primary"
            onClick={onPrimaryAction}
          >
            <i className="fas fa-comment-dots"></i>
            {primaryButtonLabel}
          </button>
          
          <button 
            className="confirmation-modal-btn confirmation-modal-btn-secondary"
            onClick={handleSecondary}
          >
            {secondaryButtonLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
