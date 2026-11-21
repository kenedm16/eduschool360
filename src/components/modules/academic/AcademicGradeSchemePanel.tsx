import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Info,
  Lock,
  Plus,
  Save,
  Sliders,
} from 'lucide-react';
import { GradeBandConfig, GradeSchemeConfig } from '../../../types/eduschool';
import { Modal } from '../../common/Modal';

interface AcademicGradeSchemePanelProps {
  gradeSchemes: GradeSchemeConfig[];
  canEditSchemes: boolean;
  onUpdateScheme: (scheme: GradeSchemeConfig) => void;
  onAddScheme: (scheme: Omit<GradeSchemeConfig, 'id'>) => void;
}

export const AcademicGradeSchemePanel: React.FC<AcademicGradeSchemePanelProps> = ({
  gradeSchemes,
  canEditSchemes,
  onUpdateScheme,
  onAddScheme,
}) => {
  const [selectedSchemeId, setSelectedSchemeId] = useState(gradeSchemes[0]?.id ?? '');
  const [draftBands, setDraftBands] = useState<GradeBandConfig[] | null>(null);
  const [draftGunaGpmp, setDraftGunaGpmp] = useState<boolean>(true);
  const [draftKaedah, setDraftKaedah] = useState<string>('');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const [newNama, setNewNama] = useState('');
  const [newPenerangan, setNewPenerangan] = useState('');
  const [newSkalaMaks, setNewSkalaMaks] = useState(6);
  const [newGunaGpmp, setNewGunaGpmp] = useState(true);

  const activeScheme = useMemo(
    () => gradeSchemes.find((s) => s.id === selectedSchemeId) ?? gradeSchemes[0],
    [gradeSchemes, selectedSchemeId]
  );

  const isEditing = draftBands !== null;

  const startEditing = () => {
    if (!activeScheme || !canEditSchemes) return;
    setDraftBands(activeScheme.bands.map((b) => ({ ...b })));
    setDraftGunaGpmp(activeScheme.gunaGpmp);
    setDraftKaedah(activeScheme.kaedahPengiraan);
  };

  const cancelEditing = () => {
    setDraftBands(null);
  };

  const saveEditing = () => {
    if (!activeScheme || !draftBands) return;
    onUpdateScheme({
      ...activeScheme,
      gunaGpmp: draftGunaGpmp,
      kaedahPengiraan: draftKaedah.trim() || activeScheme.kaedahPengiraan,
      bands: draftBands,
    });
    setDraftBands(null);
  };

  const handleCreateScheme = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNama.trim()) return;
    onAddScheme({
      nama: newNama.trim(),
      penerangan:
        newPenerangan.trim() ||
        'Skema gred tambahan yang dikonfigurasikan oleh pentadbir akademik sekolah.',
      skalaMaksimum: Math.max(4, Number(newSkalaMaks) || 6),
      gunaGpmp: newGunaGpmp,
      kaedahPengiraan: newGunaGpmp
        ? `GPMP & GPS Skala 1.00–${Math.max(4, Number(newSkalaMaks) || 6)}.00 mengikut konfigurasi dalaman sekolah.`
        : 'Penilaian peratus lulus tanpa pengiraan indeks GPMP/GPS.',
      bands: [
        { id: `b-a-${Date.now()}`, label: 'A', kumpulan: 'A', minMarkah: 80, maxMarkah: 100, mataNilai: 1, lulus: true },
        { id: `b-b-${Date.now()}`, label: 'B', kumpulan: 'B', minMarkah: 65, maxMarkah: 79, mataNilai: 2, lulus: true },
        { id: `b-c-${Date.now()}`, label: 'C', kumpulan: 'C', minMarkah: 50, maxMarkah: 64, mataNilai: 3, lulus: true },
        { id: `b-d-${Date.now()}`, label: 'D', kumpulan: 'D', minMarkah: 40, maxMarkah: 49, mataNilai: 4, lulus: true },
        { id: `b-g-${Date.now()}`, label: 'G', kumpulan: 'Gagal', minMarkah: 0, maxMarkah: 39, mataNilai: 5, lulus: false },
      ],
    });
    setCreateModalOpen(false);
    setNewNama('');
    setNewPenerangan('');
  };

  if (!activeScheme) return null;

  const displayedBands = isEditing && draftBands ? draftBands : activeScheme.bands;

  return (
    <div className="space-y-6">
      {/* Nota ketelusan formula */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-[#F0B90B]/10 border border-[#F0B90B]/30 text-xs">
        <Info className="w-5 h-5 text-[#F0B90B] shrink-0 mt-0.5" />
        <div className="space-y-1 text-[#EAECEF]">
          <div className="font-bold text-[#F0B90B]">
            Skema Gred Boleh Konfigurasi & Ketelusan Pengiraan GPS/GPMP
          </div>
          <p className="text-[#848E9C] leading-relaxed">
            Setiap peperiksaan boleh menggunakan skema gred dan skala pemberat berbeza (contohnya Skema 10 Gred SPM, Skema 6 Gred Menengah Rendah, atau Ujian Diagnostik tanpa GPMP). Formula dan julat markah yang dipaparkan di sini merupakan konfigurasi dalaman sekolah dan perlu disahkan oleh pentadbir kurikulum sebelum pelaporan rasmi.
          </p>
        </div>
      </div>

      {/* Pilihan Skema */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#EAECEF] flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#F0B90B]" />
              Senarai Skema Gred Sekolah
            </h2>
            {canEditSchemes && (
              <button
                type="button"
                onClick={() => setCreateModalOpen(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold bg-[#F0B90B] text-[#0B0E11] rounded-lg hover:bg-[#F8D12F]"
              >
                <Plus className="w-3.5 h-3.5" />
                Skema Baharu
              </button>
            )}
          </div>

          <div className="space-y-2.5">
            {gradeSchemes.map((sc) => {
              const selected = sc.id === activeScheme.id;
              return (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => {
                    setSelectedSchemeId(sc.id);
                    setDraftBands(null);
                  }}
                  className={`w-full text-left p-4 rounded-xl border transition-colors ${
                    selected
                      ? 'bg-[#F0B90B]/10 border-[#F0B90B]/60'
                      : 'bg-[#161A1E] border-[#2B3139] hover:bg-[#1E2329]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#EAECEF]">{sc.nama}</span>
                    {selected && <CheckCircle2 className="w-4 h-4 text-[#F0B90B] shrink-0" />}
                  </div>
                  <p className="text-[11px] text-[#848E9C] mt-1 line-clamp-2">{sc.penerangan}</p>
                  <div className="flex items-center gap-2 mt-2 text-[10px] font-semibold">
                    <span className="px-2 py-0.5 rounded bg-[#0B0E11] border border-[#2B3139] text-[#EAECEF]">
                      {sc.bands.length} julat gred
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded ${
                        sc.gunaGpmp
                          ? 'bg-[#0ECB81]/15 text-[#0ECB81]'
                          : 'bg-[#1E2329] text-[#848E9C]'
                      }`}
                    >
                      {sc.gunaGpmp ? `GPMP/GPS Aktif (0–${sc.skalaMaksimum})` : 'Tanpa GPMP'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Perincian Julat & Formula Skema */}
        <div className="lg:col-span-8 bg-[#161A1E] rounded-xl border border-[#2B3139] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#2B3139] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-[#EAECEF]">{activeScheme.nama}</h3>
              <p className="text-xs text-[#848E9C]">{activeScheme.penerangan}</p>
            </div>
            {canEditSchemes ? (
              isEditing ? (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={cancelEditing}
                    className="px-3 py-1.5 text-xs font-medium bg-[#1E2329] text-[#EAECEF] border border-[#2B3139] rounded-lg"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={saveEditing}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-[#0ECB81] text-[#0B0E11] rounded-lg hover:bg-[#15E092]"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Simpan Skema
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={startEditing}
                  className="px-3.5 py-1.5 text-xs font-bold bg-[#F0B90B] text-[#0B0E11] rounded-lg hover:bg-[#F8D12F] shrink-0"
                >
                  Kemaskini Julat & Pemberat
                </button>
              )
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1E2329] border border-[#2B3139] text-[11px] text-[#848E9C] shrink-0">
                <Lock className="w-3.5 h-3.5 text-[#F0B90B]" />
                Paparan Baca Sahaja (Khusus Pentadbir / Ketua Bidang)
              </span>
            )}
          </div>

          <div className="p-5 space-y-4">
            <div className="p-3.5 rounded-lg bg-[#0B0E11] border border-[#2B3139] text-xs space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-[#F0B90B]">Formula & Kaedah Pengiraan Skema</span>
                {isEditing && (
                  <label className="inline-flex items-center gap-2 text-[#EAECEF] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draftGunaGpmp}
                      onChange={(e) => setDraftGunaGpmp(e.target.checked)}
                      className="accent-[#F0B90B]"
                    />
                    Aktifkan Pengiraan GPMP & GPS
                  </label>
                )}
              </div>
              {isEditing ? (
                <textarea
                  rows={2}
                  value={draftKaedah}
                  onChange={(e) => setDraftKaedah(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#161A1E] text-[#EAECEF] border border-[#2B3139] rounded-lg"
                />
              ) : (
                <p className="text-[#EAECEF] leading-relaxed">{activeScheme.kaedahPengiraan}</p>
              )}
            </div>

            <div className="overflow-x-auto border border-[#2B3139] rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#1E2329] border-b border-[#2B3139] text-[#848E9C]">
                    <th className="py-2.5 px-3">Gred</th>
                    <th className="py-2.5 px-3">Kumpulan</th>
                    <th className="py-2.5 px-3 text-right">Markah Minimum</th>
                    <th className="py-2.5 px-3 text-right">Markah Maksimum</th>
                    <th className="py-2.5 px-3 text-right">Mata Nilai (Pemberat)</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2B3139]">
                  {displayedBands.map((band, idx) => (
                    <tr key={band.id} className="hover:bg-[#1E2329]/40">
                      <td className="py-2.5 px-3 font-bold text-[#F0B90B]">{band.label}</td>
                      <td className="py-2.5 px-3 text-[#EAECEF]">{band.kumpulan}</td>
                      <td className="py-2.5 px-3 text-right tabular-nums">
                        {isEditing ? (
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={band.minMarkah}
                            onChange={(e) => {
                              const val = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                              setDraftBands((prev) =>
                                prev
                                  ? prev.map((b, i) => (i === idx ? { ...b, minMarkah: val } : b))
                                  : prev
                              );
                            }}
                            className="w-16 px-2 py-1 text-right bg-[#0B0E11] border border-[#2B3139] rounded"
                          />
                        ) : (
                          band.minMarkah
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums">
                        {isEditing ? (
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={band.maxMarkah}
                            onChange={(e) => {
                              const val = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                              setDraftBands((prev) =>
                                prev
                                  ? prev.map((b, i) => (i === idx ? { ...b, maxMarkah: val } : b))
                                  : prev
                              );
                            }}
                            className="w-16 px-2 py-1 text-right bg-[#0B0E11] border border-[#2B3139] rounded"
                          />
                        ) : (
                          band.maxMarkah
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                        {isEditing ? (
                          <input
                            type="number"
                            min={0}
                            max={20}
                            value={band.mataNilai}
                            onChange={(e) => {
                              const val = Math.max(0, Number(e.target.value) || 0);
                              setDraftBands((prev) =>
                                prev
                                  ? prev.map((b, i) => (i === idx ? { ...b, mataNilai: val } : b))
                                  : prev
                              );
                            }}
                            className="w-16 px-2 py-1 text-right bg-[#0B0E11] border border-[#2B3139] rounded"
                          />
                        ) : (
                          band.mataNilai
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        {isEditing ? (
                          <button
                            type="button"
                            onClick={() =>
                              setDraftBands((prev) =>
                                prev
                                  ? prev.map((b, i) => (i === idx ? { ...b, lulus: !b.lulus } : b))
                                  : prev
                              )
                            }
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                              band.lulus
                                ? 'bg-[#0ECB81]/15 text-[#0ECB81]'
                                : 'bg-[#F6465D]/15 text-[#F6465D]'
                            }`}
                          >
                            {band.lulus ? 'Lulus' : 'Gagal'}
                          </button>
                        ) : (
                          <span
                            className={`text-[11px] font-semibold ${
                              band.lulus ? 'text-[#0ECB81]' : 'text-[#F6465D]'
                            }`}
                          >
                            {band.lulus ? 'Lulus' : 'Gagal'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Tambah Skema Baharu */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Tambah Skema Gred Baharu"
        subtitle="Cipta skema khas untuk peperiksaan atau saringan tertentu."
      >
        <form onSubmit={handleCreateScheme} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#848E9C] mb-1">Nama Skema</label>
            <input
              type="text"
              required
              placeholder="Contoh: Skema STPM Penggal 1"
              value={newNama}
              onChange={(e) => setNewNama(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#848E9C] mb-1">Penerangan</label>
            <textarea
              rows={2}
              value={newPenerangan}
              onChange={(e) => setNewPenerangan(e.target.value)}
              placeholder="Nyatakan kegunaan skema ini..."
              className="w-full px-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
            />
          </div>
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1">
                Skala Maksimum Mata Nilai
              </label>
              <input
                type="number"
                min={4}
                max={12}
                value={newSkalaMaks}
                onChange={(e) => setNewSkalaMaks(Number(e.target.value) || 6)}
                className="w-full px-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              />
            </div>
            <div className="flex items-end pb-2">
              <label className="inline-flex items-center gap-2 text-xs text-[#EAECEF] cursor-pointer">
                <input
                  type="checkbox"
                  checked={newGunaGpmp}
                  onChange={(e) => setNewGunaGpmp(e.target.checked)}
                  className="accent-[#F0B90B]"
                />
                Kira GPMP & GPS
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-[#EAECEF] bg-[#1E2329] border border-[#2B3139] rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-bold text-[#0B0E11] bg-[#F0B90B] rounded-lg hover:bg-[#F8D12F]"
            >
              Cipta Skema
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
