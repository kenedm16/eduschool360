import React, { useMemo, useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Edit3,
  Trash2,
  ClipboardList,
  ShieldCheck,
} from 'lucide-react';
import {
  InterventionEntry,
  StudentFollowUpStatus,
  StudentRecord,
  TeacherItem,
  UserRole,
} from '../../types/eduschool';
import { getRoleCapabilities } from '../../utils/rolePermissions';
import { formatShortDate } from '../../utils/formatters';
import { ModuleHeader } from '../common/ModuleHeader';
import { EmptyState } from '../common/EmptyState';
import { ConfirmDeleteModal, Modal } from '../common/Modal';

interface StudentModuleProps {
  students: StudentRecord[];
  teachers: TeacherItem[];
  activeRole: UserRole;
  onBackToDashboard: () => void;
  onAddStudent: (student: Omit<StudentRecord, 'id'>) => void;
  onUpdateStudent: (student: StudentRecord) => void;
  onDeleteStudent: (id: string) => void;
}

const STATUS_OPTIONS: StudentFollowUpStatus[] = [
  'Perlu Pemantauan',
  'Dalam Intervensi',
  'Memuaskan',
];

export const StudentModule: React.FC<StudentModuleProps> = ({
  students,
  teachers,
  activeRole,
  onBackToDashboard,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
}) => {
  const capabilities = getRoleCapabilities(activeRole);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Semua' | StudentFollowUpStatus>('Semua');
  const [tingkatanFilter, setTingkatanFilter] = useState('Semua');

  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StudentRecord | null>(null);
  const [interventionTarget, setInterventionTarget] = useState<StudentRecord | null>(null);

  const [nama, setNama] = useState('');
  const [noIdMurid, setNoIdMurid] = useState('');
  const [tingkatan, setTingkatan] = useState('Tingkatan 5');
  const [kelas, setKelas] = useState('');
  const [kehadiranPeratus, setKehadiranPeratus] = useState('85');
  const [purataMarkah, setPurataMarkah] = useState('55');
  const [tahapPenguasaan, setTahapPenguasaan] = useState('TP3 - Sederhana');
  const [isuUtama, setIsuUtama] = useState('');
  const [statusSusulan, setStatusSusulan] = useState<StudentFollowUpStatus>('Dalam Intervensi');

  const [intTarikh, setIntTarikh] = useState('2026-11-19');
  const [intTindakan, setIntTindakan] = useState('');
  const [intPegawai, setIntPegawai] = useState(teachers[0]?.nama ?? '');

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchSearch =
        !search.trim() ||
        s.nama.toLowerCase().includes(search.toLowerCase()) ||
        s.noIdMurid.toLowerCase().includes(search.toLowerCase()) ||
        s.kelas.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'Semua' || s.statusSusulan === statusFilter;
      const matchTingkatan = tingkatanFilter === 'Semua' || s.tingkatan === tingkatanFilter;
      return matchSearch && matchStatus && matchTingkatan;
    });
  }, [students, search, statusFilter, tingkatanFilter]);

  const openCreateModal = () => {
    setEditingStudent(null);
    setNama('');
    setNoIdMurid(`SLP-2026-0${students.length + 91}`);
    setTingkatan('Tingkatan 5');
    setKelas('5 Ibnu Sina');
    setKehadiranPeratus('85');
    setPurataMarkah('55');
    setTahapPenguasaan('TP3 - Sederhana');
    setIsuUtama('');
    setStatusSusulan('Perlu Pemantauan');
    setIsStudentModalOpen(true);
  };

  const openEditModal = (s: StudentRecord) => {
    setEditingStudent(s);
    setNama(s.nama);
    setNoIdMurid(s.noIdMurid);
    setTingkatan(s.tingkatan);
    setKelas(s.kelas);
    setKehadiranPeratus(String(s.kehadiranPeratus));
    setPurataMarkah(String(s.purataMarkah));
    setTahapPenguasaan(s.tahapPenguasaan);
    setIsuUtama(s.isuUtama);
    setStatusSusulan(s.statusSusulan);
    setIsStudentModalOpen(true);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) return;
    const payload = {
      nama: nama.trim(),
      noIdMurid: noIdMurid.trim(),
      tingkatan,
      kelas: kelas.trim(),
      kehadiranPeratus: Math.min(100, Math.max(0, Number(kehadiranPeratus) || 0)),
      purataMarkah: Math.min(100, Math.max(0, Number(purataMarkah) || 0)),
      tahapPenguasaan,
      isuUtama: isuUtama.trim(),
      statusSusulan,
    };

    if (editingStudent) {
      onUpdateStudent({
        ...editingStudent,
        ...payload,
      });
    } else {
      onAddStudent({
        ...payload,
        rekodIntervensi: [],
      });
    }
    setIsStudentModalOpen(false);
  };

  const handleAddIntervention = (e: React.FormEvent) => {
    e.preventDefault();
    if (!interventionTarget || !intTindakan.trim()) return;
    const newEntry: InterventionEntry = {
      id: `int-${Date.now()}`,
      tarikh: intTarikh,
      tindakan: intTindakan.trim(),
      pegawai: intPegawai,
    };
    const updated: StudentRecord = {
      ...interventionTarget,
      rekodIntervensi: [newEntry, ...interventionTarget.rekodIntervensi],
    };
    onUpdateStudent(updated);
    setInterventionTarget(updated);
    setIntTindakan('');
  };

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Pemantauan Murid"
        description="Rekod perkembangan akademik, kehadiran, intervensi dan status tindakan susulan murid (data demonstrasi rekaan)."
        onBackToDashboard={onBackToDashboard}
        actions={
          capabilities.canManageStudents && (
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-[#0B0E11] bg-[#F0B90B] rounded-lg hover:bg-[#F8D12F] transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Tambah Rekod Murid
            </button>
          )
        }
      />

      <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-[#F0B90B]/10 border border-[#F0B90B]/30 text-xs text-[#EAECEF]">
        <ShieldCheck className="w-4 h-4 text-[#F0B90B] shrink-0" />
        <span>
          Semua nama murid dan nombor pengenalan dalam modul ini ialah data rekaan semata-mata untuk tujuan demonstrasi prototaip.
        </span>
      </div>

      <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1 p-1 bg-[#0B0E11] border border-[#2B3139] rounded-lg">
          {(['Semua', ...STATUS_OPTIONS] as const).map((st) => {
            const active = statusFilter === st;
            return (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-[#F0B90B] text-[#0B0E11] font-bold'
                    : 'text-[#848E9C] hover:text-[#EAECEF]'
                }`}
              >
                {st}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-[#848E9C] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, ID atau kelas..."
              className="w-full sm:w-64 pl-9 pr-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] placeholder:text-[#707A8A] border border-[#2B3139] rounded-lg focus:outline-none focus:border-[#F0B90B]"
            />
          </div>
          <select
            value={tingkatanFilter}
            onChange={(e) => setTingkatanFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg focus:outline-none focus:border-[#F0B90B]"
          >
            <option value="Semua">Semua Tingkatan</option>
            <option value="Tingkatan 5">Tingkatan 5</option>
            <option value="Tingkatan 4">Tingkatan 4</option>
            <option value="Tingkatan 3">Tingkatan 3</option>
            <option value="Tingkatan 2">Tingkatan 2</option>
            <option value="Tingkatan 1">Tingkatan 1</option>
          </select>
        </div>
      </div>

      {filteredStudents.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Tiada Rekod Murid Ditemui"
          description="Tiada profil murid yang sepadan dengan penapis carian anda."
          actionLabel={capabilities.canManageStudents ? 'Tambah Rekod Murid' : undefined}
          onAction={capabilities.canManageStudents ? openCreateModal : undefined}
        />
      ) : (
        <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#1E2329] border-b border-[#2B3139] text-xs font-semibold text-[#848E9C]">
                  <th className="py-3 px-5">Nama & Kelas</th>
                  <th className="py-3 px-4 text-right">Kehadiran</th>
                  <th className="py-3 px-4 text-right">Purata Markah</th>
                  <th className="py-3 px-4">Tahap & Fokus Pemantauan</th>
                  <th className="py-3 px-4">Status Susulan</th>
                  <th className="py-3 px-5 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2B3139]">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-[#1E2329]/60">
                    <td className="py-3.5 px-5">
                      <div className="font-bold text-[#EAECEF]">{student.nama}</div>
                      <div className="text-xs text-[#848E9C] mt-0.5 tabular-nums">
                        {student.noIdMurid} · {student.kelas} ({student.tingkatan})
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-xs font-semibold tabular-nums">
                      <span
                        className={
                          student.kehadiranPeratus < 80 ? 'text-[#F6465D]' : 'text-[#0ECB81]'
                        }
                      >
                        {student.kehadiranPeratus}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-xs font-semibold tabular-nums">
                      <span
                        className={
                          student.purataMarkah < 45 ? 'text-[#F0B90B]' : 'text-[#0ECB81]'
                        }
                      >
                        {student.purataMarkah}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="text-xs font-semibold text-[#EAECEF]">
                        {student.tahapPenguasaan}
                      </div>
                      <div className="text-xs text-[#848E9C] mt-0.5 line-clamp-2">
                        {student.isuUtama}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold whitespace-nowrap">
                      <span
                        className={
                          student.statusSusulan === 'Memuaskan'
                            ? 'text-[#0ECB81]'
                            : student.statusSusulan === 'Dalam Intervensi'
                              ? 'text-[#F0B90B]'
                              : 'text-[#F6465D]'
                        }
                      >
                        {student.statusSusulan}
                      </span>
                      <div className="text-[11px] font-normal text-[#848E9C] mt-0.5 tabular-nums">
                        {student.rekodIntervensi.length} rekod intervensi
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setInterventionTarget(student)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#EAECEF] bg-[#1E2329] border border-[#2B3139] rounded-lg hover:border-[#F0B90B]"
                        >
                          <ClipboardList className="w-3.5 h-3.5 text-[#F0B90B]" />
                          Intervensi
                        </button>
                        {capabilities.canManageStudents && (
                          <>
                            <button
                              type="button"
                              onClick={() => openEditModal(student)}
                              className="p-1.5 rounded-lg text-[#848E9C] hover:text-[#F0B90B] hover:bg-[#1E2329]"
                              aria-label={`Kemaskini ${student.nama}`}
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(student)}
                              className="p-1.5 rounded-lg text-[#848E9C] hover:text-[#F6465D] hover:bg-[#F6465D]/10"
                              aria-label={`Padam ${student.nama}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        isOpen={isStudentModalOpen}
        onClose={() => setIsStudentModalOpen(false)}
        title={editingStudent ? 'Kemaskini Rekod Murid' : 'Tambah Rekod Pemantauan Murid'}
      >
        <form onSubmit={handleSaveStudent} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
                Nama Penuh Murid (Rekaan)
              </label>
              <input
                type="text"
                required
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
                No. ID Rujukan
              </label>
              <input
                type="text"
                required
                value={noIdMurid}
                onChange={(e) => setNoIdMurid(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
                Tingkatan
              </label>
              <select
                value={tingkatan}
                onChange={(e) => setTingkatan(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              >
                <option value="Tingkatan 5">Tingkatan 5</option>
                <option value="Tingkatan 4">Tingkatan 4</option>
                <option value="Tingkatan 3">Tingkatan 3</option>
                <option value="Tingkatan 2">Tingkatan 2</option>
                <option value="Tingkatan 1">Tingkatan 1</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">Kelas</label>
              <input
                type="text"
                required
                value={kelas}
                onChange={(e) => setKelas(e.target.value)}
                placeholder="Contoh: 5 Ibnu Sina"
                className="w-full px-3.5 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
                Kehadiran (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={kehadiranPeratus}
                onChange={(e) => setKehadiranPeratus(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
                Purata Markah (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={purataMarkah}
                onChange={(e) => setPurataMarkah(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
                Tahap Penguasaan
              </label>
              <select
                value={tahapPenguasaan}
                onChange={(e) => setTahapPenguasaan(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              >
                <option value="TP6 - Sangat Baik">TP6 - Sangat Baik</option>
                <option value="TP5 - Baik">TP5 - Baik</option>
                <option value="TP4 - Memuaskan">TP4 - Memuaskan</option>
                <option value="TP3 - Sederhana">TP3 - Sederhana</option>
                <option value="TP2 - Perlu Bimbingan">TP2 - Perlu Bimbingan</option>
                <option value="TP1 - Kritikal">TP1 - Kritikal</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
                Status Tindakan Susulan
              </label>
              <select
                value={statusSusulan}
                onChange={(e) => setStatusSusulan(e.target.value as StudentFollowUpStatus)}
                className="w-full px-3.5 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              >
                {STATUS_OPTIONS.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
              Catatan Perkembangan / Isu Utama
            </label>
            <textarea
              rows={2}
              value={isuUtama}
              onChange={(e) => setIsuUtama(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setIsStudentModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-[#EAECEF] bg-[#1E2329] border border-[#2B3139] rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-bold text-[#0B0E11] bg-[#F0B90B] rounded-lg hover:bg-[#F8D12F]"
            >
              {editingStudent ? 'Simpan Kemaskini' : 'Simpan Rekod'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(interventionTarget)}
        onClose={() => setInterventionTarget(null)}
        title={`Rekod Intervensi: ${interventionTarget?.nama ?? ''}`}
        subtitle={
          interventionTarget
            ? `${interventionTarget.kelas} · ${interventionTarget.tahapPenguasaan}`
            : ''
        }
        maxWidthClass="max-w-xl"
      >
        {interventionTarget && (
          <div className="space-y-5">
            {capabilities.canManageStudents && (
              <form
                onSubmit={handleAddIntervention}
                className="p-4 rounded-lg bg-[#1E2329] border border-[#2B3139] space-y-3"
              >
                <div className="text-xs font-bold text-[#F0B90B]">
                  Tambah Catatan Intervensi Baharu
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#848E9C] mb-1">
                      Tarikh
                    </label>
                    <input
                      type="date"
                      required
                      value={intTarikh}
                      onChange={(e) => setIntTarikh(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#848E9C] mb-1">
                      Pegawai Pelaksana
                    </label>
                    <select
                      value={intPegawai}
                      onChange={(e) => setIntPegawai(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
                    >
                      {teachers.map((t) => (
                        <option key={t.id} value={t.nama}>
                          {t.nama}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#848E9C] mb-1">
                    Tindakan Intervensi
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={intTindakan}
                    onChange={(e) => setIntTindakan(e.target.value)}
                    placeholder="Contoh: Sesi bimbingan individu modul asas bacaan & hubungi ibu bapa..."
                    className="w-full px-3 py-1.5 text-xs bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 text-xs font-bold text-[#0B0E11] bg-[#F0B90B] rounded-lg hover:bg-[#F8D12F]"
                  >
                    Rekod Intervensi
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-2.5">
              <div className="text-xs font-bold text-[#EAECEF]">
                Sejarah Tindakan Susulan ({interventionTarget.rekodIntervensi.length})
              </div>
              {interventionTarget.rekodIntervensi.length === 0 ? (
                <p className="text-xs text-[#848E9C] py-4 text-center border border-[#2B3139] rounded-lg">
                  Tiada rekod intervensi dicatatkan bagi murid ini.
                </p>
              ) : (
                <div className="divide-y divide-[#2B3139] border border-[#2B3139] rounded-lg">
                  {interventionTarget.rekodIntervensi.map((entry) => (
                    <div key={entry.id} className="p-3.5 space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-[#848E9C]">
                        <span className="font-semibold text-[#F0B90B]">{entry.pegawai}</span>
                        <span className="tabular-nums">{formatShortDate(entry.tarikh)}</span>
                      </div>
                      <p className="text-xs text-[#EAECEF] leading-relaxed">{entry.tindakan}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) onDeleteStudent(deleteTarget.id);
        }}
        itemName={deleteTarget?.nama ?? ''}
      />
    </div>
  );
};
