import { useEffect, useState } from 'react';
import api, { messageErreur } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { obtenirPositionGPS, extraireCoordonnees } from '../../utils/geo';

export default function GazVendeursTab() {
  const [vendeurs, setVendeurs] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [formOuvert, setFormOuvert] = useState(false);
  const [detectingGPS, setDetectingGPS] = useState(false);
  const [collerMaps, setCollerMaps] = useState('');
  const [form, setForm] = useState({
    nom: '',
    telephone: '',
    description: '',
    lat: '',
    lng: '',
    creerCompte: false,
    email: '',
    password: '',
  });
  const [envoi, setEnvoi] = useState(false);
  const toast = useToast();

  const charger = async () => {
    setChargement(true);
    try {
      const { data } = await api.get('/gaz/vendeurs');
      setVendeurs(data);
    } catch (err) {
      setErreur(messageErreur(err));
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    charger();
  }, []);

  const champ = (nom) => (e) =>
    setForm((f) => ({ ...f, [nom]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const utiliserMaPosition = async () => {
    setDetectingGPS(true);
    toast.info('📡 Recherche de votre position GPS…');
    try {
      const pos = await obtenirPositionGPS();
      setForm((f) => ({
        ...f,
        lat: pos.lat.toFixed(7),
        lng: pos.lng.toFixed(7),
      }));
      toast.succes(`Position GPS détectée avec succès (${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)}) !`);
    } catch (err) {
      toast.erreur(err.message || 'Impossible de capturer la position GPS.');
    } finally {
      setDetectingGPS(false);
    }
  };

  const handleCollerMaps = (val) => {
    setCollerMaps(val);
    if (!val) return;
    const coords = extraireCoordonnees(val);
    if (coords) {
      setForm((f) => ({
        ...f,
        lat: coords.lat.toFixed(7),
        lng: coords.lng.toFixed(7),
      }));
      toast.succes(`Coordonnées extraites : ${coords.lat}, ${coords.lng}`);
    }
  };

  const soumettre = async (e) => {
    e.preventDefault();
    setErreur('');
    setEnvoi(true);
    try {
      await api.post('/gaz/vendeurs', form);
      setForm({
        nom: '',
        telephone: '',
        description: '',
        lat: '',
        lng: '',
        creerCompte: false,
        email: '',
        password: '',
      });
      setFormOuvert(false);
      toast.succes('Point de vente de gaz créé avec succès !');
      charger();
    } catch (err) {
      setErreur(messageErreur(err));
    } finally {
      setEnvoi(false);
    }
  };

  const basculerActif = async (v) => {
    try {
      await api.patch(`/gaz/vendeurs/${v.id}`, { actif: !v.actif });
      toast.info(`Statut de "${v.nom}" mis à jour.`);
      charger();
    } catch (err) {
      toast.erreur(messageErreur(err));
    }
  };

  const supprimer = async (v) => {
    if (!window.confirm(`Supprimer définitivement le coin de gaz "${v.nom}" ?`)) return;
    try {
      await api.delete(`/gaz/vendeurs/${v.id}`);
      toast.succes(`Point "${v.nom}" supprimé.`);
      charger();
    } catch {
      toast.erreur('Impossible de supprimer ce vendeur.');
    }
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-sahel uppercase tracking-wider">Réseau Gaz</span>
          <h1 className="font-display text-2xl font-bold text-slate-900">Points de vente de gaz</h1>
          <p className="text-slate-500 text-xs mt-1">
            Gérez les revendeurs partenaires et visualisez leur disponibilité en temps réel.
          </p>
        </div>
        <button
          className="btn-primary text-xs py-2 px-4 self-start sm:self-auto"
          onClick={() => setFormOuvert((v) => !v)}
        >
          {formOuvert ? '✕ Fermer le formulaire' : '+ Ajouter un point de vente'}
        </button>
      </div>

      {formOuvert && (
        <form onSubmit={soumettre} className="card p-6 shadow-card space-y-4 max-w-xl animate-slide-up border-emerald-200">
          <h2 className="font-display font-bold text-base text-slate-900">Nouveau point de vente de gaz</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 block">
                Nom du point / boutique
              </label>
              <input
                className="input text-xs"
                placeholder="Ex : Station Gaz Koulouba"
                value={form.nom}
                onChange={champ('nom')}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 block">
                Téléphone de contact
              </label>
              <input
                type="tel"
                className="input font-mono text-xs"
                placeholder="Ex : 70 12 34 56"
                value={form.telephone}
                onChange={champ('telephone')}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 block">
              Description / Repères (optionnel)
            </label>
            <input
              className="input text-xs"
              placeholder="Ex : Face à la pharmacie, bouteilles Total et Oryx"
              value={form.description}
              onChange={champ('description')}
            />
          </div>

          {/* Coordonnées GPS */}
          <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Coordonnées de géolocalisation
              </span>
              <button
                type="button"
                onClick={utiliserMaPosition}
                disabled={detectingGPS}
                className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 font-semibold text-sahel-dark border-emerald-300 bg-white hover:bg-emerald-50 self-start sm:self-auto shadow-xs"
              >
                <span>{detectingGPS ? '⏳' : '📍'}</span>
                <span>{detectingGPS ? 'Détection GPS en cours…' : 'Utiliser ma position GPS actuelle'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 mb-1 block">
                  Latitude
                </label>
                <input
                  className="input font-mono text-xs bg-white"
                  placeholder="Ex : 12.3714"
                  value={form.lat}
                  onChange={champ('lat')}
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 mb-1 block">
                  Longitude
                </label>
                <input
                  className="input font-mono text-xs bg-white"
                  placeholder="Ex : -1.5197"
                  value={form.lng}
                  onChange={champ('lng')}
                  required
                />
              </div>
            </div>

            {/* Smart Google Maps paste helper */}
            <div className="pt-2 border-t border-slate-200/60">
              <label className="text-[11px] font-semibold text-slate-500 mb-1 block flex items-center justify-between">
                <span>Ou coller un lien Google Maps ou "lat, lng"</span>
                <span className="text-[10px] text-slate-400 font-normal">Extraction automatique</span>
              </label>
              <input
                className="input text-xs bg-white"
                placeholder="Ex : https://maps.app.goo.gl/... ou 12.3714, -1.5197"
                value={collerMaps}
                onChange={(e) => handleCollerMaps(e.target.value)}
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                className="rounded text-sahel"
                checked={form.creerCompte}
                onChange={champ('creerCompte')}
              />
              <span>Créer un compte d'accès pour ce vendeur</span>
            </label>
            <p className="text-[11px] text-slate-500">
              Le vendeur pourra se connecter sur son smartphone pour activer/désactiver son stock en direct.
            </p>
            {form.creerCompte && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <input
                  type="email"
                  className="input text-xs"
                  placeholder="Email du vendeur"
                  value={form.email}
                  onChange={champ('email')}
                  required={form.creerCompte}
                />
                <input
                  type="password"
                  className="input text-xs"
                  placeholder="Mot de passe temporaire"
                  value={form.password}
                  onChange={champ('password')}
                  required={form.creerCompte}
                  minLength={6}
                />
              </div>
            )}
          </div>

          {erreur && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {erreur}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button type="submit" className="btn-primary flex-1 text-xs" disabled={envoi}>
              {envoi ? 'Enregistrement…' : 'Enregistrer le vendeur ✓'}
            </button>
            <button
              type="button"
              className="btn-secondary text-xs"
              onClick={() => setFormOuvert(false)}
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      {chargement && (
        <div className="card p-8 text-center space-y-3 shadow-card">
          <div className="route-line w-36 mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Chargement des revendeurs de gaz…</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {vendeurs.map((v) => (
          <div
            key={v.id}
            className={`card p-5 shadow-card space-y-3 transition-all ${
              !v.actif ? 'opacity-60 bg-slate-50' : 'bg-white'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-slate-900 text-base">{v.nom}</h3>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      v.disponible
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        v.disponible ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                      }`}
                    />
                    {v.disponible ? 'En stock' : 'Rupture'}
                  </span>
                </div>
                {v.description && (
                  <p className="text-xs text-slate-500 leading-relaxed">{v.description}</p>
                )}
                <div className="flex items-center gap-2 mt-2 text-xs">
                  {v.telephone && (
                    <a
                      href={`tel:${v.telephone}`}
                      className="font-mono font-semibold text-sahel-dark hover:underline flex items-center gap-1"
                    >
                      <span>📞</span>
                      <span>{v.telephone}</span>
                    </a>
                  )}
                  <span className="text-slate-300">•</span>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${v.lat},${v.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-slate-400 hover:text-slate-700 text-[11px]"
                  >
                    📍 {v.lat}, {v.lng}
                  </a>
                </div>
              </div>
            </div>

            {v.vendeur && (
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs flex items-center justify-between">
                <span className="text-slate-400">Compte associé :</span>
                <span className="font-medium text-slate-700 font-mono">{v.vendeur.email}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                className={`text-xs font-semibold px-3 py-1 rounded-lg border transition-colors ${
                  v.actif
                    ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200'
                }`}
                onClick={() => basculerActif(v)}
              >
                {v.actif ? 'Désactiver' : 'Activer'}
              </button>

              <button
                className="text-xs text-rose-600 hover:text-rose-800 font-medium hover:underline"
                onClick={() => supprimer(v)}
              >
                Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
