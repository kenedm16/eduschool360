import React, { useMemo, useState } from 'react';
import {
  CheckSquare,
  Plus,
  Search,
  Edit3,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Eye,
  LayoutList,
  Columns3,
  BarChart3,
  ShieldCheck,
  RotateCcw,
  Lock,
  MessageSquare,
  Paperclip,
} from 'lucide-react';
import {
  TaskItem,
  TaskPriority,
  TaskStatus,
  TeacherItem,
  UserRole,
} from '../../types/eduschool';
import { formatShortDate } from '../../utils/formatters';
import { getRoleDisplayLabel } from '../../utils/rolePermissions';
import {
  TASK_PRIORITY_OPTIONS,
  TASK_STATUS_OPTIONS,
  TASK_UNITS,
  filterTasksByRoleScope,
  formatMonthLabelMY,
  getTaskCode,
  getTaskRolePermissions,
  getTodayIsoDate,
  isTaskOverdue,
} from '../../utils/taskHelpers';
import { ModuleHeader } from '../common/ModuleHeader';
import { EmptyState } from '../common/EmptyState';
import { ConfirmDeleteModal } from '../common/Modal';
import { TaskFormModal } from './tasks/TaskFormModal';
import { TaskDetailView } from './tasks/TaskDetailView';
import { TaskKanbanView } from './tasks/TaskKanbanView';
import { TaskReportView } from './tasks/TaskReportView';

interface TaskModuleProps {
  tasks: TaskItem[];
  teachers: TeacherItem[];
  activeRole: UserRole;
  onBackToDashboard: () => void;
  onAddTask: (task: Omit<TaskItem, 'id'>) => void;
  onUpdateTask: (task: TaskItem) => void;
  onDeleteTask: (id: string) => void;
  onNotify?: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

type TaskViewMode = 'jadual' | 'kanban' | 'laporan';
type ExtendedStatusFilter = 'Semua' | TaskStatus | 'Lewat';

export const TaskModule: React.FC<TaskModuleProps> = ({
  tasks,
  teachers,
  activeRole,
  onBackToDashboard,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onNotify,
}) => {
  const rolePermissions = useMemo(() => getTaskRolePermissions(activeRole), [activeRole]);
  const todayIso = getTodayIsoDate();

  // View & Selection State
  const [viewMode, setViewMode] = useState<TaskViewMode>('jadual');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Instant Search & 6-Way Filters
  const [search, setSearch] = useState('');
  const [teacherFilter, setTeacherFilter] = useState('Semua');
  const [unitFilter, setUnitFilter] = useState('Semua');
  const [statusFilter, setStatusFilter] = useState<ExtendedStatusFilter>('Semua');
  const [priorityFilter, setPriorityFilter] = useState<'Semua' | TaskPriority>('Semua');
  const [monthFilter, setMonthFilter] = useState('Semua');
  const [dueDateFilter, setDueDateFilter] = useState('');

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TaskItem | null>(null);

  // Scope tasks according to simulated role
  const scopedTasks = useMemo(
    () => filterTasksByRoleScope(tasks, activeRole),
    [tasks, activeRole]
  );

  // Selected Task for Detail Page (always synced with live state)
  const selectedTask = useMemo(
    () => (selectedTaskId ? tasks.find((t) => t.id === selectedTaskId) ?? null : null),
    [tasks, selectedTaskId]
  );

  // Dynamic 5 KPI Stat Cards
  const taskStats = useMemo(() => {
    const total = scopedTasks.length;
    const belumMula = scopedTasks.filter((t) => t.status === 'Belum Mula').length;
    const dalamProses = scopedTasks.filter((t) => t.status === 'Dalam Proses').length;
    const selesai = scopedTasks.filter((t) => t.status === 'Selesai').length;
    const lewat = scopedTasks.filter((t) => isTaskOverdue(t, todayIso)).length;
    return { total, belumMula, dalamProses, selesai, lewat };
  }, [scopedTasks, todayIso]);

  // Dynamic Filter Dropdown Options
  const availableTeachers = useMemo(() => {
    const set = new Set<string>([
      ...teachers.map((t) => t.nama),
      ...scopedTasks.map((t) => t.pegawai),
    ]);
    return Array.from(set).filter(Boolean).sort();
  }, [teachers, scopedTasks]);

  const availableUnits = useMemo(() => {
    const set = new Set<string>([
      ...TASK_UNITS,
      ...scopedTasks.map((t) => t.unit || '').filter(Boolean),
    ]);
    return Array.from(set);
  }, [scopedTasks]);

  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    scopedTasks.forEach((t) => {
      if (t.tarikhAkhir && t.tarikhAkhir.length >= 7) set.add(t.tarikhAkhir.slice(0, 7));
      if (t.tarikhMula && t.tarikhMula.length >= 7) set.add(t.tarikhMula.slice(0, 7));
    });
    return Array.from(set).sort();
  }, [scopedTasks]);

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return scopedTasks.filter((t, idx) => {
      const code = getTaskCode(t, idx).toLowerCase();
      const matchSearch =
        !q ||
        code.includes(q) ||
        t.tajuk.toLowerCase().includes(q) ||
        t.pegawai.toLowerCase().includes(q) ||
        (t.unit ?? '').toLowerCase().includes(q) ||
        (t.kategori ?? '').toLowerCase().includes(q) ||
        t.keterangan.toLowerCase().includes(q);

      const matchTeacher = teacherFilter === 'Semua' || t.pegawai === teacherFilter;
      const matchUnit = unitFilter === 'Semua' || (t.unit || 'Pentadbiran & Pengurusan') === unitFilter;
      const matchStatus =
        statusFilter === 'Semua'
          ? true
          : statusFilter === 'Lewat'
            ? isTaskOverdue(t, todayIso)
            : t.status === statusFilter;
      const matchPriority = priorityFilter === 'Semua' || t.keutamaan === priorityFilter;
      const matchMonth =
        monthFilter === 'Semua' ||
        (t.tarikhAkhir && t.tarikhAkhir.startsWith(monthFilter)) ||
        (t.tarikhMula && t.tarikhMula.startsWith(monthFilter));
      const matchDueDate = !dueDateFilter || t.tarikhAkhir === dueDateFilter;

      return (
        matchSearch &&
        matchTeacher &&
        matchUnit &&
        matchStatus &&
        matchPriority &&
        matchMonth &&
        matchDueDate
      );
    });
  }, [
    scopedTasks,
    search,
    teacherFilter,
    unitFilter,
    statusFilter,
    priorityFilter,
    monthFilter,
    dueDateFilter,
    todayIso,
  ]);

  const hasActiveFilters =
    Boolean(search.trim()) ||
    teacherFilter !== 'Semua' ||
    unitFilter !== 'Semua' ||
    statusFilter !== 'Semua' ||
    priorityFilter !== 'Semua' ||
    monthFilter !== 'Semua' ||
    Boolean(dueDateFilter);

  const resetAllFilters = () => {
    setSearch('');
    setTeacherFilter('Semua');
    setUnitFilter('Semua');
    setStatusFilter('Semua');
    setPriorityFilter('Semua');
    setMonthFilter('Semua');
    setDueDateFilter('');
  };

  const openCreateModal = () => {
    if (!rolePermissions.canCreate) {
      onNotify?.(
        'info',
        'Had Simulasi Peranan',
        `Peranan ${getRoleDisplayLabel(activeRole)} tidak dibenarkan mencipta arahan tugasan baharu dalam simulasi ini.`
      );
      return;
    }
    setEditingTask(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (task: TaskItem) => {
    if (!rolePermissions.canEditDetails) {
      onNotify?.(
        'info',
        'Had Simulasi Peranan',
        `Peranan ${getRoleDisplayLabel(activeRole)} hanya boleh melihat butiran atau mengemaskini status tugasan.`
      );
      return;
    }
    setEditingTask(task);
    setIsFormModalOpen(true);
  };

  const handleRequestDelete = (task: TaskItem) => {
    if (!rolePermissions.canDelete) {
      onNotify?.(
        'info',
        'Had Simulasi Peranan',
        `Peranan ${getRoleDisplayLabel(activeRole)} tidak dibenarkan memadam rekod tugasan.`
      );
      return;
    }
    setDeleteTarget(task);
  };

  const renderStatusBadge = (s: TaskStatus, overdue: boolean) => {
    const Icon = s === 'Selesai' ? CheckCircle2 : s === 'Dalam Proses' ? Clock : AlertCircle;
    const tone =
      s === 'Selesai'
        ? 'text-[#0ECB81]'
        : s === 'Dalam Proses'
          ? 'text-[#F0B90B]'
          : 'text-[#F6465D]';
    return (
      <div className="flex flex-wrap items-center gap-1.5 mt-1">
        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${tone}`}>
          <Icon className="w-3 h-3" />
          {s}
        </span>
        {overdue && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#F6465D]/15 text-[#F6465D]">
            <AlertTriangle className="w-2.5 h-2.5" />
            Lewat
          </span>
        )}
      </div>
    );
  };

  // Jika pengguna sedang membuka halaman butiran tugasan
  if (selectedTask) {
    return (
      <div className="space-y-6">
        <ModuleHeader
          title="PENGURUSAN TUGASAN"
          description="Pusat kawalan arahan, agihan dan pemantauan tugasan sekolah."
          onBackToDashboard={onBackToDashboard}
        />

        <TaskDetailView
          task={selectedTask}
          activeRole={activeRole}
          permissions={rolePermissions}
          onBack={() => setSelectedTaskId(null)}
          onEdit={openEditModal}
          onDelete={handleRequestDelete}
          onUpdateTask={onUpdateTask}
        />

        <TaskFormModal
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          editingTask={editingTask}
          allTasks={tasks}
          teachers={teachers}
          activeRole={activeRole}
          onSaveNew={onAddTask}
          onSaveEdit={onUpdateTask}
        />

        <ConfirmDeleteModal
          isOpen={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => {
            if (deleteTarget) {
              onDeleteTask(deleteTarget.id);
              if (selectedTaskId === deleteTarget.id) setSelectedTaskId(null);
            }
          }}
          itemName={deleteTarget?.tajuk ?? ''}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* A. Halaman Utama: Tajuk, Penerangan, Butang TAMBAH TUGASAN */}
      <ModuleHeader
        title="PENGURUSAN TUGASAN"
        description="Pusat kawalan arahan, agihan dan pemantauan tugasan sekolah."
        onBackToDashboard={onBackToDashboard}
        actions={
          <button
            type="button"
            onClick={openCreateModal}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-colors whitespace-nowrap ${
              rolePermissions.canCreate
                ? 'text-[#0B0E11] bg-[#F0B90B] hover:bg-[#F8D12F]'
                : 'text-[#848E9C] bg-[#1E2329] border border-[#2B3139] hover:border-[#F0B90B]/40'
            }`}
          >
            {rolePermissions.canCreate ? (
              <Plus className="w-4 h-4" />
            ) : (
              <Lock className="w-4 h-4" />
            )}
            TAMBAH TUGASAN
          </button>
        }
      />

      {/* I. Banner Simulasi Kawalan Peranan */}
      <div className="bg-[#161A1E] rounded-xl border border-[#F0B90B]/30 px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-[#F0B90B] shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <span className="font-bold text-[#EAECEF]">
              Simulasi Peranan ({getRoleDisplayLabel(activeRole)}): {rolePermissions.scopeLabel}
            </span>
            <p className="text-[#848E9C]">{rolePermissions.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded bg-[#0B0E11] border border-[#2B3139] text-[#F0B90B] whitespace-nowrap">
            Simulasi Sahaja · Bukan Keselamatan Sebenar
          </span>
        </div>
      </div>

      {/* B. 5 Kad Statistik Dinamik */}
      <section
        aria-label="Statistik Pengurusan Tugasan"
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4"
      >
        <button
          type="button"
          onClick={() => setStatusFilter('Semua')}
          className={`text-left bg-[#161A1E] rounded-xl border p-4 transition-colors ${
            statusFilter === 'Semua'
              ? 'border-[#F0B90B]'
              : 'border-[#2B3139] hover:border-[#474D57]'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#848E9C]">Jumlah Keseluruhan</span>
            <CheckSquare className="w-4 h-4 text-[#F0B90B] shrink-0" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-white tabular-nums">
            {taskStats.total}
          </div>
          <div className="text-[11px] text-[#848E9C] mt-0.5">Rekod tugasan aktif</div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'Belum Mula' ? 'Semua' : 'Belum Mula')}
          className={`text-left bg-[#161A1E] rounded-xl border p-4 transition-colors ${
            statusFilter === 'Belum Mula'
              ? 'border-[#F0B90B]'
              : 'border-[#2B3139] hover:border-[#474D57]'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#848E9C]">Belum Mula</span>
            <AlertCircle className="w-4 h-4 text-[#848E9C] shrink-0" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-[#EAECEF] tabular-nums">
            {taskStats.belumMula}
          </div>
          <div className="text-[11px] text-[#848E9C] mt-0.5">Menunggu tindakan</div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'Dalam Proses' ? 'Semua' : 'Dalam Proses')}
          className={`text-left bg-[#161A1E] rounded-xl border p-4 transition-colors ${
            statusFilter === 'Dalam Proses'
              ? 'border-[#F0B90B]'
              : 'border-[#2B3139] hover:border-[#474D57]'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#848E9C]">Dalam Proses</span>
            <Clock className="w-4 h-4 text-[#F0B90B] shrink-0" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-[#F0B90B] tabular-nums">
            {taskStats.dalamProses}
          </div>
          <div className="text-[11px] text-[#848E9C] mt-0.5">Sedang dilaksanakan</div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'Selesai' ? 'Semua' : 'Selesai')}
          className={`text-left bg-[#161A1E] rounded-xl border p-4 transition-colors ${
            statusFilter === 'Selesai'
              ? 'border-[#0ECB81]'
              : 'border-[#2B3139] hover:border-[#474D57]'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#848E9C]">Selesai</span>
            <CheckCircle2 className="w-4 h-4 text-[#0ECB81] shrink-0" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-[#0ECB81] tabular-nums">
            {taskStats.selesai}
          </div>
          <div className="text-[11px] text-[#848E9C] mt-0.5">Tugasan diselesaikan</div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'Lewat' ? 'Semua' : 'Lewat')}
          className={`text-left bg-[#161A1E] rounded-xl border p-4 transition-colors col-span-2 sm:col-span-1 ${
            statusFilter === 'Lewat'
              ? 'border-[#F6465D]'
              : 'border-[#2B3139] hover:border-[#474D57]'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#848E9C]">Lewat Tarikh Akhir</span>
            <AlertTriangle className="w-4 h-4 text-[#F6465D] shrink-0" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-[#F6465D] tabular-nums">
            {taskStats.lewat}
          </div>
          <div className="text-[11px] text-[#848E9C] mt-0.5">Perlu tindakan segera</div>
        </button>
      </section>

      {/* Bar Kawalan Paparan (Jadual / Kanban / Laporan) & Sistem Penapisan G */}
      <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] p-4 space-y-4 print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* View Mode Tabs */}
          <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-[#0B0E11] border border-[#2B3139] rounded-lg self-start">
            <button
              type="button"
              onClick={() => setViewMode('jadual')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                viewMode === 'jadual'
                  ? 'bg-[#F0B90B] text-[#0B0E11]'
                  : 'text-[#848E9C] hover:text-[#EAECEF]'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              Paparan Jadual
            </button>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-[#F0B90B] text-[#0B0E11]'
                  : 'text-[#848E9C] hover:text-[#EAECEF]'
              }`}
            >
              <Columns3 className="w-3.5 h-3.5" />
              Papan Pemantauan Tugasan (Kanban)
            </button>
            <button
              type="button"
              onClick={() => setViewMode('laporan')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                viewMode === 'laporan'
                  ? 'bg-[#F0B90B] text-[#0B0E11]'
                  : 'text-[#848E9C] hover:text-[#EAECEF]'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Laporan Tugasan
            </button>
          </div>

          {/* Instant Search + Reset */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 lg:max-w-md justify-end">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#848E9C] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari ID, tajuk tugasan, guru atau unit..."
                aria-label="Carian tugasan"
                className="w-full pl-9 pr-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] placeholder:text-[#707A8A] border border-[#2B3139] rounded-lg focus:outline-none focus:border-[#F0B90B]"
              />
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#F0B90B] bg-[#0B0E11] border border-[#F0B90B]/40 rounded-lg hover:bg-[#1E2329] whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Set Semula Penapis
              </button>
            )}
          </div>
        </div>

        {/* G. 6 Penapis Terperinci (Guru, Unit, Status, Keutamaan, Bulan, Tarikh Akhir) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2.5 pt-3 border-t border-[#2B3139]">
          <select
            value={teacherFilter}
            onChange={(e) => setTeacherFilter(e.target.value)}
            aria-label="Tapis mengikut nama guru"
            className="px-3 py-2 text-xs bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg focus:outline-none focus:border-[#F0B90B]"
          >
            <option value="Semua">Semua Guru / Pegawai</option>
            {availableTeachers.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          <select
            value={unitFilter}
            onChange={(e) => setUnitFilter(e.target.value)}
            aria-label="Tapis mengikut unit"
            className="px-3 py-2 text-xs bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg focus:outline-none focus:border-[#F0B90B]"
          >
            <option value="Semua">Semua Unit / Bahagian</option>
            {availableUnits.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ExtendedStatusFilter)}
            aria-label="Tapis mengikut status"
            className="px-3 py-2 text-xs bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg focus:outline-none focus:border-[#F0B90B]"
          >
            <option value="Semua">Semua Status</option>
            {TASK_STATUS_OPTIONS.map((st) => (
              <option key={st} value={st}>
                Status: {st}
              </option>
            ))}
            <option value="Lewat">Status: Lewat Tarikh Akhir</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as 'Semua' | TaskPriority)}
            aria-label="Tapis mengikut keutamaan"
            className="px-3 py-2 text-xs bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg focus:outline-none focus:border-[#F0B90B]"
          >
            <option value="Semua">Semua Keutamaan</option>
            {TASK_PRIORITY_OPTIONS.map((p) => (
              <option key={p} value={p}>
                Keutamaan: {p}
              </option>
            ))}
          </select>

          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            aria-label="Tapis mengikut bulan"
            className="px-3 py-2 text-xs bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg focus:outline-none focus:border-[#F0B90B]"
          >
            <option value="Semua">Semua Bulan</option>
            {availableMonths.map((ym) => (
              <option key={ym} value={ym}>
                Bulan: {formatMonthLabelMY(ym)}
              </option>
            ))}
          </select>

          <div className="relative">
            <input
              type="date"
              value={dueDateFilter}
              onChange={(e) => setDueDateFilter(e.target.value)}
              aria-label="Tapis mengikut tarikh akhir"
              title="Tapis mengikut tarikh akhir"
              className="w-full px-3 py-2 text-xs bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg focus:outline-none focus:border-[#F0B90B]"
            />
          </div>
        </div>
      </div>

      {/* Kandungan Mengikut Mod Paparan */}
      {viewMode === 'laporan' ? (
        <TaskReportView
          tasks={filteredTasks}
          activeRole={activeRole}
          onExportSuccess={(fileName) =>
            onNotify?.(
              'success',
              'Eksport Jadual CSV Berjaya',
              `Fail ${fileName} telah dimuat turun.`
            )
          }
        />
      ) : viewMode === 'kanban' ? (
        <TaskKanbanView
          tasks={filteredTasks}
          permissions={rolePermissions}
          onSelectTask={(task) => setSelectedTaskId(task.id)}
          onQuickStatusChange={(task, newStatus) =>
            onUpdateTask({ ...task, status: newStatus })
          }
        />
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="Tiada Tugasan Ditemui"
          description="Tiada rekod tugasan yang sepadan dengan carian atau penapis semasa anda."
          actionLabel={hasActiveFilters ? 'Set Semula Semua Penapis' : rolePermissions.canCreate ? 'Tambah Tugasan Baharu' : undefined}
          onAction={
            hasActiveFilters
              ? resetAllFilters
              : rolePermissions.canCreate
                ? openCreateModal
                : undefined
          }
        />
      ) : (
        /* D. Jadual Pengurusan Tugas (9 Kolum) */
        <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] overflow-hidden">
          <div className="px-5 py-3 border-b border-[#2B3139] bg-[#1E2329]/50 flex items-center justify-between text-xs text-[#848E9C]">
            <span>
              Menunjukkan <strong className="text-[#EAECEF]">{filteredTasks.length}</strong> daripada{' '}
              <strong className="text-[#EAECEF]">{scopedTasks.length}</strong> rekod tugasan (Data Demonstrasi)
            </span>
            <span className="hidden sm:inline">Klik nama tugasan atau ikon mata untuk butiran lengkap</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#2B3139] bg-[#1E2329] text-xs font-semibold text-[#848E9C]">
                  <th className="py-3 px-4 w-12 text-center">Bil.</th>
                  <th className="py-3 px-4 whitespace-nowrap">ID Tugasan</th>
                  <th className="py-3 px-4">Nama Tugasan</th>
                  <th className="py-3 px-4">Pegawai Bertanggungjawab</th>
                  <th className="py-3 px-4">Unit</th>
                  <th className="py-3 px-4 whitespace-nowrap">Tarikh Akhir</th>
                  <th className="py-3 px-4">Keutamaan</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2B3139] text-sm">
                {filteredTasks.map((task, idx) => {
                  const overdue = isTaskOverdue(task, todayIso);
                  const code = getTaskCode(task, idx);
                  const commentCount = (task.komen ?? []).length;
                  const evidenceCount = (task.evidens ?? []).length;

                  return (
                    <tr key={task.id} className="hover:bg-[#1E2329]/60 transition-colors">
                      <td className="py-3.5 px-4 text-center text-xs font-mono text-[#848E9C] tabular-nums">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-mono text-xs font-bold px-2 py-1 rounded bg-[#0B0E11] border border-[#2B3139] text-[#F0B90B]">
                          {code}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 max-w-sm">
                        <button
                          type="button"
                          onClick={() => setSelectedTaskId(task.id)}
                          className="text-left font-semibold text-[#EAECEF] hover:text-[#F0B90B] transition-colors"
                        >
                          {task.tajuk}
                        </button>
                        <div className="text-xs text-[#848E9C] mt-0.5 line-clamp-1">
                          {task.keterangan || 'Tiada keterangan tambahan.'}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-[#707A8A]">
                          <span>{task.kategori || 'Pentadbiran'}</span>
                          <span className="inline-flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" /> {commentCount}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Paperclip className="w-3 h-3" /> {evidenceCount}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs whitespace-nowrap">
                        <div className="font-medium text-[#EAECEF]">{task.pegawai}</div>
                        <div className="text-[11px] text-[#848E9C]">
                          Arahan: {task.pemberiArahan || 'Pentadbir'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#EAECEF] whitespace-nowrap">
                        {task.unit || 'Pentadbiran & Pengurusan'}
                      </td>
                      <td className="py-3.5 px-4 text-xs tabular-nums whitespace-nowrap">
                        <div className={`font-semibold ${overdue ? 'text-[#F6465D]' : 'text-[#EAECEF]'}`}>
                          {formatShortDate(task.tarikhAkhir)}
                        </div>
                        <div className="text-[11px] text-[#848E9C]">
                          Mula: {formatShortDate(task.tarikhMula)}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold whitespace-nowrap">
                        <span
                          className={
                            task.keutamaan === 'Segera'
                              ? 'text-[#F6465D]'
                              : task.keutamaan === 'Tinggi'
                                ? 'text-[#F0B90B]'
                                : 'text-[#848E9C]'
                          }
                        >
                          {task.keutamaan}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {rolePermissions.canUpdateStatus ? (
                          <select
                            value={task.status}
                            onChange={(e) =>
                              onUpdateTask({ ...task, status: e.target.value as TaskStatus })
                            }
                            aria-label={`Tukar status untuk ${task.tajuk}`}
                            className="text-xs font-semibold border border-[#2B3139] rounded-md px-2 py-1 bg-[#0B0E11] text-[#EAECEF] focus:outline-none focus:border-[#F0B90B]"
                          >
                            {TASK_STATUS_OPTIONS.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-xs font-semibold text-[#EAECEF]">{task.status}</span>
                        )}
                        {renderStatusBadge(task.status, overdue)}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setSelectedTaskId(task.id)}
                            className="p-1.5 rounded-lg text-[#848E9C] hover:text-[#0ECB81] hover:bg-[#0ECB81]/10 transition-colors"
                            aria-label={`Lihat butiran ${task.tajuk}`}
                            title="Lihat Butiran"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {rolePermissions.canEditDetails && (
                            <button
                              type="button"
                              onClick={() => openEditModal(task)}
                              className="p-1.5 rounded-lg text-[#848E9C] hover:text-[#F0B90B] hover:bg-[#1E2329] transition-colors"
                              aria-label={`Kemaskini ${task.tajuk}`}
                              title="Kemaskini Tugasan"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}
                          {rolePermissions.canDelete && (
                            <button
                              type="button"
                              onClick={() => handleRequestDelete(task)}
                              className="p-1.5 rounded-lg text-[#848E9C] hover:text-[#F6465D] hover:bg-[#F6465D]/10 transition-colors"
                              aria-label={`Padam ${task.tajuk}`}
                              title="Padam Tugasan"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* C. Borang Tambah / Edit Tugasan */}
      <TaskFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        editingTask={editingTask}
        allTasks={tasks}
        teachers={teachers}
        activeRole={activeRole}
        onSaveNew={onAddTask}
        onSaveEdit={onUpdateTask}
      />

      {/* Pengesahan Padam */}
      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) onDeleteTask(deleteTarget.id);
        }}
        itemName={deleteTarget?.tajuk ?? ''}
      />
    </div>
  );
};
