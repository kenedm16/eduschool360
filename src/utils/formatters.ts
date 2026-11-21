import { ExamRecord, GradeDistribution } from '../types/eduschool';

// Nilai mata gred standard SPM (0 = A+ hingga 9 = G)
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

export function formatCurrencyRM(amount: number): string {
  return new Intl.NumberFormat('ms-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 2,
  })
    .format(amount)
    .replace('MYR', 'RM');
}

const HARI_MELAYU = [
  'Ahad',
  'Isnin',
  'Selasa',
  'Rabu',
  'Khamis',
  'Jumaat',
  'Sabtu',
];

const BULAN_MELAYU = [
  'Januari',
  'Februari',
  'Mac',
  'April',
  'Mei',
  'Jun',
  'Julai',
  'Ogos',
  'September',
  'Oktober',
  'November',
  'Disember',
];

const BULAN_RINGKAS = [
  'Jan',
  'Feb',
  'Mac',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Ogos',
  'Sep',
  'Okt',
  'Nov',
  'Dis',
];

export function formatMalayFullDate(date: Date = new Date()): string {
  const hari = HARI_MELAYU[date.getDay()];
  const tarikh = date.getDate();
  const bulan = BULAN_MELAYU[date.getMonth()];
  const tahun = date.getFullYear();
  return `${hari}, ${tarikh} ${bulan} ${tahun}`;
}

export function formatShortDate(isoDate: string): string {
  if (!isoDate) return '-';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  const year = parts[0];
  const monthIdx = Number(parts[1]) - 1;
  const day = Number(parts[2]);
  if (isNaN(monthIdx) || monthIdx < 0 || monthIdx > 11) return isoDate;
  return `${day} ${BULAN_RINGKAS[monthIdx]} ${year}`;
}

export function getMonthNameMalay(monthIndex: number): string {
  return BULAN_MELAYU[monthIndex] ?? '';
}

export function getInitials(name: string): string {
  const cleaned = name
    .replace(/^(Puan Hajah|Puan|Encik|Cikgu|Ustaz|Dr\.)\s+/i, '')
    .trim();
  const words = cleaned.split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}
