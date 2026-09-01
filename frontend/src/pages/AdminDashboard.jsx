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
  Menu,
  X,
  ChevronRight,
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
  const [menuMobileOuvert, setMenuMobileOuvert] = useState(false);

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
  const ongletActifInfo = onglets.find((o) => o.id === actif);

  const selectionnerOnglet = (id) => {
    setActif(id);
    setMenuMobileOuvert(false);
  };

  return (
    <div className="min-h-screen flex bg-sable-50">
      {/* ============================================================ */}
      {/* 1. SIDEBAR DESKTOP */}
      {/* ============================================================ */}
      <aside className="hidden md:flex md:flex-col w-64 border-r border-slate-200/80 bg-white shrink-0 shadow-sm sticky top-0 h-screen">
        {/* Brand Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <Logo />
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {onglets.map((o) => {
            const estActif = actif === o.id;
            const TabIcon = o.Icon;
            return (
              <button
                key={o.id}
                onClick={() => selectionnerOnglet(o.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  estActif
                    ? 'bg-emerald-50 text-sahel-dark shadow-xs border border-emerald-200/60 font-bold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <TabIcon className={`w-4 h-4 shrink-0 ${estActif ? 'text-sahel' : 'text-slate-400'}`} />
                  <span>{o.label}</span>
                </div>
                {estActif && <div className="w-1.5 h-1.5 rounded-full bg-sahel" />}
              </button>
            );
          })}
        </nav>

        {/* User Card & Logout Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3 mb-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-sahel-dark font-bold flex items-center justify-center text-xs border border-emerald-200">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-400 font-semibold capitalize truncate">
                {user?.roles?.join(', ')}
              </p>
            </div>
          </div>
          <button
            onClick={deconnexion}
            className="w-full text-left text-xs font-medium text-slate-500 hover:text-rose-600 transition-colors pt-2.5 border-t border-slate-200/60 flex items-center justify-between group"
          >
            <span className="group-hover:translate-x-0.5 transition-transform">Se déconnecter</span>
            <LogOut className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-600 transition-colors" />
          </button>
        </div>
      </aside>

      {/* ============================================================ */}
      {/* 2. MOBILE DRAWER (HAMBURGER SLIDE-OUT) */}
      {/* ============================================================ */}
      {menuMobileOuvert && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop Blur */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={() => setMenuMobileOuvert(false)}
          />

          {/* Slide-out Drawer */}
          <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl flex flex-col z-10 animate-slide-right">
            {/* Drawer Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <Logo />
              <button
                onClick={() => setMenuMobileOuvert(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Fermer le menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Profile Card */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-sahel-dark font-bold flex items-center justify-center text-sm border border-emerald-200">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 truncate">{user?.name}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-sahel-dark border border-emerald-200/60 capitalize">
                  {user?.roles?.join(', ')}
                </span>
              </div>
            </div>

            {/* Navigation items */}
            <nav className="flex-1 py-3 px-3 space-y-1 overflow-y-auto">
              {onglets.map((o) => {
                const estActif = actif === o.id;
                const TabIcon = o.Icon;
                return (
                  <button
                    key={o.id}
                    onClick={() => selectionnerOnglet(o.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold transition-all ${
                      estActif
                        ? 'bg-emerald-50 text-sahel-dark shadow-xs border border-emerald-200/60 font-bold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <TabIcon className={`w-4 h-4 shrink-0 ${estActif ? 'text-sahel' : 'text-slate-400'}`} />
                      <span>{o.label}</span>
                    </div>
                    {estActif ? (
                      <div className="w-2 h-2 rounded-full bg-sahel" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Drawer Logout Footer */}
            <div className="p-4 border-t border-slate-100">
              <button
                onClick={deconnexion}
                className="btn-secondary w-full text-xs py-2.5 flex items-center justify-center gap-2 font-semibold text-rose-600 hover:bg-rose-50 hover:border-rose-200"
              >
                <LogOut className="w-4 h-4" />
                <span>Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. MAIN CONTENT AREA */}
      {/* ============================================================ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Mobile Sticky Top Bar with Hamburger */}
        <header className="md:hidden px-4 py-3 border-b border-slate-200 bg-white/95 backdrop-blur-md flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuMobileOuvert(true)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200 shadow-2xs"
              aria-label="Ouvrir le menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Logo />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
              {ongletActifInfo?.label || 'Espace'}
            </span>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 md:p-8 max-w-6xl w-full mx-auto overflow-y-auto">
          {Composant ? <Composant /> : <p className="text-slate-400">Aucun onglet sélectionné.</p>}
        </main>
      </div>
    </div>
  );
}

