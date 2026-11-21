import React, { useMemo, useState } from 'react';
import {
  Download,
  Edit3,
  Eye,
  FilePlus2,
  Files,
  Filter,
  GitBranch,
  LayoutGrid,
  List,
  RotateCcw,
  Search,
  Trash2,
} from 'lucide-react';
import {
  DocCategoryItem,
  DocCenterDocument,
  DocFolderItem,
  DocStatus,
  UserRole,
} from '../../../types/eduschool';
import {
  canUserDeleteDoc,
  canUserEditDoc,
  filterDocumentsSmart,
  getCategoryName,
  getFolderName,
  MALAY_MONTHS,
  SmartDocFilters,
} from '../../../utils/docCenterHelpers';
import { triggerLocalFileDownload } from '../../../services/documentStorageAdapter';
import { EmptyState } from '../../common/EmptyState';

interface DocManagementPanelProps {
  documents: DocCenterDocument[];
  categories: DocCategoryItem[];
  folders: DocFolderItem[];
  activeRole: UserRole;
  canAddDocument: boolean;
  filters: SmartDocFilters;
  onChangeFilters: (next: SmartDocFilters) => void;
  onResetFilters: () => void;
  onOpenAddModal: () => void;
  onOpenEditModal: (doc: DocCenterDocument) => void;
  onViewDocument: (doc: DocCenterDocument) => void;
  onRequestDeleteDocument: (doc: DocCenterDocument) => void;
  onNotify: (type: 'success' | 'info' | 'error', title: string, message?: string) => void;
}

export const DocManagementPanel: React.FC<DocManagementPanelProps> = ({
  documents,
  categories,
  folders,
  activeRole,
  canAddDocument,
  filters,
  onChangeFilters,
  onResetFilters,
  onOpenAddModal,
  onOpenEditModal,
  onViewDocument,
  onRequestDeleteDocument,
  onNotify,
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(true);

  const uniqueYears = useMemo(() => {
    const set = new Set<string>();
    documents.forEach((d) => {
      const y = (d.tarikhDokumen || d.tarikhDimuatNaik).slice(0, 4);
      if (y) set.add(y);
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [documents]);

  const uniqueFileTypes = useMemo(() => {
    const set = new Set<string>();
    documents.forEach((d) => {
      if (d.jenisFail) set.add(d.jenisFail.toUpperCase());
    });
    return Array.from(set).sort();
  }, [documents]);

  const uniqueOwners = useMemo(() => {
    const set = new Set<string>();
    documents.forEach((d) => {
      if (d.pemilik) set.add(d.pemilik);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'ms'));
  }, [documents]);

  const filteredDocs = useMemo(
    () => filterDocumentsSmart(documents, categories, filters),
    [documents, categories, filters]
  );

  const hasActiveFilters =
    filters.query.trim() !== '' ||
    filters.categoryId !== 'Semua' ||
    filters.folderId !== 'Semua' ||
    filters.status !== 'Semua' ||
    filters.tahun !== 'Semua' ||
    filters.bulan !== 'Semua' ||
    filters.jenisFail !== 'Semua' ||
    filters.pemilik !== 'Semua';

  const handleDownload = (doc: DocCenterDocument) => {
    if (doc.fileDataUrl) {
      triggerLocalFileDownload(
        doc.fileDataUrl,
        doc.namaFail || `${doc.noRujukan.replace(/\//g, '_')}.${doc.jenisFail.toLowerCase()}`
      );
      onNotify('success', 'Muat Turun Fail Bermula', doc.namaFail || doc.tajuk);
    } else {
      onNotify(
        'info',
        'Fail Contoh Simulasi',
        'Rekod contoh awal ini tidak mengandungi fail binari. Muat naik fail baharu (< 2 MB) untuk menguji muat turun fail sebenar.'
      );
    }
  };

  return (
    <div className="space-y-5">
      {/* Bar Carian Dokumen Pintar & Tindakan */}
      <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] p-4 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-[#848E9C] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filters.query}
              onChange={(e) =>
                onChangeFilters({ ...filters, query: e.target.value })
              }
              placeholder="Carian Dokumen Pintar: cari tajuk, nombor rujukan, kategori, pemilik atau keterangan..."
              aria-label="Carian Dokumen Pintar"
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-[#0B0E11] border border-[#2B3139] rounded-lg text-[#EAECEF] placeholder:text-[#848E9C] focus:outline-none focus:border-[#F0B90B]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowAdvancedFilters((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                showAdvancedFilters
                  ? 'bg-[#1E2329] text-[#F0B90B] border-[#F0B90B]/40'
                  : 'bg-[#0B0E11] text-[#EAECEF] border-[#2B3139] hover:bg-[#1E2329]'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              Penapis Pintar
            </button>

            <div className="inline-flex rounded-lg border border-[#2B3139] bg-[#0B0E11] p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                aria-label="Paparan Senarai"
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  viewMode === 'list'
                    ? 'bg-[#F0B90B] text-[#0B0E11]'
                    : 'text-[#848E9C] hover:text-[#EAECEF]'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                Senarai
              </button>
              <button
                type="button"
                onClick={() => setViewMode('card')}
                aria-label="Paparan Kad"
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  viewMode === 'card'
                    ? 'bg-[#F0B90B] text-[#0B0E11]'
                    : 'text-[#848E9C] hover:text-[#EAECEF]'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Kad
              </button>
            </div>

            {canAddDocument && (
              <button
                type="button"
                onClick={onOpenAddModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#0B0E11] bg-[#F0B90B] rounded-lg hover:bg-[#F8D12F] whitespace-nowrap"
              >
                <FilePlus2 className="w-4 h-4" />
                Tambah Dokumen
              </button>
            )}
          </div>
        </div>

        {/* Penapis Pelbagai Kriteria */}
        {showAdvancedFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-2.5 pt-3 border-t border-[#2B3139]">
            <select
              value={filters.categoryId}
              onChange={(e) =>
                onChangeFilters({ ...filters, categoryId: e.target.value })
              }
              aria-label="Tapis Kategori"
              className="px-2.5 py-2 text-xs bg-[#0B0E11] border border-[#2B3139] rounded-lg text-[#EAECEF] focus:outline-none focus:border-[#F0B90B]"
            >
              <option value="Semua">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nama}
                </option>
              ))}
            </select>

            <select
              value={filters.folderId}
              onChange={(e) =>
                onChangeFilters({ ...filters, folderId: e.target.value })
              }
              aria-label="Tapis Folder"
              className="px-2.5 py-2 text-xs bg-[#0B0E11] border border-[#2B3139] rounded-lg text-[#EAECEF] focus:outline-none focus:border-[#F0B90B]"
            >
              <option value="Semua">Semua Folder</option>
              <option value="umum">Kategori Umum (Tanpa Folder)</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nama}
                </option>
              ))}
            </select>

            <select
              value={filters.status}
              onChange={(e) =>
                onChangeFilters({
                  ...filters,
                  status: e.target.value as 'Semua' | DocStatus,
                })
              }
              aria-label="Tapis Status"
              className="px-2.5 py-2 text-xs bg-[#0B0E11] border border-[#2B3139] rounded-lg text-[#EAECEF] focus:outline-none focus:border-[#F0B90B]"
            >
              <option value="Semua">Semua Status</option>
              <option value="Aktif">Aktif</option>
              <option value="Menunggu Pengesahan">Menunggu Pengesahan</option>
              <option value="Draf">Draf</option>
              <option value="Arkib">Arkib</option>
            </select>

            <select
              value={filters.tahun}
              onChange={(e) =>
                onChangeFilters({ ...filters, tahun: e.target.value })
              }
              aria-label="Tapis Tahun"
              className="px-2.5 py-2 text-xs bg-[#0B0E11] border border-[#2B3139] rounded-lg text-[#EAECEF] focus:outline-none focus:border-[#F0B90B]"
            >
              <option value="Semua">Semua Tahun</option>
              {uniqueYears.map((yr) => (
                <option key={yr} value={yr}>
                  Tahun {yr}
                </option>
              ))}
            </select>

            <select
              value={filters.bulan}
              onChange={(e) =>
                onChangeFilters({ ...filters, bulan: e.target.value })
              }
              aria-label="Tapis Bulan"
              className="px-2.5 py-2 text-xs bg-[#0B0E11] border border-[#2B3139] rounded-lg text-[#EAECEF] focus:outline-none focus:border-[#F0B90B]"
            >
              <option value="Semua">Semua Bulan</option>
              {MALAY_MONTHS.map((m) => (
                <option key={m.code} value={m.code}>
                  {m.label}
                </option>
              ))}
            </select>

            <select
              value={filters.jenisFail}
              onChange={(e) =>
                onChangeFilters({ ...filters, jenisFail: e.target.value })
              }
              aria-label="Tapis Jenis Fail"
              className="px-2.5 py-2 text-xs bg-[#0B0E11] border border-[#2B3139] rounded-lg text-[#EAECEF] focus:outline-none focus:border-[#F0B90B]"
            >
              <option value="Semua">Semua Jenis Fail</option>
              {uniqueFileTypes.map((ft) => (
                <option key={ft} value={ft}>
                  {ft}
                </option>
              ))}
            </select>

            <select
              value={filters.pemilik}
              onChange={(e) =>
                onChangeFilters({ ...filters, pemilik: e.target.value })
              }
              aria-label="Tapis Pemilik"
              className="px-2.5 py-2 text-xs bg-[#0B0E11] border border-[#2B3139] rounded-lg text-[#EAECEF] focus:outline-none focus:border-[#F0B90B]"
            >
              <option value="Semua">Semua Pemilik</option>
              {uniqueOwners.map((owner) => (
                <option key={owner} value={owner}>
                  {owner}
                </option>
              ))}
            </select>

            <select
              value={filters.sortBy}
              onChange={(e) =>
                onChangeFilters({
                  ...filters,
                  sortBy: e.target.value as SmartDocFilters['sortBy'],
                })
              }
              aria-label="Susunan Dokumen"
              className="px-2.5 py-2 text-xs bg-[#0B0E11] border border-[#2B3139] rounded-lg text-[#EAECEF] focus:outline-none focus:border-[#F0B90B]"
            >
              <option value="tarikh_terbaharu">Susun: Terkini</option>
              <option value="tarikh_terdahulu">Susun: Terdahulu</option>
              <option value="nama_az">Susun: Nama A - Z</option>
              <option value="nama_za">Susun: Nama Z - A</option>
            </select>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#848E9C]">
          <span>
            Memaparkan <strong className="text-[#EAECEF]">{filteredDocs.length}</strong> daripada{' '}
            <strong className="text-[#EAECEF]">{documents.length}</strong> dokumen berdaftar
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#F0B90B] hover:underline"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Set Semula Penapis
            </button>
          )}
        </div>
      </div>

      {/* Senarai atau Paparan Kad */}
      {filteredDocs.length === 0 ? (
        <EmptyState
          icon={Files}
          title="Tiada Dokumen Sepadan Ditemui"
          description="Cuba ubah kata kunci carian atau tetapkan semula penapis kategori, folder, tahun atau status."
          actionLabel={hasActiveFilters ? 'Set Semula Carian & Penapis' : undefined}
          onAction={hasActiveFilters ? onResetFilters : undefined}
        />
      ) : viewMode === 'list' ? (
        <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[920px]">
              <thead>
                <tr className="border-b border-[#2B3139] bg-[#12161B] text-[11px] font-bold uppercase tracking-wider text-[#848E9C]">
                  <th className="py-3 px-4">No. Rujukan</th>
                  <th className="py-3 px-4">Tajuk & Penerangan</th>
                  <th className="py-3 px-4">Kategori & Folder</th>
                  <th className="py-3 px-4">Fail & Versi</th>
                  <th className="py-3 px-4">Pemilik</th>
                  <th className="py-3 px-4">Tarikh</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2B3139] text-xs">
                {filteredDocs.map((doc) => {
                  const allowEdit = canUserEditDoc(doc, activeRole);
                  const allowDelete = canUserDeleteDoc(doc, activeRole);
                  return (
                    <tr
                      key={doc.id}
                      className="hover:bg-[#1E2329]/60 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-[#F0B90B] whitespace-nowrap">
                        {doc.noRujukan}
                      </td>
                      <td className="py-3.5 px-4 max-w-[280px]">
                        <button
                          type="button"
                          onClick={() => onViewDocument(doc)}
                          className="text-left font-bold text-[#EAECEF] hover:text-[#F0B90B] transition-colors line-clamp-1"
                        >
                          {doc.tajuk}
                        </button>
                        <div className="text-[11px] text-[#848E9C] line-clamp-1 mt-0.5">
                          {doc.penerangan}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#EAECEF]">
                          {getCategoryName(categories, doc.categoryId)}
                        </div>
                        <div className="text-[11px] text-[#848E9C] mt-0.5">
                          {getFolderName(folders, doc.folderId)}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono font-semibold text-[#EAECEF]">
                          {doc.jenisFail} · {doc.saiz}
                        </div>
                        <div className="inline-flex items-center gap-1 text-[11px] text-[#F0B90B] mt-0.5">
                          <GitBranch className="w-3 h-3" />
                          {doc.versiSemasa} ({doc.versions.length} rekod)
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-[#EAECEF] whitespace-nowrap">
                        {doc.pemilik}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[#848E9C] whitespace-nowrap">
                        <div>{doc.tarikhDokumen}</div>
                        <div className="text-[10px]">Muat naik: {doc.tarikhDimuatNaik}</div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
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
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onViewDocument(doc)}
                            title="Lihat Butiran & Sejarah Versi"
                            className="p-1.5 rounded-lg bg-[#1E2329] border border-[#2B3139] text-[#EAECEF] hover:border-[#F0B90B] hover:text-[#F0B90B]"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownload(doc)}
                            title={
                              doc.fileDataUrl
                                ? 'Muat Turun Fail Setempat'
                                : 'Maklumat Fail Simulasi'
                            }
                            className={`p-1.5 rounded-lg border ${
                              doc.fileDataUrl
                                ? 'bg-[#0ECB81]/15 border-[#0ECB81]/30 text-[#0ECB81] hover:bg-[#0ECB81]/25'
                                : 'bg-[#1E2329] border-[#2B3139] text-[#848E9C] hover:text-[#EAECEF]'
                            }`}
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          {allowEdit && (
                            <button
                              type="button"
                              onClick={() => onOpenEditModal(doc)}
                              title="Sunting Dokumen / Muat Naik Versi"
                              className="p-1.5 rounded-lg bg-[#1E2329] border border-[#2B3139] text-[#F0B90B] hover:bg-[#2B3139]"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {allowDelete && (
                            <button
                              type="button"
                              onClick={() => onRequestDeleteDocument(doc)}
                              title="Padam Dokumen"
                              className="p-1.5 rounded-lg bg-[#F6465D]/10 border border-[#F6465D]/30 text-[#F6465D] hover:bg-[#F6465D]/20"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredDocs.map((doc) => {
            const allowEdit = canUserEditDoc(doc, activeRole);
            const allowDelete = canUserDeleteDoc(doc, activeRole);
            return (
              <div
                key={doc.id}
                className="bg-[#161A1E] rounded-xl border border-[#2B3139] hover:border-[#F0B90B]/50 p-4 flex flex-col justify-between gap-4 transition-colors"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono font-bold text-[#F0B90B]">
                      {doc.noRujukan}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded font-bold text-[10px] ${
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
                  </div>

                  <button
                    type="button"
                    onClick={() => onViewDocument(doc)}
                    className="text-left text-sm font-extrabold text-[#EAECEF] hover:text-[#F0B90B] leading-snug line-clamp-2"
                  >
                    {doc.tajuk}
                  </button>

                  <p className="text-xs text-[#848E9C] line-clamp-2 leading-relaxed">
                    {doc.penerangan}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#0B0E11] border border-[#2B3139] text-[#EAECEF]">
                      {getCategoryName(categories, doc.categoryId)}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#0B0E11] border border-[#2B3139] text-[#38BDF8]">
                      {getFolderName(folders, doc.folderId)}
                    </span>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#0B0E11] border border-[#2B3139] text-[#F0B90B]">
                      {doc.jenisFail} · {doc.saiz} · {doc.versiSemasa}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#2B3139] space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] text-[#848E9C]">
                    <span className="truncate">{doc.pemilik}</span>
                    <span className="font-mono shrink-0">{doc.tarikhDokumen}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onViewDocument(doc)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F0B90B] hover:underline"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Lihat & Versi
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleDownload(doc)}
                        aria-label="Muat turun dokumen"
                        className="p-1.5 rounded-lg bg-[#1E2329] border border-[#2B3139] text-[#0ECB81] hover:bg-[#2B3139]"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      {allowEdit && (
                        <button
                          type="button"
                          onClick={() => onOpenEditModal(doc)}
                          aria-label="Sunting dokumen"
                          className="p-1.5 rounded-lg bg-[#1E2329] border border-[#2B3139] text-[#F0B90B] hover:bg-[#2B3139]"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {allowDelete && (
                        <button
                          type="button"
                          onClick={() => onRequestDeleteDocument(doc)}
                          aria-label="Padam dokumen"
                          className="p-1.5 rounded-lg bg-[#F6465D]/10 border border-[#F6465D]/30 text-[#F6465D] hover:bg-[#F6465D]/20"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
