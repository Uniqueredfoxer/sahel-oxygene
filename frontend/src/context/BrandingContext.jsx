import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../api/client';

const BrandingContext = createContext({ appName: 'Gaz', rafraichir: () => {} });

export function BrandingProvider({ children }) {
  const [appName, setAppName] = useState('Gaz');

  const rafraichir = useCallback(async () => {
    try {
      const { data } = await api.get('/settings/public');
      setAppName(data.appName);
      document.title = data.appName;
    } catch {
      /* garde le nom par défaut si hors-ligne */
    }
  }, []);

  useEffect(() => {
    rafraichir();
  }, [rafraichir]);

  return (
    <BrandingContext.Provider value={{ appName, rafraichir }}>{children}</BrandingContext.Provider>
  );
}

export function useBranding() {
  return useContext(BrandingContext);
}
