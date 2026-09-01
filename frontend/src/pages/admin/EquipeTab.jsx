import { useEffect, useState } from 'react';
import {
  Shield,
  RefreshCw,
  Search,
  Check,
  Plus,
  UserCheck,
  UserX,
  UserPlus,
  KeyRound,
  Edit2,
  Trash2,
  X,
  Eye,
  EyeOff,
  AlertTriangle,
  Phone,
  Mail,
  User,
  ShieldAlert,
} from 'lucide-react';
import api, { messageErreur } from '../../api/client';
import { useToast } from '../../context/ToastContext';

const ROLES = [
  { id: 'administrateur', label: 'Administrateur', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { id: 'gestionnaire', label: 'Gestionnaire', color: 'bg-sky-50 text-sky-700 border-sky-200' },
  { id: 'livreur', label: 'Livreur', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { id: 'vendeur_gaz', label: 'Vendeur Gaz', color: 'bg-amber-50 text-amber-700 border-amber-200' },
];

export default function EquipeTab() {
  const [comptes, setComptes] = useState([]);
  const [recherche, setRecherche] = useState('');
  const [filtreRole, setFiltreRole] = useState('tous');
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const toast = useToast();

  // Modals state
  const [modalCreation, setModalCreation] = useState(false);
  const [modalEdition, setModalEdition] = useState(null);
  const [modalPassword, setModalPassword] = useState(null);
  const [modalSuppression, setModalSuppression] = useState(null);

  // Form states
  const [formCreer, setFormCreer] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'livreur',
  });
  const [afficherPassCreer, setAfficherPassCreer] = useState(false);
  const [chargementCreer, setChargementCreer] = useState(false);

  const [formEditer, setFormEditer] = useState({ name: '', email: '', phone: '' });
  const [chargementEditer, setChargementEditer] = useState(false);

  const [nouveauPass, setNouveauPass] = useState('');
  const [afficherPassReset, setAfficherPassReset] = useState(false);
  const [chargementPassword, setChargementPassword] = useState(false);

  const [chargementSupprimer, setChargementSupprimer] = useState(false);

  const charger = () => {
    setChargement(true);
    api
      .get('/team')
      .then((r) => setComptes(r.data))
      .catch((e) => setErreur(messageErreur(e)))
      .finally(() => setChargement(false));
  };

  useEffect(() => {
    charger();
  }, []);

  // Creation
  const soumettreCreation = async (e) => {
    e.preventDefault();
    setChargementCreer(true);
    try {
      await api.post('/team', formCreer);
      toast.succes(`Compte de ${formCreer.name} créé avec succès !`);
      setModalCreation(false);
      setFormCreer({ name: '', email: '', phone: '', password: '', role: 'livreur' });
      charger();
    } catch (err) {
      toast.erreur(messageErreur(err));
    } finally {
      setChargementCreer(false);
    }
  };

  // Edition
  const ouvrirEdition = (compte) => {
    setFormEditer({ name: compte.name, email: compte.email, phone: compte.phone || '' });
    setModalEdition(compte);
  };

  const soumettreEdition = async (e) => {
    e.preventDefault();
    if (!modalEdition) return;
    setChargementEditer(true);
    try {
      await api.put(`/team/${modalEdition.id}`, formEditer);
      toast.succes(`Coordonnées de ${formEditer.name} mises à jour !`);
      setModalEdition(null);
      charger();
    } catch (err) {
      toast.erreur(messageErreur(err));
    } finally {
      setChargementEditer(false);
    }
  };

  // Reset password
  const ouvrirPassword = (compte) => {
    setNouveauPass('');
    setAfficherPassReset(false);
    setModalPassword(compte);
  };

  const soumettrePassword = async (e) => {
    e.preventDefault();
    if (!modalPassword || !nouveauPass) return;
    setChargementPassword(true);
    try {
      await api.post(`/team/${modalPassword.id}/password`, { password: nouveauPass });
      toast.succes(`Mot de passe mis à jour pour ${modalPassword.name} !`);
      setModalPassword(null);
    } catch (err) {
      toast.erreur(messageErreur(err));
    } finally {
      setChargementPassword(false);
    }
  };

  // Suppression
  const soumettreSuppression = async () => {
    if (!modalSuppression) return;
    setChargementSupprimer(true);
    try {
      await api.delete(`/team/${modalSuppression.id}`);
      toast.succes(`Compte de ${modalSuppression.name} supprimé avec succès.`);
      setModalSuppression(null);
      charger();
    } catch (err) {
      toast.erreur(messageErreur(err));
    } finally {
      setChargementSupprimer(false);
    }
  };

  // Toggle role
  const basculerRole = async (userId, role, actif, userName) => {
    try {
      if (actif) {
        await api.delete(`/team/${userId}/roles/${role}`);
        toast.info(`Rôle ${role} retiré à ${userName}`);
      } else {
        await api.post(`/team/${userId}/roles`, { role });
        toast.succes(`Rôle ${role} attribué à ${userName}`);
      }
      charger();
    } catch (err) {
      toast.erreur(messageErreur(err));
    }
  };

  // Toggle active
  const basculerCompte = async (userId, active, userName) => {
    try {
      await api.patch(`/team/${userId}`, { active: !active });
      toast.info(`Compte de ${userName} ${!active ? 'activé' : 'désactivé'}`);
      charger();
    } catch (err) {
      toast.erreur(messageErreur(err));
    }
  };

  const comptesFiltres = comptes.filter((c) => {
    const matchRecherche =
      c.name.toLowerCase().includes(recherche.toLowerCase()) ||
      c.email.toLowerCase().includes(recherche.toLowerCase()) ||
      (c.phone && c.phone.includes(recherche));

    const matchRole = filtreRole === 'tous' || (c.roles && c.roles.includes(filtreRole));

    return matchRecherche && matchRole;
  });

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-sahel uppercase tracking-wider">Administration Sécurisée</span>
          <h1 className="font-display text-2xl font-bold text-slate-900">Équipe & Utilisateurs</h1>
          <p className="text-slate-500 text-xs mt-1">
            Création exclusive de comptes, attribution des rôles et contrôle des accès collaborateurs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setModalCreation(true)}
            className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5 font-semibold shadow-emerald"
          >
            <UserPlus className="w-4 h-4" />
            <span>Nouveau collaborateur</span>
          </button>

          <button
            onClick={charger}
            className="btn-secondary text-xs py-2 px-3 flex items-center gap-1 font-semibold"
            title="Actualiser la liste"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search input */}
        <div className="card p-2.5 shadow-card max-w-md w-full relative">
          <input
            className="input text-xs pl-9 py-2"
            placeholder="Rechercher par nom, email, tél…"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-5 top-1/2 -translate-y-1/2" />
        </div>

        {/* Role filters chips */}
        <div className="flex overflow-x-auto gap-1.5 pb-1 md:pb-0">
          <button
            onClick={() => setFiltreRole('tous')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              filtreRole === 'tous'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Tous ({comptes.length})
          </button>
          {ROLES.map((r) => {
            const count = comptes.filter((c) => c.roles?.includes(r.id)).length;
            const estActif = filtreRole === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setFiltreRole(r.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  estActif
                    ? 'bg-sahel text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {r.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {erreur && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
          {erreur}
        </div>
      )}

      {chargement && (
        <div className="card p-8 text-center space-y-3 shadow-card">
          <div className="route-line w-36 mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Chargement des membres…</p>
        </div>
      )}

      {/* Users grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {comptesFiltres.map((c) => (
          <div
            key={c.id}
            className={`card p-5 shadow-card space-y-4 transition-all ${
              !c.active ? 'opacity-70 bg-slate-50/80 border-dashed border-slate-300' : 'bg-white'
            }`}
          >
            {/* Header: Avatar, Name, Status & Quick Action Buttons */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-emerald-100/70 text-sahel-dark font-bold flex items-center justify-center text-sm border border-emerald-200/60 shrink-0">
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-900 text-sm truncate">{c.name}</h3>
                  <p className="text-xs text-slate-500 truncate">{c.email}</p>
                  {c.phone && (
                    <p className="text-[11px] font-mono text-slate-400 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-300" />
                      <span>{c.phone}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Status Pill */}
              <button
                onClick={() => basculerCompte(c.id, c.active, c.name)}
                className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition-all shrink-0 flex items-center gap-1 ${
                  c.active
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200'
                    : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700'
                }`}
                title="Cliquer pour changer le statut"
              >
                {c.active ? <UserCheck className="w-3 h-3 text-emerald-600" /> : <UserX className="w-3 h-3 text-slate-400" />}
                <span>{c.active ? 'Actif' : 'Bloqué'}</span>
              </button>
            </div>

            {/* Role toggles */}
            <div className="pt-3 border-t border-slate-100 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Rôles attribués
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {c.roles?.length || 0} rôle{(c.roles?.length || 0) > 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {ROLES.map((r) => {
                  const actif = c.roles?.includes(r.id);
                  return (
                    <button
                      key={r.id}
                      onClick={() => basculerRole(c.id, r.id, actif, c.name)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1 ${
                        actif
                          ? 'bg-sahel text-white border-sahel-dark shadow-xs'
                          : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-white'
                      }`}
                    >
                      {actif ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3 text-slate-400" />}
                      <span>{r.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions Bar */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => ouvrirEdition(c)}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-1"
                >
                  <Edit2 className="w-3 h-3 text-slate-500" />
                  <span>Modifier</span>
                </button>
                <button
                  onClick={() => ouvrirPassword(c)}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/60 transition-colors flex items-center gap-1"
                >
                  <KeyRound className="w-3 h-3" />
                  <span>Mot de passe</span>
                </button>
              </div>

              <button
                onClick={() => setModalSuppression(c)}
                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                title="Supprimer ce collaborateur"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {comptesFiltres.length === 0 && !chargement && (
        <div className="card p-10 text-center space-y-3 shadow-card">
          <p className="font-semibold text-slate-700 text-sm">Aucun collaborateur trouvé</p>
          <p className="text-slate-400 text-xs">Modifiez votre recherche ou créez un nouveau compte.</p>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 1: CRÉER UN COLLABORATEUR */}
      {/* ============================================================ */}
      {modalCreation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-slide-up border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-sahel font-bold flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-base text-slate-900">Nouveau collaborateur</h2>
                  <p className="text-[11px] text-slate-400">Création exclusive par l'administrateur</p>
                </div>
              </div>
              <button
                onClick={() => setModalCreation(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={soumettreCreation} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Nom complet *</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Ex: Moussa Diallo"
                    className="input pl-9 text-xs"
                    value={formCreer.name}
                    onChange={(e) => setFormCreer({ ...formCreer, name: e.target.value })}
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Adresse email *</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="moussa.diallo@sahel.com"
                    className="input pl-9 text-xs"
                    value={formCreer.email}
                    onChange={(e) => setFormCreer({ ...formCreer, email: e.target.value })}
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Numéro de téléphone</label>
                <div className="relative">
                  <input
                    type="tel"
                    placeholder="Ex: 70123456"
                    className="input pl-9 text-xs"
                    value={formCreer.phone}
                    onChange={(e) => setFormCreer({ ...formCreer, phone: e.target.value })}
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Mot de passe initial * (min 8 car., lettre + chiffre)
                </label>
                <div className="relative">
                  <input
                    type={afficherPassCreer ? 'text' : 'password'}
                    required
                    minLength={8}
                    placeholder="••••••••"
                    className="input pl-9 pr-10 text-xs"
                    value={formCreer.password}
                    onChange={(e) => setFormCreer({ ...formCreer, password: e.target.value })}
                  />
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setAfficherPassCreer(!afficherPassCreer)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {afficherPassCreer ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Rôle attribué</label>
                <div className="grid grid-cols-2 gap-2">
                  {ROLES.map((r) => (
                    <label
                      key={r.id}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all ${
                        formCreer.role === r.id
                          ? 'border-emerald-500 bg-emerald-50/70 text-sahel-dark shadow-xs'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={r.id}
                        checked={formCreer.role === r.id}
                        onChange={(e) => setFormCreer({ ...formCreer, role: e.target.value })}
                        className="accent-emerald-600"
                      />
                      <span>{r.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalCreation(false)}
                  className="btn-secondary text-xs py-2 px-4 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={chargementCreer}
                  className="btn-primary text-xs py-2 px-5 font-semibold"
                >
                  {chargementCreer ? 'Création en cours…' : 'Créer le compte'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: MODIFIER UN COLLABORATEUR */}
      {/* ============================================================ */}
      {modalEdition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-slide-up border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 font-bold flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-base text-slate-900">Modifier le collaborateur</h2>
                  <p className="text-[11px] text-slate-400">{modalEdition.name}</p>
                </div>
              </div>
              <button
                onClick={() => setModalEdition(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={soumettreEdition} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Nom complet *</label>
                <input
                  type="text"
                  required
                  className="input text-xs"
                  value={formEditer.name}
                  onChange={(e) => setFormEditer({ ...formEditer, name: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Adresse email *</label>
                <input
                  type="email"
                  required
                  className="input text-xs"
                  value={formEditer.email}
                  onChange={(e) => setFormEditer({ ...formEditer, email: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Numéro de téléphone</label>
                <input
                  type="tel"
                  className="input text-xs"
                  value={formEditer.phone}
                  onChange={(e) => setFormEditer({ ...formEditer, phone: e.target.value })}
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalEdition(null)}
                  className="btn-secondary text-xs py-2 px-4 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={chargementEditer}
                  className="btn-primary text-xs py-2 px-5 font-semibold"
                >
                  {chargementEditer ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 3: RÉINITIALISER LE MOT DE PASSE */}
      {/* ============================================================ */}
      {modalPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-slide-up border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 font-bold flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-base text-slate-900">Changer le mot de passe</h2>
                  <p className="text-[11px] text-slate-400">Pour {modalPassword.name}</p>
                </div>
              </div>
              <button
                onClick={() => setModalPassword(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={soumettrePassword} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Nouveau mot de passe * (min 8 car., lettre + chiffre)
                </label>
                <div className="relative">
                  <input
                    type={afficherPassReset ? 'text' : 'password'}
                    required
                    minLength={8}
                    placeholder="Saisir le nouveau mot de passe"
                    className="input pl-9 pr-10 text-xs"
                    value={nouveauPass}
                    onChange={(e) => setNouveauPass(e.target.value)}
                  />
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setAfficherPassReset(!afficherPassReset)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {afficherPassReset ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalPassword(null)}
                  className="btn-secondary text-xs py-2 px-4 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={chargementPassword}
                  className="btn-primary text-xs py-2 px-5 font-semibold bg-amber-600 hover:bg-amber-700"
                >
                  {chargementPassword ? 'Mise à jour…' : 'Définir le mot de passe'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 4: CONFIRMATION DE SUPPRESSION */}
      {/* ============================================================ */}
      {modalSuppression && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-slide-up border border-rose-100">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
              <ShieldAlert className="w-6 h-6 text-rose-600" />
            </div>

            <div className="text-center space-y-1.5">
              <h2 className="font-display font-bold text-lg text-slate-900">Supprimer ce collaborateur ?</h2>
              <p className="text-slate-500 text-xs">
                Êtes-vous sûr de vouloir supprimer définitivement le compte de{' '}
                <strong className="text-slate-800 font-semibold">{modalSuppression.name}</strong> ({modalSuppression.email}) ?
              </p>
              <p className="text-[11px] text-rose-600 font-medium">Cette action est irréversible.</p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setModalSuppression(null)}
                className="btn-secondary text-xs py-2 px-4 font-semibold"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={soumettreSuppression}
                disabled={chargementSupprimer}
                className="btn-primary text-xs py-2 px-5 font-semibold bg-rose-600 hover:bg-rose-700 shadow-xs"
              >
                {chargementSupprimer ? 'Suppression…' : 'Confirmer la suppression'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
