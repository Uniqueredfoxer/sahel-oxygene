import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Phone, Lock, UserPlus, ArrowLeft, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { messageErreur } from '../api/client';
import Logo from '../components/Logo';
import { useToast } from '../context/ToastContext';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);
  const { inscription } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const champ = (nom) => (e) => {
    setForm((f) => ({ ...f, [nom]: e.target.value }));
    if (erreur) setErreur('');
  };

  const soumettre = async (e) => {
    e.preventDefault();
    setErreur('');
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setErreur('Nom, email et mot de passe sont obligatoires.');
      return;
    }
    if (form.password.length < 8) {
      setErreur('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    setChargement(true);
    try {
      await inscription({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim() || null,
        password: form.password,
      });
      toast.succes('Compte créé avec succès !');
      navigate('/app');
    } catch (err) {
      setErreur(messageErreur(err));
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-12 bg-sable-50">
      <div className="w-full max-w-md space-y-6 animate-slide-up">
        <div className="text-center flex justify-center">
          <Logo />
        </div>

        <div className="card p-7 md:p-9 shadow-card space-y-6">
          <div>
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 uppercase tracking-wider mb-2 border border-amber-200/60">
              Nouveau Membre
            </span>
            <h1 className="font-display text-2xl font-bold text-slate-900">Créer un compte équipe</h1>
            <p className="text-slate-500 text-xs mt-1 leading-relaxed">
              Votre compte sera créé en attente d'activation. Un administrateur vous attribuera votre rôle (livreur, vendeur gaz ou gestionnaire).
            </p>
          </div>

          <form onSubmit={soumettre} className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 block">
                Nom complet
              </label>
              <div className="relative">
                <input
                  className="input pl-9"
                  placeholder="Ex : Oumar Sawadogo"
                  value={form.name}
                  onChange={champ('name')}
                  required
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 block">
                Adresse email
              </label>
              <div className="relative">
                <input
                  type="email"
                  className="input pl-9"
                  placeholder="oumar@exemple.com"
                  value={form.email}
                  onChange={champ('email')}
                  required
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 block">
                Numéro de téléphone <span className="text-slate-400 font-normal lowercase">(optionnel)</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  className="input font-mono pl-9"
                  placeholder="Ex : 70 00 00 00"
                  value={form.phone}
                  onChange={champ('phone')}
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 block">
                Mot de passe (8 caractères minimum)
              </label>
              <div className="relative">
                <input
                  type="password"
                  className="input pl-9"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={champ('password')}
                  required
                  minLength={8}
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {erreur && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{erreur}</span>
              </div>
            )}

            <button type="submit" className="btn-primary w-full text-base flex items-center justify-center gap-2" disabled={chargement}>
              <UserPlus className="w-4 h-4" />
              <span>{chargement ? 'Création du compte…' : 'Créer mon compte'}</span>
            </button>
          </form>
        </div>

        <div className="text-center space-y-2 text-sm text-slate-500">
          <p>
            Déjà inscrit ?{' '}
            <Link to="/connexion" className="text-sahel font-bold hover:underline">
              Se connecter
            </Link>
          </p>
          <p>
            <Link to="/" className="text-xs text-slate-400 hover:text-slate-600 inline-flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" />
              <span>Retour à l'accueil client</span>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
