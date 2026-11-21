import { useEffect, useMemo, useState } from 'react';
import {
  AcademicV14State,
  AnnouncementItem,
  AssetItem,
  CalendarEvent,
  DamageReport,
  DocCenterSubmenuId,
  DocCenterV15State,
  EduSchoolState,
  ModuleId,
  NotificationItem,
  PanitiaItem,
  SchoolProgram,
  StudentRecord,
  TaskItem,
  TeacherItem,
  UserRole,
} from './types/eduschool';
import { storageService } from './services/storageService';
import { INITIAL_ACADEMIC_V14_STATE } from './data/academicDemoData';
import { INITIAL_DOC_CENTER_V15_STATE } from './data/docCenterDemoData';
import { buildSyncedExamRecords } from './utils/academicCalcHelper';
import { syncLegacyDocuments } from './utils/docCenterHelpers';
import {
  getRoleDisplayLabel,
  ROLE_MODULE_ACCESS,
  ROLE_PROFILES,
} from './utils/rolePermissions';
import { buildMergedNotifications } from './utils/reportHelpers';
import {
  generateNextTaskCode,
  getCurrentDateTimeLabel,
  normalizeTaskItem,
} from './utils/taskHelpers';
import {
  generateNextPanitiaCode,
  normalizePanitiaItem,
} from './utils/panitiaHelpers';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { ToastContainer, ToastMessage } from './components/common/ToastContainer';
import { DashboardModule } from './components/modules/DashboardModule';
import { TaskModule } from './components/modules/TaskModule';
import { PanitiaModule } from './components/modules/PanitiaModule';
import { AcademicModule } from './components/modules/AcademicModule';
import { StudentModule } from './components/modules/StudentModule';
import { DocumentModule } from './components/modules/DocumentModule';
import { CalendarModule } from './components/modules/CalendarModule';
import { AssetModule } from './components/modules/AssetModule';
import { TeacherModule } from './components/modules/TeacherModule';
import { ProgramModule } from './components/modules/ProgramModule';
import { ReportModule } from './components/modules/ReportModule';
import { AiAssistantModule } from './components/modules/AiAssistantModule';

export default function App() {
  const [appState, setAppState] = useState<EduSchoolState>(() => storageService.loadState());
  const [activeModule, setActiveModule] = useState<ModuleId>('dashboard');
  const [activeDocSubmenu, setActiveDocSubmenu] = useState<DocCenterSubmenuId>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [dismissedAutoNotifIds, setDismissedAutoNotifIds] = useState<string[]>([]);

  // Simpan setiap perubahan secara automatik ke localStorage
  useEffect(() => {
    storageService.saveState(appState);
  }, [appState]);

  const mergedNotifications = useMemo(
    () => buildMergedNotifications(appState, dismissedAutoNotifIds),
    [appState, dismissedAutoNotifIds]
  );

  const showToast = (type: ToastMessage['type'], title: string, message?: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3600);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const logActivity = (tindakan: string, modul: string) => {
    const actor = ROLE_PROFILES[appState.activeRole].userName;
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    return {
      id: `log-${Date.now()}`,
      tindakan,
      pelaku: actor,
      modul,
      masa: `Hari ini, ${hh}:${mm}`,
    };
  };

  // Pertukaran Peranan Demo
  const handleChangeRole = (newRole: UserRole) => {
    const allowed = ROLE_MODULE_ACCESS[newRole];
    const nextModule = allowed.includes(activeModule) ? activeModule : 'dashboard';
    setAppState((prev) => ({ ...prev, activeRole: newRole }));
    setActiveModule(nextModule);
    showToast(
      'info',
      `Simulasi Peranan: ${getRoleDisplayLabel(newRole)}`,
      `Bertukar ke paparan profil ${ROLE_PROFILES[newRole].userName}.`
    );
  };

  const handleNavigate = (moduleId: ModuleId) => {
    const allowed = ROLE_MODULE_ACCESS[appState.activeRole];
    if (!allowed.includes(moduleId)) {
      showToast(
        'error',
        'Akses Terhad bagi Peranan Semasa',
        `Peranan ${getRoleDisplayLabel(appState.activeRole)} tidak mempunyai akses ke modul ini dalam mod simulasi.`
      );
      return;
    }
    setActiveModule(moduleId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetDemoData = () => {
    const fresh = storageService.resetState();
    setAppState(fresh);
    setDismissedAutoNotifIds([]);
    setActiveModule('dashboard');
    showToast('success', 'Data Simulasi Diset Semula', 'Semua rekod dikembalikan ke keadaan asal.');
  };

  // Notifications
  const handleMarkNotificationRead = (id: string) => {
    if (id.startsWith('auto-')) {
      setDismissedAutoNotifIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
      return;
    }
    setAppState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => (n.id === id ? { ...n, dibaca: true } : n)),
    }));
  };

  const handleMarkAllRead = () => {
    const allAutoIds = mergedNotifications.filter((n) => n.isAuto).map((n) => n.id);
    setDismissedAutoNotifIds((prev) => Array.from(new Set([...prev, ...allAutoIds])));
    setAppState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({ ...n, dibaca: true })),
    }));
    showToast('success', 'Pemberitahuan Dikemaskini', 'Semua pemberitahuan ditandakan sebagai dibaca.');
  };

  // Announcements
  const handleAddAnnouncement = (item: Omit<AnnouncementItem, 'id' | 'tarikh' | 'pengarang'>) => {
    const profile = ROLE_PROFILES[appState.activeRole];
    const newAnn: AnnouncementItem = {
      ...item,
      id: `ann-${Date.now()}`,
      tarikh: new Date().toISOString().slice(0, 10),
      pengarang: `${profile.userName} (${getRoleDisplayLabel(profile.role)})`,
    };
    setAppState((prev) => ({
      ...prev,
      announcements: [newAnn, ...prev.announcements],
      activityLogs: [
        logActivity(`Menyiarkan pengumuman: ${item.tajuk}`, 'Papan Pemuka Utama'),
        ...prev.activityLogs,
      ],
    }));
    showToast('success', 'Pengumuman Disiarkan', item.tajuk);
  };

  const handleDeleteAnnouncement = (id: string) => {
    setAppState((prev) => ({
      ...prev,
      announcements: prev.announcements.filter((a) => a.id !== id),
    }));
    showToast('success', 'Pengumuman Dipadam');
  };

  // Tasks CRUD
  const handleAddTask = (task: Omit<TaskItem, 'id'>) => {
    const actorName = ROLE_PROFILES[appState.activeRole].userName;
    const nowLabel = getCurrentDateTimeLabel();

    setAppState((prev) => {
      const uniqueKod =
        task.kodTugasan && !prev.tasks.some((t) => t.kodTugasan === task.kodTugasan)
          ? task.kodTugasan
          : generateNextTaskCode(prev.tasks);

      let uniqueId = `tsk-${Date.now()}`;
      while (prev.tasks.some((t) => t.id === uniqueId)) {
        uniqueId = `tsk-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
      }

      const newTask: TaskItem = normalizeTaskItem({
        ...task,
        id: uniqueId,
        kodTugasan: uniqueKod,
        pemberiArahan: task.pemberiArahan || actorName,
        sejarahStatus:
          task.sejarahStatus && task.sejarahStatus.length > 0
            ? task.sejarahStatus
            : [
                {
                  id: `hist-${Date.now()}`,
                  statusBaharu: task.status,
                  tarikhMasa: nowLabel,
                  oleh: task.pemberiArahan || actorName,
                  catatan: 'Tugasan didaftarkan ke dalam sistem.',
                },
              ],
        komen: task.komen ?? [],
        evidens: task.evidens ?? [],
      });

      const newNotif: NotificationItem = {
        id: `not-tsk-${Date.now()}`,
        tajuk: 'Tugasan Baharu Didaftarkan',
        mesej: `[${uniqueKod}] ${task.tajuk} diagihkan kepada ${task.pegawai} (Akhir: ${task.tarikhAkhir}).`,
        masa: 'Baru sebentar',
        dibaca: false,
        modulSasaran: 'tugasan',
        kategori: 'tugasan_baharu',
      };

      return {
        ...prev,
        tasks: [newTask, ...prev.tasks],
        notifications: [newNotif, ...prev.notifications],
        activityLogs: [
          logActivity(`Menambah tugasan [${uniqueKod}]: ${task.tajuk}`, 'Pengurusan Tugasan'),
          ...prev.activityLogs,
        ],
      };
    });
    showToast('success', 'Tugasan Berjaya Ditambah', task.tajuk);
  };

  const handleUpdateTask = (updated: TaskItem) => {
    const actorName = ROLE_PROFILES[appState.activeRole].userName;
    const nowLabel = getCurrentDateTimeLabel();

    setAppState((prev) => {
      const existing = prev.tasks.find((t) => t.id === updated.id);
      let nextHistory = updated.sejarahStatus ?? existing?.sejarahStatus ?? [];
      if (existing && existing.status !== updated.status) {
        const alreadyLoggedSame =
          nextHistory.length > 0 &&
          nextHistory.length > (existing.sejarahStatus?.length ?? 0);
        if (!alreadyLoggedSame) {
          nextHistory = [
            ...nextHistory,
            {
              id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
              statusLama: existing.status,
              statusBaharu: updated.status,
              tarikhMasa: nowLabel,
              oleh: actorName,
              catatan: `Status ditukar daripada ${existing.status} kepada ${updated.status}.`,
            },
          ];
        }
      }

      const normalizedUpdated = normalizeTaskItem({
        ...updated,
        sejarahStatus: nextHistory,
      });

      return {
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === updated.id ? normalizedUpdated : t)),
        activityLogs: [
          logActivity(
            `Mengemaskini tugasan (${normalizedUpdated.status}): ${normalizedUpdated.tajuk}`,
            'Pengurusan Tugasan'
          ),
          ...prev.activityLogs,
        ],
      };
    });
    showToast('success', 'Tugasan Dikemaskini', `${updated.tajuk} · ${updated.status}`);
  };

  const handleDeleteTask = (id: string) => {
    const target = appState.tasks.find((t) => t.id === id);
    setAppState((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== id),
      activityLogs: target
        ? [
            logActivity(`Memadam tugasan: ${target.tajuk}`, 'Pengurusan Tugasan'),
            ...prev.activityLogs,
          ]
        : prev.activityLogs,
    }));
    showToast('success', 'Tugasan Dipadam');
  };

  // Panitia CRUD
  const handleAddPanitia = (item: Omit<PanitiaItem, 'id'>) => {
    setAppState((prev) => {
      const uniqueKod =
        item.kodPanitia && !prev.panitiaList.some((p) => p.kodPanitia === item.kodPanitia)
          ? item.kodPanitia
          : generateNextPanitiaCode(prev.panitiaList);

      let uniqueId = `pan-${Date.now()}`;
      while (prev.panitiaList.some((p) => p.id === uniqueId)) {
        uniqueId = `pan-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
      }

      const newPan = normalizePanitiaItem({
        ...item,
        id: uniqueId,
        kodPanitia: uniqueKod,
      });

      return {
        ...prev,
        panitiaList: [...prev.panitiaList, newPan],
        activityLogs: [
          logActivity(`Mendaftarkan panitia baharu [${uniqueKod}]: ${item.nama}`, 'Pengurusan Panitia'),
          ...prev.activityLogs,
        ],
      };
    });
    showToast('success', 'Panitia Ditambah', item.nama);
  };

  const handleUpdatePanitia = (updated: PanitiaItem) => {
    const normalized = normalizePanitiaItem(updated);
    setAppState((prev) => ({
      ...prev,
      panitiaList: prev.panitiaList.map((p) => (p.id === normalized.id ? normalized : p)),
      activityLogs: [
        logActivity(`Mengemaskini rekod panitia: ${normalized.nama}`, 'Pengurusan Panitia'),
        ...prev.activityLogs,
      ],
    }));
    showToast('success', 'Maklumat Panitia Disimpan', normalized.nama);
  };

  const handleDeletePanitia = (id: string) => {
    const target = appState.panitiaList.find((p) => p.id === id);
    setAppState((prev) => ({
      ...prev,
      panitiaList: prev.panitiaList.filter((p) => p.id !== id),
      activityLogs: target
        ? [
            logActivity(`Memadam panitia: ${target.nama}`, 'Pengurusan Panitia'),
            ...prev.activityLogs,
          ]
        : prev.activityLogs,
    }));
    showToast('success', 'Panitia Dipadam');
  };

  // Akademik & Peperiksaan V1.4 (diselaraskan dengan examRecords Papan Pemuka/Panitia/Laporan)
  const handleUpdateAcademicV14 = (
    updater: (prev: AcademicV14State) => AcademicV14State,
    logActionText?: string,
    toastTitle?: string,
    toastMessage?: string
  ) => {
    setAppState((prev) => {
      const currentV14 = prev.academicV14 ?? INITIAL_ACADEMIC_V14_STATE;
      const nextV14 = updater(currentV14);
      const syncedExamRecords = buildSyncedExamRecords(nextV14);
      return {
        ...prev,
        academicV14: nextV14,
        examRecords: syncedExamRecords,
        activityLogs: logActionText
          ? [
              logActivity(logActionText, 'Analisis Akademik dan Peperiksaan'),
              ...prev.activityLogs,
            ]
          : prev.activityLogs,
      };
    });
    if (toastTitle) {
      showToast('success', toastTitle, toastMessage);
    }
  };

  // Students CRUD
  const handleAddStudent = (student: Omit<StudentRecord, 'id'>) => {
    const newStudent: StudentRecord = { ...student, id: `std-${Date.now()}` };
    setAppState((prev) => ({
      ...prev,
      students: [newStudent, ...prev.students],
      activityLogs: [
        logActivity(`Menambah rekod pemantauan murid: ${student.nama}`, 'Pemantauan Murid'),
        ...prev.activityLogs,
      ],
    }));
    showToast('success', 'Rekod Murid Ditambah', student.nama);
  };

  const handleUpdateStudent = (updated: StudentRecord) => {
    setAppState((prev) => ({
      ...prev,
      students: prev.students.map((s) => (s.id === updated.id ? updated : s)),
    }));
    showToast('success', 'Rekod Murid Dikemaskini', updated.nama);
  };

  const handleDeleteStudent = (id: string) => {
    setAppState((prev) => ({
      ...prev,
      students: prev.students.filter((s) => s.id !== id),
    }));
    showToast('success', 'Rekod Murid Dipadam');
  };

  // Pusat Dokumentasi Digital Sekolah V1.5 (diselaraskan dengan state.documents)
  const handleUpdateDocCenterV15 = (
    updater: (prev: DocCenterV15State) => DocCenterV15State,
    logActionText?: string,
    toastTitle?: string,
    toastMessage?: string
  ) => {
    setAppState((prev) => {
      const currentV15 = prev.docCenterV15 ?? INITIAL_DOC_CENTER_V15_STATE;
      const nextV15 = updater(currentV15);
      return {
        ...prev,
        docCenterV15: nextV15,
        documents: syncLegacyDocuments(nextV15),
        activityLogs: logActionText
          ? [
              logActivity(logActionText, 'Pusat Dokumentasi Digital'),
              ...prev.activityLogs,
            ]
          : prev.activityLogs,
      };
    });
    if (toastTitle) {
      showToast('success', toastTitle, toastMessage);
    }
  };

  // Calendar Events CRUD
  const handleAddEvent = (evt: Omit<CalendarEvent, 'id'>) => {
    const newEvt: CalendarEvent = { ...evt, id: `evt-${Date.now()}` };
    setAppState((prev) => ({
      ...prev,
      calendarEvents: [...prev.calendarEvents, newEvt],
      activityLogs: [
        logActivity(`Menambah acara takwim: ${evt.tajuk}`, 'Takwim Sekolah'),
        ...prev.activityLogs,
      ],
    }));
    showToast('success', 'Acara Takwim Ditambah', evt.tajuk);
  };

  const handleUpdateEvent = (updated: CalendarEvent) => {
    setAppState((prev) => ({
      ...prev,
      calendarEvents: prev.calendarEvents.map((e) => (e.id === updated.id ? updated : e)),
    }));
    showToast('success', 'Acara Takwim Dikemaskini', updated.tajuk);
  };

  const handleDeleteEvent = (id: string) => {
    setAppState((prev) => ({
      ...prev,
      calendarEvents: prev.calendarEvents.filter((e) => e.id !== id),
    }));
    showToast('success', 'Acara Takwim Dipadam');
  };

  // Assets & Damage Reports CRUD
  const handleAddAsset = (item: Omit<AssetItem, 'id'>) => {
    const newAsset: AssetItem = { ...item, id: `ast-${Date.now()}` };
    setAppState((prev) => ({
      ...prev,
      assets: [newAsset, ...prev.assets],
      activityLogs: [
        logActivity(`Mendaftarkan aset baharu: ${item.nama}`, 'Pengurusan Aset'),
        ...prev.activityLogs,
      ],
    }));
    showToast('success', 'Aset Berjaya Didaftarkan', item.nama);
  };

  const handleUpdateAsset = (updated: AssetItem) => {
    setAppState((prev) => ({
      ...prev,
      assets: prev.assets.map((a) => (a.id === updated.id ? updated : a)),
    }));
    showToast('success', 'Rekod Aset Dikemaskini', updated.nama);
  };

  const handleDeleteAsset = (id: string) => {
    setAppState((prev) => ({
      ...prev,
      assets: prev.assets.filter((a) => a.id !== id),
    }));
    showToast('success', 'Rekod Aset Dipadam');
  };

  const handleAddDamageReport = (report: Omit<DamageReport, 'id'>) => {
    const newRep: DamageReport = { ...report, id: `dmg-${Date.now()}` };
    setAppState((prev) => ({
      ...prev,
      damageReports: [newRep, ...prev.damageReports],
      activityLogs: [
        logActivity(`Melaporkan kerosakan: ${report.namaAset}`, 'Pengurusan Aset'),
        ...prev.activityLogs,
      ],
    }));
    showToast('success', 'Aduan Kerosakan Dihantar', report.namaAset);
  };

  const handleUpdateDamageReport = (updated: DamageReport) => {
    setAppState((prev) => ({
      ...prev,
      damageReports: prev.damageReports.map((d) => (d.id === updated.id ? updated : d)),
    }));
    showToast('success', 'Status Aduan Dikemaskini', updated.statusTindakan);
  };

  // Teachers CRUD
  const handleAddTeacher = (teacher: Omit<TeacherItem, 'id'>) => {
    const newTeacher: TeacherItem = { ...teacher, id: `t-${Date.now()}` };
    setAppState((prev) => ({
      ...prev,
      teachers: [...prev.teachers, newTeacher],
      activityLogs: [
        logActivity(`Mendaftarkan guru/staf: ${teacher.nama}`, 'Pengurusan Guru'),
        ...prev.activityLogs,
      ],
    }));
    showToast('success', 'Rekod Guru Ditambah', teacher.nama);
  };

  const handleUpdateTeacher = (updated: TeacherItem) => {
    setAppState((prev) => ({
      ...prev,
      teachers: prev.teachers.map((t) => (t.id === updated.id ? updated : t)),
    }));
    showToast('success', 'Maklumat Guru Dikemaskini', updated.nama);
  };

  const handleDeleteTeacher = (id: string) => {
    setAppState((prev) => ({
      ...prev,
      teachers: prev.teachers.filter((t) => t.id !== id),
    }));
    showToast('success', 'Rekod Guru Dipadam');
  };

  // Programs CRUD
  const handleAddProgram = (program: Omit<SchoolProgram, 'id'>) => {
    const newProg: SchoolProgram = { ...program, id: `prg-${Date.now()}` };
    const newNotif: NotificationItem = {
      id: `not-prg-${Date.now()}`,
      tajuk: 'Program Sekolah Baharu',
      mesej: `${program.nama} (${program.status}) dijadualkan pada ${program.tarikh}.`,
      masa: 'Baru sebentar',
      dibaca: false,
      modulSasaran: 'program',
      kategori: 'program',
    };
    setAppState((prev) => ({
      ...prev,
      programs: [newProg, ...prev.programs],
      notifications: [newNotif, ...prev.notifications],
      activityLogs: [
        logActivity(`Mendaftarkan program sekolah: ${program.nama}`, 'Program Sekolah'),
        ...prev.activityLogs,
      ],
    }));
    showToast('success', 'Program Sekolah Ditambah', program.nama);
  };

  const handleUpdateProgram = (updated: SchoolProgram) => {
    setAppState((prev) => ({
      ...prev,
      programs: prev.programs.map((p) => (p.id === updated.id ? updated : p)),
    }));
    showToast('success', 'Program Sekolah Dikemaskini', updated.nama);
  };

  const handleDeleteProgram = (id: string) => {
    setAppState((prev) => ({
      ...prev,
      programs: prev.programs.filter((p) => p.id !== id),
    }));
    showToast('success', 'Program Sekolah Dipadam');
  };

  const backToDashboard = () => handleNavigate('dashboard');

  return (
    <div className="min-h-screen flex bg-[#0B0E11] text-[#EAECEF]">
      <Sidebar
        activeModule={activeModule}
        onSelectModule={handleNavigate}
        activeDocSubmenu={activeDocSubmenu}
        onSelectDocSubmenu={(submenu) => {
          setActiveDocSubmenu(submenu);
          handleNavigate('dokumentasi');
        }}
        activeRole={appState.activeRole}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          appState={appState}
          activeModule={activeModule}
          activeRole={appState.activeRole}
          onChangeRole={handleChangeRole}
          notifications={mergedNotifications}
          onMarkNotificationRead={handleMarkNotificationRead}
          onMarkAllRead={handleMarkAllRead}
          onNavigateModule={handleNavigate}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onResetDemoData={handleResetDemoData}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          {activeModule === 'dashboard' && (
            <DashboardModule
              state={appState}
              activeRole={appState.activeRole}
              onNavigate={handleNavigate}
              onAddAnnouncement={handleAddAnnouncement}
              onDeleteAnnouncement={handleDeleteAnnouncement}
              onAddTask={handleAddTask}
              onAddProgram={handleAddProgram}
              onNotifyRestricted={(title, message) => showToast('info', title, message)}
            />
          )}
          {activeModule === 'tugasan' && (
            <TaskModule
              tasks={appState.tasks}
              teachers={appState.teachers}
              activeRole={appState.activeRole}
              onBackToDashboard={backToDashboard}
              onAddTask={handleAddTask}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              onNotify={(type, title, message) => showToast(type, title, message)}
            />
          )}
          {activeModule === 'panitia' && (
            <PanitiaModule
              panitiaList={appState.panitiaList}
              teachers={appState.teachers}
              documents={appState.documents}
              examRecords={appState.examRecords}
              activeRole={appState.activeRole}
              onBackToDashboard={backToDashboard}
              onAddPanitia={handleAddPanitia}
              onUpdatePanitia={handleUpdatePanitia}
              onDeletePanitia={handleDeletePanitia}
              onNotify={(type, title, message) => showToast(type, title, message)}
            />
          )}
          {activeModule === 'akademik' && (
            <AcademicModule
              academicV14={appState.academicV14 ?? INITIAL_ACADEMIC_V14_STATE}
              teachers={appState.teachers}
              panitiaList={appState.panitiaList}
              activeRole={appState.activeRole}
              onBackToDashboard={backToDashboard}
              onUpdateAcademicV14={handleUpdateAcademicV14}
              onNotify={(type, title, message) => showToast(type, title, message)}
            />
          )}
          {activeModule === 'murid' && (
            <StudentModule
              students={appState.students}
              teachers={appState.teachers}
              activeRole={appState.activeRole}
              onBackToDashboard={backToDashboard}
              onAddStudent={handleAddStudent}
              onUpdateStudent={handleUpdateStudent}
              onDeleteStudent={handleDeleteStudent}
            />
          )}
          {activeModule === 'dokumentasi' && (
            <DocumentModule
              docCenterV15={appState.docCenterV15 ?? INITIAL_DOC_CENTER_V15_STATE}
              teachers={appState.teachers}
              activeRole={appState.activeRole}
              activeSubmenu={activeDocSubmenu}
              onChangeSubmenu={setActiveDocSubmenu}
              onBackToDashboard={backToDashboard}
              onUpdateDocCenterV15={handleUpdateDocCenterV15}
              onNotify={(type, title, message) => showToast(type, title, message)}
            />
          )}
          {activeModule === 'takwim' && (
            <CalendarModule
              events={appState.calendarEvents}
              teachers={appState.teachers}
              activeRole={appState.activeRole}
              onBackToDashboard={backToDashboard}
              onAddEvent={handleAddEvent}
              onUpdateEvent={handleUpdateEvent}
              onDeleteEvent={handleDeleteEvent}
            />
          )}
          {activeModule === 'aset' && (
            <AssetModule
              assets={appState.assets}
              damageReports={appState.damageReports}
              teachers={appState.teachers}
              activeRole={appState.activeRole}
              onBackToDashboard={backToDashboard}
              onAddAsset={handleAddAsset}
              onUpdateAsset={handleUpdateAsset}
              onDeleteAsset={handleDeleteAsset}
              onAddDamageReport={handleAddDamageReport}
              onUpdateDamageReport={handleUpdateDamageReport}
            />
          )}
          {activeModule === 'guru' && (
            <TeacherModule
              teachers={appState.teachers}
              activeRole={appState.activeRole}
              onBackToDashboard={backToDashboard}
              onAddTeacher={handleAddTeacher}
              onUpdateTeacher={handleUpdateTeacher}
              onDeleteTeacher={handleDeleteTeacher}
            />
          )}
          {activeModule === 'program' && (
            <ProgramModule
              programs={appState.programs}
              teachers={appState.teachers}
              activeRole={appState.activeRole}
              onBackToDashboard={backToDashboard}
              onAddProgram={handleAddProgram}
              onUpdateProgram={handleUpdateProgram}
              onDeleteProgram={handleDeleteProgram}
            />
          )}
          {activeModule === 'laporan' && (
            <ReportModule
              state={appState}
              activeRole={appState.activeRole}
              onBackToDashboard={backToDashboard}
              onNotifyExport={(format, fileName) =>
                showToast(
                  'success',
                  `Eksport ${format} Berjaya`,
                  `Fail ${fileName} telah dijana dan dimuat turun.`
                )
              }
            />
          )}
          {activeModule === 'ai-assistant' && (
            <AiAssistantModule state={appState} onBackToDashboard={backToDashboard} />
          )}
        </main>

        <footer className="px-6 py-4 border-t border-[#2B3139] bg-[#12161B] text-xs text-[#848E9C] flex flex-col sm:flex-row items-center justify-between gap-2 print:hidden">
          <span>
            EDUSCHOOL 360 Versi 1.6 · Sekolah Rintis SMK Salaping, Sabah
          </span>
          <span>
            Data Demonstrasi Sahaja · Bukan Rekod Murid atau Guru Sebenar (Simulasi Peranan dan Storan Tempatan)
          </span>
        </footer>
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
