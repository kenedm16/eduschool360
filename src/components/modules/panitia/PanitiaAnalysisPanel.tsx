import React, { useMemo, useState } from 'react';
import {
  FileDown,
  FileSpreadsheet,
  Printer,
  CheckCircle2,
  BarChart2,
  Edit3,
  Save,
  BookOpenCheck,
} from 'lucide-react';
import { ExamRecord, PanitiaItem } from '../../../types/eduschool';
import { formatCurrencyRM, formatShortDate } from '../../../utils/formatters';
import {
  PANITIA_DOC_CATEGORIES,
  PanitiaRoleControl,
  computePanitiaFinanceSummary,
  exportPanitiaAnnualReportToExcel,
  exportPanitiaAnnualReportToPDF,
  exportPanitiaSummaryToCSV,
  getPanitiaCode,
} from '../../../utils/panitiaHelpers';

interface PanitiaAnalysisPanelProps {
  panitia: PanitiaItem;
  examRecords: ExamRecord[];
  roleControl: PanitiaRoleControl;
  onUpdatePanitia: (updated: PanitiaItem) => void;
  onNotify?: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export const PanitiaAnalysisPanel: React.FC<PanitiaAnalysisPanelProps> = ({
  panitia,
  examRecords,
  roleControl,
  onUpdatePanitia,
  onNotify,
}) => {
  const fin = useMemo(() => computePanitiaFinanceSummary(panitia), [panitia]);
  const plans = panitia.perancanganTahunan ?? [];
  const meetings = panitia.mesyuarat ?? [];
  const activities = panitia.aktivitiTerperinci ?? [];
  const docs = panitia.dokumenPanitia ?? [];

  const doneActivities = activities.filter((a) => a.status === 'Selesai').length;
  const pendingActivities = activities.length - doneActivities;
  const donePlans = plans.filter((p) => p.status === 'Selesai').length;
  const activePlans = plans.filter((p) => p.status === 'Dilaksana').length;

  const subjectKey = panitia.nama.replace(/^Panitia\s+/i, '').toLowerCase();
  const relatedExams = examRecords.filter((e) =>
    e.mataPelajaran.toLowerCase().includes(subjectKey)
  );
  const avgPassRate = useMemo(() => {
    if (relatedExams.length === 0) return null;
    const calon = relatedExams.reduce((s, r) => s + r.bilCalon, 0);
    const lulus = relatedExams.reduce((s, r) => s + r.bilLulus, 0);
    return calon > 0 ? ((lulus / calon) * 100).toFixed(1) : '0.0';
  }, [relatedExams]);

  const docCompletenessCount = PANITIA_DOC_CATEGORIES.filter((cat) =>
    docs.some((d) => d.kategori === cat)
  ).length;

  // Skor prestasi keseluruhan panitia (formula demonstrasi telus)
  const overallScore = useMemo(() => {
    const actScore = activities.length > 0 ? (doneActivities / activities.length) * 35 : 15;
    const planScore = plans.length > 0 ? ((donePlans + activePlans * 0.6) / plans.length) * 25 : 10;
    const mtgScore = Math.min(20, meetings.length * 10);
    const docScore = (docCompletenessCount / PANITIA_DOC_CATEGORIES.length) * 20;
    return Math.min(100, Math.round(actScore + planScore + mtgScore + docScore));
  }, [activities.length, doneActivities, plans.length, donePlans, activePlans, meetings.length, docCompletenessCount]);

  // Inline editor untuk bahagian 8 Laporan Tahunan (Rumusan & Cadangan Penambahbaikan)
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [rumusanText, setRumusanText] = useState(panitia.rumusanTahunan || '');
  const [cadanganText, setCadanganText] = useState(panitia.cadanganPenambahbaikan || '');

  const handleSaveConclusion = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdatePanitia({
      ...panitia,
      rumusanTahunan: rumusanText.trim(),
      cadanganPenambahbaikan: cadanganText.trim(),
    });
    setIsEditingSummary(false);
    onNotify?.('success', 'Rumusan Tahunan Disimpan', 'Bahagian 8 laporan tahunan dikemaskini.');
  };

  const handleExportPdf = () => {
    if (!roleControl.canExportReports) {
      onNotify?.('error', 'Akses Terhad', 'Peranan simulasi ini tidak dibenarkan mengeksport laporan.');
      return;
    }
    const fileName = exportPanitiaAnnualReportToPDF(panitia);
    onNotify?.('success', 'Laporan Tahunan PDF Dijana', `Fail ${fileName} dimuat turun.`);
  };

  const handleExportExcel = () => {
    if (!roleControl.canExportReports) {
      onNotify?.('error', 'Akses Terhad', 'Peranan simulasi ini tidak dibenarkan mengeksport laporan.');
      return;
    }
    const fileName = exportPanitiaAnnualReportToExcel(panitia);
    onNotify?.('success', 'Laporan Tahunan Excel Dijana', `Fail ${fileName} dimuat turun.`);
  };

  const handleExportCsv = () => {
    if (!roleControl.canExportReports) return;
    const fileName = exportPanitiaSummaryToCSV(panitia);
    onNotify?.('success', 'Ringkasan CSV Dijana', `Fail ${fileName} dimuat turun.`);
  };

  return (
    <div className="space-y-6">
      {/* Bar Tindakan Eksport Laporan Tahunan */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-4 rounded-xl bg-[#0B0E11] border border-[#2B3139] print:hidden">
        <div>
          <h3 className="text-sm font-bold text-[#EAECEF] flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-[#F0B90B]" />
            Analisis Prestasi & Laporan Tahunan Panitia (8 Bahagian)
          </h3>
          <p className="text-xs text-[#848E9C] mt-0.5">
            Analisis pelaksanaan aktiviti, mesyuarat, kewangan PCG, dokumentasi dan eksport laporan rasmi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={!roleControl.canExportReports}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-[#0B0E11] bg-[#F0B90B] rounded-lg hover:bg-[#F8D12F] disabled:opacity-40"
          >
            <FileDown className="w-3.5 h-3.5" />
            Eksport PDF
          </button>
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={!roleControl.canExportReports}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-[#0B0E11] bg-[#0ECB81] rounded-lg hover:bg-[#19D98F] disabled:opacity-40"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Eksport Excel (.xlsx)
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={!roleControl.canExportReports}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#EAECEF] bg-[#161A1E] border border-[#2B3139] rounded-lg hover:border-[#F0B90B] disabled:opacity-40"
          >
            <FileDown className="w-3.5 h-3.5 text-[#F0B90B]" />
            Eksport CSV
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#EAECEF] bg-[#161A1E] border border-[#2B3139] rounded-lg hover:border-[#F0B90B]"
          >
            <Printer className="w-3.5 h-3.5 text-[#F0B90B]" />
            Cetak
          </button>
        </div>
      </div>

      {/* 5 Kad Analisis Dinamik */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-xl bg-[#0B0E11] border border-[#2B3139]">
          <div className="text-[11px] text-[#848E9C]">Prestasi Keseluruhan</div>
          <div className="text-2xl font-extrabold text-[#F0B90B] font-mono tabular-nums mt-1">
            {overallScore}%
          </div>
          <div className="text-[11px] text-[#0ECB81] mt-1">
            {overallScore >= 75 ? 'Sangat Cemerlang' : overallScore >= 50 ? 'Memuaskan' : 'Perlu Tindakan'}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0B0E11] border border-[#2B3139]">
          <div className="text-[11px] text-[#848E9C]">Aktiviti Dilaksana vs Belum</div>
          <div className="text-xl font-extrabold text-[#EAECEF] font-mono tabular-nums mt-1">
            <span className="text-[#0ECB81]">{doneActivities}</span> / {activities.length}
          </div>
          <div className="text-[11px] text-[#848E9C] mt-1">
            {pendingActivities} aktiviti belum selesai
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0B0E11] border border-[#2B3139]">
          <div className="text-[11px] text-[#848E9C]">Status Mesyuarat</div>
          <div className="text-xl font-extrabold text-[#EAECEF] font-mono tabular-nums mt-1">
            {meetings.length} Kali
          </div>
          <div className="text-[11px] text-[#0ECB81] mt-1">
            {meetings.length >= 2 ? 'Mematuhi takwim berkala' : 'Perlu mesyuarat susulan'}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0B0E11] border border-[#2B3139]">
          <div className="text-[11px] text-[#848E9C]">Penggunaan Kewangan</div>
          <div className="text-xl font-extrabold text-[#F0B90B] font-mono tabular-nums mt-1">
            {fin.peratusPenggunaan}%
          </div>
          <div className="text-[11px] text-[#848E9C] mt-1 truncate">
            Baki: {formatCurrencyRM(fin.baki)}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0B0E11] border border-[#2B3139]">
          <div className="text-[11px] text-[#848E9C]">Status Dokumentasi</div>
          <div className="text-xl font-extrabold text-[#EAECEF] font-mono tabular-nums mt-1">
            {docs.length} Fail
          </div>
          <div className="text-[11px] text-[#848E9C] mt-1">
            {docCompletenessCount}/{PANITIA_DOC_CATEGORIES.length} kategori terisi
          </div>
        </div>
      </div>

      {/* Ringkasan Akademik Berkaitan (jika ada dalam rekod peperiksaan) */}
      {avgPassRate !== null && (
        <div className="p-4 rounded-xl bg-[#0B0E11] border border-[#2B3139] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 text-xs">
            <BookOpenCheck className="w-4 h-4 text-[#0ECB81]" />
            <span className="text-[#EAECEF]">
              Purata Kelulusan Peperiksaan Berkaitan ({relatedExams.length} rekod peperiksaan):{' '}
              <strong className="text-[#0ECB81]">{avgPassRate}%</strong>
            </span>
          </div>
          <span className="text-[11px] text-[#848E9C]">Disegerakkan daripada Modul Analisis Akademik</span>
        </div>
      )}

      {/* Pratonton Laporan Tahunan Panitia Bersepadu (8 Bahagian Lengkap) */}
      <div className="rounded-xl border border-[#2B3139] bg-[#0B0E11] overflow-hidden">
        <div className="px-5 py-4 bg-[#1E2329] border-b border-[#2B3139] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-xs font-bold text-[#F0B90B]">
              PRATONTON LAPORAN TAHUNAN PANITIA BERSEPADU
            </div>
            <div className="text-sm font-extrabold text-white">
              {panitia.nama} ({getPanitiaCode(panitia)}) · Sesi {panitia.tahunSemasa || '2026'}
            </div>
          </div>
          <span className="text-[10px] font-semibold px-2.5 py-1 rounded bg-[#0ECB81]/15 text-[#0ECB81] self-start sm:self-auto">
            8 Bahagian Lengkap
          </span>
        </div>

        <div className="p-5 space-y-5 text-xs">
          {/* 1. Profil Panitia & 2. Senarai Ahli */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-[#161A1E] border border-[#2B3139] space-y-1.5">
              <div className="font-bold text-[#F0B90B]">1. Profil Panitia</div>
              <div><strong>Kod:</strong> {getPanitiaCode(panitia)} · <strong>Bidang:</strong> {panitia.bidang}</div>
              <div><strong>Ketua Panitia:</strong> {panitia.ketuaPanitia}</div>
              <div><strong>Setiausaha:</strong> {panitia.setiausaha || '-'}</div>
              <div><strong>Status:</strong> {panitia.statusAktif || 'Aktif'} · <strong>Ditubuhkan:</strong> {formatShortDate(panitia.tarikhPenubuhan || '2016-01-05')}</div>
            </div>

            <div className="p-4 rounded-lg bg-[#161A1E] border border-[#2B3139] space-y-1.5">
              <div className="font-bold text-[#F0B90B]">2. Senarai Ahli ({panitia.ahli.length} orang)</div>
              <ul className="space-y-1 text-[#EAECEF]">
                {panitia.ahli.map((m, idx) => (
                  <li key={`${m}-${idx}`} className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-[#0ECB81] shrink-0" />
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 3. Perancangan Tahunan & 4. Rekod Mesyuarat */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-[#161A1E] border border-[#2B3139] space-y-2">
              <div className="font-bold text-[#F0B90B]">
                3. Perancangan Tahunan ({plans.length} pelan)
              </div>
              <p className="text-[11px] text-[#848E9C]">{panitia.objektifPanitia}</p>
              <div className="space-y-1">
                {plans.map((p) => (
                  <div key={p.id} className="flex justify-between gap-2 text-[11px] border-t border-[#2B3139] pt-1">
                    <span className="text-[#EAECEF] truncate">{p.aktiviti}</span>
                    <span className="text-[#0ECB81] shrink-0">{p.status}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-[#161A1E] border border-[#2B3139] space-y-2">
              <div className="font-bold text-[#F0B90B]">
                4. Rekod Mesyuarat ({meetings.length} mesyuarat)
              </div>
              <div className="space-y-1.5">
                {meetings.map((m) => (
                  <div key={m.id} className="text-[11px] border-t border-[#2B3139] pt-1">
                    <div className="font-semibold text-[#EAECEF]">
                      {m.bilangan}: {m.tajuk}
                    </div>
                    <div className="text-[#848E9C]">
                      {formatShortDate(m.tarikh)} · {m.kehadiran.length} hadir · {m.keputusan}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 5. Rekod Aktiviti & 6. Rekod Kewangan */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-[#161A1E] border border-[#2B3139] space-y-2">
              <div className="font-bold text-[#F0B90B]">
                5. Rekod Aktiviti ({activities.length} program)
              </div>
              <div className="space-y-1">
                {activities.map((a) => (
                  <div key={a.id} className="flex justify-between gap-2 text-[11px] border-t border-[#2B3139] pt-1">
                    <span className="text-[#EAECEF] truncate">{a.nama}</span>
                    <span className="text-[#F0B90B] shrink-0">{a.status}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-[#161A1E] border border-[#2B3139] space-y-2">
              <div className="font-bold text-[#F0B90B]">6. Rekod Kewangan PCG</div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded bg-[#0B0E11]">
                  <div className="text-[10px] text-[#848E9C]">Peruntukan</div>
                  <div className="font-mono font-bold text-[#EAECEF]">{formatCurrencyRM(fin.peruntukan)}</div>
                </div>
                <div className="p-2 rounded bg-[#0B0E11]">
                  <div className="text-[10px] text-[#848E9C]">Belanja</div>
                  <div className="font-mono font-bold text-[#F6465D]">{formatCurrencyRM(fin.perbelanjaan)}</div>
                </div>
                <div className="p-2 rounded bg-[#0B0E11]">
                  <div className="text-[10px] text-[#848E9C]">Baki</div>
                  <div className="font-mono font-bold text-[#0ECB81]">{formatCurrencyRM(fin.baki)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* 7. Analisis dan Pencapaian & 8. Rumusan dan Cadangan Penambahbaikan */}
          <div className="p-4 rounded-lg bg-[#161A1E] border border-[#2B3139] space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="font-bold text-[#F0B90B]">
                7. Analisis Pencapaian & 8. Rumusan / Cadangan Penambahbaikan
              </div>
              {roleControl.canManageSubRecords && !isEditingSummary && (
                <button
                  type="button"
                  onClick={() => {
                    setRumusanText(panitia.rumusanTahunan || '');
                    setCadanganText(panitia.cadanganPenambahbaikan || '');
                    setIsEditingSummary(true);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#F0B90B] hover:text-[#F8D12F] print:hidden"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Kemaskini Rumusan
                </button>
              )}
            </div>

            <div className="p-3 rounded-lg bg-[#0B0E11] border border-[#2B3139] text-[#EAECEF]">
              <strong>7. Analisis Pencapaian:</strong> Sebanyak {doneActivities} daripada {activities.length} aktiviti telah selesai, {meetings.length} mesyuarat berjaya dilaksanakan, kadar penggunaan PCG adalah {fin.peratusPenggunaan}%, dan skor prestasi keseluruhan panitia ialah {overallScore}%.
            </div>

            {isEditingSummary ? (
              <form onSubmit={handleSaveConclusion} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#848E9C] mb-1">
                    Rumusan Tahunan
                  </label>
                  <textarea
                    rows={2}
                    value={rumusanText}
                    onChange={(e) => setRumusanText(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#848E9C] mb-1">
                    Cadangan Penambahbaikan
                  </label>
                  <textarea
                    rows={2}
                    value={cadanganText}
                    onChange={(e) => setCadanganText(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingSummary(false)}
                    className="px-3 py-1.5 text-xs bg-[#1E2329] text-[#EAECEF] rounded-lg"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-[#F0B90B] text-[#0B0E11] rounded-lg"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Simpan Rumusan
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-[#0B0E11] border border-[#2B3139]">
                  <div className="text-[11px] font-semibold text-[#848E9C] mb-1">
                    8a. Rumusan Tahunan
                  </div>
                  <p className="text-[#EAECEF] leading-relaxed">{panitia.rumusanTahunan || '-'}</p>
                </div>
                <div className="p-3 rounded-lg bg-[#0B0E11] border border-[#2B3139]">
                  <div className="text-[11px] font-semibold text-[#0ECB81] mb-1">
                    8b. Cadangan Penambahbaikan
                  </div>
                  <p className="text-[#EAECEF] leading-relaxed">
                    {panitia.cadanganPenambahbaikan || '-'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
