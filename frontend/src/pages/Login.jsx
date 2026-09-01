import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, LogIn, ArrowLeft, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { messageErreur } from '../api/client';
import Logo from '../components/Logo';
import { useToast } from '../context/ToastContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [afficherPass, setAfficherPass] = useState(false);
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);
  const { connexion } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const soumettre = async (e) => {
    e.preventDefault();
    setErreur('');
    setChargement(true);
    try {
      await connexion(email.trim(), password);
      toast.succes('Connexion réussie !');
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
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-sahel-dark uppercase tracking-wider mb-2 border border-emerald-200/60">
              Espace Professionnel
            </span>
            <h1 className="font-display text-2xl font-bold text-slate-900">Connexion équipe</h1>
            <p className="text-slate-500 text-sm mt-1">
              Réservé aux livreurs, vendeurs de gaz, gestionnaires et administrateurs.
            </p>
          </div>

          <form onSubmit={soumettre} className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 block">
                Adresse email
              </label>
              <div className="relative">
                <input
                  type="email"
                  className="input pl-9"
                  placeholder="votre.email@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 block">
                  Mot de passe
                </label>
              </div>
              <div className="relative">
                <input
                  type={afficherPass ? 'text' : 'password'}
                  className="input pl-9 pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setAfficherPass(!afficherPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {afficherPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {erreur && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{erreur}</span>
              </div>
            )}

            <button type="submit" className="btn-primary w-full text-base flex items-center justify-center gap-2" disabled={chargement}>
              <LogIn className="w-4 h-4" />
              <span>{chargement ? 'Connexion en cours…' : 'Se connecter'}</span>
            </button>
          </form>
        </div>

        <div className="text-center space-y-3 text-sm text-slate-500">
          <p className="text-xs text-slate-400">
            Accès réservé. Les identifiants sont fournis par l'administrateur de Sahel Oxygène.
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
