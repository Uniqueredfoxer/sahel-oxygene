import { useState, useRef } from 'react';
import { CheckCircle2, Send, PlusCircle, Phone, User, MapPin, Edit3 } from 'lucide-react';
import api, { messageErreur } from '../../api/client';
import SelecteurItineraireMap from '../../components/SelecteurItineraireMap';
import { useToast } from '../../context/ToastContext';

export default function CommanderTab() {
  const [telephone, setTelephone] = useState('');
  const [suggestions, setSuggestions] = useState([]);
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
  const [montantEstime, setMontantEstime] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);
  const [modeManuel, setModeManuel] = useState(false);
  const debounceRef = useRef(null);
  const toast = useToast();

  const champ = (nom) => (e) => setForm((f) => ({ ...f, [nom]: e.target.value }));

  const rechercherClient = (val) => {
    setTelephone(val);
    setForm((f) => ({ ...f, clientTelephone: val }));
    clearTimeout(debounceRef.current);
    if (val.length < 3) return setSuggestions([]);
    debounceRef.current = setTimeout(async () => {
      try {
        const { data } = await api.get('/clients');
        const filtres = data.filter((c) => (c.clientTelephone || '').includes(val));
        setSuggestions(filtres.slice(0, 5));
      } catch {
        /* ignore */
      }
    }, 250);
  };

  const preRemplir = (client) => {
    setForm((f) => ({
      ...f,
      clientNom: client.clientNom || '',
      clientTelephone: client.clientTelephone,
    }));
    setTelephone(client.clientTelephone);
    setSuggestions([]);
    toast.info(`Client ${client.clientNom || client.clientTelephone} sélectionné`);
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
      setMontantEstime(data.montantEstime);
    }
  };

  const estimer = async (dist) => {
    const val = dist !== undefined ? dist : form.distanceKm;
    if (!val || parseFloat(val) <= 0) {
      setMontantEstime(null);
      return;
    }
    try {
      const { data } = await api.get('/public/estimation', { params: { distanceKm: val } });
      setMontantEstime(data.montant);
    } catch {
      setMontantEstime(null);
    }
  };

  const soumettre = async (e) => {
    e.preventDefault();
    setErreur('');
    if (!form.adresseDepart.trim() || !form.adresseDestination.trim() || !form.distanceKm || !form.clientTelephone.trim()) {
      setErreur('Veuillez renseigner le téléphone, le départ, la destination et la distance.');
      return;
    }

    setChargement(true);
    try {
      const { data } = await api.post('/livraisons', form);
      setConfirmation(data);
      toast.succes(`Commande ${data.numero} créée avec succès !`);
      setForm({
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
      setTelephone('');
      setMontantEstime(null);
    } catch (err) {
      setErreur(messageErreur(err));
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="max-w-xl space-y-6 animate-slide-up">
      <div>
        <span className="text-xs font-bold text-sahel uppercase tracking-wider">Prise de commande</span>
        <h1 className="font-display text-2xl font-bold text-slate-900">Enregistrer une course</h1>
        <p className="text-slate-500 text-xs mt-1">
          Saisie directe pour les commandes reçues par appel téléphonique ou comptoir.
        </p>
      </div>

      {confirmation && (
        <div className="card p-5 bg-emerald-50 border-emerald-200 text-sahel-dark flex items-center justify-between animate-slide-up shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-display font-bold text-base text-slate-900">
                Commande {confirmation.numero} enregistrée
              </p>
              <p className="text-xs text-emerald-800">
                Tarif : {confirmation.montant?.toLocaleString('fr-FR')} FCFA • Statut : En attente
              </p>
            </div>
          </div>
          <button
            className="text-xs font-bold text-sahel-dark hover:underline"
            onClick={() => setConfirmation(null)}
          >
            Fermer
          </button>
        </div>
      )}

      <form onSubmit={soumettre} className="space-y-4">
        {/* Contact info card */}
        <div className="card p-5 shadow-card space-y-3">
          <h3 className="font-display font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-sahel" />
            <span>Fiche Client</span>
          </h3>

          {/* Telephone with autocomplete */}
          <div className="relative">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1 block">
              Téléphone du client
            </label>
            <div className="relative">
              <input
                className="input font-mono text-xs pl-9"
                value={telephone}
                onChange={(e) => rechercherClient(e.target.value)}
                placeholder="Ex : 70 12 34 56 (recherche auto-complétée)"
                required
              />
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            {suggestions.length > 0 && (
              <div className="absolute z-30 w-full bg-white border border-slate-200 rounded-xl mt-1 shadow-lg overflow-hidden divide-y divide-slate-100">
                {suggestions.map((s) => (
                  <button
                    type="button"
                    key={s.clientTelephoneNormalise}
                    onClick={() => preRemplir(s)}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-xs flex justify-between items-center transition-colors"
                  >
                    <span className="font-semibold text-slate-800">{s.clientNom || 'Client sans nom'}</span>
                    <span className="font-mono text-slate-500 font-bold">{s.clientTelephone}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1 block">
              Nom du client <span className="text-slate-400 font-normal lowercase">(optionnel)</span>
            </label>
            <div className="relative">
              <input
                className="input text-xs pl-9"
                placeholder="Ex : Madame Traoré"
                value={form.clientNom}
                onChange={champ('clientNom')}
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>

        {/* Interactive Map Itinerary Picker */}
        <SelecteurItineraireMap
          initialDepart={form.adresseDepart}
          initialDestination={form.adresseDestination}
          initialDistance={form.distanceKm}
          onItineraireChange={handleItineraireChange}
        />

        {/* Distance summary and manual toggle */}
        <div className="card p-4 shadow-card space-y-2">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setModeManuel(!modeManuel)}
              className="text-[11px] font-medium text-slate-400 hover:text-slate-600 flex items-center gap-1"
            >
              <Edit3 className="w-3 h-3" />
              <span>{modeManuel ? 'Masquer ajustement manuel' : 'Ajuster distance manuellement'}</span>
            </button>
            {form.distanceKm && (
              <span className="text-xs font-mono font-bold text-sahel-dark bg-emerald-50 px-2.5 py-1 rounded">
                Distance : {form.distanceKm} km
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
                step="0.1"
                min="0.1"
                className="input font-mono text-xs"
                placeholder="Ex : 5.2"
                value={form.distanceKm}
                onChange={(e) => {
                  champ('distanceKm')(e);
                  estimer(e.target.value);
                }}
                onBlur={() => estimer()}
                required
              />
            </div>
          )}
        </div>

        {erreur && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {erreur}
          </div>
        )}

        <button type="submit" className="btn-primary w-full text-xs py-3.5 flex items-center justify-center gap-2" disabled={chargement}>
          <Send className="w-4 h-4" />
          <span>{chargement ? 'Création en cours…' : 'Créer et envoyer au dispatch'}</span>
        </button>
      </form>
    </div>
  );
}
