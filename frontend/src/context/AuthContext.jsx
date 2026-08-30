import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../api/client';
import { rejoindreCanal, connecterSocket, deconnecterSocket } from '../api/socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [chargement, setChargement] = useState(true);

  const chargerProfil = useCallback(async () => {
    const token = localStorage.getItem('sahel_token');
    if (!token) {
      setChargement(false);
      return;
    }
    try {
      connecterSocket(token);
      const { data } = await api.get('/auth/me');
      setUser(data);
      rejoindreCanal({ userId: data.id });
    } catch {
      localStorage.removeItem('sahel_token');
      deconnecterSocket();
      setUser(null);
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    chargerProfil();
  }, [chargerProfil]);

  const connexion = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('sahel_token', data.token);
    connecterSocket(data.token);
    await chargerProfil();
    return data.user;
  };

  const inscription = async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    localStorage.setItem('sahel_token', data.token);
    connecterSocket(data.token);
    await chargerProfil();
    return data.user;
  };

  const deconnexion = () => {
    localStorage.removeItem('sahel_token');
    deconnecterSocket();
    setUser(null);
  };

  const aLeRole = (...roles) => user?.roles?.some((r) => roles.includes(r));

  return (
    <AuthContext.Provider
      value={{ user, chargement, connexion, inscription, deconnexion, aLeRole, rafraichir: chargerProfil }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
