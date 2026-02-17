import { useAuthStore } from '../store/authStore';

export const useAuth = () => {
  const { isAuthenticated, isLoading, login, logout } = useAuthStore();
  
  return {
    isAuthenticated,
    isLoading,
    login,
    logout
  };
};