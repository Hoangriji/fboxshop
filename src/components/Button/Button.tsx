import React from 'react';
import './Button.css';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'icon';
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  onClick,
  type = 'button',
  disabled = false,
  className = '',
}) => {
  const buttonClass = `btn btn-${variant} ${className}`.trim();

  return (
    <button className={buttonClass} onClick={onClick} type={type} disabled={disabled}>
      {children}
    </button>
  );
};

export default Button;
