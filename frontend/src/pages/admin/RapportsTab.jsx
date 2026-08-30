import { useEffect, useState } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Calendar,
  CalendarDays,
  Bike,
  Users,
  TrendingUp,
} from 'lucide-react';
import api from '../../api/client';
import { telechargerFichier } from '../../utils/download';
import { useToast } from '../../context/ToastContext';

const VUES = [
  { id: 'journalier', label: 'Journalier', Icon: Calendar },
  { id: 'mensuel', label: 'Mensuel', Icon: CalendarDays },
  { id: 'par-livreur', label: 'Par livreur', Icon: Bike },
  { id: 'par-client', label: 'Par client', Icon: Users },
];

export default function RapportsTab() {
  const [vue, setVue] = useState('journalier');
  const [lignes, setLignes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [exportEnCours, setExportEnCours] = useState(null); // 'excel' | 'pdf'
  const toast = useToast();

  useEffect(() => {
    setChargement(true);
    api
      .get(`/reports/${vue}`)
      .then((r) => setLignes(r.data))
      .catch(() => toast.erreur('Erreur lors du chargement des données de rapport.'))
      .finally(() => setChargement(false));
  }, [vue, toast]);

  const exporter = async (format) => {
    setExportEnCours(format);
    try {
      const ext = format === 'excel' ? 'xlsx' : 'pdf';
      const nom = `rapport-${vue}-${new Date().toISOString().slice(0, 10)}.${ext}`;
      await telechargerFichier(`/reports/export/${format}?type=${vue}`, nom);
      toast.succes(`Export ${format.toUpperCase()} téléchargé !`);
    } catch {
      toast.erreur(`Échec de l'export ${format.toUpperCase()}.`);
    } finally {
      setExportEnCours(null);
    }
  };

  const colonneCle = {
    journalier: 'Jour',
    mensuel: 'Mois',
    'par-livreur': 'Livreur',
    'par-client': 'Client',
  }[vue];

  const totalCourses = lignes.reduce((acc, l) => acc + (parseInt(l.nombre, 10) || 0), 0);
  const totalCA = lignes.reduce((acc, l) => acc + (parseFloat(l.chiffreAffaires) || 0), 0);
  const panierMoyen = totalCourses > 0 ? Math.round(totalCA / totalCourses) : 0;

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-sahel uppercase tracking-wider">Analytique & Comptabilité</span>
          <h1 className="font-display text-2xl font-bold text-slate-900">Rapports d'activité</h1>
        </div>

        {/* Export Buttons with Bearer Header */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => exporter('excel')}
            disabled={exportEnCours !== null}
            className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5 font-semibold"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            <span>{exportEnCours === 'excel' ? 'Export…' : 'Export Excel'}</span>
          </button>
          <button
            onClick={() => exporter('pdf')}
            disabled={exportEnCours !== null}
            className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 font-semibold"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{exportEnCours === 'pdf' ? 'Export…' : 'Export PDF'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5 bg-gradient-to-br from-white to-slate-50 shadow-card">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Livraisons</span>
          <p className="font-display text-3xl font-bold text-slate-900 mt-1">{totalCourses}</p>
          <p className="text-[11px] text-slate-400 mt-1">Courses validées sur la période</p>
        </div>

        <div className="card p-5 bg-gradient-to-br from-white to-emerald-50/40 shadow-card border-emerald-100">
          <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Chiffre d'affaires</span>
          <p className="font-display text-3xl font-bold text-sahel-dark font-mono mt-1">
            {totalCA.toLocaleString('fr-FR')} FCFA
          </p>
          <p className="text-[11px] text-emerald-600/70 mt-1">Revenus bruts encaissés</p>
        </div>

        <div className="card p-5 bg-gradient-to-br from-white to-slate-50 shadow-card">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Panier Moyen</span>
          <p className="font-display text-3xl font-bold text-slate-800 font-mono mt-1">
            {panierMoyen.toLocaleString('fr-FR')} FCFA
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Montant moyen par course</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {VUES.map((v) => {
          const estActif = vue === v.id;
          const VueIcon = v.Icon;
          return (
            <button
              key={v.id}
              onClick={() => setVue(v.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                estActif
                  ? 'bg-sahel text-white shadow-emerald shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <VueIcon className="w-3.5 h-3.5" />
              <span>{v.label}</span>
            </button>
          );
        })}
      </div>

      {chargement && (
        <div className="card p-8 text-center space-y-3 shadow-card">
          <div className="route-line w-36 mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Chargement des données comptables…</p>
        </div>
      )}

      {/* Data Table */}
      {!chargement && (
        <div className="card overflow-hidden shadow-card border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="px-5 py-3.5">{colonneCle}</th>
                  <th className="px-5 py-3.5 text-center">Courses</th>
                  <th className="px-5 py-3.5 text-right">Chiffre d'Affaires</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lignes.map((l, i) => {
                  let labelLigne = l[colonneCle.toLowerCase()] || l.jour || l.mois;
                  if (vue === 'par-livreur') {
                    labelLigne = l.livreur?.name || 'Inconnu';
                  } else if (vue === 'par-client') {
                    labelLigne = `${l.clientNom || 'Client'} (${l.clientTelephone || '-'})`;
                  }

                  return (
                    <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-slate-800">{labelLigne}</td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-700">
                          {l.nombre}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono font-bold text-slate-900 text-sm">
                        {Number(l.chiffreAffaires || 0).toLocaleString('fr-FR')} FCFA
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {lignes.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-xs font-medium">
              Aucune donnée enregistrée pour cette vue.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
