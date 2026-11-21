import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  AcademicExam,
  AcademicIntervention,
  AcademicScoreRecord,
  AcademicSubject,
  AcademicV14State,
  ExamRecord,
  GradeBandConfig,
  GradeDistribution,
  GradeSchemeConfig,
  UserRole,
} from '../types/eduschool';
import { formatMalayFullDate, formatShortDate } from './formatters';
import { getRoleDisplayLabel } from './rolePermissions';

export const GRADE_WEIGHTS: Record<keyof GradeDistribution, number> = {
  APlus: 0,
  A: 1,
  AMinus: 2,
  BPlus: 3,
  B: 4,
  CPlus: 5,
  C: 6,
  D: 7,
  E: 8,
  G: 9,
};

export const GRADE_LABELS: { key: keyof GradeDistribution; label: string }[] = [
  { key: 'APlus', label: 'A+' },
  { key: 'A', label: 'A' },
  { key: 'AMinus', label: 'A-' },
  { key: 'BPlus', label: 'B+' },
  { key: 'B', label: 'B' },
  { key: 'CPlus', label: 'C+' },
  { key: 'C', label: 'C' },
  { key: 'D', label: 'D' },
  { key: 'E', label: 'E' },
  { key: 'G', label: 'G' },
];

export function calculateGPMP(gred: GradeDistribution): number {
  let totalPoints = 0;
  let totalCandidates = 0;

  (Object.keys(GRADE_WEIGHTS) as Array<keyof GradeDistribution>).forEach((key) => {
    const count = gred[key] || 0;
    totalCandidates += count;
    totalPoints += count * GRADE_WEIGHTS[key];
  });

  if (totalCandidates === 0) return 0;
  return Number((totalPoints / totalCandidates).toFixed(2));
}

export function calculateGPS(records: ExamRecord[]): number {
  let totalPoints = 0;
  let totalCandidates = 0;

  records.forEach((rec) => {
    (Object.keys(GRADE_WEIGHTS) as Array<keyof GradeDistribution>).forEach((key) => {
      const count = rec.gred[key] || 0;
      totalCandidates += count;
      totalPoints += count * GRADE_WEIGHTS[key];
    });
  });

  if (totalCandidates === 0) return 0;
  return Number((totalPoints / totalCandidates).toFixed(2));
}

// ============================================================
// V1.4 – ENJIN ANALISIS AKADEMIK & PEPERIKSAAN PINTAR
// ============================================================

export interface GradeBucketCounts {
  A: number;
  B: number;
  C: number;
  D: number;
  E: number;
  Gagal: number;
}

export interface ComputedSubjectAnalysis {
  subject: AcademicSubject;
  totalCandidates: number;
  passCount: number;
  failCount: number;
  passRate: number;
  avgMark: number;
  gpmp: number | null;
  needsAttention: boolean;
  bandCounts: Record<string, number>;
  buckets: GradeBucketCounts;
}

export interface ComputedExamOverview {
  exam: AcademicExam;
  scheme: GradeSchemeConfig;
  totalCandidates: number;
  uniqueStudentsCount: number;
  passCount: number;
  failCount: number;
  passRate: number;
  avgMark: number;
  gps: number | null;
  buckets: GradeBucketCounts;
  bandCounts: Record<string, number>;
  subjectAnalyses: ComputedSubjectAnalysis[];
  attentionSubjectsCount: number;
}

export interface ComputedClassAnalysis {
  kelas: string;
  tingkatan: string;
  totalStudents: number;
  totalEntries: number;
  passEntries: number;
  failEntries: number;
  studentsAllPass: number;
  studentsWithFail: number;
  passRate: number;
  avgMark: number;
  gps: number | null;
}

export interface ExamComparisonSubjectRow {
  subjectId: string;
  kod: string;
  nama: string;
  basePassRate: number;
  targetPassRate: number;
  passRateDelta: number;
  baseAvgMark: number;
  targetAvgMark: number;
  avgMarkDelta: number;
  baseGpmp: number | null;
  targetGpmp: number | null;
  gpmpDelta: number | null;
  trend: 'meningkat' | 'menurun' | 'kekal';
}

export interface ExamComparisonResult {
  compatible: boolean;
  reason?: string;
  baseExam: AcademicExam;
  targetExam: AcademicExam;
  sameScheme: boolean;
  baseOverview: ComputedExamOverview;
  targetOverview: ComputedExamOverview;
  gpsDelta: number | null;
  passRateDelta: number;
  avgMarkDelta: number;
  bucketDeltas: GradeBucketCounts;
  matchedSubjects: ExamComparisonSubjectRow[];
  improvingSubjects: ExamComparisonSubjectRow[];
  decliningSubjects: ExamComparisonSubjectRow[];
}

export function validateScoreMark(raw: string | number): {
  valid: boolean;
  mark: number;
  error?: string;
} {
  if (raw === '' || raw === null || raw === undefined) {
    return { valid: false, mark: 0, error: 'Markah wajib diisi (0 hingga 100).' };
  }
  const num = typeof raw === 'number' ? raw : Number(String(raw).trim());
  if (!Number.isFinite(num) || Number.isNaN(num)) {
    return { valid: false, mark: 0, error: 'Markah mestilah dalam bentuk nombor yang sah.' };
  }
  if (num < 0 || num > 100) {
    return { valid: false, mark: 0, error: 'Markah hanya dibenarkan antara 0 hingga 100 sahaja.' };
  }
  return { valid: true, mark: Math.round(num * 10) / 10 };
}

export function resolveGradeForMark(
  mark: number,
  scheme: GradeSchemeConfig
): GradeBandConfig {
  const clamped = Math.max(0, Math.min(100, mark));
  const sorted = [...scheme.bands].sort((a, b) => b.minMarkah - a.minMarkah);
  const found = sorted.find((b) => clamped >= b.minMarkah && clamped <= b.maxMarkah);
  if (found) return found;
  // Fallback terdekat
  const nearest = sorted.find((b) => clamped >= b.minMarkah);
  return nearest ?? sorted[sorted.length - 1];
}

export function getSchemeForExam(
  exam: AcademicExam,
  schemes: GradeSchemeConfig[]
): GradeSchemeConfig {
  return schemes.find((s) => s.id === exam.schemeId) ?? schemes[0];
}

export function computeSubjectAnalysisForExam(
  exam: AcademicExam,
  subject: AcademicSubject,
  scores: AcademicScoreRecord[],
  scheme: GradeSchemeConfig
): ComputedSubjectAnalysis {
  const matchingScores = scores.filter(
    (s) => s.examId === exam.id && s.subjectId === subject.id
  );
  const buckets: GradeBucketCounts = { A: 0, B: 0, C: 0, D: 0, E: 0, Gagal: 0 };
  const bandCounts: Record<string, number> = {};
  scheme.bands.forEach((b) => {
    bandCounts[b.label] = 0;
  });

  let passCount = 0;
  let failCount = 0;
  let totalMark = 0;
  let totalPoints = 0;

  matchingScores.forEach((rec) => {
    const band = resolveGradeForMark(rec.markah, scheme);
    bandCounts[band.label] = (bandCounts[band.label] || 0) + 1;
    buckets[band.kumpulan] += 1;
    if (band.lulus) {
      passCount += 1;
    } else {
      failCount += 1;
    }
    totalMark += rec.markah;
    totalPoints += band.mataNilai;
  });

  const totalCandidates = matchingScores.length;
  const passRate = totalCandidates > 0 ? Number(((passCount / totalCandidates) * 100).toFixed(1)) : 0;
  const avgMark = totalCandidates > 0 ? Number((totalMark / totalCandidates).toFixed(1)) : 0;
  const gpmp =
    scheme.gunaGpmp && totalCandidates > 0
      ? Number((totalPoints / totalCandidates).toFixed(2))
      : null;

  // Subjek memerlukan perhatian jika ada calon dan % lulus < 80% ATAU GPMP >= 5.0
  const needsAttention =
    totalCandidates > 0 && (passRate < 80 || (gpmp !== null && gpmp >= 5.0));

  return {
    subject,
    totalCandidates,
    passCount,
    failCount,
    passRate,
    avgMark,
    gpmp,
    needsAttention,
    bandCounts,
    buckets,
  };
}

export function computeExamOverview(
  exam: AcademicExam,
  subjects: AcademicSubject[],
  scores: AcademicScoreRecord[],
  schemes: GradeSchemeConfig[]
): ComputedExamOverview {
  const scheme = getSchemeForExam(exam, schemes);
  const examScores = scores.filter((s) => s.examId === exam.id);
  const relevantSubjects = subjects.filter(
    (sub) =>
      sub.tingkatan === exam.tingkatan ||
      examScores.some((sc) => sc.subjectId === sub.id)
  );

  const subjectAnalyses = relevantSubjects.map((sub) =>
    computeSubjectAnalysisForExam(exam, sub, examScores, scheme)
  );

  const buckets: GradeBucketCounts = { A: 0, B: 0, C: 0, D: 0, E: 0, Gagal: 0 };
  const bandCounts: Record<string, number> = {};
  scheme.bands.forEach((b) => {
    bandCounts[b.label] = 0;
  });

  let passCount = 0;
  let failCount = 0;
  let totalMark = 0;
  let totalPoints = 0;
  const uniqueStudentIds = new Set<string>();

  examScores.forEach((rec) => {
    uniqueStudentIds.add(rec.noIdMurid);
    const band = resolveGradeForMark(rec.markah, scheme);
    bandCounts[band.label] = (bandCounts[band.label] || 0) + 1;
    buckets[band.kumpulan] += 1;
    if (band.lulus) {
      passCount += 1;
    } else {
      failCount += 1;
    }
    totalMark += rec.markah;
    totalPoints += band.mataNilai;
  });

  const totalCandidates = examScores.length;
  const passRate = totalCandidates > 0 ? Number(((passCount / totalCandidates) * 100).toFixed(1)) : 0;
  const avgMark = totalCandidates > 0 ? Number((totalMark / totalCandidates).toFixed(1)) : 0;
  const gps =
    scheme.gunaGpmp && totalCandidates > 0
      ? Number((totalPoints / totalCandidates).toFixed(2))
      : null;

  const attentionSubjectsCount = subjectAnalyses.filter((s) => s.needsAttention).length;

  return {
    exam,
    scheme,
    totalCandidates,
    uniqueStudentsCount: uniqueStudentIds.size,
    passCount,
    failCount,
    passRate,
    avgMark,
    gps,
    buckets,
    bandCounts,
    subjectAnalyses,
    attentionSubjectsCount,
  };
}

export function computeClassAnalyses(
  exam: AcademicExam,
  scores: AcademicScoreRecord[],
  scheme: GradeSchemeConfig
): ComputedClassAnalysis[] {
  const examScores = scores.filter((s) => s.examId === exam.id);
  const byClass = new Map<string, AcademicScoreRecord[]>();

  examScores.forEach((sc) => {
    const arr = byClass.get(sc.kelas) ?? [];
    arr.push(sc);
    byClass.set(sc.kelas, arr);
  });

  const result: ComputedClassAnalysis[] = [];
  byClass.forEach((classScores, kelas) => {
    const studentMap = new Map<string, { failedAny: boolean }>();
    let passEntries = 0;
    let failEntries = 0;
    let totalMark = 0;
    let totalPoints = 0;

    classScores.forEach((sc) => {
      const band = resolveGradeForMark(sc.markah, scheme);
      const st = studentMap.get(sc.noIdMurid) ?? { failedAny: false };
      if (band.lulus) {
        passEntries += 1;
      } else {
        failEntries += 1;
        st.failedAny = true;
      }
      studentMap.set(sc.noIdMurid, st);
      totalMark += sc.markah;
      totalPoints += band.mataNilai;
    });

    const totalStudents = studentMap.size;
    let studentsAllPass = 0;
    let studentsWithFail = 0;
    studentMap.forEach((st) => {
      if (st.failedAny) studentsWithFail += 1;
      else studentsAllPass += 1;
    });

    const totalEntries = classScores.length;
    result.push({
      kelas,
      tingkatan: exam.tingkatan,
      totalStudents,
      totalEntries,
      passEntries,
      failEntries,
      studentsAllPass,
      studentsWithFail,
      passRate: totalEntries > 0 ? Number(((passEntries / totalEntries) * 100).toFixed(1)) : 0,
      avgMark: totalEntries > 0 ? Number((totalMark / totalEntries).toFixed(1)) : 0,
      gps:
        scheme.gunaGpmp && totalEntries > 0
          ? Number((totalPoints / totalEntries).toFixed(2))
          : null,
    });
  });

  return result.sort((a, b) => b.avgMark - a.avgMark);
}

export function compareTwoExams(
  baseExam: AcademicExam,
  targetExam: AcademicExam,
  subjects: AcademicSubject[],
  scores: AcademicScoreRecord[],
  schemes: GradeSchemeConfig[]
): ExamComparisonResult {
  const baseOverview = computeExamOverview(baseExam, subjects, scores, schemes);
  const targetOverview = computeExamOverview(targetExam, subjects, scores, schemes);
  const sameScheme = baseOverview.scheme.id === targetOverview.scheme.id;

  // Padankan mata pelajaran yang mempunyai rekod calon dalam kedua-dua peperiksaan
  const matchedSubjects: ExamComparisonSubjectRow[] = [];
  baseOverview.subjectAnalyses.forEach((bSub) => {
    if (bSub.totalCandidates === 0) return;
    const tSub = targetOverview.subjectAnalyses.find(
      (x) =>
        x.totalCandidates > 0 &&
        (x.subject.id === bSub.subject.id ||
          x.subject.kod === bSub.subject.kod ||
          x.subject.nama.toLowerCase() === bSub.subject.nama.toLowerCase())
    );
    if (!tSub) return;

    const passRateDelta = Number((tSub.passRate - bSub.passRate).toFixed(1));
    const avgMarkDelta = Number((tSub.avgMark - bSub.avgMark).toFixed(1));
    const gpmpDelta =
      sameScheme && bSub.gpmp !== null && tSub.gpmp !== null
        ? Number((tSub.gpmp - bSub.gpmp).toFixed(2))
        : null;

    let trend: 'meningkat' | 'menurun' | 'kekal' = 'kekal';
    if (gpmpDelta !== null) {
      if (gpmpDelta < -0.03 || (gpmpDelta === 0 && passRateDelta > 0)) trend = 'meningkat';
      else if (gpmpDelta > 0.03 || (gpmpDelta === 0 && passRateDelta < 0)) trend = 'menurun';
    } else if (avgMarkDelta > 0.5) {
      trend = 'meningkat';
    } else if (avgMarkDelta < -0.5) {
      trend = 'menurun';
    }

    matchedSubjects.push({
      subjectId: bSub.subject.id,
      kod: bSub.subject.kod,
      nama: bSub.subject.nama,
      basePassRate: bSub.passRate,
      targetPassRate: tSub.passRate,
      passRateDelta,
      baseAvgMark: bSub.avgMark,
      targetAvgMark: tSub.avgMark,
      avgMarkDelta,
      baseGpmp: bSub.gpmp,
      targetGpmp: tSub.gpmp,
      gpmpDelta,
      trend,
    });
  });

  if (matchedSubjects.length === 0) {
    return {
      compatible: false,
      reason:
        'Kedua-dua peperiksaan ini tidak mempunyai mata pelajaran sepunya yang mempunyai data markah untuk dibandingkan secara adil.',
      baseExam,
      targetExam,
      sameScheme,
      baseOverview,
      targetOverview,
      gpsDelta: null,
      passRateDelta: 0,
      avgMarkDelta: 0,
      bucketDeltas: { A: 0, B: 0, C: 0, D: 0, E: 0, Gagal: 0 },
      matchedSubjects: [],
      improvingSubjects: [],
      decliningSubjects: [],
    };
  }

  const gpsDelta =
    sameScheme && baseOverview.gps !== null && targetOverview.gps !== null
      ? Number((targetOverview.gps - baseOverview.gps).toFixed(2))
      : null;

  const passRateDelta = Number((targetOverview.passRate - baseOverview.passRate).toFixed(1));
  const avgMarkDelta = Number((targetOverview.avgMark - baseOverview.avgMark).toFixed(1));
  const bucketDeltas: GradeBucketCounts = {
    A: targetOverview.buckets.A - baseOverview.buckets.A,
    B: targetOverview.buckets.B - baseOverview.buckets.B,
    C: targetOverview.buckets.C - baseOverview.buckets.C,
    D: targetOverview.buckets.D - baseOverview.buckets.D,
    E: targetOverview.buckets.E - baseOverview.buckets.E,
    Gagal: targetOverview.buckets.Gagal - baseOverview.buckets.Gagal,
  };

  return {
    compatible: true,
    reason: !sameScheme
      ? 'Nota: Kedua-dua peperiksaan menggunakan skema gred berbeza; perbandingan ditumpukan kepada purata markah dan peratus lulus.'
      : undefined,
    baseExam,
    targetExam,
    sameScheme,
    baseOverview,
    targetOverview,
    gpsDelta,
    passRateDelta,
    avgMarkDelta,
    bucketDeltas,
    matchedSubjects,
    improvingSubjects: matchedSubjects.filter((s) => s.trend === 'meningkat'),
    decliningSubjects: matchedSubjects.filter((s) => s.trend === 'menurun'),
  };
}

export function generateInterventionSuggestions(
  overview: ComputedExamOverview
): Array<Omit<AcademicIntervention, 'id'>> {
  const candidates = overview.subjectAnalyses
    .filter((s) => s.totalCandidates > 0 && (s.needsAttention || s.failCount > 0))
    .sort((a, b) => a.passRate - b.passRate)
    .slice(0, 4);

  return candidates.map((s) => {
    const gpmpLabel = s.gpmp !== null ? ` (GPMP ${s.gpmp.toFixed(2)})` : '';
    return {
      examId: overview.exam.id,
      subjectId: s.subject.id,
      mataPelajaran: s.subject.nama,
      kumpulanSasaran: `${overview.exam.tingkatan} · ${s.failCount} calon belum mencapai tahap lulus & kumpulan markah sederhana`,
      isuPencapaian: `Cadangan semakan guru: Kadar lulus ${s.passRate}% dengan purata markah ${s.avgMark}%${gpmpLabel} dalam ${overview.exam.nama}.`,
      objektif: `Meningkatkan penguasaan asas dan kadar lulus ${s.subject.nama} sekurang-kurangnya +10% pada penilaian berikutnya.`,
      strategiTindakan:
        'Cadangan awal: Klinik latih tubi berfokus 2 kali seminggu, bimbingan rakan sebaya, dan semakan item soalan paling kerap salah.',
      guruBertanggungjawab: s.subject.guruMataPelajaran,
      tarikhPelaksanaan: new Date().toISOString().slice(0, 10),
      status: 'Belum Dilaksanakan',
      hasilPenilaian: 'Menunggu semakan serta pengesahan guru mata pelajaran.',
      dijanaSistem: true,
    };
  });
}

export interface CsvParseResult {
  validRows: Array<{
    noIdMurid: string;
    namaMurid: string;
    kelas: string;
    markah: number;
  }>;
  errors: string[];
}

export function parseScoreCsv(csvText: string): CsvParseResult {
  const lines = csvText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return { validRows: [], errors: ['Fail CSV kosong.'] };
  }

  const validRows: CsvParseResult['validRows'] = [];
  const errors: string[] = [];
  const seenStudentIds = new Set<string>();

  lines.forEach((line, idx) => {
    const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
    // Langkau baris pengepala jika mengandungi teks header
    if (
      idx === 0 &&
      (cols[0]?.toLowerCase().includes('id') ||
        cols[1]?.toLowerCase().includes('nama') ||
        cols[3]?.toLowerCase().includes('markah'))
    ) {
      return;
    }

    if (cols.length < 4) {
      errors.push(`Baris ${idx + 1}: Format tidak lengkap (diperlukan 4 kolum: ID_Murid, Nama_Murid, Kelas, Markah).`);
      return;
    }

    const [noIdMurid, namaMurid, kelas, markRaw] = cols;
    if (!noIdMurid || !namaMurid || !kelas) {
      errors.push(`Baris ${idx + 1}: ID Murid, Nama atau Kelas tidak boleh kosong.`);
      return;
    }

    const check = validateScoreMark(markRaw);
    if (!check.valid) {
      errors.push(`Baris ${idx + 1} (${namaMurid}): ${check.error}`);
      return;
    }

    const dedupKey = noIdMurid.toLowerCase();
    if (seenStudentIds.has(dedupKey)) {
      errors.push(`Baris ${idx + 1}: ID Murid ${noIdMurid} berganda dalam fail CSV; baris pendua diabaikan.`);
      return;
    }
    seenStudentIds.add(dedupKey);

    validRows.push({
      noIdMurid,
      namaMurid,
      kelas,
      markah: check.mark,
    });
  });

  return { validRows, errors };
}

/**
 * Menyelaraskan ringkasan ExamRecord[] untuk Papan Pemuka Utama, Panitia & Laporan
 * berdasarkan peperiksaan terkini bagi setiap (tingkatan, mata pelajaran).
 */
export function buildSyncedExamRecords(academicV14: AcademicV14State): ExamRecord[] {
  const sortedExams = [...academicV14.exams].sort((a, b) =>
    b.tarikh.localeCompare(a.tarikh)
  );
  const seenKeys = new Set<string>();
  const synced: ExamRecord[] = [];

  sortedExams.forEach((exam) => {
    const scheme = getSchemeForExam(exam, academicV14.gradeSchemes);
    const examScores = academicV14.scores.filter((s) => s.examId === exam.id);

    academicV14.subjects.forEach((sub) => {
      const subScores = examScores.filter((s) => s.subjectId === sub.id);
      if (subScores.length === 0) return;
      const key = `${exam.tingkatan}::${sub.kod}::${sub.nama}`;
      if (seenKeys.has(key)) return;
      seenKeys.add(key);

      const gred: GradeDistribution = {
        APlus: 0,
        A: 0,
        AMinus: 0,
        BPlus: 0,
        B: 0,
        CPlus: 0,
        C: 0,
        D: 0,
        E: 0,
        G: 0,
      };

      let bilLulus = 0;
      subScores.forEach((sc) => {
        const band = resolveGradeForMark(sc.markah, scheme);
        if (band.lulus) bilLulus += 1;
        const lbl = band.label.toUpperCase();
        if (lbl === 'A+') gred.APlus += 1;
        else if (lbl === 'A') gred.A += 1;
        else if (lbl === 'A-') gred.AMinus += 1;
        else if (lbl === 'B+') gred.BPlus += 1;
        else if (lbl === 'B') gred.B += 1;
        else if (lbl === 'C+') gred.CPlus += 1;
        else if (lbl === 'C') gred.C += 1;
        else if (lbl === 'D') gred.D += 1;
        else if (lbl === 'E') gred.E += 1;
        else gred.G += 1;
      });

      synced.push({
        id: `sync-${exam.id}-${sub.id}`,
        peperiksaan: exam.nama,
        tingkatan: exam.tingkatan,
        mataPelajaran: sub.nama,
        kodSubjek: sub.kod,
        bilCalon: subScores.length,
        bilLulus,
        gred,
        tarikh: exam.tarikh,
      });
    });
  });

  return synced;
}

export function generateNextExamCode(exams: AcademicExam[]): string {
  const year = new Date().getFullYear();
  let maxNum = 0;
  exams.forEach((e) => {
    const m = e.kodPeperiksaan.match(/(\d+)$/);
    if (m) {
      const n = Number(m[1]);
      if (n > maxNum) maxNum = n;
    }
  });
  return `PEP-${year}-${String(maxNum + 1).padStart(3, '0')}`;
}

export interface AcademicReportPayload {
  scopeLabel: string;
  exam: AcademicExam;
  overview: ComputedExamOverview;
  classAnalyses: ComputedClassAnalysis[];
  comparison: ExamComparisonResult | null;
  interventions: AcademicIntervention[];
  summaryText: string;
  activeRole: UserRole;
  filterSubjectId: string;
  filterClass: string;
}

export function exportAcademicReportToCSV(payload: AcademicReportPayload): string {
  const { exam, overview, classAnalyses, comparison, interventions, scopeLabel, activeRole } =
    payload;

  const esc = (v: string | number) => {
    const s = String(v ?? '');
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };

  const rows: string[] = [];
  rows.push('LAPORAN ANALISIS AKADEMIK DAN PEPERIKSAAN PINTAR - EDUSCHOOL 360');
  rows.push(`Sekolah,SMK Salaping Sabah`);
  rows.push(`Skop Laporan,${esc(scopeLabel)}`);
  rows.push(`Peperiksaan,${esc(exam.nama)} (${exam.kodPeperiksaan})`);
  rows.push(`Jenis & Tahun,${esc(exam.jenis)} · ${exam.tahun} · ${exam.tingkatan}`);
  rows.push(`Tarikh Peperiksaan,${exam.tarikh}`);
  rows.push(`Skema Gred,${esc(overview.scheme.nama)}`);
  rows.push(`Peranan Paparan,${esc(getRoleDisplayLabel(activeRole))}`);
  rows.push(`Nota Privasi,DATA DEMONSTRASI REKAAN SAHAJA`);
  rows.push('');

  rows.push('2. RINGKASAN PENCAPAIAN');
  rows.push('Jumlah Calon Rekod,Lulus,Gagal,Peratus Lulus (%),Purata Markah (%),GPS');
  rows.push(
    [
      overview.totalCandidates,
      overview.passCount,
      overview.failCount,
      overview.passRate,
      overview.avgMark,
      overview.gps !== null ? overview.gps.toFixed(2) : 'Tidak Berkaitan',
    ].join(',')
  );
  rows.push('');

  rows.push('3. ANALISIS GRED');
  rows.push('Gred A,Gred B,Gred C,Gred D,Gred E,Gagal');
  rows.push(
    [
      overview.buckets.A,
      overview.buckets.B,
      overview.buckets.C,
      overview.buckets.D,
      overview.buckets.E,
      overview.buckets.Gagal,
    ].join(',')
  );
  rows.push('');

  rows.push('4 & 5. ANALISIS MATA PELAJARAN & GPMP');
  rows.push('Kod,Mata Pelajaran,Guru,Calon,Lulus,Gagal,% Lulus,Purata Markah,GPMP');
  overview.subjectAnalyses
    .filter((s) => s.totalCandidates > 0)
    .forEach((s) => {
      rows.push(
        [
          esc(s.subject.kod),
          esc(s.subject.nama),
          esc(s.subject.guruMataPelajaran),
          s.totalCandidates,
          s.passCount,
          s.failCount,
          s.passRate,
          s.avgMark,
          s.gpmp !== null ? s.gpmp.toFixed(2) : '-',
        ].join(',')
      );
    });
  rows.push('');

  rows.push('ANALISIS MENGIKUT KELAS');
  rows.push('Kelas,Bil Murid,Bil Rekod,Lulus,Gagal,% Lulus,Purata Markah');
  classAnalyses.forEach((c) => {
    rows.push(
      [
        esc(c.kelas),
        c.totalStudents,
        c.totalEntries,
        c.passEntries,
        c.failEntries,
        c.passRate,
        c.avgMark,
      ].join(',')
    );
  });
  rows.push('');

  if (comparison && comparison.compatible) {
    rows.push(
      `6. PERBANDINGAN PEPERIKSAAN (${esc(comparison.baseExam.nama)} vs ${esc(comparison.targetExam.nama)})`
    );
    rows.push('Mata Pelajaran,Kod,% Lulus Asas,% Lulus Terkini,Perubahan % Lulus,GPMP Asas,GPMP Terkini,Trend');
    comparison.matchedSubjects.forEach((m) => {
      rows.push(
        [
          esc(m.nama),
          esc(m.kod),
          m.basePassRate,
          m.targetPassRate,
          m.passRateDelta,
          m.baseGpmp !== null ? m.baseGpmp.toFixed(2) : '-',
          m.targetGpmp !== null ? m.targetGpmp.toFixed(2) : '-',
          esc(m.trend),
        ].join(',')
      );
    });
    rows.push('');
  }

  rows.push('7. INTERVENSI AKADEMIK');
  rows.push('Mata Pelajaran,Kumpulan Sasaran,Strategi Tindakan,Guru,Status,Hasil Penilaian');
  interventions.forEach((i) => {
    rows.push(
      [
        esc(i.mataPelajaran),
        esc(i.kumpulanSasaran),
        esc(i.strategiTindakan),
        esc(i.guruBertanggungjawab),
        esc(i.status),
        esc(i.hasilPenilaian),
      ].join(',')
    );
  });
  rows.push('');

  rows.push('8. RUMUSAN');
  rows.push(esc(payload.summaryText));

  const csvContent = '\uFEFF' + rows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const fileName = `Laporan_Akademik_${exam.kodPeperiksaan}_SMKSalaping_Simulasi.csv`;
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
  return fileName;
}

export function exportAcademicReportToPDF(payload: AcademicReportPayload): string {
  const { exam, overview, classAnalyses, comparison, interventions, scopeLabel, activeRole } =
    payload;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  doc.setFillColor(16, 45, 70);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 33, 'F');

  doc.setTextColor(240, 185, 11);
  doc.setFontSize(13.5);
  doc.setFont('helvetica', 'bold');
  doc.text('EDUSCHOOL 360 · SMK SALAPING, SABAH', 14, 12);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`LAPORAN ANALISIS AKADEMIK: ${exam.nama.toUpperCase()}`, 14, 20);

  doc.setFontSize(8);
  doc.setTextColor(210, 220, 230);
  doc.text(
    `DATA DEMONSTRASI | Skop: ${scopeLabel} | Peranan: ${getRoleDisplayLabel(activeRole)} | Dijana: ${formatMalayFullDate(new Date())}`,
    14,
    27
  );

  let yPos = 41;
  const ensureSpace = (minSpace = 32) => {
    if (yPos > 290 - minSpace) {
      doc.addPage();
      yPos = 20;
    }
  };
  const addHeading = (title: string) => {
    ensureSpace(34);
    doc.setTextColor(16, 45, 70);
    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 14, yPos);
    yPos += 4;
  };

  addHeading('1. Maklumat Peperiksaan & Ringkasan Pencapaian (Bahagian 1 & 2)');
  autoTable(doc, {
    startY: yPos,
    head: [['Perkara', 'Butiran Semasa']],
    body: [
      ['Kod & Nama Peperiksaan', `${exam.kodPeperiksaan} · ${exam.nama}`],
      ['Jenis / Tahun / Tingkatan', `${exam.jenis} · ${exam.tahun} · ${exam.tingkatan}`],
      ['Tarikh & Status', `${formatShortDate(exam.tarikh)} · ${exam.status}`],
      ['Skema Gred & Formula', `${overview.scheme.nama} (${overview.scheme.kaedahPengiraan})`],
      ['Jumlah Rekod Markah / Murid Unik', `${overview.totalCandidates} rekod (${overview.uniqueStudentsCount} murid)`],
      ['Peratus Lulus & Purata Markah', `${overview.passRate}% Lulus · Purata ${overview.avgMark}%`],
      ['GPS Sekolah', overview.gps !== null ? overview.gps.toFixed(2) : 'Tidak Berkaitan'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [16, 45, 70], textColor: [240, 185, 11] },
    styles: { fontSize: 8.2, cellPadding: 2.2 },
  });
  yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  addHeading('2. Analisis Taburan Gred (Bahagian 3 & 4)');
  autoTable(doc, {
    startY: yPos,
    head: [['Gred A', 'Gred B', 'Gred C', 'Gred D', 'Gred E', 'Gagal']],
    body: [
      [
        String(overview.buckets.A),
        String(overview.buckets.B),
        String(overview.buckets.C),
        String(overview.buckets.D),
        String(overview.buckets.E),
        String(overview.buckets.Gagal),
      ],
    ],
    theme: 'grid',
    headStyles: { fillColor: [16, 45, 70], textColor: [255, 255, 255] },
    styles: { fontSize: 8.5, halign: 'center' },
  });
  yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  addHeading('3. Analisis Mata Pelajaran & GPMP (Bahagian 5)');
  autoTable(doc, {
    startY: yPos,
    head: [['Kod', 'Mata Pelajaran', 'Calon', 'Lulus', 'Gagal', '% Lulus', 'Purata', 'GPMP']],
    body: overview.subjectAnalyses
      .filter((s) => s.totalCandidates > 0)
      .map((s) => [
        s.subject.kod,
        s.subject.nama,
        String(s.totalCandidates),
        String(s.passCount),
        String(s.failCount),
        `${s.passRate}%`,
        `${s.avgMark}%`,
        s.gpmp !== null ? s.gpmp.toFixed(2) : '-',
      ]),
    theme: 'striped',
    headStyles: { fillColor: [16, 45, 70], textColor: [240, 185, 11] },
    styles: { fontSize: 8, cellPadding: 2 },
  });
  yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  if (classAnalyses.length > 0) {
    addHeading('4. Analisis Pencapaian Mengikut Kelas');
    autoTable(doc, {
      startY: yPos,
      head: [['Kelas', 'Murid', 'Rekod', 'Lulus', 'Gagal', '% Lulus', 'Purata']],
      body: classAnalyses.map((c) => [
        c.kelas,
        String(c.totalStudents),
        String(c.totalEntries),
        String(c.passEntries),
        String(c.failEntries),
        `${c.passRate}%`,
        `${c.avgMark}%`,
      ]),
      theme: 'grid',
      headStyles: { fillColor: [16, 45, 70], textColor: [255, 255, 255] },
      styles: { fontSize: 8, cellPadding: 2 },
    });
    yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  }

  if (comparison && comparison.compatible) {
    addHeading(
      `5. Perbandingan Peperiksaan: ${comparison.baseExam.nama} vs ${comparison.targetExam.nama} (Bahagian 6)`
    );
    autoTable(doc, {
      startY: yPos,
      head: [['Mata Pelajaran', '% Lulus Awal', '% Lulus Kini', 'Beza %', 'GPMP Awal', 'GPMP Kini', 'Trend']],
      body: comparison.matchedSubjects.map((m) => [
        m.nama,
        `${m.basePassRate}%`,
        `${m.targetPassRate}%`,
        `${m.passRateDelta > 0 ? '+' : ''}${m.passRateDelta}%`,
        m.baseGpmp !== null ? m.baseGpmp.toFixed(2) : '-',
        m.targetGpmp !== null ? m.targetGpmp.toFixed(2) : '-',
        m.trend.toUpperCase(),
      ]),
      theme: 'striped',
      headStyles: { fillColor: [16, 45, 70], textColor: [240, 185, 11] },
      styles: { fontSize: 7.8, cellPadding: 2 },
    });
    yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  }

  addHeading('6. Rekod & Cadangan Intervensi Akademik (Bahagian 7)');
  autoTable(doc, {
    startY: yPos,
    head: [['Mata Pelajaran', 'Sasaran', 'Strategi Tindakan', 'Guru', 'Status']],
    body:
      interventions.length > 0
        ? interventions.map((i) => [
            i.mataPelajaran,
            i.kumpulanSasaran,
            i.strategiTindakan,
            i.guruBertanggungjawab,
            i.status,
          ])
        : [['Tiada intervensi direkodkan', '-', '-', '-', '-']],
    theme: 'grid',
    headStyles: { fillColor: [16, 45, 70], textColor: [255, 255, 255] },
    styles: { fontSize: 7.8, cellPadding: 2 },
  });
  yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  addHeading('7. Rumusan Akademik (Bahagian 8)');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.8);
  doc.setTextColor(40, 45, 55);
  const splitSummary = doc.splitTextToSize(payload.summaryText, 180);
  doc.text(splitSummary, 14, yPos);

  const fileName = `Laporan_Akademik_${exam.kodPeperiksaan}_SMKSalaping_Simulasi.pdf`;
  doc.save(fileName);
  return fileName;
}
