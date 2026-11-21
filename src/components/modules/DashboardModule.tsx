import React, { useMemo, useState } from 'react';
import {
  Users,
  CheckSquare,
  CalendarClock,
  FileText,
  ArrowRight,
  Plus,
  Trash2,
  Megaphone,
  Activity,
  AlertCircle,
  Clock,
  CheckCircle2,
  Zap,
  Award,
  BookOpen,
  FileSpreadsheet,
  ShieldCheck,
  Wrench,
  Lock,
} from 'lucide-react';
import {
  AnnouncementItem,
  EduSchoolState,
  ModuleId,
  ProgramStatus,
  SchoolProgram,
  TaskItem,
  TaskPriority,
  TaskStatus,
  UserRole,
} from '../../types/eduschool';
import {
  getRoleCapabilities,
  getRoleDisplayLabel,
  ROLE_MODULE_ACCESS,
  ROLE_PROFILES,
} from '../../utils/rolePermissions';
import {
  formatCurrencyRM,
  formatMalayFullDate,
  formatShortDate,
} from '../../utils/formatters';
import { calculateGPMP } from '../../utils/academicCalcHelper';
import { computeSchoolStats } from '../../utils/reportHelpers';
import { ConfirmDeleteModal, Modal } from '../common/Modal';

interface DashboardModuleProps {
  state: EduSchoolState;
  activeRole: UserRole;
  onNavigate: (moduleId: ModuleId) => void;
  onAddAnnouncement: (item: Omit<AnnouncementItem, 'id' | 'tarikh' | 'pengarang'>) => void;
  onDeleteAnnouncement: (id: string) => void;
  onAddTask: (task: Omit<TaskItem, 'id'>) => void;
  onAddProgram: (program: Omit<SchoolProgram, 'id'>) => void;
  onNotifyRestricted: (title: string, message: string) => void;
}

export const DashboardModule: React.FC<DashboardModuleProps> = ({
  state,
  activeRole,
  onNavigate,
  onAddAnnouncement,
  onDeleteAnnouncement,
  onAddTask,
  onAddProgram,
  onNotifyRestricted,
}) => {
  const profile = ROLE_PROFILES[activeRole];
  const capabilities = getRoleCapabilities(activeRole);
  const allowedModules = ROLE_MODULE_ACCESS[activeRole];
  const stats = useMemo(() => computeSchoolStats(state), [state]);

  // Announcement Modal State
  const [isAnnModalOpen, setIsAnnModalOpen] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annBody, setAnnBody] = useState('');
  const [annPriority, setAnnPriority] = useState<'Biasa' | 'Penting'>('Biasa');
  const [deleteAnnTarget, setDeleteAnnTarget] = useState<AnnouncementItem | null>(null);

  // Quick Task Modal State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskAssignee, setTaskAssignee] = useState(state.teachers[0]?.nama ?? '');
  const [taskDue, setTaskDue] = useState('2026-11-30');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('Tinggi');

  // Quick Program Modal State
  const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);
  const [progName, setProgName] = useState('');
  const [progDate, setProgDate] = useState('2026-12-03');
  const [progLead, setProgLead] = useState(state.teachers[0]?.nama ?? '');
  const [progBudget, setProgBudget] = useState('1200');
  const [progStatus, setProgStatus] = useState<ProgramStatus>('Dirancang');

  const canAccess = (mod: ModuleId) => allowedModules.includes(mod);

  // Penapisan senarai tugasan mengikut peranan (simulasi paparan berbeza)
  const roleSpecificTasks = useMemo(() => {
    if (activeRole === 'Guru') {
      const own = state.tasks.filter((t) =>
        t.pegawai.toLowerCase().includes('siti mariam')
      );
      return own.length > 0 ? own : state.tasks.slice(0, 4);
    }
    if (activeRole === 'Staf') {
      const ops = state.tasks.filter(
        (t) =>
          t.pegawai.toLowerCase().includes('jamil') ||
          t.kategori === 'Aset' ||
          t.kategori === 'Dokumentasi'
      );
      return ops.length > 0 ? ops : state.tasks.slice(0, 4);
    }
    if (activeRole === 'Ketua Panitia') {
      const pan = state.tasks.filter(
        (t) =>
          t.pegawai.toLowerCase().includes('raymond') ||
          t.kategori === 'Akademik' ||
          t.kategori === 'Kewangan'
      );
      return pan.length > 0 ? pan : state.tasks.slice(0, 4);
    }
    return state.tasks.slice(0, 4);
  }, [activeRole, state.tasks]);

  const upcomingPrograms = state.programs.filter((p) => p.status !== 'Selesai').slice(0, 3);
  const upcomingEvents = state.calendarEvents.slice(0, 3);

  const topSubjects = [...state.examRecords]
    .sort((a, b) => calculateGPMP(a.gred) - calculateGPMP(b.gred))
    .slice(0, 3);
  const focusSubjects = [...state.examRecords]
    .sort((a, b) => calculateGPMP(b.gred) - calculateGPMP(a.gred))
    .slice(0, 3);

  // Lengkung SVG dinamik berdasarkan peratus lulus sebenar dalam examRecords
  const dynamicChartPaths = useMemo(() => {
    const records = state.examRecords.length > 0 ? state.examRecords : [];
    const points =
      records.length >= 2
        ? records.map((rec, idx) => {
            const pct = rec.bilCalon > 0 ? (rec.bilLulus / rec.bilCalon) * 100 : 50;
            const x = Math.round((idx / (records.length - 1)) * 360);
            // Map 60%..100% pass rate to y 82..12
            const clamped = Math.min(100, Math.max(50, pct));
            const y = Math.round(85 - ((clamped - 50) / 50) * 72);
            return { x, y };
          })
        : [
            { x: 0, y: 60 },
            { x: 180, y: 40 },
            { x: 360, y: 20 },
          ];

    const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const area = `${line} L 360 95 L 0 95 Z`;
    return { line, area };
  }, [state.examRecords]);

  // Panel Fokus Peranan Berbeza untuk kesemua 7 Peranan
  const roleFocusConfig = useMemo(() => {
    const mathPanitia =
      state.panitiaList.find((p) => p.nama.toLowerCase().includes('matematik')) ??
      state.panitiaList[0];
    const bidangSainsPanitia = state.panitiaList.filter(
      (p) => p.bidang === 'Sains & Matematik'
    );
    const brokenAssets = state.assets.filter((a) => a.status !== 'Baik').length;

    switch (activeRole) {
      case 'Super Admin':
        return {
          heading: 'Fokus Pentadbir Sistem (Pentadbir Utama)',
          summary:
            'Pemantauan penuh kesihatan sistem, 11 modul operasi + Laporan, serta audit aktiviti pengguna.',
          cards: [
            {
              label: 'Modul Aktif Sistem',
              value: '11 + Laporan',
              sub: 'Semua laluan navigasi disahkan aktif',
              tone: 'text-[#F0B90B]',
            },
            {
              label: 'Tugasan Segera / Tinggi',
              value: `${stats.urgentTasksCount} kes`,
              sub: `Daripada ${stats.activeTasksCount} tugasan aktif`,
              tone: 'text-[#F6465D]',
            },
            {
              label: 'Log Aktiviti Sistem',
              value: `${state.activityLogs.length} rekod`,
              sub: 'Jejak perubahan masa nyata',
              tone: 'text-[#0ECB81]',
            },
          ],
        };
      case 'Pengetua':
        return {
          heading: 'Fokus Eksekutif Pengetua',
          summary:
            'Gambaran strategik pencapaian sekolah, kelulusan program, dan kedudukan kewangan PCG.',
          cards: [
            {
              label: 'GPS Percubaan SPM',
              value: stats.currentGPS.toFixed(2),
              sub: `Kadar Lulus ${stats.avgPassRate}%`,
              tone: 'text-[#0ECB81]',
            },
            {
              label: 'Baki Keseluruhan PCG',
              value: formatCurrencyRM(stats.totalPcgBalance),
              sub: `${state.panitiaList.length} panitia aktif dipantau`,
              tone: 'text-[#F0B90B]',
            },
            {
              label: 'Program Selesai / Jumlah',
              value: `${stats.completedProgramsCount} / ${stats.totalPrograms}`,
              sub: `${stats.totalReportsCount} laporan direkodkan`,
              tone: 'text-white',
            },
          ],
        };
      case 'Penolong Kanan':
        return {
          heading: 'Fokus Operasi & Kurikulum (Penolong Kanan)',
          summary:
            'Penyelarasan tarikh akhir tugasan, pemantauan murid berisiko dan pelaksanaan takwim sekolah.',
          cards: [
            {
              label: 'Tugasan Dalam Proses / Belum',
              value: `${stats.activeTasksCount} tugasan`,
              sub: `${stats.urgentTasksCount} berkeutamaan Tinggi/Segera`,
              tone: 'text-[#F0B90B]',
            },
            {
              label: 'Murid Dalam Intervensi',
              value: `${stats.studentsInInterventionCount} murid`,
              sub: `Daripada ${state.students.length} profil simulasi`,
              tone: 'text-[#F6465D]',
            },
            {
              label: 'Acara Takwim Sekolah',
              value: `${state.calendarEvents.length} acara`,
              sub: 'Kalendar aktiviti & mesyuarat',
              tone: 'text-[#0ECB81]',
            },
          ],
        };
      case 'Ketua Bidang':
        return {
          heading: 'Fokus Penyeliaan Bidang (Ketua Bidang Sains & Matematik)',
          summary:
            'Pemantauan panitia di bawah bidang, pengurusan pelan tahunan dan analisis subjek tumpuan.',
          cards: [
            {
              label: 'Panitia Bawah Bidang',
              value: `${bidangSainsPanitia.length} panitia`,
              sub: bidangSainsPanitia.map((p) => p.nama.replace('Panitia ', '')).join(' & '),
              tone: 'text-[#F0B90B]',
            },
            {
              label: 'Jumlah Laporan Panitia',
              value: `${stats.docReportsCount} dokumen`,
              sub: 'Minit & laporan program semasa',
              tone: 'text-[#0ECB81]',
            },
            {
              label: 'Murid Perlu Bimbingan',
              value: `${stats.studentsInInterventionCount} kes`,
              sub: 'Memerlukan tindakan susulan guru',
              tone: 'text-[#F6465D]',
            },
          ],
        };
      case 'Ketua Panitia': {
        const alloc = mathPanitia
          ? mathPanitia.rekodKewangan
              .filter((k) => k.jenis === 'Peruntukan')
              .reduce((s, k) => s + k.jumlah, 0)
          : 0;
        const spent = mathPanitia
          ? mathPanitia.rekodKewangan
              .filter((k) => k.jenis === 'Perbelanjaan')
              .reduce((s, k) => s + k.jumlah, 0)
          : 0;
        return {
          heading: `Fokus Ketua Panitia (${mathPanitia?.nama ?? 'Panitia'})`,
          summary:
            'Pengurusan baki peruntukan PCG panitia, pelan tahunan aktiviti dan pencapaian mata pelajaran.',
          cards: [
            {
              label: 'Baki PCG Panitia Ini',
              value: formatCurrencyRM(alloc - spent),
              sub: `${mathPanitia?.ahli.length ?? 0} ahli berdaftar`,
              tone: 'text-[#0ECB81]',
            },
            {
              label: 'Pelan Tahunan Panitia',
              value: `${mathPanitia?.perancanganTahunan.length ?? 0} aktiviti`,
              sub: 'Perancangan & pelaksanaan 2026',
              tone: 'text-[#F0B90B]',
            },
            {
              label: 'Tugasan Berkaitan',
              value: `${roleSpecificTasks.length} tugasan`,
              sub: 'Tugasan akademik & kewangan',
              tone: 'text-white',
            },
          ],
        };
      }
      case 'Guru':
        return {
          heading: 'Fokus Guru Akademik (Cikgu Siti Mariam)',
          summary:
            'Senarai tugasan harian anda, pemantauan murid berfokus dan kemaskini pentaksiran.',
          cards: [
            {
              label: 'Tugasan Berkaitan Saya',
              value: `${roleSpecificTasks.length} tugasan`,
              sub: 'Semak tarikh akhir penghantaran',
              tone: 'text-[#F0B90B]',
            },
            {
              label: 'Murid Dalam Intervensi',
              value: `${stats.studentsInInterventionCount} murid`,
              sub: 'Data demonstrasi pemantauan',
              tone: 'text-[#F6465D]',
            },
            {
              label: 'Dokumen Digital Sekolah',
              value: `${state.documents.length} fail`,
              sub: 'Minit & laporan boleh rujuk',
              tone: 'text-[#0ECB81]',
            },
          ],
        };
      case 'Staf':
        return {
          heading: 'Fokus Operasi Pejabat & Aset (Staf Pentadbiran)',
          summary:
            'Pengurusan inventori harta modal, tindakan baik pulih aduan kerosakan serta sokongan program.',
          cards: [
            {
              label: 'Aset Perlu Perhatian',
              value: `${brokenAssets} kategori`,
              sub: `Daripada ${state.assets.length} rekod inventori`,
              tone: 'text-[#F0B90B]',
            },
            {
              label: 'Aduan Kerosakan Terbuka',
              value: `${stats.openDamageCount} aduan`,
              sub: 'Menunggu tindakan penyelenggaraan',
              tone: 'text-[#F6465D]',
            },
            {
              label: 'Tugasan Operasi',
              value: `${roleSpecificTasks.length} tugasan`,
              sub: 'Audit aset & urusan pejabat',
              tone: 'text-[#0ECB81]',
            },
          ],
        };
    }
  }, [activeRole, roleSpecificTasks.length, state, stats]);

  const handleSubmitAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annBody.trim()) return;
    onAddAnnouncement({
      tajuk: annTitle.trim(),
      kandungan: annBody.trim(),
      keutamaan: annPriority,
    });
    setAnnTitle('');
    setAnnBody('');
    setAnnPriority('Biasa');
    setIsAnnModalOpen(false);
  };

  const handleQuickAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    onAddTask({
      tajuk: taskTitle.trim(),
      keterangan: taskDesc.trim() || 'Tugasan baharu didaftarkan melalui Tindakan Pantas Papan Pemuka.',
      pegawai: taskAssignee || (state.teachers[0]?.nama ?? 'Pegawai Sekolah'),
      tarikhMula: '2026-11-20',
      tarikhAkhir: taskDue,
      keutamaan: taskPriority,
      status: 'Belum Mula' as TaskStatus,
      kategori: 'Pentadbiran',
    });
    setTaskTitle('');
    setTaskDesc('');
    setIsTaskModalOpen(false);
  };

  const handleQuickAddProgram = (e: React.FormEvent) => {
    e.preventDefault();
    if (!progName.trim()) return;
    onAddProgram({
      nama: progName.trim(),
      tarikh: progDate,
      penyelaras: progLead || (state.teachers[0]?.nama ?? 'Penyelaras Program'),
      jawatankuasa: 'Jawatankuasa Pelaksana Sekolah',
      anggaranBajet: Number(progBudget) || 0,
      status: progStatus,
      laporanPelaksanaan: 'Program baharu didaftarkan melalui Tindakan Pantas Papan Pemuka.',
    });
    setProgName('');
    setProgBudget('1200');
    setIsProgramModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Hero Split Panel */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        <div className="xl:col-span-7 bg-[#161A1E] rounded-xl p-6 sm:p-7 border border-[#2B3139] flex flex-col justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#F0B90B] tracking-wide">
              <span>SMK SALAPING, SABAH · {formatMalayFullDate(new Date())}</span>
              <span className="px-2 py-0.5 rounded bg-[#0B0E11] border border-[#2B3139] text-[10px] text-[#0ECB81]">
                DATA DEMONSTRASI
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white text-balance leading-tight">
              Selamat Datang,{' '}
              <span className="text-[#F0B90B]">{profile.userName}</span>
            </h1>
            <p className="text-sm text-[#848E9C] leading-relaxed max-w-2xl">
              Paparan aktif (Simulasi Peranan):{' '}
              <strong className="text-[#EAECEF]">{getRoleDisplayLabel(profile.role)}</strong> ({profile.title}).{' '}
              {profile.description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {canAccess('tugasan') && (
              <button
                type="button"
                onClick={() => onNavigate('tugasan')}
                className="px-4 py-2.5 text-xs font-bold bg-[#F0B90B] text-[#0B0E11] rounded-lg hover:bg-[#F8D12F] transition-colors whitespace-nowrap"
              >
                Urus Tugasan Aktif
              </button>
            )}
            {canAccess('akademik') && (
              <button
                type="button"
                onClick={() => onNavigate('akademik')}
                className="px-4 py-2.5 text-xs font-semibold bg-[#0ECB81] text-[#0B0E11] rounded-lg hover:bg-[#15E092] transition-colors whitespace-nowrap"
              >
                Analisis GPS & GPMP
              </button>
            )}
            {canAccess('laporan') && (
              <button
                type="button"
                onClick={() => onNavigate('laporan')}
                className="px-4 py-2.5 text-xs font-semibold bg-[#1E2329] text-[#EAECEF] border border-[#2B3139] rounded-lg hover:border-[#F0B90B] transition-colors whitespace-nowrap"
              >
                Laporan dan Eksport
              </button>
            )}
            {canAccess('ai-assistant') && (
              <button
                type="button"
                onClick={() => onNavigate('ai-assistant')}
                className="px-4 py-2.5 text-xs font-semibold bg-[#1E2329] text-[#EAECEF] border border-[#2B3139] rounded-lg hover:bg-[#2B3139] transition-colors whitespace-nowrap"
              >
                Pembantu AI Pintar
              </button>
            )}
          </div>
        </div>

        {/* Right Hero Widget: Prestasi Akademik Semasa + Dynamic Emerald Curve */}
        <div className="xl:col-span-5 bg-[#161A1E] rounded-xl border border-[#2B3139] overflow-hidden flex flex-col justify-between">
          <div className="px-5 py-4 border-b border-[#2B3139] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold text-[#EAECEF]">GPS / SPM 2026</span>
              <span className="text-sm font-mono font-bold text-[#0ECB81] tabular-nums">
                {stats.currentGPS.toFixed(2)}
              </span>
              <span className="text-xs font-mono text-[#0ECB81] tabular-nums">
                Lulus {stats.avgPassRate}%
              </span>
            </div>
            {canAccess('akademik') ? (
              <button
                type="button"
                onClick={() => onNavigate('akademik')}
                className="px-2.5 py-1 text-[11px] font-semibold bg-[#1E2329] text-[#EAECEF] border border-[#2B3139] rounded hover:border-[#F0B90B] transition-colors"
              >
                Perincian
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onNavigate('laporan')}
                className="px-2.5 py-1 text-[11px] font-semibold bg-[#1E2329] text-[#EAECEF] border border-[#2B3139] rounded hover:border-[#F0B90B] transition-colors"
              >
                Lihat Laporan
              </button>
            )}
          </div>

          <div className="px-4 pt-3 pb-1 bg-[#0B0E11]/60">
            <svg viewBox="0 0 360 95" className="w-full h-24 overflow-visible" aria-hidden="true">
              <defs>
                <linearGradient id="emeraldHeroGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0ECB81" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#0ECB81" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path d={dynamicChartPaths.area} fill="url(#emeraldHeroGrad)" />
              <path
                d={dynamicChartPaths.line}
                fill="none"
                stroke="#0ECB81"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div className="grid grid-cols-2 divide-x divide-[#2B3139] border-t border-[#2B3139] text-xs">
            <div className="p-3.5 space-y-1.5">
              <div className="text-[11px] font-semibold text-[#848E9C]">Prestasi Terbaik</div>
              {topSubjects.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-2 tabular-nums">
                  <span className="text-[#0ECB81] font-medium truncate">{s.mataPelajaran}</span>
                  <span className="font-mono text-[#EAECEF] shrink-0">
                    {calculateGPMP(s.gred).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            <div className="p-3.5 space-y-1.5">
              <div className="text-[11px] font-semibold text-[#848E9C]">Fokus Bimbingan</div>
              {focusSubjects.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-2 tabular-nums">
                  <span className="text-[#F6465D] font-medium truncate">{s.mataPelajaran}</span>
                  <span className="font-mono text-[#EAECEF] shrink-0">
                    {calculateGPMP(s.gred).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Tindakan Pantas (Quick Actions) */}
      <section
        className="bg-[#161A1E] rounded-xl border border-[#2B3139] p-4 sm:p-5"
        aria-label="Tindakan Pantas"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3.5">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#F0B90B]" />
            <h2 className="text-sm font-bold text-[#EAECEF]">Tindakan Pantas</h2>
          </div>
          <span className="text-[11px] text-[#848E9C]">
            Akses terus operasi utama SMK Salaping · Data Demonstrasi
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          <button
            type="button"
            onClick={() => setIsTaskModalOpen(true)}
            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg bg-[#0B0E11] border border-[#2B3139] hover:border-[#F0B90B] hover:bg-[#1E2329] transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-[#F0B90B]/15 text-[#F0B90B] flex items-center justify-center shrink-0">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#EAECEF] truncate">Tambah Tugasan</div>
              <div className="text-[10px] text-[#848E9C] truncate">Agih tugas pantas</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              if (capabilities.canManagePrograms) {
                setIsProgramModalOpen(true);
              } else {
                onNotifyRestricted(
                  'Akses Terhad bagi Peranan Semasa',
                  `Peranan ${getRoleDisplayLabel(activeRole)} hanya melihat senarai program. Tukar ke Ketua Panitia atau Pentadbir untuk menambah program.`
                );
              }
            }}
            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg bg-[#0B0E11] border border-[#2B3139] hover:border-[#F0B90B] hover:bg-[#1E2329] transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-[#0ECB81]/15 text-[#0ECB81] flex items-center justify-center shrink-0">
              {capabilities.canManagePrograms ? (
                <Award className="w-4 h-4" />
              ) : (
                <Lock className="w-4 h-4 text-[#848E9C]" />
              )}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#EAECEF] truncate">Tambah Program</div>
              <div className="text-[10px] text-[#848E9C] truncate">Daftar aktiviti sekolah</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              if (capabilities.canPostAnnouncements) {
                setIsAnnModalOpen(true);
              } else {
                onNotifyRestricted(
                  'Akses Pengumuman Terhad',
                  `Hanya Pengetua, Penolong Kanan, Ketua Bidang atau Pentadbir Utama boleh menyiarkan pengumuman sekolah.`
                );
              }
            }}
            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg bg-[#0B0E11] border border-[#2B3139] hover:border-[#F0B90B] hover:bg-[#1E2329] transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-[#F0B90B]/15 text-[#F0B90B] flex items-center justify-center shrink-0">
              {capabilities.canPostAnnouncements ? (
                <Megaphone className="w-4 h-4" />
              ) : (
                <Lock className="w-4 h-4 text-[#848E9C]" />
              )}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#EAECEF] truncate">Tambah Pengumuman</div>
              <div className="text-[10px] text-[#848E9C] truncate">Siar makluman warga</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('laporan')}
            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg bg-[#0B0E11] border border-[#2B3139] hover:border-[#F0B90B] hover:bg-[#1E2329] transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-[#0ECB81]/15 text-[#0ECB81] flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#EAECEF] truncate">Lihat Laporan</div>
              <div className="text-[10px] text-[#848E9C] truncate">Eksport PDF & Excel</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('panitia')}
            className="col-span-2 sm:col-span-1 flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg bg-[#0B0E11] border border-[#2B3139] hover:border-[#F0B90B] hover:bg-[#1E2329] transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-[#F0B90B]/15 text-[#F0B90B] flex items-center justify-center shrink-0">
              {canAccess('panitia') ? (
                <BookOpen className="w-4 h-4" />
              ) : (
                <Lock className="w-4 h-4 text-[#848E9C]" />
              )}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#EAECEF] truncate">Urus Panitia</div>
              <div className="text-[10px] text-[#848E9C] truncate">Pelan & kewangan PCG</div>
            </div>
          </button>
        </div>
      </section>

      {/* 4 Kad Statistik Dinamik Utama */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4" aria-label="Statistik Utama">
        <button
          type="button"
          onClick={() => onNavigate('guru')}
          className="text-left bg-[#161A1E] rounded-xl border border-[#2B3139] p-5 hover:border-[#F0B90B]/60 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#848E9C]">Jumlah Guru</span>
            <div className="w-9 h-9 rounded-lg bg-[#F0B90B]/15 text-[#F0B90B] flex items-center justify-center">
              <Users className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-white tabular-nums">
            {stats.totalTeachers}
          </div>
          <p className="mt-1 text-xs text-[#848E9C]">
            Pegawai & staf simulasi berdaftar di SMK Salaping
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('tugasan')}
          className="text-left bg-[#161A1E] rounded-xl border border-[#2B3139] p-5 hover:border-[#F0B90B]/60 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#848E9C]">Tugasan Aktif</span>
            <div className="w-9 h-9 rounded-lg bg-[#0ECB81]/15 text-[#0ECB81] flex items-center justify-center">
              <CheckSquare className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-white tabular-nums">
            {stats.activeTasksCount}
          </div>
          <p className="mt-1 text-xs text-[#848E9C] tabular-nums">
            Daripada {stats.totalTasks} rekod ({stats.completedTasksCount} selesai)
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('program')}
          className="text-left bg-[#161A1E] rounded-xl border border-[#2B3139] p-5 hover:border-[#F0B90B]/60 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#848E9C]">Program Akan Datang</span>
            <div className="w-9 h-9 rounded-lg bg-[#F0B90B]/15 text-[#F0B90B] flex items-center justify-center">
              <CalendarClock className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-white tabular-nums">
            {stats.upcomingProgramsCount}
          </div>
          <p className="mt-1 text-xs text-[#848E9C] tabular-nums">
            Daripada {stats.totalPrograms} program · {state.calendarEvents.length} acara takwim
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('laporan')}
          className="text-left bg-[#161A1E] rounded-xl border border-[#2B3139] p-5 hover:border-[#F0B90B]/60 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#848E9C]">Jumlah Laporan</span>
            <div className="w-9 h-9 rounded-lg bg-[#0ECB81]/15 text-[#0ECB81] flex items-center justify-center">
              <FileText className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-white tabular-nums">
            {stats.totalReportsCount}
          </div>
          <p className="mt-1 text-xs text-[#848E9C] tabular-nums">
            {stats.docReportsCount} dokumen minit/laporan + {stats.programReportsCount} laporan program
          </p>
        </button>
      </section>

      {/* Paparan Khusus Mengikut Peranan (7 Peranan) */}
      <section className="bg-[#161A1E] rounded-xl border border-[#F0B90B]/30 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#2B3139]">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#F0B90B]" />
              <h2 className="text-sm font-bold text-[#EAECEF]">{roleFocusConfig.heading}</h2>
            </div>
            <p className="text-xs text-[#848E9C] mt-0.5">{roleFocusConfig.summary}</p>
          </div>
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded bg-[#0B0E11] border border-[#2B3139] text-[#F0B90B] self-start sm:self-auto whitespace-nowrap">
            Simulasi Peranan: {getRoleDisplayLabel(activeRole)}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          {roleFocusConfig.cards.map((card) => (
            <div
              key={card.label}
              className="p-4 rounded-lg bg-[#0B0E11] border border-[#2B3139] space-y-1"
            >
              <div className="text-xs text-[#848E9C]">{card.label}</div>
              <div className={`text-xl font-extrabold font-mono tabular-nums ${card.tone}`}>
                {card.value}
              </div>
              <div className="text-[11px] text-[#848E9C]">{card.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Main 2-Column Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-6">
          {/* Senarai Tugasan Terkini (ditapis mengikut konteks peranan jika Guru/Staf/Ketua Panitia) */}
          <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#2B3139]">
              <div>
                <h2 className="text-base font-bold text-[#EAECEF]">
                  {activeRole === 'Guru'
                    ? 'Tugasan Berkaitan Anda'
                    : activeRole === 'Staf'
                      ? 'Tugasan Operasi & Aset'
                      : 'Senarai Tugasan Terkini'}
                </h2>
                <p className="text-xs text-[#848E9C]">
                  Tugasan pentadbiran dan kurikulum semasa ({roleSpecificTasks.length} dipaparkan)
                </p>
              </div>
              {canAccess('tugasan') && (
                <button
                  type="button"
                  onClick={() => onNavigate('tugasan')}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#F0B90B] hover:text-[#F8D12F] whitespace-nowrap"
                >
                  Lihat Semua
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="divide-y divide-[#2B3139]">
              {roleSpecificTasks.length === 0 ? (
                <div className="p-6 text-center text-sm text-[#848E9C]">
                  Tiada tugasan direkodkan buat masa ini.
                </div>
              ) : (
                roleSpecificTasks.map((task) => {
                  const StatusIcon =
                    task.status === 'Selesai'
                      ? CheckCircle2
                      : task.status === 'Dalam Proses'
                        ? Clock
                        : AlertCircle;
                  const statusTone =
                    task.status === 'Selesai'
                      ? 'text-[#0ECB81]'
                      : task.status === 'Dalam Proses'
                        ? 'text-[#F0B90B]'
                        : 'text-[#F6465D]';

                  return (
                    <div
                      key={task.id}
                      className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[#1E2329]/70 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#EAECEF] truncate">
                          {task.tajuk}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[#848E9C] mt-0.5">
                          <span>{task.pegawai}</span>
                          <span aria-hidden="true">·</span>
                          <span className="tabular-nums">
                            Akhir: {formatShortDate(task.tarikhAkhir)}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>Keutamaan: {task.keutamaan}</span>
                        </div>
                      </div>
                      <div
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap shrink-0 ${statusTone}`}
                      >
                        <StatusIcon className="w-3.5 h-3.5" />
                        <span>{task.status}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Ringkasan Aktiviti Pengurusan / Aduan Aset untuk Staf */}
          {activeRole === 'Staf' ? (
            <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#2B3139]">
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-[#F6465D]" />
                  <div>
                    <h2 className="text-base font-bold text-[#EAECEF]">
                      Aduan Kerosakan & Penyelenggaraan Aset
                    </h2>
                    <p className="text-xs text-[#848E9C]">Keutamaan tindakan pejabat pentadbiran</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('aset')}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#F0B90B] hover:text-[#F8D12F]"
                >
                  Urus Aset <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="divide-y divide-[#2B3139]">
                {state.damageReports.map((rep) => (
                  <div key={rep.id} className="px-5 py-3.5 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#EAECEF]">{rep.namaAset}</p>
                      <p className="text-xs text-[#848E9C] mt-0.5">{rep.keterangan}</p>
                      <p className="text-[11px] text-[#848E9C] mt-1">
                        {rep.lokasi} · Pelapor: {rep.pelapor}
                      </p>
                    </div>
                    <span className="text-[11px] font-bold text-[#F0B90B] shrink-0">
                      {rep.statusTindakan}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#2B3139]">
                <div>
                  <h2 className="text-base font-bold text-[#EAECEF]">
                    Ringkasan Aktiviti Pengurusan
                  </h2>
                  <p className="text-xs text-[#848E9C]">Petunjuk operasi dan jejak aktiviti terkini</p>
                </div>
                <Activity className="w-4 h-4 text-[#F0B90B]" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#2B3139] border-b border-[#2B3139]">
                <div className="p-4">
                  <div className="text-xs text-[#848E9C]">GPS Percubaan SPM</div>
                  <div className="text-xl font-extrabold text-[#0ECB81] font-mono tabular-nums mt-1">
                    {stats.currentGPS.toFixed(2)}
                  </div>
                  <div className="text-[11px] text-[#848E9C] mt-0.5">
                    {state.examRecords.length} rekod mata pelajaran
                  </div>
                </div>
                <div className="p-4">
                  <div className="text-xs text-[#848E9C]">Baki PCG Panitia</div>
                  <div className="text-xl font-extrabold text-[#F0B90B] font-mono tabular-nums mt-1">
                    {formatCurrencyRM(stats.totalPcgBalance)}
                  </div>
                  <div className="text-[11px] text-[#848E9C] mt-0.5">
                    Merentasi {state.panitiaList.length} panitia aktif
                  </div>
                </div>
                <div className="p-4">
                  <div className="text-xs text-[#848E9C]">Aduan Aset Terbuka</div>
                  <div className="text-xl font-extrabold text-[#F6465D] font-mono tabular-nums mt-1">
                    {stats.openDamageCount} kes
                  </div>
                  <div className="text-[11px] text-[#848E9C] mt-0.5">
                    {stats.studentsInInterventionCount} murid dalam intervensi
                  </div>
                </div>
              </div>

              <div className="divide-y divide-[#2B3139]">
                {state.activityLogs.slice(0, 4).map((log) => (
                  <div key={log.id} className="px-5 py-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[#EAECEF]">{log.tindakan}</p>
                      <p className="text-[11px] text-[#848E9C] mt-0.5">
                        {log.pelaku} · {log.modul}
                      </p>
                    </div>
                    <span className="text-[11px] text-[#848E9C] tabular-nums whitespace-nowrap shrink-0">
                      {log.masa}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="lg:col-span-5 space-y-6">
          {/* Pengumuman Sekolah */}
          <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#2B3139]">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-[#F0B90B]" />
                <h2 className="text-base font-bold text-[#EAECEF]">Pengumuman Sekolah</h2>
              </div>
              {capabilities.canPostAnnouncements && (
                <button
                  type="button"
                  onClick={() => setIsAnnModalOpen(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-[#0B0E11] bg-[#F0B90B] rounded-lg hover:bg-[#F8D12F] transition-colors whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Siar Baru
                </button>
              )}
            </div>

            <div className="divide-y divide-[#2B3139]">
              {state.announcements.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#848E9C]">
                  Tiada pengumuman sekolah buat masa ini.
                </div>
              ) : (
                state.announcements.map((ann) => (
                  <div key={ann.id} className="p-5 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-bold text-[#EAECEF] leading-snug">
                        {ann.tajuk}
                      </h3>
                      {capabilities.canPostAnnouncements && (
                        <button
                          type="button"
                          onClick={() => setDeleteAnnTarget(ann)}
                          className="p-1 text-[#848E9C] hover:text-[#F6465D] rounded transition-colors shrink-0"
                          aria-label={`Padam pengumuman ${ann.tajuk}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-[#848E9C] leading-relaxed">{ann.kandungan}</p>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#848E9C] pt-1">
                      <span
                        className={`font-semibold ${
                          ann.keutamaan === 'Penting' ? 'text-[#F6465D]' : 'text-[#0ECB81]'
                        }`}
                      >
                        {ann.keutamaan}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{ann.pengarang}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{formatShortDate(ann.tarikh)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Aktiviti & Program Akan Datang */}
          <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#2B3139]">
              <div>
                <h2 className="text-base font-bold text-[#EAECEF]">Aktiviti & Program Akan Datang</h2>
                <p className="text-xs text-[#848E9C]">Jadual program & takwim terdekat</p>
              </div>
              {canAccess('takwim') && (
                <button
                  type="button"
                  onClick={() => onNavigate('takwim')}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#F0B90B] hover:text-[#F8D12F] whitespace-nowrap"
                >
                  Takwim
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="divide-y divide-[#2B3139]">
              {upcomingPrograms.map((prog) => (
                <div key={prog.id} className="px-5 py-3.5 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#EAECEF]">{prog.nama}</p>
                    <p className="text-xs text-[#848E9C] mt-0.5">
                      Penyelaras: {prog.penyelaras}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-semibold text-[#F0B90B] tabular-nums">
                      {formatShortDate(prog.tarikh)}
                    </div>
                    <div className="text-[11px] text-[#848E9C] mt-0.5">{prog.status}</div>
                  </div>
                </div>
              ))}
              {upcomingEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="px-5 py-3 flex items-start justify-between gap-3 bg-[#1E2329]/50"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#EAECEF]">{evt.tajuk}</p>
                    <p className="text-[11px] text-[#848E9C] mt-0.5">
                      {evt.kategori} · {evt.lokasi}
                    </p>
                  </div>
                  <span className="text-[11px] font-medium text-[#0ECB81] tabular-nums shrink-0">
                    {formatShortDate(evt.tarikh)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Siar Pengumuman Baru */}
      <Modal
        isOpen={isAnnModalOpen}
        onClose={() => setIsAnnModalOpen(false)}
        title="Siar Pengumuman Sekolah"
        subtitle="Makluman akan dipaparkan terus di papan pemuka semua warga sekolah."
      >
        <form onSubmit={handleSubmitAnnouncement} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
              Tajuk Pengumuman
            </label>
            <input
              type="text"
              required
              value={annTitle}
              onChange={(e) => setAnnTitle(e.target.value)}
              placeholder="Contoh: Jadual Mesyuarat Guru Bil. 5/2026"
              className="w-full px-3.5 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] placeholder:text-[#707A8A] border border-[#2B3139] rounded-lg focus:outline-none focus:border-[#F0B90B]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
              Tahap Keutamaan
            </label>
            <select
              value={annPriority}
              onChange={(e) => setAnnPriority(e.target.value as 'Biasa' | 'Penting')}
              className="w-full px-3.5 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg focus:outline-none focus:border-[#F0B90B]"
            >
              <option value="Biasa">Biasa</option>
              <option value="Penting">Penting</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
              Kandungan Makluman
            </label>
            <textarea
              rows={4}
              required
              value={annBody}
              onChange={(e) => setAnnBody(e.target.value)}
              placeholder="Nyatakan butiran lengkap tarikh, masa dan tindakan yang diperlukan..."
              className="w-full px-3.5 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] placeholder:text-[#707A8A] border border-[#2B3139] rounded-lg focus:outline-none focus:border-[#F0B90B]"
            />
          </div>
          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setIsAnnModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-[#EAECEF] bg-[#1E2329] border border-[#2B3139] rounded-lg hover:bg-[#2B3139]"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-bold text-[#0B0E11] bg-[#F0B90B] rounded-lg hover:bg-[#F8D12F]"
            >
              Siarkan Pengumuman
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Tambah Tugasan Pantas */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title="Tambah Tugasan Pantas"
        subtitle="Tugasan akan disimpan ke Modul Pengurusan Tugasan serta mengemaskini statistik dan pemberitahuan."
      >
        <form onSubmit={handleQuickAddTask} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
              Tajuk Tugasan
            </label>
            <input
              type="text"
              required
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="Contoh: Pengesahan Jadual Peperiksaan Akhir Tahun"
              className="w-full px-3.5 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg focus:outline-none focus:border-[#F0B90B]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
              Keterangan Ringkas
            </label>
            <textarea
              rows={2}
              value={taskDesc}
              onChange={(e) => setTaskDesc(e.target.value)}
              placeholder="Butiran tindakan yang perlu disempurnakan..."
              className="w-full px-3.5 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg focus:outline-none focus:border-[#F0B90B]"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">Pegawai</label>
              <select
                value={taskAssignee}
                onChange={(e) => setTaskAssignee(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              >
                {state.teachers.map((t) => (
                  <option key={t.id} value={t.nama}>
                    {t.nama}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
                Tarikh Akhir
              </label>
              <input
                type="date"
                required
                value={taskDue}
                onChange={(e) => setTaskDue(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">Keutamaan</label>
              <select
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 text-xs bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              >
                <option value="Rendah">Rendah</option>
                <option value="Sederhana">Sederhana</option>
                <option value="Tinggi">Tinggi</option>
                <option value="Segera">Segera</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setIsTaskModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-[#EAECEF] bg-[#1E2329] border border-[#2B3139] rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-bold text-[#0B0E11] bg-[#F0B90B] rounded-lg hover:bg-[#F8D12F]"
            >
              Simpan Tugasan
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Tambah Program Pantas */}
      <Modal
        isOpen={isProgramModalOpen}
        onClose={() => setIsProgramModalOpen(false)}
        title="Tambah Program Sekolah Pantas"
        subtitle="Program akan didaftarkan ke Modul Program Sekolah serta dikira dalam statistik semasa."
      >
        <form onSubmit={handleQuickAddProgram} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
              Nama Program
            </label>
            <input
              type="text"
              required
              value={progName}
              onChange={(e) => setProgName(e.target.value)}
              placeholder="Contoh: Kem Pecutan Awal SPM 2027"
              className="w-full px-3.5 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg focus:outline-none focus:border-[#F0B90B]"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
                Tarikh Pelaksanaan
              </label>
              <input
                type="date"
                required
                value={progDate}
                onChange={(e) => setProgDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
                Anggaran Peruntukan (RM)
              </label>
              <input
                type="number"
                min="0"
                step="50"
                value={progBudget}
                onChange={(e) => setProgBudget(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
                Penyelaras
              </label>
              <select
                value={progLead}
                onChange={(e) => setProgLead(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              >
                {state.teachers.map((t) => (
                  <option key={t.id} value={t.nama}>
                    {t.nama}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">Status</label>
              <select
                value={progStatus}
                onChange={(e) => setProgStatus(e.target.value as ProgramStatus)}
                className="w-full px-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              >
                <option value="Dirancang">Dirancang</option>
                <option value="Dalam Persiapan">Dalam Persiapan</option>
                <option value="Sedang Berjalan">Sedang Berjalan</option>
                <option value="Selesai">Selesai</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setIsProgramModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-[#EAECEF] bg-[#1E2329] border border-[#2B3139] rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-bold text-[#0B0E11] bg-[#F0B90B] rounded-lg hover:bg-[#F8D12F]"
            >
              Simpan Program
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDeleteModal
        isOpen={Boolean(deleteAnnTarget)}
        onClose={() => setDeleteAnnTarget(null)}
        onConfirm={() => {
          if (deleteAnnTarget) onDeleteAnnouncement(deleteAnnTarget.id);
        }}
        itemName={deleteAnnTarget?.tajuk ?? ''}
      />
    </div>
  );
};
