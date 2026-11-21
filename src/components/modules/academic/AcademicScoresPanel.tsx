import React, { useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Edit3,
  FileSpreadsheet,
  Plus,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  AcademicExam,
  AcademicScoreRecord,
  AcademicSubject,
  GradeSchemeConfig,
} from '../../../types/eduschool';
import {
  CsvParseResult,
  getSchemeForExam,
  parseScoreCsv,
  resolveGradeForMark,
  validateScoreMark,
} from '../../../utils/academicCalcHelper';
import { ConfirmDeleteModal, Modal } from '../../common/Modal';

interface AcademicScoresPanelProps {
  exams: AcademicExam[];
  subjects: AcademicSubject[];
  scores: AcademicScoreRecord[];
  gradeSchemes: GradeSchemeConfig[];
  selectedExamId: string;
  initialSubjectId?: string;
  canManageScores: boolean;
  onSelectExamId: (examId: string) => void;
  onUpsertScore: (payload: Omit<AcademicScoreRecord, 'id'>, existingId?: string) => void;
  onBulkUpsertScores: (
    examId: string,
    subjectId: string,
    rows: CsvParseResult['validRows']
  ) => void;
  onDeleteScore: (id: string) => void;
}

const SAMPLE_CSV_CONTENT = [
  'ID_Murid,Nama_Murid,Kelas,Markah',
  'SLP-2026-201,Afiqah Batrisyia binti Azlan (Rekaan),5 Al-Farabi,86',
  'SLP-2026-202,Jason Anak Mugang (Rekaan),5 Ibnu Sina,64',
  'SLP-2026-203,Nurul Syuhada binti Ismail (Rekaan),5 Cemerlang,35',
].join('\n');

export const AcademicScoresPanel: React.FC<AcademicScoresPanelProps> = ({
  exams,
  subjects,
  scores,
  gradeSchemes,
  selectedExamId,
  initialSubjectId = 'Semua',
  canManageScores,
  onSelectExamId,
  onUpsertScore,
  onBulkUpsertScores,
  onDeleteScore,
}) => {
  const [filterSubjectId, setFilterSubjectId] = useState(initialSubjectId);
  const [filterClass, setFilterClass] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal Tambah / Kemaskini Markah Individu
  const [scoreModalOpen, setScoreModalOpen] = useState(false);
  const [editingScore, setEditingScore] = useState<AcademicScoreRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AcademicScoreRecord | null>(null);

  const [formExamId, setFormExamId] = useState(selectedExamId || exams[0]?.id || '');
  const [formSubjectId, setFormSubjectId] = useState(subjects[0]?.id || '');
  const [formStudentId, setFormStudentId] = useState('');
  const [formStudentName, setFormStudentName] = useState('');
  const [formClass, setFormClass] = useState('5 Al-Farabi');
  const [formMark, setFormMark] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Modal Muat Naik CSV
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [csvExamId, setCsvExamId] = useState(selectedExamId || exams[0]?.id || '');
  const [csvSubjectId, setCsvSubjectId] = useState(subjects[0]?.id || '');
  const [csvText, setCsvText] = useState('');
  const [csvParseResult, setCsvParseResult] = useState<CsvParseResult | null>(null);
  const [csvFileName, setCsvFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const selectedExam = useMemo(
    () => exams.find((e) => e.id === selectedExamId) ?? exams[0],
    [exams, selectedExamId]
  );

  const activeScheme = useMemo(
    () => (selectedExam ? getSchemeForExam(selectedExam, gradeSchemes) : gradeSchemes[0]),
    [selectedExam, gradeSchemes]
  );

  const examSubjects = useMemo(() => {
    if (!selectedExam) return subjects;
    const sameLevel = subjects.filter((s) => s.tingkatan === selectedExam.tingkatan);
    return sameLevel.length > 0 ? sameLevel : subjects;
  }, [subjects, selectedExam]);

  const classOptions = useMemo(() => {
    if (!selectedExam) return [];
    const set = new Set<string>();
    scores
      .filter((s) => s.examId === selectedExam.id)
      .forEach((s) => set.add(s.kelas));
    return Array.from(set).sort();
  }, [scores, selectedExam]);

  const filteredScores = useMemo(() => {
    if (!selectedExam) return [];
    const q = searchQuery.trim().toLowerCase();
    return scores.filter((sc) => {
      if (sc.examId !== selectedExam.id) return false;
      if (filterSubjectId !== 'Semua' && sc.subjectId !== filterSubjectId) return false;
      if (filterClass !== 'Semua' && sc.kelas !== filterClass) return false;
      if (
        q &&
        !sc.namaMurid.toLowerCase().includes(q) &&
        !sc.noIdMurid.toLowerCase().includes(q) &&
        !sc.kelas.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [scores, selectedExam, filterSubjectId, filterClass, searchQuery]);

  const openAddScore = () => {
    setEditingScore(null);
    const defaultExId = selectedExam?.id ?? exams[0]?.id ?? '';
    const defaultSub =
      (filterSubjectId !== 'Semua'
        ? subjects.find((s) => s.id === filterSubjectId)
        : examSubjects[0]) ?? subjects[0];
    setFormExamId(defaultExId);
    setFormSubjectId(defaultSub?.id ?? '');
    setFormStudentId('');
    setFormStudentName('');
    setFormClass(selectedExam?.tingkatan.includes('4') ? '4 Wawasan' : '5 Al-Farabi');
    setFormMark('');
    setFormError(null);
    setScoreModalOpen(true);
  };

  const openEditScore = (rec: AcademicScoreRecord) => {
    setEditingScore(rec);
    setFormExamId(rec.examId);
    setFormSubjectId(rec.subjectId);
    setFormStudentId(rec.noIdMurid);
    setFormStudentName(rec.namaMurid);
    setFormClass(rec.kelas);
    setFormMark(String(rec.markah));
    setFormError(null);
    setScoreModalOpen(true);
  };

  const handleSaveScore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formStudentId.trim() || !formStudentName.trim() || !formClass.trim()) {
      setFormError('No. ID Murid, Nama Murid dan Kelas wajib diisi.');
      return;
    }
    const markCheck = validateScoreMark(formMark);
    if (!markCheck.valid) {
      setFormError(markCheck.error ?? 'Markah tidak sah.');
      return;
    }

    const dupExisting = scores.find(
      (s) =>
        s.examId === formExamId &&
        s.subjectId === formSubjectId &&
        s.noIdMurid.toLowerCase() === formStudentId.trim().toLowerCase() &&
        s.id !== editingScore?.id
    );

    if (dupExisting && !editingScore) {
      setFormError(
        `Rekod untuk ID Murid ${formStudentId.trim()} bagi peperiksaan dan subjek ini sudah wujud (${dupExisting.namaMurid}: ${dupExisting.markah}%). Sila kemaskini rekod sedia ada.`
      );
      return;
    }

    onUpsertScore(
      {
        examId: formExamId,
        subjectId: formSubjectId,
        noIdMurid: formStudentId.trim().toUpperCase(),
        namaMurid: formStudentName.trim(),
        kelas: formClass.trim(),
        markah: markCheck.mark,
        tarikhKemaskini: new Date().toISOString().slice(0, 10),
      },
      editingScore?.id
    );
    setScoreModalOpen(false);
  };

  const openCsvModal = () => {
    const defaultExId = selectedExam?.id ?? exams[0]?.id ?? '';
    const defaultSub =
      (filterSubjectId !== 'Semua'
        ? subjects.find((s) => s.id === filterSubjectId)
        : examSubjects[0]) ?? subjects[0];
    setCsvExamId(defaultExId);
    setCsvSubjectId(defaultSub?.id ?? '');
    setCsvText('');
    setCsvParseResult(null);
    setCsvFileName('');
    setCsvModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = String(ev.target?.result ?? '');
      setCsvText(text);
      setCsvParseResult(parseScoreCsv(text));
    };
    reader.readAsText(file);
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([SAMPLE_CSV_CONTENT], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Templat_Markah_EduSchool360.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCommitCsv = () => {
    if (!csvParseResult || csvParseResult.validRows.length === 0) return;
    onBulkUpsertScores(csvExamId, csvSubjectId, csvParseResult.validRows);
    setCsvModalOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Nota Data Murid Rekaan */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-[#161A1E] border border-[#2B3139]">
        <div className="text-xs text-[#848E9C] space-y-0.5">
          <p className="font-bold text-[#F0B90B]">
            Rekod Markah Murid (Data Demonstrasi Rekaan Sahaja)
          </p>
          <p>
            Setiap markah (0–100) akan menukar gred, status lulus/gagal, GPMP dan GPS secara automatik mengikut skema peperiksaan.
          </p>
        </div>
        {canManageScores && (
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={openCsvModal}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#EAECEF] bg-[#1E2329] border border-[#2B3139] rounded-lg hover:bg-[#2B3139] whitespace-nowrap"
            >
              <Upload className="w-4 h-4 text-[#0ECB81]" />
              Muat Naik Fail CSV
            </button>
            <button
              type="button"
              onClick={openAddScore}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-[#0B0E11] bg-[#F0B90B] rounded-lg hover:bg-[#F8D12F] whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Tambah Markah Individu
            </button>
          </div>
        )}
      </div>

      {/* Penapis & Carian */}
      <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-[#848E9C] mb-1">
            Peperiksaan
          </label>
          <select
            aria-label="Tapis Peperiksaan Markah"
            value={selectedExam?.id ?? ''}
            onChange={(e) => {
              onSelectExamId(e.target.value);
              setFilterClass('Semua');
            }}
            className="w-full px-3 py-2 text-xs bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
          >
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.nama} ({ex.tingkatan})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-[#848E9C] mb-1">
            Mata Pelajaran
          </label>
          <select
            aria-label="Tapis Mata Pelajaran Markah"
            value={filterSubjectId}
            onChange={(e) => setFilterSubjectId(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
          >
            <option value="Semua">Semua Mata Pelajaran</option>
            {examSubjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nama} ({s.kod})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-[#848E9C] mb-1">
            Kelas
          </label>
          <select
            aria-label="Tapis Kelas Markah"
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
          >
            <option value="Semua">Semua Kelas</option>
            {classOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-[#848E9C] mb-1">
            Carian Murid / No. ID
          </label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#848E9C] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama atau ID murid..."
              className="w-full pl-8 pr-3 py-2 text-xs bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg focus:outline-none focus:border-[#F0B90B]"
            />
          </div>
        </div>
      </div>

      {/* Jadual Markah */}
      <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#2B3139] flex items-center justify-between text-xs">
          <span className="font-bold text-[#EAECEF]">
            Senarai Keputusan Murid ({filteredScores.length} rekod dipaparkan)
          </span>
          <span className="text-[#848E9C]">
            Skema: <strong className="text-[#F0B90B]">{activeScheme?.nama}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#1E2329] border-b border-[#2B3139] text-[#848E9C] font-semibold">
                <th className="py-3 px-4">ID Murid</th>
                <th className="py-3 px-3">Nama Murid (Rekaan)</th>
                <th className="py-3 px-3">Kelas</th>
                <th className="py-3 px-3">Mata Pelajaran</th>
                <th className="py-3 px-3 text-right">Markah</th>
                <th className="py-3 px-3 text-center">Gred</th>
                <th className="py-3 px-3 text-right">Mata Nilai</th>
                <th className="py-3 px-3">Status</th>
                {canManageScores && <th className="py-3 px-4 text-right">Tindakan</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2B3139]">
              {filteredScores.length === 0 ? (
                <tr>
                  <td
                    colSpan={canManageScores ? 9 : 8}
                    className="py-10 text-center text-[#848E9C]"
                  >
                    Tiada rekod markah yang sepadan dengan penapis semasa.
                  </td>
                </tr>
              ) : (
                filteredScores.map((rec) => {
                  const subj = subjects.find((s) => s.id === rec.subjectId);
                  const band = resolveGradeForMark(rec.markah, activeScheme);
                  return (
                    <tr key={rec.id} className="hover:bg-[#1E2329]/50">
                      <td className="py-2.5 px-4 font-mono text-[#848E9C]">
                        {rec.noIdMurid}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-[#EAECEF]">
                        {rec.namaMurid}
                      </td>
                      <td className="py-2.5 px-3 text-[#EAECEF]">{rec.kelas}</td>
                      <td className="py-2.5 px-3 text-[#EAECEF]">
                        {subj ? `${subj.nama} (${subj.kod})` : rec.subjectId}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-white tabular-nums">
                        {rec.markah}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-block min-w-[30px] px-2 py-0.5 rounded font-bold text-[11px] ${
                            !band.lulus
                              ? 'bg-[#F6465D]/15 text-[#F6465D]'
                              : band.kumpulan === 'A'
                                ? 'bg-[#0ECB81]/15 text-[#0ECB81]'
                                : 'bg-[#F0B90B]/15 text-[#F0B90B]'
                          }`}
                        >
                          {band.label}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#848E9C]">
                        {activeScheme.gunaGpmp ? band.mataNilai : '-'}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`text-[11px] font-semibold ${
                            band.lulus ? 'text-[#0ECB81]' : 'text-[#F6465D]'
                          }`}
                        >
                          {band.lulus ? 'Lulus' : 'Gagal'}
                        </span>
                      </td>
                      {canManageScores && (
                        <td className="py-2.5 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => openEditScore(rec)}
                            className="p-1.5 rounded-lg text-[#848E9C] hover:text-[#F0B90B] hover:bg-[#1E2329]"
                            aria-label={`Kemaskini markah ${rec.namaMurid}`}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(rec)}
                            className="p-1.5 rounded-lg text-[#848E9C] hover:text-[#F6465D] hover:bg-[#F6465D]/10"
                            aria-label={`Padam markah ${rec.namaMurid}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah / Kemaskini Markah Individu */}
      <Modal
        isOpen={scoreModalOpen}
        onClose={() => setScoreModalOpen(false)}
        title={editingScore ? 'Kemaskini Markah Murid' : 'Tambah Markah Peperiksaan Murid'}
        subtitle="Sistem mengesahkan markah antara 0 hingga 100 dan mengira gred serta GPMP secara automatik."
        maxWidthClass="max-w-lg"
      >
        <form onSubmit={handleSaveScore} className="space-y-4">
          {formError && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[#F6465D]/10 border border-[#F6465D]/40 text-xs text-[#F6465D]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1">
                Peperiksaan
              </label>
              <select
                value={formExamId}
                disabled={Boolean(editingScore)}
                onChange={(e) => setFormExamId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg disabled:opacity-60"
              >
                {exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.nama} ({ex.tingkatan})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1">
                Mata Pelajaran
              </label>
              <select
                value={formSubjectId}
                disabled={Boolean(editingScore)}
                onChange={(e) => setFormSubjectId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg disabled:opacity-60"
              >
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.nama} ({sub.tingkatan})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1">
                No. ID Murid
              </label>
              <input
                type="text"
                required
                placeholder="Cth: SLP-2026-301"
                value={formStudentId}
                onChange={(e) => setFormStudentId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1">
                Kelas
              </label>
              <input
                type="text"
                required
                placeholder="Cth: 5 Al-Farabi"
                value={formClass}
                onChange={(e) => setFormClass(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#848E9C] mb-1">
                Nama Murid (Rekaan)
              </label>
              <input
                type="text"
                required
                placeholder="Masukkan nama murid rekaan"
                value={formStudentName}
                onChange={(e) => setFormStudentName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1">
                Markah (0 - 100)
              </label>
              <input
                type="number"
                step="any"
                required
                placeholder="0 - 100"
                value={formMark}
                onChange={(e) => {
                  setFormMark(e.target.value);
                  setFormError(null);
                }}
                className="w-full px-3 py-2 text-sm font-mono font-bold bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              />
            </div>
          </div>

          {(() => {
            const chk = validateScoreMark(formMark);
            const targetEx = exams.find((x) => x.id === formExamId) ?? selectedExam;
            const targetScheme = targetEx
              ? getSchemeForExam(targetEx, gradeSchemes)
              : activeScheme;
            if (!formMark || !chk.valid) return null;
            const band = resolveGradeForMark(chk.mark, targetScheme);
            return (
              <div className="p-3 rounded-lg bg-[#0B0E11] border border-[#2B3139] flex items-center justify-between text-xs">
                <span className="text-[#848E9C]">Jangkaan Gred Automatik:</span>
                <span className="font-bold text-[#F0B90B]">
                  Gred {band.label} ({band.lulus ? 'Lulus' : 'Gagal'} · Mata Nilai {band.mataNilai})
                </span>
              </div>
            );
          })()}

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setScoreModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-[#EAECEF] bg-[#1E2329] border border-[#2B3139] rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-bold text-[#0B0E11] bg-[#F0B90B] rounded-lg hover:bg-[#F8D12F]"
            >
              {editingScore ? 'Simpan Kemaskini' : 'Simpan Markah'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Muat Naik CSV */}
      <Modal
        isOpen={csvModalOpen}
        onClose={() => setCsvModalOpen(false)}
        title="Muat Naik Fail CSV Markah Murid"
        subtitle="Format lajur diperlukan: ID_Murid, Nama_Murid, Kelas, Markah (0–100)."
        maxWidthClass="max-w-2xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1">
                Peperiksaan Sasaran
              </label>
              <select
                value={csvExamId}
                onChange={(e) => setCsvExamId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              >
                {exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.nama} ({ex.tingkatan})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1">
                Mata Pelajaran Sasaran
              </label>
              <select
                value={csvSubjectId}
                onChange={(e) => setCsvSubjectId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              >
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.nama} ({sub.tingkatan})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 p-3.5 rounded-lg bg-[#0B0E11] border border-[#2B3139]">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-[#F0B90B] text-[#0B0E11] rounded-lg hover:bg-[#F8D12F]"
            >
              <Upload className="w-3.5 h-3.5" />
              Pilih Fail CSV Dari Komputer
            </button>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-[#1E2329] text-[#EAECEF] border border-[#2B3139] rounded-lg hover:bg-[#2B3139]"
            >
              <Download className="w-3.5 h-3.5 text-[#38BDF8]" />
              Muat Turun Templat CSV
            </button>
            <button
              type="button"
              onClick={() => {
                setCsvFileName('contoh_markah_simulasi.csv');
                setCsvText(SAMPLE_CSV_CONTENT);
                setCsvParseResult(parseScoreCsv(SAMPLE_CSV_CONTENT));
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-[#0ECB81]/15 text-[#0ECB81] border border-[#0ECB81]/30 rounded-lg hover:bg-[#0ECB81]/25"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Muat Naik Contoh CSV Simulasi
            </button>
            {csvFileName && (
              <span className="text-[11px] text-[#848E9C] ml-auto">
                Fail: <strong className="text-[#EAECEF]">{csvFileName}</strong>
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#848E9C] mb-1">
              Kandungan CSV (atau tampal terus baris CSV di bawah)
            </label>
            <textarea
              rows={5}
              value={csvText}
              onChange={(e) => {
                const txt = e.target.value;
                setCsvText(txt);
                setCsvParseResult(txt.trim() ? parseScoreCsv(txt) : null);
              }}
              placeholder="ID_Murid,Nama_Murid,Kelas,Markah&#10;SLP-2026-201,Afiqah Batrisyia (Rekaan),5 Al-Farabi,86"
              className="w-full px-3 py-2 text-xs font-mono bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
            />
          </div>

          {csvParseResult && (
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#0ECB81]/10 border border-[#0ECB81]/30">
                <span className="flex items-center gap-2 text-[#0ECB81] font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  {csvParseResult.validRows.length} rekod markah sah sedia disimpan (rekod ID yang sama akan dikemaskini tanpa duplikasi).
                </span>
              </div>
              {csvParseResult.errors.length > 0 && (
                <div className="p-3 rounded-lg bg-[#F6465D]/10 border border-[#F6465D]/30 space-y-1 text-[#F6465D]">
                  <div className="font-bold">Amaran Pengesahan Baris CSV:</div>
                  <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                    {csvParseResult.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setCsvModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-[#EAECEF] bg-[#1E2329] border border-[#2B3139] rounded-lg"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={!csvParseResult || csvParseResult.validRows.length === 0}
              onClick={handleCommitCsv}
              className="px-4 py-2 text-sm font-bold text-[#0B0E11] bg-[#0ECB81] rounded-lg hover:bg-[#15E092] disabled:opacity-40"
            >
              Simpan Rekod CSV ({csvParseResult?.validRows.length ?? 0})
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) onDeleteScore(deleteTarget.id);
        }}
        itemName={deleteTarget ? `${deleteTarget.namaMurid} (${deleteTarget.markah}%)` : ''}
      />
    </div>
  );
};
