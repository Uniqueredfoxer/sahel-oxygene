import { useEffect, useState } from 'react';
import {
  Store,
  Flame,
  CircleOff,
  LogOut,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';
import api, { messageErreur } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import { useToast } from '../context/ToastContext';

export default function VendeurGazDashboard() {
  const { user, deconnexion } = useAuth();
  const [point, setPoint] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [bascule, setBascule] = useState(false);
  const [erreur, setErreur] = useState('');
  const toast = useToast();

  const charger = async () => {
    setChargement(true);
    try {
      const { data } = await api.get('/gaz/mon-point');
      setPoint(data);
    } catch (err) {
      setErreur(messageErreur(err));
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    charger();
  }, []);

  const basculerDisponibilite = async () => {
    if (!point) return;
    setBascule(true);
    const nouvelEtat = !point.disponible;
    try {
      const { data } = await api.patch('/gaz/mon-point/disponibilite', { disponible: nouvelEtat });
      setPoint(data);
      if (nouvelEtat) {
        toast.succes('Votre point est maintenant visible comme DISPONIBLE !');
      } else {
        toast.info('Votre point est maintenant marqué comme INDISPONIBLE');
      }
    } catch (err) {
      setErreur(messageErreur(err));
    } finally {
      setBascule(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-sable-50">
      <header className="px-5 py-3.5 border-b border-charbon-100 bg-white/90 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between shadow-sm">
        <Logo />
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-slate-600 hidden sm:flex items-center gap-1.5">
            <Store className="w-3.5 h-3.5 text-sahel" />
            <span>{user?.name}</span>
          </span>
          <button
            onClick={deconnexion}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Déconnexion</span>
          </button>
        </div>
      </header>

      <main className="flex-1 px-5 py-8 max-w-lg mx-auto w-full flex flex-col justify-center animate-slide-up">
        {chargement && (
          <div className="card p-10 text-center space-y-4 shadow-card">
            <div className="route-line w-36 mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Chargement de votre point de vente…</p>
          </div>
        )}

        {erreur && !chargement && (
          <div className="card p-8 text-center space-y-3 border-rose-200 bg-rose-50/50 shadow-card">
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6 text-rose-600" />
            </div>
            <p className="text-rose-800 text-sm font-semibold">{erreur}</p>
            <p className="text-slate-500 text-xs">
              Votre compte n'est pas encore rattaché à un point de vente de gaz. Contactez l'administrateur.
            </p>
          </div>
        )}

        {point && !chargement && (
          <div className="card p-8 text-center space-y-8 shadow-card border-slate-200">
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 uppercase tracking-wider mb-2">
                Point de vente affilié
              </span>
              <h1 className="font-display text-2xl font-bold text-slate-900">{point.nom}</h1>
              <p className="text-xs text-slate-500 font-mono mt-1">
                Coordonnées : {point.lat}, {point.lng}
              </p>
            </div>

            {/* Glowing Toggle Button */}
            <div className="relative py-4">
              <button
                onClick={basculerDisponibilite}
                disabled={bascule}
                className={`relative w-52 h-52 rounded-full mx-auto flex flex-col items-center justify-center transition-all duration-300 shadow-2xl active:scale-95 ${
                  point.disponible
                    ? 'bg-gradient-to-br from-emerald-500 to-sahel-dark text-white ring-8 ring-emerald-100 shadow-emerald animate-pulse-subtle'
                    : 'bg-white border-4 border-slate-200 text-slate-400 hover:border-slate-300 shadow-card'
                }`}
              >
                <div className="mb-2 transition-transform duration-200">
                  {point.disponible ? (
                    <Flame className="w-12 h-12 text-white fill-white/30 animate-pulse" />
                  ) : (
                    <CircleOff className="w-12 h-12 text-slate-300" />
                  )}
                </div>
                <span className="font-display font-bold text-lg leading-tight px-4">
                  {point.disponible ? 'Gaz en stock' : 'Rupture de stock'}
                </span>
                <span
                  className={`text-[11px] mt-1.5 font-semibold px-2.5 py-0.5 rounded-full ${
                    point.disponible ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {bascule ? 'Mise à jour…' : 'Toucher pour basculer'}
                </span>
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 leading-relaxed max-w-sm mx-auto flex items-start gap-2.5 text-left">
              <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p>
                <strong>Conseil opérationnel :</strong> Dès que vous recevez une livraison de bouteilles, activez ce bouton. Vos clients vous trouveront immédiatement sur leur carte.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
