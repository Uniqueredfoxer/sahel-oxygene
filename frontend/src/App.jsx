import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BrandingProvider } from './context/BrandingContext';
import { ToastProvider } from './context/ToastContext';
import RouteProtegee from './components/RouteProtegee';

import ClientOrder from './pages/ClientOrder';
import TrackOrder from './pages/TrackOrder';
import Verify from './pages/Verify';
import FindGas from './pages/FindGas';
import Login from './pages/Login';
import Register from './pages/Register';
import LivreurDashboard from './pages/LivreurDashboard';
import VendeurGazDashboard from './pages/VendeurGazDashboard';
import AdminDashboard from './pages/AdminDashboard';

/** Redirige vers le bon espace selon le rôle une fois connecté. */
function EspaceApp() {
  const { user, chargement, aLeRole } = useAuth();
  if (chargement) return null;
  if (!user) return <Navigate to="/connexion" replace />;
  if (aLeRole('administrateur', 'gestionnaire')) return <AdminDashboard />;
  if (aLeRole('livreur')) return <LivreurDashboard />;
  if (aLeRole('vendeur_gaz')) return <VendeurGazDashboard />;
  return (
    <div className="min-h-screen flex items-center justify-center p-6 text-center">
      <div className="card p-8 max-w-md mx-auto shadow-md">
        <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4 font-bold text-xl">
          ⏳
        </div>
        <p className="font-display text-xl font-semibold mb-2 text-slate-800">Compte en attente</p>
        <p className="text-slate-500 text-sm">
          Votre compte a été créé avec succès, mais aucun rôle ne vous a encore été attribué. Contactez votre administrateur pour activer vos accès.
        </p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrandingProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<ClientOrder />} />
              <Route path="/suivi/:numero?" element={<TrackOrder />} />
              <Route path="/verifier/:qrToken" element={<Verify />} />
              <Route path="/gaz" element={<FindGas />} />
              <Route path="/connexion" element={<Login />} />
              <Route path="/inscription" element={<Register />} />
              <Route
                path="/app"
                element={
                  <RouteProtegee>
                    <EspaceApp />
                  </RouteProtegee>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </BrandingProvider>
  );
}
