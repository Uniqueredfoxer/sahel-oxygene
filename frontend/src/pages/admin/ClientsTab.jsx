import { useEffect, useState } from 'react';
import { RefreshCw, Search, Phone, Send } from 'lucide-react';
import api from '../../api/client';

export default function ClientsTab() {
  const [clients, setClients] = useState([]);
  const [recherche, setRecherche] = useState('');
  const [chargement, setChargement] = useState(true);

  const charger = () => {
    setChargement(true);
    api
      .get('/clients')
      .then((r) => setClients(r.data))
      .finally(() => setChargement(false));
  };

  useEffect(() => {
    charger();
  }, []);

  const clientsFiltres = clients.filter(
    (c) =>
      (c.clientNom && c.clientNom.toLowerCase().includes(recherche.toLowerCase())) ||
      (c.clientTelephone && c.clientTelephone.includes(recherche))
  );

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-sahel uppercase tracking-wider">Répertoire CRM</span>
          <h1 className="font-display text-2xl font-bold text-slate-900">Base clients</h1>
          <p className="text-slate-500 text-xs mt-1">
            Fidélisation et historique consolidé par numéro de téléphone.
          </p>
        </div>
        <button
          onClick={charger}
          className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5 font-semibold self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Actualiser</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="card p-3 shadow-card max-w-md relative">
        <input
          className="input text-xs pl-9"
          placeholder="Rechercher par nom ou numéro de téléphone…"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-6 top-1/2 -translate-y-1/2" />
      </div>

      {chargement && (
        <div className="card p-8 text-center space-y-3 shadow-card">
          <div className="route-line w-36 mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Chargement des clients…</p>
        </div>
      )}

      {!chargement && (
        <div className="card overflow-hidden shadow-card border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="px-5 py-3.5">Nom Client</th>
                  <th className="px-5 py-3.5">Téléphone</th>
                  <th className="px-5 py-3.5 text-center">Courses</th>
                  <th className="px-5 py-3.5 text-right">CA Cumulé</th>
                  <th className="px-5 py-3.5">Dernière course</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clientsFiltres.map((c) => (
                  <tr key={c.clientTelephoneNormalise} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-slate-900">
                      {c.clientNom || <span className="text-slate-400 font-normal">Sans nom</span>}
                    </td>
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-700">
                      {c.clientTelephone}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-800">
                        {c.nombreLivraisons}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-sahel-dark">
                      {Number(c.chiffreAffaires || 0).toLocaleString('fr-FR')} FCFA
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">
                      {c.derniereCommande
                        ? new Date(c.derniereCommande).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-2 whitespace-nowrap">
                      {c.clientTelephone && (
                        <>
                          <a
                            href={`tel:${c.clientTelephone}`}
                            className="text-xs text-slate-600 hover:text-slate-900 font-medium inline-flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3" />
                            <span>Appeler</span>
                          </a>
                          <a
                            href={`https://wa.me/${c.clientTelephone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-emerald-600 font-bold hover:underline inline-flex items-center gap-1"
                          >
                            <Send className="w-3 h-3" />
                            <span>WhatsApp</span>
                          </a>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {clientsFiltres.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-xs font-medium">
              Aucun client ne correspond à votre recherche.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
