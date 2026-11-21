import React, { useMemo, useState } from 'react';
import {
  FileDown,
  FileSpreadsheet,
  FileText,
  Printer,
} from 'lucide-react';
import {
  AcademicExam,
  AcademicIntervention,
  AcademicScoreRecord,
  AcademicSubject,
  GradeSchemeConfig,
  UserRole,
} from '../../../types/eduschool';
import {
  AcademicReportPayload,
  compareTwoExams,
  computeClassAnalyses,
  computeExamOverview,
  exportAcademicReportToCSV,
  exportAcademicReportToPDF,
} from '../../../utils/academicCalcHelper';
import { formatShortDate } from '../../../utils/formatters';
import { getRoleDisplayLabel } from '../../../utils/rolePermissions';

interface AcademicReportPanelProps {
  exams: AcademicExam[];
  subjects: AcademicSubject[];
  scores: AcademicScoreRecord[];
  gradeSchemes: GradeSchemeConfig[];
  interventions: AcademicIntervention[];
  activeRole: UserRole;
  onNotifyExport: (format: 'PDF' | 'CSV', fileName: string) => void;
}

type ReportScope = 'Sekolah' | 'Tingkatan' | 'Kelas' | 'Mata Pelajaran';

export const AcademicReportPanel: React.FC<AcademicReportPanelProps> = ({
  exams,
  subjects,
  scores,
  gradeSchemes,
  interventions,
  activeRole,
  onNotifyExport,
}) => {
  const [scope, setScope] = useState<ReportScope>('Sekolah');
  const [filterTahun, setFilterTahun] = useState('Semua');
  const [selectedExamId, setSelectedExamId] = useState(exams[0]?.id ?? '');
  const [filterTingkatan, setFilterTingkatan] = useState('Semua');
  const [filterClass, setFilterClass] = useState('Semua');
  const [filterSubjectId, setFilterSubjectId] = useState('Semua');

  const years = useMemo(
    () => Array.from(new Set(exams.map((e) => e.tahun))).sort(),
    [exams]
  );

  const tingkatanOptions = useMemo(
    () => Array.from(new Set(exams.map((e) => e.tingkatan))).sort(),
    [exams]
  );

  const filteredExamChoices = useMemo(() => {
    return exams.filter((ex) => {
      if (filterTahun !== 'Semua' && ex.tahun !== filterTahun) return false;
      if (scope === 'Tingkatan' && filterTingkatan !== 'Semua' && ex.tingkatan !== filterTingkatan) {
        return false;
      }
      return true;
    });
  }, [exams, filterTahun, scope, filterTingkatan]);

  const activeExam = useMemo(
    () =>
      filteredExamChoices.find((e) => e.id === selectedExamId) ??
      filteredExamChoices[0] ??
      exams[0],
    [filteredExamChoices, selectedExamId, exams]
  );

  const classOptions = useMemo(() => {
    if (!activeExam) return [];
    const set = new Set<string>();
    scores
      .filter((s) => s.examId === activeExam.id)
      .forEach((s) => set.add(s.kelas));
    return Array.from(set).sort();
  }, [scores, activeExam]);

  const subjectOptions = useMemo(() => {
    if (!activeExam) return subjects;
    const sameLevel = subjects.filter((s) => s.tingkatan === activeExam.tingkatan);
    return sameLevel.length > 0 ? sameLevel : subjects;
  }, [subjects, activeExam]);

  // Tapis rekod markah berdasarkan skop & pilihan penapis
  const scopedScores = useMemo(() => {
    if (!activeExam) return [];
    return scores.filter((sc) => {
      if (sc.examId !== activeExam.id) return false;
      if (scope === 'Kelas' && filterClass !== 'Semua' && sc.kelas !== filterClass) return false;
      if (
        scope === 'Mata Pelajaran' &&
        filterSubjectId !== 'Semua' &&
        sc.subjectId !== filterSubjectId
      ) {
        return false;
      }
      return true;
    });
  }, [scores, activeExam, scope, filterClass, filterSubjectId]);

  const overview = useMemo(() => {
    if (!activeExam) return null;
    const mergedScores = [
      ...scores.filter((s) => s.examId !== activeExam.id),
      ...scopedScores,
    ];
    return computeExamOverview(activeExam, subjects, mergedScores, gradeSchemes);
  }, [activeExam, subjects, scores, scopedScores, gradeSchemes]);

  const classAnalyses = useMemo(() => {
    if (!activeExam || !overview) return [];
    return computeClassAnalyses(activeExam, scopedScores, overview.scheme);
  }, [activeExam, scopedScores, overview]);

  // Cari peperiksaan terdahulu pada tingkatan sama untuk perbandingan automatik dalam laporan
  const comparison = useMemo(() => {
    if (!activeExam) return null;
    const priorExam = exams
      .filter(
        (e) =>
          e.id !== activeExam.id &&
          e.tingkatan === activeExam.tingkatan &&
          e.tarikh <= activeExam.tarikh
      )
      .sort((a, b) => b.tarikh.localeCompare(a.tarikh))[0];
    if (!priorExam) return null;
    return compareTwoExams(priorExam, activeExam, subjects, scores, gradeSchemes);
  }, [activeExam, exams, subjects, scores, gradeSchemes]);

  const relevantInterventions = useMemo(() => {
    if (scope === 'Mata Pelajaran' && filterSubjectId !== 'Semua') {
      return interventions.filter((i) => i.subjectId === filterSubjectId);
    }
    return interventions;
  }, [interventions, scope, filterSubjectId]);

  const scopeLabel = useMemo(() => {
    if (scope === 'Tingkatan') return `Tingkatan (${filterTingkatan})`;
    if (scope === 'Kelas') return `Kelas (${filterClass})`;
    if (scope === 'Mata Pelajaran') {
      const sub = subjects.find((s) => s.id === filterSubjectId);
      return sub ? `Mata Pelajaran: ${sub.nama}` : 'Semua Mata Pelajaran';
    }
    return 'Keseluruhan Sekolah (SMK Salaping)';
  }, [scope, filterTingkatan, filterClass, filterSubjectId, subjects]);

  if (!activeExam || !overview) {
    return (
      <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] p-8 text-center text-sm text-[#848E9C]">
        Tiada peperiksaan tersedia untuk penjanaan laporan.
      </div>
    );
  }

  const summaryText = `Berdasarkan analisis ${activeExam.nama} (${activeExam.tingkatan}) bagi skop ${scopeLabel}, seramai ${overview.uniqueStudentsCount} murid (${overview.totalCandidates} rekod kertas) telah dinilai dengan kadar lulus ${overview.passRate.toFixed(1)}% dan purata markah ${overview.avgMark.toFixed(1)}%.${
    overview.gps !== null ? ` Nilai GPS sekolah semasa ialah ${overview.gps.toFixed(2)}.` : ''
  } Terdapat ${overview.attentionSubjectsCount} mata pelajaran yang ditandakan memerlukan pemantauan lanjut melalui pelan intervensi guru.`;

  const buildPayload = (): AcademicReportPayload => ({
    scopeLabel,
    exam: activeExam,
    overview,
    classAnalyses,
    comparison,
    interventions: relevantInterventions,
    summaryText,
    activeRole,
    filterSubjectId,
    filterClass,
  });

  const handleExportPdf = () => {
    const file = exportAcademicReportToPDF(buildPayload());
    onNotifyExport('PDF', file);
  };

  const handleExportCsv = () => {
    const file = exportAcademicReportToCSV(buildPayload());
    onNotifyExport('CSV', file);
  };

  return (
    <div className="space-y-6">
      {/* Bar Penapis Laporan & Butang Eksport */}
      <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[#EAECEF] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#F0B90B]" />
              Penjana Laporan Akademik Bersepadu (8 Bahagian Lengkap)
            </h2>
            <p className="text-xs text-[#848E9C]">
              Tapis mengikut sekolah, tingkatan, kelas, mata pelajaran, peperiksaan dan tahun sebelum mengeksport PDF atau CSV
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-[#1E2329] text-[#0ECB81] border border-[#0ECB81]/40 rounded-lg hover:bg-[#0ECB81]/10 whitespace-nowrap"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Eksport CSV
            </button>
            <button
              type="button"
              onClick={handleExportPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-[#F0B90B] text-[#0B0E11] rounded-lg hover:bg-[#F8D12F] whitespace-nowrap"
            >
              <FileDown className="w-4 h-4" />
              Eksport PDF
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-[#1E2329] text-[#EAECEF] border border-[#2B3139] rounded-lg hover:bg-[#2B3139] whitespace-nowrap"
            >
              <Printer className="w-4 h-4" />
              Cetak
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-[#848E9C] mb-1">
              Skop Laporan
            </label>
            <select
              aria-label="Skop Laporan Akademik"
              value={scope}
              onChange={(e) => setScope(e.target.value as ReportScope)}
              className="w-full px-3 py-2 text-xs bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
            >
              <option value="Sekolah">Laporan Sekolah</option>
              <option value="Tingkatan">Laporan Tingkatan</option>
              <option value="Kelas">Laporan Kelas</option>
              <option value="Mata Pelajaran">Laporan Mata Pelajaran</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#848E9C] mb-1">Tahun</label>
            <select
              aria-label="Tahun Laporan"
              value={filterTahun}
              onChange={(e) => setFilterTahun(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
            >
              <option value="Semua">Semua Tahun</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#848E9C] mb-1">
              Peperiksaan
            </label>
            <select
              aria-label="Peperiksaan Laporan"
              value={activeExam.id}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
            >
              {filteredExamChoices.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.nama} ({ex.tingkatan})
                </option>
              ))}
            </select>
          </div>

          {scope === 'Tingkatan' ? (
            <div>
              <label className="block text-[11px] font-semibold text-[#848E9C] mb-1">
                Pilih Tingkatan
              </label>
              <select
                value={filterTingkatan}
                onChange={(e) => setFilterTingkatan(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              >
                <option value="Semua">Semua Tingkatan</option>
                {tingkatanOptions.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          ) : scope === 'Kelas' ? (
            <div>
              <label className="block text-[11px] font-semibold text-[#848E9C] mb-1">
                Pilih Kelas
              </label>
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              >
                <option value="Semua">Semua Kelas</option>
                {classOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          ) : scope === 'Mata Pelajaran' ? (
            <div>
              <label className="block text-[11px] font-semibold text-[#848E9C] mb-1">
                Pilih Mata Pelajaran
              </label>
              <select
                value={filterSubjectId}
                onChange={(e) => setFilterSubjectId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              >
                <option value="Semua">Semua Mata Pelajaran</option>
                {subjectOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nama} ({s.kod})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-end pb-2 text-[11px] text-[#848E9C]">
              Paparan keseluruhan sekolah aktif
            </div>
          )}

          <div className="flex items-end pb-2 text-[11px] text-[#848E9C]">
            Peranan: <strong className="text-[#F0B90B] ml-1">{getRoleDisplayLabel(activeRole)}</strong>
          </div>
        </div>
      </div>

      {/* Pratonton 8 Bahagian Laporan */}
      <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] p-6 space-y-6 text-xs">
        <div className="border-b border-[#2B3139] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-[11px] font-bold text-[#F0B90B] uppercase tracking-wider">
              Pratonton Dokumen Laporan Rasmi · Data Demonstrasi
            </div>
            <h3 className="text-lg font-bold text-white mt-0.5">
              LAPORAN ANALISIS AKADEMIK: {activeExam.nama.toUpperCase()}
            </h3>
            <p className="text-[#848E9C]">
              SMK Salaping, Sabah · Skop: {scopeLabel}
            </p>
          </div>
          <span className="px-3 py-1 rounded-lg bg-[#0B0E11] border border-[#2B3139] text-[#EAECEF] font-semibold">
            {activeExam.kodPeperiksaan} · {formatShortDate(activeExam.tarikh)}
          </span>
        </div>

        {/* Bahagian 1 & 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-[#0B0E11] border border-[#2B3139] space-y-1.5">
            <div className="font-bold text-[#F0B90B]">1. Maklumat Peperiksaan</div>
            <div>Nama: <strong className="text-[#EAECEF]">{activeExam.nama}</strong></div>
            <div>Jenis & Tahun: {activeExam.jenis} · {activeExam.tahun} ({activeExam.tingkatan})</div>
            <div>Skema Gred: {overview.scheme.nama}</div>
          </div>
          <div className="p-4 rounded-lg bg-[#0B0E11] border border-[#2B3139] space-y-1.5">
            <div className="font-bold text-[#0ECB81]">2. Ringkasan Pencapaian</div>
            <div>Calon Dinilai: <strong className="text-[#EAECEF]">{overview.uniqueStudentsCount} murid ({overview.totalCandidates} rekod kertas)</strong></div>
            <div>Peratus Lulus & Purata: <strong className="text-[#0ECB81]">{overview.passRate}%</strong> · Purata {overview.avgMark}%</div>
            <div>GPS Sekolah: <strong className="text-[#F0B90B]">{overview.gps !== null ? overview.gps.toFixed(2) : 'Tiada (skema tanpa GPS)'}</strong></div>
          </div>
        </div>

        {/* Bahagian 3 */}
        <div className="space-y-2">
          <div className="font-bold text-[#EAECEF]">3. Analisis Taburan Gred</div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 text-center">
            {(
              [
                ['Gred A', overview.buckets.A, 'text-[#0ECB81]'],
                ['Gred B', overview.buckets.B, 'text-[#38BDF8]'],
                ['Gred C', overview.buckets.C, 'text-[#F0B90B]'],
                ['Gred D', overview.buckets.D, 'text-[#EAECEF]'],
                ['Gred E', overview.buckets.E, 'text-[#FB923C]'],
                ['Gagal', overview.buckets.Gagal, 'text-[#F6465D]'],
              ] as const
            ).map(([lbl, val, cls]) => (
              <div key={lbl} className="p-2.5 rounded-lg bg-[#0B0E11] border border-[#2B3139]">
                <div className="text-[11px] text-[#848E9C]">{lbl}</div>
                <div className={`text-lg font-extrabold font-mono tabular-nums ${cls}`}>{val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bahagian 4 & 5 */}
        <div className="space-y-2">
          <div className="font-bold text-[#EAECEF]">
            4 & 5. Analisis GPS, GPMP & Pencapaian Mata Pelajaran
          </div>
          <div className="overflow-x-auto border border-[#2B3139] rounded-lg">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#1E2329] border-b border-[#2B3139] text-[#848E9C]">
                  <th className="py-2 px-3">Kod & Mata Pelajaran</th>
                  <th className="py-2 px-3 text-right">Calon</th>
                  <th className="py-2 px-3 text-right">Lulus</th>
                  <th className="py-2 px-3 text-right">Gagal</th>
                  <th className="py-2 px-3 text-right">% Lulus</th>
                  <th className="py-2 px-3 text-right">Purata</th>
                  <th className="py-2 px-3 text-right">GPMP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2B3139]">
                {overview.subjectAnalyses
                  .filter((s) => s.totalCandidates > 0)
                  .map((s) => (
                    <tr key={s.subject.id}>
                      <td className="py-2 px-3 font-semibold text-[#EAECEF]">
                        {s.subject.kod} · {s.subject.nama}
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums">{s.totalCandidates}</td>
                      <td className="py-2 px-3 text-right tabular-nums text-[#0ECB81]">
                        {s.passCount}
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums text-[#F6465D]">
                        {s.failCount}
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums font-bold">
                        {s.passRate}%
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums">{s.avgMark}%</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-[#F0B90B]">
                        {s.gpmp !== null ? s.gpmp.toFixed(2) : '-'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bahagian 6 */}
        <div className="space-y-2">
          <div className="font-bold text-[#EAECEF]">6. Perbandingan Peperiksaan</div>
          {comparison && comparison.compatible ? (
            <div className="p-3.5 rounded-lg bg-[#0B0E11] border border-[#2B3139] space-y-1">
              <div className="text-[#EAECEF]">
                Berbanding <strong className="text-[#F0B90B]">{comparison.baseExam.nama}</strong>:
                Peratus lulus berubah{' '}
                <strong className={comparison.passRateDelta >= 0 ? 'text-[#0ECB81]' : 'text-[#F6465D]'}>
                  {comparison.passRateDelta > 0 ? '+' : ''}
                  {comparison.passRateDelta}%
                </strong>
                {comparison.gpsDelta !== null && (
                  <>
                    {' '}
                    dan GPS berubah{' '}
                    <strong className={comparison.gpsDelta <= 0 ? 'text-[#0ECB81]' : 'text-[#F6465D]'}>
                      {comparison.gpsDelta > 0 ? '+' : ''}
                      {comparison.gpsDelta.toFixed(2)}
                    </strong>
                  </>
                )}
                .
              </div>
              <div className="text-[#848E9C]">
                Meningkat: {comparison.improvingSubjects.map((x) => x.nama).join(', ') || 'Tiada'} · Menurun:{' '}
                {comparison.decliningSubjects.map((x) => x.nama).join(', ') || 'Tiada'}
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-lg bg-[#0B0E11] border border-[#2B3139] text-[#848E9C]">
              Tiada peperiksaan terdahulu yang sepadan pada tingkatan ini untuk perbandingan automatik.
            </div>
          )}
        </div>

        {/* Bahagian 7 */}
        <div className="space-y-2">
          <div className="font-bold text-[#EAECEF]">
            7. Cadangan & Pelan Intervensi Akademik ({relevantInterventions.length})
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {relevantInterventions.map((i) => (
              <div key={i.id} className="p-3 rounded-lg bg-[#0B0E11] border border-[#2B3139]">
                <div className="font-bold text-[#EAECEF]">
                  {i.mataPelajaran} <span className="text-[#F0B90B]">({i.status})</span>
                </div>
                <div className="text-[#848E9C] mt-0.5">{i.strategiTindakan}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bahagian 8 */}
        <div className="p-4 rounded-lg bg-[#0B0E11] border border-[#F0B90B]/30 space-y-1">
          <div className="font-bold text-[#F0B90B]">8. Rumusan Eksekutif</div>
          <p className="text-[#EAECEF] leading-relaxed">{summaryText}</p>
        </div>
      </div>
    </div>
  );
};
