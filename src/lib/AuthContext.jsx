import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '@/services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [currentFinca, setCurrentFinca] = useState(null);
  const [membership, setMembership] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings] = useState(null);

  useEffect(() => {
    checkAppState();
  }, []);

  const checkAppState = async () => {
    setIsLoadingPublicSettings(false);
    await checkUserAuth();
  };

  const checkUserAuth = async () => {
    try {
      setIsLoadingAuth(true);
      setAuthChecked(false);

      const authData = await authService.me();

      setUser(authData.user);
      setCurrentFinca(authData.current_finca);
      setMembership(authData.membership);
      setIsAuthenticated(true);
      setAuthError(null);
      setAuthChecked(true);
      setIsLoadingAuth(false);
    } catch (error) {
      console.error('User auth check failed:', error);

      setUser(null);
      setCurrentFinca(null);
      setMembership(null);
      setIsAuthenticated(false);
      setAuthChecked(true);
      setIsLoadingAuth(false);

      if (error.message) {
        setAuthError({
          type: 'auth_required',
          message: 'Authentication required'
        });
      }
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }

    setUser(null);
    setCurrentFinca(null);
    setMembership(null);
    setIsAuthenticated(false);
    setAuthError(null);
    setAuthChecked(false);
    window.location.href = "/login";
  };

    const navigateToLogin = () => {
      window.location.href = "/login";
    };

  return (
    <AuthContext.Provider value={{ 
      user, currentFinca, current_finca: currentFinca, membership, isAuthenticated, isLoadingAuth, authChecked, isLoadingPublicSettings,
      authError, appPublicSettings, logout, navigateToLogin, checkAppState, checkUserAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
