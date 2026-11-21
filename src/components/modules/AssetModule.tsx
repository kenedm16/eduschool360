import React, { useMemo, useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Wrench,
  Edit3,
  Trash2,
} from 'lucide-react';
import {
  AssetItem,
  AssetStatus,
  DamageReport,
  TeacherItem,
  UserRole,
} from '../../types/eduschool';
import { getRoleCapabilities } from '../../utils/rolePermissions';
import { formatShortDate } from '../../utils/formatters';
import { ModuleHeader } from '../common/ModuleHeader';
import { EmptyState } from '../common/EmptyState';
import { ConfirmDeleteModal, Modal } from '../common/Modal';

interface AssetModuleProps {
  assets: AssetItem[];
  damageReports: DamageReport[];
  teachers: TeacherItem[];
  activeRole: UserRole;
  onBackToDashboard: () => void;
  onAddAsset: (item: Omit<AssetItem, 'id'>) => void;
  onUpdateAsset: (item: AssetItem) => void;
  onDeleteAsset: (id: string) => void;
  onAddDamageReport: (report: Omit<DamageReport, 'id'>) => void;
  onUpdateDamageReport: (report: DamageReport) => void;
}

const ASSET_STATUSES: AssetStatus[] = ['Baik', 'Perlu Penyelenggaraan', 'Rosak'];

export const AssetModule: React.FC<AssetModuleProps> = ({
  assets,
  damageReports,
  teachers,
  activeRole,
  onBackToDashboard,
  onAddAsset,
  onUpdateAsset,
  onDeleteAsset,
  onAddDamageReport,
  onUpdateDamageReport,
}) => {
  const capabilities = getRoleCapabilities(activeRole);
  const [activeTab, setActiveTab] = useState<'inventori' | 'kerosakan'>('inventori');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Semua' | AssetStatus>('Semua');

  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<AssetItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AssetItem | null>(null);
  const [isDamageModalOpen, setIsDamageModalOpen] = useState(false);

  const [kodAset, setKodAset] = useState('');
  const [nama, setNama] = useState('');
  const [kategori, setKategori] = useState('ICT & Perkomputeran');
  const [lokasi, setLokasi] = useState('Makmal Komputer 1');
  const [kuantiti, setKuantiti] = useState('1');
  const [status, setStatus] = useState<AssetStatus>('Baik');

  const [dmgAsetId, setDmgAsetId] = useState(assets[0]?.id ?? '');
  const [dmgPelapor, setDmgPelapor] = useState(teachers[0]?.nama ?? '');
  const [dmgKeterangan, setDmgKeterangan] = useState('');

  const filteredAssets = useMemo(() => {
    return assets.filter((a) => {
      const matchSearch =
        !search.trim() ||
        a.nama.toLowerCase().includes(search.toLowerCase()) ||
        a.kodAset.toLowerCase().includes(search.toLowerCase()) ||
        a.lokasi.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'Semua' || a.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [assets, search, statusFilter]);

  const openAddAssetModal = () => {
    setEditingAsset(null);
    setKodAset(`KEW.PA-0${assets.length + 6}/2026/001`);
    setNama('');
    setKategori('ICT & Perkomputeran');
    setLokasi('Makmal Komputer 1');
    setKuantiti('1');
    setStatus('Baik');
    setIsAssetModalOpen(true);
  };

  const openEditAssetModal = (a: AssetItem) => {
    setEditingAsset(a);
    setKodAset(a.kodAset);
    setNama(a.nama);
    setKategori(a.kategori);
    setLokasi(a.lokasi);
    setKuantiti(String(a.kuantiti));
    setStatus(a.status);
    setIsAssetModalOpen(true);
  };

  const handleSaveAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) return;
    const payload = {
      kodAset: kodAset.trim(),
      nama: nama.trim(),
      kategori,
      lokasi: lokasi.trim(),
      kuantiti: Math.max(1, Number(kuantiti) || 1),
      status,
      tarikhKemaskini: '2026-11-19',
    };
    if (editingAsset) {
      onUpdateAsset({ ...editingAsset, ...payload });
    } else {
      onAddAsset(payload);
    }
    setIsAssetModalOpen(false);
  };

  const openDamageModal = () => {
    setDmgAsetId(assets[0]?.id ?? '');
    setDmgPelapor(teachers[0]?.nama ?? '');
    setDmgKeterangan('');
    setIsDamageModalOpen(true);
  };

  const handleSaveDamage = (e: React.FormEvent) => {
    e.preventDefault();
    const targetAsset = assets.find((a) => a.id === dmgAsetId);
    if (!targetAsset || !dmgKeterangan.trim()) return;

    onAddDamageReport({
      asetId: targetAsset.id,
      namaAset: targetAsset.nama,
      lokasi: targetAsset.lokasi,
      tarikhAduan: '2026-11-19',
      pelapor: dmgPelapor,
      keterangan: dmgKeterangan.trim(),
      statusTindakan: 'Dilaporkan',
    });
    setDmgKeterangan('');
    setIsDamageModalOpen(false);
    setActiveTab('kerosakan');
  };

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Pengurusan Aset"
        description="Inventori harta modal, peralatan sekolah dan pengurusan rekod kerosakan."
        onBackToDashboard={onBackToDashboard}
        actions={
          <>
            <button
              type="button"
              onClick={openDamageModal}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-white bg-[#F6465D] rounded-lg hover:bg-[#E03B52] transition-colors whitespace-nowrap"
            >
              <Wrench className="w-4 h-4" />
              Lapor Kerosakan
            </button>
            {capabilities.canManageAssets && (
              <button
                type="button"
                onClick={openAddAssetModal}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-[#0B0E11] bg-[#F0B90B] rounded-lg hover:bg-[#F8D12F] transition-colors whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                Tambah Aset
              </button>
            )}
          </>
        }
      />

      <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 bg-[#0B0E11] border border-[#2B3139] rounded-lg self-start">
          <button
            type="button"
            onClick={() => setActiveTab('inventori')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'inventori'
                ? 'bg-[#F0B90B] text-[#0B0E11] font-bold'
                : 'text-[#848E9C] hover:text-[#EAECEF]'
            }`}
          >
            Senarai Inventori ({assets.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('kerosakan')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'kerosakan'
                ? 'bg-[#F0B90B] text-[#0B0E11] font-bold'
                : 'text-[#848E9C] hover:text-[#EAECEF]'
            }`}
          >
            Rekod Kerosakan ({damageReports.length})
          </button>
        </div>

        {activeTab === 'inventori' && (
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-[#848E9C] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari aset, kod atau lokasi..."
                className="w-full sm:w-64 pl-9 pr-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] placeholder:text-[#707A8A] border border-[#2B3139] rounded-lg focus:outline-none focus:border-[#F0B90B]"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'Semua' | AssetStatus)}
              className="px-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg focus:outline-none focus:border-[#F0B90B]"
            >
              <option value="Semua">Semua Status</option>
              {ASSET_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {activeTab === 'inventori' ? (
        filteredAssets.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Tiada Rekod Aset"
            description="Tiada aset ditemui berdasarkan carian atau penapis status semasa."
            actionLabel={capabilities.canManageAssets ? 'Tambah Aset Baharu' : undefined}
            onAction={capabilities.canManageAssets ? openAddAssetModal : undefined}
          />
        ) : (
          <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-[#1E2329] border-b border-[#2B3139] text-xs font-semibold text-[#848E9C]">
                    <th className="py-3 px-5">Nama & Kod Aset</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4">Lokasi</th>
                    <th className="py-3 px-4 text-right">Kuantiti</th>
                    <th className="py-3 px-4">Status</th>
                    {capabilities.canManageAssets && <th className="py-3 px-5 text-right">Tindakan</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2B3139]">
                  {filteredAssets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-[#1E2329]/60">
                      <td className="py-3.5 px-5">
                        <div className="font-semibold text-[#EAECEF]">{asset.nama}</div>
                        <div className="text-xs font-mono text-[#848E9C] mt-0.5">
                          {asset.kodAset}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#EAECEF]">{asset.kategori}</td>
                      <td className="py-3.5 px-4 text-xs text-[#848E9C]">{asset.lokasi}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-[#F0B90B] tabular-nums">
                        {asset.kuantiti}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold whitespace-nowrap">
                        <span
                          className={
                            asset.status === 'Baik'
                              ? 'text-[#0ECB81]'
                              : asset.status === 'Perlu Penyelenggaraan'
                                ? 'text-[#F0B90B]'
                                : 'text-[#F6465D]'
                          }
                        >
                          {asset.status}
                        </span>
                      </td>
                      {capabilities.canManageAssets && (
                        <td className="py-3.5 px-5 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => openEditAssetModal(asset)}
                            className="p-1.5 rounded-lg text-[#848E9C] hover:text-[#F0B90B] hover:bg-[#1E2329]"
                            aria-label={`Kemaskini ${asset.nama}`}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(asset)}
                            className="p-1.5 rounded-lg text-[#848E9C] hover:text-[#F6465D] hover:bg-[#F6465D]/10"
                            aria-label={`Padam ${asset.nama}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] overflow-hidden">
          {damageReports.length === 0 ? (
            <div className="p-10 text-center text-sm text-[#848E9C]">
              Tiada aduan kerosakan aset direkodkan.
            </div>
          ) : (
            <div className="divide-y divide-[#2B3139]">
              {damageReports.map((rep) => (
                <div
                  key={rep.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-[#EAECEF]">{rep.namaAset}</div>
                    <p className="text-xs text-[#848E9C] leading-relaxed">{rep.keterangan}</p>
                    <div className="text-[11px] text-[#848E9C]">
                      Lokasi: {rep.lokasi} · Pelapor: {rep.pelapor} · Tarikh:{' '}
                      <span className="tabular-nums text-[#EAECEF]">{formatShortDate(rep.tarikhAduan)}</span>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <select
                      value={rep.statusTindakan}
                      disabled={!capabilities.canManageAssets}
                      onChange={(e) =>
                        onUpdateDamageReport({
                          ...rep,
                          statusTindakan: e.target.value as DamageReport['statusTindakan'],
                        })
                      }
                      className="text-xs font-semibold border border-[#2B3139] rounded-lg px-3 py-1.5 bg-[#0B0E11] text-[#EAECEF] disabled:opacity-60"
                    >
                      <option value="Dilaporkan">Dilaporkan</option>
                      <option value="Dalam Baik Pulih">Dalam Baik Pulih</option>
                      <option value="Selesai">Selesai</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={isAssetModalOpen}
        onClose={() => setIsAssetModalOpen(false)}
        title={editingAsset ? 'Kemaskini Rekod Aset' : 'Tambah Aset Baharu'}
      >
        <form onSubmit={handleSaveAsset} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
                Kod Harta Modal / Inventori
              </label>
              <input
                type="text"
                required
                value={kodAset}
                onChange={(e) => setKodAset(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">Kategori</label>
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              >
                <option value="ICT & Perkomputeran">ICT & Perkomputeran</option>
                <option value="Perabot">Perabot</option>
                <option value="Peralatan Makmal">Peralatan Makmal</option>
                <option value="Audio Visual">Audio Visual</option>
                <option value="Kemudahan Bangunan">Kemudahan Bangunan</option>
                <option value="Kemudahan Sukan">Kemudahan Sukan</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
              Nama Aset / Peralatan
            </label>
            <input
              type="text"
              required
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Contoh: Pencetak Laser Pejabat Pentadbiran"
              className="w-full px-3.5 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">Lokasi</label>
              <input
                type="text"
                required
                value={lokasi}
                onChange={(e) => setLokasi(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">Kuantiti</label>
              <input
                type="number"
                min="1"
                required
                value={kuantiti}
                onChange={(e) => setKuantiti(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as AssetStatus)}
                className="w-full px-3.5 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              >
                {ASSET_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setIsAssetModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-[#EAECEF] bg-[#1E2329] border border-[#2B3139] rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-bold text-[#0B0E11] bg-[#F0B90B] rounded-lg hover:bg-[#F8D12F]"
            >
              {editingAsset ? 'Simpan Kemaskini' : 'Simpan Aset'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isDamageModalOpen}
        onClose={() => setIsDamageModalOpen(false)}
        title="Lapor Kerosakan Aset"
        subtitle="Aduan kerosakan akan direkodkan untuk tindakan penyelenggaraan pejabat."
      >
        <form onSubmit={handleSaveDamage} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
              Pilih Aset Terlibat
            </label>
            <select
              value={dmgAsetId}
              onChange={(e) => setDmgAsetId(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
            >
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nama} ({a.lokasi})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
              Nama Pelapor
            </label>
            <select
              value={dmgPelapor}
              onChange={(e) => setDmgPelapor(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
            >
              {teachers.map((t) => (
                <option key={t.id} value={t.nama}>
                  {t.nama}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
              Keterangan Kerosakan
            </label>
            <textarea
              rows={3}
              required
              value={dmgKeterangan}
              onChange={(e) => setDmgKeterangan(e.target.value)}
              placeholder="Nyatakan simptom kerosakan atau komponen yang perlu diganti..."
              className="w-full px-3.5 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
            />
          </div>
          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setIsDamageModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-[#EAECEF] bg-[#1E2329] border border-[#2B3139] rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-bold text-white bg-[#F6465D] rounded-lg hover:bg-[#E03B52]"
            >
              Hantar Aduan
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) onDeleteAsset(deleteTarget.id);
        }}
        itemName={deleteTarget?.nama ?? ''}
      />
    </div>
  );
};
