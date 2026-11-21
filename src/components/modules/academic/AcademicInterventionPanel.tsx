import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Edit3,
  Info,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  AcademicExam,
  AcademicIntervention,
  AcademicInterventionStatus,
  AcademicScoreRecord,
  AcademicSubject,
  GradeSchemeConfig,
  TeacherItem,
} from '../../../types/eduschool';
import {
  computeExamOverview,
  generateInterventionSuggestions,
} from '../../../utils/academicCalcHelper';
import { formatShortDate } from '../../../utils/formatters';
import { ConfirmDeleteModal, Modal } from '../../common/Modal';

interface AcademicInterventionPanelProps {
  exams: AcademicExam[];
  subjects: AcademicSubject[];
  scores: AcademicScoreRecord[];
  gradeSchemes: GradeSchemeConfig[];
  interventions: AcademicIntervention[];
  teachers: TeacherItem[];
  selectedExamId: string;
  canManageInterventions: boolean;
  onAddIntervention: (item: Omit<AcademicIntervention, 'id'>) => void;
  onUpdateIntervention: (item: AcademicIntervention) => void;
  onDeleteIntervention: (id: string) => void;
}

const INTERVENTION_STATUSES: AcademicInterventionStatus[] = [
  'Belum Dilaksanakan',
  'Dalam Pelaksanaan',
  'Selesai',
];

export const AcademicInterventionPanel: React.FC<AcademicInterventionPanelProps> = ({
  exams,
  subjects,
  scores,
  gradeSchemes,
  interventions,
  teachers,
  selectedExamId,
  canManageInterventions,
  onAddIntervention,
  onUpdateIntervention,
  onDeleteIntervention,
}) => {
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [suggestions, setSuggestions] = useState<Array<Omit<AcademicIntervention, 'id'>>>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AcademicIntervention | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AcademicIntervention | null>(null);

  const [formExamId, setFormExamId] = useState(selectedExamId || exams[0]?.id || '');
  const [formSubjectId, setFormSubjectId] = useState(subjects[0]?.id || '');
  const [formSasaran, setFormSasaran] = useState('');
  const [formIsu, setFormIsu] = useState('');
  const [formObjektif, setFormObjektif] = useState('');
  const [formStrategi, setFormStrategi] = useState('');
  const [formGuru, setFormGuru] = useState(teachers[0]?.nama ?? '');
  const [formTarikh, setFormTarikh] = useState(new Date().toISOString().slice(0, 10));
  const [formStatus, setFormStatus] = useState<AcademicInterventionStatus>('Belum Dilaksanakan');
  const [formHasil, setFormHasil] = useState('');

  const selectedExam = useMemo(
    () => exams.find((e) => e.id === selectedExamId) ?? exams[0],
    [exams, selectedExamId]
  );

  const filteredInterventions = useMemo(() => {
    if (filterStatus === 'Semua') return interventions;
    return interventions.filter((i) => i.status === filterStatus);
  }, [interventions, filterStatus]);

  const handleGenerateSuggestions = () => {
    if (!selectedExam) return;
    const ov = computeExamOverview(selectedExam, subjects, scores, gradeSchemes);
    const drafts = generateInterventionSuggestions(ov);
    setSuggestions(drafts);
  };

  const handleAcceptSuggestion = (draft: Omit<AcademicIntervention, 'id'>, idx: number) => {
    onAddIntervention(draft);
    setSuggestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setFormExamId(selectedExam?.id ?? exams[0]?.id ?? '');
    setFormSubjectId(subjects[0]?.id ?? '');
    setFormSasaran('');
    setFormIsu('');
    setFormObjektif('');
    setFormStrategi('');
    setFormGuru(teachers[0]?.nama ?? '');
    setFormTarikh(new Date().toISOString().slice(0, 10));
    setFormStatus('Belum Dilaksanakan');
    setFormHasil('');
    setModalOpen(true);
  };

  const openEditModal = (item: AcademicIntervention) => {
    setEditingItem(item);
    setFormExamId(item.examId ?? selectedExam?.id ?? '');
    setFormSubjectId(item.subjectId);
    setFormSasaran(item.kumpulanSasaran);
    setFormIsu(item.isuPencapaian);
    setFormObjektif(item.objektif);
    setFormStrategi(item.strategiTindakan);
    setFormGuru(item.guruBertanggungjawab);
    setFormTarikh(item.tarikhPelaksanaan);
    setFormStatus(item.status);
    setFormHasil(item.hasilPenilaian);
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sub = subjects.find((s) => s.id === formSubjectId);
    const payload: Omit<AcademicIntervention, 'id'> = {
      examId: formExamId,
      subjectId: formSubjectId,
      mataPelajaran: sub ? sub.nama : 'Mata Pelajaran',
      kumpulanSasaran: formSasaran.trim(),
      isuPencapaian: formIsu.trim(),
      objektif: formObjektif.trim(),
      strategiTindakan: formStrategi.trim(),
      guruBertanggungjawab: formGuru,
      tarikhPelaksanaan: formTarikh,
      status: formStatus,
      hasilPenilaian: formHasil.trim() || 'Menunggu penilaian susulan guru.',
      dijanaSistem: editingItem?.dijanaSistem ?? false,
    };

    if (editingItem) {
      onUpdateIntervention({ ...payload, id: editingItem.id });
    } else {
      onAddIntervention(payload);
    }
    setModalOpen(false);
  };

  const statusBadge = (status: AcademicInterventionStatus) => {
    switch (status) {
      case 'Selesai':
        return 'bg-[#0ECB81]/15 text-[#0ECB81] border-[#0ECB81]/30';
      case 'Dalam Pelaksanaan':
        return 'bg-[#F0B90B]/15 text-[#F0B90B] border-[#F0B90B]/30';
      default:
        return 'bg-[#1E2329] text-[#848E9C] border-[#2B3139]';
    }
  };

  return (
    <div className="space-y-6">
      {/* Penafian keputusan guru */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-[#161A1E] border border-[#2B3139]">
        <div className="flex items-start gap-2.5 text-xs">
          <Info className="w-4 h-4 text-[#F0B90B] shrink-0 mt-0.5" />
          <div className="text-[#848E9C]">
            <span className="font-bold text-[#EAECEF]">Intervensi Akademik Berpandukan Semakan Guru: </span>
            Cadangan janaan sistem hanya bersifat draf sokongan analisis dan tidak menetapkan sebarang keputusan muktamad terhadap murid tanpa semakan serta pengesahan guru mata pelajaran.
          </div>
        </div>

        {canManageInterventions && (
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleGenerateSuggestions}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#1E2329] text-[#F0B90B] border border-[#F0B90B]/40 rounded-lg hover:bg-[#F0B90B]/10 whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4" />
              Jana Cadangan Intervensi
            </button>
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-[#F0B90B] text-[#0B0E11] rounded-lg hover:bg-[#F8D12F] whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Tambah Intervensi
            </button>
          </div>
        )}
      </div>

      {/* Draf Cadangan Sistem (Jika Dijana) */}
      {suggestions.length > 0 && (
        <div className="bg-[#161A1E] rounded-xl border border-[#F0B90B]/40 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#F0B90B]">
                Draf Cadangan Intervensi Berdasarkan Rekod ({selectedExam?.nama})
              </h3>
              <p className="text-xs text-[#848E9C]">
                Sila semak kesesuaian sasaran dan klik terima untuk menjadikannya pelan intervensi rasmi sekolah.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSuggestions([])}
              className="text-xs text-[#848E9C] hover:text-white"
            >
              Tutup Draf
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {suggestions.map((sug, idx) => (
              <div
                key={`${sug.subjectId}-${idx}`}
                className="p-4 rounded-lg bg-[#0B0E11] border border-[#2B3139] space-y-2 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-[#EAECEF] text-sm">{sug.mataPelajaran}</span>
                  <span className="px-2 py-0.5 rounded bg-[#F0B90B]/15 text-[#F0B90B] text-[10px] font-semibold">
                    Draf Sokongan Guru
                  </span>
                </div>
                <p className="text-[#848E9C]">{sug.isuPencapaian}</p>
                <p className="text-[#EAECEF]">
                  <strong className="text-[#0ECB81]">Strategi: </strong>
                  {sug.strategiTindakan}
                </p>
                <div className="flex items-center justify-between pt-2 border-t border-[#2B3139]">
                  <span className="text-[11px] text-[#848E9C]">{sug.guruBertanggungjawab}</span>
                  <button
                    type="button"
                    onClick={() => handleAcceptSuggestion(sug, idx)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold bg-[#0ECB81] text-[#0B0E11] rounded-lg hover:bg-[#15E092]"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Terima sebagai Draf Intervensi
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Penapis & Senarai Pelan Intervensi */}
      <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#2B3139] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[#EAECEF]">
              Pelan & Tindakan Intervensi Akademik ({filteredInterventions.length})
            </h2>
            <p className="text-xs text-[#848E9C]">
              Pemantauan program pemulihan, pengukuhan dan hasil penilaian selepas tindakan
            </p>
          </div>
          <select
            aria-label="Tapis Status Intervensi"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
          >
            <option value="Semua">Semua Status</option>
            {INTERVENTION_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        <div className="divide-y divide-[#2B3139]">
          {filteredInterventions.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#848E9C]">
              Tiada rekod intervensi bagi status ini.
            </div>
          ) : (
            filteredInterventions.map((item) => (
              <div key={item.id} className="p-5 hover:bg-[#1E2329]/40 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-[#EAECEF]">{item.mataPelajaran}</span>
                      <span
                        className={`px-2 py-0.5 rounded-md border text-[11px] font-semibold ${statusBadge(
                          item.status
                        )}`}
                      >
                        {item.status}
                      </span>
                      {item.dijanaSistem && (
                        <span className="px-2 py-0.5 rounded bg-[#38BDF8]/15 text-[#38BDF8] text-[10px] font-semibold">
                          Disemak daripada Cadangan Sistem
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#F0B90B] font-semibold">
                      Sasaran: {item.kumpulanSasaran}
                    </div>
                  </div>

                  {canManageInterventions && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        className="p-1.5 rounded-lg text-[#848E9C] hover:text-[#F0B90B] hover:bg-[#1E2329]"
                        aria-label={`Kemaskini intervensi ${item.mataPelajaran}`}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(item)}
                        className="p-1.5 rounded-lg text-[#848E9C] hover:text-[#F6465D] hover:bg-[#F6465D]/10"
                        aria-label={`Padam intervensi ${item.mataPelajaran}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-[#0B0E11] border border-[#2B3139]">
                    <div className="text-[11px] text-[#848E9C] font-semibold mb-1">
                      Isu Pencapaian & Objektif
                    </div>
                    <p className="text-[#EAECEF]">{item.isuPencapaian}</p>
                    <p className="text-[#0ECB81] mt-1 font-medium">Objektif: {item.objektif}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-[#0B0E11] border border-[#2B3139]">
                    <div className="text-[11px] text-[#848E9C] font-semibold mb-1">
                      Strategi Tindakan
                    </div>
                    <p className="text-[#EAECEF]">{item.strategiTindakan}</p>
                    <p className="text-[#848E9C] mt-1.5">
                      Guru: <strong className="text-[#EAECEF]">{item.guruBertanggungjawab}</strong> ·{' '}
                      {formatShortDate(item.tarikhPelaksanaan)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-[#0B0E11] border border-[#2B3139]">
                    <div className="text-[11px] text-[#848E9C] font-semibold mb-1">
                      Hasil Penilaian
                    </div>
                    <p className="text-[#EAECEF]">{item.hasilPenilaian}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal Tambah / Kemaskini Intervensi */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? 'Kemaskini Pelan Intervensi' : 'Tambah Intervensi Akademik'}
        subtitle="Rekodkan strategi bimbingan dan hasil penilaian berkala guru."
        maxWidthClass="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1">
                Mata Pelajaran
              </label>
              <select
                value={formSubjectId}
                onChange={(e) => setFormSubjectId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nama} ({s.tingkatan})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1">
                Guru Bertanggungjawab
              </label>
              <select
                value={formGuru}
                onChange={(e) => setFormGuru(e.target.value)}
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

          <div>
            <label className="block text-xs font-semibold text-[#848E9C] mb-1">
              Kumpulan Sasaran
            </label>
            <input
              type="text"
              required
              placeholder="Cth: Murid Tingkatan 5 kumpulan markah < 40%"
              value={formSasaran}
              onChange={(e) => setFormSasaran(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1">
                Isu Pencapaian
              </label>
              <textarea
                rows={2}
                required
                value={formIsu}
                onChange={(e) => setFormIsu(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1">Objektif</label>
              <textarea
                rows={2}
                required
                value={formObjektif}
                onChange={(e) => setFormObjektif(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#848E9C] mb-1">
              Strategi Tindakan
            </label>
            <textarea
              rows={2}
              required
              value={formStrategi}
              onChange={(e) => setFormStrategi(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1">
                Tarikh Pelaksanaan
              </label>
              <input
                type="date"
                required
                value={formTarikh}
                onChange={(e) => setFormTarikh(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1">Status</label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as AcademicInterventionStatus)}
                className="w-full px-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              >
                {INTERVENTION_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#848E9C] mb-1">
              Hasil Penilaian
            </label>
            <textarea
              rows={2}
              value={formHasil}
              onChange={(e) => setFormHasil(e.target.value)}
              placeholder="Nyatakan impak atau kemajuan murid selepas tindakan..."
              className="w-full px-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-[#EAECEF] bg-[#1E2329] border border-[#2B3139] rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-bold text-[#0B0E11] bg-[#F0B90B] rounded-lg hover:bg-[#F8D12F]"
            >
              {editingItem ? 'Simpan Kemaskini' : 'Simpan Intervensi'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) onDeleteIntervention(deleteTarget.id);
        }}
        itemName={
          deleteTarget ? `Intervensi ${deleteTarget.mataPelajaran}` : ''
        }
      />
    </div>
  );
};
