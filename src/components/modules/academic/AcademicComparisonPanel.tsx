import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  GitCompare,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import {
  AcademicExam,
  AcademicScoreRecord,
  AcademicSubject,
  GradeSchemeConfig,
} from '../../../types/eduschool';
import {
  compareTwoExams,
  computeExamOverview,
} from '../../../utils/academicCalcHelper';

interface AcademicComparisonPanelProps {
  exams: AcademicExam[];
  subjects: AcademicSubject[];
  scores: AcademicScoreRecord[];
  gradeSchemes: GradeSchemeConfig[];
}

export const AcademicComparisonPanel: React.FC<AcademicComparisonPanelProps> = ({
  exams,
  subjects,
  scores,
  gradeSchemes,
}) => {
  const [baseExamId, setBaseExamId] = useState<string>(exams[1]?.id ?? exams[0]?.id ?? '');
  const [targetExamId, setTargetExamId] = useState<string>(exams[0]?.id ?? '');
  const [selectedCompareIds, setSelectedCompareIds] = useState<string[]>(() =>
    exams.map((e) => e.id)
  );

  const baseExam = useMemo(
    () => exams.find((e) => e.id === baseExamId) ?? exams[0],
    [exams, baseExamId]
  );
  const targetExam = useMemo(
    () => exams.find((e) => e.id === targetExamId) ?? exams[0],
    [exams, targetExamId]
  );

  const comparison = useMemo(() => {
    if (!baseExam || !targetExam || baseExam.id === targetExam.id) return null;
    return compareTwoExams(baseExam, targetExam, subjects, scores, gradeSchemes);
  }, [baseExam, targetExam, subjects, scores, gradeSchemes]);

  const multiExamOverviews = useMemo(() => {
    return exams
      .filter((e) => selectedCompareIds.includes(e.id))
      .sort((a, b) => a.tarikh.localeCompare(b.tarikh))
      .map((ex) => computeExamOverview(ex, subjects, scores, gradeSchemes));
  }, [exams, selectedCompareIds, subjects, scores, gradeSchemes]);

  const toggleExamInMulti = (id: string) => {
    setSelectedCompareIds((prev) =>
      prev.includes(id)
        ? prev.length > 2
          ? prev.filter((x) => x !== id)
          : prev
        : [...prev, id]
    );
  };

  if (exams.length < 2) {
    return (
      <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] p-8 text-center text-sm text-[#848E9C]">
        Sekurang-kurangnya dua peperiksaan diperlukan untuk menjalankan analisis perbandingan.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pemilih Peperiksaan Asas vs Terkini */}
      <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] p-5 space-y-4">
        <div>
          <h2 className="text-base font-bold text-[#EAECEF] flex items-center gap-2">
            <GitCompare className="w-4 h-4 text-[#F0B90B]" />
            Perbandingan Antara Peperiksaan
          </h2>
          <p className="text-xs text-[#848E9C]">
            Pilih dua atau lebih peperiksaan untuk membandingkan perubahan GPS, GPMP, peratus lulus dan taburan gred
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-end">
          <div className="md:col-span-5">
            <label className="block text-[11px] font-semibold text-[#848E9C] mb-1">
              Peperiksaan Garis Asas (Awal)
            </label>
            <select
              aria-label="Peperiksaan Garis Asas"
              value={baseExam?.id ?? ''}
              onChange={(e) => setBaseExamId(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
            >
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.nama} ({ex.tingkatan} · {ex.tahun})
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-1 flex items-center justify-center pb-2 text-[#F0B90B]">
            <ArrowRight className="w-4 h-4" />
          </div>

          <div className="md:col-span-5">
            <label className="block text-[11px] font-semibold text-[#848E9C] mb-1">
              Peperiksaan Perbandingan (Terkini)
            </label>
            <select
              aria-label="Peperiksaan Perbandingan Terkini"
              value={targetExam?.id ?? ''}
              onChange={(e) => setTargetExamId(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
            >
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.nama} ({ex.tingkatan} · {ex.tahun})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {baseExam?.id === targetExam?.id ? (
        <div className="p-4 rounded-xl bg-[#F0B90B]/10 border border-[#F0B90B]/30 text-xs text-[#F0B90B]">
          Sila pilih dua peperiksaan yang berbeza untuk memaparkan delta perubahan prestasi.
        </div>
      ) : comparison && !comparison.compatible ? (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-[#F6465D]/10 border border-[#F6465D]/30 text-xs text-[#F6465D]">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">Perbandingan Tidak Sepadan</div>
            <p className="mt-0.5 text-[#EAECEF]">{comparison.reason}</p>
          </div>
        </div>
      ) : comparison ? (
        <>
          {comparison.reason && (
            <div className="p-3.5 rounded-xl bg-[#F0B90B]/10 border border-[#F0B90B]/30 text-xs text-[#F0B90B]">
              {comparison.reason}
            </div>
          )}

          {/* Kad Delta Utama */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] p-4">
              <div className="text-xs text-[#848E9C] font-semibold">Perubahan GPS Sekolah</div>
              <div
                className={`text-2xl font-extrabold font-mono tabular-nums mt-1.5 ${
                  comparison.gpsDelta !== null && comparison.gpsDelta <= 0
                    ? 'text-[#0ECB81]'
                    : 'text-[#F6465D]'
                }`}
              >
                {comparison.gpsDelta !== null
                  ? `${comparison.gpsDelta > 0 ? '+' : ''}${comparison.gpsDelta.toFixed(2)}`
                  : 'Skema Berbeza'}
              </div>
              <div className="text-[11px] text-[#848E9C] mt-1">
                {comparison.baseOverview.gps?.toFixed(2) ?? '-'} →{' '}
                {comparison.targetOverview.gps?.toFixed(2) ?? '-'} (negatif = lebih baik)
              </div>
            </div>

            <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] p-4">
              <div className="text-xs text-[#848E9C] font-semibold">Perubahan Peratus Lulus</div>
              <div
                className={`text-2xl font-extrabold font-mono tabular-nums mt-1.5 ${
                  comparison.passRateDelta >= 0 ? 'text-[#0ECB81]' : 'text-[#F6465D]'
                }`}
              >
                {comparison.passRateDelta > 0 ? '+' : ''}
                {comparison.passRateDelta.toFixed(1)}%
              </div>
              <div className="text-[11px] text-[#848E9C] mt-1">
                {comparison.baseOverview.passRate.toFixed(1)}% →{' '}
                {comparison.targetOverview.passRate.toFixed(1)}%
              </div>
            </div>

            <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] p-4">
              <div className="text-xs text-[#848E9C] font-semibold">Perubahan Purata Markah</div>
              <div
                className={`text-2xl font-extrabold font-mono tabular-nums mt-1.5 ${
                  comparison.avgMarkDelta >= 0 ? 'text-[#0ECB81]' : 'text-[#F6465D]'
                }`}
              >
                {comparison.avgMarkDelta > 0 ? '+' : ''}
                {comparison.avgMarkDelta.toFixed(1)}%
              </div>
              <div className="text-[11px] text-[#848E9C] mt-1">
                {comparison.baseOverview.avgMark.toFixed(1)}% →{' '}
                {comparison.targetOverview.avgMark.toFixed(1)}%
              </div>
            </div>

            <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] p-4">
              <div className="text-xs text-[#848E9C] font-semibold">Perubahan Gred A & Gagal</div>
              <div className="text-sm font-bold text-[#EAECEF] mt-2 space-y-1 font-mono tabular-nums">
                <div className="text-[#0ECB81]">
                  Gred A: {comparison.bucketDeltas.A > 0 ? '+' : ''}
                  {comparison.bucketDeltas.A} kertas
                </div>
                <div
                  className={
                    comparison.bucketDeltas.Gagal <= 0 ? 'text-[#0ECB81]' : 'text-[#F6465D]'
                  }
                >
                  Gagal: {comparison.bucketDeltas.Gagal > 0 ? '+' : ''}
                  {comparison.bucketDeltas.Gagal} kertas
                </div>
              </div>
            </div>
          </div>

          {/* Mata Pelajaran Meningkat vs Menurun */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#161A1E] rounded-xl border border-[#0ECB81]/30 p-5 space-y-3">
              <h3 className="text-sm font-bold text-[#0ECB81] flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Mata Pelajaran Yang Meningkat ({comparison.improvingSubjects.length})
              </h3>
              {comparison.improvingSubjects.length === 0 ? (
                <p className="text-xs text-[#848E9C]">
                  Tiada mata pelajaran menunjukkan peningkatan ketara dalam perbandingan ini.
                </p>
              ) : (
                <div className="space-y-2">
                  {comparison.improvingSubjects.map((s) => (
                    <div
                      key={s.subjectId}
                      className="flex items-center justify-between p-3 rounded-lg bg-[#0B0E11] border border-[#2B3139] text-xs"
                    >
                      <div>
                        <div className="font-bold text-[#EAECEF]">{s.nama}</div>
                        <div className="text-[11px] text-[#848E9C]">
                          Purata {s.baseAvgMark}% → {s.targetAvgMark}%
                        </div>
                      </div>
                      <div className="text-right font-mono tabular-nums">
                        <div className="text-[#0ECB81] font-bold">
                          +{s.avgMarkDelta.toFixed(1)} markah
                        </div>
                        {s.gpmpDelta !== null && (
                          <div className="text-[11px] text-[#F0B90B]">
                            GPMP {s.gpmpDelta.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-[#161A1E] rounded-xl border border-[#F6465D]/30 p-5 space-y-3">
              <h3 className="text-sm font-bold text-[#F6465D] flex items-center gap-2">
                <TrendingDown className="w-4 h-4" />
                Mata Pelajaran Yang Menurun ({comparison.decliningSubjects.length})
              </h3>
              {comparison.decliningSubjects.length === 0 ? (
                <p className="text-xs text-[#848E9C]">
                  Tiada mata pelajaran mengalami penurunan prestasi dalam perbandingan ini.
                </p>
              ) : (
                <div className="space-y-2">
                  {comparison.decliningSubjects.map((s) => (
                    <div
                      key={s.subjectId}
                      className="flex items-center justify-between p-3 rounded-lg bg-[#0B0E11] border border-[#2B3139] text-xs"
                    >
                      <div>
                        <div className="font-bold text-[#EAECEF]">{s.nama}</div>
                        <div className="text-[11px] text-[#848E9C]">
                          Purata {s.baseAvgMark}% → {s.targetAvgMark}%
                        </div>
                      </div>
                      <div className="text-right font-mono tabular-nums">
                        <div className="text-[#F6465D] font-bold">
                          {s.avgMarkDelta.toFixed(1)} markah
                        </div>
                        {s.gpmpDelta !== null && (
                          <div className="text-[11px] text-[#F0B90B]">
                            GPMP +{s.gpmpDelta.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Jadual Terperinci Perbandingan Subjek */}
          <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#2B3139]">
              <h3 className="text-sm font-bold text-[#EAECEF]">
                Jadual Perbandingan Terperinci Mengikut Mata Pelajaran
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#1E2329] border-b border-[#2B3139] text-[#848E9C]">
                    <th className="py-3 px-4">Mata Pelajaran</th>
                    <th className="py-3 px-3 text-right">% Lulus Awal</th>
                    <th className="py-3 px-3 text-right">% Lulus Terkini</th>
                    <th className="py-3 px-3 text-right">Beza % Lulus</th>
                    <th className="py-3 px-3 text-right">GPMP Awal</th>
                    <th className="py-3 px-3 text-right">GPMP Terkini</th>
                    <th className="py-3 px-3 text-right">Beza GPMP</th>
                    <th className="py-3 px-4 text-right">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2B3139]">
                  {comparison.matchedSubjects.map((m) => (
                    <tr key={m.subjectId} className="hover:bg-[#1E2329]/50">
                      <td className="py-3 px-4 font-bold text-[#EAECEF]">
                        {m.nama} <span className="text-[#848E9C] font-normal">({m.kod})</span>
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums text-[#848E9C]">
                        {m.basePassRate.toFixed(1)}%
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums text-white font-semibold">
                        {m.targetPassRate.toFixed(1)}%
                      </td>
                      <td
                        className={`py-3 px-3 text-right tabular-nums font-bold ${
                          m.passRateDelta >= 0 ? 'text-[#0ECB81]' : 'text-[#F6465D]'
                        }`}
                      >
                        {m.passRateDelta > 0 ? '+' : ''}
                        {m.passRateDelta.toFixed(1)}%
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-[#848E9C]">
                        {m.baseGpmp !== null ? m.baseGpmp.toFixed(2) : '-'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-[#F0B90B] font-bold">
                        {m.targetGpmp !== null ? m.targetGpmp.toFixed(2) : '-'}
                      </td>
                      <td
                        className={`py-3 px-3 text-right font-mono tabular-nums font-bold ${
                          m.gpmpDelta !== null && m.gpmpDelta <= 0
                            ? 'text-[#0ECB81]'
                            : 'text-[#F6465D]'
                        }`}
                      >
                        {m.gpmpDelta !== null
                          ? `${m.gpmpDelta > 0 ? '+' : ''}${m.gpmpDelta.toFixed(2)}`
                          : '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            m.trend === 'meningkat'
                              ? 'bg-[#0ECB81]/15 text-[#0ECB81]'
                              : m.trend === 'menurun'
                                ? 'bg-[#F6465D]/15 text-[#F6465D]'
                                : 'bg-[#1E2329] text-[#848E9C]'
                          }`}
                        >
                          {m.trend === 'meningkat'
                            ? 'Meningkat'
                            : m.trend === 'menurun'
                              ? 'Menurun'
                              : 'Kekal'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}

      {/* Perbandingan Berbilang Peperiksaan (2 atau lebih) */}
      <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-[#EAECEF]">
              Ringkasan Berbilang Peperiksaan (Pilih 2 atau Lebih)
            </h3>
            <p className="text-xs text-[#848E9C]">
              Bandingkan taburan gred dan pencapaian merentas beberapa peperiksaan sekaligus
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {exams.map((ex) => {
              const checked = selectedCompareIds.includes(ex.id);
              return (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => toggleExamInMulti(ex.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
                    checked
                      ? 'bg-[#F0B90B]/15 border-[#F0B90B]/50 text-[#F0B90B]'
                      : 'bg-[#0B0E11] border-[#2B3139] text-[#848E9C]'
                  }`}
                >
                  {ex.nama}
                </button>
              );
            })}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#1E2329] border-b border-[#2B3139] text-[#848E9C]">
                <th className="py-2.5 px-3">Peperiksaan</th>
                <th className="py-2.5 px-3">Tingkatan</th>
                <th className="py-2.5 px-3 text-right">Calon</th>
                <th className="py-2.5 px-3 text-right">% Lulus</th>
                <th className="py-2.5 px-3 text-right">GPS</th>
                <th className="py-2.5 px-3 text-right">A</th>
                <th className="py-2.5 px-3 text-right">B</th>
                <th className="py-2.5 px-3 text-right">C</th>
                <th className="py-2.5 px-3 text-right">D+E</th>
                <th className="py-2.5 px-3 text-right">Gagal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2B3139]">
              {multiExamOverviews.map((ov) => (
                <tr key={ov.exam.id}>
                  <td className="py-2.5 px-3 font-bold text-[#EAECEF]">{ov.exam.nama}</td>
                  <td className="py-2.5 px-3 text-[#848E9C]">{ov.exam.tingkatan}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums">{ov.totalCandidates}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-[#0ECB81] font-semibold">
                    {ov.passRate.toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-[#F0B90B]">
                    {ov.gps !== null ? ov.gps.toFixed(2) : '-'}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-[#0ECB81]">
                    {ov.buckets.A}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-[#38BDF8]">
                    {ov.buckets.B}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-[#F0B90B]">
                    {ov.buckets.C}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-[#EAECEF]">
                    {ov.buckets.D + ov.buckets.E}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-[#F6465D] font-semibold">
                    {ov.buckets.Gagal}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
