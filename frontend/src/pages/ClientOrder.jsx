import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  MapPin,
  CreditCard,
  CheckCircle2,
  Flame,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  Send,
  Navigation,
  RefreshCw,
  Phone,
  User,
  ShieldCheck,
  Edit3,
} from 'lucide-react';
import api, { messageErreur } from '../api/client';
import Logo from '../components/Logo';
import SelecteurItineraireMap from '../components/SelecteurItineraireMap';
import { useToast } from '../context/ToastContext';

const ETAPES = [
  { id: 0, titre: 'Trajet', Icon: MapPin },
  { id: 1, titre: 'Tarif & Récap', Icon: CreditCard },
  { id: 2, titre: 'Confirmation', Icon: CheckCircle2 },
];

export default function ClientOrder() {
  const [etape, setEtape] = useState(0);
  const [form, setForm] = useState({
    clientNom: '',
    clientTelephone: '',
    adresseDepart: '',
    adresseDestination: '',
    departLat: null,
    departLng: null,
    destinationLat: null,
    destinationLng: null,
    distanceKm: '',
  });
  const [estimation, setEstimation] = useState(null);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState('');
  const [resultat, setResultat] = useState(null);
  const [modeManuel, setModeManuel] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const champ = (nom) => (e) => {
    const val = e.target.value;
    setForm((f) => ({ ...f, [nom]: val }));
    if (erreur) setErreur('');
  };

  const handleItineraireChange = (data) => {
    setForm((f) => ({
      ...f,
      adresseDepart: data.adresseDepart || f.adresseDepart,
      departLat: data.departLat || f.departLat,
      departLng: data.departLng || f.departLng,
      adresseDestination: data.adresseDestination || f.adresseDestination,
      destinationLat: data.destinationLat || f.destinationLat,
      destinationLng: data.destinationLng || f.destinationLng,
      distanceKm: data.distanceKm ? String(data.distanceKm) : f.distanceKm,
    }));
    if (data.montantEstime) {
      setEstimation({
        distanceKm: data.distanceKm,
        montant: data.montantEstime,
      });
    }
    if (erreur) setErreur('');
  };

  const passerAuRecap = async (e) => {
    e.preventDefault();
    setErreur('');
    if (!form.adresseDepart.trim() || !form.adresseDestination.trim() || !form.distanceKm || !form.clientTelephone.trim()) {
      setErreur('Veuillez renseigner le départ, la destination, et votre numéro de téléphone.');
      return;
    }

    const dist = parseFloat(form.distanceKm);
    if (Number.isNaN(dist) || dist <= 0) {
      setErreur('Veuillez sélectionner votre trajet sur la carte ou saisir une distance valide.');
      return;
    }

    setChargement(true);
    try {
      const { data } = await api.get('/public/estimation', { params: { distanceKm: form.distanceKm } });
      setEstimation(data);
      setEtape(1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setErreur(messageErreur(err));
    } finally {
      setChargement(false);
    }
  };

  const confirmerCommande = async () => {
    setChargement(true);
    setErreur('');
    try {
      const { data } = await api.post('/public/livraisons', form);
      setResultat(data);
      setEtape(2);
      toast.succes('Commande enregistrée avec succès !');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setErreur(messageErreur(err));
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-sable-50">
      {/* Navigation Header */}
      <header className="px-5 py-3.5 border-b border-charbon-100 bg-white/90 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between shadow-sm">
        <Logo />
        <div className="flex items-center gap-3">
          <Link
            to="/gaz"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-sahel-dark hover:bg-emerald-100 transition-colors border border-emerald-200/50"
          >
            <Flame className="w-3.5 h-3.5 text-sahel fill-sahel/20" />
            <span>Trouver du gaz</span>
          </Link>
          <Link
            to="/connexion"
            className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors hidden sm:inline-block"
          >
            Espace Pro
          </Link>
        </div>
      </header>

      {/* Stepper Header */}
      <div className="px-5 pt-6 pb-2 max-w-lg mx-auto w-full">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 w-full -z-0" />
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-sahel transition-all duration-300 -z-0"
            style={{ width: `${(etape / (ETAPES.length - 1)) * 100}%` }}
          />

          {ETAPES.map((item, i) => {
            const fait = i < etape;
            const actuel = i === etape;
            const StepIcon = item.Icon;
            return (
              <div key={item.id} className="relative z-10 flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-200 shadow-sm ${
                    actuel
                      ? 'bg-sahel text-white ring-4 ring-emerald-100 scale-110 shadow-emerald'
                      : fait
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white border-2 border-slate-200 text-slate-400'
                  }`}
                >
                  {fait ? <CheckCircle2 className="w-4 h-4" /> : <StepIcon className="w-4 h-4" />}
                </div>
                <span
                  className={`text-[11px] font-medium mt-1.5 whitespace-nowrap ${
                    actuel ? 'text-sahel-dark font-bold' : fait ? 'text-slate-700' : 'text-slate-400'
                  }`}
                >
                  {item.titre}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Container */}
      <main className="flex-1 px-5 py-6 max-w-lg mx-auto w-full">
        {etape === 0 && (
          <form onSubmit={passerAuRecap} className="space-y-5 animate-slide-up">
            <div className="card p-6 md:p-8 shadow-card space-y-2">
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 uppercase tracking-wider mb-1 border border-amber-200/60">
                Sans inscription
              </span>
              <h1 className="font-display text-2xl font-bold text-slate-900">Commander une course</h1>
              <p className="text-slate-500 text-xs leading-relaxed">
                Recherchez vos adresses ou déplacez les repères sur la carte. La distance et le tarif sont calculés automatiquement.
              </p>
            </div>

            {/* Interactive Map Route Picker */}
            <SelecteurItineraireMap
              initialDepart={form.adresseDepart}
              initialDestination={form.adresseDestination}
              initialDistance={form.distanceKm}
              onItineraireChange={handleItineraireChange}
            />

            {/* Contact Details Card */}
            <div className="card p-5 md:p-6 shadow-card space-y-4">
              <h3 className="font-display font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <User className="w-4 h-4 text-sahel" />
                <span>Vos coordonnées</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 block">
                    Votre nom <span className="text-slate-400 font-normal lowercase">(optionnel)</span>
                  </label>
                  <div className="relative">
                    <input
                      className="input pl-8 text-xs"
                      placeholder="Ex : Salif"
                      value={form.clientNom}
                      onChange={champ('clientNom')}
                    />
                    <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 block">
                    Numéro de téléphone
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      className="input font-mono pl-8 text-xs"
                      placeholder="Ex : 70 12 34 56"
                      value={form.clientTelephone}
                      onChange={champ('clientTelephone')}
                      required
                    />
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>

              {/* Toggle manual distance override */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setModeManuel(!modeManuel)}
                  className="text-[11px] font-medium text-slate-400 hover:text-slate-600 flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>{modeManuel ? 'Masquer ajustement manuel' : 'Ajuster distance manuellement'}</span>
                </button>
                {form.distanceKm && (
                  <span className="text-xs font-mono font-bold text-sahel-dark bg-emerald-50 px-2 py-0.5 rounded">
                    {form.distanceKm} km
                  </span>
                )}
              </div>

              {modeManuel && (
                <div className="pt-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1 block">
                    Distance personnalisée (km)
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    className="input font-mono text-xs"
                    value={form.distanceKm}
                    onChange={champ('distanceKm')}
                    required
                  />
                </div>
              )}
            </div>

            {erreur && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{erreur}</span>
              </div>
            )}

            <button type="submit" className="btn-primary w-full text-base flex items-center justify-center gap-2 py-3.5" disabled={chargement}>
              <span>{chargement ? 'Calcul en cours…' : 'Valider mon itinéraire'}</span>
              {!chargement && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        )}

        {etape === 1 && estimation && (
          <div className="card p-6 md:p-8 space-y-6 animate-slide-up shadow-card">
            <div>
              <h1 className="font-display text-2xl font-bold text-slate-900">Récapitulatif de la course</h1>
              <p className="text-slate-500 text-sm mt-1">Vérifiez les informations avant de confirmer.</p>
            </div>

            {/* Trajet visual card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center pt-1">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
                  <div
                    className="w-0.5 h-12 my-1"
                    style={{
                      background: 'repeating-linear-gradient(to bottom, #167942 0 4px, transparent 4px 8px)',
                    }}
                  />
                  <div className="w-3 h-3 rounded-full bg-slate-800 ring-4 ring-slate-200" />
                </div>
                <div className="flex-1 space-y-5">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Départ</span>
                    <p className="font-semibold text-slate-800 text-sm leading-snug">{form.adresseDepart}</p>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Destination</span>
                    <p className="font-semibold text-slate-800 text-sm leading-snug">{form.adresseDestination}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Price Box */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-sahel-dark via-sahel to-emerald-700 text-white shadow-emerald flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs uppercase tracking-wider text-emerald-200 font-semibold">Tarif Garanti</span>
                  <p className="font-display text-3xl font-bold font-mono mt-1">
                    {estimation.montant.toLocaleString('fr-FR')} FCFA
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold font-mono">
                  {estimation.distanceKm} km
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-emerald-100/80 mt-3 pt-3 border-t border-white/10">
                <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0" />
                <span>Paiement à la livraison • Reçu PDF certifié avec QR Code</span>
              </div>
            </div>

            {erreur && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{erreur}</span>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button type="button" className="btn-secondary flex-1 flex items-center justify-center gap-2" onClick={() => setEtape(0)}>
                <ArrowLeft className="w-4 h-4" />
                <span>Modifier</span>
              </button>
              <button
                type="button"
                className="btn-primary flex-1 flex items-center justify-center gap-2"
                onClick={confirmerCommande}
                disabled={chargement}
              >
                <span>{chargement ? 'Enregistrement…' : 'Confirmer la course'}</span>
                {!chargement && <CheckCircle2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {etape === 2 && resultat && (
          <div className="card p-6 md:p-8 space-y-6 text-center animate-slide-up shadow-card">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-3xl shadow-md">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>

            <div>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-sahel-dark uppercase tracking-wider mb-2 border border-emerald-200/60">
                Commande validée
              </span>
              <h1 className="font-display text-2xl font-bold text-slate-900">Votre course est en route !</h1>
              <p className="text-slate-500 text-sm mt-1">
                Numéro de suivi :{' '}
                <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                  {resultat.livraison.numero}
                </span>
              </p>
            </div>

            {resultat.lienWhatsAppNotification && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200/70 space-y-2.5">
                <p className="text-xs text-emerald-900 font-medium">
                  Pour accélérer la prise en charge, notifiez notre équipe en 1 clic :
                </p>
                <a
                  href={resultat.lienWhatsAppNotification}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary w-full bg-[#25D366] hover:bg-[#1EBE5D] shadow-none flex items-center justify-center gap-2 text-white"
                >
                  <Send className="w-4 h-4" />
                  <span>Envoyer sur WhatsApp</span>
                </a>
              </div>
            )}

            <div className="flex flex-col gap-2 pt-2">
              <button
                className="btn-primary w-full flex items-center justify-center gap-2"
                onClick={() => navigate(`/suivi/${resultat.livraison.numero}`)}
              >
                <Navigation className="w-4 h-4" />
                <span>Suivre la livraison en direct</span>
              </button>
              <button
                className="btn-secondary w-full flex items-center justify-center gap-2"
                onClick={() => {
                  setForm({
                    clientNom: '',
                    clientTelephone: '',
                    adresseDepart: '',
                    adresseDestination: '',
                    distanceKm: '',
                  });
                  setEstimation(null);
                  setResultat(null);
                  setEtape(0);
                }}
              >
                <RefreshCw className="w-4 h-4" />
                <span>Commander une autre course</span>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
