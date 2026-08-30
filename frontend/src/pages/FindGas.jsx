import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Flame,
  Package,
  MapPin,
  Compass,
  AlertTriangle,
  Wind,
  RefreshCw,
  Phone,
  Navigation,
} from 'lucide-react';
import api from '../api/client';
import Logo from '../components/Logo';
import { obtenirPositionGPS } from '../utils/geo';

export default function FindGas() {
  const [statut, setStatut] = useState('idle'); // idle | recherche | ok | erreur | vide
  const [coins, setCoins] = useState([]);
  const [erreur, setErreur] = useState('');
  const navigate = useNavigate();

  const localiser = async () => {
    setStatut('recherche');
    setErreur('');
    try {
      const pos = await obtenirPositionGPS();
      const { data } = await api.get('/gaz/proche', {
        params: { lat: pos.lat, lng: pos.lng },
      });
      setCoins(data);
      setStatut(data.length === 0 ? 'vide' : 'ok');
    } catch (err) {
      setErreur(err.message || 'Impossible de localiser les coins disponibles.');
      setStatut('erreur');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-sable-50">
      <header className="px-5 py-3.5 border-b border-charbon-100 bg-white/90 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between shadow-sm">
        <Logo />
        <Link
          to="/"
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
        >
          <Package className="w-3.5 h-3.5 text-slate-600" />
          <span>Livraison</span>
        </Link>
      </header>

      <main className="flex-1 px-5 py-8 max-w-lg mx-auto w-full flex flex-col justify-center">
        {statut === 'idle' && (
          <div className="card p-8 text-center space-y-6 animate-slide-up shadow-card">
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <span className="absolute w-full h-full rounded-full bg-emerald-200 animate-radar-ping opacity-60" />
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sahel to-sahel-dark text-white flex items-center justify-center shadow-emerald relative z-10">
                <Flame className="w-8 h-8 text-white fill-white/20" />
              </div>
            </div>

            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-sahel-dark uppercase tracking-wider mb-2 border border-emerald-200/60">
                Disponibilité en temps réel
              </span>
              <h1 className="font-display text-2xl font-bold text-slate-900">Trouver du gaz à proximité</h1>
              <p className="text-slate-500 text-sm mt-2 max-w-sm mx-auto">
                Localisez instantanément les 3 points de vente les plus proches qui disposent de bouteilles de gaz en stock.
              </p>
            </div>

            <button
              className="btn-primary w-full text-base py-4 flex items-center justify-center gap-2"
              onClick={localiser}
            >
              <MapPin className="w-5 h-5" />
              <span>Localiser les coins autour de moi</span>
            </button>
          </div>
        )}

        {statut === 'recherche' && (
          <div className="card p-12 text-center space-y-6 animate-slide-up shadow-card">
            <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20 animate-ping" />
              <div className="absolute inset-2 rounded-full border border-emerald-500/40 animate-pulse" />
              <div className="w-12 h-12 rounded-full bg-sahel text-white flex items-center justify-center shadow-emerald">
                <Compass className="w-6 h-6 animate-spin text-white" />
              </div>
            </div>
            <div>
              <p className="font-display font-semibold text-lg text-slate-800">Recherche des coins en cours…</p>
              <p className="text-xs text-slate-400 mt-1">Calcul des distances et disponibilité en temps réel</p>
            </div>
            <div className="route-line w-36 mx-auto" />
          </div>
        )}

        {statut === 'erreur' && (
          <div className="card p-8 text-center space-y-5 animate-slide-up shadow-card border-rose-200">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7 text-rose-600" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900">Localisation impossible</h2>
              <p className="text-rose-700 text-sm mt-1">{erreur}</p>
            </div>
            <button className="btn-secondary w-full flex items-center justify-center gap-2" onClick={localiser}>
              <RefreshCw className="w-4 h-4" />
              <span>Réessayer</span>
            </button>
          </div>
        )}

        {statut === 'vide' && (
          <div className="card p-8 text-center space-y-5 animate-slide-up shadow-card">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <Wind className="w-7 h-7 text-amber-600" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900">Aucun gaz disponible pour le moment</h2>
              <p className="text-slate-500 text-sm mt-1">
                Aucun vendeur n'a activé son stock disponible dans votre périmètre immédiat. Réessayez dans quelques instants.
              </p>
            </div>
            <button className="btn-secondary w-full flex items-center justify-center gap-2" onClick={localiser}>
              <RefreshCw className="w-4 h-4" />
              <span>Actualiser la recherche</span>
            </button>
          </div>
        )}

        {statut === 'ok' && (
          <div className="space-y-4 animate-slide-up">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-display text-xl font-bold text-slate-900">Coins disponibles</h1>
                <p className="text-xs text-slate-500">Les 3 points les plus proches</p>
              </div>
              <button
                className="text-xs font-semibold text-sahel hover:text-sahel-dark flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm"
                onClick={localiser}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Actualiser</span>
              </button>
            </div>

            <div className="space-y-3">
              {coins.map((c, i) => (
                <div
                  key={c.id}
                  className={`card p-5 transition-all duration-200 hover:border-sahel-300 hover:shadow-card-hover ${
                    i === 0 ? 'border-sahel/30 ring-1 ring-sahel/20' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {i === 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-sahel text-white text-[10px] font-bold uppercase tracking-wider">
                            Le plus proche
                          </span>
                        )}
                        <span className="text-xs font-mono font-semibold text-slate-500">
                          {c.distanceKm} km
                        </span>
                      </div>
                      <h3 className="font-display font-bold text-base text-slate-900">{c.nom}</h3>
                      {c.description && (
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{c.description}</p>
                      )}
                    </div>

                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Disponible
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100">
                    {c.telephone ? (
                      <a
                        href={`tel:${c.telephone}`}
                        className="btn-secondary text-xs py-2.5 flex items-center justify-center gap-1.5 text-slate-700 font-semibold"
                      >
                        <Phone className="w-3.5 h-3.5 text-slate-600" />
                        <span>Appeler</span>
                      </a>
                    ) : (
                      <div />
                    )}
                    <a
                      href={c.itineraire}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-primary text-xs py-2.5 flex items-center justify-center gap-1.5"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Itinéraire Maps</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
