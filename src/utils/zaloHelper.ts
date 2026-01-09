/**
 * Zalo Helper - Utilities for opening Zalo app/web
 */

const ZALO_PHONE = import.meta.env.VITE_ZALO_PHONE;
const ZALO_WEB_URL = `https://zalo.me/${ZALO_PHONE}`;
const ZALO_DEEP_LINK = `zalo://conversation?phone=${ZALO_PHONE}`;

/**
 * Detect if user is on mobile device
 */
export const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

/**
 * Open Zalo with smart fallback
 * - Mobile: Try deep link -> fallback to web
 * - Desktop: Open web directly
 */
export const openZaloChat = (message?: string): void => {
  const isMobile = isMobileDevice();
  
  if (isMobile) {
    // Mobile: Try to open Zalo app first
    const deepLink = message 
      ? `${ZALO_DEEP_LINK}&message=${encodeURIComponent(message)}`
      : ZALO_DEEP_LINK;
    
    // Try to open deep link
    window.location.href = deepLink;
    
    // Fallback to web after 2 seconds if app didn't open
    setTimeout(() => {
      window.open(ZALO_WEB_URL, '_blank');
    }, 2000);
  } else {
    // Desktop: Open Zalo web directly
    window.open(ZALO_WEB_URL, '_blank');
  }
};

/**
 * Open Zalo immediately (for "Open now" button)
 */
export const openZaloImmediate = (): void => {
  const isMobile = isMobileDevice();
  
  if (isMobile) {
    // Try deep link on mobile
    window.location.href = ZALO_DEEP_LINK;
    
    // Fallback after 1.5s
    setTimeout(() => {
      window.open(ZALO_WEB_URL, '_blank');
    }, 1500);
  } else {
    window.open(ZALO_WEB_URL, '_blank');
  }
};

/**
 * Get Zalo phone number for display
 */
export const getZaloPhone = (): string => {
  return ZALO_PHONE;
};

/**
 * Get Zalo web URL
 */
export const getZaloWebUrl = (): string => {
  return ZALO_WEB_URL;
};
