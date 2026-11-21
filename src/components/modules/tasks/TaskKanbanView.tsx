import React from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  User,
} from 'lucide-react';
import { TaskItem, TaskStatus } from '../../../types/eduschool';
import { formatShortDate } from '../../../utils/formatters';
import {
  TASK_STATUS_OPTIONS,
  TaskRolePermissions,
  getTaskCode,
  isTaskOverdue,
} from '../../../utils/taskHelpers';

interface TaskKanbanViewProps {
  tasks: TaskItem[];
  permissions: TaskRolePermissions;
  onSelectTask: (task: TaskItem) => void;
  onQuickStatusChange: (task: TaskItem, newStatus: TaskStatus) => void;
}

export const TaskKanbanView: React.FC<TaskKanbanViewProps> = ({
  tasks,
  permissions,
  onSelectTask,
  onQuickStatusChange,
}) => {
  const columns: {
    key: 'belum' | 'proses' | 'selesai' | 'lewat';
    title: string;
    subtitle: string;
    accentClass: string;
    icon: React.ComponentType<{ className?: string }>;
    items: TaskItem[];
  }[] = [
    {
      key: 'belum',
      title: 'Belum Mula',
      subtitle: 'Menunggu tindakan awal',
      accentClass: 'text-[#848E9C] border-t-[#848E9C]',
      icon: AlertCircle,
      items: tasks.filter((t) => t.status === 'Belum Mula' && !isTaskOverdue(t)),
    },
    {
      key: 'proses',
      title: 'Dalam Proses',
      subtitle: 'Sedang dilaksanakan',
      accentClass: 'text-[#F0B90B] border-t-[#F0B90B]',
      icon: Clock,
      items: tasks.filter((t) => t.status === 'Dalam Proses' && !isTaskOverdue(t)),
    },
    {
      key: 'selesai',
      title: 'Selesai',
      subtitle: 'Tugasan lengkap',
      accentClass: 'text-[#0ECB81] border-t-[#0ECB81]',
      icon: CheckCircle2,
      items: tasks.filter((t) => t.status === 'Selesai'),
    },
    {
      key: 'lewat',
      title: 'Lewat Tarikh',
      subtitle: 'Melepasi tarikh akhir',
      accentClass: 'text-[#F6465D] border-t-[#F6465D]',
      icon: AlertTriangle,
      items: tasks.filter((t) => isTaskOverdue(t)),
    },
  ];

  return (
    <section aria-label="Papan Pemantauan Tugasan (Kanban)" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
      {columns.map((col) => {
        const Icon = col.icon;
        return (
          <div
            key={col.key}
            className={`bg-[#161A1E] rounded-xl border border-[#2B3139] border-t-4 ${col.accentClass} overflow-hidden`}
          >
            <div className="px-4 py-3.5 border-b border-[#2B3139] bg-[#1E2329] flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 shrink-0" />
                  <h3 className="text-sm font-bold text-[#EAECEF] truncate">{col.title}</h3>
                </div>
                <p className="text-[11px] text-[#848E9C] mt-0.5">{col.subtitle}</p>
              </div>
              <span className="text-xs font-extrabold font-mono px-2 py-0.5 rounded bg-[#0B0E11] border border-[#2B3139] text-[#EAECEF] tabular-nums">
                {col.items.length}
              </span>
            </div>

            <div className="p-3 space-y-3 min-h-[220px]">
              {col.items.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#707A8A] border border-dashed border-[#2B3139] rounded-lg">
                  Tiada tugasan dalam ruangan ini.
                </div>
              ) : (
                col.items.map((task) => {
                  const overdue = isTaskOverdue(task);
                  const priorityColor =
                    task.keutamaan === 'Segera'
                      ? 'bg-[#F6465D]/15 text-[#F6465D]'
                      : task.keutamaan === 'Tinggi'
                        ? 'bg-[#F0B90B]/15 text-[#F0B90B]'
                        : task.keutamaan === 'Sederhana'
                          ? 'bg-[#1E2329] text-[#EAECEF]'
                          : 'bg-[#0B0E11] text-[#848E9C]';

                  return (
                    <div
                      key={task.id}
                      className="p-3.5 rounded-lg bg-[#0B0E11] border border-[#2B3139] hover:border-[#F0B90B]/60 transition-colors space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[10px] font-bold text-[#848E9C]">
                          {getTaskCode(task)}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${priorityColor}`}>
                          {task.keutamaan}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => onSelectTask(task)}
                        className="text-left block w-full text-xs font-bold text-[#EAECEF] hover:text-[#F0B90B] transition-colors leading-snug"
                      >
                        {task.tajuk}
                      </button>

                      <div className="space-y-1 text-[11px] text-[#848E9C]">
                        <div className="flex items-center gap-1.5 truncate">
                          <User className="w-3 h-3 text-[#F0B90B] shrink-0" />
                          <span className="truncate">{task.pegawai}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2 tabular-nums">
                          <span className={`inline-flex items-center gap-1 ${overdue ? 'text-[#F6465D] font-bold' : ''}`}>
                            <Calendar className="w-3 h-3 shrink-0" />
                            {formatShortDate(task.tarikhAkhir)}
                          </span>
                          <span className="text-[10px] text-[#707A8A] truncate">
                            {task.unit || 'Pentadbiran'}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#2B3139] flex items-center justify-between gap-2">
                        {permissions.canUpdateStatus ? (
                          <select
                            value={task.status}
                            onChange={(e) =>
                              onQuickStatusChange(task, e.target.value as TaskStatus)
                            }
                            aria-label={`Tukar status papan pemantauan ${task.tajuk}`}
                            className="text-[11px] font-semibold bg-[#161A1E] text-[#EAECEF] border border-[#2B3139] rounded px-2 py-1 focus:outline-none focus:border-[#F0B90B]"
                          >
                            {TASK_STATUS_OPTIONS.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-[11px] font-semibold text-[#848E9C]">
                            {task.status}
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => onSelectTask(task)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#F0B90B] hover:text-[#F8D12F] shrink-0"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Butiran
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
};
