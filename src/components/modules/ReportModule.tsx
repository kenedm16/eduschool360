import React, { useState } from 'react';
import {
  FileSpreadsheet,
  FileDown,
  ShieldCheck,
  CheckSquare,
  BarChart3,
  BookOpen,
  Award,
  Users,
  FileText,
  Printer,
} from 'lucide-react';
import { EduSchoolState, UserRole } from '../../types/eduschool';
import { calculateGPMP } from '../../utils/academicCalcHelper';
import { formatCurrencyRM, formatShortDate } from '../../utils/formatters';
import { computeSchoolStats } from '../../utils/reportHelpers';
import {
  exportReportToExcel,
  exportReportToPDF,
  REPORT_SCOPE_LABELS,
  ReportScope,
} from '../../utils/exportReports';
import { getRoleDisplayLabel } from '../../utils/rolePermissions';
import { ModuleHeader } from '../common/ModuleHeader';

interface ReportModuleProps {
  state: EduSchoolState;
  activeRole: UserRole;
  onBackToDashboard: () => void;
  onNotifyExport: (format: 'PDF' | 'Excel', fileName: string) => void;
}

const REPORT_TABS: {
  id: ReportScope;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'eksekutif', label: 'Eksekutif Sekolah', icon: FileText },
  { id: 'tugasan', label: 'Pengurusan Tugasan', icon: CheckSquare },
  { id: 'akademik', label: 'Akademik (GPS/GPMP)', icon: BarChart3 },
  { id: 'panitia', label: 'Panitia & PCG', icon: BookOpen },
  { id: 'program', label: 'Program Sekolah', icon: Award },
  { id: 'murid_aset', label: 'Murid & Aset', icon: Users },
];

export const ReportModule: React.FC<ReportModuleProps> = ({
  state,
  activeRole,
  onBackToDashboard,
  onNotifyExport,
}) => {
  const [activeScope, setActiveScope] = useState<ReportScope>('eksekutif');
  const stats = computeSchoolStats(state);

  const docReports = state.documents.filter(
    (d) => d.kategori === 'Laporan Program' || d.kategori === 'Minit Mesyuarat'
  );
  const programReports = state.programs.filter(
    (p) => p.status === 'Selesai' || p.laporanPelaksanaan.trim().length > 0
  );

  const handleExportPDF = (scope: ReportScope = activeScope) => {
    const fileName = exportReportToPDF(scope, state, activeRole);
    onNotifyExport('PDF', fileName);
  };

  const handleExportExcel = (scope: ReportScope | 'semua' = activeScope) => {
    const fileName = exportReportToExcel(scope, state, activeRole);
    onNotifyExport('Excel', fileName);
  };

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Laporan dan Eksport Data"
        description="Pusat pelaporan bersepadu SMK Salaping untuk semakan pengurusan serta eksport terus ke fail PDF dan Excel (.xlsx)."
        onBackToDashboard={onBackToDashboard}
        actions={
          <>
            <button
              type="button"
              onClick={() => handleExportPDF(activeScope)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-[#F6465D] rounded-lg hover:bg-[#E03B52] transition-colors whitespace-nowrap"
            >
              <Printer className="w-4 h-4" />
              Eksport PDF
            </button>
            <button
              type="button"
              onClick={() => handleExportExcel(activeScope)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-[#0B0E11] bg-[#0ECB81] rounded-lg hover:bg-[#15E092] transition-colors whitespace-nowrap"
            >
              <FileDown className="w-4 h-4" />
              Eksport Excel (.xlsx)
            </button>
            <button
              type="button"
              onClick={() => handleExportExcel('semua')}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-[#0B0E11] bg-[#F0B90B] rounded-lg hover:bg-[#F8D12F] transition-colors whitespace-nowrap"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Eksport Semua Modul (.xlsx)
            </button>
          </>
        }
      />

      {/* Amaran Data Demonstrasi */}
      <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-[#F0B90B]/10 border border-[#F0B90B]/30 text-xs text-[#EAECEF]">
        <ShieldCheck className="w-4 h-4 text-[#F0B90B] shrink-0" />
        <span>
          <strong className="text-[#F0B90B]">Data Demonstrasi:</strong> Semua statistik dan dokumen yang dieksport ke PDF atau Excel menggunakan data simulasi SMK Salaping dan bukan rekod murid atau guru sebenar.
        </span>
      </div>

      {/* Ringkasan Konsistensi Data */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] p-4">
          <div className="text-xs text-[#848E9C]">Jumlah Laporan Berdaftar</div>
          <div className="text-2xl font-extrabold text-[#F0B90B] font-mono tabular-nums mt-1">
            {stats.totalReportsCount}
          </div>
          <div className="text-[11px] text-[#848E9C] mt-0.5 tabular-nums">
            {stats.docReportsCount} minit/laporan + {stats.programReportsCount} laporan program
          </div>
        </div>
        <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] p-4">
          <div className="text-xs text-[#848E9C]">Tugasan Aktif / Keseluruhan</div>
          <div className="text-2xl font-extrabold text-white font-mono tabular-nums mt-1">
            {stats.activeTasksCount} / {stats.totalTasks}
          </div>
          <div className="text-[11px] text-[#0ECB81] mt-0.5 tabular-nums">
            {stats.completedTasksCount} tugasan telah selesai
          </div>
        </div>
        <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] p-4">
          <div className="text-xs text-[#848E9C]">Program Akan Datang / Semua</div>
          <div className="text-2xl font-extrabold text-white font-mono tabular-nums mt-1">
            {stats.upcomingProgramsCount} / {stats.totalPrograms}
          </div>
          <div className="text-[11px] text-[#848E9C] mt-0.5 tabular-nums">
            {stats.completedProgramsCount} program selesai dilaksanakan
          </div>
        </div>
        <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] p-4">
          <div className="text-xs text-[#848E9C]">GPS Akademik & Baki PCG</div>
          <div className="text-2xl font-extrabold text-[#0ECB81] font-mono tabular-nums mt-1">
            {stats.currentGPS.toFixed(2)}
          </div>
          <div className="text-[11px] text-[#F0B90B] mt-0.5 tabular-nums">
            Baki PCG: {formatCurrencyRM(stats.totalPcgBalance)}
          </div>
        </div>
      </div>

      {/* Tab Kategori Laporan */}
      <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] p-2 flex items-center gap-1.5 overflow-x-auto">
        {REPORT_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeScope === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveScope(tab.id)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-[#F0B90B] text-[#0B0E11] font-bold'
                  : 'text-[#848E9C] hover:text-[#EAECEF] hover:bg-[#1E2329]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Pratonton Kandungan Laporan */}
      <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#2B3139] flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#1E2329]/50">
          <div>
            <h2 className="text-base font-bold text-[#EAECEF]">
              Pratonton: {REPORT_SCOPE_LABELS[activeScope]}
            </h2>
            <p className="text-xs text-[#848E9C]">
              Paparan aktif: {getRoleDisplayLabel(activeRole)} · Data dijana secara langsung daripada rekod sistem semasa
            </p>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-1 rounded bg-[#0B0E11] border border-[#2B3139] text-[#F0B90B] self-start sm:self-auto">
            DATA DEMONSTRASI
          </span>
        </div>

        <div className="p-6">
          {activeScope === 'eksekutif' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-bold text-[#EAECEF] mb-3">
                  Dokumen Laporan & Minit Mesyuarat ({docReports.length})
                </h3>
                <div className="divide-y divide-[#2B3139] border border-[#2B3139] rounded-lg">
                  {docReports.map((doc) => (
                    <div key={doc.id} className="p-3.5 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#EAECEF]">{doc.tajuk}</div>
                        <div className="text-[11px] text-[#848E9C] mt-0.5">
                          {doc.kategori} · {doc.penyedia}
                        </div>
                      </div>
                      <span className="text-[11px] font-mono text-[#0ECB81] tabular-nums shrink-0">
                        {formatShortDate(doc.tarikh)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-[#EAECEF] mb-3">
                  Laporan Pelaksanaan Program ({programReports.length})
                </h3>
                <div className="divide-y divide-[#2B3139] border border-[#2B3139] rounded-lg">
                  {programReports.map((prog) => (
                    <div key={prog.id} className="p-3.5 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[#EAECEF]">{prog.nama}</span>
                        <span className="text-[11px] font-semibold text-[#F0B90B] shrink-0">
                          {prog.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#848E9C] line-clamp-2">
                        {prog.laporanPelaksanaan}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeScope === 'tugasan' && (
            <div className="overflow-x-auto border border-[#2B3139] rounded-lg">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#1E2329] border-b border-[#2B3139] text-[#848E9C] font-semibold">
                    <th className="py-3 px-4">Tajuk Tugasan</th>
                    <th className="py-3 px-4">Pegawai</th>
                    <th className="py-3 px-4">Tarikh Akhir</th>
                    <th className="py-3 px-4">Keutamaan</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2B3139]">
                  {state.tasks.map((t) => (
                    <tr key={t.id}>
                      <td className="py-3 px-4 font-semibold text-[#EAECEF]">{t.tajuk}</td>
                      <td className="py-3 px-4 text-[#EAECEF]">{t.pegawai}</td>
                      <td className="py-3 px-4 tabular-nums text-[#848E9C]">
                        {formatShortDate(t.tarikhAkhir)}
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#F0B90B]">{t.keutamaan}</td>
                      <td className="py-3 px-4 font-semibold text-[#0ECB81]">{t.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeScope === 'akademik' && (
            <div className="overflow-x-auto border border-[#2B3139] rounded-lg">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#1E2329] border-b border-[#2B3139] text-[#848E9C] font-semibold">
                    <th className="py-3 px-4">Mata Pelajaran</th>
                    <th className="py-3 px-4">Tingkatan</th>
                    <th className="py-3 px-4 text-right">Calon</th>
                    <th className="py-3 px-4 text-right">Lulus</th>
                    <th className="py-3 px-4 text-right">% Lulus</th>
                    <th className="py-3 px-4 text-right">GPMP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2B3139]">
                  {state.examRecords.map((r) => {
                    const pct = r.bilCalon > 0 ? ((r.bilLulus / r.bilCalon) * 100).toFixed(1) : '0.0';
                    return (
                      <tr key={r.id}>
                        <td className="py-3 px-4 font-semibold text-[#EAECEF]">
                          {r.mataPelajaran} ({r.kodSubjek})
                        </td>
                        <td className="py-3 px-4 text-[#848E9C]">{r.tingkatan}</td>
                        <td className="py-3 px-4 text-right tabular-nums text-[#EAECEF]">{r.bilCalon}</td>
                        <td className="py-3 px-4 text-right tabular-nums text-[#EAECEF]">{r.bilLulus}</td>
                        <td className="py-3 px-4 text-right tabular-nums text-[#0ECB81] font-semibold">
                          {pct}%
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-[#F0B90B] tabular-nums">
                          {calculateGPMP(r.gred).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {activeScope === 'panitia' && (
            <div className="overflow-x-auto border border-[#2B3139] rounded-lg">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#1E2329] border-b border-[#2B3139] text-[#848E9C] font-semibold">
                    <th className="py-3 px-4">Panitia</th>
                    <th className="py-3 px-4">Ketua Panitia</th>
                    <th className="py-3 px-4 text-right">Ahli</th>
                    <th className="py-3 px-4 text-right">Peruntukan</th>
                    <th className="py-3 px-4 text-right">Perbelanjaan</th>
                    <th className="py-3 px-4 text-right">Baki PCG</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2B3139]">
                  {state.panitiaList.map((p) => {
                    const alloc = p.rekodKewangan
                      .filter((k) => k.jenis === 'Peruntukan')
                      .reduce((s, k) => s + k.jumlah, 0);
                    const spent = p.rekodKewangan
                      .filter((k) => k.jenis === 'Perbelanjaan')
                      .reduce((s, k) => s + k.jumlah, 0);
                    return (
                      <tr key={p.id}>
                        <td className="py-3 px-4 font-semibold text-[#EAECEF]">{p.nama}</td>
                        <td className="py-3 px-4 text-[#848E9C]">{p.ketuaPanitia}</td>
                        <td className="py-3 px-4 text-right tabular-nums text-[#EAECEF]">
                          {p.ahli.length}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-[#EAECEF]">
                          {formatCurrencyRM(alloc)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-[#F6465D]">
                          {formatCurrencyRM(spent)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold tabular-nums text-[#0ECB81]">
                          {formatCurrencyRM(alloc - spent)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {activeScope === 'program' && (
            <div className="overflow-x-auto border border-[#2B3139] rounded-lg">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#1E2329] border-b border-[#2B3139] text-[#848E9C] font-semibold">
                    <th className="py-3 px-4">Nama Program</th>
                    <th className="py-3 px-4">Tarikh</th>
                    <th className="py-3 px-4">Penyelaras</th>
                    <th className="py-3 px-4 text-right">Peruntukan (RM)</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2B3139]">
                  {state.programs.map((p) => (
                    <tr key={p.id}>
                      <td className="py-3 px-4 font-semibold text-[#EAECEF]">{p.nama}</td>
                      <td className="py-3 px-4 tabular-nums text-[#848E9C]">
                        {formatShortDate(p.tarikh)}
                      </td>
                      <td className="py-3 px-4 text-[#EAECEF]">{p.penyelaras}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-[#F0B90B] tabular-nums">
                        {formatCurrencyRM(p.anggaranBajet)}
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#0ECB81]">{p.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeScope === 'murid_aset' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-bold text-[#EAECEF] mb-3">
                  Pemantauan Murid (Data Rekaan)
                </h3>
                <div className="overflow-x-auto border border-[#2B3139] rounded-lg">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#1E2329] border-b border-[#2B3139] text-[#848E9C] font-semibold">
                        <th className="py-2.5 px-3">Nama (Simulasi)</th>
                        <th className="py-2.5 px-3">Kelas</th>
                        <th className="py-2.5 px-3 text-right">Hadir</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2B3139]">
                      {state.students.map((s) => (
                        <tr key={s.id}>
                          <td className="py-2.5 px-3 font-semibold text-[#EAECEF]">{s.nama}</td>
                          <td className="py-2.5 px-3 text-[#848E9C]">{s.kelas}</td>
                          <td className="py-2.5 px-3 text-right tabular-nums text-[#EAECEF]">
                            {s.kehadiranPeratus}%
                          </td>
                          <td className="py-2.5 px-3 text-[#F0B90B] font-semibold">
                            {s.statusSusulan}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-[#EAECEF] mb-3">
                  Inventori Aset & Kerosakan ({state.assets.length} aset)
                </h3>
                <div className="overflow-x-auto border border-[#2B3139] rounded-lg">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#1E2329] border-b border-[#2B3139] text-[#848E9C] font-semibold">
                        <th className="py-2.5 px-3">Nama Aset</th>
                        <th className="py-2.5 px-3">Lokasi</th>
                        <th className="py-2.5 px-3 text-right">Unit</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2B3139]">
                      {state.assets.map((a) => (
                        <tr key={a.id}>
                          <td className="py-2.5 px-3 font-semibold text-[#EAECEF]">{a.nama}</td>
                          <td className="py-2.5 px-3 text-[#848E9C]">{a.lokasi}</td>
                          <td className="py-2.5 px-3 text-right tabular-nums text-[#EAECEF]">
                            {a.kuantiti}
                          </td>
                          <td
                            className={`py-2.5 px-3 font-semibold ${
                              a.status === 'Baik'
                                ? 'text-[#0ECB81]'
                                : a.status === 'Rosak'
                                  ? 'text-[#F6465D]'
                                  : 'text-[#F0B90B]'
                            }`}
                          >
                            {a.status}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
