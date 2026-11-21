import React, { useState } from 'react';
import {
  Plus,
  Calendar,
  MapPin,
  Users,
  Edit3,
  Trash2,
  Eye,
  Printer,
  FileDown,
  Award,
} from 'lucide-react';
import {
  PanitiaActivity,
  PanitiaActivityStatus,
  PanitiaItem,
} from '../../../types/eduschool';
import { formatCurrencyRM, formatShortDate } from '../../../utils/formatters';
import {
  PANITIA_ACTIVITY_STATUSES,
  PanitiaRoleControl,
  exportActivityReportToPDF,
  getPanitiaCode,
} from '../../../utils/panitiaHelpers';
import { ConfirmDeleteModal, Modal } from '../../common/Modal';

interface PanitiaActivityPanelProps {
  panitia: PanitiaItem;
  roleControl: PanitiaRoleControl;
  onUpdatePanitia: (updated: PanitiaItem) => void;
  onNotify?: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

const STATUS_BADGE_MAP: Record<PanitiaActivityStatus, string> = {
  Dirancang: 'bg-[#1E2329] text-[#848E9C] border border-[#2B3139]',
  'Sedang Berjalan': 'bg-[#F0B90B]/15 text-[#F0B90B] border border-[#F0B90B]/30',
  Selesai: 'bg-[#0ECB81]/15 text-[#0ECB81] border border-[#0ECB81]/30',
  Ditangguh: 'bg-[#F6465D]/15 text-[#F6465D] border border-[#F6465D]/30',
};

export const PanitiaActivityPanel: React.FC<PanitiaActivityPanelProps> = ({
  panitia,
  roleControl,
  onUpdatePanitia,
  onNotify,
}) => {
  const activities = panitia.aktivitiTerperinci ?? [];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<PanitiaActivity | null>(null);
  const [reportActivity, setReportActivity] = useState<PanitiaActivity | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PanitiaActivity | null>(null);

  const [nama, setNama] = useState('');
  const [objektif, setObjektif] = useState('');
  const [tarikh, setTarikh] = useState('2026-11-20');
  const [tempat, setTempat] = useState('Dewan Salaping, SMK Salaping');
  const [sasaranPeserta, setSasaranPeserta] = useState('');
  const [penyelaras, setPenyelaras] = useState(panitia.ketuaPanitia);
  const [anggaranPerbelanjaan, setAnggaranPerbelanjaan] = useState('300');
  const [perbelanjaanSebenar, setPerbelanjaanSebenar] = useState('0');
  const [status, setStatus] = useState<PanitiaActivityStatus>('Dirancang');
  const [hasilImpak, setHasilImpak] = useState('');

  const syncActivities = (nextActivities: PanitiaActivity[]) => {
    onUpdatePanitia({
      ...panitia,
      aktivitiTerperinci: nextActivities,
      aktivitiTerkini: nextActivities.map((a) => a.nama),
    });
  };

  const openAddModal = () => {
    setEditingActivity(null);
    setNama('');
    setObjektif('');
    setTarikh('2026-11-20');
    setTempat('Dewan Salaping, SMK Salaping');
    setSasaranPeserta('Murid Tingkatan 4 & 5');
    setPenyelaras(panitia.ketuaPanitia);
    setAnggaranPerbelanjaan('300');
    setPerbelanjaanSebenar('0');
    setStatus('Dirancang');
    setHasilImpak('');
    setIsModalOpen(true);
  };

  const openEditModal = (act: PanitiaActivity) => {
    setEditingActivity(act);
    setNama(act.nama);
    setObjektif(act.objektif);
    setTarikh(act.tarikh);
    setTempat(act.tempat);
    setSasaranPeserta(act.sasaranPeserta);
    setPenyelaras(act.penyelaras);
    setAnggaranPerbelanjaan(String(act.anggaranPerbelanjaan));
    setPerbelanjaanSebenar(String(act.perbelanjaanSebenar));
    setStatus(act.status);
    setHasilImpak(act.hasilImpak);
    setIsModalOpen(true);
  };

  const handleSaveActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) return;

    const est = Number(anggaranPerbelanjaan) || 0;
    const actual = Number(perbelanjaanSebenar) || 0;

    if (editingActivity) {
      const nextList = activities.map((a) =>
        a.id === editingActivity.id
          ? {
              ...a,
              nama: nama.trim(),
              objektif: objektif.trim() || `Meningkatkan penguasaan murid dalam ${panitia.nama}.`,
              tarikh,
              tempat: tempat.trim() || 'SMK Salaping',
              sasaranPeserta: sasaranPeserta.trim() || 'Semua Murid',
              penyelaras,
              anggaranPerbelanjaan: est,
              perbelanjaanSebenar: actual,
              status,
              hasilImpak: hasilImpak.trim() || 'Dalam pemantauan keberkesanan.',
            }
          : a
      );
      syncActivities(nextList);
      onNotify?.('success', 'Aktiviti Dikemaskini', nama.trim());
    } else {
      const newAct: PanitiaActivity = {
        id: `act-${Date.now()}`,
        panitiaId: panitia.id,
        nama: nama.trim(),
        objektif: objektif.trim() || `Meningkatkan penguasaan murid dalam ${panitia.nama}.`,
        tarikh,
        tempat: tempat.trim() || 'SMK Salaping',
        sasaranPeserta: sasaranPeserta.trim() || 'Semua Murid',
        penyelaras,
        anggaranPerbelanjaan: est,
        perbelanjaanSebenar: actual,
        status,
        hasilImpak: hasilImpak.trim() || 'Dilaksanakan mengikut jadual panitia.',
      };
      syncActivities([newAct, ...activities]);
      onNotify?.('success', 'Aktiviti Baharu Ditambah', nama.trim());
    }

    setIsModalOpen(false);
  };

  const handleDeleteActivity = (id: string) => {
    syncActivities(activities.filter((a) => a.id !== id));
    onNotify?.('info', 'Aktiviti Dipadam', 'Senarai aktiviti panitia telah dikemaskini.');
  };

  const handleExportActivityPdf = (act: PanitiaActivity) => {
    const fileName = exportActivityReportToPDF(panitia, act);
    onNotify?.('success', 'Eksport Laporan Aktiviti PDF', `Fail ${fileName} berjaya dijana.`);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-[#EAECEF]">
            Pengurusan Aktiviti & Program Panitia ({activities.length} program)
          </h3>
          <p className="text-xs text-[#848E9C]">
            Rekod terperinci pelaksanaan aktiviti, penyelaras, perbelanjaan dan laporan impak.
          </p>
        </div>

        {roleControl.canManageSubRecords && (
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#0B0E11] bg-[#F0B90B] rounded-lg hover:bg-[#F8D12F] self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            Tambah Aktiviti
          </button>
        )}
      </div>

      {activities.length === 0 ? (
        <div className="p-8 text-center text-xs text-[#848E9C] bg-[#0B0E11] border border-[#2B3139] rounded-xl">
          Belum ada aktiviti atau program direkodkan bagi panitia ini.
        </div>
      ) : (
        <div className="space-y-3.5">
          {activities.map((act) => (
            <div
              key={act.id}
              className="p-4 sm:p-5 rounded-xl bg-[#0B0E11] border border-[#2B3139] space-y-3"
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${STATUS_BADGE_MAP[act.status]}`}>
                      {act.status}
                    </span>
                    <h4 className="text-sm font-bold text-[#EAECEF]">{act.nama}</h4>
                  </div>
                  <p className="text-xs text-[#848E9C] leading-relaxed">{act.objektif}</p>
                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#848E9C] pt-1">
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      <Calendar className="w-3.5 h-3.5 text-[#F0B90B]" />
                      {formatShortDate(act.tarikh)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#0ECB81]" />
                      {act.tempat}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-[#F0B90B]" />
                      {act.sasaranPeserta} · Penyelaras: {act.penyelaras}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setReportActivity(act)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#EAECEF] bg-[#161A1E] border border-[#2B3139] rounded-lg hover:border-[#F0B90B]"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#0ECB81]" />
                    Lihat Laporan
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReportActivity(act);
                      setTimeout(() => window.print(), 120);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#EAECEF] bg-[#161A1E] border border-[#2B3139] rounded-lg hover:border-[#F0B90B]"
                  >
                    <Printer className="w-3.5 h-3.5 text-[#F0B90B]" />
                    Cetak Laporan
                  </button>
                  {roleControl.canManageSubRecords && (
                    <>
                      <button
                        type="button"
                        onClick={() => openEditModal(act)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#EAECEF] bg-[#161A1E] border border-[#2B3139] rounded-lg hover:text-[#F0B90B]"
                        aria-label={`Kemaskini Aktiviti ${act.nama}`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Kemaskini Aktiviti
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(act)}
                        className="p-1.5 rounded-lg text-[#848E9C] hover:text-[#F6465D] hover:bg-[#F6465D]/10"
                        aria-label={`Padam Aktiviti ${act.nama}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2.5 border-t border-[#2B3139] text-xs">
                <div>
                  <span className="text-[11px] text-[#848E9C]">Anggaran vs Sebenar:</span>
                  <div className="font-mono font-bold text-[#EAECEF] tabular-nums mt-0.5">
                    {formatCurrencyRM(act.anggaranPerbelanjaan)} /{' '}
                    <span className="text-[#0ECB81]">{formatCurrencyRM(act.perbelanjaanSebenar)}</span>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <span className="text-[11px] text-[#848E9C] inline-flex items-center gap-1">
                    <Award className="w-3 h-3 text-[#F0B90B]" />
                    Hasil dan Impak:
                  </span>
                  <p className="text-[#EAECEF] mt-0.5 leading-relaxed">{act.hasilImpak || '-'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Tambah / Edit Aktiviti */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingActivity ? 'Kemaskini Aktiviti Panitia' : 'Tambah Aktiviti & Program Panitia'}
        maxWidthClass="max-w-2xl"
      >
        <form onSubmit={handleSaveActivity} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
                Nama Aktiviti <span className="text-[#F6465D]">*</span>
              </label>
              <input
                type="text"
                required
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Contoh: Kem Pemantapan Kertas 2 SPM"
                className="w-full px-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
                Status Pelaksanaan
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PanitiaActivityStatus)}
                aria-label="Status Pelaksanaan Aktiviti"
                className="w-full px-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              >
                {PANITIA_ACTIVITY_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
              Objektif Aktiviti
            </label>
            <textarea
              rows={2}
              value={objektif}
              onChange={(e) => setObjektif(e.target.value)}
              placeholder="Nyatakan objektif utama pelaksanaan program..."
              className="w-full px-3 py-2 text-xs bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">Tarikh</label>
              <input
                type="date"
                required
                value={tarikh}
                onChange={(e) => setTarikh(e.target.value)}
                aria-label="Tarikh Aktiviti"
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
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">Penyelaras</label>
              <select
                value={penyelaras}
                onChange={(e) => setPenyelaras(e.target.value)}
                aria-label="Penyelaras Aktiviti"
                className="w-full px-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              >
                {panitia.ahli.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
                Sasaran Peserta
              </label>
              <input
                type="text"
                value={sasaranPeserta}
                onChange={(e) => setSasaranPeserta(e.target.value)}
                placeholder="Contoh: 110 murid Tingkatan 5"
                className="w-full px-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
                Anggaran Perbelanjaan (RM)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={anggaranPerbelanjaan}
                onChange={(e) => setAnggaranPerbelanjaan(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
                Perbelanjaan Sebenar (RM)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={perbelanjaanSebenar}
                onChange={(e) => setPerbelanjaanSebenar(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
              Hasil dan Impak Aktiviti
            </label>
            <textarea
              rows={2}
              value={hasilImpak}
              onChange={(e) => setHasilImpak(e.target.value)}
              placeholder="Nyatakan impak terhadap penguasaan murid atau pencapaian panitia..."
              className="w-full px-3 py-2 text-xs bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
            />
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
              {editingActivity ? 'Simpan Kemaskini' : 'Simpan Aktiviti'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Lihat / Cetak Laporan Aktiviti */}
      <Modal
        isOpen={Boolean(reportActivity)}
        onClose={() => setReportActivity(null)}
        title="Laporan Pelaksanaan Aktiviti Panitia"
        subtitle={`${panitia.nama} · ${getPanitiaCode(panitia)} · SMK Salaping`}
        maxWidthClass="max-w-2xl"
      >
        {reportActivity && (
          <div className="space-y-4">
            <div className="p-5 rounded-xl bg-white text-[#102D46] space-y-3 text-xs leading-relaxed">
              <div className="border-b-2 border-[#102D46] pb-2">
                <div className="font-extrabold text-sm">
                  LAPORAN AKTIVITI: {reportActivity.nama.toUpperCase()}
                </div>
                <div className="text-[11px] font-semibold">
                  {panitia.nama} · SMK SALAPING, SABAH (DATA DEMONSTRASI)
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div><strong>Tarikh:</strong> {formatShortDate(reportActivity.tarikh)}</div>
                <div><strong>Tempat:</strong> {reportActivity.tempat}</div>
                <div><strong>Penyelaras:</strong> {reportActivity.penyelaras}</div>
                <div><strong>Status:</strong> {reportActivity.status}</div>
                <div><strong>Sasaran Peserta:</strong> {reportActivity.sasaranPeserta}</div>
                <div>
                  <strong>Kos (Anggaran / Sebenar):</strong>{' '}
                  {formatCurrencyRM(reportActivity.anggaranPerbelanjaan)} /{' '}
                  {formatCurrencyRM(reportActivity.perbelanjaanSebenar)}
                </div>
              </div>

              <div>
                <strong>1. Objektif Program:</strong>
                <p className="mt-0.5">{reportActivity.objektif}</p>
              </div>
              <div>
                <strong>2. Hasil dan Impak Pelaksanaan:</strong>
                <p className="mt-0.5">{reportActivity.hasilImpak}</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 print:hidden">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#EAECEF] bg-[#1E2329] border border-[#2B3139] rounded-lg"
              >
                <Printer className="w-3.5 h-3.5 text-[#F0B90B]" />
                Cetak Laporan
              </button>
              <button
                type="button"
                onClick={() => handleExportActivityPdf(reportActivity)}
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
          if (deleteTarget) handleDeleteActivity(deleteTarget.id);
        }}
        itemName={deleteTarget?.nama ?? ''}
      />
    </div>
  );
};
