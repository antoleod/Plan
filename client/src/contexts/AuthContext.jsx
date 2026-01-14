import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      // En una aplicación real, se verificaría el token con el backend.
      // Aquí, decodificamos un objeto de usuario simulado desde localStorage.
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    }
  }, [token]);

  const login = async (username, password) => {
    // Simulación de llamada a la API
    if ((username === 'manager' && password === 'manager123') || (username === 'juan' && password === 'juan123')) {
      const userData = {
        username,
        name: username, // Para la búsqueda en la grilla de planificación del agente
        role: username === 'manager' ? 'manager' : 'agent',
      };
      const mockToken = `mock-token-for-${username}`;
      
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', mockToken);
      setUser(userData);
      setToken(mockToken);
      return true;
    }
    throw new Error('Invalid credentials');
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
  };

  const value = { user, token, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};