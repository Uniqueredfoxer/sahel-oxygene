import { useState } from 'react';
import { Save, Settings } from 'lucide-react';
import api, { messageErreur } from '../../api/client';
import { useBranding } from '../../context/BrandingContext';
import { useToast } from '../../context/ToastContext';

export default function ParametresTab() {
  const { appName, rafraichir } = useBranding();
  const [valeur, setValeur] = useState(appName);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState('');
  const toast = useToast();

  const soumettre = async (e) => {
    e.preventDefault();
    setErreur('');
    setChargement(true);
    try {
      await api.patch('/settings', { appName: valeur.trim() });
      await rafraichir();
      toast.succes('Nom de marque mis à jour avec succès !');
    } catch (err) {
      setErreur(messageErreur(err));
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="max-w-lg space-y-6 animate-slide-up">
      <div>
        <span className="text-xs font-bold text-sahel uppercase tracking-wider">Configuration Système</span>
        <h1 className="font-display text-2xl font-bold text-slate-900">Paramètres généraux</h1>
        <p className="text-slate-500 text-xs mt-1">
          Personnalisez la marque blanche et les libellés de la plateforme.
        </p>
      </div>

      <form onSubmit={soumettre} className="card p-6 shadow-card space-y-4">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 block">
            Nom de la plateforme / Marque
          </label>
          <input
            className="input text-xs font-semibold text-slate-800"
            value={valeur}
            onChange={(e) => setValeur(e.target.value)}
            placeholder="Ex : SAHEL OXYGÈNE"
            required
          />
          <p className="text-[11px] text-slate-400 mt-1.5">
            Ce nom apparaîtra sur l'en-tête, les reçus PDF, les messages WhatsApp et l'onglet du navigateur.
          </p>
        </div>

        {erreur && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {erreur}
          </div>
        )}

        <button type="submit" className="btn-primary text-xs py-2.5 px-5 flex items-center gap-1.5" disabled={chargement}>
          <Save className="w-3.5 h-3.5" />
          <span>{chargement ? 'Enregistrement…' : 'Enregistrer les modifications'}</span>
        </button>
      </form>
    </div>
  );
}
