import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldCheck, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';
import api from '../api/client';
import Logo from '../components/Logo';
import StatutPill from '../components/StatutPill';

export default function Verify() {
  const { qrToken } = useParams();
  const [data, setData] = useState(null);
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    setChargement(true);
    api
      .get(`/public/verifier/${qrToken}`)
      .then((r) => setData(r.data))
      .catch(() => setErreur('Ce reçu est introuvable ou son code QR de vérification a expiré.'))
      .finally(() => setChargement(false));
  }, [qrToken]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10 bg-sable-50">
      <Logo className="mb-8" />

      {chargement && (
        <div className="card p-8 text-center space-y-4 max-w-sm w-full shadow-card animate-slide-up">
          <div className="route-line w-36 mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Vérification de l'authenticité…</p>
        </div>
      )}

      {erreur && !chargement && (
        <div className="card p-8 text-center max-w-sm w-full space-y-4 border-rose-200 bg-rose-50/50 shadow-card animate-slide-up">
          <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7 text-rose-600" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">Vérification échouée</h2>
            <p className="text-xs text-rose-700 mt-1">{erreur}</p>
          </div>
          <Link to="/" className="btn-secondary w-full text-xs">
            Retour à l'accueil
          </Link>
        </div>
      )}

      {data && !chargement && (
        <div className="card p-6 md:p-8 max-w-md w-full space-y-6 shadow-card animate-slide-up border-emerald-200">
          {/* Security badge */}
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-sahel-dark">
            <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-display font-bold text-sm leading-tight">Reçu Officiel Authentifié</p>
              <p className="text-[11px] text-emerald-700">Généré et certifié numériquement</p>
            </div>
          </div>

          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Numéro de course</span>
              <p className="font-mono font-bold text-base text-slate-900">{data.numero}</p>
            </div>
            <StatutPill statut={data.statut} />
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-400 font-semibold uppercase">Téléphone client</span>
              <span className="font-mono font-semibold text-slate-800">{data.clientTelephone}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-400 font-semibold uppercase">Départ</span>
              <span className="text-right font-medium text-slate-800 max-w-[200px] truncate">{data.adresseDepart}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-400 font-semibold uppercase">Destination</span>
              <span className="text-right font-medium text-slate-800 max-w-[200px] truncate">{data.adresseDestination}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-400 font-semibold uppercase">Livreur</span>
              <span className="font-medium text-slate-800">{data.livreur || 'Non assigné'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-400 font-semibold uppercase">Signature client</span>
              <span className={`font-semibold flex items-center gap-1 ${data.signee ? 'text-emerald-600' : 'text-slate-400'}`}>
                {data.signee && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                <span>{data.signee ? 'Certifiée à la livraison' : 'Non signée'}</span>
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Montant payé</span>
            <span className="font-display font-bold font-mono text-2xl text-slate-900">
              {data.montant?.toLocaleString('fr-FR')} FCFA
            </span>
          </div>

          <div className="pt-2">
            <a
              className="btn-primary w-full flex items-center justify-center gap-2"
              href={`/api/public/recu/${qrToken}`}
              target="_blank"
              rel="noreferrer"
            >
              <FileText className="w-4 h-4" />
              <span>Télécharger le PDF original</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
