import React, { useState } from 'react';
import {
  Plus,
  Calendar,
  MapPin,
  Users,
  FileDown,
  Printer,
  Edit3,
  Trash2,
  Eye,
} from 'lucide-react';
import { PanitiaItem, PanitiaMeeting } from '../../../types/eduschool';
import { formatShortDate } from '../../../utils/formatters';
import {
  PanitiaRoleControl,
  exportMeetingMinutesToPDF,
  getPanitiaCode,
} from '../../../utils/panitiaHelpers';
import { ConfirmDeleteModal, Modal } from '../../common/Modal';

interface PanitiaMeetingPanelProps {
  panitia: PanitiaItem;
  roleControl: PanitiaRoleControl;
  onUpdatePanitia: (updated: PanitiaItem) => void;
  onNotify?: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export const PanitiaMeetingPanel: React.FC<PanitiaMeetingPanelProps> = ({
  panitia,
  roleControl,
  onUpdatePanitia,
  onNotify,
}) => {
  const meetings = panitia.mesyuarat ?? [];
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<PanitiaMeeting | null>(null);
  const [previewMeeting, setPreviewMeeting] = useState<PanitiaMeeting | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PanitiaMeeting | null>(null);

  const [bilangan, setBilangan] = useState('');
  const [tajuk, setTajuk] = useState('');
  const [tarikh, setTarikh] = useState('2026-11-20');
  const [masa, setMasa] = useState('14:00 - 15:30');
  const [tempat, setTempat] = useState('Bilik Gerakan SMK Salaping');
  const [kehadiran, setKehadiran] = useState<string[]>(panitia.ahli);
  const [agenda, setAgenda] = useState('');
  const [minit, setMinit] = useState('');
  const [keputusan, setKeputusan] = useState('');
  const [tindakanSusulan, setTindakanSusulan] = useState('');
  const [pegawaiBertanggungjawab, setPegawaiBertanggungjawab] = useState(
    panitia.setiausaha || panitia.ketuaPanitia
  );

  const openAddModal = () => {
    setEditingMeeting(null);
    setBilangan(`Bil. ${meetings.length + 1}/2026`);
    setTajuk(`Mesyuarat ${panitia.nama} Kali Ke-${meetings.length + 1}`);
    setTarikh('2026-11-20');
    setMasa('14:00 - 15:30');
    setTempat('Bilik Gerakan SMK Salaping');
    setKehadiran([...panitia.ahli]);
    setAgenda('1. Perutusan Pengerusi\n2. Pengesahan Minit Mesyuarat Lalu\n3. Laporan Prestasi & Kewangan\n4. Hal-hal Lain');
    setMinit('');
    setKeputusan('');
    setTindakanSusulan('');
    setPegawaiBertanggungjawab(panitia.setiausaha || panitia.ketuaPanitia);
    setIsModalOpen(true);
  };

  const openEditModal = (mtg: PanitiaMeeting) => {
    setEditingMeeting(mtg);
    setBilangan(mtg.bilangan);
    setTajuk(mtg.tajuk);
    setTarikh(mtg.tarikh);
    setMasa(mtg.masa);
    setTempat(mtg.tempat);
    setKehadiran(mtg.kehadiran);
    setAgenda(mtg.agenda);
    setMinit(mtg.minit);
    setKeputusan(mtg.keputusan);
    setTindakanSusulan(mtg.tindakanSusulan);
    setPegawaiBertanggungjawab(mtg.pegawaiBertanggungjawab);
    setIsModalOpen(true);
  };

  const toggleAttendance = (member: string) => {
    setKehadiran((prev) =>
      prev.includes(member) ? prev.filter((m) => m !== member) : [...prev, member]
    );
  };

  const handleSaveMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tajuk.trim()) return;

    if (editingMeeting) {
      const updated = meetings.map((m) =>
        m.id === editingMeeting.id
          ? {
              ...m,
              bilangan: bilangan.trim() || m.bilangan,
              tajuk: tajuk.trim(),
              tarikh,
              masa,
              tempat: tempat.trim(),
              kehadiran,
              agenda: agenda.trim(),
              minit: minit.trim(),
              keputusan: keputusan.trim(),
              tindakanSusulan: tindakanSusulan.trim(),
              pegawaiBertanggungjawab,
            }
          : m
      );
      onUpdatePanitia({ ...panitia, mesyuarat: updated });
    } else {
      const newMtg: PanitiaMeeting = {
        id: `mtg-${Date.now()}`,
        panitiaId: panitia.id,
        bilangan: bilangan.trim() || `Bil. ${meetings.length + 1}/2026`,
        tajuk: tajuk.trim(),
        tarikh,
        masa,
        tempat: tempat.trim() || 'Bilik Gerakan SMK Salaping',
        kehadiran,
        agenda: agenda.trim(),
        minit: minit.trim(),
        keputusan: keputusan.trim(),
        tindakanSusulan: tindakanSusulan.trim(),
        pegawaiBertanggungjawab,
      };
      onUpdatePanitia({ ...panitia, mesyuarat: [newMtg, ...meetings] });
    }
    setIsModalOpen(false);
  };

  const handleDeleteMeeting = (id: string) => {
    onUpdatePanitia({
      ...panitia,
      mesyuarat: meetings.filter((m) => m.id !== id),
    });
  };

  const handleExportPdf = (mtg: PanitiaMeeting) => {
    const fileName = exportMeetingMinutesToPDF(panitia, mtg);
    onNotify?.('success', 'Eksport PDF Minit Berjaya', `Fail ${fileName} dimuat turun.`);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-[#EAECEF]">
            Pengurusan Mesyuarat & Minit ({meetings.length} rekod)
          </h3>
          <p className="text-xs text-[#848E9C]">
            Daftar mesyuarat, kehadiran ahli, keputusan, tindakan susulan dan eksport templat minit PDF.
          </p>
        </div>

        {roleControl.canManageSubRecords && (
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#0B0E11] bg-[#F0B90B] rounded-lg hover:bg-[#F8D12F] self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            Daftar Mesyuarat
          </button>
        )}
      </div>

      {meetings.length === 0 ? (
        <div className="p-8 text-center text-xs text-[#848E9C] bg-[#0B0E11] border border-[#2B3139] rounded-xl">
          Belum ada rekod mesyuarat untuk panitia ini.
        </div>
      ) : (
        <div className="space-y-3.5">
          {meetings.map((mtg) => (
            <div
              key={mtg.id}
              className="p-4 sm:p-5 rounded-xl bg-[#0B0E11] border border-[#2B3139] space-y-3"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#F0B90B]/15 text-[#F0B90B]">
                      {mtg.bilangan}
                    </span>
                    <h4 className="text-sm font-bold text-[#EAECEF]">{mtg.tajuk}</h4>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-[#848E9C]">
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      <Calendar className="w-3.5 h-3.5 text-[#F0B90B]" />
                      {formatShortDate(mtg.tarikh)} ({mtg.masa})
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#0ECB81]" />
                      {mtg.tempat}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-[#F0B90B]" />
                      {mtg.kehadiran.length}/{panitia.ahli.length} hadir
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setPreviewMeeting(mtg)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#EAECEF] bg-[#161A1E] border border-[#2B3139] rounded-lg hover:border-[#F0B90B]"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#0ECB81]" />
                    Templat Minit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExportPdf(mtg)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-[#0B0E11] bg-[#F0B90B] rounded-lg hover:bg-[#F8D12F]"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    PDF Minit
                  </button>
                  {roleControl.canManageSubRecords && (
                    <>
                      <button
                        type="button"
                        onClick={() => openEditModal(mtg)}
                        className="p-1.5 rounded-lg text-[#848E9C] hover:text-[#F0B90B] hover:bg-[#1E2329]"
                        aria-label={`Kemaskini mesyuarat ${mtg.bilangan}`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(mtg)}
                        className="p-1.5 rounded-lg text-[#848E9C] hover:text-[#F6465D] hover:bg-[#F6465D]/10"
                        aria-label={`Padam mesyuarat ${mtg.bilangan}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-[#2B3139] text-xs">
                <div>
                  <span className="text-[11px] font-semibold text-[#848E9C]">Keputusan Mesyuarat:</span>
                  <p className="text-[#EAECEF] mt-0.5 leading-relaxed">{mtg.keputusan || '-'}</p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-[#848E9C]">
                    Tindakan Susulan ({mtg.pegawaiBertanggungjawab}):
                  </span>
                  <p className="text-[#EAECEF] mt-0.5 leading-relaxed">{mtg.tindakanSusulan || '-'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Daftar / Edit Mesyuarat */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMeeting ? 'Kemaskini Rekod Mesyuarat' : 'Daftar Mesyuarat Panitia'}
        maxWidthClass="max-w-2xl"
      >
        <form onSubmit={handleSaveMeeting} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
                Bilangan Mesyuarat
              </label>
              <input
                type="text"
                required
                value={bilangan}
                onChange={(e) => setBilangan(e.target.value)}
                placeholder="Contoh: Bil. 3/2026"
                className="w-full px-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
                Tajuk Mesyuarat <span className="text-[#F6465D]">*</span>
              </label>
              <input
                type="text"
                required
                value={tajuk}
                onChange={(e) => setTajuk(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">Tarikh</label>
              <input
                type="date"
                required
                value={tarikh}
                onChange={(e) => setTarikh(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">Masa</label>
              <input
                type="text"
                required
                value={masa}
                onChange={(e) => setMasa(e.target.value)}
                placeholder="14:00 - 15:30"
                className="w-full px-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">Tempat</label>
              <input
                type="text"
                required
                value={tempat}
                onChange={(e) => setTempat(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
              Kehadiran Ahli ({kehadiran.length} hadir)
            </label>
            <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-[#0B0E11] border border-[#2B3139]">
              {panitia.ahli.map((member) => {
                const checked = kehadiran.includes(member);
                return (
                  <label
                    key={member}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs cursor-pointer border ${
                      checked
                        ? 'bg-[#0ECB81]/15 border-[#0ECB81]/40 text-[#EAECEF]'
                        : 'bg-[#161A1E] border-[#2B3139] text-[#848E9C]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleAttendance(member)}
                      className="accent-[#F0B90B]"
                    />
                    {member}
                  </label>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">Agenda</label>
              <textarea
                rows={3}
                value={agenda}
                onChange={(e) => setAgenda(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
                Minit Mesyuarat
              </label>
              <textarea
                rows={3}
                value={minit}
                onChange={(e) => setMinit(e.target.value)}
                placeholder="Ringkasan perbincangan setiap agenda..."
                className="w-full px-3 py-2 text-xs bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
                Keputusan Mesyuarat
              </label>
              <textarea
                rows={2}
                value={keputusan}
                onChange={(e) => setKeputusan(e.target.value)}
                placeholder="Ketetapan rasmi yang dipersetujui..."
                className="w-full px-3 py-2 text-xs bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
                Tindakan Susulan
              </label>
              <textarea
                rows={2}
                value={tindakanSusulan}
                onChange={(e) => setTindakanSusulan(e.target.value)}
                placeholder="Langkah susulan selepas mesyuarat..."
                className="w-full px-3 py-2 text-xs bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
              Pegawai Bertanggungjawab (Pencatat / Pelaksana)
            </label>
            <select
              value={pegawaiBertanggungjawab}
              onChange={(e) => setPegawaiBertanggungjawab(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
            >
              {panitia.ahli.map((member) => (
                <option key={member} value={member}>
                  {member}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2.5 pt-2 border-t border-[#2B3139]">
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
              {editingMeeting ? 'Simpan Kemaskini' : 'Simpan Mesyuarat'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Pratonton Templat Minit Mesyuarat */}
      <Modal
        isOpen={Boolean(previewMeeting)}
        onClose={() => setPreviewMeeting(null)}
        title={`Templat Minit Mesyuarat (${previewMeeting?.bilangan ?? ''})`}
        subtitle={`${panitia.nama} · ${getPanitiaCode(panitia)} · SMK Salaping, Sabah`}
        maxWidthClass="max-w-2xl"
      >
        {previewMeeting && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-white text-[#102D46] space-y-3 text-xs leading-relaxed">
              <div className="border-b-2 border-[#102D46] pb-2">
                <div className="font-extrabold text-sm">
                  MINIT MESYUARAT {panitia.nama.toUpperCase()} {previewMeeting.bilangan.toUpperCase()}
                </div>
                <div className="text-[11px] font-semibold">
                  SMK SALAPING, SABAH · DATA DEMONSTRASI EDUSCHOOL 360
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div><strong>Tarikh:</strong> {formatShortDate(previewMeeting.tarikh)}</div>
                <div><strong>Masa:</strong> {previewMeeting.masa}</div>
                <div><strong>Tempat:</strong> {previewMeeting.tempat}</div>
                <div><strong>Pencatat:</strong> {previewMeeting.pegawaiBertanggungjawab}</div>
              </div>

              <div>
                <strong>Kehadiran ({previewMeeting.kehadiran.length} orang):</strong>
                <div>{previewMeeting.kehadiran.join(', ')}</div>
              </div>

              <div>
                <strong>1. Agenda Mesyuarat:</strong>
                <pre className="whitespace-pre-wrap font-sans mt-0.5">{previewMeeting.agenda || '-'}</pre>
              </div>
              <div>
                <strong>2. Catatan Minit:</strong>
                <p className="mt-0.5">{previewMeeting.minit || '-'}</p>
              </div>
              <div>
                <strong>3. Keputusan Mesyuarat:</strong>
                <p className="mt-0.5">{previewMeeting.keputusan || '-'}</p>
              </div>
              <div>
                <strong>4. Tindakan Susulan:</strong>
                <p className="mt-0.5">{previewMeeting.tindakanSusulan || '-'}</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 print:hidden">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#EAECEF] bg-[#1E2329] border border-[#2B3139] rounded-lg"
              >
                <Printer className="w-3.5 h-3.5 text-[#F0B90B]" />
                Cetak Minit
              </button>
              <button
                type="button"
                onClick={() => handleExportPdf(previewMeeting)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#0B0E11] bg-[#F0B90B] rounded-lg hover:bg-[#F8D12F]"
              >
                <FileDown className="w-3.5 h-3.5" />
                Eksport PDF
              </button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) handleDeleteMeeting(deleteTarget.id);
        }}
        itemName={deleteTarget ? `${deleteTarget.bilangan} - ${deleteTarget.tajuk}` : ''}
      />
    </div>
  );
};
