import React, { useMemo } from 'react';
import {
  Activity,
  Download,
  FileBarChart,
  GitBranch,
  Printer,
  Users,
} from 'lucide-react';
import {
  DocCenterDocument,
  DocCenterV15State,
  UserRole,
} from '../../../types/eduschool';
import {
  DocCenterComputedStats,
  exportDocCenterReportToCSV,
  getCategoryName,
} from '../../../utils/docCenterHelpers';
import { getRoleDisplayLabel } from '../../../utils/rolePermissions';

interface DocReportPanelProps {
  docState: DocCenterV15State;
  stats: DocCenterComputedStats;
  activeRole: UserRole;
  onViewDocument: (doc: DocCenterDocument) => void;
  onNotify: (type: 'success' | 'info' | 'error', title: string, message?: string) => void;
}

export const DocReportPanel: React.FC<DocReportPanelProps> = ({
  docState,
  stats,
  activeRole,
  onViewDocument,
  onNotify,
}) => {
  const activityCounts = useMemo(() => {
    const map: Record<string, number> = {
      tambah: 0,
      sunting: 0,
      versi: 0,
      muat_naik: 0,
      folder: 0,
      kategori: 0,
      padam: 0,
    };
    docState.activities.forEach((a) => {
      map[a.jenis] = (map[a.jenis] ?? 0) + 1;
    });
    return map;
  }, [docState.activities]);

  const handleExportCSV = () => {
    const fileName = exportDocCenterReportToCSV(
      docState,
      getRoleDisplayLabel(activeRole)
    );
    onNotify(
      'success',
      'Eksport Laporan Dokumentasi Berjaya',
      `Fail ${fileName} telah dijana dan dimuat turun.`
    );
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Bar Tindakan Laporan */}
      <div className="bg-[#161A1E] p-4 rounded-xl border border-[#2B3139] flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
        <div>
          <h2 className="text-base font-bold text-[#EAECEF] flex items-center gap-2">
            <FileBarChart className="w-4 h-4 text-[#F0B90B]" />
            Laporan Pusat Dokumentasi Digital Sekolah
          </h2>
          <p className="text-xs text-[#848E9C] mt-0.5">
            Semua angka dijana secara dinamik daripada rekod dokumen, kategori, folder dan sejarah versi semasa.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#EAECEF] bg-[#1E2329] border border-[#2B3139] rounded-lg hover:bg-[#2B3139]"
          >
            <Printer className="w-4 h-4 text-[#F0B90B]" />
            Cetak Laporan
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#0B0E11] bg-[#F0B90B] rounded-lg hover:bg-[#F8D12F]"
          >
            <Download className="w-4 h-4" />
            Eksport CSV
          </button>
        </div>
      </div>

      {/* Ringkasan Eksekutif */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] p-4">
          <div className="text-[11px] font-semibold text-[#848E9C]">Jumlah Dokumen</div>
          <div className="text-2xl font-extrabold text-white font-mono mt-1">
            {stats.totalDocs}
          </div>
        </div>
        <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] p-4">
          <div className="text-[11px] font-semibold text-[#0ECB81]">Dokumen Aktif</div>
          <div className="text-2xl font-extrabold text-[#0ECB81] font-mono mt-1">
            {stats.activeCount}
          </div>
        </div>
        <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] p-4">
          <div className="text-[11px] font-semibold text-[#38BDF8]">Menunggu Pengesahan</div>
          <div className="text-2xl font-extrabold text-[#38BDF8] font-mono mt-1">
            {stats.pendingApprovalCount}
          </div>
        </div>
        <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] p-4">
          <div className="text-[11px] font-semibold text-[#F0B90B]">Status Draf</div>
          <div className="text-2xl font-extrabold text-[#F0B90B] font-mono mt-1">
            {stats.draftCount}
          </div>
        </div>
        <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] p-4">
          <div className="text-[11px] font-semibold text-[#848E9C]">Status Arkib</div>
          <div className="text-2xl font-extrabold text-[#EAECEF] font-mono mt-1">
            {stats.archiveCount}
          </div>
        </div>
        <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] p-4">
          <div className="text-[11px] font-semibold text-[#848E9C]">Folder Digital</div>
          <div className="text-2xl font-extrabold text-white font-mono mt-1">
            {stats.totalFolders}
          </div>
        </div>
        <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] p-4">
          <div className="text-[11px] font-semibold text-[#848E9C]">Dikemaskini Versi</div>
          <div className="text-2xl font-extrabold text-[#38BDF8] font-mono mt-1">
            {stats.updatedDocs.length}
          </div>
        </div>
      </div>

      {/* Pecahan Mengikut Kategori, Tahun & Pemilik */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] p-5">
          <h3 className="text-sm font-bold text-[#EAECEF] mb-3">
            Bilangan Dokumen Mengikut Kategori
          </h3>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1 text-xs">
            {stats.byCategory.map(({ category, count }) => (
              <div
                key={category.id}
                className="flex items-center justify-between py-1.5 border-b border-[#2B3139]/60 last:border-0"
              >
                <span className="text-[#EAECEF] truncate pr-2">{category.nama}</span>
                <span className="font-mono font-bold text-[#F0B90B] shrink-0">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] p-5">
          <h3 className="text-sm font-bold text-[#EAECEF] mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#0ECB81]" />
            Dokumen Mengikut Pemilik
          </h3>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1 text-xs">
            {stats.byOwner.map((o) => (
              <div
                key={o.pemilik}
                className="flex items-center justify-between py-1.5 border-b border-[#2B3139]/60 last:border-0"
              >
                <span className="text-[#EAECEF] truncate pr-2">{o.pemilik}</span>
                <span className="font-mono font-bold text-[#0ECB81] shrink-0">
                  {o.count} dok
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] p-5 space-y-5">
          <div>
            <h3 className="text-sm font-bold text-[#EAECEF] mb-3">
              Dokumen Mengikut Tahun
            </h3>
            <div className="space-y-2 text-xs">
              {stats.byYear.map((y) => (
                <div
                  key={y.tahun}
                  className="flex items-center justify-between py-1.5 border-b border-[#2B3139]/60 last:border-0"
                >
                  <span className="font-mono text-[#EAECEF]">Tahun {y.tahun}</span>
                  <span className="font-mono font-bold text-[#38BDF8]">
                    {y.count} dokumen
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-[#2B3139]">
            <h3 className="text-sm font-bold text-[#EAECEF] mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#F0B90B]" />
              Statistik Aktiviti Dokumentasi
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-[#0B0E11] border border-[#2B3139]">
                <div className="text-[#848E9C]">Tambah / Muat Naik</div>
                <div className="text-base font-mono font-bold text-[#0ECB81] mt-0.5">
                  {activityCounts.tambah + activityCounts.muat_naik}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#0B0E11] border border-[#2B3139]">
                <div className="text-[#848E9C]">Versi & Suntingan</div>
                <div className="text-base font-mono font-bold text-[#F0B90B] mt-0.5">
                  {activityCounts.versi + activityCounts.sunting}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#0B0E11] border border-[#2B3139]">
                <div className="text-[#848E9C]">Folder & Kategori</div>
                <div className="text-base font-mono font-bold text-[#38BDF8] mt-0.5">
                  {activityCounts.folder + activityCounts.kategori}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#0B0E11] border border-[#2B3139]">
                <div className="text-[#848E9C]">Pemadaman</div>
                <div className="text-base font-mono font-bold text-[#F6465D] mt-0.5">
                  {activityCounts.padam}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Senarai Dokumen yang Dikemaskini Versi */}
      <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] p-5">
        <div className="flex items-center justify-between gap-2 mb-4">
          <h3 className="text-sm font-bold text-[#EAECEF] flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-[#F0B90B]" />
            Senarai Dokumen yang Dikemaskini ({stats.updatedDocs.length})
          </h3>
          <span className="text-xs text-[#848E9C]">
            Dokumen dengan lebih daripada 1 rekod sejarah versi
          </span>
        </div>

        {stats.updatedDocs.length === 0 ? (
          <p className="text-xs text-[#848E9C]">
            Belum ada dokumen yang mempunyai kemaskini versi tambahan.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[680px]">
              <thead>
                <tr className="border-b border-[#2B3139] text-[11px] font-bold uppercase text-[#848E9C]">
                  <th className="py-2.5 px-3">No. Rujukan</th>
                  <th className="py-2.5 px-3">Tajuk Dokumen</th>
                  <th className="py-2.5 px-3">Kategori</th>
                  <th className="py-2.5 px-3">Versi Semasa</th>
                  <th className="py-2.5 px-3">Bil. Versi</th>
                  <th className="py-2.5 px-3">Tarikh Kemaskini</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2B3139] text-xs">
                {stats.updatedDocs.map((doc) => {
                  const latest = doc.versions[doc.versions.length - 1];
                  return (
                    <tr
                      key={doc.id}
                      onClick={() => onViewDocument(doc)}
                      className="hover:bg-[#1E2329]/60 cursor-pointer"
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-[#F0B90B]">
                        {doc.noRujukan}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-[#EAECEF]">
                        {doc.tajuk}
                      </td>
                      <td className="py-2.5 px-3 text-[#848E9C]">
                        {getCategoryName(docState.categories, doc.categoryId)}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-[#0ECB81]">
                        {doc.versiSemasa}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[#EAECEF]">
                        {doc.versions.length} versi
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[#848E9C]">
                        {latest?.tarikhPerubahan ?? doc.tarikhDimuatNaik}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
