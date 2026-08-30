import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RouteProtegee({ roles, children }) {
  const { user, chargement } = useAuth();

  if (chargement) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="route-line w-40" />
      </div>
    );
  }

  if (!user) return <Navigate to="/connexion" replace />;

  if (roles && !user.roles?.some((r) => roles.includes(r))) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div>
          <p className="font-display text-xl mb-2">Accès refusé</p>
          <p className="text-charbon/60">Votre compte n'a pas les droits nécessaires pour cette page.</p>
        </div>
      </div>
    );
  }

  return children;
}
