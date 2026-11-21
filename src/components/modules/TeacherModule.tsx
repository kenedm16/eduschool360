import React, { useMemo, useState } from 'react';
import {
  GraduationCap,
  Plus,
  Search,
  Edit3,
  Trash2,
  Mail,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import { TeacherItem, UserRole } from '../../types/eduschool';
import { getRoleCapabilities, getRoleDisplayLabel } from '../../utils/rolePermissions';
import { getInitials } from '../../utils/formatters';
import { ModuleHeader } from '../common/ModuleHeader';
import { EmptyState } from '../common/EmptyState';
import { ConfirmDeleteModal, Modal } from '../common/Modal';

interface TeacherModuleProps {
  teachers: TeacherItem[];
  activeRole: UserRole;
  onBackToDashboard: () => void;
  onAddTeacher: (teacher: Omit<TeacherItem, 'id'>) => void;
  onUpdateTeacher: (teacher: TeacherItem) => void;
  onDeleteTeacher: (id: string) => void;
}

const ROLES_LIST: UserRole[] = [
  'Super Admin',
  'Pengetua',
  'Penolong Kanan',
  'Ketua Bidang',
  'Ketua Panitia',
  'Guru',
  'Staf',
];

const BIDANG_LIST = [
  'Pentadbiran',
  'Bahasa',
  'Sains & Matematik',
  'Kemanusiaan',
  'Teknik & Vokasional',
];

export const TeacherModule: React.FC<TeacherModuleProps> = ({
  teachers,
  activeRole,
  onBackToDashboard,
  onAddTeacher,
  onUpdateTeacher,
  onDeleteTeacher,
}) => {
  const capabilities = getRoleCapabilities(activeRole);
  const [search, setSearch] = useState('');
  const [bidangFilter, setBidangFilter] = useState('Semua');
  const [roleFilter, setRoleFilter] = useState<'Semua' | UserRole>('Semua');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TeacherItem | null>(null);

  const [nama, setNama] = useState('');
  const [jawatan, setJawatan] = useState('Guru Akademik Biasa');
  const [bidang, setBidang] = useState('Bahasa');
  const [panitia, setPanitia] = useState('Bahasa Melayu');
  const [perananSistem, setPerananSistem] = useState<UserRole>('Guru');
  const [emel, setEmel] = useState('');
  const [noSambungan, setNoSambungan] = useState('');

  const filteredTeachers = useMemo(() => {
    return teachers.filter((t) => {
      const matchSearch =
        !search.trim() ||
        t.nama.toLowerCase().includes(search.toLowerCase()) ||
        t.jawatan.toLowerCase().includes(search.toLowerCase()) ||
        t.panitia.toLowerCase().includes(search.toLowerCase());
      const matchBidang = bidangFilter === 'Semua' || t.bidang === bidangFilter;
      const matchRole = roleFilter === 'Semua' || t.perananSistem === roleFilter;
      return matchSearch && matchBidang && matchRole;
    });
  }, [teachers, search, bidangFilter, roleFilter]);

  const openAddModal = () => {
    setEditingTeacher(null);
    setNama('');
    setJawatan('Guru Akademik Biasa');
    setBidang('Bahasa');
    setPanitia('Bahasa Melayu');
    setPerananSistem('Guru');
    setEmel('');
    setNoSambungan(`1${teachers.length + 25}`);
    setIsModalOpen(true);
  };

  const openEditModal = (t: TeacherItem) => {
    setEditingTeacher(t);
    setNama(t.nama);
    setJawatan(t.jawatan);
    setBidang(t.bidang);
    setPanitia(t.panitia);
    setPerananSistem(t.perananSistem);
    setEmel(t.emel);
    setNoSambungan(t.noSambungan);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) return;
    const payload = {
      nama: nama.trim(),
      jawatan: jawatan.trim(),
      bidang,
      panitia: panitia.trim(),
      perananSistem,
      emel:
        emel.trim() ||
        `${nama.trim().toLowerCase().replace(/[^a-z0-9]+/g, '.')}@smksalaping.demo.my`,
      noSambungan: noSambungan.trim() || '100',
    };

    if (editingTeacher) {
      onUpdateTeacher({ ...editingTeacher, ...payload });
    } else {
      onAddTeacher(payload);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Pengurusan Guru & Staf"
        description="Direktori pegawai pendidikan SMK Salaping, jawatan, bidang, panitia dan peranan sistem (data rekaan)."
        onBackToDashboard={onBackToDashboard}
        actions={
          capabilities.canManageTeachers && (
            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-[#0B0E11] bg-[#F0B90B] rounded-lg hover:bg-[#F8D12F] transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Tambah Guru / Staf
            </button>
          )
        }
      />

      <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-[#F0B90B]/10 border border-[#F0B90B]/30 text-xs text-[#EAECEF]">
        <ShieldCheck className="w-4 h-4 text-[#F0B90B] shrink-0" />
        <span>
          <strong className="text-[#F0B90B]">Data Demonstrasi:</strong> Semua nama pegawai, jawatan dan alamat e-mel dalam direktori ini ialah data rekaan semata-mata untuk tujuan prototaip.
        </span>
      </div>

      <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#848E9C] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama guru, jawatan atau panitia..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] placeholder:text-[#707A8A] border border-[#2B3139] rounded-lg focus:outline-none focus:border-[#F0B90B]"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <select
            value={bidangFilter}
            onChange={(e) => setBidangFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg focus:outline-none focus:border-[#F0B90B]"
          >
            <option value="Semua">Semua Bidang</option>
            {BIDANG_LIST.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as 'Semua' | UserRole)}
            className="px-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg focus:outline-none focus:border-[#F0B90B]"
          >
            <option value="Semua">Semua Peranan</option>
            {ROLES_LIST.map((r) => (
              <option key={r} value={r}>
                Peranan: {getRoleDisplayLabel(r)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredTeachers.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="Tiada Rekod Guru Ditemui"
          description="Tiada profil guru atau staf sepadan dengan kata kunci carian anda."
          actionLabel={capabilities.canManageTeachers ? 'Tambah Rekod Guru' : undefined}
          onAction={capabilities.canManageTeachers ? openAddModal : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredTeachers.map((teacher) => (
            <article
              key={teacher.id}
              className="bg-[#161A1E] rounded-xl border border-[#2B3139] p-5 flex flex-col justify-between gap-4 hover:border-[#F0B90B]/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-[#F0B90B] text-[#0B0E11] text-xs font-extrabold flex items-center justify-center shrink-0">
                    {getInitials(teacher.nama)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-[#EAECEF] leading-snug">
                      {teacher.nama}
                    </h3>
                    <p className="text-xs font-medium text-[#0ECB81] mt-0.5">
                      {teacher.jawatan}
                    </p>
                  </div>
                </div>
                {capabilities.canManageTeachers && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditModal(teacher)}
                      className="p-1.5 rounded-lg text-[#848E9C] hover:text-[#F0B90B] hover:bg-[#1E2329]"
                      aria-label={`Kemaskini ${teacher.nama}`}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(teacher)}
                      className="p-1.5 rounded-lg text-[#848E9C] hover:text-[#F6465D] hover:bg-[#F6465D]/10"
                      aria-label={`Padam ${teacher.nama}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-[#2B3139] space-y-1.5 text-xs text-[#848E9C]">
                <div className="flex justify-between gap-2">
                  <span>Bidang:</span>
                  <span className="font-semibold text-[#EAECEF]">{teacher.bidang}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span>Panitia / Unit:</span>
                  <span className="font-semibold text-[#EAECEF]">{teacher.panitia}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span>Peranan Sistem:</span>
                  <span className="font-bold text-[#F0B90B]">{getRoleDisplayLabel(teacher.perananSistem)}</span>
                </div>
              </div>

              <div className="pt-2.5 border-t border-[#2B3139] flex items-center justify-between text-[11px] text-[#848E9C]">
                <span className="inline-flex items-center gap-1 truncate max-w-[70%]">
                  <Mail className="w-3 h-3 shrink-0" />
                  <span className="truncate">{teacher.emel}</span>
                </span>
                <span className="inline-flex items-center gap-1 font-mono tabular-nums shrink-0 text-[#EAECEF]">
                  <Phone className="w-3 h-3 text-[#0ECB81]" />
                  Samb. {teacher.noSambungan}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTeacher ? 'Kemaskini Maklumat Guru / Staf' : 'Tambah Guru / Staf Baharu'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
              Nama Penuh (Rekaan)
            </label>
            <input
              type="text"
              required
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Contoh: Cikgu Nurul Syafiqah binti Yusof"
              className="w-full px-3.5 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">Jawatan</label>
              <input
                type="text"
                required
                value={jawatan}
                onChange={(e) => setJawatan(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
                Peranan Sistem
              </label>
              <select
                value={perananSistem}
                onChange={(e) => setPerananSistem(e.target.value as UserRole)}
                className="w-full px-3.5 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              >
                {ROLES_LIST.map((r) => (
                  <option key={r} value={r}>
                    {getRoleDisplayLabel(r)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">Bidang</label>
              <select
                value={bidang}
                onChange={(e) => setBidang(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              >
                {BIDANG_LIST.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
                Panitia / Unit
              </label>
              <input
                type="text"
                required
                value={panitia}
                onChange={(e) => setPanitia(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
                E-mel Simulasi
              </label>
              <input
                type="email"
                value={emel}
                onChange={(e) => setEmel(e.target.value)}
                placeholder="nama@smksalaping.demo.my"
                className="w-full px-3.5 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
                No. Sambungan
              </label>
              <input
                type="text"
                value={noSambungan}
                onChange={(e) => setNoSambungan(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              />
            </div>
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
              {editingTeacher ? 'Simpan Kemaskini' : 'Simpan Rekod'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) onDeleteTeacher(deleteTarget.id);
        }}
        itemName={deleteTarget?.nama ?? ''}
      />
    </div>
  );
};
