import React from 'react';
import type { AuthContextType } from '../types/auth';

export const AuthContext = React.createContext<AuthContextType | null>(null);