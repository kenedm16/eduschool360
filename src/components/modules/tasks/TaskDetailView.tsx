import React, { useState } from 'react';
import {
  ArrowLeft,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Edit3,
  FileCheck2,
  History,
  MessageSquare,
  Paperclip,
  Send,
  Trash2,
  Upload,
  User,
  UserCheck,
  Building2,
  Tag,
  Info,
} from 'lucide-react';
import {
  TaskCommentItem,
  TaskEvidenceItem,
  TaskItem,
  TaskStatus,
  UserRole,
} from '../../../types/eduschool';
import { getRoleDisplayLabel, ROLE_PROFILES } from '../../../utils/rolePermissions';
import { formatShortDate } from '../../../utils/formatters';
import {
  TASK_STATUS_OPTIONS,
  TaskRolePermissions,
  getCurrentDateTimeLabel,
  getTaskCode,
  isTaskOverdue,
} from '../../../utils/taskHelpers';

interface TaskDetailViewProps {
  task: TaskItem;
  activeRole: UserRole;
  permissions: TaskRolePermissions;
  onBack: () => void;
  onEdit: (task: TaskItem) => void;
  onDelete: (task: TaskItem) => void;
  onUpdateTask: (updated: TaskItem) => void;
}

export const TaskDetailView: React.FC<TaskDetailViewProps> = ({
  task,
  activeRole,
  permissions,
  onBack,
  onEdit,
  onDelete,
  onUpdateTask,
}) => {
  const actorProfile = ROLE_PROFILES[activeRole];
  const overdue = isTaskOverdue(task);
  const taskCode = getTaskCode(task);

  const [commentText, setCommentText] = useState('');
  const [evidenceFileName, setEvidenceFileName] = useState('');
  const [evidenceFileType, setEvidenceFileType] = useState('PDF');
  const [evidenceFileSize, setEvidenceFileSize] = useState('250 KB');
  const [evidenceNote, setEvidenceNote] = useState('');
  const [statusNote, setStatusNote] = useState('');

  const handleStatusChange = (newStatus: TaskStatus) => {
    if (!permissions.canUpdateStatus || newStatus === task.status) return;
    const historyEntry = {
      id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      statusLama: task.status,
      statusBaharu: newStatus,
      tarikhMasa: getCurrentDateTimeLabel(),
      oleh: actorProfile.userName,
      catatan:
        statusNote.trim() ||
        `Status dikemaskini daripada ${task.status} kepada ${newStatus}.`,
    };
    onUpdateTask({
      ...task,
      status: newStatus,
      sejarahStatus: [...(task.sejarahStatus ?? []), historyEntry],
    });
    setStatusNote('');
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !permissions.canComment) return;
    const newComment: TaskCommentItem = {
      id: `kom-${Date.now()}`,
      penulis: actorProfile.userName,
      peranan: activeRole,
      mesej: commentText.trim(),
      tarikhMasa: getCurrentDateTimeLabel(),
    };
    onUpdateTask({
      ...task,
      komen: [newComment, ...(task.komen ?? [])],
    });
    setCommentText('');
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEvidenceFileName(file.name);
    const ext = file.name.split('.').pop()?.toUpperCase() || 'DOKUMEN';
    setEvidenceFileType(ext);
    const kb = Math.max(1, Math.round(file.size / 1024));
    setEvidenceFileSize(kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`);
  };

  const handleAddEvidence = (e: React.FormEvent) => {
    e.preventDefault();
    if (!permissions.canUploadEvidence) return;
    const finalName =
      evidenceFileName.trim() || `Evidens_${taskCode}_Simulasi.pdf`;
    const newEvidence: TaskEvidenceItem = {
      id: `ev-${Date.now()}`,
      namaFail: finalName,
      jenisFail: evidenceFileType,
      saiz: evidenceFileSize,
      dimuatNaikOleh: actorProfile.userName,
      tarikh: formatShortDate(new Date().toISOString().slice(0, 10)),
      catatan: evidenceNote.trim() || 'Evidens pelaksanaan tugasan (Mod Simulasi).',
      modDemo: true,
    };
    onUpdateTask({
      ...task,
      evidens: [newEvidence, ...(task.evidens ?? [])],
    });
    setEvidenceFileName('');
    setEvidenceNote('');
  };

  const handleRemoveEvidence = (evId: string) => {
    if (!permissions.canUploadEvidence) return;
    onUpdateTask({
      ...task,
      evidens: (task.evidens ?? []).filter((ev) => ev.id !== evId),
    });
  };

  const priorityTone =
    task.keutamaan === 'Segera'
      ? 'bg-[#F6465D]/15 text-[#F6465D] border-[#F6465D]/30'
      : task.keutamaan === 'Tinggi'
        ? 'bg-[#F0B90B]/15 text-[#F0B90B] border-[#F0B90B]/30'
        : 'bg-[#1E2329] text-[#EAECEF] border-[#2B3139]';

  const statusTone =
    task.status === 'Selesai'
      ? 'bg-[#0ECB81]/15 text-[#0ECB81] border-[#0ECB81]/30'
      : task.status === 'Dalam Proses'
        ? 'bg-[#F0B90B]/15 text-[#F0B90B] border-[#F0B90B]/30'
        : 'bg-[#F6465D]/15 text-[#F6465D] border-[#F6465D]/30';

  return (
    <div className="space-y-6">
      {/* Top Bar Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#848E9C] hover:text-[#F0B90B] transition-colors self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Senarai Tugasan
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {permissions.canEditDetails && (
            <button
              type="button"
              onClick={() => onEdit(task)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#0B0E11] bg-[#F0B90B] rounded-lg hover:bg-[#F8D12F] transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Kemaskini Tugasan
            </button>
          )}
          {permissions.canDelete && (
            <button
              type="button"
              onClick={() => onDelete(task)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#F6465D] bg-[#F6465D]/10 border border-[#F6465D]/30 rounded-lg hover:bg-[#F6465D]/20 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Padam Tugasan
            </button>
          )}
        </div>
      </div>

      {/* Header Summary Card */}
      <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-[#0B0E11] border border-[#2B3139] text-[#F0B90B]">
            {taskCode}
          </span>
          <span className={`text-xs font-bold px-2.5 py-1 rounded border ${statusTone}`}>
            Status: {task.status}
          </span>
          <span className={`text-xs font-bold px-2.5 py-1 rounded border ${priorityTone}`}>
            Keutamaan: {task.keutamaan}
          </span>
          {overdue && (
            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded bg-[#F6465D]/20 text-[#F6465D] border border-[#F6465D]/40">
              <AlertTriangle className="w-3.5 h-3.5" />
              Lewat Tarikh Akhir
            </span>
          )}
        </div>

        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            {task.tajuk}
          </h2>
          <p className="text-sm text-[#EAECEF]/90 mt-2 leading-relaxed">
            {task.keterangan || 'Tiada keterangan tambahan direkodkan.'}
          </p>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-[#2B3139]">
          <div className="p-3 rounded-lg bg-[#0B0E11] border border-[#2B3139]">
            <div className="flex items-center gap-1.5 text-[11px] text-[#848E9C]">
              <UserCheck className="w-3.5 h-3.5 text-[#F0B90B]" />
              Pegawai Bertanggungjawab
            </div>
            <div className="text-xs font-bold text-[#EAECEF] mt-1">{task.pegawai}</div>
          </div>
          <div className="p-3 rounded-lg bg-[#0B0E11] border border-[#2B3139]">
            <div className="flex items-center gap-1.5 text-[11px] text-[#848E9C]">
              <User className="w-3.5 h-3.5 text-[#0ECB81]" />
              Pegawai Pemberi Arahan
            </div>
            <div className="text-xs font-bold text-[#EAECEF] mt-1">
              {task.pemberiArahan || 'Pentadbir Sekolah'}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-[#0B0E11] border border-[#2B3139]">
            <div className="flex items-center gap-1.5 text-[11px] text-[#848E9C]">
              <Building2 className="w-3.5 h-3.5 text-[#F0B90B]" />
              Unit & Kategori
            </div>
            <div className="text-xs font-bold text-[#EAECEF] mt-1">
              {task.unit || 'Pentadbiran & Pengurusan'}
            </div>
            <div className="text-[11px] text-[#848E9C] flex items-center gap-1 mt-0.5">
              <Tag className="w-3 h-3" /> {task.kategori || 'Pentadbiran'}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-[#0B0E11] border border-[#2B3139]">
            <div className="flex items-center gap-1.5 text-[11px] text-[#848E9C]">
              <Calendar className="w-3.5 h-3.5 text-[#F6465D]" />
              Tempoh Pelaksanaan
            </div>
            <div className="text-xs text-[#848E9C] mt-1 tabular-nums">
              Mula: <span className="text-[#EAECEF] font-semibold">{formatShortDate(task.tarikhMula)}</span>
            </div>
            <div className="text-xs text-[#848E9C] tabular-nums">
              Akhir:{' '}
              <span className={`font-bold ${overdue ? 'text-[#F6465D]' : 'text-[#EAECEF]'}`}>
                {formatShortDate(task.tarikhAkhir)}
              </span>
            </div>
          </div>
        </div>

        {task.catatan && (
          <div className="p-3.5 rounded-lg bg-[#12161B] border border-[#2B3139] text-xs text-[#EAECEF]">
            <span className="font-bold text-[#F0B90B]">Catatan Tambahan: </span>
            {task.catatan}
          </div>
        )}
      </div>

      {/* Main 2-Column Interactive Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Status Update & History */}
        <div className="lg:col-span-6 space-y-6">
          {/* Status Control Card */}
          <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#EAECEF] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#0ECB81]" />
                Kemaskini Status Semasa
              </h3>
              <span className="text-[11px] text-[#848E9C]">
                Simulasi: {getRoleDisplayLabel(activeRole)}
              </span>
            </div>

            {permissions.canUpdateStatus ? (
              <>
                <input
                  type="text"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="Catatan ringkas perubahan status (pilihan)..."
                  className="w-full px-3 py-2 text-xs bg-[#0B0E11] text-[#EAECEF] placeholder:text-[#707A8A] border border-[#2B3139] rounded-lg focus:outline-none focus:border-[#F0B90B]"
                />
                <div className="grid grid-cols-3 gap-2">
                  {TASK_STATUS_OPTIONS.map((st) => {
                    const isCurrent = task.status === st;
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => handleStatusChange(st)}
                        className={`py-2 px-3 rounded-lg text-xs font-bold border transition-colors ${
                          isCurrent
                            ? 'bg-[#F0B90B] text-[#0B0E11] border-[#F0B90B]'
                            : 'bg-[#0B0E11] text-[#EAECEF] border-[#2B3139] hover:border-[#F0B90B]/60'
                        }`}
                      >
                        {st}
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <p className="text-xs text-[#848E9C] bg-[#0B0E11] border border-[#2B3139] rounded-lg p-3">
                Peranan <strong className="text-[#EAECEF]">{getRoleDisplayLabel(activeRole)}</strong> berada dalam mod pemantauan baca sahaja bagi status tugasan ini. Anda masih boleh menambah komen arahan di sebelah.
              </p>
            )}
          </div>

          {/* Sejarah Perubahan Status */}
          <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] p-5 space-y-4">
            <h3 className="text-sm font-bold text-[#EAECEF] flex items-center gap-2">
              <History className="w-4 h-4 text-[#F0B90B]" />
              Sejarah Perubahan Status ({(task.sejarahStatus ?? []).length})
            </h3>

            <div className="space-y-3">
              {[...(task.sejarahStatus ?? [])].reverse().map((hist) => (
                <div
                  key={hist.id}
                  className="p-3.5 rounded-lg bg-[#0B0E11] border border-[#2B3139] space-y-1"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#EAECEF]">
                      {hist.statusLama ? (
                        <>
                          <span className="text-[#848E9C]">{hist.statusLama}</span>
                          <span className="mx-1.5 text-[#F0B90B]">→</span>
                          <span className="text-[#0ECB81]">{hist.statusBaharu}</span>
                        </>
                      ) : (
                        <span className="text-[#F0B90B]">Didaftarkan ({hist.statusBaharu})</span>
                      )}
                    </span>
                    <span className="text-[11px] font-mono text-[#848E9C] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {hist.tarikhMasa}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#848E9C]">
                    Oleh: <span className="text-[#EAECEF] font-medium">{hist.oleh}</span>
                  </div>
                  {hist.catatan && (
                    <p className="text-xs text-[#EAECEF]/85 pt-1">{hist.catatan}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Comments & Demo Evidence */}
        <div className="lg:col-span-6 space-y-6">
          {/* Komen & Catatan */}
          <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] p-5 space-y-4">
            <h3 className="text-sm font-bold text-[#EAECEF] flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#F0B90B]" />
              Catatan & Komen Tugasan ({(task.komen ?? []).length})
            </h3>

            {permissions.canComment && (
              <form onSubmit={handleAddComment} className="space-y-2.5">
                <textarea
                  rows={2}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Tulis ulasan kemajuan, soalan atau arahan susulan..."
                  className="w-full px-3.5 py-2 text-xs bg-[#0B0E11] text-[#EAECEF] placeholder:text-[#707A8A] border border-[#2B3139] rounded-lg focus:outline-none focus:border-[#F0B90B]"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!commentText.trim()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-[#0B0E11] bg-[#F0B90B] rounded-lg hover:bg-[#F8D12F] disabled:opacity-40 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Hantar Komen
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {(task.komen ?? []).length === 0 ? (
                <div className="p-4 rounded-lg bg-[#0B0E11] border border-[#2B3139] text-xs text-[#848E9C] text-center">
                  Belum ada komen direkodkan untuk tugasan ini.
                </div>
              ) : (
                (task.komen ?? []).map((kom) => (
                  <div
                    key={kom.id}
                    className="p-3.5 rounded-lg bg-[#0B0E11] border border-[#2B3139] space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-bold text-[#EAECEF] truncate">
                          {kom.penulis}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#1E2329] text-[#F0B90B] shrink-0">
                          {getRoleDisplayLabel(kom.peranan)}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-[#848E9C] shrink-0">
                        {kom.tarikhMasa}
                      </span>
                    </div>
                    <p className="text-xs text-[#EAECEF]/90 leading-relaxed">{kom.mesej}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Bahagian Evidens Penyelesaian (Mod Demonstrasi) */}
          <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-[#EAECEF] flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-[#0ECB81]" />
                Evidens Penyelesaian ({(task.evidens ?? []).length})
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#F0B90B]/15 text-[#F0B90B]">
                MOD DEMONSTRASI
              </span>
            </div>

            <div className="p-3 rounded-lg bg-[#12161B] border border-[#F0B90B]/30 flex items-start gap-2 text-[11px] text-[#EAECEF]/90 leading-relaxed">
              <Info className="w-4 h-4 text-[#F0B90B] shrink-0 mt-0.5" />
              <span>
                <strong>Batasan Prototaip:</strong> Storan fail awan/pelayan sebenar belum disambungkan. Muat naik ini adalah simulasi — hanya metadata fail (nama, jenis, saiz dan catatan) disimpan dalam storan pelayar tempatan.
              </span>
            </div>

            {permissions.canUploadEvidence && (
              <form onSubmit={handleAddEvidence} className="space-y-3 p-3.5 rounded-lg bg-[#0B0E11] border border-[#2B3139]">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <label className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#EAECEF] bg-[#1E2329] border border-[#2B3139] rounded-lg hover:border-[#F0B90B] cursor-pointer shrink-0">
                    <Upload className="w-3.5 h-3.5 text-[#F0B90B]" />
                    Pilih Fail (Simulasi)
                    <input
                      type="file"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />
                  </label>
                  <input
                    type="text"
                    value={evidenceFileName}
                    onChange={(e) => setEvidenceFileName(e.target.value)}
                    placeholder="Atau taip nama fail evidens (cth: Laporan_Selesai.pdf)"
                    className="flex-1 px-3 py-2 text-xs bg-[#161A1E] text-[#EAECEF] placeholder:text-[#707A8A] border border-[#2B3139] rounded-lg focus:outline-none focus:border-[#F0B90B]"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={evidenceNote}
                    onChange={(e) => setEvidenceNote(e.target.value)}
                    placeholder="Catatan ringkas evidens..."
                    className="flex-1 px-3 py-2 text-xs bg-[#161A1E] text-[#EAECEF] placeholder:text-[#707A8A] border border-[#2B3139] rounded-lg focus:outline-none focus:border-[#F0B90B]"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-[#0B0E11] bg-[#0ECB81] rounded-lg hover:opacity-90 transition-opacity shrink-0"
                  >
                    <FileCheck2 className="w-3.5 h-3.5" />
                    Muat Naik Evidens (Simulasi)
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-2">
              {(task.evidens ?? []).length === 0 ? (
                <div className="p-4 rounded-lg bg-[#0B0E11] border border-[#2B3139] text-xs text-[#848E9C] text-center">
                  Tiada evidens penyelesaian dilampirkan lagi.
                </div>
              ) : (
                (task.evidens ?? []).map((ev) => (
                  <div
                    key={ev.id}
                    className="flex items-start justify-between gap-3 p-3 rounded-lg bg-[#0B0E11] border border-[#2B3139]"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#EAECEF] truncate">
                          {ev.namaFail}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1E2329] text-[#0ECB81] shrink-0">
                          {ev.jenisFail} · {ev.saiz}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#848E9C]">
                        Dimuat naik oleh {ev.dimuatNaikOleh} · {ev.tarikh}
                      </div>
                      {ev.catatan && (
                        <div className="text-[11px] text-[#EAECEF]/85">{ev.catatan}</div>
                      )}
                    </div>
                    {permissions.canUploadEvidence && (
                      <button
                        type="button"
                        onClick={() => handleRemoveEvidence(ev.id)}
                        className="p-1.5 rounded-lg text-[#848E9C] hover:text-[#F6465D] hover:bg-[#F6465D]/10 shrink-0"
                        aria-label={`Padam evidens ${ev.namaFail}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
