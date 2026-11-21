import React, { useState } from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  BookOpen,
  BarChart3,
  Users,
  FolderOpen,
  Calendar,
  Package,
  GraduationCap,
  Award,
  FileSpreadsheet,
  Bot,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  FileText,
  Tags,
  Clock,
  FileBarChart,
  FolderKanban,
  X,
} from 'lucide-react';
import { DocCenterSubmenuId, ModuleId, UserRole } from '../../types/eduschool';
import { MODULE_METADATA, ROLE_MODULE_ACCESS } from '../../utils/rolePermissions';

interface SidebarProps {
  activeModule: ModuleId;
  onSelectModule: (moduleId: ModuleId) => void;
  activeDocSubmenu?: DocCenterSubmenuId;
  onSelectDocSubmenu?: (submenu: DocCenterSubmenuId) => void;
  activeRole: UserRole;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

const MODULE_ICONS: Record<ModuleId, React.ComponentType<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  tugasan: CheckSquare,
  panitia: BookOpen,
  akademik: BarChart3,
  murid: Users,
  dokumentasi: FolderKanban,
  takwim: Calendar,
  aset: Package,
  guru: GraduationCap,
  program: Award,
  laporan: FileSpreadsheet,
  'ai-assistant': Bot,
};

const DOC_SUBMENUS: Array<{
  id: DocCenterSubmenuId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'dashboard', label: 'Papan Pemuka Dokumentasi', icon: LayoutDashboard },
  { id: 'dokumen', label: 'Pengurusan Dokumen', icon: FileText },
  { id: 'kategori', label: 'Kategori Dokumen', icon: Tags },
  { id: 'folder', label: 'Folder Digital', icon: FolderOpen },
  { id: 'terkini', label: 'Dokumen Terkini', icon: Clock },
  { id: 'laporan', label: 'Laporan Dokumentasi', icon: FileBarChart },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  onSelectModule,
  activeDocSubmenu = 'dashboard',
  onSelectDocSubmenu,
  activeRole,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}) => {
  const allowedModules = ROLE_MODULE_ACCESS[activeRole];
  const [docMenuExpanded, setDocMenuExpanded] = useState(true);

  const renderNavList = (collapsed: boolean) => (
    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Menu Utama">
      {allowedModules.map((moduleId) => {
        const Icon = MODULE_ICONS[moduleId];
        const meta = MODULE_METADATA[moduleId];
        const isActive = activeModule === moduleId;

        if (moduleId === 'dokumentasi') {
          return (
            <div key={moduleId} className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  if (!collapsed) {
                    setDocMenuExpanded((prev) => (isActive ? !prev : true));
                  }
                  onSelectModule('dokumentasi');
                  if (!onSelectDocSubmenu) onCloseMobile();
                }}
                title={collapsed ? 'PUSAT DOKUMENTASI' : undefined}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-[#F0B90B] text-[#0B0E11] font-bold'
                    : 'text-[#848E9C] hover:bg-[#1E2329] hover:text-[#EAECEF]'
                } ${collapsed ? 'justify-center px-2' : ''}`}
              >
                <span className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-4.5 h-4.5 shrink-0 ${
                      isActive ? 'text-[#0B0E11]' : 'text-[#848E9C]'
                    }`}
                  />
                  {!collapsed && <span className="truncate font-bold tracking-wide">PUSAT DOKUMENTASI</span>}
                </span>
                {!collapsed && (
                  <ChevronDown
                    className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                      docMenuExpanded ? 'rotate-180' : ''
                    } ${isActive ? 'text-[#0B0E11]' : 'text-[#848E9C]'}`}
                  />
                )}
              </button>

              {!collapsed && docMenuExpanded && (
                <div className="pl-4 ml-3 border-l border-[#2B3139] space-y-0.5 py-0.5">
                  {DOC_SUBMENUS.map((sub) => {
                    const SubIcon = sub.icon;
                    const subActive = isActive && activeDocSubmenu === sub.id;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => {
                          if (onSelectDocSubmenu) {
                            onSelectDocSubmenu(sub.id);
                          } else {
                            onSelectModule('dokumentasi');
                          }
                          onCloseMobile();
                        }}
                        className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors text-left ${
                          subActive
                            ? 'bg-[#F0B90B]/15 text-[#F0B90B] font-bold'
                            : 'text-[#848E9C] hover:bg-[#1E2329] hover:text-[#EAECEF]'
                        }`}
                      >
                        <SubIcon
                          className={`w-3.5 h-3.5 shrink-0 ${
                            subActive ? 'text-[#F0B90B]' : 'text-[#848E9C]'
                          }`}
                        />
                        <span className="truncate">{sub.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        }

        return (
          <button
            key={moduleId}
            type="button"
            onClick={() => {
              onSelectModule(moduleId);
              onCloseMobile();
            }}
            title={collapsed ? meta.label : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              isActive
                ? 'bg-[#F0B90B] text-[#0B0E11] font-bold'
                : 'text-[#848E9C] hover:bg-[#1E2329] hover:text-[#EAECEF]'
            } ${collapsed ? 'justify-center px-2' : ''}`}
          >
            <Icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? 'text-[#0B0E11]' : 'text-[#848E9C]'}`} />
            {!collapsed && <span className="truncate">{meta.label}</span>}
          </button>
        );
      })}
    </nav>
  );

  const brandBlock = (collapsed: boolean) => (
    <div
      className={`flex items-center ${
        collapsed ? 'justify-center px-2' : 'justify-between px-4'
      } h-16 border-b border-[#2B3139] shrink-0`}
    >
      <button
        type="button"
        onClick={() => {
          onSelectModule('dashboard');
          onCloseMobile();
        }}
        className="flex items-center gap-2.5 text-left min-w-0 focus-visible:outline-none"
      >
        <div className="w-9 h-9 rounded-lg bg-[#F0B90B] text-[#0B0E11] flex items-center justify-center shrink-0">
          <svg
            viewBox="0 0 24 24"
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c3 3 9 3 12 0v-5" />
          </svg>
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="text-sm font-extrabold tracking-tight text-white leading-tight whitespace-nowrap">
              EDUSCHOOL 360
            </div>
            <div className="text-[11px] font-medium text-[#F0B90B] truncate">
              SMK Salaping, Sabah
            </div>
          </div>
        )}
      </button>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-[#12161B] text-[#EAECEF] shrink-0 transition-[width] duration-200 border-r border-[#2B3139] ${
          isCollapsed ? 'w-[72px]' : 'w-[260px]'
        }`}
      >
        {brandBlock(isCollapsed)}
        {renderNavList(isCollapsed)}
        <div className="p-3 border-t border-[#2B3139] shrink-0 space-y-2">
          {!isCollapsed && (
            <div className="px-2.5 py-1.5 rounded-lg bg-[#0B0E11] border border-[#2B3139] text-[10px] font-semibold text-[#848E9C] flex items-center justify-between">
              <span>MOD DATA SIMULASI</span>
              <span className="text-[#F0B90B] font-mono">V1.6</span>
            </div>
          )}
          <button
            type="button"
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-[#848E9C] hover:bg-[#1E2329] hover:text-[#EAECEF] transition-colors whitespace-nowrap"
            aria-label={isCollapsed ? 'Kembangkan bar sisi' : 'Kecilkan bar sisi'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span>Kecilkan Menu</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Mobile & Tablet Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-[2px]"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative z-10 w-[272px] max-w-[85vw] bg-[#12161B] text-[#EAECEF] flex flex-col h-full border-r border-[#2B3139] shadow-2xl">
            <div className="flex items-center justify-between px-4 h-16 border-b border-[#2B3139]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-[#F0B90B] text-[#0B0E11] flex items-center justify-center shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-extrabold text-white">EDUSCHOOL 360</div>
                  <div className="text-[11px] font-medium text-[#F0B90B]">SMK Salaping, Sabah</div>
                </div>
              </div>
              <button
                type="button"
                onClick={onCloseMobile}
                className="p-2 rounded-lg text-[#848E9C] hover:text-white hover:bg-[#1E2329]"
                aria-label="Tutup menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {renderNavList(false)}
          </aside>
        </div>
      )}
    </>
  );
};
