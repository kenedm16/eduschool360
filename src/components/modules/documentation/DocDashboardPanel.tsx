import React from 'react';
import {
  Activity,
  Archive,
  CheckCircle2,
  Clock,
  FileCheck2,
  FilePlus2,
  Files,
  FolderOpen,
  FolderPlus,
  HardDrive,
  Tags,
} from 'lucide-react';
import {
  DocCenterDocument,
  DocCenterSubmenuId,
  DocCenterV15State,
} from '../../../types/eduschool';
import {
  DocCenterComputedStats,
  getCategoryName,
  getFolderName,
} from '../../../utils/docCenterHelpers';

interface DocDashboardPanelProps {
  docState: DocCenterV15State;
  stats: DocCenterComputedStats;
  canAddDocument: boolean;
  canManageFolders: boolean;
  onQuickAddDocument: () => void;
  onQuickAddFolder: () => void;
  onNavigateSubmenu: (submenu: DocCenterSubmenuId) => void;
  onSelectCategoryFilter: (categoryId: string) => void;
  onViewDocument: (doc: DocCenterDocument) => void;
}

export const DocDashboardPanel: React.FC<DocDashboardPanelProps> = ({
  docState,
  stats,
  canAddDocument,
  canManageFolders,
  onQuickAddDocument,
  onQuickAddFolder,
  onNavigateSubmenu,
  onSelectCategoryFilter,
  onViewDocument,
}) => {
  const maxMonthCount = Math.max(
    1,
    ...stats.byMonthCurrentYear.map((m) => m.count)
  );

  const recentDocuments = [...docState.documents]
    .sort(
      (a, b) =>
        b.tarikhDimuatNaik.localeCompare(a.tarikhDimuatNaik) ||
        b.tarikhDokumen.localeCompare(a.tarikhDokumen)
    )
    .slice(0, 6);

  const recentActivities = docState.activities.slice(0, 7);

  return (
    <div className="space-y-6">
      {/* Jalur Tindakan Pantas & Makluman Storan */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-xl bg-[#161A1E] border border-[#2B3139]">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-[#F0B90B]/15 text-[#F0B90B] flex items-center justify-center shrink-0">
            <HardDrive className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-[#EAECEF]">
              Mod Prototaip Storan Setempat Pelayar
            </div>
            <p className="text-xs text-[#848E9C] mt-0.5 leading-relaxed">
              Fail yang dimuat naik (had 2 MB) disimpan sementara dalam storan setempat pelayar dan belum disambungkan ke storan awan sekolah (Fasa 2). Semua rekod contoh ialah data simulasi.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {canManageFolders && (
            <button
              type="button"
              onClick={onQuickAddFolder}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#EAECEF] bg-[#1E2329] border border-[#2B3139] rounded-lg hover:bg-[#2B3139] transition-colors whitespace-nowrap"
            >
              <FolderPlus className="w-4 h-4 text-[#F0B90B]" />
              Cipta Folder
            </button>
          )}
          {canAddDocument && (
            <button
              type="button"
              onClick={onQuickAddDocument}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-[#0B0E11] bg-[#F0B90B] rounded-lg hover:bg-[#F8D12F] transition-colors whitespace-nowrap"
            >
              <FilePlus2 className="w-4 h-4" />
              Tambah Dokumen
            </button>
          )}
        </div>
      </div>

      {/* 4 Kad Statistik Utama (Dinamik) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => onNavigateSubmenu('dokumen')}
          className="text-left bg-[#161A1E] rounded-xl border border-[#2B3139] hover:border-[#F0B90B]/50 p-5 transition-colors"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-[#848E9C]">
            <span>Jumlah Keseluruhan Dokumen</span>
            <Files className="w-4 h-4 text-[#F0B90B]" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono tabular-nums mt-2">
            {stats.totalDocs}
          </div>
          <div className="flex flex-wrap items-center gap-1.5 mt-2.5 text-[11px]">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#0ECB81]/15 text-[#0ECB81] font-semibold">
              <CheckCircle2 className="w-3 h-3" />
              {stats.activeCount} Aktif
            </span>
            {stats.pendingApprovalCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#38BDF8]/15 text-[#38BDF8] font-semibold">
                {stats.pendingApprovalCount} Menunggu Pengesahan
              </span>
            )}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#F0B90B]/15 text-[#F0B90B] font-semibold">
              {stats.draftCount} Draf
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#2B3139] text-[#848E9C] font-semibold">
              <Archive className="w-3 h-3" />
              {stats.archiveCount} Arkib
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateSubmenu('folder')}
          className="text-left bg-[#161A1E] rounded-xl border border-[#2B3139] hover:border-[#38BDF8]/50 p-5 transition-colors"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-[#848E9C]">
            <span>Jumlah Folder Digital</span>
            <FolderOpen className="w-4 h-4 text-[#38BDF8]" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono tabular-nums mt-2">
            {stats.totalFolders}
          </div>
          <p className="text-xs text-[#848E9C] mt-2.5">
            Tersusun di bawah DOKUMENTASI SEKOLAH
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigateSubmenu('kategori')}
          className="text-left bg-[#161A1E] rounded-xl border border-[#2B3139] hover:border-[#0ECB81]/50 p-5 transition-colors"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-[#848E9C]">
            <span>Jumlah Kategori Dokumen</span>
            <Tags className="w-4 h-4 text-[#0ECB81]" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono tabular-nums mt-2">
            {stats.totalCategories}
          </div>
          <p className="text-xs text-[#848E9C] mt-2.5">
            Kategori rasmi pengurusan sekolah
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigateSubmenu('terkini')}
          className="text-left bg-[#161A1E] rounded-xl border border-[#F0B90B]/40 hover:border-[#F0B90B] p-5 transition-colors"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-[#F0B90B]">
            <span>Ditambah Bulan Ini</span>
            <FileCheck2 className="w-4 h-4 text-[#F0B90B]" />
          </div>
          <div className="text-3xl font-extrabold text-[#F0B90B] font-mono tabular-nums mt-2">
            {stats.addedThisMonth}
          </div>
          <p className="text-xs text-[#848E9C] mt-2.5">
            Tempoh semasa: {stats.currentMonthLabel}
          </p>
        </button>
      </div>

      {/* Graf Statistik Dokumen Mengikut Bulan & Pecahan Kategori */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Graf Bar Bulanan */}
        <div className="xl:col-span-7 bg-[#161A1E] rounded-xl border border-[#2B3139] p-5 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
            <div>
              <h3 className="text-sm font-bold text-[#EAECEF]">
                Graf Statistik Dokumen Mengikut Bulan
              </h3>
              <p className="text-xs text-[#848E9C] mt-0.5">
                Rekod muat naik dokumen rasmi sepanjang tahun semasa
              </p>
            </div>
            <span className="text-[11px] font-mono font-semibold text-[#F0B90B] bg-[#F0B90B]/10 px-2.5 py-1 rounded self-start sm:self-auto">
              Tahun {new Date().getFullYear()}
            </span>
          </div>

          <div className="flex-1 flex items-end gap-2 sm:gap-3 h-52 pt-4 pb-1 border-b border-[#2B3139]">
            {stats.byMonthCurrentYear.map((m) => {
              const heightPct = m.count > 0 ? Math.max(14, Math.round((m.count / maxMonthCount) * 100)) : 4;
              return (
                <div key={m.code} className="flex-1 flex flex-col items-center justify-end h-full group min-w-0">
                  <span className="text-[11px] font-mono font-bold text-[#EAECEF] mb-1.5 tabular-nums">
                    {m.count > 0 ? m.count : ''}
                  </span>
                  <div
                    className={`w-full max-w-[32px] rounded-t-md transition-all ${
                      m.count > 0
                        ? 'bg-[#F0B90B] group-hover:bg-[#F8D12F]'
                        : 'bg-[#2B3139]/60'
                    }`}
                    style={{ height: `${heightPct}%` }}
                    title={`${m.label}: ${m.count} dokumen`}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-2 sm:gap-3 pt-2">
            {stats.byMonthCurrentYear.map((m) => (
              <div
                key={m.code}
                className="flex-1 text-center text-[10px] sm:text-[11px] font-medium text-[#848E9C] truncate"
              >
                {m.short}
              </div>
            ))}
          </div>
        </div>

        {/* Pecahan Dokumen Mengikut Kategori */}
        <div className="xl:col-span-5 bg-[#161A1E] rounded-xl border border-[#2B3139] p-5 flex flex-col">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#EAECEF]">
                Dokumen Mengikut Kategori
              </h3>
              <p className="text-xs text-[#848E9C] mt-0.5">
                Klik kategori untuk menyaring senarai dokumen
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateSubmenu('kategori')}
              className="text-xs font-semibold text-[#F0B90B] hover:underline whitespace-nowrap"
            >
              Urus Kategori
            </button>
          </div>

          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {stats.byCategory.map(({ category, count }) => {
              const pct = stats.totalDocs > 0 ? Math.round((count / stats.totalDocs) * 100) : 0;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => onSelectCategoryFilter(category.id)}
                  className="w-full text-left p-2.5 rounded-lg bg-[#0B0E11]/70 hover:bg-[#1E2329] border border-[#2B3139] transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-[#EAECEF] truncate">
                      {category.nama}
                    </span>
                    <span className="font-mono font-bold text-[#F0B90B] shrink-0">
                      {count} dok
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-[#1E2329] rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-[#0ECB81] rounded-full transition-all"
                      style={{ width: `${Math.max(count > 0 ? 6 : 0, pct)}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Senarai Dokumen Terkini & Aktiviti Dokumentasi Terkini */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Senarai Dokumen Terkini */}
        <div className="lg:col-span-7 bg-[#161A1E] rounded-xl border border-[#2B3139] p-5">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#F0B90B]" />
              <h3 className="text-sm font-bold text-[#EAECEF]">
                Senarai Dokumen Terkini
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigateSubmenu('terkini')}
              className="text-xs font-semibold text-[#F0B90B] hover:underline whitespace-nowrap"
            >
              Lihat Semua
            </button>
          </div>

          <div className="divide-y divide-[#2B3139]">
            {recentDocuments.map((doc) => (
              <button
                key={doc.id}
                type="button"
                onClick={() => onViewDocument(doc)}
                className="w-full text-left py-3 first:pt-0 last:pb-0 hover:bg-[#1E2329]/60 px-2 -mx-2 rounded-lg transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-mono font-bold text-[#F0B90B]">
                      {doc.noRujukan}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#1E2329] border border-[#2B3139] text-[#EAECEF]">
                      {doc.jenisFail} · {doc.versiSemasa}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        doc.status === 'Aktif'
                          ? 'bg-[#0ECB81]/15 text-[#0ECB81]'
                          : doc.status === 'Menunggu Pengesahan'
                            ? 'bg-[#38BDF8]/15 text-[#38BDF8]'
                            : doc.status === 'Draf'
                              ? 'bg-[#F0B90B]/15 text-[#F0B90B]'
                              : 'bg-[#2B3139] text-[#848E9C]'
                      }`}
                    >
                      {doc.status}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-[#EAECEF] truncate mt-1">
                    {doc.tajuk}
                  </div>
                  <div className="text-xs text-[#848E9C] mt-0.5 truncate">
                    {getCategoryName(docState.categories, doc.categoryId)} ·{' '}
                    {getFolderName(docState.folders, doc.folderId)}
                  </div>
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <div className="text-xs font-medium text-[#EAECEF]">{doc.pemilik}</div>
                  <div className="text-[11px] font-mono text-[#848E9C] mt-0.5">
                    {doc.tarikhDimuatNaik}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Aktiviti Dokumentasi Terkini */}
        <div className="lg:col-span-5 bg-[#161A1E] rounded-xl border border-[#2B3139] p-5">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#0ECB81]" />
              <h3 className="text-sm font-bold text-[#EAECEF]">
                Aktiviti Dokumentasi Terkini
              </h3>
            </div>
            <span className="text-[11px] text-[#848E9C]">
              {docState.activities.length} rekod
            </span>
          </div>

          <div className="space-y-3">
            {recentActivities.map((act) => (
              <div
                key={act.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-[#0B0E11]/70 border border-[#2B3139]"
              >
                <span
                  className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    act.jenis === 'padam'
                      ? 'bg-[#F6465D]'
                      : act.jenis === 'pengesahan'
                        ? 'bg-[#38BDF8]'
                        : act.jenis === 'versi' || act.jenis === 'muat_naik'
                          ? 'bg-[#F0B90B]'
                          : 'bg-[#0ECB81]'
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-[#EAECEF]">
                    {act.tindakan}
                  </div>
                  <div className="text-xs text-[#F0B90B] font-medium truncate mt-0.5">
                    {act.dokumenTajuk}
                  </div>
                  <div className="text-[11px] text-[#848E9C] mt-1">
                    {act.oleh} · <span className="font-mono">{act.masa}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
