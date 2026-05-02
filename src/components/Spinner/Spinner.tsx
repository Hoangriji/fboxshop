import React from 'react';
import styles from './Spinner.module.css';

export type SpinnerSize = 'sm' | 'md' | 'lg';

export interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
  'aria-label'?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  className = '',
  'aria-label': ariaLabel = 'Loading',
}) => {
  const classes = [styles.spinner, styles[size], className].filter(Boolean).join(' ');
  return <span className={classes} role="status" aria-label={ariaLabel} />;
};

