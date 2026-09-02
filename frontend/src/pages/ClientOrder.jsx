import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  MapPin,
  CreditCard,
  CheckCircle2,
  Flame,
  Package,
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
  Plus,
  Minus,
  Check,
  Receipt,
  Truck,
  Tag,
  Trash2,
  Layers,
  FileText,
  Loader2,
} from 'lucide-react';
import api, { messageErreur } from '../api/client';
import { telechargerFichier } from '../utils/download';
import Logo from '../components/Logo';
import SelecteurItineraireMap from '../components/SelecteurItineraireMap';
import { useToast } from '../context/ToastContext';

const ETAPES = [
  { id: 0, titre: 'Commande', Icon: Flame },
  { id: 1, titre: 'Tarif & Récap', Icon: CreditCard },
  { id: 2, titre: 'Confirmation', Icon: CheckCircle2 },
];

const MARQUES_GAZ = [
  { id: 'sodigaz', label: 'Sodigaz' },
  { id: 'total', label: 'Total' },
  { id: 'oryx', label: 'Oryx' },
  { id: 'shell', label: 'Shell' },
  { id: 'petrofa', label: 'Petrofa' },
  { id: 'autre', label: 'Autre' },
];

const TYPES_BOUTEILLES = [
  {
    id: 'recharge_6kg',
    label: 'Recharge 6 kg (B6)',
    desc: 'Échange standard bouteille vide contre pleine',
    prixUnitaire: 2000,
    badge: 'petite bouteille',
    capacite: '6 kg',
  },
  {
    id: 'recharge_12kg',
    label: 'Recharge 12.5 kg (B12)',
    desc: 'Grand format pour ménages et cuisine',
    prixUnitaire: 5500,
    badge: 'grande bouteille',
    capacite: '12.5 kg',
  },
  {
    id: 'complete_6kg',
    label: 'Complète 6 kg (Bouteille + Gaz)',
    desc: 'Bouteille consignée neuve + première charge',
    prixUnitaire: 27000,
    capacite: '6 kg',
  },
  {
    id: 'complete_12kg',
    label: 'Complète 12.5 kg (Bouteille + Gaz)',
    desc: 'Bouteille consignée neuve + première charge',
    prixUnitaire: 55500,
    capacite: '12.5 kg',
  },
];

function calculerFraisLivraisonLocal(distKm) {
  const d = parseFloat(distKm);
  if (Number.isNaN(d) || d <= 0) return 1000;
  if (d <= 4) return 1000;
  if (d <= 8) return 1500;
  return 1500 + Math.ceil(d - 8) * 100;
}

export default function ClientOrder() {
  const [modeService, setModeService] = useState('gaz'); // 'gaz' | 'course'
  
  // Panier multi-bouteilles
  const [panierGaz, setPanierGaz] = useState([
    {
      id: 1,
      marque: 'sodigaz',
      typeBouteille: 'recharge_6kg',
      quantite: 1,
    },
  ]);

  const [descriptionColis, setDescriptionColis] = useState('');

  const [etape, setEtape] = useState(0);
  const [form, setForm] = useState({
    clientNom: '',
    clientTelephone: '',
    adresseDepart: 'Dépôt SAHEL OXYGENE (Djaradougou, Bobo-Dioulasso)',
    adresseDestination: '',
    departLat: 11.1850,
    departLng: -4.2980,
    destinationLat: null,
    destinationLng: null,
    distanceKm: '',
  });

  const [estimation, setEstimation] = useState(null);
  const [chargement, setChargement] = useState(false);
  const [telechargeantRecu, setTelechargeantRecu] = useState(false);
  const [erreur, setErreur] = useState('');
  const [resultat, setResultat] = useState(null);
  const navigate = useNavigate();
  const toast = useToast();

  // Gestion du panier
  const ajouterBouteille = () => {
    setPanierGaz((prev) => [
      ...prev,
      {
        id: Date.now(),
        marque: 'sodigaz',
        typeBouteille: 'recharge_6kg',
        quantite: 1,
      },
    ]);
  };

  const supprimerBouteille = (id) => {
    if (panierGaz.length <= 1) return;
    setPanierGaz((prev) => prev.filter((item) => item.id !== id));
  };

  const modifierLigne = (id, champ, valeur) => {
    setPanierGaz((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [champ]: valeur } : item))
    );
  };

  // Calculs financiers
  const sousTotalGaz =
    modeService === 'gaz'
      ? panierGaz.reduce((acc, item) => {
          const b = TYPES_BOUTEILLES.find((t) => t.id === item.typeBouteille);
          return acc + (b?.prixUnitaire || 2000) * item.quantite;
        }, 0)
      : 0;

  const totalBouteilles =
    modeService === 'gaz' ? panierGaz.reduce((acc, item) => acc + item.quantite, 0) : 0;

  const distanceValide = Boolean(form.distanceKm && parseFloat(form.distanceKm) > 0);
  const destinationRenseignee = Boolean(
    form.adresseDestination && form.adresseDestination.trim().length > 0
  );
  const itinerairePret = distanceValide && destinationRenseignee;

  const fraisLivraisonEstime = itinerairePret
    ? estimation?.montant || calculerFraisLivraisonLocal(form.distanceKm)
    : null;

  const totalGeneralEstime =
    fraisLivraisonEstime !== null ? sousTotalGaz + fraisLivraisonEstime : null;

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

    if (!form.adresseDestination.trim() || !form.clientTelephone.trim()) {
      setErreur('Veuillez renseigner votre adresse de livraison et votre numéro de téléphone.');
      return;
    }

    if (modeService === 'course' && !form.adresseDepart.trim()) {
      setErreur('Veuillez renseigner l’adresse d’enlèvement (départ).');
      return;
    }

    const dist = parseFloat(form.distanceKm);
    if (Number.isNaN(dist) || dist <= 0) {
      setErreur('Veuillez sélectionner votre lieu de livraison sur la carte.');
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

    // Description textuelle complète du panier
    let detailArticle = '';
    if (modeService === 'gaz') {
      const lignes = panierGaz.map((item) => {
        const b = TYPES_BOUTEILLES.find((t) => t.id === item.typeBouteille);
        const m = MARQUES_GAZ.find((mg) => mg.id === item.marque);
        return `${item.quantite}x ${b?.label || 'Bouteille'} [${m?.label || item.marque}]`;
      });
      detailArticle = lignes.join(' + ');
    } else {
      detailArticle = descriptionColis || 'Course Express';
    }

    const montantTotal =
      (modeService === 'gaz' ? sousTotalGaz : 0) +
      (estimation?.montant || fraisLivraisonEstime || 1000);

    const payload = {
      ...form,
      montant: montantTotal,
      clientNom: form.clientNom ? `${form.clientNom} [${detailArticle}]` : `[${detailArticle}]`,
    };

    try {
      const { data } = await api.post('/public/livraisons', payload);
      setResultat({
        ...data,
        detailArticle,
        panierGaz: [...panierGaz],
        sousTotalGaz,
        fraisLivraison: estimation?.montant || fraisLivraisonEstime || 1000,
        totalGeneral: montantTotal,
        totalBouteilles,
      });
      setEtape(2);
      toast.succes('Commande enregistrée avec succès !');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setErreur(messageErreur(err));
    } finally {
      setChargement(false);
    }
  };

  const telechargerRecuPDF = async () => {
    if (!resultat?.livraison?.qrToken) return;
    setTelechargeantRecu(true);
    try {
      await telechargerFichier(
        `/public/recu/${resultat.livraison.qrToken}`,
        `recu-${resultat.livraison.numero}.pdf`
      );
      toast.succes('Reçu PDF téléchargé avec succès');
    } catch {
      toast.erreur('Impossible de télécharger le reçu.');
    } finally {
      setTelechargeantRecu(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-sable-50">
      {/* Navigation Header */}
      <header className="px-5 py-3.5 border-b border-charbon-100 bg-white/90 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between shadow-xs">
        <Logo />
        <div className="flex items-center gap-3">
          <Link
            to="/gaz"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-sahel-dark hover:bg-emerald-100 transition-colors border border-emerald-200/60"
          >
            <Flame className="w-3.5 h-3.5 text-sahel fill-sahel/20" />
            <span>Points de vente</span>
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
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-200 shadow-xs ${
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
            {/* Mode Switcher Tabs */}
            <div className="bg-slate-200/80 p-1 rounded-2xl grid grid-cols-2 gap-1 shadow-inner">
              <button
                type="button"
                onClick={() => {
                  setModeService('gaz');
                  setForm((f) => ({
                    ...f,
                    adresseDepart: 'Dépôt SAHEL OXYGENE (Djaradougou, Bobo-Dioulasso)',
                    departLat: 11.1850,
                    departLng: -4.2980,
                  }));
                }}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  modeService === 'gaz'
                    ? 'bg-white text-sahel-dark shadow-sm scale-100'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Flame className={`w-4 h-4 ${modeService === 'gaz' ? 'text-sahel fill-sahel/30' : ''}`} />
                <span>Bouteille de Gaz</span>
              </button>

              <button
                type="button"
                onClick={() => setModeService('course')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  modeService === 'course'
                    ? 'bg-white text-slate-900 shadow-sm scale-100'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Package className={`w-4 h-4 ${modeService === 'course' ? 'text-slate-900' : ''}`} />
                <span>Course Express / Colis</span>
              </button>
            </div>

            {/* Bouteille Selector (Gas Mode - Multi-bouteilles) */}
            {modeService === 'gaz' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-display font-bold text-sm text-slate-900 flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-sahel" />
                    <span>Vos bouteilles de gaz</span>
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Dépôt Djaradougou
                  </span>
                </div>

                {panierGaz.map((item, index) => {
                  const bouteilleInfo =
                    TYPES_BOUTEILLES.find((b) => b.id === item.typeBouteille) || TYPES_BOUTEILLES[0];
                  const marqueInfo =
                    MARQUES_GAZ.find((m) => m.id === item.marque) || MARQUES_GAZ[0];
                  const sousTotalLigne = bouteilleInfo.prixUnitaire * item.quantite;

                  return (
                    <div
                      key={item.id}
                      className="card p-4 shadow-card bg-white border border-slate-200 rounded-2xl space-y-3.5 relative animate-fade-in"
                    >
                      {/* Header de la ligne */}
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-emerald-100 text-sahel font-bold text-xs flex items-center justify-center">
                            {index + 1}
                          </span>
                          <span className="font-display font-bold text-xs text-slate-800">
                            Bouteille #{index + 1}
                          </span>
                        </div>

                        {panierGaz.length > 1 && (
                          <button
                            type="button"
                            onClick={() => supprimerBouteille(item.id)}
                            className="text-slate-400 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 transition-colors"
                            title="Retirer cet article"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* 1. Sélection de la Marque */}
                      <div>
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1.5">
                          Marque de la bouteille
                        </label>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                          {MARQUES_GAZ.map((m) => {
                            const estChoisi = item.marque === m.id;
                            return (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => modifierLigne(item.id, 'marque', m.id)}
                                className={`py-1.5 px-1.5 rounded-xl text-[11px] font-bold transition-all border text-center flex flex-col items-center justify-center ${
                                  estChoisi
                                    ? 'border-sahel bg-emerald-50 text-sahel-dark ring-2 ring-sahel/30 shadow-xs'
                                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                                }`}
                              >
                                <span className="truncate w-full">{m.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* 2. Format / Type de bouteille */}
                      <div>
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1.5">
                          Format / Type
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {TYPES_BOUTEILLES.map((b) => {
                            const estChoisi = item.typeBouteille === b.id;
                            return (
                              <div
                                key={b.id}
                                onClick={() => modifierLigne(item.id, 'typeBouteille', b.id)}
                                className={`cursor-pointer p-2.5 rounded-xl border transition-all relative ${
                                  estChoisi
                                    ? 'border-sahel bg-emerald-50/50 ring-2 ring-sahel/20 shadow-xs'
                                    : 'border-slate-200 hover:border-slate-300 bg-white'
                                }`}
                              >
                                {b.badge && (
                                  <span className="absolute top-1.5 right-1.5 text-[8px] font-bold px-1 py-0.5 rounded bg-amber-100 text-amber-800">
                                    {b.badge}
                                  </span>
                                )}
                                <div className="flex items-start gap-2">
                                  <div
                                    className={`w-3.5 h-3.5 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                                      estChoisi ? 'border-sahel bg-sahel text-white' : 'border-slate-300'
                                    }`}
                                  >
                                    {estChoisi && <Check className="w-2 h-2" />}
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-slate-900 leading-tight">{b.label}</p>
                                    <p className="text-[11px] font-mono font-bold text-sahel-dark mt-0.5">
                                      {b.prixUnitaire.toLocaleString('fr-FR')} FCFA
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* 3. Quantité & Sous-total ligne */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-600">Quantité :</span>
                          <div className="flex items-center gap-2 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                            <button
                              type="button"
                              onClick={() =>
                                modifierLigne(item.id, 'quantite', Math.max(1, item.quantite - 1))
                              }
                              className="w-6 h-6 rounded bg-white text-slate-700 flex items-center justify-center font-bold shadow-xs hover:bg-slate-50 active:scale-95 text-xs"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-display font-bold text-xs text-slate-900 min-w-4 text-center">
                              {item.quantite}
                            </span>
                            <button
                              type="button"
                              onClick={() => modifierLigne(item.id, 'quantite', item.quantite + 1)}
                              className="w-6 h-6 rounded bg-sahel text-white flex items-center justify-center font-bold shadow-xs hover:bg-sahel-dark active:scale-95 text-xs"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block">Sous-total</span>
                          <span className="font-mono font-bold text-xs text-slate-900">
                            {sousTotalLigne.toLocaleString('fr-FR')} FCFA
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Bouton Ajouter une autre bouteille */}
                <button
                  type="button"
                  onClick={ajouterBouteille}
                  className="w-full py-2.5 px-4 rounded-xl border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/60 hover:bg-emerald-100/70 text-sahel-dark font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-98"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ajouter une autre bouteille (autre marque ou format)</span>
                </button>
              </div>
            )}

            {/* Custom Courier Description (Course Mode) */}
            {modeService === 'course' && (
              <div className="card p-4 shadow-card space-y-2 bg-white border-slate-200">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                  Description du colis / course <span className="text-slate-400 font-normal">(optionnel)</span>
                </label>
                <input
                  type="text"
                  className="input text-xs"
                  placeholder="Ex : Documents urgents, plis, petits colis..."
                  value={descriptionColis}
                  onChange={(e) => setDescriptionColis(e.target.value)}
                />
              </div>
            )}

            {/* Interactive Map Component */}
            <SelecteurItineraireMap
              mode={modeService === 'gaz' ? 'destination_seule' : 'trajet_complet'}
              initialDepart={form.adresseDepart}
              initialDestination={form.adresseDestination}
              initialDistance={form.distanceKm}
              onItineraireChange={handleItineraireChange}
            />

            {/* Contact Details Card */}
            <div className="card p-5 shadow-card space-y-4 bg-white border-slate-200">
              <h3 className="font-display font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <User className="w-4 h-4 text-sahel" />
                <span>Vos coordonnées pour la livraison</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 block">
                    Votre nom <span className="text-slate-400 font-normal lowercase">(optionnel)</span>
                  </label>
                  <div className="relative">
                    <input
                      className="input pl-8 text-xs"
                      placeholder="Ex : Adam"
                      value={form.clientNom}
                      onChange={champ('clientNom')}
                    />
                    <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 block">
                    Numéro WhatsApp
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
            </div>

            {/* Live Pricing Estimation Card */}
            {itinerairePret ? (
              <div className="card p-4 shadow-card bg-gradient-to-br from-slate-900 to-emerald-950 text-white rounded-2xl space-y-2.5 animate-slide-up">
                <div className="flex items-center justify-between text-xs text-emerald-200">
                  <span>
                    {modeService === 'gaz'
                      ? `Gaz (${totalBouteilles} bouteille${totalBouteilles > 1 ? 's' : ''})`
                      : 'Course Express'}
                  </span>
                  <span className="font-mono font-bold">
                    {modeService === 'gaz' ? `${sousTotalGaz.toLocaleString('fr-FR')} FCFA` : '—'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-emerald-200">
                  <span className="flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>
                      Frais de livraison ({form.distanceKm} km depuis Djaradougou)
                    </span>
                  </span>
                  <span className="font-mono font-bold">
                    {fraisLivraisonEstime.toLocaleString('fr-FR')} FCFA
                  </span>
                </div>

                <div className="pt-2 border-t border-white/15 flex items-center justify-between">
                  <span className="font-display font-bold text-sm text-white">TOTAL À PAYER :</span>
                  <span className="font-display font-bold text-xl text-emerald-400">
                    {totalGeneralEstime.toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
              </div>
            ) : (
              <div className="card p-4 shadow-card bg-white border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">
                    {modeService === 'gaz'
                      ? `🔥 Total Gaz (${totalBouteilles} bouteille${totalBouteilles > 1 ? 's' : ''})`
                      : '📦 Course Express'}
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    {modeService === 'gaz' ? `${sousTotalGaz.toLocaleString('fr-FR')} FCFA` : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <span className="flex items-center gap-1 text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-sahel" />
                    <span>Frais de livraison :</span>
                  </span>
                  <span className="text-amber-800 font-semibold bg-amber-50 px-2.5 py-0.5 rounded-md text-[11px] border border-amber-200/60">
                    En attente de votre lieu
                  </span>
                </div>
              </div>
            )}

            {/* Error banner */}
            {erreur && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                <span className="font-medium">{erreur}</span>
              </div>
            )}

            {/* Action Submit */}
            <button
              type="submit"
              disabled={chargement}
              className="btn-primary w-full py-4 text-sm font-bold shadow-md flex items-center justify-center gap-2"
            >
              {chargement ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Calcul de l'itinéraire…</span>
                </>
              ) : (
                <>
                  <span>Voir le récapitulatif & Valider</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Étape 1 : Récapitulatif & Tarif */}
        {etape === 1 && (
          <div className="space-y-5 animate-slide-up">
            <div className="card p-6 shadow-card space-y-4 bg-white border-slate-200">
              <h2 className="font-display text-xl font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-sahel" />
                <span>Détail de votre commande</span>
              </h2>

              {/* Service Details & Articles List */}
              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-100 space-y-2.5 text-xs">
                <div className="flex items-center justify-between font-bold text-emerald-900 border-b border-emerald-200/60 pb-1.5">
                  <span>{modeService === 'gaz' ? '🔥 Bouteilles commandées' : '📦 Course Express'}</span>
                  <span>{totalBouteilles} article{totalBouteilles > 1 ? 's' : ''}</span>
                </div>

                {modeService === 'gaz' ? (
                  <div className="space-y-1.5">
                    {panierGaz.map((item, idx) => {
                      const b = TYPES_BOUTEILLES.find((t) => t.id === item.typeBouteille);
                      const m = MARQUES_GAZ.find((mg) => mg.id === item.marque);
                      const prix = (b?.prixUnitaire || 2000) * item.quantite;
                      return (
                        <div key={idx} className="flex items-center justify-between text-slate-700">
                          <span>
                            {item.quantite}x {b?.label} <span className="font-semibold text-slate-900">({m?.label})</span>
                          </span>
                          <span className="font-mono font-bold text-slate-900">
                            {prix.toLocaleString('fr-FR')} FCFA
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  descriptionColis && (
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Colis :</span>
                      <span className="font-medium">{descriptionColis}</span>
                    </div>
                  )
                )}
              </div>

              {/* Trajet Details */}
              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-sahel font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    A
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Départ (Dépôt)
                    </span>
                    <p className="text-xs font-semibold text-slate-800">{form.adresseDepart}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    B
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Livraison (Destination)
                    </span>
                    <p className="text-xs font-semibold text-slate-800">{form.adresseDestination}</p>
                  </div>
                </div>
              </div>

              {/* Coordonnées Client */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Contact client :</span>
                <span className="font-mono font-bold text-slate-800">
                  {form.clientNom ? `${form.clientNom} — ` : ''}
                  {form.clientTelephone}
                </span>
              </div>

              {/* Detailed Price Breakdown */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 to-emerald-950 text-white space-y-2 shadow-md">
                {modeService === 'gaz' && (
                  <div className="flex items-center justify-between text-xs text-emerald-200">
                    <span>Sous-total Gaz ({totalBouteilles} bouteille{totalBouteilles > 1 ? 's' : ''})</span>
                    <span className="font-mono font-semibold">{sousTotalGaz.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs text-emerald-200">
                  <span>
                    Frais de livraison ({estimation?.distanceKm || form.distanceKm} km)
                  </span>
                  <span className="font-mono font-semibold">
                    {(estimation?.montant || fraisLivraisonEstime || 1000).toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-white/15">
                  <span className="text-sm font-bold">TOTAL À PAYER</span>
                  <span className="font-display text-2xl font-bold text-emerald-400">
                    {((modeService === 'gaz' ? sousTotalGaz : 0) + (estimation?.montant || fraisLivraisonEstime || 1000)).toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
              </div>
            </div>

            {erreur && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                <span className="font-medium">{erreur}</span>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setEtape(0)}
                className="btn-secondary flex-1 py-3.5 text-xs font-semibold"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Modifier</span>
              </button>

              <button
                type="button"
                onClick={confirmerCommande}
                disabled={chargement}
                className="btn-primary flex-2 py-3.5 text-sm font-bold shadow-md"
              >
                {chargement ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Enregistrement…</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirmer la commande</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Étape 2 : Confirmation */}
        {etape === 2 && resultat && (
          <div className="card p-6 md:p-8 shadow-card space-y-5 text-center bg-white border-slate-200 animate-slide-up">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-sahel flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h2 className="font-display text-2xl font-bold text-slate-900">Commande Enregistrée !</h2>
              <p className="text-xs text-slate-500 mt-1">
                Numéro de suivi :{' '}
                <span className="font-mono font-bold text-sahel-dark bg-emerald-50 px-2 py-0.5 rounded">
                  {resultat.livraison?.numero}
                </span>
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Articles :</span>
                <span className="font-semibold text-slate-800 max-w-56 text-right line-clamp-2">
                  {resultat.detailArticle}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Adresse de livraison :</span>
                <span className="font-semibold text-slate-800 text-right max-w-52 line-clamp-1">
                  {resultat.livraison?.adresseDestination}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Frais de livraison :</span>
                <span className="font-mono font-semibold text-slate-700">
                  {resultat.fraisLivraison?.toLocaleString('fr-FR')} FCFA
                </span>
              </div>
              <div className="flex justify-between pt-1.5 border-t border-slate-200 font-bold">
                <span className="text-slate-900">TOTAL À PAYER :</span>
                <span className="text-sahel-dark font-display text-base">
                  {resultat.totalGeneral?.toLocaleString('fr-FR')} FCFA
                </span>
              </div>
            </div>

            {/* WhatsApp 1-Click dispatch */}
            {resultat.lienWhatsAppNotification && (
              <a
                href={resultat.lienWhatsAppNotification}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98]"
              >
                <Send className="w-4 h-4" />
                <span>Envoyer ma commande sur WhatsApp</span>
              </a>
            )}

            {/* Télécharger le reçu / Bon de commande PDF */}
            {resultat.livraison?.qrToken && (
              <button
                type="button"
                onClick={telechargerRecuPDF}
                disabled={telechargeantRecu}
                className="btn-secondary w-full py-3 text-xs font-semibold flex items-center justify-center gap-2"
              >
                {telechargeantRecu ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-sahel" />
                    <span>Téléchargement du reçu…</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 text-sahel" />
                    <span>Télécharger le bon / reçu PDF</span>
                  </>
                )}
              </button>
            )}

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
              <button
                type="button"
                onClick={() => navigate(`/suivi/${resultat.livraison?.numero}`)}
                className="btn-primary w-full py-3 text-xs font-semibold"
              >
                <span>Suivre mon livreur sur la carte</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setEtape(0);
                  setResultat(null);
                  setPanierGaz([
                    {
                      id: 1,
                      marque: 'sodigaz',
                      typeBouteille: 'recharge_6kg',
                      quantite: 1,
                    },
                  ]);
                  setForm((f) => ({
                    ...f,
                    adresseDestination: '',
                    destinationLat: null,
                    destinationLng: null,
                    distanceKm: '',
                  }));
                }}
                className="btn-secondary w-full py-3 text-xs font-semibold"
              >
                Nouvelle commande
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
