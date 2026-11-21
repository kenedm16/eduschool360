import {
  TaskItem,
  TaskPriority,
  TaskStatus,
  UserRole,
} from '../types/eduschool';
import { formatShortDate } from './formatters';
import { getRoleDisplayLabel, ROLE_PROFILES } from './rolePermissions';

export const TASK_STATUS_OPTIONS: TaskStatus[] = ['Belum Mula', 'Dalam Proses', 'Selesai'];
export const TASK_PRIORITY_OPTIONS: TaskPriority[] = ['Rendah', 'Sederhana', 'Tinggi', 'Segera'];

export const TASK_CATEGORIES: string[] = [
  'Akademik',
  'Pentadbiran',
  'Hal Ehwal Murid',
  'Kokurikulum',
  'Kewangan',
  'Aset',
  'Dokumentasi',
  'Program',
];

export const TASK_UNITS: string[] = [
  'Pentadbiran & Pengurusan',
  'Kurikulum',
  'Hal Ehwal Murid',
  'Kokurikulum',
  'Bidang Sains & Matematik',
  'Bidang Bahasa',
  'Bidang Kemanusiaan',
  'Bidang Teknik & Vokasional',
  'Panitia Matematik',
  'Pejabat Pentadbiran & Aset',
];

export function getTodayIsoDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getCurrentDateTimeLabel(): string {
  const now = new Date();
  const d = String(now.getDate()).padStart(2, '0');
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const y = now.getFullYear();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${d}/${m}/${y}, ${hh}:${mm}`;
}

export function isTaskOverdue(task: TaskItem, todayIso: string = getTodayIsoDate()): boolean {
  if (task.status === 'Selesai') return false;
  if (!task.tarikhAkhir) return false;
  return task.tarikhAkhir < todayIso;
}

export function getTaskCode(task: TaskItem, indexFallback = 0): string {
  if (task.kodTugasan && task.kodTugasan.trim()) {
    return task.kodTugasan.trim();
  }
  const numMatch = task.id.match(/(\d+)$/);
  const num = numMatch ? Number(numMatch[1]) : indexFallback + 1;
  const normalizedNum = num > 999 ? (num % 900) + 100 : num;
  return `TUG-2026-${String(normalizedNum).padStart(3, '0')}`;
}

export function generateNextTaskCode(tasks: TaskItem[]): string {
  const existingCodes = new Set(tasks.map((t, idx) => getTaskCode(t, idx)));
  let maxNum = tasks.length;
  existingCodes.forEach((code) => {
    const m = code.match(/TUG-\d{4}-(\d+)/i);
    if (m) {
      const val = Number(m[1]);
      if (val > maxNum) maxNum = val;
    }
  });
  let candidateNum = maxNum + 1;
  let candidate = `TUG-2026-${String(candidateNum).padStart(3, '0')}`;
  while (existingCodes.has(candidate)) {
    candidateNum += 1;
    candidate = `TUG-2026-${String(candidateNum).padStart(3, '0')}`;
  }
  return candidate;
}

export function normalizeTaskItem(task: TaskItem, index = 0): TaskItem {
  const code = getTaskCode(task, index);
  const defaultUnit =
    task.unit ||
    (task.kategori === 'Akademik'
      ? 'Kurikulum'
      : task.kategori === 'Aset'
        ? 'Pejabat Pentadbiran & Aset'
        : task.kategori === 'Hal Ehwal Murid'
          ? 'Hal Ehwal Murid'
          : 'Pentadbiran & Pengurusan');

  const history =
    task.sejarahStatus && task.sejarahStatus.length > 0
      ? task.sejarahStatus
      : [
          {
            id: `hist-init-${task.id}`,
            statusBaharu: task.status,
            tarikhMasa: `${formatShortDate(task.tarikhMula)}, 08:30`,
            oleh: task.pemberiArahan || 'Pentadbir Sistem',
            catatan: 'Tugasan didaftarkan ke dalam sistem.',
          },
        ];

  return {
    ...task,
    kodTugasan: code,
    kategori: task.kategori || 'Pentadbiran',
    unit: defaultUnit,
    pemberiArahan: task.pemberiArahan || 'Puan Hajah Rosnah binti Majid',
    catatan: task.catatan ?? '',
    sejarahStatus: history,
    komen: task.komen ?? [],
    evidens: task.evidens ?? [],
  };
}

export interface TaskRolePermissions {
  scopeLabel: string;
  description: string;
  canCreate: boolean;
  canEditDetails: boolean;
  canDelete: boolean;
  canUpdateStatus: boolean;
  canComment: boolean;
  canUploadEvidence: boolean;
  canExportReport: boolean;
  supportsBidangFilterHint: boolean;
}

export function getTaskRolePermissions(role: UserRole): TaskRolePermissions {
  switch (role) {
    case 'Super Admin':
      return {
        scopeLabel: 'Akses Keseluruhan Sistem',
        description:
          'Capaian penuh untuk mencipta, mengemaskini, menukar status, memadam, mengulas serta mengeksport laporan semua tugasan sekolah.',
        canCreate: true,
        canEditDetails: true,
        canDelete: true,
        canUpdateStatus: true,
        canComment: true,
        canUploadEvidence: true,
        canExportReport: true,
        supportsBidangFilterHint: false,
      };
    case 'Pengetua':
      return {
        scopeLabel: 'Pemantauan Eksekutif Semua Tugasan',
        description:
          'Melihat dan memantau keseluruhan tugasan sekolah, meneliti butiran, memberi komen arahan serta mengeksport laporan.',
        canCreate: false,
        canEditDetails: false,
        canDelete: false,
        canUpdateStatus: false,
        canComment: true,
        canUploadEvidence: false,
        canExportReport: true,
        supportsBidangFilterHint: false,
      };
    case 'Penolong Kanan':
      return {
        scopeLabel: 'Pengurusan Tugasan Mengikut Bidang',
        description:
          'Mengurus, mengagih, mengemaskini butiran dan menukar status tugasan merentasi bidang kurikulum, HEM, kokurikulum dan pentadbiran.',
        canCreate: true,
        canEditDetails: true,
        canDelete: true,
        canUpdateStatus: true,
        canComment: true,
        canUploadEvidence: true,
        canExportReport: true,
        supportsBidangFilterHint: true,
      };
    case 'Ketua Bidang':
      return {
        scopeLabel: 'Pemantauan Tugasan Bidang Sains & Matematik / Kurikulum',
        description:
          'Memantau tugasan di bawah bidang dan kurikulum, menyemak kemajuan, menukar status semakan serta menambah ulasan.',
        canCreate: false,
        canEditDetails: false,
        canDelete: false,
        canUpdateStatus: true,
        canComment: true,
        canUploadEvidence: true,
        canExportReport: true,
        supportsBidangFilterHint: true,
      };
    case 'Ketua Panitia':
      return {
        scopeLabel: 'Pengurusan Tugasan Panitia',
        description:
          'Mengurus tugasan berkaitan panitia dan kurikulum, menambah tugasan ahli panitia, mengemaskini status serta muat naik evidens.',
        canCreate: true,
        canEditDetails: true,
        canDelete: false,
        canUpdateStatus: true,
        canComment: true,
        canUploadEvidence: true,
        canExportReport: true,
        supportsBidangFilterHint: false,
      };
    case 'Guru':
      return {
        scopeLabel: 'Tugasan Peribadi Guru',
        description:
          'Melihat tugasan yang diagihkan kepada anda, mengemaskini status pelaksanaan, menambah komen dan memuat naik evidens simulasi.',
        canCreate: false,
        canEditDetails: false,
        canDelete: false,
        canUpdateStatus: true,
        canComment: true,
        canUploadEvidence: true,
        canExportReport: true,
        supportsBidangFilterHint: false,
      };
    case 'Staf':
      return {
        scopeLabel: 'Tugasan Operasi & Pentadbiran Berkaitan',
        description:
          'Melihat tugasan operasi pejabat, aset dan dokumentasi yang berkaitan, mengemas kini status serta memuat naik evidens sokongan.',
        canCreate: false,
        canEditDetails: false,
        canDelete: false,
        canUpdateStatus: true,
        canComment: true,
        canUploadEvidence: true,
        canExportReport: true,
        supportsBidangFilterHint: false,
      };
  }
}

export function filterTasksByRoleScope(tasks: TaskItem[], role: UserRole): TaskItem[] {
  const profile = ROLE_PROFILES[role];
  switch (role) {
    case 'Super Admin':
    case 'Pengetua':
    case 'Penolong Kanan':
      return tasks;
    case 'Ketua Bidang':
      return tasks.filter(
        (t) =>
          (t.unit ?? '').includes('Sains') ||
          (t.unit ?? '').includes('Matematik') ||
          (t.unit ?? '').includes('Kurikulum') ||
          t.kategori === 'Akademik' ||
          t.pegawai.toLowerCase().includes('dayang') ||
          t.pegawai.toLowerCase().includes('raymond')
      );
    case 'Ketua Panitia':
      return tasks.filter(
        (t) =>
          (t.unit ?? '').includes('Matematik') ||
          (t.unit ?? '').includes('Kurikulum') ||
          t.kategori === 'Akademik' ||
          t.kategori === 'Kewangan' ||
          t.pegawai.toLowerCase().includes('raymond') ||
          (t.pemberiArahan ?? '').toLowerCase().includes('raymond')
      );
    case 'Guru':
      return tasks.filter(
        (t) =>
          t.pegawai.toLowerCase().includes('siti mariam') ||
          t.pegawai === profile.userName
      );
    case 'Staf':
      return tasks.filter(
        (t) =>
          t.pegawai.toLowerCase().includes('jamil') ||
          t.pegawai === profile.userName ||
          (t.unit ?? '').includes('Pejabat Pentadbiran') ||
          t.kategori === 'Aset' ||
          t.kategori === 'Dokumentasi'
      );
  }
}

export function formatMonthLabelMY(ym: string): string {
  const [year, month] = ym.split('-');
  const months: Record<string, string> = {
    '01': 'Januari',
    '02': 'Februari',
    '03': 'Mac',
    '04': 'April',
    '05': 'Mei',
    '06': 'Jun',
    '07': 'Julai',
    '08': 'Ogos',
    '09': 'September',
    '10': 'Oktober',
    '11': 'November',
    '12': 'Disember',
  };
  return `${months[month] || month} ${year}`;
}

export function exportTasksToCSV(tasks: TaskItem[], role: UserRole): string {
  const todayIso = getTodayIsoDate();
  const headers = [
    'Bil',
    'ID Tugasan',
    'Tajuk Tugasan',
    'Kategori',
    'Unit / Bahagian',
    'Pemberi Arahan',
    'Pegawai Bertanggungjawab',
    'Tarikh Mula',
    'Tarikh Akhir',
    'Keutamaan',
    'Status',
    'Lewat Tarikh Akhir',
    'Catatan',
  ];

  const escapeCsv = (val: string) => `"${String(val).replace(/"/g, '""')}"`;

  const rows = tasks.map((t, idx) => [
    String(idx + 1),
    getTaskCode(t, idx),
    t.tajuk,
    t.kategori || 'Pentadbiran',
    t.unit || 'Pentadbiran & Pengurusan',
    t.pemberiArahan || '-',
    t.pegawai,
    t.tarikhMula,
    t.tarikhAkhir,
    t.keutamaan,
    t.status,
    isTaskOverdue(t, todayIso) ? 'Ya (Lewat)' : 'Tidak',
    t.catatan || '',
  ]);

  const metaLine = [
    `EDUSCHOOL 360 - LAPORAN PENGURUSAN TUGASAN (DATA DEMONSTRASI)`,
    `SMK Salaping, Sabah | Peranan Simulasi: ${getRoleDisplayLabel(role)} | Tarikh Dijana: ${todayIso}`,
  ];

  const csvContent =
    '\uFEFF' +
    [
      ...metaLine.map(escapeCsv),
      '',
      headers.map(escapeCsv).join(','),
      ...rows.map((r) => r.map(escapeCsv).join(',')),
    ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const fileName = `EDUSCHOOL360_Laporan_Tugasan_SMKSalaping_${todayIso}.csv`;
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return fileName;
}
