import React, { useMemo, useState } from 'react';
import {
  FolderOpen,
  Plus,
  Search,
  Download,
  Eye,
  Trash2,
  HardDrive,
  FileText,
  Upload,
} from 'lucide-react';
import {
  PanitiaDocument,
  PanitiaDocumentCategory,
  PanitiaItem,
} from '../../../types/eduschool';
import { formatShortDate } from '../../../utils/formatters';
import {
  PANITIA_DOC_CATEGORIES,
  PanitiaRoleControl,
  downloadDemoPanitiaDocument,
  getPanitiaCode,
} from '../../../utils/panitiaHelpers';
import { ConfirmDeleteModal, Modal } from '../../common/Modal';

interface PanitiaDocumentPanelProps {
  panitia: PanitiaItem;
  roleControl: PanitiaRoleControl;
  onUpdatePanitia: (updated: PanitiaItem) => void;
  onNotify?: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export const PanitiaDocumentPanel: React.FC<PanitiaDocumentPanelProps> = ({
  panitia,
  roleControl,
  onUpdatePanitia,
  onNotify,
}) => {
  const docs = panitia.dokumenPanitia ?? [];

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'Semua' | PanitiaDocumentCategory>('Semua');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<PanitiaDocument | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PanitiaDocument | null>(null);

  const [namaDokumen, setNamaDokumen] = useState('');
  const [kategori, setKategori] = useState<PanitiaDocumentCategory>('Fail Pengurusan');
  const [tarikh, setTarikh] = useState('2026-11-20');
  const [pemilik, setPemilik] = useState(panitia.ketuaPanitia);
  const [format, setFormat] = useState('PDF');
  const [saiz, setSaiz] = useState('420 KB');
  const [catatan, setCatatan] = useState('');

  const filteredDocs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return docs.filter((d) => {
      const matchCat = categoryFilter === 'Semua' || d.kategori === categoryFilter;
      const matchQuery =
        !q ||
        d.namaDokumen.toLowerCase().includes(q) ||
        d.kategori.toLowerCase().includes(q) ||
        d.pemilik.toLowerCase().includes(q) ||
        d.catatan.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [docs, searchQuery, categoryFilter]);

  const openAddModal = () => {
    setNamaDokumen('');
    setKategori('Fail Pengurusan');
    setTarikh('2026-11-20');
    setPemilik(panitia.ketuaPanitia);
    setFormat('PDF');
    setSaiz('420 KB');
    setCatatan('');
    setIsModalOpen(true);
  };

  const handleSimulatedFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!namaDokumen.trim()) {
      setNamaDokumen(file.name.replace(/\.[^/.]+$/, ''));
    }
    const ext = file.name.split('.').pop()?.toUpperCase() || 'PDF';
    setFormat(ext);
    const kb = Math.max(1, Math.round(file.size / 1024));
    setSaiz(kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`);
  };

  const handleAddDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaDokumen.trim()) return;
    const newDoc: PanitiaDocument = {
      id: `pdoc-${Date.now()}`,
      panitiaId: panitia.id,
      namaDokumen: namaDokumen.trim(),
      kategori,
      tarikh,
      pemilik,
      format: format.trim() || 'PDF',
      saiz: saiz.trim() || '250 KB',
      catatan: catatan.trim() || 'Dokumen evidens panitia (simulasi storan setempat).',
      modSimulasi: true,
    };

    onUpdatePanitia({
      ...panitia,
      dokumenPanitia: [newDoc, ...docs],
      bilanganLaporan: (panitia.bilanganLaporan || 0) + 1,
    });
    onNotify?.('success', 'Dokumen Simulasi Disimpan', newDoc.namaDokumen);
    setIsModalOpen(false);
  };

  const handleDeleteDoc = (id: string) => {
    onUpdatePanitia({
      ...panitia,
      dokumenPanitia: docs.filter((d) => d.id !== id),
    });
    onNotify?.('info', 'Dokumen Dipadam', 'Rekod dokumen simulasi telah dikeluarkan.');
  };

  const handleDownload = (docItem: PanitiaDocument) => {
    const fileName = downloadDemoPanitiaDocument(panitia, docItem);
    onNotify?.('success', 'Muat Turun Fail Simulasi', `Fail ${fileName} dimuat turun.`);
  };

  return (
    <div className="space-y-5">
      {/* Notis Simulasi Storan Setempat */}
      <div className="p-3.5 rounded-xl bg-[#F0B90B]/10 border border-[#F0B90B]/30 flex items-start gap-3">
        <HardDrive className="w-4 h-4 text-[#F0B90B] shrink-0 mt-0.5" />
        <div className="text-xs text-[#EAECEF] leading-relaxed">
          <strong className="text-[#F0B90B]">Simulasi Storan Setempat (Tanpa Storan Awan Sebenar):</strong>{' '}
          Rekod dokumen dan muat naik evidens dalam modul ini disimpan secara tempatan pada pelayar (storan pelayar tempatan) bagi tujuan demonstrasi prototaip sahaja.
        </div>
      </div>

      {/* Bar Carian, Penapis Kategori & Butang Tambah */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-[#848E9C] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama dokumen, pemilik atau catatan..."
              aria-label="Carian dokumen panitia"
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#0B0E11] text-[#EAECEF] placeholder:text-[#707A8A] border border-[#2B3139] rounded-lg focus:outline-none focus:border-[#F0B90B]"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as 'Semua' | PanitiaDocumentCategory)}
            aria-label="Tapis kategori dokumen"
            className="px-3 py-2 text-xs bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg focus:outline-none focus:border-[#F0B90B]"
          >
            <option value="Semua">Semua Kategori ({docs.length})</option>
            {PANITIA_DOC_CATEGORIES.map((kat) => (
              <option key={kat} value={kat}>
                {kat} ({docs.filter((d) => d.kategori === kat).length})
              </option>
            ))}
          </select>
        </div>

        {roleControl.canUploadDocuments && (
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#0B0E11] bg-[#F0B90B] rounded-lg hover:bg-[#F8D12F] self-start lg:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            Tambah Dokumen
          </button>
        )}
      </div>

      {/* Ringkasan Pantas 9 Kategori */}
      <div className="flex flex-wrap gap-1.5">
        {PANITIA_DOC_CATEGORIES.map((kat) => {
          const count = docs.filter((d) => d.kategori === kat).length;
          const active = categoryFilter === kat;
          return (
            <button
              key={kat}
              type="button"
              onClick={() => setCategoryFilter(active ? 'Semua' : kat)}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors border ${
                active
                  ? 'bg-[#F0B90B] text-[#0B0E11] border-[#F0B90B]'
                  : 'bg-[#0B0E11] text-[#848E9C] border-[#2B3139] hover:text-[#EAECEF]'
              }`}
            >
              {kat}: {count}
            </button>
          );
        })}
      </div>

      {/* Senarai Dokumen */}
      {filteredDocs.length === 0 ? (
        <div className="p-8 text-center text-xs text-[#848E9C] bg-[#0B0E11] border border-[#2B3139] rounded-xl">
          Tiada dokumen ditemui bagi carian atau kategori dipilih.
        </div>
      ) : (
        <div className="divide-y divide-[#2B3139] border border-[#2B3139] rounded-xl bg-[#0B0E11] overflow-hidden">
          {filteredDocs.map((docItem) => (
            <div
              key={docItem.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#161A1E] transition-colors"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-[#1E2329] border border-[#2B3139] flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-[#F0B90B]" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#1E2329] text-[#F0B90B]">
                      {docItem.kategori}
                    </span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#0ECB81]/15 text-[#0ECB81]">
                      Simulasi Tempatan
                    </span>
                  </div>
                  <div className="text-sm font-bold text-[#EAECEF] mt-1 truncate">
                    {docItem.namaDokumen}
                  </div>
                  <div className="text-[11px] text-[#848E9C] mt-0.5">
                    {docItem.pemilik} · {formatShortDate(docItem.tarikh)} · {docItem.format} ({docItem.saiz})
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setPreviewDoc(docItem)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#EAECEF] bg-[#161A1E] border border-[#2B3139] rounded-lg hover:border-[#F0B90B]"
                >
                  <Eye className="w-3.5 h-3.5 text-[#0ECB81]" />
                  Lihat
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload(docItem)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-[#0B0E11] bg-[#F0B90B] rounded-lg hover:bg-[#F8D12F]"
                >
                  <Download className="w-3.5 h-3.5" />
                  Muat Turun
                </button>
                {roleControl.canManageSubRecords && (
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(docItem)}
                    className="p-1.5 rounded-lg text-[#848E9C] hover:text-[#F6465D] hover:bg-[#F6465D]/10"
                    aria-label={`Padam dokumen ${docItem.namaDokumen}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Tambah Dokumen */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Tambah Dokumen & Evidens Panitia"
        subtitle="Simulasi muat naik ke arkib setempat panitia (tiada storan awan digunakan)."
        maxWidthClass="max-w-xl"
      >
        <form onSubmit={handleAddDoc} className="space-y-4">
          <div className="p-3 rounded-lg bg-[#0B0E11] border border-dashed border-[#2B3139]">
            <label className="block text-xs font-semibold text-[#EAECEF] mb-1.5 flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5 text-[#F0B90B]" />
              Pilih Fail Rujukan Tempatan (Pilihan Simulasi)
            </label>
            <input
              type="file"
              onChange={handleSimulatedFileSelect}
              className="block w-full text-xs text-[#848E9C] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#1E2329] file:text-[#EAECEF] hover:file:bg-[#2B3139]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
                Nama Dokumen <span className="text-[#F6465D]">*</span>
              </label>
              <input
                type="text"
                required
                value={namaDokumen}
                onChange={(e) => setNamaDokumen(e.target.value)}
                placeholder="Contoh: Evidens PdP Inovasi Kumpulan 2"
                className="w-full px-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
                Kategori Dokumen (9 Kategori)
              </label>
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value as PanitiaDocumentCategory)}
                aria-label="Kategori Dokumen"
                className="w-full px-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              >
                {PANITIA_DOC_CATEGORIES.map((kat) => (
                  <option key={kat} value={kat}>
                    {kat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
                Pemilik / Penyedia
              </label>
              <select
                value={pemilik}
                onChange={(e) => setPemilik(e.target.value)}
                aria-label="Pemilik Dokumen"
                className="w-full px-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              >
                {panitia.ahli.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">Tarikh</label>
              <input
                type="date"
                value={tarikh}
                onChange={(e) => setTarikh(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">Format</label>
              <input
                type="text"
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
              Catatan / Ringkasan Fail
            </label>
            <textarea
              rows={2}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Ringkasan kandungan fail atau evidens panitia..."
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
              Simpan Dokumen
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Lihat Dokumen */}
      <Modal
        isOpen={Boolean(previewDoc)}
        onClose={() => setPreviewDoc(null)}
        title="Pratonton Maklumat Dokumen Panitia"
        subtitle={`${panitia.nama} (${getPanitiaCode(panitia)}) · Simulasi Storan Setempat`}
        maxWidthClass="max-w-lg"
      >
        {previewDoc && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#0B0E11] border border-[#2B3139] space-y-2.5 text-xs">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-[#F0B90B]" />
                <span className="font-bold text-[#F0B90B]">{previewDoc.kategori}</span>
              </div>
              <div className="text-sm font-bold text-[#EAECEF]">{previewDoc.namaDokumen}</div>
              <div className="grid grid-cols-2 gap-2 text-[#848E9C] pt-1">
                <div>Pemilik: <span className="text-[#EAECEF]">{previewDoc.pemilik}</span></div>
                <div>Tarikh: <span className="text-[#EAECEF]">{formatShortDate(previewDoc.tarikh)}</span></div>
                <div>Format: <span className="text-[#EAECEF]">{previewDoc.format}</span></div>
                <div>Saiz: <span className="text-[#EAECEF]">{previewDoc.saiz}</span></div>
              </div>
              <div className="pt-2 border-t border-[#2B3139]">
                <div className="text-[#848E9C] mb-0.5">Catatan:</div>
                <p className="text-[#EAECEF] leading-relaxed">{previewDoc.catatan}</p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 text-xs font-medium text-[#EAECEF] bg-[#1E2329] rounded-lg"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => handleDownload(previewDoc)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#0B0E11] bg-[#F0B90B] rounded-lg hover:bg-[#F8D12F]"
              >
                <Download className="w-3.5 h-3.5" />
                Muat Turun Fail Simulasi
              </button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) handleDeleteDoc(deleteTarget.id);
        }}
        itemName={deleteTarget?.namaDokumen ?? ''}
      />
    </div>
  );
};
