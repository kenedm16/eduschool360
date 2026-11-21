import React, { useState } from 'react';
import {
  AlertCircle,
  Edit3,
  Files,
  FolderOpen,
  Plus,
  ShieldAlert,
  Tags,
  Trash2,
} from 'lucide-react';
import {
  DocCategoryItem,
  DocCenterDocument,
  DocFolderItem,
} from '../../../types/eduschool';
import { ConfirmDeleteModal, Modal } from '../../common/Modal';

interface DocCategoryPanelProps {
  categories: DocCategoryItem[];
  documents: DocCenterDocument[];
  folders: DocFolderItem[];
  canManageCategories: boolean;
  onAddCategory: (payload: Omit<DocCategoryItem, 'id'>) => void;
  onUpdateCategory: (updated: DocCategoryItem) => void;
  onDeleteCategory: (id: string) => void;
  onFilterByCategory: (categoryId: string) => void;
  onNotify: (type: 'success' | 'info' | 'error', title: string, message?: string) => void;
}

export const DocCategoryPanel: React.FC<DocCategoryPanelProps> = ({
  categories,
  documents,
  folders,
  canManageCategories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onFilterByCategory,
  onNotify,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<DocCategoryItem | null>(null);
  const [nama, setNama] = useState('');
  const [penerangan, setPenerangan] = useState('');
  const [formError, setFormError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<DocCategoryItem | null>(null);

  const openAddModal = () => {
    setEditingCategory(null);
    setNama('');
    setPenerangan('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (cat: DocCategoryItem) => {
    setEditingCategory(cat);
    setNama(cat.nama);
    setPenerangan(cat.penerangan);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = nama.trim();
    if (!cleanName) {
      setFormError('Nama kategori wajib diisi.');
      return;
    }
    const duplicate = categories.some(
      (c) =>
        c.nama.toLowerCase() === cleanName.toLowerCase() &&
        c.id !== editingCategory?.id
    );
    if (duplicate) {
      setFormError('Nama kategori ini sudah wujud dalam senarai.');
      return;
    }

    if (editingCategory) {
      onUpdateCategory({
        ...editingCategory,
        nama: cleanName,
        penerangan: penerangan.trim() || 'Kategori dokumen rasmi sekolah.',
      });
    } else {
      onAddCategory({
        nama: cleanName,
        penerangan: penerangan.trim() || 'Kategori dokumen tambahan sekolah.',
        lalai: false,
      });
    }
    setIsModalOpen(false);
  };

  const handleTryDelete = (cat: DocCategoryItem) => {
    const docCount = documents.filter((d) => d.categoryId === cat.id).length;
    const folderCount = folders.filter((f) => f.categoryId === cat.id).length;

    if (docCount > 0 || folderCount > 0) {
      onNotify(
        'error',
        'Kategori Tidak Boleh Dipadam',
        `Kategori "${cat.nama}" sedang digunakan oleh ${docCount} dokumen dan ${folderCount} folder. Pindahkan rekod berkaitan terlebih dahulu.`
      );
      return;
    }

    setDeleteTarget(cat);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#161A1E] p-4 rounded-xl border border-[#2B3139]">
        <div>
          <h2 className="text-base font-bold text-[#EAECEF] flex items-center gap-2">
            <Tags className="w-4 h-4 text-[#F0B90B]" />
            Pengurusan Kategori Dokumen ({categories.length})
          </h2>
          <p className="text-xs text-[#848E9C] mt-0.5">
            Kategori yang sedang digunakan oleh dokumen atau folder tidak boleh dipadam demi keselamatan integriti fail.
          </p>
        </div>

        {canManageCategories ? (
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-[#0B0E11] bg-[#F0B90B] rounded-lg hover:bg-[#F8D12F] transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            Tambah Kategori
          </button>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs text-[#848E9C] bg-[#0B0E11] border border-[#2B3139] px-3 py-1.5 rounded-lg">
            <ShieldAlert className="w-3.5 h-3.5 text-[#F0B90B]" />
            Hanya pentadbir boleh menambah/menyunting kategori
          </span>
        )}
      </div>

      {/* Grid Kategori */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {categories.map((cat) => {
          const docCount = documents.filter((d) => d.categoryId === cat.id).length;
          const folderCount = folders.filter((f) => f.categoryId === cat.id).length;
          const inUse = docCount > 0 || folderCount > 0;

          return (
            <div
              key={cat.id}
              className="bg-[#161A1E] rounded-xl border border-[#2B3139] p-4 flex flex-col justify-between gap-4 hover:border-[#3A414C] transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-bold text-[#EAECEF] leading-snug">
                    {cat.nama}
                  </h3>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${
                      cat.lalai
                        ? 'bg-[#1E2329] text-[#848E9C] border border-[#2B3139]'
                        : 'bg-[#F0B90B]/15 text-[#F0B90B]'
                    }`}
                  >
                    {cat.lalai ? 'Lalai Sistem' : 'Tambahan'}
                  </span>
                </div>
                <p className="text-xs text-[#848E9C] mt-2 leading-relaxed">
                  {cat.penerangan}
                </p>
              </div>

              <div className="space-y-3 pt-3 border-t border-[#2B3139]">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3 text-[#EAECEF]">
                    <span className="inline-flex items-center gap-1 font-mono font-semibold">
                      <Files className="w-3.5 h-3.5 text-[#F0B90B]" />
                      {docCount} Dokumen
                    </span>
                    <span className="inline-flex items-center gap-1 font-mono font-semibold">
                      <FolderOpen className="w-3.5 h-3.5 text-[#38BDF8]" />
                      {folderCount} Folder
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onFilterByCategory(cat.id)}
                    className="text-[11px] font-semibold text-[#F0B90B] hover:underline whitespace-nowrap"
                  >
                    Lihat Fail
                  </button>
                </div>

                {canManageCategories && (
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(cat)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#EAECEF] bg-[#1E2329] border border-[#2B3139] rounded-lg hover:bg-[#2B3139] transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#F0B90B]" />
                      Sunting
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTryDelete(cat)}
                      title={
                        inUse
                          ? 'Kategori sedang digunakan dan tidak boleh dipadam'
                          : 'Padam kategori tidak digunakan'
                      }
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                        inUse
                          ? 'text-[#848E9C] bg-[#0B0E11] border-[#2B3139] opacity-75 hover:opacity-100'
                          : 'text-[#F6465D] bg-[#F6465D]/10 border-[#F6465D]/30 hover:bg-[#F6465D]/20'
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Padam
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Tambah / Sunting Kategori */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? 'Sunting Kategori Dokumen' : 'Tambah Kategori Dokumen Baharu'}
        subtitle="Kategori memudahkan pengelasan dan carian pantas dokumen sekolah."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-[#F6465D]/15 border border-[#F6465D]/30 text-xs text-[#F6465D]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#EAECEF] mb-1.5">
              Nama Kategori *
            </label>
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Contoh: Pendidikan Khas / PPKI"
              className="w-full px-3.5 py-2.5 text-sm bg-[#0B0E11] border border-[#2B3139] rounded-lg text-[#EAECEF] focus:outline-none focus:border-[#F0B90B]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#EAECEF] mb-1.5">
              Penerangan Kategori
            </label>
            <textarea
              rows={3}
              value={penerangan}
              onChange={(e) => setPenerangan(e.target.value)}
              placeholder="Nyatakan skop dokumen di bawah kategori ini..."
              className="w-full px-3.5 py-2.5 text-sm bg-[#0B0E11] border border-[#2B3139] rounded-lg text-[#EAECEF] focus:outline-none focus:border-[#F0B90B]"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-[#EAECEF] bg-[#1E2329] border border-[#2B3139] rounded-lg hover:bg-[#2B3139]"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-[#0B0E11] bg-[#F0B90B] rounded-lg hover:bg-[#F8D12F]"
            >
              {editingCategory ? 'Simpan Perubahan' : 'Simpan Kategori'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Pengesahan Padam Kategori */}
      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) onDeleteCategory(deleteTarget.id);
        }}
        title="Padam Kategori Dokumen"
        itemName={deleteTarget?.nama ?? ''}
        description="Kategori ini tidak mengandungi sebarang dokumen atau folder. Adakah anda pasti mahu memadamnya?"
      />
    </div>
  );
};
