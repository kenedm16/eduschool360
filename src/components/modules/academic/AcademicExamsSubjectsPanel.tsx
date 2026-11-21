import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  Calendar,
  Edit3,
  Eye,
  FileSpreadsheet,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  AcademicExam,
  AcademicExamStatus,
  AcademicScoreRecord,
  AcademicSubject,
  ExamType,
  GradeSchemeConfig,
  TeacherItem,
} from '../../../types/eduschool';
import {
  computeExamOverview,
  generateNextExamCode,
} from '../../../utils/academicCalcHelper';
import { formatShortDate } from '../../../utils/formatters';
import { ConfirmDeleteModal, Modal } from '../../common/Modal';

interface AcademicExamsSubjectsPanelProps {
  exams: AcademicExam[];
  subjects: AcademicSubject[];
  scores: AcademicScoreRecord[];
  gradeSchemes: GradeSchemeConfig[];
  teachers: TeacherItem[];
  canManageExams: boolean;
  canDeleteExams: boolean;
  onAddExam: (exam: Omit<AcademicExam, 'id'>) => void;
  onUpdateExam: (exam: AcademicExam) => void;
  onDeleteExam: (id: string) => void;
  onAddSubject: (subject: Omit<AcademicSubject, 'id'>) => void;
  onUpdateSubject: (subject: AcademicSubject) => void;
  onDeleteSubject: (id: string) => void;
  onInspectExam: (examId: string) => void;
}

const EXAM_TYPES: ExamType[] = [
  'Ujian Diagnostik',
  'Ujian Setara',
  'Pertengahan Tahun',
  'Akhir Tahun',
  'Percubaan SPM',
  'Peperiksaan STPM',
];

const EXAM_STATUSES: AcademicExamStatus[] = [
  'Dirancang',
  'Sedang Berlangsung',
  'Selesai',
  'Disahkan',
];

const TINGKATAN_OPTIONS = [
  'Tingkatan 1',
  'Tingkatan 2',
  'Tingkatan 3',
  'Tingkatan 4',
  'Tingkatan 5',
  'Tingkatan 6',
];

export const AcademicExamsSubjectsPanel: React.FC<AcademicExamsSubjectsPanelProps> = ({
  exams,
  subjects,
  scores,
  gradeSchemes,
  teachers,
  canManageExams,
  canDeleteExams,
  onAddExam,
  onUpdateExam,
  onDeleteExam,
  onAddSubject,
  onUpdateSubject,
  onDeleteSubject,
  onInspectExam,
}) => {
  // Modal Peperiksaan
  const [examModalOpen, setExamModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<AcademicExam | null>(null);
  const [viewingExam, setViewingExam] = useState<AcademicExam | null>(null);
  const [deleteExamTarget, setDeleteExamTarget] = useState<AcademicExam | null>(null);

  const [kodPeperiksaan, setKodPeperiksaan] = useState('');
  const [namaExam, setNamaExam] = useState('');
  const [tahunExam, setTahunExam] = useState('2026');
  const [tingkatanExam, setTingkatanExam] = useState('Tingkatan 5');
  const [tarikhExam, setTarikhExam] = useState('2026-11-20');
  const [jenisExam, setJenisExam] = useState<ExamType>('Ujian Setara');
  const [bilMuridSasaran, setBilMuridSasaran] = useState(30);
  const [statusExam, setStatusExam] = useState<AcademicExamStatus>('Dirancang');
  const [schemeIdExam, setSchemeIdExam] = useState(gradeSchemes[0]?.id ?? 'skema-spm');
  const [catatanExam, setCatatanExam] = useState('');

  // Modal Mata Pelajaran
  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<AcademicSubject | null>(null);
  const [deleteSubjectTarget, setDeleteSubjectTarget] = useState<AcademicSubject | null>(null);
  const [filterSubTingkatan, setFilterSubTingkatan] = useState('Semua');

  const [namaSubjek, setNamaSubjek] = useState('');
  const [kodSubjek, setKodSubjek] = useState('');
  const [tingkatanSubjek, setTingkatanSubjek] = useState('Tingkatan 5');
  const [guruSubjek, setGuruSubjek] = useState(teachers[0]?.nama ?? '');
  const [ketuaPanitiaSubjek, setKetuaPanitiaSubjek] = useState(teachers[0]?.nama ?? '');
  const [sasaranSubjek, setSasaranSubjek] = useState(30);
  const [bidangSubjek, setBidangSubjek] = useState('Sains & Matematik');

  const openCreateExam = () => {
    setEditingExam(null);
    setKodPeperiksaan(generateNextExamCode(exams));
    setNamaExam('');
    setTahunExam('2026');
    setTingkatanExam('Tingkatan 5');
    setTarikhExam(new Date().toISOString().slice(0, 10));
    setJenisExam('Ujian Setara');
    setBilMuridSasaran(30);
    setStatusExam('Dirancang');
    setSchemeIdExam(gradeSchemes[0]?.id ?? 'skema-spm');
    setCatatanExam('');
    setExamModalOpen(true);
  };

  const openEditExam = (ex: AcademicExam) => {
    setEditingExam(ex);
    setKodPeperiksaan(ex.kodPeperiksaan);
    setNamaExam(ex.nama);
    setTahunExam(ex.tahun);
    setTingkatanExam(ex.tingkatan);
    setTarikhExam(ex.tarikh);
    setJenisExam(ex.jenis);
    setBilMuridSasaran(ex.bilanganMuridSasaran);
    setStatusExam(ex.status);
    setSchemeIdExam(ex.schemeId);
    setCatatanExam(ex.catatan ?? '');
    setExamModalOpen(true);
  };

  const handleSubmitExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaExam.trim()) return;
    const payload: Omit<AcademicExam, 'id'> = {
      kodPeperiksaan: kodPeperiksaan.trim() || generateNextExamCode(exams),
      nama: namaExam.trim(),
      tahun: tahunExam.trim() || '2026',
      tingkatan: tingkatanExam,
      tarikh: tarikhExam,
      jenis: jenisExam,
      bilanganMuridSasaran: Math.max(0, Number(bilMuridSasaran) || 0),
      status: statusExam,
      schemeId: schemeIdExam,
      catatan: catatanExam.trim(),
    };
    if (editingExam) {
      onUpdateExam({ ...payload, id: editingExam.id });
    } else {
      onAddExam(payload);
    }
    setExamModalOpen(false);
  };

  const openCreateSubject = () => {
    setEditingSubject(null);
    setNamaSubjek('');
    setKodSubjek('');
    setTingkatanSubjek('Tingkatan 5');
    setGuruSubjek(teachers[0]?.nama ?? '');
    setKetuaPanitiaSubjek(teachers[0]?.nama ?? '');
    setSasaranSubjek(30);
    setBidangSubjek('Sains & Matematik');
    setSubjectModalOpen(true);
  };

  const openEditSubject = (sub: AcademicSubject) => {
    setEditingSubject(sub);
    setNamaSubjek(sub.nama);
    setKodSubjek(sub.kod);
    setTingkatanSubjek(sub.tingkatan);
    setGuruSubjek(sub.guruMataPelajaran);
    setKetuaPanitiaSubjek(sub.ketuaPanitia);
    setSasaranSubjek(sub.bilanganMuridSasaran);
    setBidangSubjek(sub.bidang ?? 'Bahasa');
    setSubjectModalOpen(true);
  };

  const handleSubmitSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaSubjek.trim() || !kodSubjek.trim()) return;
    const payload: Omit<AcademicSubject, 'id'> = {
      nama: namaSubjek.trim(),
      kod: kodSubjek.trim().toUpperCase(),
      tingkatan: tingkatanSubjek,
      guruMataPelajaran: guruSubjek,
      ketuaPanitia: ketuaPanitiaSubjek,
      bilanganMuridSasaran: Math.max(0, Number(sasaranSubjek) || 0),
      bidang: bidangSubjek,
    };
    if (editingSubject) {
      onUpdateSubject({ ...payload, id: editingSubject.id });
    } else {
      onAddSubject(payload);
    }
    setSubjectModalOpen(false);
  };

  const filteredSubjects = useMemo(() => {
    if (filterSubTingkatan === 'Semua') return subjects;
    return subjects.filter((s) => s.tingkatan === filterSubTingkatan);
  }, [subjects, filterSubTingkatan]);

  const statusBadgeClass = (status: AcademicExamStatus) => {
    switch (status) {
      case 'Disahkan':
        return 'bg-[#0ECB81]/15 text-[#0ECB81] border-[#0ECB81]/30';
      case 'Selesai':
        return 'bg-[#38BDF8]/15 text-[#38BDF8] border-[#38BDF8]/30';
      case 'Sedang Berlangsung':
        return 'bg-[#F0B90B]/15 text-[#F0B90B] border-[#F0B90B]/30';
      default:
        return 'bg-[#1E2329] text-[#848E9C] border-[#2B3139]';
    }
  };

  return (
    <div className="space-y-6">
      {/* B. PENGURUSAN PEPERIKSAAN */}
      <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#2B3139] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[#EAECEF] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#F0B90B]" />
              Pengurusan Peperiksaan Sekolah
            </h2>
            <p className="text-xs text-[#848E9C]">
              Tambah, lihat, kemaskini atau padam jadual peperiksaan berserta skema gred masing-masing
            </p>
          </div>
          {canManageExams && (
            <button
              type="button"
              onClick={openCreateExam}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-[#0B0E11] bg-[#F0B90B] rounded-lg hover:bg-[#F8D12F] whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              Tambah Peperiksaan
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#1E2329] border-b border-[#2B3139] text-[#848E9C] font-semibold">
                <th className="py-3 px-4">Kod & Nama Peperiksaan</th>
                <th className="py-3 px-3">Jenis</th>
                <th className="py-3 px-3">Tingkatan & Tahun</th>
                <th className="py-3 px-3">Tarikh</th>
                <th className="py-3 px-3">Skema Gred</th>
                <th className="py-3 px-3 text-right">Murid Rekod</th>
                <th className="py-3 px-3 text-right">GPS / % Lulus</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2B3139]">
              {exams.map((ex) => {
                const ov = computeExamOverview(ex, subjects, scores, gradeSchemes);
                return (
                  <tr key={ex.id} className="hover:bg-[#1E2329]/50">
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#EAECEF] text-sm">{ex.nama}</div>
                      <div className="text-[11px] text-[#848E9C]">{ex.kodPeperiksaan}</div>
                    </td>
                    <td className="py-3 px-3 text-[#EAECEF]">{ex.jenis}</td>
                    <td className="py-3 px-3 text-[#EAECEF]">
                      {ex.tingkatan} · {ex.tahun}
                    </td>
                    <td className="py-3 px-3 text-[#848E9C] whitespace-nowrap">
                      {formatShortDate(ex.tarikh)}
                    </td>
                    <td className="py-3 px-3 text-[#EAECEF] max-w-[190px] truncate">
                      {ov.scheme.nama}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums text-[#EAECEF]">
                      <span className="font-bold">{ov.uniqueStudentsCount}</span>
                      <span className="text-[#848E9C]"> / {ex.bilanganMuridSasaran}</span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums">
                      <span className="text-[#F0B90B] font-bold">
                        {ov.gps !== null ? ov.gps.toFixed(2) : '-'}
                      </span>
                      <span className="text-[#848E9C]"> · </span>
                      <span className="text-[#0ECB81] font-semibold">
                        {ov.passRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md border text-[11px] font-semibold ${statusBadgeClass(
                          ex.status
                        )}`}
                      >
                        {ex.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setViewingExam(ex)}
                        className="p-1.5 rounded-lg text-[#848E9C] hover:text-[#38BDF8] hover:bg-[#1E2329]"
                        aria-label={`Lihat butiran ${ex.nama}`}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {canManageExams && (
                        <button
                          type="button"
                          onClick={() => openEditExam(ex)}
                          className="p-1.5 rounded-lg text-[#848E9C] hover:text-[#F0B90B] hover:bg-[#1E2329]"
                          aria-label={`Kemaskini peperiksaan ${ex.nama}`}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      )}
                      {canDeleteExams && (
                        <button
                          type="button"
                          onClick={() => setDeleteExamTarget(ex)}
                          className="p-1.5 rounded-lg text-[#848E9C] hover:text-[#F6465D] hover:bg-[#F6465D]/10"
                          aria-label={`Padam peperiksaan ${ex.nama}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* C. PENGURUSAN MATA PELAJARAN */}
      <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#2B3139] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[#EAECEF] flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#0ECB81]" />
              Pengurusan Mata Pelajaran
            </h2>
            <p className="text-xs text-[#848E9C]">
              Daftar kod mata pelajaran, guru mata pelajaran, ketua panitia dan bilangan calon mengikut tingkatan
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <select
              aria-label="Tapis Tingkatan Mata Pelajaran"
              value={filterSubTingkatan}
              onChange={(e) => setFilterSubTingkatan(e.target.value)}
              className="px-3 py-2 text-xs font-semibold bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
            >
              <option value="Semua">Semua Tingkatan</option>
              {TINGKATAN_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            {canManageExams && (
              <button
                type="button"
                onClick={openCreateSubject}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-[#0B0E11] bg-[#0ECB81] rounded-lg hover:bg-[#15E092] whitespace-nowrap shrink-0"
              >
                <Plus className="w-4 h-4" />
                Tambah Mata Pelajaran
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#1E2329] border-b border-[#2B3139] text-[#848E9C] font-semibold">
                <th className="py-3 px-4">Kod</th>
                <th className="py-3 px-3">Nama Mata Pelajaran</th>
                <th className="py-3 px-3">Tingkatan</th>
                <th className="py-3 px-3">Guru Mata Pelajaran</th>
                <th className="py-3 px-3">Ketua Panitia</th>
                <th className="py-3 px-3 text-right">Rekod Markah</th>
                <th className="py-3 px-3 text-right">Sasaran Murid</th>
                {canManageExams && <th className="py-3 px-4 text-right">Tindakan</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2B3139]">
              {filteredSubjects.map((sub) => {
                const scoreCount = scores.filter((sc) => sc.subjectId === sub.id).length;
                return (
                  <tr key={sub.id} className="hover:bg-[#1E2329]/50">
                    <td className="py-3 px-4 font-mono font-bold text-[#F0B90B]">
                      {sub.kod}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-[#EAECEF]">{sub.nama}</div>
                      {sub.bidang && (
                        <div className="text-[11px] text-[#848E9C]">Bidang {sub.bidang}</div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-[#EAECEF]">{sub.tingkatan}</td>
                    <td className="py-3 px-3 text-[#EAECEF]">{sub.guruMataPelajaran}</td>
                    <td className="py-3 px-3 text-[#848E9C]">{sub.ketuaPanitia}</td>
                    <td className="py-3 px-3 text-right tabular-nums text-[#0ECB81] font-semibold">
                      {scoreCount} rekod
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums text-[#EAECEF]">
                      {sub.bilanganMuridSasaran} murid
                    </td>
                    {canManageExams && (
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openEditSubject(sub)}
                          className="p-1.5 rounded-lg text-[#848E9C] hover:text-[#F0B90B] hover:bg-[#1E2329]"
                          aria-label={`Kemaskini subjek ${sub.nama}`}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {canDeleteExams && (
                          <button
                            type="button"
                            onClick={() => setDeleteSubjectTarget(sub)}
                            className="p-1.5 rounded-lg text-[#848E9C] hover:text-[#F6465D] hover:bg-[#F6465D]/10"
                            aria-label={`Padam subjek ${sub.nama}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah / Kemaskini Peperiksaan */}
      <Modal
        isOpen={examModalOpen}
        onClose={() => setExamModalOpen(false)}
        title={editingExam ? 'Kemaskini Maklumat Peperiksaan' : 'Daftar Peperiksaan Baharu'}
        subtitle="Tetapkan butiran peperiksaan dan skema gred yang digunakan untuk pengiraan automatik."
        maxWidthClass="max-w-xl"
      >
        <form onSubmit={handleSubmitExam} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1">
                Kod Peperiksaan
              </label>
              <input
                type="text"
                required
                value={kodPeperiksaan}
                onChange={(e) => setKodPeperiksaan(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#848E9C] mb-1">
                Nama Peperiksaan
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Akhir Tahun 2026"
                value={namaExam}
                onChange={(e) => setNamaExam(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1">
                Jenis Peperiksaan
              </label>
              <select
                value={jenisExam}
                onChange={(e) => setJenisExam(e.target.value as ExamType)}
                className="w-full px-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              >
                {EXAM_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1">
                Tingkatan
              </label>
              <select
                value={tingkatanExam}
                onChange={(e) => setTingkatanExam(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              >
                {TINGKATAN_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1">
                Tahun
              </label>
              <input
                type="text"
                required
                value={tahunExam}
                onChange={(e) => setTahunExam(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1">
                Tarikh Peperiksaan
              </label>
              <input
                type="date"
                required
                value={tarikhExam}
                onChange={(e) => setTarikhExam(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1">
                Sasaran Bil. Murid
              </label>
              <input
                type="number"
                min={1}
                value={bilMuridSasaran}
                onChange={(e) => setBilMuridSasaran(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1">
                Status Peperiksaan
              </label>
              <select
                value={statusExam}
                onChange={(e) => setStatusExam(e.target.value as AcademicExamStatus)}
                className="w-full px-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              >
                {EXAM_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#848E9C] mb-1">
              Skema Gred & Formula GPS/GPMP
            </label>
            <select
              value={schemeIdExam}
              onChange={(e) => setSchemeIdExam(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
            >
              {gradeSchemes.map((sc) => (
                <option key={sc.id} value={sc.id}>
                  {sc.nama}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#848E9C] mb-1">
              Catatan Peperiksaan (Pilihan)
            </label>
            <textarea
              rows={2}
              value={catatanExam}
              onChange={(e) => setCatatanExam(e.target.value)}
              placeholder="Catatan pentadbiran atau garis panduan peperiksaan..."
              className="w-full px-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setExamModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-[#EAECEF] bg-[#1E2329] border border-[#2B3139] rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-bold text-[#0B0E11] bg-[#F0B90B] rounded-lg hover:bg-[#F8D12F]"
            >
              {editingExam ? 'Simpan Kemaskini' : 'Simpan Peperiksaan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Lihat Butiran Peperiksaan */}
      <Modal
        isOpen={Boolean(viewingExam)}
        onClose={() => setViewingExam(null)}
        title={viewingExam?.nama ?? 'Butiran Peperiksaan'}
        subtitle={viewingExam ? `${viewingExam.kodPeperiksaan} · ${viewingExam.jenis}` : undefined}
        maxWidthClass="max-w-lg"
      >
        {viewingExam && (() => {
          const ov = computeExamOverview(viewingExam, subjects, scores, gradeSchemes);
          return (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-[#0B0E11] p-4 rounded-lg border border-[#2B3139]">
                <div>
                  <div className="text-[#848E9C]">Tingkatan & Tahun</div>
                  <div className="font-bold text-[#EAECEF] mt-0.5">
                    {viewingExam.tingkatan} ({viewingExam.tahun})
                  </div>
                </div>
                <div>
                  <div className="text-[#848E9C]">Tarikh & Status</div>
                  <div className="font-bold text-[#EAECEF] mt-0.5">
                    {formatShortDate(viewingExam.tarikh)} · {viewingExam.status}
                  </div>
                </div>
                <div>
                  <div className="text-[#848E9C]">Skema Gred</div>
                  <div className="font-bold text-[#F0B90B] mt-0.5">{ov.scheme.nama}</div>
                </div>
                <div>
                  <div className="text-[#848E9C]">Ringkasan Semasa</div>
                  <div className="font-bold text-[#0ECB81] mt-0.5">
                    Lulus {ov.passRate}% · GPS {ov.gps !== null ? ov.gps.toFixed(2) : 'Tiada'}
                  </div>
                </div>
              </div>
              {viewingExam.catatan && (
                <p className="text-[#EAECEF] bg-[#0B0E11] p-3 rounded-lg border border-[#2B3139]">
                  {viewingExam.catatan}
                </p>
              )}
              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setViewingExam(null)}
                  className="px-4 py-2 text-xs font-medium text-[#EAECEF] bg-[#1E2329] border border-[#2B3139] rounded-lg"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onInspectExam(viewingExam.id);
                    setViewingExam(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#0B0E11] bg-[#F0B90B] rounded-lg hover:bg-[#F8D12F]"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Buka Analisis Peperiksaan Ini
                </button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Modal Tambah / Kemaskini Mata Pelajaran */}
      <Modal
        isOpen={subjectModalOpen}
        onClose={() => setSubjectModalOpen(false)}
        title={editingSubject ? 'Kemaskini Mata Pelajaran' : 'Daftar Mata Pelajaran Baharu'}
        subtitle="Maklumat ini akan dipautkan kepada rekod markah, GPMP dan analisis panitia."
        maxWidthClass="max-w-lg"
      >
        <form onSubmit={handleSubmitSubject} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1">
                Kod Subjek
              </label>
              <input
                type="text"
                required
                placeholder="Cth: 4531"
                value={kodSubjek}
                onChange={(e) => setKodSubjek(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#848E9C] mb-1">
                Nama Mata Pelajaran
              </label>
              <input
                type="text"
                required
                placeholder="Cth: Fizik"
                value={namaSubjek}
                onChange={(e) => setNamaSubjek(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1">
                Tingkatan
              </label>
              <select
                value={tingkatanSubjek}
                onChange={(e) => setTingkatanSubjek(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              >
                {TINGKATAN_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1">
                Bidang
              </label>
              <select
                value={bidangSubjek}
                onChange={(e) => setBidangSubjek(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              >
                <option value="Bahasa">Bahasa</option>
                <option value="Sains & Matematik">Sains & Matematik</option>
                <option value="Kemanusiaan">Kemanusiaan</option>
                <option value="Teknik & Vokasional">Teknik & Vokasional</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1">
                Sasaran Murid
              </label>
              <input
                type="number"
                min={1}
                value={sasaranSubjek}
                onChange={(e) => setSasaranSubjek(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1">
                Guru Mata Pelajaran
              </label>
              <select
                value={guruSubjek}
                onChange={(e) => setGuruSubjek(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              >
                {teachers.map((t) => (
                  <option key={t.id} value={t.nama}>
                    {t.nama}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1">
                Ketua Panitia
              </label>
              <select
                value={ketuaPanitiaSubjek}
                onChange={(e) => setKetuaPanitiaSubjek(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              >
                {teachers.map((t) => (
                  <option key={t.id} value={t.nama}>
                    {t.nama}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setSubjectModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-[#EAECEF] bg-[#1E2329] border border-[#2B3139] rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-bold text-[#0B0E11] bg-[#0ECB81] rounded-lg hover:bg-[#15E092]"
            >
              {editingSubject ? 'Simpan Kemaskini' : 'Simpan Mata Pelajaran'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDeleteModal
        isOpen={Boolean(deleteExamTarget)}
        onClose={() => setDeleteExamTarget(null)}
        onConfirm={() => {
          if (deleteExamTarget) onDeleteExam(deleteExamTarget.id);
        }}
        itemName={deleteExamTarget ? `${deleteExamTarget.nama} (${deleteExamTarget.kodPeperiksaan})` : ''}
        description="Memadam peperiksaan juga akan memadam rekod markah yang dipautkan kepada peperiksaan ini."
      />

      <ConfirmDeleteModal
        isOpen={Boolean(deleteSubjectTarget)}
        onClose={() => setDeleteSubjectTarget(null)}
        onConfirm={() => {
          if (deleteSubjectTarget) onDeleteSubject(deleteSubjectTarget.id);
        }}
        itemName={deleteSubjectTarget ? `${deleteSubjectTarget.nama} (${deleteSubjectTarget.kod})` : ''}
        description="Memadam mata pelajaran juga akan menanggalkan rekod markah subjek tersebut."
      />
    </div>
  );
};
