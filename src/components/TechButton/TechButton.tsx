import React from 'react';
import './TechButton.css';

interface TechButtonProps {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void;
  variant?: 'primary' | 'secondary';
  icon?: React.ReactNode;
  href?: string;
  className?: string;
}

export const TechButton: React.FC<TechButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  icon,
  href,
  className = '',
}) => {
  const defaultIcon = (
    <svg className="arrow-icon" viewBox="0 0 24 24">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );

  const buttonContent = (
    <div className="btn-inner">
      <span className="btn-text">{children}</span>
      <div className="btn-icon-section">{icon ?? defaultIcon}</div>
    </div>
  );

  const classes = `tech-btn-wrapper ${variant} ${className}`.trim();

  if (href) {
    return (
      <a href={href} className={classes} onClick={onClick}>
        {buttonContent}
      </a>
    );
  }

  return (
    <button type="button" className={classes} onClick={onClick}>
      {buttonContent}
    </button>
  );
};
