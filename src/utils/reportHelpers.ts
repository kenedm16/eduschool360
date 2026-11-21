import {
  EduSchoolState,
  ModuleId,
  NotificationItem,
} from '../types/eduschool';
import { calculateGPS } from './academicCalcHelper';
import { formatShortDate } from './formatters';

export interface SchoolDynamicStats {
  totalTeachers: number;
  totalTasks: number;
  activeTasksCount: number;
  completedTasksCount: number;
  urgentTasksCount: number;
  totalPrograms: number;
  upcomingProgramsCount: number;
  completedProgramsCount: number;
  docReportsCount: number;
  programReportsCount: number;
  totalReportsCount: number;
  totalPcgBalance: number;
  currentGPS: number;
  avgPassRate: string;
  openDamageCount: number;
  studentsInInterventionCount: number;
}

/**
 * Pengiraan statistik dinamik tunggal bagi keseluruhan sistem supaya
 * angka di Dashboard, Notifikasi dan Halaman Laporan sentiasa konsisten.
 */
export function computeSchoolStats(state: EduSchoolState): SchoolDynamicStats {
  const totalTeachers = state.teachers.length;
  const totalTasks = state.tasks.length;
  const activeTasksCount = state.tasks.filter((t) => t.status !== 'Selesai').length;
  const completedTasksCount = state.tasks.filter((t) => t.status === 'Selesai').length;
  const urgentTasksCount = state.tasks.filter(
    (t) => t.status !== 'Selesai' && (t.keutamaan === 'Segera' || t.keutamaan === 'Tinggi')
  ).length;

  const totalPrograms = state.programs.length;
  const upcomingProgramsCount = state.programs.filter((p) => p.status !== 'Selesai').length;
  const completedProgramsCount = state.programs.filter((p) => p.status === 'Selesai').length;

  // Laporan konsisten berdasarkan rekod dokumen laporan/minit + laporan pelaksanaan program
  const docReportsCount = state.documents.filter(
    (d) => d.kategori === 'Laporan Program' || d.kategori === 'Minit Mesyuarat'
  ).length;
  const programReportsCount = state.programs.filter(
    (p) => p.status === 'Selesai' || p.laporanPelaksanaan.trim().length > 0
  ).length;
  const totalReportsCount = docReportsCount + programReportsCount;

  const totalPcgBalance = state.panitiaList.reduce((acc, p) => {
    const alloc = p.rekodKewangan
      .filter((k) => k.jenis === 'Peruntukan')
      .reduce((s, k) => s + k.jumlah, 0);
    const spent = p.rekodKewangan
      .filter((k) => k.jenis === 'Perbelanjaan')
      .reduce((s, k) => s + k.jumlah, 0);
    return acc + (alloc - spent);
  }, 0);

  const currentGPS = calculateGPS(state.examRecords);
  const totalCalon = state.examRecords.reduce((s, r) => s + r.bilCalon, 0);
  const totalLulus = state.examRecords.reduce((s, r) => s + r.bilLulus, 0);
  const avgPassRate = totalCalon > 0 ? ((totalLulus / totalCalon) * 100).toFixed(1) : '0.0';

  const openDamageCount = state.damageReports.filter((d) => d.statusTindakan !== 'Selesai').length;
  const studentsInInterventionCount = state.students.filter(
    (s) => s.statusSusulan !== 'Memuaskan'
  ).length;

  return {
    totalTeachers,
    totalTasks,
    activeTasksCount,
    completedTasksCount,
    urgentTasksCount,
    totalPrograms,
    upcomingProgramsCount,
    completedProgramsCount,
    docReportsCount,
    programReportsCount,
    totalReportsCount,
    totalPcgBalance,
    currentGPS,
    avgPassRate,
    openDamageCount,
    studentsInInterventionCount,
  };
}

/**
 * Menjana senarai notifikasi gabungan (rekod sistem + notifikasi dinamik langsung)
 * untuk tugasan baharu, tarikh akhir dan program akan datang.
 */
export function buildMergedNotifications(
  state: EduSchoolState,
  dismissedAutoIds: string[] = []
): NotificationItem[] {
  const todayIso = new Date().toISOString().slice(0, 10);
  const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const autoItems: NotificationItem[] = [];

  // 1. Notifikasi Tarikh Akhir tugasan aktif (lewat atau dalam 10 hari)
  state.tasks
    .filter((t) => t.status !== 'Selesai')
    .forEach((task) => {
      if (task.tarikhAkhir <= sevenDaysLater || task.keutamaan === 'Segera') {
        const id = `auto-deadline-${task.id}`;
        const isOverdue = task.tarikhAkhir < todayIso;
        autoItems.push({
          id,
          tajuk: isOverdue
            ? 'Tarikh Akhir Tugasan Sudah Lepas'
            : 'Tarikh Akhir Tugasan Menghampiri',
          mesej: `${task.tajuk} (${task.pegawai}) · Tarikh akhir ${formatShortDate(task.tarikhAkhir)}.`,
          masa: formatShortDate(task.tarikhAkhir),
          dibaca: dismissedAutoIds.includes(id),
          modulSasaran: 'tugasan',
          kategori: 'tarikh_akhir',
          isAuto: true,
        });
      }

      if (task.status === 'Belum Mula') {
        const id = `auto-newtask-${task.id}`;
        autoItems.push({
          id,
          tajuk: 'Tugasan Baharu Menunggu Tindakan',
          mesej: `${task.tajuk} diagihkan kepada ${task.pegawai} (Keutamaan: ${task.keutamaan}).`,
          masa: formatShortDate(task.tarikhMula),
          dibaca: dismissedAutoIds.includes(id),
          modulSasaran: 'tugasan',
          kategori: 'tugasan_baharu',
          isAuto: true,
        });
      }
    });

  // 2. Notifikasi Program Akan Datang
  state.programs
    .filter((p) => p.status !== 'Selesai')
    .forEach((prog) => {
      const id = `auto-prog-${prog.id}`;
      autoItems.push({
        id,
        tajuk: `Program Akan Datang (${prog.status})`,
        mesej: `${prog.nama} · Penyelaras: ${prog.penyelaras} pada ${formatShortDate(prog.tarikh)}.`,
        masa: formatShortDate(prog.tarikh),
        dibaca: dismissedAutoIds.includes(id),
        modulSasaran: 'program',
        kategori: 'program',
        isAuto: true,
      });
    });

  // Gabungkan dengan notifikasi manual/aktiviti tanpa pertindihan ID
  const existingIds = new Set(state.notifications.map((n) => n.id));
  const combined = [
    ...state.notifications.map((n) => ({
      ...n,
      kategori: n.kategori ?? (n.modulSasaran === 'tugasan' ? 'tarikh_akhir' : n.modulSasaran === 'program' ? 'program' : 'umum'),
    })),
    ...autoItems.filter((a) => !existingIds.has(a.id)),
  ];

  // Susun belum dibaca dahulu
  return combined.sort((a, b) => Number(a.dibaca) - Number(b.dibaca));
}

export interface GlobalSearchResult {
  id: string;
  kategori: 'Tugasan' | 'Panitia' | 'Program' | 'Dokumen';
  tajuk: string;
  subtajuk: string;
  modul: ModuleId;
}

export function performGlobalSearch(
  state: EduSchoolState,
  query: string
): GlobalSearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const results: GlobalSearchResult[] = [];

  state.tasks.forEach((t) => {
    if (
      t.tajuk.toLowerCase().includes(q) ||
      t.keterangan.toLowerCase().includes(q) ||
      t.pegawai.toLowerCase().includes(q) ||
      (t.kodTugasan && t.kodTugasan.toLowerCase().includes(q)) ||
      (t.unit && t.unit.toLowerCase().includes(q)) ||
      (t.kategori && t.kategori.toLowerCase().includes(q))
    ) {
      results.push({
        id: `task-${t.id}`,
        kategori: 'Tugasan',
        tajuk: t.kodTugasan ? `[${t.kodTugasan}] ${t.tajuk}` : t.tajuk,
        subtajuk: `${t.pegawai} · ${t.unit || 'Pentadbiran'} · ${t.status} · Akhir ${formatShortDate(t.tarikhAkhir)}`,
        modul: 'tugasan',
      });
    }
  });

  state.panitiaList.forEach((p) => {
    if (
      p.nama.toLowerCase().includes(q) ||
      p.bidang.toLowerCase().includes(q) ||
      p.ketuaPanitia.toLowerCase().includes(q) ||
      (p.kodPanitia && p.kodPanitia.toLowerCase().includes(q)) ||
      (p.setiausaha && p.setiausaha.toLowerCase().includes(q)) ||
      p.aktivitiTerkini.some((a) => a.toLowerCase().includes(q))
    ) {
      results.push({
        id: `pan-${p.id}`,
        kategori: 'Panitia',
        tajuk: p.kodPanitia ? `[${p.kodPanitia}] ${p.nama}` : p.nama,
        subtajuk: `Ketua: ${p.ketuaPanitia} · ${p.bidang}`,
        modul: 'panitia',
      });
    }
  });

  state.programs.forEach((pr) => {
    if (
      pr.nama.toLowerCase().includes(q) ||
      pr.penyelaras.toLowerCase().includes(q) ||
      pr.jawatankuasa.toLowerCase().includes(q) ||
      pr.status.toLowerCase().includes(q)
    ) {
      results.push({
        id: `prg-${pr.id}`,
        kategori: 'Program',
        tajuk: pr.nama,
        subtajuk: `${pr.status} · ${pr.penyelaras} · ${formatShortDate(pr.tarikh)}`,
        modul: 'program',
      });
    }
  });

  state.documents.forEach((d) => {
    if (
      d.tajuk.toLowerCase().includes(q) ||
      d.kategori.toLowerCase().includes(q) ||
      d.penyedia.toLowerCase().includes(q) ||
      d.ringkasan.toLowerCase().includes(q)
    ) {
      results.push({
        id: `doc-${d.id}`,
        kategori: 'Dokumen',
        tajuk: d.tajuk,
        subtajuk: `${d.kategori} · ${d.penyedia} (${d.format})`,
        modul: 'dokumentasi',
      });
    }
  });

  return results.slice(0, 16);
}
