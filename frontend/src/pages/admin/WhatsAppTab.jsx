import { useEffect, useState } from 'react';
import { MessageSquare, Star, Trash2, Plus } from 'lucide-react';
import api, { messageErreur } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function WhatsAppTab() {
  const { aLeRole } = useAuth();
  const [numeros, setNumeros] = useState([]);
  const [form, setForm] = useState({ numero: '', label: '' });
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(true);
  const toast = useToast();

  const charger = () => {
    setChargement(true);
    api
      .get('/whatsapp')
      .then((r) => setNumeros(r.data))
      .catch(() => toast.erreur('Erreur de chargement des numéros WhatsApp.'))
      .finally(() => setChargement(false));
  };

  useEffect(() => {
    charger();
  }, []);

  const ajouter = async (e) => {
    e.preventDefault();
    setErreur('');
    if (!form.numero.trim()) return;
    try {
      await api.post('/whatsapp', {
        numero: form.numero.trim(),
        label: form.label.trim() || undefined,
      });
      setForm({ numero: '', label: '' });
      toast.succes('Numéro WhatsApp ajouté !');
      charger();
    } catch (err) {
      setErreur(messageErreur(err));
    }
  };

  const definirPrincipal = async (id, num) => {
    try {
      await api.patch(`/whatsapp/${id}`, { principal: true });
      toast.succes(`${num} est désormais le numéro principal.`);
      charger();
    } catch {
      toast.erreur('Impossible de définir comme principal.');
    }
  };

  const supprimer = async (id, num) => {
    if (!window.confirm(`Supprimer le numéro ${num} ?`)) return;
    try {
      await api.delete(`/whatsapp/${id}`);
      toast.succes(`Numéro ${num} supprimé.`);
      charger();
    } catch {
      toast.erreur('Impossible de supprimer ce numéro.');
    }
  };

  return (
    <div className="max-w-xl space-y-6 animate-slide-up">
      <div>
        <span className="text-xs font-bold text-sahel uppercase tracking-wider">Passerelle WhatsApp</span>
        <h1 className="font-display text-2xl font-bold text-slate-900">Numéros de notification</h1>
        <p className="text-slate-500 text-xs mt-1 leading-relaxed">
          Le numéro défini comme <strong>principal</strong> recevra automatiquement les messages de dispatching et les alertes de commandes passées par les clients.
        </p>
      </div>

      {aLeRole('administrateur') && (
        <form onSubmit={ajouter} className="card p-5 shadow-card space-y-3 border-emerald-100">
          <h3 className="font-semibold text-xs uppercase tracking-wider text-slate-700">
            Ajouter un nouveau numéro
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <input
              className="input font-mono text-xs"
              placeholder="Ex: 22670123456"
              value={form.numero}
              onChange={(e) => setForm((f) => ({ ...f, numero: e.target.value }))}
              required
            />
            <input
              className="input text-xs"
              placeholder="Libellé (ex: Dispatch Ouaga 2000)"
              value={form.label}
              onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
            />
          </div>
          {erreur && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {erreur}
            </div>
          )}
          <button type="submit" className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            <span>Ajouter le numéro</span>
          </button>
        </form>
      )}

      {chargement && (
        <div className="card p-8 text-center space-y-3 shadow-card">
          <div className="route-line w-36 mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Chargement des numéros…</p>
        </div>
      )}

      <div className="space-y-2.5">
        {numeros.map((n) => (
          <div
            key={n.id}
            className={`card p-4 shadow-card flex items-center justify-between gap-3 transition-all ${
              n.principal ? 'border-sahel/40 ring-1 ring-sahel/20 bg-emerald-50/20' : 'bg-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-sahel flex items-center justify-center font-bold text-sm shrink-0">
                <MessageSquare className="w-4 h-4 text-emerald-700" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-mono font-bold text-slate-900 text-sm">{n.numero}</p>
                  {n.principal && (
                    <span className="px-2 py-0.5 rounded-full bg-sahel text-white text-[10px] font-bold uppercase tracking-wider shadow-xs flex items-center gap-1">
                      <Star className="w-2.5 h-2.5 fill-white" />
                      <span>Principal</span>
                    </span>
                  )}
                </div>
                {n.label && <p className="text-xs text-slate-500 mt-0.5">{n.label}</p>}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {!n.principal && aLeRole('administrateur') && (
                <button
                  className="text-xs font-semibold text-sahel hover:text-sahel-dark bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors"
                  onClick={() => definirPrincipal(n.id, n.numero)}
                >
                  Définir principal
                </button>
              )}
              {aLeRole('administrateur') && (
                <button
                  className="text-xs text-rose-600 hover:text-rose-800 font-medium p-1 hover:bg-rose-50 rounded transition-colors"
                  onClick={() => supprimer(n.id, n.numero)}
                  title="Supprimer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
