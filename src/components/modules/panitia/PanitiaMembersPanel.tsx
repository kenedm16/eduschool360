import React, { useState } from 'react';
import {
  UserPlus,
  Users,
  Trash2,
  Calendar,
  ShieldCheck,
  Award,
  BadgeCheck,
} from 'lucide-react';
import { PanitiaItem, TeacherItem } from '../../../types/eduschool';
import { formatShortDate } from '../../../utils/formatters';
import { PanitiaRoleControl, getPanitiaCode } from '../../../utils/panitiaHelpers';
import { ConfirmDeleteModal } from '../../common/Modal';

interface PanitiaMembersPanelProps {
  panitia: PanitiaItem;
  teachers: TeacherItem[];
  roleControl: PanitiaRoleControl;
  onUpdatePanitia: (updated: PanitiaItem) => void;
}

export const PanitiaMembersPanel: React.FC<PanitiaMembersPanelProps> = ({
  panitia,
  teachers,
  roleControl,
  onUpdatePanitia,
}) => {
  const [selectedTeacherToAdd, setSelectedTeacherToAdd] = useState('');
  const [customMemberName, setCustomMemberName] = useState('');
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);

  const availableTeachers = teachers.filter((t) => !panitia.ahli.includes(t.nama));

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    const candidate = customMemberName.trim() || selectedTeacherToAdd;
    if (!candidate || panitia.ahli.includes(candidate)) return;
    onUpdatePanitia({
      ...panitia,
      ahli: [...panitia.ahli, candidate],
    });
    setSelectedTeacherToAdd('');
    setCustomMemberName('');
  };

  const handleRemoveMember = (name: string) => {
    if (panitia.ahli.length <= 1) return;
    const nextMembers = panitia.ahli.filter((m) => m !== name);
    onUpdatePanitia({
      ...panitia,
      ahli: nextMembers,
      ketuaPanitia: panitia.ketuaPanitia === name ? nextMembers[0] : panitia.ketuaPanitia,
      setiausaha: panitia.setiausaha === name ? nextMembers[0] : panitia.setiausaha,
    });
  };

  return (
    <div className="space-y-6">
      {/* Maklumat Profil Panitia Lengkap */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        <div className="p-3.5 rounded-lg bg-[#0B0E11] border border-[#2B3139]">
          <div className="text-[11px] text-[#848E9C] flex items-center gap-1.5">
            <BadgeCheck className="w-3.5 h-3.5 text-[#F0B90B]" />
            ID & Tahun Semasa
          </div>
          <div className="text-sm font-mono font-bold text-[#EAECEF] mt-1">
            {getPanitiaCode(panitia)} · {panitia.tahunSemasa || '2026'}
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-[#0B0E11] border border-[#2B3139]">
          <div className="text-[11px] text-[#848E9C] flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-[#0ECB81]" />
            Ketua Panitia & Setiausaha
          </div>
          <div className="text-xs font-bold text-[#EAECEF] mt-1 truncate">
            Ketua: {panitia.ketuaPanitia}
          </div>
          <div className="text-[11px] text-[#848E9C] truncate">
            Setiausaha: {panitia.setiausaha || '-'}
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-[#0B0E11] border border-[#2B3139]">
          <div className="text-[11px] text-[#848E9C] flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#F0B90B]" />
            Tarikh Penubuhan & Status
          </div>
          <div className="flex items-center justify-between gap-2 mt-1">
            <span className="text-xs font-bold text-[#EAECEF] tabular-nums">
              {formatShortDate(panitia.tarikhPenubuhan || '2016-01-05')}
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                panitia.statusAktif === 'Tidak Aktif'
                  ? 'bg-[#F6465D]/15 text-[#F6465D]'
                  : 'bg-[#0ECB81]/15 text-[#0ECB81]'
              }`}
            >
              {panitia.statusAktif || 'Aktif'}
            </span>
          </div>
        </div>
      </div>

      {/* Daftar & Senarai Ahli Panitia */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 bg-[#0B0E11] rounded-xl border border-[#2B3139] overflow-hidden">
          <div className="px-4 py-3.5 border-b border-[#2B3139] bg-[#1E2329] flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#EAECEF] flex items-center gap-2">
              <Users className="w-4 h-4 text-[#F0B90B]" />
              Senarai Ahli Panitia ({panitia.ahli.length} orang)
            </h3>
          </div>

          <div className="divide-y divide-[#2B3139]">
            {panitia.ahli.map((member, idx) => {
              const isKetua = member === panitia.ketuaPanitia;
              const isSetiausaha = member === panitia.setiausaha && !isKetua;
              const matchedTeacher = teachers.find((t) => t.nama === member);
              return (
                <div
                  key={`${member}-${idx}`}
                  className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-[#161A1E] transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#EAECEF] truncate">{member}</div>
                    <div className="text-[11px] text-[#848E9C] truncate">
                      {matchedTeacher
                        ? `${matchedTeacher.jawatan} · Samb. ${matchedTeacher.noSambungan}`
                        : 'Ahli Guru Mata Pelajaran (Simulasi)'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        isKetua
                          ? 'bg-[#F0B90B]/15 text-[#F0B90B]'
                          : isSetiausaha
                            ? 'bg-[#0ECB81]/15 text-[#0ECB81]'
                            : 'bg-[#1E2329] text-[#848E9C]'
                      }`}
                    >
                      {isKetua ? 'Ketua Panitia' : isSetiausaha ? 'Setiausaha' : 'Ahli'}
                    </span>
                    {roleControl.canManageSubRecords && panitia.ahli.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setMemberToRemove(member)}
                        className="p-1.5 rounded-lg text-[#848E9C] hover:text-[#F6465D] hover:bg-[#F6465D]/10 transition-colors"
                        aria-label={`Keluarkan ahli ${member}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Borang Daftar Ahli Baharu */}
        <div className="lg:col-span-5 bg-[#0B0E11] rounded-xl border border-[#2B3139] p-4 space-y-4">
          <h3 className="text-sm font-bold text-[#EAECEF] flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-[#0ECB81]" />
            Daftar Ahli Panitia
          </h3>

          {roleControl.canManageSubRecords ? (
            <form onSubmit={handleAddMember} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
                  Pilih daripada Direktori Guru (Simulasi)
                </label>
                <select
                  value={selectedTeacherToAdd}
                  onChange={(e) => setSelectedTeacherToAdd(e.target.value)}
                  aria-label="Pilih guru untuk didaftar sebagai ahli"
                  className="w-full px-3 py-2 text-xs bg-[#161A1E] text-[#EAECEF] border border-[#2B3139] rounded-lg focus:outline-none focus:border-[#F0B90B]"
                >
                  <option value="">-- Pilih guru sekolah --</option>
                  {availableTeachers.map((t) => (
                    <option key={t.id} value={t.nama}>
                      {t.nama} ({t.jawatan})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
                  Atau Masukkan Nama Guru Baharu
                </label>
                <input
                  type="text"
                  value={customMemberName}
                  onChange={(e) => setCustomMemberName(e.target.value)}
                  placeholder="Contoh: Cikgu Nurul Ain (Simulasi)"
                  className="w-full px-3 py-2 text-xs bg-[#161A1E] text-[#EAECEF] placeholder:text-[#707A8A] border border-[#2B3139] rounded-lg focus:outline-none focus:border-[#F0B90B]"
                />
              </div>

              <button
                type="submit"
                disabled={!selectedTeacherToAdd && !customMemberName.trim()}
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-[#0B0E11] bg-[#F0B90B] rounded-lg hover:bg-[#F8D12F] disabled:opacity-40 transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Daftar Ahli ke Panitia
              </button>
            </form>
          ) : (
            <div className="p-3.5 rounded-lg bg-[#161A1E] border border-[#2B3139] text-xs text-[#848E9C] flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-[#F0B90B] shrink-0 mt-0.5" />
              <span>Mod baca sahaja. Tukar ke Ketua Panitia atau Pentadbir untuk mendaftar ahli baharu.</span>
            </div>
          )}
        </div>
      </div>

      <ConfirmDeleteModal
        isOpen={Boolean(memberToRemove)}
        onClose={() => setMemberToRemove(null)}
        onConfirm={() => {
          if (memberToRemove) handleRemoveMember(memberToRemove);
        }}
        itemName={memberToRemove ?? ''}
        title="Keluarkan Ahli Panitia"
      />
    </div>
  );
};
