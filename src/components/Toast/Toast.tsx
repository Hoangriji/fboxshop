import React, { useEffect, useState } from 'react';
import './Toast.css';

interface ToastProps {
  message: string;
  type?: 'success' | 'info' | 'warning' | 'error';
  duration?: number;
  countdown?: number;
  onClose?: () => void;
  onAction?: () => void;
  actionLabel?: string;
  showCountdown?: boolean;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'success',
  duration = 3000,
  countdown = 3,
  onClose,
  onAction,
  actionLabel = 'Mở ngay',
  showCountdown = false,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [remainingTime, setRemainingTime] = useState(countdown);

  useEffect(() => {
    if (showCountdown) {
      const countdownInterval = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(countdownInterval);
    }
  }, [showCountdown]);

  useEffect(() => {
    const handleAutoClose = () => {
      setIsVisible(false);
      setTimeout(() => {
        onClose?.();
      }, 300);
    };

    const timer = setTimeout(() => {
      handleAutoClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose?.();
    }, 300);
  };

  const handleAction = () => {
    onAction?.();
    handleClose();
  };

  if (!isVisible) return null;

  return (
    <div className={`toast toast-${type} ${isVisible ? 'toast-show' : 'toast-hide'}`}>
      <div className="toast-content">
        <div className="toast-icon">
          {type === 'success' && <i className="fas fa-check-circle"></i>}
          {type === 'info' && <i className="fas fa-info-circle"></i>}
          {type === 'warning' && <i className="fas fa-exclamation-triangle"></i>}
          {type === 'error' && <i className="fas fa-times-circle"></i>}
        </div>
        <div className="toast-message">
          <p>{message}</p>
          {showCountdown && remainingTime > 0 && (
            <span className="toast-countdown">Chuyển hướng sau {remainingTime}s...</span>
          )}
        </div>
      </div>
      <div className="toast-actions">
        {onAction && (
          <button className="toast-btn toast-btn-primary" onClick={handleAction}>
            {actionLabel}
          </button>
        )}
        <button className="toast-btn toast-btn-cancel" onClick={handleClose}>
          Hủy
        </button>
      </div>
    </div>
  );
};

export default Toast;
