import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Bike,
  Phone,
  ArrowLeft,
  FileText,
  Send,
  Navigation,
  Radio,
  CheckCircle2,
  LogOut,
  MapPin,
} from 'lucide-react';
import api, { messageErreur } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../api/socket';
import { telechargerFichier } from '../utils/download';
import Logo from '../components/Logo';
import StatutPill from '../components/StatutPill';
import PadSignature from '../components/PadSignature';
import { useToast } from '../context/ToastContext';

export default function LivreurDashboard() {
  const { user, deconnexion } = useAuth();
  const [courses, setCourses] = useState([]);
  const [filtreStatut, setFiltreStatut] = useState('en_cours');
  const [selection, setSelection] = useState(null);
  const [partagePosition, setPartagePosition] = useState(false);
  const [signature, setSignature] = useState(null);
  const [validation, setValidation] = useState(false);
  const [erreur, setErreur] = useState('');
  const [telechargement, setTelechargement] = useState(false);
  const watchIdRef = useRef(null);
  const toast = useToast();

  const charger = useCallback(async () => {
    try {
      const { data } = await api.get(`/livraisons/mine?statut=${filtreStatut}`);
      setCourses(data);
    } catch (err) {
      console.error(err);
    }
  }, [filtreStatut]);

  useEffect(() => {
    charger();
    const socket = getSocket();
    const surNouvelleAttribution = () => {
      toast.info('Une nouvelle course vous a été attribuée !');
      charger();
    };
    socket.on('livraison:attribuee', surNouvelleAttribution);
    return () => socket.off('livraison:attribuee', surNouvelleAttribution);
  }, [charger, toast]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  const basculerPartage = () => {
    if (!selection) return;
    if (partagePosition) {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
      setPartagePosition(false);
      toast.info('Partage de position GPS désactivé');
      return;
    }
    if (!navigator.geolocation) {
      setErreur('La géolocalisation n’est pas disponible sur cet appareil.');
      return;
    }
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        try {
          await api.post(`/livraisons/${selection.id}/position`, {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        } catch {
          /* silencieux */
        }
      },
      () => setErreur('Impossible d’accéder à votre position GPS.'),
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
    setPartagePosition(true);
    toast.succes('Position GPS partagée en direct avec le staff');
  };

  const validerLivraison = async () => {
    if (!selection || !signature) return;
    setErreur('');
    try {
      await api.post(`/livraisons/${selection.id}/valider`, { signatureDataUrl: signature });
      setValidation(true);
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
      setPartagePosition(false);
      toast.succes('Course validée avec succès !');
      charger();
    } catch (err) {
      setErreur(messageErreur(err));
    }
  };

  const telechargerRecu = async (livraisonObj) => {
    setTelechargement(true);
    try {
      await telechargerFichier(`/livraisons/${livraisonObj.id}/recu`, `${livraisonObj.numero}.pdf`);
      toast.succes('Reçu téléchargé avec succès');
    } catch (err) {
      toast.erreur(messageErreur(err) || 'Impossible de télécharger le reçu.');
    } finally {
      setTelechargement(false);
    }
  };

  if (selection) {
    return (
      <div className="min-h-screen flex flex-col bg-sable-50">
        <header className="px-5 py-3.5 border-b border-charbon-100 bg-white/90 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between shadow-sm">
          <button
            onClick={() => {
              setSelection(null);
              setValidation(false);
              setSignature(null);
            }}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Toutes mes courses</span>
          </button>
          <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
            {selection.numero}
          </span>
        </header>

        <main className="flex-1 px-5 py-6 max-w-lg mx-auto w-full space-y-5">
          {validation ? (
            <div className="card p-8 text-center space-y-6 animate-slide-up shadow-card border-emerald-200">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-sahel-dark uppercase tracking-wider mb-2 border border-emerald-200/60">
                  Mission accomplie
                </span>
                <h1 className="font-display text-2xl font-bold text-slate-900">Course terminée & signée</h1>
                <p className="text-slate-500 text-sm mt-1">Le reçu numérique certifié a été généré.</p>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  className="btn-primary w-full flex items-center justify-center gap-2"
                  onClick={() => telechargerRecu(selection)}
                  disabled={telechargement}
                >
                  <FileText className="w-4 h-4" />
                  <span>{telechargement ? 'Téléchargement…' : 'Télécharger le reçu PDF'}</span>
                </button>
                <a
                  className="btn-secondary w-full flex items-center justify-center gap-2"
                  href={`https://wa.me/${(selection.clientTelephone || '').replace(/\D/g, '')}?text=${encodeURIComponent(
                    `Bonjour, votre livraison ${selection.numero} est validée ! Reçu : ${window.location.origin}/verifier/${selection.qrToken}`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Send className="w-4 h-4 text-[#25D366]" />
                  <span>Envoyer la confirmation WhatsApp</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="space-y-5 animate-slide-up">
              {/* Course detail card */}
              <div className="card p-6 shadow-card space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <StatutPill statut={selection.statut} />
                  <span className="font-display font-bold font-mono text-xl text-slate-900">
                    {selection.montant?.toLocaleString('fr-FR')} FCFA
                  </span>
                </div>

                {/* Client info & quick call */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Client à livrer</span>
                    <p className="font-semibold text-slate-800 text-sm">{selection.clientNom || 'Client'}</p>
                    <p className="font-mono text-xs text-slate-500">{selection.clientTelephone}</p>
                  </div>
                  {selection.clientTelephone && (
                    <a
                      href={`tel:${selection.clientTelephone}`}
                      className="btn-primary py-2 px-3.5 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Appeler</span>
                    </a>
                  )}
                </div>

                {/* Trajet visual */}
                <div className="space-y-3 text-xs pt-1">
                  <div className="flex items-start gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
                    <div>
                      <span className="text-slate-400 font-semibold uppercase text-[10px]">Départ</span>
                      <p className="font-medium text-slate-800 text-sm">{selection.adresseDepart}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-800 mt-1 shrink-0" />
                    <div>
                      <span className="text-slate-400 font-semibold uppercase text-[10px]">Destination</span>
                      <p className="font-medium text-slate-800 text-sm">{selection.adresseDestination}</p>
                    </div>
                  </div>
                </div>

                {/* Maps deep link */}
                <a
                  href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
                    selection.adresseDepart
                  )}&destination=${encodeURIComponent(selection.adresseDestination)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary w-full text-xs py-2.5 flex items-center justify-center gap-2"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Ouvrir l'itinéraire Google Maps</span>
                </a>
              </div>

              {/* GPS Live Sharing toggle */}
              <button
                className={`w-full rounded-xl px-5 py-4 font-semibold text-sm transition-all shadow-sm flex items-center justify-center gap-2 border ${
                  partagePosition
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-emerald animate-pulse-subtle'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
                onClick={basculerPartage}
              >
                {partagePosition ? <MapPin className="w-4 h-4" /> : <Radio className="w-4 h-4" />}
                <span>
                  {partagePosition ? 'Position GPS partagée en direct (Actif)' : 'Activer le partage GPS en direct'}
                </span>
              </button>

              {/* Signature Card */}
              <div className="card p-6 shadow-card space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-display font-bold text-sm text-slate-900">Signature du client à la réception</h3>
                  <span className="text-[10px] uppercase font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Obligatoire
                  </span>
                </div>
                <PadSignature onChange={setSignature} />

                {erreur && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                    {erreur}
                  </div>
                )}

                <button
                  className="btn-primary w-full mt-2 flex items-center justify-center gap-2"
                  onClick={validerLivraison}
                  disabled={!signature}
                >
                  <span>Valider et terminer la livraison</span>
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-sable-50">
      <header className="px-5 py-3.5 border-b border-charbon-100 bg-white/90 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between shadow-sm">
        <Logo />
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-slate-600 hidden sm:flex items-center gap-1.5">
            <Bike className="w-3.5 h-3.5 text-sahel" />
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

      <main className="flex-1 px-5 py-6 max-w-lg mx-auto w-full space-y-5 animate-slide-up">
        <div className="flex justify-between items-end">
          <div>
            <span className="text-xs font-bold text-sahel uppercase tracking-wider">Cockpit Livreur</span>
            <h1 className="font-display text-2xl font-bold text-slate-900">Mes Livraisons</h1>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold font-mono">
            {courses.length} course{courses.length > 1 ? 's' : ''}
          </span>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setFiltreStatut('en_cours')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all text-center ${
              filtreStatut === 'en_cours'
                ? 'bg-sahel text-white shadow-emerald shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            En cours
          </button>
          <button
            onClick={() => setFiltreStatut('livree')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all text-center ${
              filtreStatut === 'livree'
                ? 'bg-sahel text-white shadow-emerald shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Historique
          </button>
          <button
            onClick={() => setFiltreStatut('toutes')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all text-center ${
              filtreStatut === 'toutes'
                ? 'bg-sahel text-white shadow-emerald shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Toutes
          </button>
        </div>

        {courses.length === 0 && (
          <div className="card p-10 text-center space-y-4 shadow-card">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Bike className="w-8 h-8 text-slate-400" />
            </div>
            <div>
              <p className="font-display font-semibold text-base text-slate-800">
                {filtreStatut === 'en_cours'
                  ? 'Aucune course en cours assignée'
                  : 'Aucune livraison trouvée dans cette catégorie'}
              </p>
              <p className="text-slate-500 text-xs mt-1 max-w-xs mx-auto">
                {filtreStatut === 'en_cours'
                  ? "Dès qu'une nouvelle livraison vous est attribuée, elle apparaîtra instantanément ici."
                  : 'Vos livraisons terminées apparaîtront dans votre historique.'}
              </p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {courses.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelection(c)}
              className="card p-5 w-full text-left card-hover hover:border-sahel-400 transition-all shadow-card block"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                  {c.numero}
                </span>
                <StatutPill statut={c.statut} />
              </div>
              <p className="font-semibold text-slate-900 text-sm leading-snug">
                {c.adresseDepart} → {c.adresseDestination}
              </p>
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100 text-xs">
                <span className="text-slate-500 font-mono">
                  {c.distanceKm} km · {c.clientTelephone}
                </span>
                <span className="font-display font-bold font-mono text-sm text-sahel-dark">
                  {c.montant?.toLocaleString('fr-FR')} FCFA
                </span>
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
