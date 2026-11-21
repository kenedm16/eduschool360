import React, { useEffect, useState } from 'react';
import {
  TaskItem,
  TaskPriority,
  TaskStatus,
  TeacherItem,
  UserRole,
} from '../../../types/eduschool';
import { ROLE_PROFILES } from '../../../utils/rolePermissions';
import {
  TASK_CATEGORIES,
  TASK_PRIORITY_OPTIONS,
  TASK_STATUS_OPTIONS,
  TASK_UNITS,
  generateNextTaskCode,
  getTaskCode,
  getTodayIsoDate,
} from '../../../utils/taskHelpers';
import { Modal } from '../../common/Modal';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTask: TaskItem | null;
  allTasks: TaskItem[];
  teachers: TeacherItem[];
  activeRole: UserRole;
  onSaveNew: (task: Omit<TaskItem, 'id'>) => void;
  onSaveEdit: (task: TaskItem) => void;
}

export const TaskFormModal: React.FC<TaskFormModalProps> = ({
  isOpen,
  onClose,
  editingTask,
  allTasks,
  teachers,
  activeRole,
  onSaveNew,
  onSaveEdit,
}) => {
  const defaultIssuer = ROLE_PROFILES[activeRole].userName;
  const defaultAssignee = teachers[0]?.nama ?? defaultIssuer;

  const [kodTugasan, setKodTugasan] = useState('');
  const [tajuk, setTajuk] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [kategori, setKategori] = useState(TASK_CATEGORIES[0]);
  const [unit, setUnit] = useState(TASK_UNITS[0]);
  const [pemberiArahan, setPemberiArahan] = useState(defaultIssuer);
  const [pegawai, setPegawai] = useState(defaultAssignee);
  const [tarikhMula, setTarikhMula] = useState(getTodayIsoDate());
  const [tarikhAkhir, setTarikhAkhir] = useState('2026-11-30');
  const [keutamaan, setKeutamaan] = useState<TaskPriority>('Sederhana');
  const [status, setStatus] = useState<TaskStatus>('Belum Mula');
  const [catatan, setCatatan] = useState('');
  const [dateError, setDateError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setDateError('');
    if (editingTask) {
      setKodTugasan(getTaskCode(editingTask));
      setTajuk(editingTask.tajuk);
      setKeterangan(editingTask.keterangan);
      setKategori(editingTask.kategori || TASK_CATEGORIES[0]);
      setUnit(editingTask.unit || TASK_UNITS[0]);
      setPemberiArahan(editingTask.pemberiArahan || defaultIssuer);
      setPegawai(editingTask.pegawai || defaultAssignee);
      setTarikhMula(editingTask.tarikhMula);
      setTarikhAkhir(editingTask.tarikhAkhir);
      setKeutamaan(editingTask.keutamaan);
      setStatus(editingTask.status);
      setCatatan(editingTask.catatan || '');
    } else {
      setKodTugasan(generateNextTaskCode(allTasks));
      setTajuk('');
      setKeterangan('');
      setKategori('Akademik');
      setUnit(
        activeRole === 'Ketua Panitia'
          ? 'Panitia Matematik'
          : activeRole === 'Ketua Bidang'
            ? 'Bidang Sains & Matematik'
            : 'Kurikulum'
      );
      setPemberiArahan(defaultIssuer);
      setPegawai(defaultAssignee);
      setTarikhMula(getTodayIsoDate());
      setTarikhAkhir('2026-11-30');
      setKeutamaan('Sederhana');
      setStatus('Belum Mula');
      setCatatan('');
    }
  }, [isOpen, editingTask, allTasks, teachers, activeRole, defaultIssuer, defaultAssignee]);

  const issuerOptions = Array.from(
    new Set([defaultIssuer, ...teachers.map((t) => t.nama), editingTask?.pemberiArahan || ''].filter(Boolean))
  );

  const assigneeOptions = Array.from(
    new Set([...teachers.map((t) => t.nama), editingTask?.pegawai || ''].filter(Boolean))
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tajuk.trim()) return;
    if (tarikhAkhir && tarikhMula && tarikhAkhir < tarikhMula) {
      setDateError('Tarikh akhir mestilah sama atau selepas tarikh mula.');
      return;
    }

    if (editingTask) {
      onSaveEdit({
        ...editingTask,
        kodTugasan,
        tajuk: tajuk.trim(),
        keterangan: keterangan.trim(),
        kategori,
        unit,
        pemberiArahan,
        pegawai,
        tarikhMula,
        tarikhAkhir,
        keutamaan,
        status,
        catatan: catatan.trim(),
      });
    } else {
      onSaveNew({
        kodTugasan,
        tajuk: tajuk.trim(),
        keterangan: keterangan.trim(),
        kategori,
        unit,
        pemberiArahan,
        pegawai,
        tarikhMula,
        tarikhAkhir,
        keutamaan,
        status,
        catatan: catatan.trim(),
      });
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingTask ? 'Kemaskini Tugasan' : 'Tambah Tugasan Baharu'}
      subtitle="Lengkapkan maklumat arahan, pegawai bertanggungjawab, unit dan tempoh pelaksanaan."
      maxWidthClass="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
              ID Tugasan (Automatik)
            </label>
            <input
              type="text"
              readOnly
              value={kodTugasan}
              aria-label="ID Tugasan"
              className="w-full px-3.5 py-2 text-sm font-mono font-bold bg-[#12161B] text-[#F0B90B] border border-[#2B3139] rounded-lg focus:outline-none cursor-default"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
              Tajuk Tugasan <span className="text-[#F6465D]">*</span>
            </label>
            <input
              type="text"
              required
              value={tajuk}
              onChange={(e) => setTajuk(e.target.value)}
              placeholder="Contoh: Penyediaan Takwim Peperiksaan Penggal 1"
              className="w-full px-3.5 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg focus:outline-none focus:border-[#F0B90B]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
            Keterangan Tugasan
          </label>
          <textarea
            rows={3}
            value={keterangan}
            onChange={(e) => setKeterangan(e.target.value)}
            placeholder="Nyatakan arahan terperinci, skop tindakan dan hasil yang dijangka..."
            className="w-full px-3.5 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg focus:outline-none focus:border-[#F0B90B]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
              Kategori Tugasan
            </label>
            <select
              value={kategori}
              onChange={(e) => setKategori(e.target.value)}
              aria-label="Kategori Tugasan"
              className="w-full px-3.5 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg focus:outline-none focus:border-[#F0B90B]"
            >
              {TASK_CATEGORIES.map((kat) => (
                <option key={kat} value={kat}>
                  {kat}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
              Unit atau Bahagian
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              aria-label="Unit atau Bahagian"
              className="w-full px-3.5 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg focus:outline-none focus:border-[#F0B90B]"
            >
              {TASK_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
              Pegawai yang Mengeluarkan Arahan
            </label>
            <select
              value={pemberiArahan}
              onChange={(e) => setPemberiArahan(e.target.value)}
              aria-label="Pegawai yang Mengeluarkan Arahan"
              className="w-full px-3.5 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg focus:outline-none focus:border-[#F0B90B]"
            >
              {issuerOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
              Guru / Staf yang Menerima Tugasan
            </label>
            <select
              value={pegawai}
              onChange={(e) => setPegawai(e.target.value)}
              aria-label="Guru atau Staf Penerima Tugasan"
              className="w-full px-3.5 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg focus:outline-none focus:border-[#F0B90B]"
            >
              {assigneeOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
              Tarikh Mula
            </label>
            <input
              type="date"
              required
              value={tarikhMula}
              onChange={(e) => setTarikhMula(e.target.value)}
              aria-label="Tarikh Mula"
              className="w-full px-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg focus:outline-none focus:border-[#F0B90B]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
              Tarikh Akhir
            </label>
            <input
              type="date"
              required
              value={tarikhAkhir}
              onChange={(e) => setTarikhAkhir(e.target.value)}
              aria-label="Tarikh Akhir"
              className="w-full px-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg focus:outline-none focus:border-[#F0B90B]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
              Tahap Keutamaan
            </label>
            <select
              value={keutamaan}
              onChange={(e) => setKeutamaan(e.target.value as TaskPriority)}
              aria-label="Tahap Keutamaan"
              className="w-full px-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg focus:outline-none focus:border-[#F0B90B]"
            >
              {TASK_PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              aria-label="Status Tugasan"
              className="w-full px-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg focus:outline-none focus:border-[#F0B90B]"
            >
              {TASK_STATUS_OPTIONS.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>

        {dateError && (
          <p className="text-xs font-semibold text-[#F6465D] bg-[#F6465D]/10 border border-[#F6465D]/30 rounded-lg px-3 py-2">
            {dateError}
          </p>
        )}

        <div>
          <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
            Catatan Tambahan
          </label>
          <textarea
            rows={2}
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            placeholder="Nota rujukan, pautan dokumen atau peringatan khas (pilihan)..."
            className="w-full px-3.5 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg focus:outline-none focus:border-[#F0B90B]"
          />
        </div>

        <div className="flex justify-end gap-2.5 pt-2 border-t border-[#2B3139]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[#EAECEF] bg-[#1E2329] border border-[#2B3139] rounded-lg hover:bg-[#2B3139] transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            className="px-5 py-2 text-sm font-bold text-[#0B0E11] bg-[#F0B90B] rounded-lg hover:bg-[#F8D12F] transition-colors"
          >
            {editingTask ? 'Simpan Kemaskini' : 'Simpan'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
