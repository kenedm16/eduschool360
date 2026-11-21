import React, { useMemo } from 'react';
import {
  Download,
  Printer,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ListChecks,
} from 'lucide-react';
import { TaskItem, UserRole } from '../../../types/eduschool';
import { getRoleDisplayLabel } from '../../../utils/rolePermissions';
import {
  exportTasksToCSV,
  getTodayIsoDate,
  isTaskOverdue,
} from '../../../utils/taskHelpers';

interface TaskReportViewProps {
  tasks: TaskItem[];
  activeRole: UserRole;
  onExportSuccess: (fileName: string) => void;
}

export const TaskReportView: React.FC<TaskReportViewProps> = ({
  tasks,
  activeRole,
  onExportSuccess,
}) => {
  const todayIso = getTodayIsoDate();

  const summary = useMemo(() => {
    const total = tasks.length;
    const belumMula = tasks.filter((t) => t.status === 'Belum Mula').length;
    const dalamProses = tasks.filter((t) => t.status === 'Dalam Proses').length;
    const selesai = tasks.filter((t) => t.status === 'Selesai').length;
    const belumSelesai = total - selesai;
    const lewat = tasks.filter((t) => isTaskOverdue(t, todayIso)).length;

    const unitMap = new Map<
      string,
      { unit: string; total: number; belum: number; proses: number; selesai: number; lewat: number }
    >();
    const teacherMap = new Map<
      string,
      { pegawai: string; total: number; belum: number; proses: number; selesai: number; lewat: number }
    >();

    tasks.forEach((t) => {
      const unitKey = t.unit || 'Pentadbiran & Pengurusan';
      const u = unitMap.get(unitKey) ?? {
        unit: unitKey,
        total: 0,
        belum: 0,
        proses: 0,
        selesai: 0,
        lewat: 0,
      };
      u.total += 1;
      if (t.status === 'Belum Mula') u.belum += 1;
      if (t.status === 'Dalam Proses') u.proses += 1;
      if (t.status === 'Selesai') u.selesai += 1;
      if (isTaskOverdue(t, todayIso)) u.lewat += 1;
      unitMap.set(unitKey, u);

      const tKey = t.pegawai || 'Tidak Ditetapkan';
      const g = teacherMap.get(tKey) ?? {
        pegawai: tKey,
        total: 0,
        belum: 0,
        proses: 0,
        selesai: 0,
        lewat: 0,
      };
      g.total += 1;
      if (t.status === 'Belum Mula') g.belum += 1;
      if (t.status === 'Dalam Proses') g.proses += 1;
      if (t.status === 'Selesai') g.selesai += 1;
      if (isTaskOverdue(t, todayIso)) g.lewat += 1;
      teacherMap.set(tKey, g);
    });

    return {
      total,
      belumMula,
      dalamProses,
      selesai,
      belumSelesai,
      lewat,
      byUnit: Array.from(unitMap.values()).sort((a, b) => b.total - a.total),
      byTeacher: Array.from(teacherMap.values()).sort((a, b) => b.total - a.total),
    };
  }, [tasks, todayIso]);

  const handleExportCsv = () => {
    const fileName = exportTasksToCSV(tasks, activeRole);
    onExportSuccess(fileName);
  };

  const handlePrint = () => {
    window.print();
  };

  const statusRows = [
    { label: 'Belum Mula', count: summary.belumMula, color: 'bg-[#848E9C]' },
    { label: 'Dalam Proses', count: summary.dalamProses, color: 'bg-[#F0B90B]' },
    { label: 'Selesai', count: summary.selesai, color: 'bg-[#0ECB81]' },
    { label: 'Lewat Tarikh Akhir', count: summary.lewat, color: 'bg-[#F6465D]' },
  ];

  return (
    <section aria-label="Laporan Ringkasan Tugasan" className="space-y-6">
      {/* Header & Export Actions */}
      <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#EAECEF]">
            Ringkasan Laporan Pengurusan Tugasan · SMK Salaping
          </h2>
          <p className="text-xs text-[#848E9C] mt-0.5">
            Data Demonstrasi · Dijana daripada {summary.total} rekod tugasan mengikut paparan semasa ({getRoleDisplayLabel(activeRole)}).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 print:hidden">
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-[#0B0E11] bg-[#F0B90B] rounded-lg hover:bg-[#F8D12F] transition-colors"
          >
            <Download className="w-4 h-4" />
            Eksport Jadual (CSV)
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#EAECEF] bg-[#1E2329] border border-[#2B3139] rounded-lg hover:bg-[#2B3139] transition-colors"
          >
            <Printer className="w-4 h-4 text-[#F0B90B]" />
            Cetak Laporan
          </button>
        </div>
      </div>

      {/* Ringkasan Selesai / Belum Selesai / Lewat */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] p-4">
          <div className="flex items-center justify-between text-xs text-[#848E9C]">
            <span>Jumlah Tugasan</span>
            <ListChecks className="w-4 h-4 text-[#F0B90B]" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-white tabular-nums">
            {summary.total}
          </div>
          <div className="text-[11px] text-[#848E9C] mt-0.5">Rekod dinilai</div>
        </div>

        <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] p-4">
          <div className="flex items-center justify-between text-xs text-[#848E9C]">
            <span>Tugasan Selesai</span>
            <CheckCircle2 className="w-4 h-4 text-[#0ECB81]" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-[#0ECB81] tabular-nums">
            {summary.selesai}
          </div>
          <div className="text-[11px] text-[#848E9C] mt-0.5">
            {summary.total > 0 ? Math.round((summary.selesai / summary.total) * 100) : 0}% kadar siap
          </div>
        </div>

        <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] p-4">
          <div className="flex items-center justify-between text-xs text-[#848E9C]">
            <span>Belum Selesai</span>
            <Clock className="w-4 h-4 text-[#F0B90B]" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-[#F0B90B] tabular-nums">
            {summary.belumSelesai}
          </div>
          <div className="text-[11px] text-[#848E9C] mt-0.5">
            {summary.belumMula} belum mula · {summary.dalamProses} dalam proses
          </div>
        </div>

        <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] p-4">
          <div className="flex items-center justify-between text-xs text-[#848E9C]">
            <span>Tugasan Lewat</span>
            <AlertTriangle className="w-4 h-4 text-[#F6465D]" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-[#F6465D] tabular-nums">
            {summary.lewat}
          </div>
          <div className="text-[11px] text-[#848E9C] mt-0.5">Melepasi tarikh akhir</div>
        </div>
      </div>

      {/* Pecahan Mengikut Status */}
      <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] p-5 space-y-4">
        <h3 className="text-sm font-bold text-[#EAECEF]">Jumlah Tugasan Mengikut Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {statusRows.map((row) => {
            const pct = summary.total > 0 ? Math.round((row.count / summary.total) * 100) : 0;
            return (
              <div key={row.label} className="p-3.5 rounded-lg bg-[#0B0E11] border border-[#2B3139] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#EAECEF]">{row.label}</span>
                  <span className="font-mono font-bold text-[#EAECEF] tabular-nums">
                    {row.count} ({pct}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[#1E2329] overflow-hidden">
                  <div className={`h-full ${row.color}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2 Jadual Pecahan: Unit & Guru */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Mengikut Unit */}
        <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#2B3139]">
            <h3 className="text-sm font-bold text-[#EAECEF]">Tugasan Mengikut Unit / Bahagian</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#1E2329] border-b border-[#2B3139] text-[#848E9C]">
                  <th className="py-2.5 px-4">Unit / Bahagian</th>
                  <th className="py-2.5 px-3 text-center">Jumlah</th>
                  <th className="py-2.5 px-3 text-center">Belum</th>
                  <th className="py-2.5 px-3 text-center">Proses</th>
                  <th className="py-2.5 px-3 text-center">Selesai</th>
                  <th className="py-2.5 px-3 text-center">Lewat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2B3139]">
                {summary.byUnit.map((u) => (
                  <tr key={u.unit} className="hover:bg-[#1E2329]/50">
                    <td className="py-2.5 px-4 font-semibold text-[#EAECEF]">{u.unit}</td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-white tabular-nums">
                      {u.total}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-[#848E9C] tabular-nums">
                      {u.belum}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-[#F0B90B] tabular-nums">
                      {u.proses}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-[#0ECB81] tabular-nums">
                      {u.selesai}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-[#F6465D] tabular-nums">
                      {u.lewat}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mengikut Guru */}
        <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#2B3139]">
            <h3 className="text-sm font-bold text-[#EAECEF]">Tugasan Mengikut Guru / Pegawai</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#1E2329] border-b border-[#2B3139] text-[#848E9C]">
                  <th className="py-2.5 px-4">Pegawai Bertanggungjawab</th>
                  <th className="py-2.5 px-3 text-center">Jumlah</th>
                  <th className="py-2.5 px-3 text-center">Belum</th>
                  <th className="py-2.5 px-3 text-center">Proses</th>
                  <th className="py-2.5 px-3 text-center">Selesai</th>
                  <th className="py-2.5 px-3 text-center">Lewat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2B3139]">
                {summary.byTeacher.map((g) => (
                  <tr key={g.pegawai} className="hover:bg-[#1E2329]/50">
                    <td className="py-2.5 px-4 font-semibold text-[#EAECEF]">{g.pegawai}</td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-white tabular-nums">
                      {g.total}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-[#848E9C] tabular-nums">
                      {g.belum}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-[#F0B90B] tabular-nums">
                      {g.proses}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-[#0ECB81] tabular-nums">
                      {g.selesai}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-[#F6465D] tabular-nums">
                      {g.lewat}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};
