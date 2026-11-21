import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Download,
  Edit3,
  FilePlus2,
  Files,
  FolderOpen,
  FolderPlus,
  Search,
  Trash2,
} from 'lucide-react';
import {
  DocCategoryItem,
  DocCenterDocument,
  DocFolderItem,
} from '../../../types/eduschool';
import { getCategoryName } from '../../../utils/docCenterHelpers';
import {
  createZipBlob,
  dataUrlToUint8Array,
  utf8ToBytes,
  ZipEntryInput,
} from '../../../utils/zipBuilder';
import { Modal } from '../../common/Modal';
import { EmptyState } from '../../common/EmptyState';

interface DocFolderPanelProps {
  folders: DocFolderItem[];
  categories: DocCategoryItem[];
  documents: DocCenterDocument[];
  currentUserName: string;
  canManageFolders: boolean;
  canAddDocument: boolean;
  selectedFolderId: string | null;
  onSelectFolderId: (folderId: string | null) => void;
  onAddFolder: (payload: Omit<DocFolderItem, 'id'>) => void;
  onUpdateFolder: (updated: DocFolderItem) => void;
  onDeleteFolderWithRelocation: (folderId: string, targetFolderId: string) => void;
  onAddDocumentToFolder: (folderId: string, categoryId: string) => void;
  onViewDocument: (doc: DocCenterDocument) => void;
  onNotify: (type: 'success' | 'info' | 'error', title: string, message?: string) => void;
}

export const DocFolderPanel: React.FC<DocFolderPanelProps> = ({
  folders,
  categories,
  documents,
  currentUserName,
  canManageFolders,
  canAddDocument,
  selectedFolderId,
  onSelectFolderId,
  onAddFolder,
  onUpdateFolder,
  onDeleteFolderWithRelocation,
  onAddDocumentToFolder,
  onViewDocument,
  onNotify,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Semua');

  // State Modal Tambah/Sunting Folder
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<DocFolderItem | null>(null);
  const [nama, setNama] = useState('');
  const [induk, setInduk] = useState('DOKUMENTASI SEKOLAH');
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? 'cat-pengurusan');
  const [penerangan, setPenerangan] = useState('');
  const [formError, setFormError] = useState('');

  // State Modal Padam Folder Selamat (dengan pemindahan dokumen)
  const [deleteTarget, setDeleteTarget] = useState<DocFolderItem | null>(null);
  const [relocateTargetId, setRelocateTargetId] = useState<string>('umum');

  const filteredFolders = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return folders.filter((f) => {
      if (categoryFilter !== 'Semua' && f.categoryId !== categoryFilter) return false;
      if (!q) return true;
      return (
        f.nama.toLowerCase().includes(q) ||
        f.induk.toLowerCase().includes(q) ||
        f.penerangan.toLowerCase().includes(q)
      );
    });
  }, [folders, searchTerm, categoryFilter]);

  const activeFolder = useMemo(
    () => folders.find((f) => f.id === selectedFolderId) ?? null,
    [folders, selectedFolderId]
  );

  const docsInsideActiveFolder = useMemo(() => {
    if (!activeFolder) return [];
    return documents
      .filter((d) => d.folderId === activeFolder.id)
      .sort((a, b) => b.tarikhDimuatNaik.localeCompare(a.tarikhDimuatNaik));
  }, [activeFolder, documents]);

  const docsWithoutFolder = useMemo(
    () => documents.filter((d) => !d.folderId || d.folderId === 'umum'),
    [documents]
  );

  const openCreateModal = () => {
    setEditingFolder(null);
    setNama('');
    setInduk('DOKUMENTASI SEKOLAH');
    setCategoryId(categories[0]?.id ?? 'cat-pengurusan');
    setPenerangan('');
    setFormError('');
    setIsFormOpen(true);
  };

  const openEditModal = (folder: DocFolderItem) => {
    setEditingFolder(folder);
    setNama(folder.nama);
    setInduk(folder.induk);
    setCategoryId(folder.categoryId);
    setPenerangan(folder.penerangan);
    setFormError('');
    setIsFormOpen(true);
  };

  const handleSaveFolder = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = nama.trim();
    if (!cleanName) {
      setFormError('Nama folder wajib diisi.');
      return;
    }
    const dup = folders.some(
      (f) =>
        f.nama.toLowerCase() === cleanName.toLowerCase() &&
        f.id !== editingFolder?.id
    );
    if (dup) {
      setFormError('Nama folder ini sudah wujud.');
      return;
    }

    if (editingFolder) {
      onUpdateFolder({
        ...editingFolder,
        nama: cleanName,
        induk: induk.trim() || 'DOKUMENTASI SEKOLAH',
        categoryId,
        penerangan: penerangan.trim() || 'Folder simpanan dokumen sekolah.',
      });
    } else {
      onAddFolder({
        nama: cleanName,
        induk: induk.trim() || 'DOKUMENTASI SEKOLAH',
        categoryId,
        penerangan: penerangan.trim() || 'Folder simpanan dokumen rasmi sekolah.',
        tarikhDicipta: new Date().toISOString().slice(0, 10),
        pencipta: currentUserName,
      });
    }
    setIsFormOpen(false);
  };

  const openDeleteModal = (folder: DocFolderItem) => {
    setDeleteTarget(folder);
    setRelocateTargetId('umum');
  };

  const confirmSafeDelete = () => {
    if (!deleteTarget) return;
    onDeleteFolderWithRelocation(deleteTarget.id, relocateTargetId);
    if (selectedFolderId === deleteTarget.id) {
      onSelectFolderId(null);
    }
    setDeleteTarget(null);
  };

  const docsInDeleteTarget = useMemo(() => {
    if (!deleteTarget) return [];
    return documents.filter((d) => d.folderId === deleteTarget.id);
  }, [deleteTarget, documents]);

  // Paparan dalam folder yang dibuka
  if (activeFolder) {
    return (
      <div className="space-y-5">
        <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <button
              type="button"
              onClick={() => onSelectFolderId(null)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#F0B90B] hover:underline mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Kembali ke Senarai Folder Digital
            </button>
            <div className="flex items-center gap-2.5 flex-wrap">
              <FolderOpen className="w-5 h-5 text-[#F0B90B] shrink-0" />
              <h2 className="text-lg font-extrabold text-[#EAECEF]">
                {activeFolder.induk} / {activeFolder.nama}
              </h2>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#1E2329] border border-[#2B3139] text-[#EAECEF]">
                {getCategoryName(categories, activeFolder.categoryId)}
              </span>
            </div>
            <p className="text-xs text-[#848E9C]">{activeFolder.penerangan}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {docsInsideActiveFolder.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const safeFolderSlug = activeFolder.nama
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '_');
                  const entries: ZipEntryInput[] = [];
                  const manifestLines = [
                    'No Rujukan,Tajuk Dokumen,Kategori,Jenis Fail,Saiz,Pemilik,Tarikh Dokumen,Status,Versi Semasa,Mod Storan',
                  ];

                  docsInsideActiveFolder.forEach((doc, idx) => {
                    const esc = (v: string) => `"${String(v ?? '').replace(/"/g, '""')}"`;
                    manifestLines.push(
                      [
                        esc(doc.noRujukan),
                        esc(doc.tajuk),
                        esc(getCategoryName(categories, doc.categoryId)),
                        esc(doc.jenisFail),
                        esc(doc.saiz),
                        esc(doc.pemilik),
                        esc(doc.tarikhDokumen),
                        esc(doc.status),
                        esc(doc.versiSemasa),
                        esc(
                          doc.fileDataUrl
                            ? 'Fail Lampiran Setempat'
                            : 'Rekod Metadata Simulasi'
                        ),
                      ].join(',')
                    );

                    const decoded = doc.fileDataUrl
                      ? dataUrlToUint8Array(doc.fileDataUrl)
                      : null;
                    if (decoded) {
                      const cleanName = (
                        doc.namaFail ||
                        `${doc.noRujukan.replace(/\//g, '_')}.${doc.jenisFail.toLowerCase()}`
                      ).replace(/[^a-zA-Z0-9._-]+/g, '_');
                      entries.push({
                        name: `${String(idx + 1).padStart(2, '0')}_${cleanName}`,
                        data: decoded,
                      });
                    } else {
                      const slipText = [
                        `NO. RUJUKAN : ${doc.noRujukan}`,
                        `TAJUK       : ${doc.tajuk}`,
                        `KATEGORI    : ${getCategoryName(categories, doc.categoryId)}`,
                        `PEMILIK     : ${doc.pemilik}`,
                        `TARIKH      : ${doc.tarikhDokumen}`,
                        `STATUS      : ${doc.status} (${doc.versiSemasa})`,
                        `PENERANGAN  : ${doc.penerangan}`,
                        `CATATAN     : ${doc.catatan || '-'}`,
                        `NOTA        : Rekod ini ialah metadata contoh simulasi tanpa fail lampiran binari.`,
                      ].join('\n');
                      entries.push({
                        name: `${String(idx + 1).padStart(2, '0')}_${doc.noRujukan.replace(/[^a-zA-Z0-9_-]+/g, '_')}_RINGKASAN.txt`,
                        data: utf8ToBytes(slipText),
                      });
                    }
                  });

                  entries.unshift({
                    name: `00_INDEKS_DOKUMEN_${safeFolderSlug}.csv`,
                    data: utf8ToBytes('\uFEFF' + manifestLines.join('\n')),
                  });

                  const zipBlob = createZipBlob(entries);
                  const url = URL.createObjectURL(zipBlob);
                  const a = document.createElement('a');
                  const fileName = `Folder_${safeFolderSlug}_${new Date().toISOString().slice(0, 10)}.zip`;
                  a.href = url;
                  a.download = fileName;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  setTimeout(() => URL.revokeObjectURL(url), 1000);
                  onNotify(
                    'success',
                    'Muat Turun Pukal Folder (.ZIP) Berjaya',
                    `Arkib ${fileName} (${docsInsideActiveFolder.length} dokumen + indeks CSV) telah dimuat turun.`
                  );
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-[#0B0E11] bg-[#0ECB81] rounded-lg hover:bg-[#14E093] whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" />
                Muat Turun Pukal (.ZIP)
              </button>
            )}
            {canManageFolders && (
              <button
                type="button"
                onClick={() => openEditModal(activeFolder)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#EAECEF] bg-[#1E2329] border border-[#2B3139] rounded-lg hover:bg-[#2B3139]"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#F0B90B]" />
                Sunting Folder
              </button>
            )}
            {canAddDocument && (
              <button
                type="button"
                onClick={() =>
                  onAddDocumentToFolder(activeFolder.id, activeFolder.categoryId)
                }
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#0B0E11] bg-[#F0B90B] rounded-lg hover:bg-[#F8D12F]"
              >
                <FilePlus2 className="w-4 h-4" />
                Tambah Dokumen ke Folder Ini
              </button>
            )}
          </div>
        </div>

        {docsInsideActiveFolder.length === 0 ? (
          <EmptyState
            icon={Files}
            title="Folder Ini Belum Mempunyai Dokumen"
            description="Muat naik atau pindahkan dokumen rasmi sekolah ke dalam folder ini untuk akses pantas."
            actionLabel={canAddDocument ? 'Tambah Dokumen Sekarang' : undefined}
            onAction={
              canAddDocument
                ? () =>
                    onAddDocumentToFolder(activeFolder.id, activeFolder.categoryId)
                : undefined
            }
          />
        ) : (
          <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[680px]">
                <thead>
                  <tr className="border-b border-[#2B3139] bg-[#12161B] text-[11px] font-bold uppercase tracking-wider text-[#848E9C]">
                    <th className="py-3 px-4">No. Rujukan</th>
                    <th className="py-3 px-4">Tajuk Dokumen</th>
                    <th className="py-3 px-4">Fail & Versi</th>
                    <th className="py-3 px-4">Pemilik</th>
                    <th className="py-3 px-4">Tarikh</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2B3139] text-xs">
                  {docsInsideActiveFolder.map((doc) => (
                    <tr
                      key={doc.id}
                      onClick={() => onViewDocument(doc)}
                      className="hover:bg-[#1E2329]/70 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-[#F0B90B]">
                        {doc.noRujukan}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#EAECEF]">{doc.tajuk}</div>
                        <div className="text-[11px] text-[#848E9C] line-clamp-1 mt-0.5">
                          {doc.penerangan}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-[#EAECEF]">
                        {doc.jenisFail} · {doc.saiz} ({doc.versiSemasa})
                      </td>
                      <td className="py-3 px-4 text-[#EAECEF]">{doc.pemilik}</td>
                      <td className="py-3 px-4 font-mono text-[#848E9C]">
                        {doc.tarikhDokumen}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded font-bold text-[11px] ${
                            doc.status === 'Aktif'
                              ? 'bg-[#0ECB81]/15 text-[#0ECB81]'
                              : doc.status === 'Menunggu Pengesahan'
                                ? 'bg-[#38BDF8]/15 text-[#38BDF8]'
                                : doc.status === 'Draf'
                                  ? 'bg-[#F0B90B]/15 text-[#F0B90B]'
                                  : 'bg-[#2B3139] text-[#848E9C]'
                          }`}
                        >
                          {doc.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Bar Kawalan Folder */}
      <div className="bg-[#161A1E] p-4 rounded-xl border border-[#2B3139] flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-[#EAECEF] flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-[#F0B90B]" />
            Struktur Folder Digital · DOKUMENTASI SEKOLAH ({folders.length})
          </h2>
          <p className="text-xs text-[#848E9C] mt-0.5">
            Klik mana-mana folder untuk melihat fail di dalamnya atau pindahkan dokumen apabila memadam folder.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#848E9C] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama folder..."
              className="pl-8 pr-3 py-2 text-xs bg-[#0B0E11] border border-[#2B3139] rounded-lg text-[#EAECEF] focus:outline-none focus:border-[#F0B90B]"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Tapis folder mengikut kategori"
            className="px-3 py-2 text-xs bg-[#0B0E11] border border-[#2B3139] rounded-lg text-[#EAECEF] focus:outline-none focus:border-[#F0B90B]"
          >
            <option value="Semua">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nama}
              </option>
            ))}
          </select>
          {canManageFolders && (
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#0B0E11] bg-[#F0B90B] rounded-lg hover:bg-[#F8D12F] whitespace-nowrap"
            >
              <FolderPlus className="w-4 h-4" />
              Cipta Folder
            </button>
          )}
        </div>
      </div>

      {docsWithoutFolder.length > 0 && (
        <div className="px-4 py-3 rounded-xl bg-[#161A1E] border border-[#2B3139] text-xs flex items-center justify-between gap-2">
          <span className="text-[#848E9C]">
            Terdapat <strong className="text-[#F0B90B]">{docsWithoutFolder.length} dokumen</strong> berada di bawah{' '}
            <strong className="text-[#EAECEF]">Kategori Umum (Tanpa Folder)</strong>.
          </span>
        </div>
      )}

      {/* Grid Folder */}
      {filteredFolders.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="Tiada Folder Digital Ditemui"
          description="Tiada folder sepadan dengan kata kunci atau kategori yang dipilih."
          actionLabel="Set Semula Carian"
          onAction={() => {
            setSearchTerm('');
            setCategoryFilter('Semua');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredFolders.map((folder) => {
            const count = documents.filter((d) => d.folderId === folder.id).length;
            return (
              <div
                key={folder.id}
                className="bg-[#161A1E] rounded-xl border border-[#2B3139] hover:border-[#F0B90B]/60 p-4 flex flex-col justify-between gap-4 transition-colors"
              >
                <div
                  onClick={() => onSelectFolderId(folder.id)}
                  className="cursor-pointer group space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-[#F0B90B]/15 text-[#F0B90B] flex items-center justify-center shrink-0">
                        <FolderOpen className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-[#848E9C] truncate">
                          {folder.induk}
                        </div>
                        <h3 className="text-sm font-extrabold text-[#EAECEF] group-hover:text-[#F0B90B] transition-colors truncate">
                          {folder.nama}
                        </h3>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#0B0E11] border border-[#2B3139] text-[#F0B90B] shrink-0">
                      {count} fail
                    </span>
                  </div>
                  <p className="text-xs text-[#848E9C] leading-relaxed line-clamp-2">
                    {folder.penerangan}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#2B3139] space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] text-[#848E9C]">
                    <span className="truncate">
                      Kategori:{' '}
                      <strong className="text-[#EAECEF]">
                        {getCategoryName(categories, folder.categoryId)}
                      </strong>
                    </span>
                    <span className="font-mono shrink-0">{folder.tarikhDicipta}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectFolderId(folder.id)}
                      className="text-xs font-bold text-[#F0B90B] hover:underline"
                    >
                      Buka Folder
                    </button>

                    {canManageFolders && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(folder)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#EAECEF] bg-[#1E2329] border border-[#2B3139] rounded-lg hover:bg-[#2B3139]"
                        >
                          <Edit3 className="w-3 h-3 text-[#F0B90B]" />
                          Sunting
                        </button>
                        <button
                          type="button"
                          onClick={() => openDeleteModal(folder)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#F6465D] bg-[#F6465D]/10 border border-[#F6465D]/30 rounded-lg hover:bg-[#F6465D]/20"
                        >
                          <Trash2 className="w-3 h-3" />
                          Padam
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Cipta / Sunting Folder */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingFolder ? 'Sunting Folder Digital' : 'Cipta Folder Digital Baharu'}
        subtitle="Susun fail sekolah di bawah struktur DOKUMENTASI SEKOLAH."
      >
        <form onSubmit={handleSaveFolder} className="space-y-4">
          {formError && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-[#F6465D]/15 border border-[#F6465D]/30 text-xs text-[#F6465D]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#EAECEF] mb-1.5">
              Nama Folder *
            </label>
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Contoh: BENGKEL & SEMINAR SPM"
              className="w-full px-3.5 py-2.5 text-sm bg-[#0B0E11] border border-[#2B3139] rounded-lg text-[#EAECEF] focus:outline-none focus:border-[#F0B90B]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#EAECEF] mb-1.5">
                Folder Induk
              </label>
              <input
                type="text"
                value={induk}
                onChange={(e) => setInduk(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-[#0B0E11] border border-[#2B3139] rounded-lg text-[#EAECEF] focus:outline-none focus:border-[#F0B90B]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#EAECEF] mb-1.5">
                Kategori Utama
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-[#0B0E11] border border-[#2B3139] rounded-lg text-[#EAECEF] focus:outline-none focus:border-[#F0B90B]"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nama}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#EAECEF] mb-1.5">
              Keterangan Folder
            </label>
            <textarea
              rows={3}
              value={penerangan}
              onChange={(e) => setPenerangan(e.target.value)}
              placeholder="Nyatakan jenis dokumen yang disimpan dalam folder ini..."
              className="w-full px-3.5 py-2.5 text-sm bg-[#0B0E11] border border-[#2B3139] rounded-lg text-[#EAECEF] focus:outline-none focus:border-[#F0B90B]"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-[#EAECEF] bg-[#1E2329] border border-[#2B3139] rounded-lg hover:bg-[#2B3139]"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-[#0B0E11] bg-[#F0B90B] rounded-lg hover:bg-[#F8D12F]"
            >
              {editingFolder ? 'Simpan Perubahan' : 'Cipta Folder'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Padam Folder Selamat (Pindah Dokumen Jika Ada) */}
      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Sahkan Pemadaman Folder Digital"
        subtitle={
          deleteTarget
            ? `${deleteTarget.induk} / ${deleteTarget.nama}`
            : undefined
        }
        maxWidthClass="max-w-md"
      >
        {deleteTarget && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3.5 rounded-lg bg-[#F6465D]/10 border border-[#F6465D]/30">
              <AlertTriangle className="w-5 h-5 text-[#F6465D] shrink-0 mt-0.5" />
              <div className="text-xs text-[#EAECEF] space-y-1 leading-relaxed">
                <p className="font-bold text-white">
                  {docsInDeleteTarget.length > 0
                    ? `Folder ini mengandungi ${docsInDeleteTarget.length} dokumen!`
                    : 'Folder ini kosong dan selamat untuk dipadam.'}
                </p>
                <p className="text-[#848E9C]">
                  {docsInDeleteTarget.length > 0
                    ? 'Bagi mengelakkan sebarang kehilangan rekod, semua dokumen di dalam folder ini akan dipindahkan ke destinasi pilihan anda di bawah.'
                    : 'Tiada dokumen terjejas apabila folder ini dipadam.'}
                </p>
              </div>
            </div>

            {docsInDeleteTarget.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-[#EAECEF] mb-1.5">
                  Pindahkan {docsInDeleteTarget.length} Dokumen ke:
                </label>
                <select
                  value={relocateTargetId}
                  onChange={(e) => setRelocateTargetId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-[#0B0E11] border border-[#2B3139] rounded-lg text-[#EAECEF] focus:outline-none focus:border-[#F0B90B]"
                >
                  <option value="umum">Kategori Umum (Tanpa Folder)</option>
                  {folders
                    .filter((f) => f.id !== deleteTarget.id)
                    .map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.induk} / {f.nama}
                      </option>
                    ))}
                </select>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-xs font-semibold text-[#EAECEF] bg-[#1E2329] border border-[#2B3139] rounded-lg hover:bg-[#2B3139]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmSafeDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-[#F6465D] rounded-lg hover:bg-[#E03B52]"
              >
                {docsInDeleteTarget.length > 0
                  ? 'Pindah Dokumen & Padam Folder'
                  : 'Ya, Padam Folder'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
