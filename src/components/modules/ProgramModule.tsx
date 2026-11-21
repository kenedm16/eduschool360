import React, { useMemo, useState } from 'react';
import {
  Award,
  Plus,
  Search,
  Edit3,
  Trash2,
  FileText,
} from 'lucide-react';
import {
  ProgramStatus,
  SchoolProgram,
  TeacherItem,
  UserRole,
} from '../../types/eduschool';
import { getRoleCapabilities } from '../../utils/rolePermissions';
import { formatCurrencyRM, formatShortDate } from '../../utils/formatters';
import { ModuleHeader } from '../common/ModuleHeader';
import { EmptyState } from '../common/EmptyState';
import { ConfirmDeleteModal, Modal } from '../common/Modal';

interface ProgramModuleProps {
  programs: SchoolProgram[];
  teachers: TeacherItem[];
  activeRole: UserRole;
  onBackToDashboard: () => void;
  onAddProgram: (program: Omit<SchoolProgram, 'id'>) => void;
  onUpdateProgram: (program: SchoolProgram) => void;
  onDeleteProgram: (id: string) => void;
}

const PROGRAM_STATUSES: ProgramStatus[] = [
  'Dirancang',
  'Dalam Persiapan',
  'Sedang Berjalan',
  'Selesai',
];

export const ProgramModule: React.FC<ProgramModuleProps> = ({
  programs,
  teachers,
  activeRole,
  onBackToDashboard,
  onAddProgram,
  onUpdateProgram,
  onDeleteProgram,
}) => {
  const capabilities = getRoleCapabilities(activeRole);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Semua' | ProgramStatus>('Semua');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<SchoolProgram | null>(null);
  const [reportTarget, setReportTarget] = useState<SchoolProgram | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SchoolProgram | null>(null);

  const [nama, setNama] = useState('');
  const [tarikh, setTarikh] = useState('2026-12-01');
  const [penyelaras, setPenyelaras] = useState(teachers[0]?.nama ?? '');
  const [jawatankuasa, setJawatankuasa] = useState('');
  const [anggaranBajet, setAnggaranBajet] = useState('1500');
  const [status, setStatus] = useState<ProgramStatus>('Dirancang');
  const [laporanPelaksanaan, setLaporanPelaksanaan] = useState('');

  const filteredPrograms = useMemo(() => {
    return programs.filter((p) => {
      const matchSearch =
        !search.trim() ||
        p.nama.toLowerCase().includes(search.toLowerCase()) ||
        p.penyelaras.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'Semua' || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [programs, search, statusFilter]);

  const totalBudget = useMemo(
    () => filteredPrograms.reduce((sum, p) => sum + p.anggaranBajet, 0),
    [filteredPrograms]
  );

  const openAddModal = () => {
    setEditingProgram(null);
    setNama('');
    setTarikh('2026-12-01');
    setPenyelaras(teachers[0]?.nama ?? '');
    setJawatankuasa('');
    setAnggaranBajet('1500');
    setStatus('Dirancang');
    setLaporanPelaksanaan('');
    setIsModalOpen(true);
  };

  const openEditModal = (p: SchoolProgram) => {
    setEditingProgram(p);
    setNama(p.nama);
    setTarikh(p.tarikh);
    setPenyelaras(p.penyelaras);
    setJawatankuasa(p.jawatankuasa);
    setAnggaranBajet(String(p.anggaranBajet));
    setStatus(p.status);
    setLaporanPelaksanaan(p.laporanPelaksanaan);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) return;
    const payload = {
      nama: nama.trim(),
      tarikh,
      penyelaras,
      jawatankuasa: jawatankuasa.trim() || 'Ahli Jawatankuasa Induk Sekolah',
      anggaranBajet: Number(anggaranBajet) || 0,
      status,
      laporanPelaksanaan:
        laporanPelaksanaan.trim() || 'Laporan pelaksanaan akan dikemaskini selepas program dijalankan.',
    };
    if (editingProgram) {
      onUpdateProgram({ ...editingProgram, ...payload });
    } else {
      onAddProgram(payload);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Program Sekolah"
        description="Pengurusan perancangan program sekolah, jawatankuasa, anggaran peruntukan dan laporan pelaksanaan."
        onBackToDashboard={onBackToDashboard}
        actions={
          capabilities.canManagePrograms && (
            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-[#0B0E11] bg-[#F0B90B] rounded-lg hover:bg-[#F8D12F] transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Tambah Program
            </button>
          )
        }
      />

      <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] p-4 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1 p-1 bg-[#0B0E11] border border-[#2B3139] rounded-lg">
          {(['Semua', ...PROGRAM_STATUSES] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-[#F0B90B] text-[#0B0E11] font-bold'
                  : 'text-[#848E9C] hover:text-[#EAECEF]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="text-xs text-[#848E9C] tabular-nums">
            Jumlah Anggaran Peruntukan:{' '}
            <strong className="text-[#0ECB81] font-mono">{formatCurrencyRM(totalBudget)}</strong>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-[#848E9C] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari program atau penyelaras..."
              className="w-full sm:w-64 pl-9 pr-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] placeholder:text-[#707A8A] border border-[#2B3139] rounded-lg focus:outline-none focus:border-[#F0B90B]"
            />
          </div>
        </div>
      </div>

      {filteredPrograms.length === 0 ? (
        <EmptyState
          icon={Award}
          title="Tiada Program Ditemui"
          description="Tiada rekod program yang sepadan dengan penapis status atau carian anda."
          actionLabel={capabilities.canManagePrograms ? 'Tambah Program Baharu' : undefined}
          onAction={capabilities.canManagePrograms ? openAddModal : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredPrograms.map((prog) => (
            <article
              key={prog.id}
              className="bg-[#161A1E] rounded-xl border border-[#2B3139] p-5 flex flex-col justify-between gap-4 hover:border-[#F0B90B]/40 transition-colors"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold text-[#0ECB81]">
                      {prog.status} · <span className="tabular-nums text-[#F0B90B]">{formatShortDate(prog.tarikh)}</span>
                    </div>
                    <h3 className="text-base font-bold text-[#EAECEF] mt-1">{prog.nama}</h3>
                  </div>
                  {capabilities.canManagePrograms && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditModal(prog)}
                        className="p-1.5 rounded-lg text-[#848E9C] hover:text-[#F0B90B] hover:bg-[#1E2329]"
                        aria-label={`Kemaskini ${prog.nama}`}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(prog)}
                        className="p-1.5 rounded-lg text-[#848E9C] hover:text-[#F6465D] hover:bg-[#F6465D]/10"
                        aria-label={`Padam ${prog.nama}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-xs text-[#848E9C]">
                  <div>
                    <span>Penyelaras:</span>{' '}
                    <span className="font-semibold text-[#EAECEF]">{prog.penyelaras}</span>
                  </div>
                  <div>
                    <span>Anggaran Peruntukan:</span>{' '}
                    <span className="font-mono font-bold text-[#F0B90B] tabular-nums">
                      {formatCurrencyRM(prog.anggaranBajet)}
                    </span>
                  </div>
                  <div className="sm:col-span-2">
                    <span>Jawatankuasa:</span>{' '}
                    <span className="text-[#EAECEF]">{prog.jawatankuasa}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#2B3139] flex items-center justify-between gap-3">
                <p className="text-xs text-[#848E9C] line-clamp-1">{prog.laporanPelaksanaan}</p>
                <button
                  type="button"
                  onClick={() => setReportTarget(prog)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#EAECEF] bg-[#1E2329] border border-[#2B3139] rounded-lg hover:border-[#F0B90B] shrink-0 whitespace-nowrap"
                >
                  <FileText className="w-3.5 h-3.5 text-[#F0B90B]" />
                  Laporan
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProgram ? 'Kemaskini Program Sekolah' : 'Tambah Program Sekolah Baharu'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
              Nama Program
            </label>
            <input
              type="text"
              required
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">Tarikh</label>
              <input
                type="date"
                required
                value={tarikh}
                onChange={(e) => setTarikh(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
                Anggaran Peruntukan (RM)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={anggaranBajet}
                onChange={(e) => setAnggaranBajet(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
                Penyelaras Program
              </label>
              <select
                value={penyelaras}
                onChange={(e) => setPenyelaras(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              >
                {teachers.map((t) => (
                  <option key={t.id} value={t.nama}>
                    {t.nama}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
                Status Program
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProgramStatus)}
                className="w-full px-3.5 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              >
                {PROGRAM_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
              Jawatankuasa Terlibat
            </label>
            <input
              type="text"
              value={jawatankuasa}
              onChange={(e) => setJawatankuasa(e.target.value)}
              placeholder="Contoh: JK Kurikulum, PIBG & Panitia Bahasa"
              className="w-full px-3.5 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
              Laporan / Ringkasan Pelaksanaan
            </label>
            <textarea
              rows={3}
              value={laporanPelaksanaan}
              onChange={(e) => setLaporanPelaksanaan(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
            />
          </div>
          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-[#EAECEF] bg-[#1E2329] border border-[#2B3139] rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-bold text-[#0B0E11] bg-[#F0B90B] rounded-lg hover:bg-[#F8D12F]"
            >
              {editingProgram ? 'Simpan Kemaskini' : 'Simpan Program'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(reportTarget)}
        onClose={() => setReportTarget(null)}
        title={`Laporan Pelaksanaan: ${reportTarget?.nama ?? ''}`}
        subtitle={
          reportTarget
            ? `Penyelaras: ${reportTarget.penyelaras} · ${formatShortDate(reportTarget.tarikh)}`
            : ''
        }
      >
        {reportTarget && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-[#1E2329] border border-[#2B3139] grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="text-[#848E9C]">Status</div>
                <div className="font-bold text-[#0ECB81] mt-0.5">{reportTarget.status}</div>
              </div>
              <div>
                <div className="text-[#848E9C]">Anggaran Peruntukan</div>
                <div className="font-mono font-bold text-[#F0B90B] mt-0.5 tabular-nums">
                  {formatCurrencyRM(reportTarget.anggaranBajet)}
                </div>
              </div>
              <div className="col-span-2">
                <div className="text-[#848E9C]">Jawatankuasa</div>
                <div className="font-medium text-[#EAECEF] mt-0.5">
                  {reportTarget.jawatankuasa}
                </div>
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-[#848E9C] mb-1.5">
                Butiran Laporan Pelaksanaan
              </div>
              <p className="text-sm text-[#EAECEF] leading-relaxed whitespace-pre-line">
                {reportTarget.laporanPelaksanaan}
              </p>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setReportTarget(null)}
                className="px-4 py-2 text-sm font-bold text-[#0B0E11] bg-[#F0B90B] rounded-lg hover:bg-[#F8D12F]"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) onDeleteProgram(deleteTarget.id);
        }}
        itemName={deleteTarget?.nama ?? ''}
      />
    </div>
  );
};
