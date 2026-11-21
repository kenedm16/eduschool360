import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Award,
  BarChart3,
  BookOpen,
  GraduationCap,
  Info,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  AcademicExam,
  AcademicScoreRecord,
  AcademicSubject,
  GradeSchemeConfig,
} from '../../../types/eduschool';
import {
  computeClassAnalyses,
  computeExamOverview,
  ComputedExamOverview,
} from '../../../utils/academicCalcHelper';
import { formatShortDate } from '../../../utils/formatters';

interface AcademicOverviewPanelProps {
  exams: AcademicExam[];
  subjects: AcademicSubject[];
  scores: AcademicScoreRecord[];
  gradeSchemes: GradeSchemeConfig[];
  selectedExamId: string;
  onSelectExamId: (examId: string) => void;
  onJumpToScores: (examId: string, subjectId?: string) => void;
  onJumpToInterventions: () => void;
}

export const AcademicOverviewPanel: React.FC<AcademicOverviewPanelProps> = ({
  exams,
  subjects,
  scores,
  gradeSchemes,
  selectedExamId,
  onSelectExamId,
  onJumpToScores,
  onJumpToInterventions,
}) => {
  const [filterKelas, setFilterKelas] = useState('Semua');

  const selectedExam = useMemo(
    () => exams.find((e) => e.id === selectedExamId) ?? exams[0],
    [exams, selectedExamId]
  );

  // Senarai kelas unik dalam peperiksaan terpilih
  const availableClasses = useMemo(() => {
    if (!selectedExam) return [];
    const set = new Set<string>();
    scores
      .filter((s) => s.examId === selectedExam.id)
      .forEach((s) => set.add(s.kelas));
    return Array.from(set).sort();
  }, [scores, selectedExam]);

  const filteredScores = useMemo(() => {
    if (!selectedExam) return [];
    if (filterKelas === 'Semua') return scores;
    return scores.filter(
      (s) => s.examId !== selectedExam.id || s.kelas === filterKelas
    );
  }, [scores, selectedExam, filterKelas]);

  const overview: ComputedExamOverview | null = useMemo(() => {
    if (!selectedExam) return null;
    return computeExamOverview(selectedExam, subjects, filteredScores, gradeSchemes);
  }, [selectedExam, subjects, filteredScores, gradeSchemes]);

  const classAnalyses = useMemo(() => {
    if (!selectedExam || !overview) return [];
    return computeClassAnalyses(selectedExam, scores, overview.scheme);
  }, [selectedExam, scores, overview]);

  // Perkembangan GPS merentas semua peperiksaan (disusun ikut tarikh)
  const examTrendList = useMemo(() => {
    return [...exams]
      .sort((a, b) => a.tarikh.localeCompare(b.tarikh))
      .map((ex) => computeExamOverview(ex, subjects, scores, gradeSchemes));
  }, [exams, subjects, scores, gradeSchemes]);

  // Ringkasan mengikut Tingkatan
  const tingkatanRollup = useMemo(() => {
    const map = new Map<
      string,
      { tingkatan: string; examCount: number; candidates: number; passCount: number; totalMark: number }
    >();
    examTrendList.forEach((ov) => {
      const cur = map.get(ov.exam.tingkatan) ?? {
        tingkatan: ov.exam.tingkatan,
        examCount: 0,
        candidates: 0,
        passCount: 0,
        totalMark: 0,
      };
      cur.examCount += 1;
      cur.candidates += ov.totalCandidates;
      cur.passCount += ov.passCount;
      cur.totalMark += ov.avgMark * ov.totalCandidates;
      map.set(ov.exam.tingkatan, cur);
    });
    return Array.from(map.values()).map((item) => ({
      ...item,
      passRate: item.candidates > 0 ? Number(((item.passCount / item.candidates) * 100).toFixed(1)) : 0,
      avgMark: item.candidates > 0 ? Number((item.totalMark / item.candidates).toFixed(1)) : 0,
    }));
  }, [examTrendList]);

  if (!selectedExam || !overview) {
    return (
      <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] p-8 text-center">
        <p className="text-sm text-[#848E9C]">
          Tiada peperiksaan dipilih atau direkodkan buat masa ini.
        </p>
      </div>
    );
  }

  const maxBandCount = Math.max(
    ...overview.scheme.bands.map((b) => overview.bandCounts[b.label] || 0),
    1
  );

  const bucketCards: Array<{
    key: keyof typeof overview.buckets;
    label: string;
    sublabel: string;
    color: string;
    border: string;
  }> = [
    { key: 'A', label: 'Bilangan Gred A', sublabel: 'A+ / A / A-', color: 'text-[#0ECB81]', border: 'border-[#0ECB81]/30' },
    { key: 'B', label: 'Bilangan Gred B', sublabel: 'B+ / B', color: 'text-[#38BDF8]', border: 'border-[#38BDF8]/30' },
    { key: 'C', label: 'Bilangan Gred C', sublabel: 'C+ / C', color: 'text-[#F0B90B]', border: 'border-[#F0B90B]/30' },
    { key: 'D', label: 'Bilangan Gred D', sublabel: 'Lulus Minimum', color: 'text-[#EAECEF]', border: 'border-[#2B3139]' },
    { key: 'E', label: 'Bilangan Gred E', sublabel: 'Tahap Sederhana Rendah', color: 'text-[#FB923C]', border: 'border-[#FB923C]/30' },
    { key: 'Gagal', label: 'Bilangan Gagal', sublabel: 'G / F (Perlu Bimbingan)', color: 'text-[#F6465D]', border: 'border-[#F6465D]/30' },
  ];

  const activeSubjectsWithScores = overview.subjectAnalyses.filter((s) => s.totalCandidates > 0);

  return (
    <div className="space-y-6">
      {/* Bar Pilihan Peperiksaan & Kelas */}
      <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-[#F0B90B]/15 text-[#F0B90B] text-xs font-bold">
              {selectedExam.kodPeperiksaan}
            </span>
            <span className="text-xs text-[#848E9C]">
              {selectedExam.jenis} · {selectedExam.tingkatan} · {formatShortDate(selectedExam.tarikh)}
            </span>
          </div>
          <p className="text-xs text-[#848E9C]">
            Skema aktif: <span className="text-[#EAECEF] font-semibold">{overview.scheme.nama}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-[#848E9C] mb-1">
              Pilih Peperiksaan Analisis
            </label>
            <select
              aria-label="Pilih Peperiksaan Analisis"
              value={selectedExam.id}
              onChange={(e) => {
                onSelectExamId(e.target.value);
                setFilterKelas('Semua');
              }}
              className="px-3 py-2 text-xs font-semibold bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg focus:outline-none focus:border-[#F0B90B]"
            >
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.nama} ({ex.tingkatan})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[#848E9C] mb-1">
              Tapis Kelas
            </label>
            <select
              aria-label="Tapis Kelas Analisis"
              value={filterKelas}
              onChange={(e) => setFilterKelas(e.target.value)}
              className="px-3 py-2 text-xs font-semibold bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg focus:outline-none focus:border-[#F0B90B]"
            >
              <option value="Semua">Semua Kelas ({availableClasses.length})</option>
              {availableClasses.map((kls) => (
                <option key={kls} value={kls}>
                  {kls}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Ringkasan GPS & Pencapaian Peperiksaan Terpilih */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-[#161A1E] rounded-xl border border-[#F0B90B]/40 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#F0B90B]">GPS Peperiksaan Terpilih</span>
            <Award className="w-4 h-4 text-[#F0B90B]" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono tabular-nums mt-2">
            {overview.gps !== null ? overview.gps.toFixed(2) : 'Tiada'}
          </div>
          <p className="text-[11px] text-[#848E9C] mt-1">
            {overview.gps !== null
              ? `Skala dalaman 0.00–${overview.scheme.skalaMaksimum}.00 (lebih rendah lebih baik)`
              : 'Skema peperiksaan ini tidak menggunakan pengiraan GPS/GPMP.'}
          </p>
        </div>

        <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#848E9C]">Peratus Lulus</span>
            <TrendingUp className="w-4 h-4 text-[#0ECB81]" />
          </div>
          <div className="text-3xl font-extrabold text-[#0ECB81] font-mono tabular-nums mt-2">
            {overview.passRate.toFixed(1)}%
          </div>
          <p className="text-[11px] text-[#848E9C] mt-1 tabular-nums">
            {overview.passCount} lulus daripada {overview.totalCandidates} rekod kertas calon
          </p>
        </div>

        <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#848E9C]">Purata Markah</span>
            <BarChart3 className="w-4 h-4 text-[#38BDF8]" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono tabular-nums mt-2">
            {overview.avgMark.toFixed(1)}%
          </div>
          <p className="text-[11px] text-[#848E9C] mt-1 tabular-nums">
            {overview.uniqueStudentsCount} orang murid unik direkodkan
          </p>
        </div>

        <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#848E9C]">Subjek Perlu Perhatian</span>
            <AlertTriangle className="w-4 h-4 text-[#F6465D]" />
          </div>
          <div className="text-3xl font-extrabold text-[#F6465D] font-mono tabular-nums mt-2">
            {overview.attentionSubjectsCount}
          </div>
          <button
            type="button"
            onClick={onJumpToInterventions}
            className="text-[11px] text-[#F0B90B] hover:underline font-semibold mt-1 inline-flex items-center gap-1"
          >
            Lihat & urus pelan intervensi →
          </button>
        </div>
      </div>

      {/* Bahagian E: Analisis Gred (Bilangan A, B, C, D, E, Gagal) + Carta Jalur Terperinci */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-5 bg-[#161A1E] rounded-xl border border-[#2B3139] p-5 space-y-4">
          <div>
            <h2 className="text-base font-bold text-[#EAECEF]">Ringkasan Kumpulan Gred</h2>
            <p className="text-xs text-[#848E9C]">
              Kiraan automatik bilangan A, B, C, D, E dan Gagal daripada rekod markah
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-2 gap-3">
            {bucketCards.map((card) => (
              <div
                key={card.key}
                className={`p-3.5 rounded-lg bg-[#0B0E11] border ${card.border}`}
              >
                <div className="text-[11px] text-[#848E9C] font-semibold">{card.label}</div>
                <div className={`text-2xl font-extrabold font-mono tabular-nums mt-1 ${card.color}`}>
                  {overview.buckets[card.key]}
                </div>
                <div className="text-[10px] text-[#848E9C] mt-0.5">{card.sublabel}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="xl:col-span-7 bg-[#161A1E] rounded-xl border border-[#2B3139] p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-[#EAECEF]">
              Carta Taburan Gred ({overview.scheme.nama})
            </h2>
            <p className="text-xs text-[#848E9C] mb-5">
              Bilangan calon bagi setiap peringkat gred mengikut julat markah skema aktif
            </p>
          </div>

          <div
            className="grid gap-2 items-end h-48 pt-4 border-b border-[#2B3139] pb-2"
            style={{
              gridTemplateColumns: `repeat(${overview.scheme.bands.length}, minmax(0, 1fr))`,
            }}
          >
            {overview.scheme.bands.map((band) => {
              const count = overview.bandCounts[band.label] || 0;
              const heightPct = Math.round((count / maxBandCount) * 100);
              const barColor = !band.lulus
                ? 'bg-[#F6465D]'
                : band.kumpulan === 'A'
                  ? 'bg-[#0ECB81]'
                  : band.kumpulan === 'B'
                    ? 'bg-[#38BDF8]'
                    : 'bg-[#F0B90B]';
              return (
                <div
                  key={band.id}
                  className="flex flex-col items-center justify-end h-full gap-1.5"
                >
                  <span className="text-[11px] font-bold text-[#EAECEF] tabular-nums">
                    {count}
                  </span>
                  <div
                    className={`w-full max-w-[36px] rounded-t-md transition-all duration-300 ${barColor}`}
                    style={{ height: `${count === 0 ? 4 : Math.max(10, heightPct)}%` }}
                    title={`Gred ${band.label} (${band.minMarkah}-${band.maxMarkah}%): ${count} rekod`}
                  />
                </div>
              );
            })}
          </div>
          <div
            className="grid gap-2 pt-2 text-center"
            style={{
              gridTemplateColumns: `repeat(${overview.scheme.bands.length}, minmax(0, 1fr))`,
            }}
          >
            {overview.scheme.bands.map((band) => (
              <div key={band.id}>
                <div className="text-xs font-bold text-[#EAECEF]">{band.label}</div>
                <div className="text-[10px] text-[#848E9C] tabular-nums">
                  {band.minMarkah}-{band.maxMarkah}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bahagian F & G: Analisis Mata Pelajaran, GPMP & Graf Perbandingan Subjek */}
      <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#2B3139] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-[#EAECEF] flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#F0B90B]" />
              Analisis Mata Pelajaran & GPMP ({selectedExam.nama})
            </h2>
            <p className="text-xs text-[#848E9C]">
              Bilangan calon, lulus, gagal, peratus lulus, taburan gred, purata markah dan nilai GPMP
            </p>
          </div>
          <span className="text-xs text-[#848E9C]">
            {activeSubjectsWithScores.length} mata pelajaran mempunyai rekod markah
          </span>
        </div>

        {activeSubjectsWithScores.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <p className="text-sm text-[#848E9C]">
              Belum ada markah murid dimasukkan bagi peperiksaan ini.
            </p>
            <button
              type="button"
              onClick={() => onJumpToScores(selectedExam.id)}
              className="px-4 py-2 text-xs font-bold bg-[#F0B90B] text-[#0B0E11] rounded-lg hover:bg-[#F8D12F]"
            >
              Masukkan Markah Murid Sekarang
            </button>
          </div>
        ) : (
          <>
            <div className="p-5 border-b border-[#2B3139] space-y-3">
              <div className="text-xs font-semibold text-[#848E9C]">
                Graf Perbandingan Peratus Lulus & Purata Markah Mengikut Mata Pelajaran
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeSubjectsWithScores.map((s) => (
                  <div
                    key={s.subject.id}
                    className="p-3.5 rounded-lg bg-[#0B0E11] border border-[#2B3139] space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-bold text-[#EAECEF] truncate">
                        {s.subject.nama} ({s.subject.kod})
                      </span>
                      <div className="flex items-center gap-2 shrink-0 font-mono tabular-nums">
                        <span className="text-[#0ECB81] font-semibold">
                          Lulus {s.passRate.toFixed(1)}%
                        </span>
                        {s.gpmp !== null && (
                          <span className="text-[#F0B90B] font-bold">
                            GPMP {s.gpmp.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="h-2.5 w-full bg-[#161A1E] rounded-full overflow-hidden border border-[#2B3139]">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          s.needsAttention ? 'bg-[#F6465D]' : 'bg-[#0ECB81]'
                        }`}
                        style={{ width: `${Math.max(4, Math.min(100, s.passRate))}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#848E9C]">
                      <span>Purata Markah: {s.avgMark.toFixed(1)}%</span>
                      <span>
                        A:{s.buckets.A} · B:{s.buckets.B} · C:{s.buckets.C} · D/E:{s.buckets.D + s.buckets.E} · Gagal:{s.buckets.Gagal}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#1E2329] border-b border-[#2B3139] text-[#848E9C] font-semibold">
                    <th className="py-3 px-4">Mata Pelajaran</th>
                    <th className="py-3 px-3 text-right">Calon</th>
                    <th className="py-3 px-3 text-right">Lulus</th>
                    <th className="py-3 px-3 text-right">Gagal</th>
                    <th className="py-3 px-3 text-right">% Lulus</th>
                    <th className="py-3 px-3 text-right">Purata Markah</th>
                    <th className="py-3 px-3 text-right">A / B / C / D+E</th>
                    <th className="py-3 px-3 text-right">GPMP</th>
                    <th className="py-3 px-4 text-right">Status Pemantauan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2B3139]">
                  {activeSubjectsWithScores.map((s) => (
                    <tr key={s.subject.id} className="hover:bg-[#1E2329]/50">
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#EAECEF]">{s.subject.nama}</div>
                        <div className="text-[11px] text-[#848E9C]">
                          Kod {s.subject.kod} · {s.subject.guruMataPelajaran}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums text-[#EAECEF]">
                        {s.totalCandidates}
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums text-[#0ECB81] font-semibold">
                        {s.passCount}
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums text-[#F6465D] font-semibold">
                        {s.failCount}
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums font-bold text-[#EAECEF]">
                        {s.passRate.toFixed(1)}%
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums text-[#EAECEF]">
                        {s.avgMark.toFixed(1)}%
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums text-[#848E9C]">
                        {s.buckets.A} / {s.buckets.B} / {s.buckets.C} / {s.buckets.D + s.buckets.E}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-[#F0B90B] tabular-nums">
                        {s.gpmp !== null ? s.gpmp.toFixed(2) : '-'}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {s.needsAttention ? (
                          <button
                            type="button"
                            onClick={() => onJumpToScores(selectedExam.id, s.subject.id)}
                            className="px-2.5 py-1 rounded-md bg-[#F6465D]/15 text-[#F6465D] font-semibold text-[11px] hover:bg-[#F6465D]/25"
                          >
                            Perlu Perhatian
                          </button>
                        ) : (
                          <span className="px-2.5 py-1 rounded-md bg-[#0ECB81]/15 text-[#0ECB81] font-semibold text-[11px]">
                            Memuaskan
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Bahagian H: Analisis Kelas & Perbandingan Tingkatan */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-[#161A1E] rounded-xl border border-[#2B3139] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#2B3139]">
            <h2 className="text-base font-bold text-[#EAECEF] flex items-center gap-2">
              <Users className="w-4 h-4 text-[#0ECB81]" />
              Analisis Pencapaian Mengikut Kelas ({selectedExam.nama})
            </h2>
            <p className="text-xs text-[#848E9C]">
              Jumlah murid, penguasaan lulus semua subjek, kadar lulus kertas & purata pencapaian kelas
            </p>
          </div>

          {classAnalyses.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#848E9C]">
              Tiada data kelas bagi peperiksaan terpilih.
            </div>
          ) : (
            <div className="p-5 space-y-4">
              {/* Carta perbandingan kelas */}
              <div className="space-y-2.5">
                {classAnalyses.map((c) => (
                  <div key={c.kelas} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#EAECEF]">{c.kelas}</span>
                      <span className="font-mono tabular-nums text-[#848E9C]">
                        Purata <strong className="text-white">{c.avgMark.toFixed(1)}%</strong> · Lulus{' '}
                        <strong className="text-[#0ECB81]">{c.passRate.toFixed(1)}%</strong>
                      </span>
                    </div>
                    <div className="h-2.5 w-full bg-[#0B0E11] rounded-full overflow-hidden border border-[#2B3139]">
                      <div
                        className="h-full bg-[#38BDF8] rounded-full"
                        style={{ width: `${Math.max(5, Math.min(100, c.avgMark))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="overflow-x-auto border border-[#2B3139] rounded-lg">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#1E2329] border-b border-[#2B3139] text-[#848E9C]">
                      <th className="py-2.5 px-3">Kelas</th>
                      <th className="py-2.5 px-3 text-right">Murid</th>
                      <th className="py-2.5 px-3 text-right">Lulus Semua</th>
                      <th className="py-2.5 px-3 text-right">Ada Gagal</th>
                      <th className="py-2.5 px-3 text-right">% Lulus Kertas</th>
                      <th className="py-2.5 px-3 text-right">Purata</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2B3139]">
                    {classAnalyses.map((c) => (
                      <tr key={c.kelas} className="hover:bg-[#1E2329]/40">
                        <td className="py-2.5 px-3 font-bold text-[#EAECEF]">{c.kelas}</td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-[#EAECEF]">
                          {c.totalStudents}
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-[#0ECB81] font-semibold">
                          {c.studentsAllPass}
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-[#F6465D] font-semibold">
                          {c.studentsWithFail}
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums font-bold text-[#EAECEF]">
                          {c.passRate.toFixed(1)}%
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-[#F0B90B] font-bold">
                          {c.avgMark.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Graf Perkembangan GPS & Perbandingan Tingkatan */}
        <div className="lg:col-span-5 bg-[#161A1E] rounded-xl border border-[#2B3139] p-5 space-y-5">
          <div>
            <h2 className="text-base font-bold text-[#EAECEF] flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-[#F0B90B]" />
              Perkembangan GPS & Tingkatan
            </h2>
            <p className="text-xs text-[#848E9C]">
              Trend pencapaian merentas peperiksaan yang direkodkan dalam sistem
            </p>
          </div>

          <div className="space-y-2.5">
            {examTrendList.map((item, index) => {
              const prev = index > 0 ? examTrendList[index - 1] : null;
              const comparableGps =
                prev &&
                prev.scheme.id === item.scheme.id &&
                prev.gps !== null &&
                item.gps !== null;
              const gpsDiff = comparableGps ? Number((item.gps! - prev!.gps!).toFixed(2)) : null;

              return (
                <div
                  key={item.exam.id}
                  className={`p-3 rounded-lg border ${
                    item.exam.id === selectedExam.id
                      ? 'bg-[#F0B90B]/10 border-[#F0B90B]/40'
                      : 'bg-[#0B0E11] border-[#2B3139]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#EAECEF] truncate">
                        {item.exam.nama}
                      </div>
                      <div className="text-[11px] text-[#848E9C]">
                        {item.exam.tingkatan} · {formatShortDate(item.exam.tarikh)}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-mono font-extrabold text-[#F0B90B] tabular-nums">
                        {item.gps !== null ? `GPS ${item.gps.toFixed(2)}` : `Lulus ${item.passRate}%`}
                      </div>
                      {gpsDiff !== null && (
                        <div
                          className={`text-[10px] font-semibold inline-flex items-center gap-0.5 ${
                            gpsDiff <= 0 ? 'text-[#0ECB81]' : 'text-[#F6465D]'
                          }`}
                        >
                          {gpsDiff <= 0 ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          {gpsDiff > 0 ? `+${gpsDiff.toFixed(2)}` : gpsDiff.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-[#2B3139] space-y-2.5">
            <div className="text-xs font-semibold text-[#848E9C]">
              Perbandingan Ringkas Mengikut Tingkatan
            </div>
            {tingkatanRollup.map((tr) => (
              <div
                key={tr.tingkatan}
                className="flex items-center justify-between p-2.5 rounded-lg bg-[#0B0E11] border border-[#2B3139] text-xs"
              >
                <div>
                  <div className="font-bold text-[#EAECEF]">{tr.tingkatan}</div>
                  <div className="text-[11px] text-[#848E9C]">
                    {tr.examCount} peperiksaan · {tr.candidates} rekod kertas
                  </div>
                </div>
                <div className="text-right font-mono tabular-nums">
                  <div className="font-bold text-[#0ECB81]">{tr.passRate}% Lulus</div>
                  <div className="text-[11px] text-[#848E9C]">Purata {tr.avgMark}%</div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-start gap-2 p-3 rounded-lg bg-[#0B0E11] border border-[#2B3139] text-[11px] text-[#848E9C]">
            <Info className="w-4 h-4 text-[#F0B90B] shrink-0 mt-0.5" />
            <span>
              Semua angka di halaman ini dikira secara langsung daripada rekod keputusan peperiksaan yang disimpan, tanpa nombor statik.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
