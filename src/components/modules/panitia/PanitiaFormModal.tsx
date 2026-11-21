import React, { useEffect, useState } from 'react';
import { PanitiaItem, TeacherItem } from '../../../types/eduschool';
import {
  PANITIA_BIDANG_OPTIONS,
  generateNextPanitiaCode,
  getPanitiaCode,
} from '../../../utils/panitiaHelpers';
import { Modal } from '../../common/Modal';

interface PanitiaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingPanitia: PanitiaItem | null;
  allPanitias: PanitiaItem[];
  teachers: TeacherItem[];
  onSaveNew: (item: Omit<PanitiaItem, 'id'>) => void;
  onSaveEdit: (item: PanitiaItem) => void;
}

export const PanitiaFormModal: React.FC<PanitiaFormModalProps> = ({
  isOpen,
  onClose,
  editingPanitia,
  allPanitias,
  teachers,
  onSaveNew,
  onSaveEdit,
}) => {
  const defaultTeacher = teachers[0]?.nama ?? 'Cikgu Fedelish Modirim';
  const secondTeacher = teachers[1]?.nama ?? defaultTeacher;

  const [kodPanitia, setKodPanitia] = useState('');
  const [nama, setNama] = useState('');
  const [bidang, setBidang] = useState(PANITIA_BIDANG_OPTIONS[0]);
  const [ketuaPanitia, setKetuaPanitia] = useState(defaultTeacher);
  const [setiausaha, setSetiausaha] = useState(secondTeacher);
  const [tahunSemasa, setTahunSemasa] = useState('2026');
  const [tarikhPenubuhan, setTarikhPenubuhan] = useState('2016-01-05');
  const [statusAktif, setStatusAktif] = useState<'Aktif' | 'Tidak Aktif'>('Aktif');
  const [peruntukanTahunan, setPeruntukanTahunan] = useState('3500');
  const [objektifPanitia, setObjektifPanitia] = useState('');
  const [sasaranPencapaian, setSasaranPencapaian] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    if (editingPanitia) {
      setKodPanitia(getPanitiaCode(editingPanitia));
      setNama(editingPanitia.nama);
      setBidang(editingPanitia.bidang);
      setKetuaPanitia(editingPanitia.ketuaPanitia);
      setSetiausaha(editingPanitia.setiausaha || secondTeacher);
      setTahunSemasa(editingPanitia.tahunSemasa || '2026');
      setTarikhPenubuhan(editingPanitia.tarikhPenubuhan || '2016-01-05');
      setStatusAktif(editingPanitia.statusAktif || 'Aktif');
      setPeruntukanTahunan(String(editingPanitia.peruntukanTahunan));
      setObjektifPanitia(editingPanitia.objektifPanitia || '');
      setSasaranPencapaian(editingPanitia.sasaranPencapaian || '');
    } else {
      setKodPanitia(generateNextPanitiaCode(allPanitias));
      setNama('');
      setBidang('Bahasa');
      setKetuaPanitia(defaultTeacher);
      setSetiausaha(secondTeacher);
      setTahunSemasa('2026');
      setTarikhPenubuhan('2026-01-05');
      setStatusAktif('Aktif');
      setPeruntukanTahunan('3500');
      setObjektifPanitia('');
      setSasaranPencapaian('');
    }
  }, [isOpen, editingPanitia, allPanitias, defaultTeacher, secondTeacher]);

  const teacherOptions = Array.from(
    new Set([
      ...teachers.map((t) => t.nama),
      editingPanitia?.ketuaPanitia || '',
      editingPanitia?.setiausaha || '',
    ].filter(Boolean))
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) return;
    const budget = Number(peruntukanTahunan) || 0;

    if (editingPanitia) {
      const mergedMembers = Array.from(
        new Set([ketuaPanitia, setiausaha, ...editingPanitia.ahli].filter(Boolean))
      );
      onSaveEdit({
        ...editingPanitia,
        kodPanitia,
        nama: nama.trim(),
        bidang,
        ketuaPanitia,
        setiausaha,
        ahli: mergedMembers,
        tahunSemasa: tahunSemasa.trim() || '2026',
        tarikhPenubuhan,
        statusAktif,
        peruntukanTahunan: budget,
        objektifPanitia: objektifPanitia.trim(),
        sasaranPencapaian: sasaranPencapaian.trim(),
      });
    } else {
      const initialMembers = Array.from(new Set([ketuaPanitia, setiausaha].filter(Boolean)));
      onSaveNew({
        kodPanitia,
        nama: nama.trim(),
        bidang,
        ketuaPanitia,
        setiausaha,
        ahli: initialMembers,
        tahunSemasa: tahunSemasa.trim() || '2026',
        tarikhPenubuhan,
        statusAktif,
        objektifPanitia:
          objektifPanitia.trim() ||
          `Memperkasakan kecemerlangan akademik dan inovasi PdP ${nama.trim()}.`,
        sasaranPencapaian:
          sasaranPencapaian.trim() || 'Mencapai kelulusan 95% dan peningkatan GPMP.',
        peruntukanTahunan: budget,
        perancanganTahunan: [],
        aktivitiTerkini: [],
        aktivitiTerperinci: [],
        mesyuarat: [],
        dokumenPanitia: [],
        rekodKewangan: [
          {
            id: `kf-${Date.now()}`,
            tahunKewangan: tahunSemasa.trim() || '2026',
            perkara: `Peruntukan PCG Tahunan Awal (${nama.trim()})`,
            tarikh: `${tahunSemasa.trim() || '2026'}-02-15`,
            jenis: 'Peruntukan',
            jumlah: budget,
            sumberPeruntukan: 'PCG Mata Pelajaran Teras',
            namaPembekal: '-',
            noInvois: '-',
          },
        ],
        bilanganLaporan: 0,
      });
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingPanitia ? 'Kemaskini Profil Panitia' : 'Tambah Panitia Baharu'}
      subtitle="Lengkapkan profil induk, jawatankuasa utama dan peruntukan PCG panitia."
      maxWidthClass="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
              ID Panitia (Automatik)
            </label>
            <input
              type="text"
              readOnly
              value={kodPanitia}
              aria-label="ID Panitia"
              className="w-full px-3.5 py-2 text-sm font-mono font-bold bg-[#12161B] text-[#F0B90B] border border-[#2B3139] rounded-lg cursor-default"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
              Nama Panitia <span className="text-[#F6465D]">*</span>
            </label>
            <input
              type="text"
              required
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Contoh: Panitia Pendidikan Moral"
              className="w-full px-3.5 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg focus:outline-none focus:border-[#F0B90B]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">Bidang</label>
            <select
              value={bidang}
              onChange={(e) => setBidang(e.target.value)}
              aria-label="Bidang Panitia"
              className="w-full px-3.5 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg focus:outline-none focus:border-[#F0B90B]"
            >
              {PANITIA_BIDANG_OPTIONS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
              Ketua Panitia
            </label>
            <select
              value={ketuaPanitia}
              onChange={(e) => setKetuaPanitia(e.target.value)}
              aria-label="Ketua Panitia"
              className="w-full px-3.5 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg focus:outline-none focus:border-[#F0B90B]"
            >
              {teacherOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
              Setiausaha Panitia
            </label>
            <select
              value={setiausaha}
              onChange={(e) => setSetiausaha(e.target.value)}
              aria-label="Setiausaha Panitia"
              className="w-full px-3.5 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg focus:outline-none focus:border-[#F0B90B]"
            >
              {teacherOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
              Tahun Semasa
            </label>
            <input
              type="text"
              value={tahunSemasa}
              onChange={(e) => setTahunSemasa(e.target.value)}
              aria-label="Tahun Semasa"
              className="w-full px-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg focus:outline-none focus:border-[#F0B90B]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
              Tarikh Penubuhan
            </label>
            <input
              type="date"
              value={tarikhPenubuhan}
              onChange={(e) => setTarikhPenubuhan(e.target.value)}
              aria-label="Tarikh Penubuhan"
              className="w-full px-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg focus:outline-none focus:border-[#F0B90B]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
              Status Aktif
            </label>
            <select
              value={statusAktif}
              onChange={(e) => setStatusAktif(e.target.value as 'Aktif' | 'Tidak Aktif')}
              aria-label="Status Aktif Panitia"
              className="w-full px-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg focus:outline-none focus:border-[#F0B90B]"
            >
              <option value="Aktif">Aktif</option>
              <option value="Tidak Aktif">Tidak Aktif</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
              Peruntukan PCG (RM)
            </label>
            <input
              type="number"
              min="0"
              value={peruntukanTahunan}
              onChange={(e) => setPeruntukanTahunan(e.target.value)}
              aria-label="Peruntukan Tahunan PCG"
              className="w-full px-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg focus:outline-none focus:border-[#F0B90B]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
            Objektif Panitia
          </label>
          <textarea
            rows={2}
            value={objektifPanitia}
            onChange={(e) => setObjektifPanitia(e.target.value)}
            placeholder="Fokus pengajaran, pembelajaran dan peningkatan kualiti mata pelajaran..."
            className="w-full px-3.5 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg focus:outline-none focus:border-[#F0B90B]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
            Sasaran Pencapaian
          </label>
          <input
            type="text"
            value={sasaranPencapaian}
            onChange={(e) => setSasaranPencapaian(e.target.value)}
            placeholder="Contoh: 95% lulus peperiksaan akhir & peningkatan GPMP 0.25"
            className="w-full px-3.5 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg focus:outline-none focus:border-[#F0B90B]"
          />
        </div>

        <div className="flex justify-end gap-2.5 pt-2 border-t border-[#2B3139]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[#EAECEF] bg-[#1E2329] border border-[#2B3139] rounded-lg hover:bg-[#2B3139]"
          >
            Batal
          </button>
          <button
            type="submit"
            className="px-5 py-2 text-sm font-bold text-[#0B0E11] bg-[#F0B90B] rounded-lg hover:bg-[#F8D12F]"
          >
            {editingPanitia ? 'Simpan Kemaskini' : 'Simpan Panitia'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
