import React, { useMemo, useState } from 'react';
import {
  Plus,
  Wallet,
  TrendingDown,
  PiggyBank,
  Percent,
  Edit3,
  Trash2,
  BarChart3,
} from 'lucide-react';
import { PanitiaFinance, PanitiaItem } from '../../../types/eduschool';
import { formatCurrencyRM, formatShortDate } from '../../../utils/formatters';
import {
  PANITIA_FINANCE_SOURCES,
  PanitiaRoleControl,
  computePanitiaFinanceSummary,
} from '../../../utils/panitiaHelpers';
import { ConfirmDeleteModal, Modal } from '../../common/Modal';

interface PanitiaFinancePanelProps {
  panitia: PanitiaItem;
  roleControl: PanitiaRoleControl;
  onUpdatePanitia: (updated: PanitiaItem) => void;
  onNotify?: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

const SHORT_MONTHS = ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogs', 'Sep', 'Okt', 'Nov', 'Dis'];

export const PanitiaFinancePanel: React.FC<PanitiaFinancePanelProps> = ({
  panitia,
  roleControl,
  onUpdatePanitia,
  onNotify,
}) => {
  const { peruntukan, perbelanjaan, baki, peratusPenggunaan } = useMemo(
    () => computePanitiaFinanceSummary(panitia),
    [panitia]
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFinance, setEditingFinance] = useState<PanitiaFinance | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PanitiaFinance | null>(null);

  const [tahunKewangan, setTahunKewangan] = useState(panitia.tahunSemasa || '2026');
  const [jenis, setJenis] = useState<'Peruntukan' | 'Perbelanjaan'>('Perbelanjaan');
  const [tarikh, setTarikh] = useState('2026-11-20');
  const [sumberPeruntukan, setSumberPeruntukan] = useState(PANITIA_FINANCE_SOURCES[0]);
  const [perkara, setPerkara] = useState('');
  const [namaPembekal, setNamaPembekal] = useState('');
  const [noInvois, setNoInvois] = useState('');
  const [jumlah, setJumlah] = useState('');
  const [catatan, setCatatan] = useState('');

  // Data graf perbelanjaan mengikut bulan / transaksi
  const expenseChartData = useMemo(() => {
    const monthlyTotals: Record<number, { peruntukan: number; perbelanjaan: number }> = {};
    panitia.rekodKewangan.forEach((f) => {
      const mMatch = f.tarikh?.match(/^\d{4}-(\d{2})/);
      const mIdx = mMatch ? Math.min(11, Math.max(0, Number(mMatch[1]) - 1)) : 10;
      if (!monthlyTotals[mIdx]) {
        monthlyTotals[mIdx] = { peruntukan: 0, perbelanjaan: 0 };
      }
      if (f.jenis === 'Peruntukan') {
        monthlyTotals[mIdx].peruntukan += Number(f.jumlah || 0);
      } else {
        monthlyTotals[mIdx].perbelanjaan += Number(f.jumlah || 0);
      }
    });

    const entries = Object.entries(monthlyTotals)
      .map(([idxStr, vals]) => ({
        monthIdx: Number(idxStr),
        label: SHORT_MONTHS[Number(idxStr)],
        ...vals,
      }))
      .sort((a, b) => a.monthIdx - b.monthIdx);

    const maxVal = Math.max(
      1,
      ...entries.map((e) => Math.max(e.peruntukan, e.perbelanjaan))
    );
    return { entries, maxVal };
  }, [panitia.rekodKewangan]);

  const openAddModal = () => {
    setEditingFinance(null);
    setTahunKewangan(panitia.tahunSemasa || '2026');
    setJenis('Perbelanjaan');
    setTarikh('2026-11-20');
    setSumberPeruntukan(PANITIA_FINANCE_SOURCES[0]);
    setPerkara('');
    setNamaPembekal('');
    setNoInvois('');
    setJumlah('');
    setCatatan('');
    setIsModalOpen(true);
  };

  const openEditModal = (fin: PanitiaFinance) => {
    setEditingFinance(fin);
    setTahunKewangan(fin.tahunKewangan || fin.tarikh?.slice(0, 4) || '2026');
    setJenis(fin.jenis);
    setTarikh(fin.tarikh);
    setSumberPeruntukan(fin.sumberPeruntukan || PANITIA_FINANCE_SOURCES[0]);
    setPerkara(fin.perkara);
    setNamaPembekal(fin.namaPembekal || '');
    setNoInvois(fin.noInvois || '');
    setJumlah(String(fin.jumlah));
    setCatatan(fin.catatan || '');
    setIsModalOpen(true);
  };

  const handleSaveFinance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!perkara.trim()) return;
    const numericAmount = Number(jumlah) || 0;

    let nextRecords: PanitiaFinance[];
    if (editingFinance) {
      nextRecords = panitia.rekodKewangan.map((f) =>
        f.id === editingFinance.id
          ? {
              ...f,
              tahunKewangan: tahunKewangan.trim() || '2026',
              jenis,
              tarikh,
              sumberPeruntukan: jenis === 'Peruntukan' ? sumberPeruntukan : 'Tabung PCG Panitia',
              perkara: perkara.trim(),
              namaPembekal: jenis === 'Perbelanjaan' ? namaPembekal.trim() || '-' : '-',
              noInvois: jenis === 'Perbelanjaan' ? noInvois.trim() || '-' : '-',
              jumlah: numericAmount,
              catatan: catatan.trim(),
            }
          : f
      );
      onNotify?.('success', 'Rekod Kewangan Dikemaskini', perkara.trim());
    } else {
      const newFin: PanitiaFinance = {
        id: `kf-${Date.now()}`,
        tahunKewangan: tahunKewangan.trim() || '2026',
        jenis,
        tarikh,
        sumberPeruntukan: jenis === 'Peruntukan' ? sumberPeruntukan : 'Tabung PCG Panitia',
        perkara: perkara.trim(),
        namaPembekal: jenis === 'Perbelanjaan' ? namaPembekal.trim() || '-' : '-',
        noInvois: jenis === 'Perbelanjaan' ? noInvois.trim() || '-' : '-',
        jumlah: numericAmount,
        catatan: catatan.trim(),
      };
      nextRecords = [newFin, ...panitia.rekodKewangan];
      onNotify?.('success', 'Transaksi Kewangan Disimpan', `${jenis}: ${formatCurrencyRM(numericAmount)}`);
    }

    // Kira semula peruntukanTahunan supaya konsisten dengan jumlah peruntukan
    const totalPeruntukan = nextRecords
      .filter((r) => r.jenis === 'Peruntukan')
      .reduce((s, r) => s + Number(r.jumlah || 0), 0);

    onUpdatePanitia({
      ...panitia,
      peruntukanTahunan: totalPeruntukan,
      rekodKewangan: nextRecords,
    });
    setIsModalOpen(false);
  };

  const handleDeleteFinance = (id: string) => {
    const nextRecords = panitia.rekodKewangan.filter((f) => f.id !== id);
    const totalPeruntukan = nextRecords
      .filter((r) => r.jenis === 'Peruntukan')
      .reduce((s, r) => s + Number(r.jumlah || 0), 0);

    onUpdatePanitia({
      ...panitia,
      peruntukanTahunan: totalPeruntukan,
      rekodKewangan: nextRecords,
    });
    onNotify?.('info', 'Rekod Kewangan Dipadam', 'Baki peruntukan telah dikira semula secara automatik.');
  };

  return (
    <div className="space-y-6">
      {/* 4 Kad Ringkasan Kewangan Automatik */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#0B0E11] border border-[#2B3139]">
          <div className="flex items-center justify-between text-xs text-[#848E9C]">
            <span>Jumlah Peruntukan</span>
            <Wallet className="w-4 h-4 text-[#F0B90B]" />
          </div>
          <div
            data-testid="fin-jumlah-peruntukan"
            className="text-lg font-extrabold text-[#EAECEF] font-mono tabular-nums mt-1.5"
          >
            {formatCurrencyRM(peruntukan)}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0B0E11] border border-[#2B3139]">
          <div className="flex items-center justify-between text-xs text-[#848E9C]">
            <span>Jumlah Perbelanjaan</span>
            <TrendingDown className="w-4 h-4 text-[#F6465D]" />
          </div>
          <div
            data-testid="fin-jumlah-perbelanjaan"
            className="text-lg font-extrabold text-[#F6465D] font-mono tabular-nums mt-1.5"
          >
            {formatCurrencyRM(perbelanjaan)}
          </div>
        </div>

        <div
          className={`p-4 rounded-xl border ${
            baki >= 0
              ? 'bg-[#0ECB81]/10 border-[#0ECB81]/30'
              : 'bg-[#F6465D]/10 border-[#F6465D]/30'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-medium text-[#0ECB81]">
            <span>Baki Semasa</span>
            <PiggyBank className="w-4 h-4" />
          </div>
          <div
            data-testid="fin-baki-semasa"
            className={`text-lg font-extrabold font-mono tabular-nums mt-1.5 ${
              baki >= 0 ? 'text-[#0ECB81]' : 'text-[#F6465D]'
            }`}
          >
            {formatCurrencyRM(baki)}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0B0E11] border border-[#2B3139]">
          <div className="flex items-center justify-between text-xs text-[#848E9C]">
            <span>Peratus Penggunaan</span>
            <Percent className="w-4 h-4 text-[#F0B90B]" />
          </div>
          <div
            data-testid="fin-peratus-penggunaan"
            className="text-lg font-extrabold text-[#F0B90B] font-mono tabular-nums mt-1.5"
          >
            {peratusPenggunaan}%
          </div>
          <div className="w-full h-1.5 bg-[#1E2329] rounded-full overflow-hidden mt-2">
            <div
              className={`h-full rounded-full transition-all ${
                peratusPenggunaan > 90 ? 'bg-[#F6465D]' : 'bg-[#F0B90B]'
              }`}
              style={{ width: `${Math.min(100, peratusPenggunaan)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Graf Perbelanjaan vs Peruntukan */}
      <div className="p-4 sm:p-5 rounded-xl bg-[#0B0E11] border border-[#2B3139] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-[#EAECEF] flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#F0B90B]" />
              Graf Perbelanjaan & Aliran Peruntukan PCG ({panitia.tahunSemasa || '2026'})
            </h3>
            <p className="text-[11px] text-[#848E9C]">
              Baki dikira automatik: Jumlah Peruntukan ({formatCurrencyRM(peruntukan)}) − Jumlah Perbelanjaan ({formatCurrencyRM(perbelanjaan)}) = {formatCurrencyRM(baki)}
            </p>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="inline-flex items-center gap-1.5 text-[#0ECB81]">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#0ECB81]" />
              Peruntukan
            </span>
            <span className="inline-flex items-center gap-1.5 text-[#F6465D]">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#F6465D]" />
              Perbelanjaan
            </span>
          </div>
        </div>

        {expenseChartData.entries.length === 0 ? (
          <p className="text-xs text-[#848E9C] py-4 text-center">
            Tiada data transaksi untuk dipaparkan dalam graf.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-2">
            {expenseChartData.entries.map((entry) => {
              const pHeight = Math.round((entry.peruntukan / expenseChartData.maxVal) * 100);
              const bHeight = Math.round((entry.perbelanjaan / expenseChartData.maxVal) * 100);
              return (
                <div
                  key={entry.monthIdx}
                  className="p-3 rounded-lg bg-[#161A1E] border border-[#2B3139] flex flex-col justify-end"
                >
                  <div className="h-24 flex items-end justify-center gap-2 pb-2 border-b border-[#2B3139]">
                    <div className="flex flex-col items-center gap-1 w-6">
                      <div
                        className="w-full bg-[#0ECB81] rounded-t transition-all"
                        style={{ height: `${Math.max(entry.peruntukan > 0 ? 10 : 2, pHeight * 0.8)}px` }}
                        title={`Peruntukan: ${formatCurrencyRM(entry.peruntukan)}`}
                      />
                    </div>
                    <div className="flex flex-col items-center gap-1 w-6">
                      <div
                        className="w-full bg-[#F6465D] rounded-t transition-all"
                        style={{ height: `${Math.max(entry.perbelanjaan > 0 ? 10 : 2, bHeight * 0.8)}px` }}
                        title={`Perbelanjaan: ${formatCurrencyRM(entry.perbelanjaan)}`}
                      />
                    </div>
                  </div>
                  <div className="text-center pt-2">
                    <div className="text-xs font-bold text-[#EAECEF]">{entry.label}</div>
                    <div className="text-[10px] text-[#848E9C] font-mono tabular-nums truncate">
                      -{formatCurrencyRM(entry.perbelanjaan)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Header & Jadual Lejar Transaksi Kewangan */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-[#EAECEF]">
              Lejar Rekod Kewangan Panitia ({panitia.rekodKewangan.length} transaksi)
            </h3>
            <p className="text-xs text-[#848E9C]">
              Rekod terperinci penerimaan peruntukan PCG, pembekal, nombor invois dan tujuan pembelian.
            </p>
          </div>
          {roleControl.canManageSubRecords && (
            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#0B0E11] bg-[#F0B90B] rounded-lg hover:bg-[#F8D12F] self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              Rekod Transaksi Kewangan
            </button>
          )}
        </div>

        {panitia.rekodKewangan.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#848E9C] bg-[#0B0E11] border border-[#2B3139] rounded-xl">
            Belum ada rekod kewangan untuk panitia ini.
          </div>
        ) : (
          <div className="border border-[#2B3139] rounded-xl overflow-x-auto bg-[#0B0E11]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#1E2329] border-b border-[#2B3139] text-[#848E9C] font-semibold">
                  <th className="py-3 px-4">Tahun / Tarikh</th>
                  <th className="py-3 px-4">Tujuan Pembelian / Perkara</th>
                  <th className="py-3 px-4">Sumber / Pembekal & Invois</th>
                  <th className="py-3 px-4">Jenis</th>
                  <th className="py-3 px-4 text-right">Jumlah (RM)</th>
                  {roleControl.canManageSubRecords && (
                    <th className="py-3 px-4 text-right">Tindakan</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2B3139]">
                {panitia.rekodKewangan.map((fin) => (
                  <tr key={fin.id} className="hover:bg-[#161A1E] transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap tabular-nums">
                      <div className="font-semibold text-[#EAECEF]">{formatShortDate(fin.tarikh)}</div>
                      <div className="text-[10px] text-[#848E9C]">Tahun {fin.tahunKewangan || '2026'}</div>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-semibold text-[#EAECEF]">{fin.perkara}</div>
                      {fin.catatan && (
                        <div className="text-[11px] text-[#848E9C] mt-0.5">{fin.catatan}</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {fin.jenis === 'Peruntukan' ? (
                        <span className="text-[#EAECEF]">{fin.sumberPeruntukan || 'PCG Teras'}</span>
                      ) : (
                        <div>
                          <div className="text-[#EAECEF] font-medium">{fin.namaPembekal || '-'}</div>
                          <div className="text-[10px] font-mono text-[#848E9C]">
                            Invois: {fin.noInvois || '-'}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          fin.jenis === 'Peruntukan'
                            ? 'bg-[#0ECB81]/15 text-[#0ECB81]'
                            : 'bg-[#F6465D]/15 text-[#F6465D]'
                        }`}
                      >
                        {fin.jenis}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#EAECEF] tabular-nums whitespace-nowrap">
                      {formatCurrencyRM(fin.jumlah)}
                    </td>
                    {roleControl.canManageSubRecords && (
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(fin)}
                            className="p-1.5 rounded-lg text-[#848E9C] hover:text-[#F0B90B] hover:bg-[#1E2329]"
                            aria-label={`Kemaskini transaksi ${fin.perkara}`}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(fin)}
                            className="p-1.5 rounded-lg text-[#848E9C] hover:text-[#F6465D] hover:bg-[#F6465D]/10"
                            aria-label={`Padam transaksi ${fin.perkara}`}
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
        )}
      </div>

      {/* Modal Tambah / Edit Transaksi Kewangan */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingFinance ? 'Kemaskini Transaksi Kewangan PCG' : 'Rekod Transaksi Kewangan PCG'}
        maxWidthClass="max-w-2xl"
      >
        <form onSubmit={handleSaveFinance} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
                Tahun Kewangan
              </label>
              <input
                type="text"
                required
                value={tahunKewangan}
                onChange={(e) => setTahunKewangan(e.target.value)}
                aria-label="Tahun Kewangan"
                className="w-full px-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
                Jenis Transaksi
              </label>
              <select
                value={jenis}
                onChange={(e) => setJenis(e.target.value as 'Peruntukan' | 'Perbelanjaan')}
                aria-label="Jenis Transaksi Kewangan"
                className="w-full px-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              >
                <option value="Perbelanjaan">Perbelanjaan</option>
                <option value="Peruntukan">Peruntukan</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
                Tarikh Penerimaan / Perbelanjaan
              </label>
              <input
                type="date"
                required
                value={tarikh}
                onChange={(e) => setTarikh(e.target.value)}
                aria-label="Tarikh Transaksi Kewangan"
                className="w-full px-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
                Tujuan Pembelian / Perkara <span className="text-[#F6465D]">*</span>
              </label>
              <input
                type="text"
                required
                value={perkara}
                onChange={(e) => setPerkara(e.target.value)}
                placeholder="Contoh: Pembelian Modul Pecutan & Kertas A4"
                className="w-full px-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
                {jenis === 'Peruntukan' ? 'Jumlah Peruntukan (RM)' : 'Jumlah Perbelanjaan (RM)'}{' '}
                <span className="text-[#F6465D]">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={jumlah}
                onChange={(e) => setJumlah(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              />
            </div>
          </div>

          {jenis === 'Peruntukan' ? (
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
                Sumber Peruntukan
              </label>
              <select
                value={sumberPeruntukan}
                onChange={(e) => setSumberPeruntukan(e.target.value)}
                aria-label="Sumber Peruntukan"
                className="w-full px-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              >
                {PANITIA_FINANCE_SOURCES.map((src) => (
                  <option key={src} value={src}>
                    {src}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
                  Nama Pembekal
                </label>
                <input
                  type="text"
                  value={namaPembekal}
                  onChange={(e) => setNamaPembekal(e.target.value)}
                  placeholder="Contoh: Pustaka Seri Kota Kinabalu"
                  className="w-full px-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
                  Nombor Invois / Resit
                </label>
                <input
                  type="text"
                  value={noInvois}
                  onChange={(e) => setNoInvois(e.target.value)}
                  placeholder="Contoh: INV-2026-089"
                  className="w-full px-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
              Catatan Tambahan
            </label>
            <textarea
              rows={2}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Catatan kelulusan pesanan kerajaan atau rujukan baucar..."
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
              {editingFinance ? 'Simpan Kemaskini' : 'Simpan Transaksi'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) handleDeleteFinance(deleteTarget.id);
        }}
        itemName={
          deleteTarget
            ? `${deleteTarget.perkara} (${formatCurrencyRM(deleteTarget.jumlah)})`
            : ''
        }
      />
    </div>
  );
};
