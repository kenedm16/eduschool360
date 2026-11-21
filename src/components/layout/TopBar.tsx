import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Bell,
  CalendarDays,
  ChevronDown,
  Menu,
  RotateCcw,
  ShieldAlert,
  Check,
  Search,
  X,
  CheckSquare,
  BookOpen,
  Award,
  FolderOpen,
  Clock,
  Sparkles,
  Lock,
} from 'lucide-react';
import {
  EduSchoolState,
  ModuleId,
  NotificationCategory,
  NotificationItem,
  UserRole,
} from '../../types/eduschool';
import {
  getRoleDisplayLabel,
  MODULE_METADATA,
  ROLE_MODULE_ACCESS,
  ROLE_PROFILES,
} from '../../utils/rolePermissions';
import { formatMalayFullDate } from '../../utils/formatters';
import { performGlobalSearch } from '../../utils/reportHelpers';

interface TopBarProps {
  appState: EduSchoolState;
  activeModule: ModuleId;
  activeRole: UserRole;
  onChangeRole: (role: UserRole) => void;
  notifications: NotificationItem[];
  onMarkNotificationRead: (id: string) => void;
  onMarkAllRead: () => void;
  onNavigateModule: (moduleId: ModuleId) => void;
  onOpenMobileMenu: () => void;
  onResetDemoData: () => void;
}

const ROLES_LIST: UserRole[] = [
  'Super Admin',
  'Pengetua',
  'Penolong Kanan',
  'Ketua Bidang',
  'Ketua Panitia',
  'Guru',
  'Staf',
];

const NOTIF_FILTERS: { id: 'semua' | NotificationCategory; label: string }[] = [
  { id: 'semua', label: 'Semua' },
  { id: 'tugasan_baharu', label: 'Tugasan' },
  { id: 'tarikh_akhir', label: 'Tarikh Akhir' },
  { id: 'program', label: 'Program' },
];

export const TopBar: React.FC<TopBarProps> = ({
  appState,
  activeModule,
  activeRole,
  onChangeRole,
  notifications,
  onMarkNotificationRead,
  onMarkAllRead,
  onNavigateModule,
  onOpenMobileMenu,
  onResetDemoData,
}) => {
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifFilter, setNotifFilter] = useState<'semua' | NotificationCategory>('semua');
  const [roleOpen, setRoleOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const profile = ROLE_PROFILES[activeRole];
  const allowedModules = ROLE_MODULE_ACCESS[activeRole];
  const unreadCount = notifications.filter((n) => !n.dibaca).length;
  const currentDateText = formatMalayFullDate(new Date());

  const searchResults = useMemo(
    () => performGlobalSearch(appState, searchQuery),
    [appState, searchQuery]
  );

  const filteredNotifications = useMemo(() => {
    if (notifFilter === 'semua') return notifications;
    return notifications.filter((n) => n.kategori === notifFilter);
  }, [notifications, notifFilter]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
      if (roleRef.current && !roleRef.current.contains(event.target as Node)) {
        setRoleOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
        setSearchOpen(true);
      } else if (event.key === 'Escape') {
        setSearchOpen(false);
        setNotifOpen(false);
        setRoleOpen(false);
        setMobileSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const getSearchIcon = (kategori: 'Tugasan' | 'Panitia' | 'Program' | 'Dokumen') => {
    switch (kategori) {
      case 'Tugasan':
        return CheckSquare;
      case 'Panitia':
        return BookOpen;
      case 'Program':
        return Award;
      case 'Dokumen':
        return FolderOpen;
    }
  };

  const getNotifBadge = (kategori?: NotificationCategory) => {
    switch (kategori) {
      case 'tarikh_akhir':
        return { label: 'Tarikh Akhir', cls: 'text-[#F6465D] bg-[#F6465D]/15', icon: Clock };
      case 'tugasan_baharu':
        return { label: 'Tugasan Baharu', cls: 'text-[#F0B90B] bg-[#F0B90B]/15', icon: Sparkles };
      case 'program':
        return { label: 'Program', cls: 'text-[#0ECB81] bg-[#0ECB81]/15', icon: Award };
      default:
        return { label: 'Sistem', cls: 'text-[#848E9C] bg-[#1E2329]', icon: Bell };
    }
  };

  const handleSelectSearchResult = (modul: ModuleId) => {
    onNavigateModule(modul);
    setSearchOpen(false);
    setMobileSearchOpen(false);
    setSearchQuery('');
  };

  const renderSearchDropdown = () => (
    <div className="absolute left-0 right-0 mt-2 bg-[#161A1E] rounded-xl border border-[#2B3139] shadow-2xl overflow-hidden z-50">
      <div className="px-3.5 py-2 border-b border-[#2B3139] bg-[#1E2329] flex items-center justify-between text-[11px] text-[#848E9C]">
        <span>Carian Global: Tugasan, Panitia, Program dan Dokumen</span>
        <span className="font-mono text-[#F0B90B] tabular-nums">
          {searchResults.length} hasil
        </span>
      </div>
      <div className="max-h-80 overflow-y-auto divide-y divide-[#2B3139]">
        {!searchQuery.trim() ? (
          <div className="p-4 text-xs text-[#848E9C]">
            Taip kata kunci seperti <strong className="text-[#EAECEF]">SPM</strong>,{' '}
            <strong className="text-[#EAECEF]">Matematik</strong>,{' '}
            <strong className="text-[#EAECEF]">Minit</strong> atau nama penyelaras untuk mencari merentasi 4 modul utama.
          </div>
        ) : searchResults.length === 0 ? (
          <div className="p-5 text-center text-xs text-[#848E9C]">
            Tiada rekod tugasan, panitia, program atau dokumen sepadan dengan &ldquo;{searchQuery}&rdquo;.
          </div>
        ) : (
          searchResults.map((res) => {
            const Icon = getSearchIcon(res.kategori);
            const hasAccess = allowedModules.includes(res.modul);
            return (
              <button
                key={res.id}
                type="button"
                onClick={() => handleSelectSearchResult(res.modul)}
                className="w-full text-left px-4 py-3 hover:bg-[#1E2329] transition-colors flex items-start gap-3"
              >
                <div className="w-7 h-7 rounded-lg bg-[#0B0E11] border border-[#2B3139] text-[#F0B90B] flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#EAECEF] truncate">
                      {res.tajuk}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-[#0B0E11] border border-[#2B3139] text-[#0ECB81] shrink-0">
                      {!hasAccess && <Lock className="w-2.5 h-2.5 text-[#F6465D]" />}
                      {res.kategori}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#848E9C] truncate mt-0.5">{res.subtajuk}</p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <header className="sticky top-0 z-30 bg-[#12161B] border-b border-[#2B3139] shrink-0">
      <div className="h-16 px-4 sm:px-6 flex items-center justify-between gap-3">
        {/* Left Zone: Mobile toggle + Contextual Breadcrumb + Current Date */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 -ml-2 rounded-lg text-[#848E9C] hover:text-white hover:bg-[#1E2329] transition-colors"
            aria-label="Buka menu navigasi"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-sm min-w-0">
            <button
              type="button"
              onClick={() => onNavigateModule('dashboard')}
              className="hidden sm:inline font-medium text-[#848E9C] hover:text-[#EAECEF] transition-colors whitespace-nowrap"
            >
              SMK Salaping
            </button>
            <span className="hidden sm:inline text-[#2B3139]" aria-hidden="true">
              /
            </span>
            <span className="font-bold text-[#EAECEF] truncate">
              {MODULE_METADATA[activeModule].shortLabel}
            </span>
          </div>

          <div className="hidden 2xl:flex items-center gap-1.5 pl-4 ml-2 border-l border-[#2B3139] text-xs text-[#848E9C] whitespace-nowrap">
            <CalendarDays className="w-3.5 h-3.5 text-[#F0B90B]" />
            <span className="tabular-nums">{currentDateText}</span>
          </div>
        </div>

        {/* Center Zone: Global Search (Desktop & Tablet) */}
        <div className="hidden md:block flex-1 max-w-md mx-2 relative" ref={searchRef}>
          <div className="relative">
            <Search className="w-4 h-4 text-[#848E9C] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onFocus={() => setSearchOpen(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchOpen(true);
              }}
              placeholder="Cari tugasan, panitia, program, dokumen..."
              aria-label="Carian global"
              className="w-full pl-9 pr-14 py-2 text-xs sm:text-sm bg-[#0B0E11] text-[#EAECEF] placeholder:text-[#707A8A] border border-[#2B3139] rounded-lg focus:outline-none focus:border-[#F0B90B] transition-colors"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-[#848E9C] hover:text-white"
                aria-label="Kosongkan carian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <span className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-[#848E9C] bg-[#161A1E] border border-[#2B3139] rounded absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                Ctrl+K
              </span>
            )}
          </div>
          {searchOpen && renderSearchDropdown()}
        </div>

        {/* Right Zone: Mobile Search + Notifications + User Profile / Role Switcher */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setMobileSearchOpen((prev) => !prev)}
            className="md:hidden p-2.5 rounded-lg text-[#848E9C] hover:text-[#EAECEF] hover:bg-[#1E2329] transition-colors"
            aria-label="Buka carian global"
          >
            <Search className="w-4.5 h-4.5" />
          </button>

          {/* Notifications Popover */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => {
                setNotifOpen((prev) => !prev);
                setRoleOpen(false);
                setSearchOpen(false);
              }}
              className="relative p-2.5 rounded-lg text-[#848E9C] hover:text-[#EAECEF] hover:bg-[#1E2329] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F0B90B]"
              aria-label={`Pemberitahuan (${unreadCount} belum dibaca)`}
            >
              <Bell className="w-4.5 h-4.5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-[#F0B90B] text-[#0B0E11] text-[10px] font-extrabold flex items-center justify-center tabular-nums">
                  {unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-[400px] bg-[#161A1E] rounded-xl border border-[#2B3139] shadow-2xl overflow-hidden z-40">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#2B3139]">
                  <div>
                    <h3 className="text-sm font-bold text-[#EAECEF]">Pemberitahuan Sistem</h3>
                    <p className="text-xs text-[#848E9C] tabular-nums">
                      {unreadCount} belum dibaca · tugasan, tarikh akhir dan program
                    </p>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={onMarkAllRead}
                      className="text-xs font-semibold text-[#F0B90B] hover:text-[#F8D12F] whitespace-nowrap"
                    >
                      Tandakan dibaca
                    </button>
                  )}
                </div>

                <div className="px-3 py-2 border-b border-[#2B3139] bg-[#0B0E11]/60 flex items-center gap-1 overflow-x-auto">
                  {NOTIF_FILTERS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setNotifFilter(f.id)}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-md whitespace-nowrap transition-colors ${
                        notifFilter === f.id
                          ? 'bg-[#F0B90B] text-[#0B0E11] font-bold'
                          : 'text-[#848E9C] hover:text-[#EAECEF]'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-[#2B3139]">
                  {filteredNotifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-[#848E9C]">
                      Tiada pemberitahuan bagi kategori ini buat masa ini.
                    </div>
                  ) : (
                    filteredNotifications.map((item) => {
                      const badge = getNotifBadge(item.kategori);
                      const BadgeIcon = badge.icon;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            onMarkNotificationRead(item.id);
                            onNavigateModule(item.modulSasaran);
                            setNotifOpen(false);
                          }}
                          className={`w-full text-left px-4 py-3 hover:bg-[#1E2329] transition-colors flex items-start gap-3 ${
                            !item.dibaca ? 'bg-[#F0B90B]/5' : ''
                          }`}
                        >
                          <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${badge.cls}`}>
                            <BadgeIcon className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p
                                className={`text-xs font-semibold truncate ${
                                  !item.dibaca ? 'text-[#F0B90B]' : 'text-[#EAECEF]'
                                }`}
                              >
                                {item.tajuk}
                              </p>
                              <span className="text-[10px] text-[#848E9C] whitespace-nowrap shrink-0">
                                {item.masa}
                              </span>
                            </div>
                            <p className="text-xs text-[#848E9C] mt-0.5 line-clamp-2">
                              {item.mesej}
                            </p>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile & 7-Role Demo Switcher */}
          <div className="relative" ref={roleRef}>
            <button
              type="button"
              onClick={() => {
                setRoleOpen((prev) => !prev);
                setNotifOpen(false);
                setSearchOpen(false);
              }}
              className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-lg bg-[#161A1E] border border-[#2B3139] hover:border-[#474D57] hover:bg-[#1E2329] transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-[#F0B90B] text-[#0B0E11] text-xs font-extrabold flex items-center justify-center shrink-0">
                {profile.initials}
              </div>
              <div className="hidden md:block min-w-0 max-w-[160px]">
                <div className="text-xs font-bold text-[#EAECEF] truncate">
                  {profile.userName}
                </div>
                <div className="text-[11px] font-semibold text-[#F0B90B] truncate">
                  {getRoleDisplayLabel(profile.role)}
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-[#848E9C] shrink-0" />
            </button>

            {roleOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-[#161A1E] rounded-xl border border-[#2B3139] shadow-2xl overflow-hidden z-40">
                <div className="px-4 py-3.5 bg-[#1E2329] border-b border-[#2B3139]">
                  <div className="text-sm font-bold text-white">{profile.userName}</div>
                  <div className="text-xs text-[#F0B90B] font-semibold mt-0.5">{profile.title}</div>
                  <div className="text-[11px] text-[#848E9C] mt-1">{profile.department}</div>
                </div>

                <div className="px-4 py-2.5 bg-[#F0B90B]/10 border-b border-[#2B3139] flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-[#F0B90B] shrink-0 mt-0.5" />
                  <p className="text-[11px] text-[#EAECEF] leading-snug">
                    <strong className="text-[#F0B90B]">Simulasi Peranan (Mod Simulasi):</strong> Pilih peranan di bawah untuk menguji paparan papan pemuka dan akses menu (bukan sistem keselamatan sebenar).
                  </p>
                </div>

                <div className="p-2 max-h-64 overflow-y-auto space-y-0.5">
                  {ROLES_LIST.map((role) => {
                    const itemProfile = ROLE_PROFILES[role];
                    const selected = role === activeRole;
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => {
                          onChangeRole(role);
                          setRoleOpen(false);
                        }}
                        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                          selected
                            ? 'bg-[#F0B90B]/15 text-[#F0B90B]'
                            : 'hover:bg-[#1E2329] text-[#EAECEF]'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-bold">{getRoleDisplayLabel(role)}</div>
                          <div className="text-[11px] text-[#848E9C] truncate">
                            {itemProfile.userName}
                          </div>
                        </div>
                        {selected && <Check className="w-4 h-4 text-[#F0B90B] shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                <div className="p-2.5 border-t border-[#2B3139] bg-[#12161B]">
                  <button
                    type="button"
                    onClick={() => {
                      onResetDemoData();
                      setRoleOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-[#EAECEF] bg-[#1E2329] border border-[#2B3139] rounded-lg hover:bg-[#2B3139] transition-colors whitespace-nowrap"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#F0B90B]" />
                    Set Semula Data Simulasi Asal
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Global Search Bar */}
      {mobileSearchOpen && (
        <div className="md:hidden px-4 pb-3 border-t border-[#2B3139] pt-2.5 bg-[#12161B] relative">
          <div className="relative">
            <Search className="w-4 h-4 text-[#848E9C] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari tugasan, panitia, program, dokumen..."
              className="w-full pl-9 pr-9 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] placeholder:text-[#707A8A] border border-[#2B3139] rounded-lg focus:outline-none focus:border-[#F0B90B]"
            />
            <button
              type="button"
              onClick={() => {
                setMobileSearchOpen(false);
                setSearchQuery('');
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#848E9C] hover:text-white"
              aria-label="Tutup carian"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {searchQuery.trim() && (
            <div className="relative mt-1">{renderSearchDropdown()}</div>
          )}
        </div>
      )}
    </header>
  );
};
