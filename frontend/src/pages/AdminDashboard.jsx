import { useState } from 'react';
import {
  Package,
  PlusCircle,
  History,
  Users,
  BarChart3,
  CopyCheck,
  Flame,
  ShieldCheck,
  MessageSquare,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';

import CommanderTab from './admin/CommanderTab';
import CommandesTab from './admin/CommandesTab';
import ClientsTab from './admin/ClientsTab';
import LivraisonsTab from './admin/LivraisonsTab';
import RapportsTab from './admin/RapportsTab';
import DoublonsTab from './admin/DoublonsTab';
import EquipeTab from './admin/EquipeTab';
import WhatsAppTab from './admin/WhatsAppTab';
import GazVendeursTab from './admin/GazVendeursTab';
import ParametresTab from './admin/ParametresTab';

const ONGLETS = [
  { id: 'commandes', label: 'Commandes', Icon: Package, roles: ['administrateur', 'gestionnaire'] },
  { id: 'commander', label: 'Créer Course', Icon: PlusCircle, roles: ['administrateur', 'gestionnaire'] },
  { id: 'livraisons', label: 'Historique', Icon: History, roles: ['administrateur', 'gestionnaire'] },
  { id: 'clients', label: 'Clients', Icon: Users, roles: ['administrateur', 'gestionnaire'] },
  { id: 'rapports', label: 'Rapports & Stats', Icon: BarChart3, roles: ['administrateur', 'gestionnaire'] },
  { id: 'doublons', label: 'Doublons', Icon: CopyCheck, roles: ['administrateur', 'gestionnaire'] },
  { id: 'gaz', label: 'Vendeurs Gaz', Icon: Flame, roles: ['administrateur'] },
  { id: 'equipe', label: 'Équipe & Rôles', Icon: ShieldCheck, roles: ['administrateur'] },
  { id: 'whatsapp', label: 'WhatsApp Bot', Icon: MessageSquare, roles: ['administrateur', 'gestionnaire'] },
  { id: 'parametres', label: 'Paramètres', Icon: Settings, roles: ['administrateur'] },
];

export default function AdminDashboard() {
  const { user, deconnexion, aLeRole } = useAuth();
  const onglets = ONGLETS.filter((o) => aLeRole(...o.roles));
  const [actif, setActif] = useState(onglets[0]?.id || 'commandes');

  const COMPOSANTS = {
    commander: CommanderTab,
    commandes: CommandesTab,
    clients: ClientsTab,
    livraisons: LivraisonsTab,
    rapports: RapportsTab,
    doublons: DoublonsTab,
    equipe: EquipeTab,
    whatsapp: WhatsAppTab,
    gaz: GazVendeursTab,
    parametres: ParametresTab,
  };
  const Composant = COMPOSANTS[actif];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-sable-50">
      {/* Navigation latérale (desktop) */}
      <aside className="hidden md:flex md:flex-col w-64 border-r border-slate-200/80 bg-white shrink-0 shadow-sm">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center">
          <Logo />
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {onglets.map((o) => {
            const estActif = actif === o.id;
            const TabIcon = o.Icon;
            return (
              <button
                key={o.id}
                onClick={() => setActif(o.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  estActif
                    ? 'bg-emerald-50 text-sahel-dark shadow-sm border border-emerald-200/60'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <TabIcon className={`w-4 h-4 shrink-0 ${estActif ? 'text-sahel' : 'text-slate-400'}`} />
                <span>{o.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-sahel font-bold flex items-center justify-center text-xs">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-400 font-medium capitalize truncate">
                {user?.roles?.join(', ')}
              </p>
            </div>
          </div>
          <button
            onClick={deconnexion}
            className="w-full text-left text-xs font-medium text-slate-500 hover:text-red-600 transition-colors pt-2 border-t border-slate-200/50 flex items-center justify-between"
          >
            <span>Se déconnecter</span>
            <LogOut className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </aside>

      {/* Header mobile */}
      <header className="md:hidden px-4 py-3 border-b border-slate-200 bg-white flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <Logo />
        <button
          onClick={deconnexion}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 bg-slate-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Déconnexion</span>
        </button>
      </header>

      {/* Onglets mobile (scroll horizontal) */}
      <div className="md:hidden flex overflow-x-auto gap-1.5 px-3 py-2 bg-white/95 backdrop-blur-sm border-b border-slate-200 sticky top-[53px] z-20 shadow-xs">
        {onglets.map((o) => {
          const estActif = actif === o.id;
          const TabIcon = o.Icon;
          return (
            <button
              key={o.id}
              onClick={() => setActif(o.id)}
              className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                estActif
                  ? 'bg-sahel text-white shadow-emerald shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <TabIcon className="w-3.5 h-3.5" />
              <span>{o.label}</span>
            </button>
          );
        })}
      </div>

      <main className="flex-1 p-4 md:p-8 max-w-6xl w-full mx-auto overflow-y-auto">
        {Composant ? <Composant /> : <p className="text-slate-400">Aucun onglet sélectionné.</p>}
      </main>
    </div>
  );
}
