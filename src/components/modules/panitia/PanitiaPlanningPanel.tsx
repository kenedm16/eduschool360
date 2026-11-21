import React, { useMemo, useState } from 'react';
import {
  CalendarRange,
  Plus,
  Table2,
  CalendarDays,
  Edit3,
  Trash2,
  Target,
  Save,
} from 'lucide-react';
import {
  PanitiaItem,
  PanitiaPlan,
  PanitiaPlanCategory,
} from '../../../types/eduschool';
import {
  PANITIA_PLAN_CATEGORIES,
  PanitiaRoleControl,
} from '../../../utils/panitiaHelpers';
import { formatShortDate } from '../../../utils/formatters';
import { ConfirmDeleteModal, Modal } from '../../common/Modal';

interface PanitiaPlanningPanelProps {
  panitia: PanitiaItem;
  roleControl: PanitiaRoleControl;
  onUpdatePanitia: (updated: PanitiaItem) => void;
}

const MALAY_MONTHS = [
  'Januari',
  'Februari',
  'Mac',
  'April',
  'Mei',
  'Jun',
  'Julai',
  'Ogos',
  'September',
  'Oktober',
  'November',
  'Disember',
];

export const PanitiaPlanningPanel: React.FC<PanitiaPlanningPanelProps> = ({
  panitia,
  roleControl,
  onUpdatePanitia,
}) => {
  const [viewMode, setViewMode] = useState<'jadual' | 'kalendar'>('jadual');
  const [categoryFilter, setCategoryFilter] = useState<'Semua' | PanitiaPlanCategory>('Semua');

  // Objektif & Sasaran inline edit
  const [isEditingGoals, setIsEditingGoals] = useState(false);
  const [objektifInput, setObjektifInput] = useState(panitia.objektifPanitia || '');
  const [sasaranInput, setSasaranInput] = useState(panitia.sasaranPencapaian || '');

  // Plan Add/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PanitiaPlan | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PanitiaPlan | null>(null);

  const [kategori, setKategori] = useState<PanitiaPlanCategory>('Perancangan Aktiviti');
  const [aktiviti, setAktiviti] = useState('');
  const [sasaran, setSasaran] = useState('');
  const [tempoh, setTempoh] = useState('');
  const [tarikhMula, setTarikhMula] = useState('2026-11-15');
  const [tarikhAkhir, setTarikhAkhir] = useState('2026-11-30');
  const [pegawai, setPegawai] = useState(panitia.ketuaPanitia);
  const [status, setStatus] = useState<PanitiaPlan['status']>('Dirancang');

  const filteredPlans = useMemo(() => {
    return (panitia.perancanganTahunan ?? []).filter(
      (p) => categoryFilter === 'Semua' || (p.kategori || 'Perancangan Aktiviti') === categoryFilter
    );
  }, [panitia.perancanganTahunan, categoryFilter]);

  const plansByMonth = useMemo(() => {
    const map: Record<number, PanitiaPlan[]> = {};
    for (let m = 0; m < 12; m++) map[m] = [];
    filteredPlans.forEach((plan) => {
      const dateStr = plan.tarikhMula || plan.tarikhAkhir || '';
      const monthMatch = dateStr.match(/^\d{4}-(\d{2})/);
      if (monthMatch) {
        const idx = Math.min(11, Math.max(0, Number(monthMatch[1]) - 1));
        map[idx].push(plan);
      } else {
        // Fallback match Malay month name inside tempoh
        const foundIdx = MALAY_MONTHS.findIndex((mn) =>
          plan.tempoh.toLowerCase().includes(mn.toLowerCase())
        );
        map[foundIdx >= 0 ? foundIdx : 10].push(plan);
      }
    });
    return map;
  }, [filteredPlans]);

  const openAddPlan = () => {
    setEditingPlan(null);
    setKategori('Perancangan Aktiviti');
    setAktiviti('');
    setSasaran('');
    setTempoh('November 2026');
    setTarikhMula('2026-11-15');
    setTarikhAkhir('2026-11-30');
    setPegawai(panitia.ketuaPanitia);
    setStatus('Dirancang');
    setIsModalOpen(true);
  };

  const openEditPlan = (plan: PanitiaPlan) => {
    setEditingPlan(plan);
    setKategori(plan.kategori || 'Perancangan Aktiviti');
    setAktiviti(plan.aktiviti);
    setSasaran(plan.sasaran);
    setTempoh(plan.tempoh);
    setTarikhMula(plan.tarikhMula || '2026-11-15');
    setTarikhAkhir(plan.tarikhAkhir || '2026-11-30');
    setPegawai(plan.pegawai || panitia.ketuaPanitia);
    setStatus(plan.status);
    setIsModalOpen(true);
  };

  const handleSaveGoals = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdatePanitia({
      ...panitia,
      objektifPanitia: objektifInput.trim(),
      sasaranPencapaian: sasaranInput.trim(),
    });
    setIsEditingGoals(false);
  };

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aktiviti.trim()) return;
    if (editingPlan) {
      const updatedPlans = panitia.perancanganTahunan.map((p) =>
        p.id === editingPlan.id
          ? {
              ...p,
              kategori,
              aktiviti: aktiviti.trim(),
              sasaran: sasaran.trim() || 'Semua Murid',
              tempoh: tempoh.trim() || formatShortDate(tarikhMula),
              tarikhMula,
              tarikhAkhir,
              pegawai,
              status,
            }
          : p
      );
      onUpdatePanitia({ ...panitia, perancanganTahunan: updatedPlans });
    } else {
      const newPlan: PanitiaPlan = {
        id: `pp-${Date.now()}`,
        kategori,
        aktiviti: aktiviti.trim(),
        sasaran: sasaran.trim() || 'Semua Murid',
        tempoh: tempoh.trim() || formatShortDate(tarikhMula),
        tarikhMula,
        tarikhAkhir,
        pegawai,
        status,
      };
      onUpdatePanitia({
        ...panitia,
        perancanganTahunan: [newPlan, ...panitia.perancanganTahunan],
      });
    }
    setIsModalOpen(false);
  };

  const handleDeletePlan = (id: string) => {
    onUpdatePanitia({
      ...panitia,
      perancanganTahunan: panitia.perancanganTahunan.filter((p) => p.id !== id),
    });
  };

  return (
    <div className="space-y-6">
      {/* Objektif Panitia & Sasaran Pencapaian */}
      <div className="bg-[#0B0E11] rounded-xl border border-[#2B3139] p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-[#EAECEF] flex items-center gap-2">
            <Target className="w-4 h-4 text-[#F0B90B]" />
            Objektif Panitia & Sasaran Pencapaian ({panitia.tahunSemasa || '2026'})
          </h3>
          {roleControl.canManageSubRecords && !isEditingGoals && (
            <button
              type="button"
              onClick={() => {
                setObjektifInput(panitia.objektifPanitia || '');
                setSasaranInput(panitia.sasaranPencapaian || '');
                setIsEditingGoals(true);
              }}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#F0B90B] hover:text-[#F8D12F]"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Kemaskini Objektif
            </button>
          )}
        </div>

        {isEditingGoals ? (
          <form onSubmit={handleSaveGoals} className="space-y-3 pt-1">
            <div>
              <label className="block text-[11px] font-semibold text-[#848E9C] mb-1">
                Objektif Panitia
              </label>
              <textarea
                rows={2}
                value={objektifInput}
                onChange={(e) => setObjektifInput(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#161A1E] text-[#EAECEF] border border-[#2B3139] rounded-lg focus:outline-none focus:border-[#F0B90B]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#848E9C] mb-1">
                Sasaran Pencapaian
              </label>
              <input
                type="text"
                value={sasaranInput}
                onChange={(e) => setSasaranInput(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#161A1E] text-[#EAECEF] border border-[#2B3139] rounded-lg focus:outline-none focus:border-[#F0B90B]"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditingGoals(false)}
                className="px-3 py-1.5 text-xs font-medium text-[#EAECEF] bg-[#1E2329] rounded-lg"
              >
                Batal
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-[#0B0E11] bg-[#F0B90B] rounded-lg"
              >
                <Save className="w-3.5 h-3.5" />
                Simpan Objektif
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-lg bg-[#161A1E] border border-[#2B3139]">
              <div className="text-[11px] font-semibold text-[#848E9C] mb-1">Objektif Panitia</div>
              <p className="text-[#EAECEF] leading-relaxed">
                {panitia.objektifPanitia || 'Belum ditetapkan.'}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-[#161A1E] border border-[#2B3139]">
              <div className="text-[11px] font-semibold text-[#0ECB81] mb-1">Sasaran Pencapaian</div>
              <p className="text-[#EAECEF] leading-relaxed">
                {panitia.sasaranPencapaian || 'Belum ditetapkan.'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Kawalan Pelan: Kategori + Paparan Jadual / Kalendar + Butang Tambah */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1 p-1 bg-[#0B0E11] border border-[#2B3139] rounded-lg">
            <button
              type="button"
              onClick={() => setViewMode('jadual')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                viewMode === 'jadual'
                  ? 'bg-[#F0B90B] text-[#0B0E11]'
                  : 'text-[#848E9C] hover:text-[#EAECEF]'
              }`}
            >
              <Table2 className="w-3.5 h-3.5" />
              Paparan Jadual
            </button>
            <button
              type="button"
              onClick={() => setViewMode('kalendar')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                viewMode === 'kalendar'
                  ? 'bg-[#F0B90B] text-[#0B0E11]'
                  : 'text-[#848E9C] hover:text-[#EAECEF]'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              Paparan Kalendar
            </button>
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as 'Semua' | PanitiaPlanCategory)}
            aria-label="Tapis kategori perancangan"
            className="px-3 py-2 text-xs bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg focus:outline-none focus:border-[#F0B90B]"
          >
            <option value="Semua">Semua Kategori ({panitia.perancanganTahunan.length})</option>
            {PANITIA_PLAN_CATEGORIES.map((kat) => (
              <option key={kat} value={kat}>
                {kat}
              </option>
            ))}
          </select>
        </div>

        {roleControl.canManageSubRecords && (
          <button
            type="button"
            onClick={openAddPlan}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#0B0E11] bg-[#F0B90B] rounded-lg hover:bg-[#F8D12F] self-start lg:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            Tambah Perancangan / PLC
          </button>
        )}
      </div>

      {/* Paparan Jadual atau Kalendar */}
      {viewMode === 'jadual' ? (
        filteredPlans.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#848E9C] bg-[#0B0E11] border border-[#2B3139] rounded-xl">
            Tiada item perancangan tahunan dalam kategori ini.
          </div>
        ) : (
          <div className="border border-[#2B3139] rounded-xl overflow-x-auto bg-[#0B0E11]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#1E2329] border-b border-[#2B3139] text-[#848E9C]">
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Perancangan / Program / PLC</th>
                  <th className="py-3 px-4">Jadual Pelaksanaan</th>
                  <th className="py-3 px-4">Pegawai Bertanggungjawab</th>
                  <th className="py-3 px-4">Status</th>
                  {roleControl.canManageSubRecords && (
                    <th className="py-3 px-4 text-right">Tindakan</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2B3139]">
                {filteredPlans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-[#161A1E] transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#1E2329] text-[#F0B90B]">
                        {plan.kategori || 'Perancangan Aktiviti'}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-bold text-[#EAECEF]">{plan.aktiviti}</div>
                      <div className="text-[11px] text-[#848E9C] mt-0.5">Sasaran: {plan.sasaran}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-[#EAECEF] tabular-nums">
                      <div>{plan.tempoh}</div>
                      {plan.tarikhMula && (
                        <div className="text-[11px] text-[#848E9C]">
                          {formatShortDate(plan.tarikhMula)} – {formatShortDate(plan.tarikhAkhir || plan.tarikhMula)}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-[#EAECEF]">
                      {plan.pegawai || panitia.ketuaPanitia}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <select
                        value={plan.status}
                        disabled={!roleControl.canManageSubRecords}
                        onChange={(e) => {
                          const updatedPlans = panitia.perancanganTahunan.map((item) =>
                            item.id === plan.id
                              ? { ...item, status: e.target.value as PanitiaPlan['status'] }
                              : item
                          );
                          onUpdatePanitia({ ...panitia, perancanganTahunan: updatedPlans });
                        }}
                        aria-label={`Status pelan ${plan.aktiviti}`}
                        className="text-xs font-semibold border border-[#2B3139] rounded px-2 py-1 bg-[#161A1E] text-[#EAECEF]"
                      >
                        <option value="Dirancang">Dirancang</option>
                        <option value="Dilaksana">Dilaksana</option>
                        <option value="Selesai">Selesai</option>
                      </select>
                    </td>
                    {roleControl.canManageSubRecords && (
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditPlan(plan)}
                            className="p-1.5 rounded-lg text-[#848E9C] hover:text-[#F0B90B] hover:bg-[#1E2329]"
                            aria-label={`Kemaskini pelan ${plan.aktiviti}`}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(plan)}
                            className="p-1.5 rounded-lg text-[#848E9C] hover:text-[#F6465D] hover:bg-[#F6465D]/10"
                            aria-label={`Padam pelan ${plan.aktiviti}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        /* Paparan Kalendar Tahunan 12 Bulan */
        <div
          aria-label="Paparan Kalendar Perancangan Panitia"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
        >
          {MALAY_MONTHS.map((monthName, idx) => {
            const items = plansByMonth[idx] || [];
            return (
              <div
                key={monthName}
                className={`rounded-xl border p-3.5 space-y-2 ${
                  items.length > 0
                    ? 'bg-[#0B0E11] border-[#F0B90B]/40'
                    : 'bg-[#0B0E11]/60 border-[#2B3139]'
                }`}
              >
                <div className="flex items-center justify-between border-b border-[#2B3139] pb-2">
                  <span className="text-xs font-bold text-[#EAECEF] flex items-center gap-1.5">
                    <CalendarRange className="w-3.5 h-3.5 text-[#F0B90B]" />
                    {monthName} {panitia.tahunSemasa || '2026'}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1E2329] text-[#848E9C]">
                    {items.length}
                  </span>
                </div>
                {items.length === 0 ? (
                  <p className="text-[11px] text-[#707A8A] py-2">Tiada aktiviti dijadualkan.</p>
                ) : (
                  <div className="space-y-2">
                    {items.map((pl) => (
                      <div
                        key={pl.id}
                        className="p-2.5 rounded-lg bg-[#161A1E] border border-[#2B3139] space-y-1"
                      >
                        <div className="text-[10px] font-bold text-[#F0B90B]">
                          {pl.kategori || 'Aktiviti'}
                        </div>
                        <div className="text-xs font-semibold text-[#EAECEF] leading-snug">
                          {pl.aktiviti}
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-[#848E9C]">
                          <span>{pl.pegawai || panitia.ketuaPanitia}</span>
                          <span
                            className={
                              pl.status === 'Selesai'
                                ? 'text-[#0ECB81] font-bold'
                                : pl.status === 'Dilaksana'
                                  ? 'text-[#F0B90B] font-bold'
                                  : 'text-[#848E9C]'
                            }
                          >
                            {pl.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Tambah / Edit Perancangan */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPlan ? 'Kemaskini Perancangan Tahunan' : 'Tambah Perancangan Tahunan / PLC'}
      >
        <form onSubmit={handleSavePlan} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
                Kategori Perancangan
              </label>
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value as PanitiaPlanCategory)}
                className="w-full px-3.5 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              >
                {PANITIA_PLAN_CATEGORIES.map((kat) => (
                  <option key={kat} value={kat}>
                    {kat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
                Status Pelaksanaan
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PanitiaPlan['status'])}
                className="w-full px-3.5 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              >
                <option value="Dirancang">Dirancang</option>
                <option value="Dilaksana">Dilaksana</option>
                <option value="Selesai">Selesai</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
              Nama Aktiviti / Program / PLC <span className="text-[#F6465D]">*</span>
            </label>
            <input
              type="text"
              required
              value={aktiviti}
              onChange={(e) => setAktiviti(e.target.value)}
              placeholder="Contoh: PLC Lesson Study Pengajaran KBAT"
              className="w-full px-3.5 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
                Sasaran Kumpulan
              </label>
              <input
                type="text"
                required
                value={sasaran}
                onChange={(e) => setSasaran(e.target.value)}
                placeholder="Contoh: Murid Tingkatan 4 & 5"
                className="w-full px-3.5 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
                Pegawai Bertanggungjawab
              </label>
              <select
                value={pegawai}
                onChange={(e) => setPegawai(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              >
                {panitia.ahli.map((member) => (
                  <option key={member} value={member}>
                    {member}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
                Label Tempoh
              </label>
              <input
                type="text"
                value={tempoh}
                onChange={(e) => setTempoh(e.target.value)}
                placeholder="Contoh: November 2026"
                className="w-full px-3.5 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
                Tarikh Mula
              </label>
              <input
                type="date"
                value={tarikhMula}
                onChange={(e) => setTarikhMula(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
                Tarikh Akhir
              </label>
              <input
                type="date"
                value={tarikhAkhir}
                onChange={(e) => setTarikhAkhir(e.target.value)}
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
              {editingPlan ? 'Simpan Kemaskini' : 'Simpan Pelan'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) handleDeletePlan(deleteTarget.id);
        }}
        itemName={deleteTarget?.aktiviti ?? ''}
      />
    </div>
  );
};
