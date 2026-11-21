import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Users,
  Wallet,
  CalendarRange,
  FileText,
  Trash2,
  Edit3,
  ChevronRight,
  MessageSquareText,
  Sparkles,
  BarChart3,
  FolderOpen,
  ShieldCheck,
  TrendingDown,
  PiggyBank,
} from 'lucide-react';
import {
  DigitalDocument,
  ExamRecord,
  PanitiaItem,
  TeacherItem,
  UserRole,
} from '../../types/eduschool';
import { formatCurrencyRM } from '../../utils/formatters';
import { getRoleDisplayLabel } from '../../utils/rolePermissions';
import {
  PANITIA_BIDANG_OPTIONS,
  computeAllPanitiaStats,
  computePanitiaFinanceSummary,
  filterPanitiasByRoleScope,
  getPanitiaCode,
  getPanitiaRoleControl,
} from '../../utils/panitiaHelpers';
import { ModuleHeader } from '../common/ModuleHeader';
import { EmptyState } from '../common/EmptyState';
import { ConfirmDeleteModal } from '../common/Modal';
import { PanitiaFormModal } from './panitia/PanitiaFormModal';
import { PanitiaMembersPanel } from './panitia/PanitiaMembersPanel';
import { PanitiaPlanningPanel } from './panitia/PanitiaPlanningPanel';
import { PanitiaMeetingPanel } from './panitia/PanitiaMeetingPanel';
import { PanitiaFinancePanel } from './panitia/PanitiaFinancePanel';
import { PanitiaActivityPanel } from './panitia/PanitiaActivityPanel';
import { PanitiaDocumentPanel } from './panitia/PanitiaDocumentPanel';
import { PanitiaAnalysisPanel } from './panitia/PanitiaAnalysisPanel';

interface PanitiaModuleProps {
  panitiaList: PanitiaItem[];
  teachers: TeacherItem[];
  documents: DigitalDocument[];
  examRecords: ExamRecord[];
  activeRole: UserRole;
  onBackToDashboard: () => void;
  onAddPanitia: (item: Omit<PanitiaItem, 'id'>) => void;
  onUpdatePanitia: (item: PanitiaItem) => void;
  onDeletePanitia: (id: string) => void;
  onNotify?: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

type PanitiaWorkspaceTab =
  | 'profil'
  | 'perancangan'
  | 'mesyuarat'
  | 'kewangan'
  | 'aktiviti'
  | 'dokumen'
  | 'analisis';

export const PanitiaModule: React.FC<PanitiaModuleProps> = ({
  panitiaList,
  teachers,
  documents,
  examRecords,
  activeRole,
  onBackToDashboard,
  onAddPanitia,
  onUpdatePanitia,
  onDeletePanitia,
  onNotify,
}) => {
  const roleControl = useMemo(() => getPanitiaRoleControl(activeRole), [activeRole]);
  const scopedPanitias = useMemo(
    () => filterPanitiasByRoleScope(panitiaList, activeRole),
    [panitiaList, activeRole]
  );

  const [selectedId, setSelectedId] = useState<string>(scopedPanitias[0]?.id ?? '');
  const [activeTab, setActiveTab] = useState<PanitiaWorkspaceTab>('profil');

  const [searchQuery, setSearchQuery] = useState('');
  const [bidangFilter, setBidangFilter] = useState('Semua');
  const [statusFilter, setStatusFilter] = useState<'Semua' | 'Aktif' | 'Tidak Aktif'>('Semua');

  const [isPanitiaModalOpen, setIsPanitiaModalOpen] = useState(false);
  const [editingPanitia, setEditingPanitia] = useState<PanitiaItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PanitiaItem | null>(null);

  // Statistik keseluruhan dinamik (dikira daripada rekod panitia yang wujud dalam skop peranan)
  const overallStats = useMemo(() => computeAllPanitiaStats(scopedPanitias), [scopedPanitias]);

  const filteredPanitias = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return scopedPanitias.filter((pan) => {
      const code = getPanitiaCode(pan).toLowerCase();
      const matchQuery =
        !q ||
        pan.nama.toLowerCase().includes(q) ||
        code.includes(q) ||
        pan.ketuaPanitia.toLowerCase().includes(q) ||
        (pan.setiausaha || '').toLowerCase().includes(q) ||
        pan.bidang.toLowerCase().includes(q);
      const matchBidang = bidangFilter === 'Semua' || pan.bidang === bidangFilter;
      const panStatus = pan.statusAktif || 'Aktif';
      const matchStatus = statusFilter === 'Semua' || panStatus === statusFilter;
      return matchQuery && matchBidang && matchStatus;
    });
  }, [scopedPanitias, searchQuery, bidangFilter, statusFilter]);

  const selectedPanitia =
    filteredPanitias.find((p) => p.id === selectedId) ??
    filteredPanitias[0] ??
    scopedPanitias[0] ??
    null;

  const openAddPanitiaModal = () => {
    if (!roleControl.canCreatePanitia) {
      onNotify?.(
        'info',
        'Had Simulasi Peranan',
        `Peranan ${getRoleDisplayLabel(activeRole)} tidak dibenarkan mendaftar panitia baharu. Tukar ke Pentadbir Utama atau Penolong Kanan.`
      );
      return;
    }
    setEditingPanitia(null);
    setIsPanitiaModalOpen(true);
  };

  const openEditPanitiaModal = (pan: PanitiaItem) => {
    if (!roleControl.canEditPanitiaProfile) {
      onNotify?.(
        'info',
        'Mod Baca Sahaja',
        `Peranan ${getRoleDisplayLabel(activeRole)} hanya dibenarkan memantau maklumat panitia.`
      );
      return;
    }
    setEditingPanitia(pan);
    setIsPanitiaModalOpen(true);
  };

  const tabs: {
    id: PanitiaWorkspaceTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }[] = selectedPanitia
    ? [
        { id: 'profil', label: 'Profil & Ahli', icon: Users, badge: selectedPanitia.ahli.length },
        {
          id: 'perancangan',
          label: 'Perancangan Tahunan',
          icon: CalendarRange,
          badge: selectedPanitia.perancanganTahunan.length,
        },
        {
          id: 'mesyuarat',
          label: 'Mesyuarat',
          icon: MessageSquareText,
          badge: selectedPanitia.mesyuarat?.length ?? 0,
        },
        {
          id: 'kewangan',
          label: 'Kewangan PCG',
          icon: Wallet,
          badge: selectedPanitia.rekodKewangan.length,
        },
        {
          id: 'aktiviti',
          label: 'Aktiviti & Program',
          icon: Sparkles,
          badge: selectedPanitia.aktivitiTerperinci?.length ?? selectedPanitia.aktivitiTerkini.length,
        },
        {
          id: 'dokumen',
          label: 'Dokumentasi & Evidens',
          icon: FolderOpen,
          badge: selectedPanitia.dokumenPanitia?.length ?? 0,
        },
        { id: 'analisis', label: 'Analisis & Laporan', icon: BarChart3 },
      ]
    : [];

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="PENGURUSAN PANITIA"
        description="Pusat pengurusan akademik, perancangan, kewangan dan dokumentasi panitia."
        onBackToDashboard={onBackToDashboard}
        actions={
          <button
            type="button"
            onClick={openAddPanitiaModal}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-colors whitespace-nowrap print:hidden ${
              roleControl.canCreatePanitia
                ? 'text-[#0B0E11] bg-[#F0B90B] hover:bg-[#F8D12F]'
                : 'text-[#848E9C] bg-[#1E2329] border border-[#2B3139] cursor-not-allowed'
            }`}
          >
            <Plus className="w-4 h-4" />
            TAMBAH PANITIA
          </button>
        }
      />

      {/* Banner Simulasi Kawalan Akses Peranan (Seksyen I) */}
      <div className="p-3.5 rounded-xl bg-[#161A1E] border border-[#2B3139] flex flex-col sm:flex-row sm:items-center justify-between gap-2 print:hidden">
        <div className="flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-[#F0B90B] shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold text-[#F0B90B]">
              Simulasi Peranan ({getRoleDisplayLabel(activeRole)}) · {roleControl.scopeLabel}
            </span>
            <p className="text-[#848E9C] mt-0.5">
              {roleControl.description} (Simulasi demonstrasi sahaja, bukan kawalan keselamatan sebenar).
            </p>
          </div>
        </div>
        <span className="text-[11px] font-mono text-[#848E9C] shrink-0">
          Arkib Sekolah: {documents.length} fail umum
        </span>
      </div>

      {/* 6 Kad Statistik Dinamik Panitia (Seksyen A) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3.5 print:hidden">
        <div className="p-4 rounded-xl bg-[#161A1E] border border-[#2B3139]">
          <div className="flex items-center justify-between text-xs text-[#848E9C]">
            <span>Jumlah Panitia</span>
            <BookOpen className="w-4 h-4 text-[#F0B90B]" />
          </div>
          <div
            data-testid="stat-jumlah-panitia"
            className="text-2xl font-extrabold text-[#EAECEF] font-mono tabular-nums mt-1.5"
          >
            {overallStats.jumlahPanitia}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#161A1E] border border-[#2B3139]">
          <div className="flex items-center justify-between text-xs text-[#848E9C]">
            <span>Jumlah Aktiviti</span>
            <Sparkles className="w-4 h-4 text-[#0ECB81]" />
          </div>
          <div
            data-testid="stat-jumlah-aktiviti"
            className="text-2xl font-extrabold text-[#0ECB81] font-mono tabular-nums mt-1.5"
          >
            {overallStats.jumlahAktiviti}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#161A1E] border border-[#2B3139]">
          <div className="flex items-center justify-between text-xs text-[#848E9C]">
            <span>Jumlah Mesyuarat</span>
            <FileText className="w-4 h-4 text-[#F0B90B]" />
          </div>
          <div
            data-testid="stat-jumlah-mesyuarat"
            className="text-2xl font-extrabold text-[#EAECEF] font-mono tabular-nums mt-1.5"
          >
            {overallStats.jumlahMesyuarat}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#161A1E] border border-[#2B3139]">
          <div className="flex items-center justify-between text-xs text-[#848E9C]">
            <span>Jumlah Peruntukan</span>
            <Wallet className="w-4 h-4 text-[#F0B90B]" />
          </div>
          <div
            data-testid="stat-jumlah-peruntukan"
            className="text-lg font-extrabold text-[#EAECEF] font-mono tabular-nums mt-2 truncate"
          >
            {formatCurrencyRM(overallStats.jumlahPeruntukan)}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#161A1E] border border-[#2B3139]">
          <div className="flex items-center justify-between text-xs text-[#848E9C]">
            <span>Jumlah Perbelanjaan</span>
            <TrendingDown className="w-4 h-4 text-[#F6465D]" />
          </div>
          <div
            data-testid="stat-jumlah-perbelanjaan"
            className="text-lg font-extrabold text-[#F6465D] font-mono tabular-nums mt-2 truncate"
          >
            {formatCurrencyRM(overallStats.jumlahPerbelanjaan)}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0ECB81]/10 border border-[#0ECB81]/30">
          <div className="flex items-center justify-between text-xs font-medium text-[#0ECB81]">
            <span>Baki Peruntukan</span>
            <PiggyBank className="w-4 h-4 text-[#0ECB81]" />
          </div>
          <div
            data-testid="stat-baki-peruntukan"
            className="text-lg font-extrabold text-[#0ECB81] font-mono tabular-nums mt-2 truncate"
          >
            {formatCurrencyRM(overallStats.bakiPeruntukan)}
          </div>
        </div>
      </div>

      {/* Bar Carian & Penapis Bidang / Status */}
      <div className="p-4 rounded-xl bg-[#161A1E] border border-[#2B3139] flex flex-col md:flex-row items-stretch md:items-center gap-3 print:hidden">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#848E9C] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama panitia, ID panitia, ketua panitia atau setiausaha..."
            aria-label="Carian panitia"
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-[#0B0E11] text-[#EAECEF] placeholder:text-[#707A8A] border border-[#2B3139] rounded-lg focus:outline-none focus:border-[#F0B90B]"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <select
            value={bidangFilter}
            onChange={(e) => setBidangFilter(e.target.value)}
            aria-label="Tapis mengikut bidang"
            className="px-3 py-2 text-xs sm:text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg focus:outline-none focus:border-[#F0B90B]"
          >
            <option value="Semua">Semua Bidang</option>
            {PANITIA_BIDANG_OPTIONS.map((b) => (
              <option key={b} value={b}>
                Bidang: {b}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'Semua' | 'Aktif' | 'Tidak Aktif')}
            aria-label="Tapis mengikut status panitia"
            className="px-3 py-2 text-xs sm:text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg focus:outline-none focus:border-[#F0B90B]"
          >
            <option value="Semua">Semua Status</option>
            <option value="Aktif">Status: Aktif</option>
            <option value="Tidak Aktif">Status: Tidak Aktif</option>
          </select>
        </div>
      </div>

      {scopedPanitias.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Tiada Panitia Didaftarkan"
          description="Sila tambah panitia mata pelajaran untuk mengurus perancangan tahunan dan rekod PCG."
          actionLabel={roleControl.canCreatePanitia ? 'Tambah Panitia Pertama' : undefined}
          onAction={roleControl.canCreatePanitia ? openAddPanitiaModal : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Senarai Panitia Kiri */}
          <div className="lg:col-span-4 bg-[#161A1E] rounded-xl border border-[#2B3139] overflow-hidden print:hidden">
            <div className="px-5 py-4 border-b border-[#2B3139] flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#EAECEF]">
                Senarai Panitia ({filteredPanitias.length})
              </h2>
              {(searchQuery || bidangFilter !== 'Semua' || statusFilter !== 'Semua') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setBidangFilter('Semua');
                    setStatusFilter('Semua');
                  }}
                  className="text-[11px] font-semibold text-[#F0B90B] hover:underline"
                >
                  Set Semula
                </button>
              )}
            </div>

            {filteredPanitias.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#848E9C]">
                Tiada panitia sepadan dengan carian atau penapis dipilih.
              </div>
            ) : (
              <div className="divide-y divide-[#2B3139] max-h-[760px] overflow-y-auto">
                {filteredPanitias.map((pan, idx) => {
                  const active = selectedPanitia?.id === pan.id;
                  const { baki } = computePanitiaFinanceSummary(pan);
                  const code = getPanitiaCode(pan, idx);
                  const isAktif = (pan.statusAktif || 'Aktif') === 'Aktif';
                  return (
                    <button
                      key={pan.id}
                      type="button"
                      onClick={() => setSelectedId(pan.id)}
                      className={`w-full text-left px-5 py-3.5 flex items-center justify-between gap-3 transition-colors ${
                        active ? 'bg-[#F0B90B]/10' : 'hover:bg-[#1E2329]'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold text-[#848E9C]">
                            {code}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              isAktif
                                ? 'bg-[#0ECB81]/15 text-[#0ECB81]'
                                : 'bg-[#F6465D]/15 text-[#F6465D]'
                            }`}
                          >
                            {pan.statusAktif || 'Aktif'}
                          </span>
                        </div>
                        <div
                          className={`text-sm font-bold truncate mt-0.5 ${
                            active ? 'text-[#F0B90B]' : 'text-[#EAECEF]'
                          }`}
                        >
                          {pan.nama}
                        </div>
                        <div className="text-[11px] text-[#848E9C] mt-0.5 truncate">
                          {pan.bidang} · Ketua: {pan.ketuaPanitia}
                        </div>
                        <div className="text-[11px] text-[#0ECB81] mt-1 tabular-nums">
                          {pan.ahli.length} ahli · {pan.mesyuarat?.length ?? 0} mesyuarat · Baki:{' '}
                          {formatCurrencyRM(baki)}
                        </div>
                      </div>
                      <ChevronRight
                        className={`w-4 h-4 shrink-0 ${
                          active ? 'text-[#F0B90B]' : 'text-[#474D57]'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Ruang Kerja Terperinci Panitia Kanan */}
          {selectedPanitia && (
            <div className="lg:col-span-8 bg-[#161A1E] rounded-xl border border-[#2B3139] overflow-hidden">
              <div className="px-6 py-5 border-b border-[#2B3139] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#F0B90B]/15 text-[#F0B90B]">
                      {getPanitiaCode(selectedPanitia)}
                    </span>
                    <span className="text-xs font-semibold text-[#F0B90B]">
                      Bidang {selectedPanitia.bidang}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        selectedPanitia.statusAktif === 'Tidak Aktif'
                          ? 'bg-[#F6465D]/15 text-[#F6465D]'
                          : 'bg-[#0ECB81]/15 text-[#0ECB81]'
                      }`}
                    >
                      {selectedPanitia.statusAktif || 'Aktif'}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white mt-1 truncate">
                    {selectedPanitia.nama}
                  </h2>
                  <p className="text-xs text-[#848E9C] mt-1">
                    Ketua: <strong className="text-[#EAECEF]">{selectedPanitia.ketuaPanitia}</strong> ·
                    Setiausaha: <strong className="text-[#EAECEF]">{selectedPanitia.setiausaha || '-'}</strong> ·{' '}
                    {selectedPanitia.ahli.length} ahli
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 print:hidden">
                  {roleControl.canEditPanitiaProfile && (
                    <button
                      type="button"
                      onClick={() => openEditPanitiaModal(selectedPanitia)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#EAECEF] bg-[#1E2329] border border-[#2B3139] rounded-lg hover:bg-[#2B3139]"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Kemaskini Panitia
                    </button>
                  )}
                  {roleControl.canDeletePanitia && (
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(selectedPanitia)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#F6465D] bg-[#F6465D]/10 border border-[#F6465D]/30 rounded-lg hover:bg-[#F6465D]/20"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Padam
                    </button>
                  )}
                </div>
              </div>

              {/* 7 Tab Sub-Modul Panitia Pro */}
              <div className="px-4 sm:px-6 pt-2 border-b border-[#2B3139] flex items-center gap-1.5 overflow-x-auto print:hidden">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                        isActive
                          ? 'border-[#F0B90B] text-[#F0B90B]'
                          : 'border-transparent text-[#848E9C] hover:text-[#EAECEF]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                      {typeof tab.badge === 'number' && (
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                            isActive
                              ? 'bg-[#F0B90B]/20 text-[#F0B90B]'
                              : 'bg-[#1E2329] text-[#848E9C]'
                          }`}
                        >
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="p-5 sm:p-6">
                {activeTab === 'profil' && (
                  <PanitiaMembersPanel
                    panitia={selectedPanitia}
                    teachers={teachers}
                    roleControl={roleControl}
                    onUpdatePanitia={onUpdatePanitia}
                  />
                )}

                {activeTab === 'perancangan' && (
                  <PanitiaPlanningPanel
                    panitia={selectedPanitia}
                    roleControl={roleControl}
                    onUpdatePanitia={onUpdatePanitia}
                  />
                )}

                {activeTab === 'mesyuarat' && (
                  <PanitiaMeetingPanel
                    panitia={selectedPanitia}
                    roleControl={roleControl}
                    onUpdatePanitia={onUpdatePanitia}
                    onNotify={onNotify}
                  />
                )}

                {activeTab === 'kewangan' && (
                  <PanitiaFinancePanel
                    panitia={selectedPanitia}
                    roleControl={roleControl}
                    onUpdatePanitia={onUpdatePanitia}
                    onNotify={onNotify}
                  />
                )}

                {activeTab === 'aktiviti' && (
                  <PanitiaActivityPanel
                    panitia={selectedPanitia}
                    roleControl={roleControl}
                    onUpdatePanitia={onUpdatePanitia}
                    onNotify={onNotify}
                  />
                )}

                {activeTab === 'dokumen' && (
                  <PanitiaDocumentPanel
                    panitia={selectedPanitia}
                    roleControl={roleControl}
                    onUpdatePanitia={onUpdatePanitia}
                    onNotify={onNotify}
                  />
                )}

                {activeTab === 'analisis' && (
                  <PanitiaAnalysisPanel
                    panitia={selectedPanitia}
                    examRecords={examRecords}
                    roleControl={roleControl}
                    onUpdatePanitia={onUpdatePanitia}
                    onNotify={onNotify}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <PanitiaFormModal
        isOpen={isPanitiaModalOpen}
        onClose={() => setIsPanitiaModalOpen(false)}
        editingPanitia={editingPanitia}
        allPanitias={panitiaList}
        teachers={teachers}
        onSaveNew={onAddPanitia}
        onSaveEdit={onUpdatePanitia}
      />

      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            onDeletePanitia(deleteTarget.id);
            if (selectedId === deleteTarget.id) {
              setSelectedId('');
            }
          }
        }}
        itemName={deleteTarget ? `${getPanitiaCode(deleteTarget)} · ${deleteTarget.nama}` : ''}
      />
    </div>
  );
};
