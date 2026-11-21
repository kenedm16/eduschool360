import React, { useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileBarChart,
  FilePlus2,
  FileText,
  FolderOpen,
  FolderPlus,
  GitBranch,
  HardDrive,
  LayoutDashboard,
  RotateCcw,
  Send,
  ShieldCheck,
  Stamp,
  Tags,
  UploadCloud,
} from 'lucide-react';
import {
  DocActivityItem,
  DocCategoryItem,
  DocCenterDocument,
  DocCenterSubmenuId,
  DocCenterV15State,
  DocFolderItem,
  DocStatus,
  DocVersionItem,
  TeacherItem,
  UserRole,
} from '../../types/eduschool';
import {
  ALLOWED_DOC_EXTENSIONS,
  readFileForLocalPrototype,
  triggerLocalFileDownload,
} from '../../services/documentStorageAdapter';
import {
  canUserEditDoc,
  computeDocCenterStats,
  generateNextDocRef,
  getCategoryName,
  getDocRolePermissions,
  getFolderName,
  SmartDocFilters,
  suggestNextVersion,
} from '../../utils/docCenterHelpers';
import { getRoleDisplayLabel, ROLE_PROFILES } from '../../utils/rolePermissions';
import { decodeDataUrlText } from '../../utils/zipBuilder';
import { ModuleHeader } from '../common/ModuleHeader';
import { ConfirmDeleteModal, Modal } from '../common/Modal';
import { DocDashboardPanel } from './documentation/DocDashboardPanel';
import { DocManagementPanel } from './documentation/DocManagementPanel';
import { DocCategoryPanel } from './documentation/DocCategoryPanel';
import { DocFolderPanel } from './documentation/DocFolderPanel';
import { DocRecentPanel } from './documentation/DocRecentPanel';
import { DocReportPanel } from './documentation/DocReportPanel';

interface DocumentModuleProps {
  docCenterV15: DocCenterV15State;
  teachers: TeacherItem[];
  activeRole: UserRole;
  activeSubmenu: DocCenterSubmenuId;
  onChangeSubmenu: (submenu: DocCenterSubmenuId) => void;
  onBackToDashboard: () => void;
  onUpdateDocCenterV15: (
    updater: (prev: DocCenterV15State) => DocCenterV15State,
    logActionText?: string,
    toastTitle?: string,
    toastMessage?: string
  ) => void;
  onNotify: (type: 'success' | 'info' | 'error', title: string, message?: string) => void;
}

const DEFAULT_FILTERS: SmartDocFilters = {
  query: '',
  categoryId: 'Semua',
  folderId: 'Semua',
  status: 'Semua',
  tahun: 'Semua',
  bulan: 'Semua',
  jenisFail: 'Semua',
  pemilik: 'Semua',
  sortBy: 'tarikh_terbaharu',
};

function makeActivity(
  tindakan: string,
  dokumenTajuk: string,
  oleh: string,
  jenis: DocActivityItem['jenis']
): DocActivityItem {
  const now = new Date();
  const ymd = now.toISOString().slice(0, 10);
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return {
    id: `dact-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    tindakan,
    dokumenTajuk,
    oleh,
    masa: `${ymd}, ${hh}:${mm}`,
    jenis,
  };
}

export const DocumentModule: React.FC<DocumentModuleProps> = ({
  docCenterV15,
  teachers,
  activeRole,
  activeSubmenu,
  onChangeSubmenu,
  onBackToDashboard,
  onUpdateDocCenterV15,
  onNotify,
}) => {
  const rolePerms = useMemo(() => getDocRolePermissions(activeRole), [activeRole]);
  const currentUserName = ROLE_PROFILES[activeRole].userName;
  const stats = useMemo(() => computeDocCenterStats(docCenterV15), [docCenterV15]);

  const [filters, setFilters] = useState<SmartDocFilters>(DEFAULT_FILTERS);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  // Modal Butiran, Pratonton & Sejarah Versi
  const [viewingDocId, setViewingDocId] = useState<string | null>(null);
  const [showInlinePreview, setShowInlinePreview] = useState(true);
  const viewingDoc = useMemo(
    () => docCenterV15.documents.find((d) => d.id === viewingDocId) ?? null,
    [docCenterV15.documents, viewingDocId]
  );

  // Modal Tambah / Sunting / Versi Baharu Dokumen
  const [isDocFormOpen, setIsDocFormOpen] = useState(false);
  const [docFormMode, setDocFormMode] = useState<'add' | 'edit' | 'new_version'>('add');
  const [editingDoc, setEditingDoc] = useState<DocCenterDocument | null>(null);
  const [noRujukan, setNoRujukan] = useState('');
  const [tajuk, setTajuk] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [folderId, setFolderId] = useState('');
  const [pemilik, setPemilik] = useState('');
  const [status, setStatus] = useState<DocStatus>('Aktif');
  const [tarikhDokumen, setTarikhDokumen] = useState('');
  const [penerangan, setPenerangan] = useState('');
  const [catatan, setCatatan] = useState('');
  const [jenisFail, setJenisFail] = useState('PDF');
  const [saiz, setSaiz] = useState('420 KB');
  const [namaFail, setNamaFail] = useState('');
  const [fileDataUrl, setFileDataUrl] = useState<string | undefined>(undefined);
  const [cloudStoragePath, setCloudStoragePath] = useState<string | undefined>(undefined);
  const [createNewVersion, setCreateNewVersion] = useState(false);
  const [isMajorVersion, setIsMajorVersion] = useState(false);
  const [versionChangeNote, setVersionChangeNote] = useState('');
  const [fileError, setFileError] = useState('');
  const [formError, setFormError] = useState('');
  const [isReadingFile, setIsReadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Modal Padam Dokumen
  const [deleteDocTarget, setDeleteDocTarget] = useState<DocCenterDocument | null>(null);

  // Modal Cepat Cipta Folder dari Papan Pemuka
  const [isQuickFolderOpen, setIsQuickFolderOpen] = useState(false);
  const [quickFolderName, setQuickFolderName] = useState('');
  const [quickFolderCatId, setQuickFolderCatId] = useState(
    docCenterV15.categories[0]?.id ?? 'cat-pengurusan'
  );
  const [quickFolderDesc, setQuickFolderDesc] = useState('');
  const [quickFolderErr, setQuickFolderErr] = useState('');

  const ownerOptions = useMemo(() => {
    const names = new Set<string>([currentUserName]);
    teachers.forEach((t) => names.add(t.nama));
    docCenterV15.documents.forEach((d) => names.add(d.pemilik));
    return Array.from(names).sort((a, b) => a.localeCompare(b, 'ms'));
  }, [currentUserName, teachers, docCenterV15.documents]);

  const openAddDocumentModal = (presetFolderId?: string, presetCategoryId?: string) => {
    const today = new Date().toISOString().slice(0, 10);
    setDocFormMode('add');
    setEditingDoc(null);
    setNoRujukan(generateNextDocRef(docCenterV15.documents));
    setTajuk('');
    setCategoryId(presetCategoryId || docCenterV15.categories[0]?.id || 'cat-pengurusan');
    setFolderId(presetFolderId || docCenterV15.folders[0]?.id || 'umum');
    setPemilik(currentUserName);
    setStatus('Aktif');
    setTarikhDokumen(today);
    setPenerangan('');
    setCatatan('');
    setJenisFail('PDF');
    setSaiz('Rekod Tanpa Fail');
    setNamaFail('');
    setFileDataUrl(undefined);
    setCloudStoragePath(undefined);
    setCreateNewVersion(false);
    setIsMajorVersion(false);
    setVersionChangeNote('Pendaftaran awal dokumen rasmi ke Pusat Dokumentasi Digital.');
    setFileError('');
    setFormError('');
    setIsDocFormOpen(true);
  };

  const openEditDocumentModal = (doc: DocCenterDocument, forceNewVersion = false) => {
    setDocFormMode(forceNewVersion ? 'new_version' : 'edit');
    setEditingDoc(doc);
    setNoRujukan(doc.noRujukan);
    setTajuk(doc.tajuk);
    setCategoryId(doc.categoryId);
    setFolderId(doc.folderId);
    setPemilik(doc.pemilik);
    setStatus(doc.status);
    setTarikhDokumen(doc.tarikhDokumen);
    setPenerangan(doc.penerangan);
    setCatatan(doc.catatan);
    setJenisFail(doc.jenisFail);
    setSaiz(doc.saiz);
    setNamaFail(doc.namaFail ?? '');
    setFileDataUrl(doc.fileDataUrl);
    setCloudStoragePath(doc.cloudStoragePath);
    setCreateNewVersion(forceNewVersion);
    setIsMajorVersion(false);
    setVersionChangeNote('');
    setFileError('');
    setFormError('');
    setIsDocFormOpen(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileError('');
    setIsReadingFile(true);
    try {
      const folderLabel = getFolderName(docCenterV15.folders, folderId);
      const payload = await readFileForLocalPrototype(file, folderLabel);
      setNamaFail(payload.namaFail);
      setJenisFail(payload.jenisFail);
      setSaiz(payload.saiz);
      setFileDataUrl(payload.fileDataUrl);
      setCloudStoragePath(payload.cloudStoragePath);
      if (!tajuk.trim()) {
        const cleanTitle = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ');
        setTajuk(cleanTitle);
      }
      onNotify(
        'success',
        'Fail Berjaya Diproses',
        `${payload.namaFail} (${payload.saiz}) sedia disimpan dalam storan setempat pelayar.`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Fail tidak dapat diproses.';
      setFileError(msg);
      onNotify('error', 'Muat Naik Fail Ditolak', msg);
    } finally {
      setIsReadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noRujukan.trim() || !tajuk.trim()) {
      setFormError('Nombor rujukan dan tajuk dokumen wajib diisi.');
      return;
    }
    if (!penerangan.trim()) {
      setFormError('Sila masukkan penerangan ringkas dokumen.');
      return;
    }
    if (createNewVersion && editingDoc && !versionChangeNote.trim()) {
      setFormError('Sila nyatakan catatan perubahan bagi versi baharu ini.');
      return;
    }

    const today = new Date().toISOString().slice(0, 10);

    if (docFormMode === 'add' || !editingDoc) {
      const newDocId = `doc-${Date.now()}`;
      const initialVersion: DocVersionItem = {
        id: `ver-${Date.now()}`,
        versi: 'Versi 1.0',
        tarikhPerubahan: today,
        oleh: currentUserName,
        catatanPerubahan:
          versionChangeNote.trim() || 'Pendaftaran awal dokumen rasmi sekolah.',
        statusPadaVersi: status,
        jenisFail: jenisFail.toUpperCase(),
        saiz: saiz || 'Rekod Tanpa Fail',
        namaFail: namaFail || undefined,
      };

      const newDoc: DocCenterDocument = {
        id: newDocId,
        noRujukan: noRujukan.trim().toUpperCase(),
        tajuk: tajuk.trim(),
        categoryId,
        folderId: folderId || 'umum',
        jenisFail: jenisFail.toUpperCase(),
        saiz: saiz || 'Rekod Tanpa Fail',
        penerangan: penerangan.trim(),
        tarikhDokumen: tarikhDokumen || today,
        tarikhDimuatNaik: today,
        pemilik: pemilik || currentUserName,
        status,
        catatan: catatan.trim(),
        versiSemasa: 'Versi 1.0',
        versions: [initialVersion],
        namaFail: namaFail || undefined,
        fileDataUrl,
        storageMode: fileDataUrl ? 'local_browser' : 'demo_metadata',
        cloudStoragePath,
      };

      onUpdateDocCenterV15(
        (prev) => ({
          ...prev,
          documents: [newDoc, ...prev.documents],
          activities: [
            makeActivity(
              fileDataUrl ? 'Memuat naik dokumen baharu' : 'Mendaftarkan rekod dokumen baharu',
              newDoc.tajuk,
              currentUserName,
              fileDataUrl ? 'muat_naik' : 'tambah'
            ),
            ...prev.activities,
          ],
        }),
        `Menambah dokumen [${newDoc.noRujukan}]: ${newDoc.tajuk}`,
        'Dokumen Berjaya Disimpan',
        `${newDoc.noRujukan} · ${newDoc.versiSemasa}`
      );
      setIsDocFormOpen(false);
      return;
    }

    // Kemaskini atau Versi Baharu (tidak memadam sejarah versi lama!)
    const nextVersionLabel = createNewVersion
      ? suggestNextVersion(editingDoc.versiSemasa, isMajorVersion)
      : editingDoc.versiSemasa;

    const updatedVersions: DocVersionItem[] = createNewVersion
      ? [
          ...editingDoc.versions,
          {
            id: `ver-${Date.now()}`,
            versi: nextVersionLabel,
            tarikhPerubahan: today,
            oleh: currentUserName,
            catatanPerubahan: versionChangeNote.trim(),
            statusPadaVersi: status,
            jenisFail: jenisFail.toUpperCase(),
            saiz,
            namaFail: namaFail || editingDoc.namaFail,
          },
        ]
      : editingDoc.versions;

    const updatedDoc: DocCenterDocument = {
      ...editingDoc,
      noRujukan: noRujukan.trim().toUpperCase(),
      tajuk: tajuk.trim(),
      categoryId,
      folderId: folderId || 'umum',
      jenisFail: jenisFail.toUpperCase(),
      saiz,
      penerangan: penerangan.trim(),
      tarikhDokumen: tarikhDokumen || editingDoc.tarikhDokumen,
      tarikhDimuatNaik: createNewVersion ? today : editingDoc.tarikhDimuatNaik,
      pemilik: pemilik || editingDoc.pemilik,
      status,
      catatan: catatan.trim(),
      versiSemasa: nextVersionLabel,
      versions: updatedVersions,
      namaFail: namaFail || undefined,
      fileDataUrl,
      storageMode: fileDataUrl ? 'local_browser' : editingDoc.storageMode,
      cloudStoragePath: cloudStoragePath ?? editingDoc.cloudStoragePath,
    };

    onUpdateDocCenterV15(
      (prev) => ({
        ...prev,
        documents: prev.documents.map((d) =>
          d.id === updatedDoc.id ? updatedDoc : d
        ),
        activities: [
          makeActivity(
            createNewVersion
              ? `Merekodkan ${nextVersionLabel}`
              : 'Menyunting maklumat dokumen',
            updatedDoc.tajuk,
            currentUserName,
            createNewVersion ? 'versi' : 'sunting'
          ),
          ...prev.activities,
        ],
      }),
      createNewVersion
        ? `Memuat naik ${nextVersionLabel} bagi dokumen: ${updatedDoc.tajuk}`
        : `Menyunting dokumen: ${updatedDoc.tajuk}`,
      createNewVersion ? `${nextVersionLabel} Direkodkan` : 'Dokumen Dikemaskini',
      updatedDoc.tajuk
    );
    setIsDocFormOpen(false);
  };

  const handleConfirmDeleteDocument = () => {
    if (!deleteDocTarget) return;
    const target = deleteDocTarget;
    onUpdateDocCenterV15(
      (prev) => ({
        ...prev,
        documents: prev.documents.filter((d) => d.id !== target.id),
        activities: [
          makeActivity(
            'Memadam rekod dokumen',
            target.tajuk,
            currentUserName,
            'padam'
          ),
          ...prev.activities,
        ],
      }),
      `Memadam dokumen [${target.noRujukan}]: ${target.tajuk}`,
      'Dokumen Dipadam',
      target.tajuk
    );
    if (viewingDocId === target.id) setViewingDocId(null);
    setDeleteDocTarget(null);
  };

  // Aliran Kerja Pengesahan & Cap Digital Ringkas (V1.6)
  const handleSubmitForApproval = (doc: DocCenterDocument) => {
    onUpdateDocCenterV15(
      (prev) => ({
        ...prev,
        documents: prev.documents.map((d) =>
          d.id === doc.id ? { ...d, status: 'Menunggu Pengesahan' } : d
        ),
        activities: [
          makeActivity(
            'Menghantar draf dokumen untuk pengesahan pentadbir',
            doc.tajuk,
            currentUserName,
            'pengesahan'
          ),
          ...prev.activities,
        ],
      }),
      `Menghantar dokumen [${doc.noRujukan}] untuk pengesahan pentadbir`,
      'Dihantar untuk Pengesahan',
      `${doc.noRujukan} kini berstatus Menunggu Pengesahan.`
    );
  };

  const handleApproveDocument = (doc: DocCenterDocument) => {
    const now = new Date();
    const ymd = now.toISOString().slice(0, 10);
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const codeSuffix = String(Date.now()).slice(-4);
    const kodPengesahan = `SAH-SMKS-${ymd.replace(/-/g, '')}-${codeSuffix}`;
    const roleLabel = getRoleDisplayLabel(activeRole);

    onUpdateDocCenterV15(
      (prev) => ({
        ...prev,
        documents: prev.documents.map((d) =>
          d.id === doc.id
            ? {
                ...d,
                status: 'Aktif',
                pengesahan: {
                  disahkanOleh: currentUserName,
                  perananPengesah: roleLabel,
                  tarikhMasa: `${ymd}, ${hh}:${mm}`,
                  kodPengesahan,
                  catatanPengesahan:
                    'Disemak dan disahkan secara digital dalam mod simulasi pentadbiran.',
                },
              }
            : d
        ),
        activities: [
          makeActivity(
            `Mengesahkan dokumen rasmi (${kodPengesahan})`,
            doc.tajuk,
            currentUserName,
            'pengesahan'
          ),
          ...prev.activities,
        ],
      }),
      `Mengesahkan & mengaktifkan dokumen [${doc.noRujukan}] (${kodPengesahan})`,
      'Dokumen Disahkan & Diaktifkan',
      `${doc.noRujukan} disahkan dengan kod ${kodPengesahan}.`
    );
  };

  const handleReturnToDraft = (doc: DocCenterDocument) => {
    onUpdateDocCenterV15(
      (prev) => ({
        ...prev,
        documents: prev.documents.map((d) =>
          d.id === doc.id ? { ...d, status: 'Draf', pengesahan: undefined } : d
        ),
        activities: [
          makeActivity(
            'Memulangkan dokumen ke status Draf untuk semakan semula',
            doc.tajuk,
            currentUserName,
            'pengesahan'
          ),
          ...prev.activities,
        ],
      }),
      `Memulangkan dokumen [${doc.noRujukan}] ke status Draf`,
      'Dipulangkan ke Draf',
      `${doc.tajuk} dikembalikan untuk semakan pemilik.`
    );
  };

  // Handlers Kategori
  const handleAddCategory = (payload: Omit<DocCategoryItem, 'id'>) => {
    const newCat: DocCategoryItem = { ...payload, id: `cat-${Date.now()}` };
    onUpdateDocCenterV15(
      (prev) => ({
        ...prev,
        categories: [...prev.categories, newCat],
        activities: [
          makeActivity('Menambah kategori baharu', newCat.nama, currentUserName, 'kategori'),
          ...prev.activities,
        ],
      }),
      `Menambah kategori dokumen: ${newCat.nama}`,
      'Kategori Baharu Ditambah',
      newCat.nama
    );
  };

  const handleUpdateCategory = (updated: DocCategoryItem) => {
    onUpdateDocCenterV15(
      (prev) => ({
        ...prev,
        categories: prev.categories.map((c) => (c.id === updated.id ? updated : c)),
        activities: [
          makeActivity('Menyunting kategori dokumen', updated.nama, currentUserName, 'kategori'),
          ...prev.activities,
        ],
      }),
      `Mengemaskini kategori dokumen: ${updated.nama}`,
      'Kategori Dikemaskini',
      updated.nama
    );
  };

  const handleDeleteCategory = (id: string) => {
    const target = docCenterV15.categories.find((c) => c.id === id);
    onUpdateDocCenterV15(
      (prev) => ({
        ...prev,
        categories: prev.categories.filter((c) => c.id !== id),
        activities: target
          ? [
              makeActivity('Memadam kategori tidak digunakan', target.nama, currentUserName, 'padam'),
              ...prev.activities,
            ]
          : prev.activities,
      }),
      target ? `Memadam kategori dokumen: ${target.nama}` : undefined,
      'Kategori Dipadam',
      target?.nama
    );
  };

  // Handlers Folder
  const handleAddFolder = (payload: Omit<DocFolderItem, 'id'>) => {
    const newFolder: DocFolderItem = { ...payload, id: `fld-${Date.now()}` };
    onUpdateDocCenterV15(
      (prev) => ({
        ...prev,
        folders: [...prev.folders, newFolder],
        activities: [
          makeActivity('Mencipta folder digital baharu', newFolder.nama, currentUserName, 'folder'),
          ...prev.activities,
        ],
      }),
      `Mencipta folder digital: ${newFolder.nama}`,
      'Folder Digital Dicipta',
      newFolder.nama
    );
  };

  const handleUpdateFolder = (updated: DocFolderItem) => {
    onUpdateDocCenterV15(
      (prev) => ({
        ...prev,
        folders: prev.folders.map((f) => (f.id === updated.id ? updated : f)),
        activities: [
          makeActivity('Menyunting maklumat folder', updated.nama, currentUserName, 'folder'),
          ...prev.activities,
        ],
      }),
      `Mengemaskini folder digital: ${updated.nama}`,
      'Folder Dikemaskini',
      updated.nama
    );
  };

  const handleDeleteFolderWithRelocation = (folderIdToRemove: string, targetFolderId: string) => {
    const target = docCenterV15.folders.find((f) => f.id === folderIdToRemove);
    const affectedCount = docCenterV15.documents.filter(
      (d) => d.folderId === folderIdToRemove
    ).length;

    onUpdateDocCenterV15(
      (prev) => ({
        ...prev,
        folders: prev.folders.filter((f) => f.id !== folderIdToRemove),
        documents: prev.documents.map((d) =>
          d.folderId === folderIdToRemove ? { ...d, folderId: targetFolderId } : d
        ),
        activities: target
          ? [
              makeActivity(
                affectedCount > 0
                  ? `Memadam folder dan memindahkan ${affectedCount} dokumen`
                  : 'Memadam folder digital kosong',
                target.nama,
                currentUserName,
                'folder'
              ),
              ...prev.activities,
            ]
          : prev.activities,
      }),
      target ? `Memadam folder: ${target.nama}` : undefined,
      'Folder Dipadam Dengan Selamat',
      affectedCount > 0
        ? `${affectedCount} dokumen telah dipindahkan ke ${getFolderName(docCenterV15.folders, targetFolderId)}.`
        : target?.nama
    );
  };

  const handleSaveQuickFolder = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = quickFolderName.trim();
    if (!clean) {
      setQuickFolderErr('Nama folder wajib diisi.');
      return;
    }
    if (docCenterV15.folders.some((f) => f.nama.toLowerCase() === clean.toLowerCase())) {
      setQuickFolderErr('Nama folder ini sudah wujud.');
      return;
    }
    handleAddFolder({
      nama: clean,
      induk: 'DOKUMENTASI SEKOLAH',
      categoryId: quickFolderCatId,
      penerangan: quickFolderDesc.trim() || 'Folder simpanan dokumen rasmi sekolah.',
      tarikhDicipta: new Date().toISOString().slice(0, 10),
      pencipta: currentUserName,
    });
    setIsQuickFolderOpen(false);
  };

  const submenus: Array<{
    id: DocCenterSubmenuId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: 'dashboard', label: 'Papan Pemuka Dokumentasi', icon: LayoutDashboard },
    { id: 'dokumen', label: 'Pengurusan Dokumen', icon: FileText },
    { id: 'kategori', label: 'Kategori Dokumen', icon: Tags },
    { id: 'folder', label: 'Folder Digital', icon: FolderOpen },
    { id: 'terkini', label: 'Dokumen Terkini', icon: Clock },
    { id: 'laporan', label: 'Laporan Dokumentasi', icon: FileBarChart },
  ];

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="PUSAT DOKUMENTASI DIGITAL SEKOLAH"
        description="Repositori berpusat dokumen rasmi, struktur folder digital, kawalan versi, carian pintar dan pelaporan dokumentasi SMK Salaping."
        onBackToDashboard={onBackToDashboard}
        actions={
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            {rolePerms.canManageFolders && (
              <button
                type="button"
                onClick={() => {
                  setQuickFolderName('');
                  setQuickFolderDesc('');
                  setQuickFolderErr('');
                  setIsQuickFolderOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#1E2329] text-[#EAECEF] border border-[#2B3139] rounded-lg hover:bg-[#2B3139] whitespace-nowrap"
              >
                <FolderPlus className="w-4 h-4 text-[#F0B90B]" />
                Cipta Folder
              </button>
            )}
            {rolePerms.canAddDocument && (
              <button
                type="button"
                onClick={() => openAddDocumentModal()}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-[#F0B90B] text-[#0B0E11] rounded-lg hover:bg-[#F8D12F] whitespace-nowrap"
              >
                <FilePlus2 className="w-4 h-4" />
                Tambah Dokumen
              </button>
            )}
          </div>
        }
      />

      {/* Jalur Kawalan Akses Peranan Simulasi */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3 rounded-xl bg-[#161A1E] border border-[#2B3139] text-xs print:hidden">
        <div className="flex items-center gap-2 text-[#EAECEF]">
          <ShieldCheck className="w-4 h-4 text-[#F0B90B] shrink-0" />
          <span>
            Simulasi Akses Peranan:{' '}
            <strong className="text-[#F0B90B]">{getRoleDisplayLabel(activeRole)}</strong>
            <span className="text-[#848E9C] ml-1.5">— {rolePerms.scopeNote}</span>
          </span>
        </div>
        <span className="text-[11px] text-[#848E9C] shrink-0">
          Simulasi Prototaip · Bukan Pengesahan Sebenar
        </span>
      </div>

      {/* Tab Submenu Pusat Dokumentasi */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-[#2B3139] print:hidden">
        {submenus.map((tab) => {
          const Icon = tab.icon;
          const active = activeSubmenu === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                if (tab.id !== 'folder') setSelectedFolderId(null);
                onChangeSubmenu(tab.id);
              }}
              className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-t-lg text-xs font-bold whitespace-nowrap transition-colors border-b-2 ${
                active
                  ? 'bg-[#161A1E] text-[#F0B90B] border-[#F0B90B]'
                  : 'text-[#848E9C] border-transparent hover:text-[#EAECEF] hover:bg-[#161A1E]/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Kandungan Submenu Aktif */}
      {activeSubmenu === 'dashboard' && (
        <DocDashboardPanel
          docState={docCenterV15}
          stats={stats}
          canAddDocument={rolePerms.canAddDocument}
          canManageFolders={rolePerms.canManageFolders}
          onQuickAddDocument={() => openAddDocumentModal()}
          onQuickAddFolder={() => {
            setQuickFolderName('');
            setQuickFolderDesc('');
            setQuickFolderErr('');
            setIsQuickFolderOpen(true);
          }}
          onNavigateSubmenu={onChangeSubmenu}
          onSelectCategoryFilter={(catId) => {
            setFilters({ ...DEFAULT_FILTERS, categoryId: catId });
            onChangeSubmenu('dokumen');
          }}
          onViewDocument={(doc) => setViewingDocId(doc.id)}
        />
      )}

      {activeSubmenu === 'dokumen' && (
        <DocManagementPanel
          documents={docCenterV15.documents}
          categories={docCenterV15.categories}
          folders={docCenterV15.folders}
          activeRole={activeRole}
          canAddDocument={rolePerms.canAddDocument}
          filters={filters}
          onChangeFilters={setFilters}
          onResetFilters={() => setFilters(DEFAULT_FILTERS)}
          onOpenAddModal={() => openAddDocumentModal()}
          onOpenEditModal={(doc) => openEditDocumentModal(doc, false)}
          onViewDocument={(doc) => setViewingDocId(doc.id)}
          onRequestDeleteDocument={(doc) => setDeleteDocTarget(doc)}
          onNotify={onNotify}
        />
      )}

      {activeSubmenu === 'kategori' && (
        <DocCategoryPanel
          categories={docCenterV15.categories}
          documents={docCenterV15.documents}
          folders={docCenterV15.folders}
          canManageCategories={rolePerms.canManageCategories}
          onAddCategory={handleAddCategory}
          onUpdateCategory={handleUpdateCategory}
          onDeleteCategory={handleDeleteCategory}
          onFilterByCategory={(catId) => {
            setFilters({ ...DEFAULT_FILTERS, categoryId: catId });
            onChangeSubmenu('dokumen');
          }}
          onNotify={onNotify}
        />
      )}

      {activeSubmenu === 'folder' && (
        <DocFolderPanel
          folders={docCenterV15.folders}
          categories={docCenterV15.categories}
          documents={docCenterV15.documents}
          currentUserName={currentUserName}
          canManageFolders={rolePerms.canManageFolders}
          canAddDocument={rolePerms.canAddDocument}
          selectedFolderId={selectedFolderId}
          onSelectFolderId={setSelectedFolderId}
          onAddFolder={handleAddFolder}
          onUpdateFolder={handleUpdateFolder}
          onDeleteFolderWithRelocation={handleDeleteFolderWithRelocation}
          onAddDocumentToFolder={(fldId, catId) =>
            openAddDocumentModal(fldId, catId)
          }
          onViewDocument={(doc) => setViewingDocId(doc.id)}
          onNotify={onNotify}
        />
      )}

      {activeSubmenu === 'terkini' && (
        <DocRecentPanel
          documents={docCenterV15.documents}
          categories={docCenterV15.categories}
          folders={docCenterV15.folders}
          onViewDocument={(doc) => setViewingDocId(doc.id)}
          onNotify={onNotify}
        />
      )}

      {activeSubmenu === 'laporan' && (
        <DocReportPanel
          docState={docCenterV15}
          stats={stats}
          activeRole={activeRole}
          onViewDocument={(doc) => setViewingDocId(doc.id)}
          onNotify={onNotify}
        />
      )}

      {/* Modal Tambah / Sunting / Muat Naik Versi Baharu Dokumen */}
      <Modal
        isOpen={isDocFormOpen}
        onClose={() => setIsDocFormOpen(false)}
        title={
          docFormMode === 'add'
            ? 'Tambah Dokumen Digital Baharu'
            : docFormMode === 'new_version'
              ? `Muat Naik Versi Baharu (${suggestNextVersion(editingDoc?.versiSemasa ?? 'Versi 1.0', isMajorVersion)})`
              : 'Sunting Maklumat Dokumen'
        }
        subtitle="Lengkapkan maklumat dokumen dan pilih fail daripada peranti anda (maksimum 2.00 MB)."
        maxWidthClass="max-w-2xl"
      >
        <form onSubmit={handleSaveDocument} className="space-y-4">
          {formError && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-[#F6465D]/15 border border-[#F6465D]/30 text-xs text-[#F6465D]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Makluman Storan Setempat */}
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[#0B0E11] border border-[#2B3139] text-[11px] text-[#848E9C]">
            <HardDrive className="w-4 h-4 text-[#F0B90B] shrink-0 mt-0.5" />
            <span>
              Fail yang dimuat naik disimpan sementara dalam <strong className="text-[#EAECEF]">storan setempat pelayar</strong> (had 2.00 MB) dan belum disambungkan ke storan awan sekolah (Fasa 2).
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#EAECEF] mb-1">
                No. Rujukan *
              </label>
              <input
                type="text"
                value={noRujukan}
                onChange={(e) => setNoRujukan(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-[#0B0E11] border border-[#2B3139] rounded-lg text-[#EAECEF] focus:outline-none focus:border-[#F0B90B]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#EAECEF] mb-1">
                Tajuk Dokumen *
              </label>
              <input
                type="text"
                value={tajuk}
                onChange={(e) => setTajuk(e.target.value)}
                placeholder="Contoh: Minit Mesyuarat Kurikulum Bil. 2/2026"
                className="w-full px-3 py-2 text-xs bg-[#0B0E11] border border-[#2B3139] rounded-lg text-[#EAECEF] focus:outline-none focus:border-[#F0B90B]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#EAECEF] mb-1">
                Kategori Dokumen *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#0B0E11] border border-[#2B3139] rounded-lg text-[#EAECEF] focus:outline-none focus:border-[#F0B90B]"
              >
                {docCenterV15.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nama}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#EAECEF] mb-1">
                Folder Digital
              </label>
              <select
                value={folderId}
                onChange={(e) => setFolderId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#0B0E11] border border-[#2B3139] rounded-lg text-[#EAECEF] focus:outline-none focus:border-[#F0B90B]"
              >
                <option value="umum">Kategori Umum (Tanpa Folder)</option>
                {docCenterV15.folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.induk} / {f.nama}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#EAECEF] mb-1">
                Pemilik Dokumen
              </label>
              <select
                value={pemilik}
                onChange={(e) => setPemilik(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#0B0E11] border border-[#2B3139] rounded-lg text-[#EAECEF] focus:outline-none focus:border-[#F0B90B]"
              >
                {ownerOptions.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#EAECEF] mb-1">
                Tarikh Dokumen
              </label>
              <input
                type="date"
                value={tarikhDokumen}
                onChange={(e) => setTarikhDokumen(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-[#0B0E11] border border-[#2B3139] rounded-lg text-[#EAECEF] focus:outline-none focus:border-[#F0B90B]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#EAECEF] mb-1">
                Status Dokumen
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as DocStatus)}
                className="w-full px-3 py-2 text-xs bg-[#0B0E11] border border-[#2B3139] rounded-lg text-[#EAECEF] focus:outline-none focus:border-[#F0B90B]"
              >
                <option value="Aktif">Aktif</option>
                <option value="Menunggu Pengesahan">Menunggu Pengesahan</option>
                <option value="Draf">Draf</option>
                <option value="Arkib">Arkib</option>
              </select>
            </div>
          </div>

          {/* Ruangan Muat Naik Fail Sebenar */}
          <div className="p-3.5 rounded-xl bg-[#0B0E11] border border-dashed border-[#2B3139] space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="text-xs font-bold text-[#EAECEF] flex items-center gap-1.5">
                  <UploadCloud className="w-4 h-4 text-[#F0B90B]" />
                  Muat Naik Fail Dokumen (Pilihan)
                </div>
                <p className="text-[11px] text-[#848E9C] mt-0.5">
                  Format disokong: {ALLOWED_DOC_EXTENSIONS.join(', ')} (Maksimum 2.00 MB)
                </p>
              </div>
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#0B0E11] bg-[#F0B90B] rounded-lg hover:bg-[#F8D12F] cursor-pointer whitespace-nowrap shrink-0">
                <UploadCloud className="w-3.5 h-3.5" />
                {isReadingFile ? 'Memproses...' : 'Pilih Fail'}
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {fileError && (
              <div className="p-2.5 rounded-lg bg-[#F6465D]/15 border border-[#F6465D]/30 text-xs text-[#F6465D]">
                {fileError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
              <div className="px-2.5 py-1.5 rounded bg-[#161A1E] border border-[#2B3139]">
                <span className="text-[#848E9C]">Nama Fail: </span>
                <span className="text-[#EAECEF] font-medium truncate">
                  {namaFail || 'Belum dipilih'}
                </span>
              </div>
              <div className="px-2.5 py-1.5 rounded bg-[#161A1E] border border-[#2B3139]">
                <span className="text-[#848E9C]">Jenis Fail: </span>
                <span className="text-[#F0B90B] font-mono font-bold">{jenisFail}</span>
              </div>
              <div className="px-2.5 py-1.5 rounded bg-[#161A1E] border border-[#2B3139]">
                <span className="text-[#848E9C]">Saiz: </span>
                <span className="text-[#0ECB81] font-mono font-bold">{saiz}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#EAECEF] mb-1">
              Penerangan Dokumen *
            </label>
            <textarea
              rows={2}
              value={penerangan}
              onChange={(e) => setPenerangan(e.target.value)}
              placeholder="Nyatakan tujuan, kandungan ringkas atau skop dokumen..."
              className="w-full px-3 py-2 text-xs bg-[#0B0E11] border border-[#2B3139] rounded-lg text-[#EAECEF] focus:outline-none focus:border-[#F0B90B]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#EAECEF] mb-1">
              Catatan Tambahan
            </label>
            <input
              type="text"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Contoh: Disemak oleh PK Pentadbiran untuk fail induk."
              className="w-full px-3 py-2 text-xs bg-[#0B0E11] border border-[#2B3139] rounded-lg text-[#EAECEF] focus:outline-none focus:border-[#F0B90B]"
            />
          </div>

          {/* Kawalan Versi Baharu ketika suntingan */}
          {editingDoc && (
            <div className="p-3.5 rounded-xl bg-[#1E2329]/70 border border-[#F0B90B]/30 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="inline-flex items-center gap-2 text-xs font-bold text-[#EAECEF] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createNewVersion}
                    onChange={(e) => setCreateNewVersion(e.target.checked)}
                    className="accent-[#F0B90B] w-4 h-4"
                  />
                  Rekodkan sebagai Versi Baharu ({suggestNextVersion(editingDoc.versiSemasa, isMajorVersion)})
                </label>

                {createNewVersion && (
                  <label className="inline-flex items-center gap-1.5 text-[11px] text-[#F0B90B] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isMajorVersion}
                      onChange={(e) => setIsMajorVersion(e.target.checked)}
                      className="accent-[#F0B90B]"
                    />
                    Naik taraf Versi Utama (contoh: 2.0)
                  </label>
                )}
              </div>

              {createNewVersion && (
                <div>
                  <label className="block text-[11px] font-semibold text-[#848E9C] mb-1">
                    Catatan Perubahan Versi (Rekod versi lama kekal disimpan) *
                  </label>
                  <input
                    type="text"
                    value={versionChangeNote}
                    onChange={(e) => setVersionChangeNote(e.target.value)}
                    placeholder="Contoh: Kemaskini jadual pelaksanaan dan lampiran tandatangan."
                    className="w-full px-3 py-2 text-xs bg-[#0B0E11] border border-[#2B3139] rounded-lg text-[#EAECEF] focus:outline-none focus:border-[#F0B90B]"
                  />
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setIsDocFormOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-[#EAECEF] bg-[#1E2329] border border-[#2B3139] rounded-lg hover:bg-[#2B3139]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isReadingFile}
              className="px-4 py-2 text-xs font-bold text-[#0B0E11] bg-[#F0B90B] rounded-lg hover:bg-[#F8D12F] disabled:opacity-60"
            >
              {docFormMode === 'add'
                ? 'Simpan Dokumen'
                : createNewVersion
                  ? 'Simpan Versi Baharu'
                  : 'Simpan Kemaskini'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Lihat Butiran Dokumen & Sejarah Versi */}
      <Modal
        isOpen={Boolean(viewingDoc)}
        onClose={() => setViewingDocId(null)}
        title={viewingDoc?.tajuk ?? 'Butiran Dokumen'}
        subtitle={
          viewingDoc
            ? `${viewingDoc.noRujukan} · ${viewingDoc.versiSemasa} · ${getCategoryName(docCenterV15.categories, viewingDoc.categoryId)}`
            : undefined
        }
        maxWidthClass="max-w-2xl"
      >
        {viewingDoc && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-[#0B0E11] border border-[#2B3139]">
                <div className="text-[#848E9C]">No. Rujukan</div>
                <div className="font-mono font-bold text-[#F0B90B] mt-0.5">
                  {viewingDoc.noRujukan}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[#0B0E11] border border-[#2B3139]">
                <div className="text-[#848E9C]">Status & Versi</div>
                <div className="font-bold text-[#EAECEF] mt-0.5">
                  {viewingDoc.status} · {viewingDoc.versiSemasa}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[#0B0E11] border border-[#2B3139] col-span-2 sm:col-span-1">
                <div className="text-[#848E9C]">Format & Saiz</div>
                <div className="font-mono font-bold text-[#0ECB81] mt-0.5">
                  {viewingDoc.jenisFail} · {viewingDoc.saiz}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[#0B0E11] border border-[#2B3139]">
                <div className="text-[#848E9C]">Folder Digital</div>
                <div className="font-semibold text-[#EAECEF] mt-0.5">
                  {getFolderName(docCenterV15.folders, viewingDoc.folderId)}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[#0B0E11] border border-[#2B3139]">
                <div className="text-[#848E9C]">Pemilik Dokumen</div>
                <div className="font-semibold text-[#EAECEF] mt-0.5">
                  {viewingDoc.pemilik}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[#0B0E11] border border-[#2B3139]">
                <div className="text-[#848E9C]">Tarikh Dokumen / Muat Naik</div>
                <div className="font-mono text-[#EAECEF] mt-0.5">
                  {viewingDoc.tarikhDokumen} / {viewingDoc.tarikhDimuatNaik}
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-[#0B0E11] border border-[#2B3139] space-y-2 text-xs">
              <div>
                <span className="font-bold text-[#848E9C]">Penerangan: </span>
                <span className="text-[#EAECEF] leading-relaxed">
                  {viewingDoc.penerangan}
                </span>
              </div>
              {viewingDoc.catatan && (
                <div>
                  <span className="font-bold text-[#848E9C]">Catatan: </span>
                  <span className="text-[#EAECEF]">{viewingDoc.catatan}</span>
                </div>
              )}
              <div className="text-[11px] text-[#848E9C] pt-1 border-t border-[#2B3139]">
                Mod Storan:{' '}
                {viewingDoc.storageMode === 'local_browser'
                  ? `Fail disimpan setempat dalam pelayar (${viewingDoc.namaFail || 'fail lampiran'})`
                  : 'Rekod contoh simulasi (tiada lampiran binari; muat naik fail baharu untuk menguji muat turun & pratonton)'}
              </div>
            </div>

            {/* Cap Pengesahan Digital (V1.6) */}
            {viewingDoc.pengesahan && (
              <div className="p-3.5 rounded-xl bg-[#0ECB81]/10 border border-[#0ECB81]/35 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <Stamp className="w-5 h-5 text-[#0ECB81] shrink-0 mt-0.5" />
                  <div>
                    <div className="font-extrabold text-[#0ECB81]">
                      Cap Pengesahan Digital Rasmi (Mod Simulasi)
                    </div>
                    <div className="text-[#EAECEF] mt-0.5">
                      Disahkan oleh <strong>{viewingDoc.pengesahan.disahkanOleh}</strong> ({viewingDoc.pengesahan.perananPengesah})
                    </div>
                    <div className="text-[11px] text-[#848E9C] mt-0.5">
                      Tarikh & Masa: <span className="font-mono text-[#EAECEF]">{viewingDoc.pengesahan.tarikhMasa}</span>
                    </div>
                  </div>
                </div>
                <div className="px-2.5 py-1.5 rounded-lg bg-[#0B0E11] border border-[#0ECB81]/40 font-mono font-bold text-[11px] text-[#0ECB81] shrink-0">
                  {viewingDoc.pengesahan.kodPengesahan}
                </div>
              </div>
            )}

            {/* Pratonton Dokumen Terbina (V1.6: PDF, Imej, Teks/CSV) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#38BDF8] flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" />
                  Pratonton Dokumen Terbina
                </h4>
                {viewingDoc.fileDataUrl && (
                  <button
                    type="button"
                    onClick={() => setShowInlinePreview((prev) => !prev)}
                    className="text-[11px] font-semibold text-[#F0B90B] hover:underline"
                  >
                    {showInlinePreview ? 'Sembunyikan Pratonton' : 'Papar Pratonton'}
                  </button>
                )}
              </div>

              {!viewingDoc.fileDataUrl ? (
                <div className="p-3 rounded-lg bg-[#0B0E11] border border-[#2B3139] text-xs text-[#848E9C]">
                  Tiada fail binari dilampirkan pada rekod contoh ini. Muat naik fail PDF, imej (PNG/JPG) atau teks (TXT/CSV) untuk pratonton langsung di sini.
                </div>
              ) : showInlinePreview ? (
                <div className="p-3 rounded-xl bg-[#0B0E11] border border-[#2B3139]">
                  {['PNG', 'JPG', 'JPEG'].includes(viewingDoc.jenisFail.toUpperCase()) ? (
                    <img
                      src={viewingDoc.fileDataUrl}
                      alt={viewingDoc.tajuk}
                      className="max-h-72 mx-auto rounded-lg object-contain border border-[#2B3139]"
                    />
                  ) : viewingDoc.jenisFail.toUpperCase() === 'PDF' ? (
                    <iframe
                      src={viewingDoc.fileDataUrl}
                      title={`Pratonton PDF ${viewingDoc.tajuk}`}
                      className="w-full h-80 rounded-lg border border-[#2B3139] bg-white"
                    />
                  ) : ['TXT', 'CSV'].includes(viewingDoc.jenisFail.toUpperCase()) ? (
                    <pre className="max-h-56 overflow-auto p-3 text-xs font-mono text-[#EAECEF] bg-[#161A1E] rounded-lg border border-[#2B3139] whitespace-pre-wrap">
                      {decodeDataUrlText(viewingDoc.fileDataUrl) ??
                        'Kandungan fail teks tidak dapat dibaca.'}
                    </pre>
                  ) : (
                    <div className="text-xs text-[#848E9C] py-2">
                      Pratonton langsung hanya menyokong format PDF, PNG, JPG, JPEG, TXT dan CSV. Gunakan butang <strong className="text-[#EAECEF]">Muat Turun Fail</strong> di bawah untuk membuka fail {viewingDoc.jenisFail}.
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* Sejarah Versi Dokumen */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#F0B90B] flex items-center gap-1.5">
                  <GitBranch className="w-3.5 h-3.5" />
                  Sejarah Versi Dokumen ({viewingDoc.versions.length})
                </h4>
                {canUserEditDoc(viewingDoc, activeRole) && (
                  <button
                    type="button"
                    onClick={() => {
                      const target = viewingDoc;
                      setViewingDocId(null);
                      openEditDocumentModal(target, true);
                    }}
                    className="text-xs font-bold text-[#0ECB81] hover:underline"
                  >
                    + Muat Naik Versi Baharu
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {[...viewingDoc.versions].reverse().map((v, idx) => (
                  <div
                    key={v.id}
                    className={`p-3 rounded-lg border text-xs ${
                      idx === 0
                        ? 'bg-[#1E2329] border-[#F0B90B]/40'
                        : 'bg-[#0B0E11] border-[#2B3139]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#F0B90B]">
                          {v.versi}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#161A1E] border border-[#2B3139] text-[#EAECEF]">
                          {v.statusPadaVersi}
                        </span>
                        {idx === 0 && (
                          <span className="text-[10px] font-bold text-[#0ECB81]">
                            Terkini
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-[11px] text-[#848E9C]">
                        {v.tarikhPerubahan}
                      </span>
                    </div>
                    <p className="text-[#EAECEF] mt-1">{v.catatanPerubahan}</p>
                    <div className="text-[11px] text-[#848E9C] mt-1">
                      Oleh: {v.oleh} · {v.jenisFail} ({v.saiz})
                      {v.namaFail ? ` · ${v.namaFail}` : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-[#2B3139]">
              {viewingDoc.status === 'Draf' && canUserEditDoc(viewingDoc, activeRole) && (
                <button
                  type="button"
                  onClick={() => handleSubmitForApproval(viewingDoc)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-[#0B0E11] bg-[#38BDF8] rounded-lg hover:bg-[#58CAF9]"
                >
                  <Send className="w-3.5 h-3.5" />
                  Hantar untuk Pengesahan
                </button>
              )}
              {(viewingDoc.status === 'Menunggu Pengesahan' ||
                viewingDoc.status === 'Draf') &&
                rolePerms.canApproveDocuments && (
                  <button
                    type="button"
                    onClick={() => handleApproveDocument(viewingDoc)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-[#0B0E11] bg-[#0ECB81] rounded-lg hover:bg-[#14E093]"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Sahkan & Aktifkan
                  </button>
                )}
              {viewingDoc.status === 'Menunggu Pengesahan' &&
                rolePerms.canApproveDocuments && (
                  <button
                    type="button"
                    onClick={() => handleReturnToDraft(viewingDoc)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#F0B90B] bg-[#1E2329] border border-[#F0B90B]/40 rounded-lg hover:bg-[#2B3139]"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Pulangkan ke Draf
                  </button>
                )}
              {viewingDoc.fileDataUrl && (
                <button
                  type="button"
                  onClick={() => {
                    triggerLocalFileDownload(
                      viewingDoc.fileDataUrl!,
                      viewingDoc.namaFail || `${viewingDoc.noRujukan}.${viewingDoc.jenisFail.toLowerCase()}`
                    );
                    onNotify('success', 'Muat Turun Fail Bermula', viewingDoc.namaFail || viewingDoc.tajuk);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-[#0B0E11] bg-[#0ECB81] rounded-lg hover:bg-[#14E093]"
                >
                  <Download className="w-3.5 h-3.5" />
                  Muat Turun Fail
                </button>
              )}
              {canUserEditDoc(viewingDoc, activeRole) && (
                <button
                  type="button"
                  onClick={() => {
                    const target = viewingDoc;
                    setViewingDocId(null);
                    openEditDocumentModal(target, false);
                  }}
                  className="px-3 py-2 text-xs font-bold text-[#0B0E11] bg-[#F0B90B] rounded-lg hover:bg-[#F8D12F]"
                >
                  Sunting / Kemaskini
                </button>
              )}
              <button
                type="button"
                onClick={() => setViewingDocId(null)}
                className="px-3 py-2 text-xs font-semibold text-[#EAECEF] bg-[#1E2329] border border-[#2B3139] rounded-lg hover:bg-[#2B3139]"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Cepat Cipta Folder dari Papan Pemuka */}
      <Modal
        isOpen={isQuickFolderOpen}
        onClose={() => setIsQuickFolderOpen(false)}
        title="Cipta Folder Digital Baharu"
        subtitle="Folder baharu akan diletakkan di bawah DOKUMENTASI SEKOLAH."
      >
        <form onSubmit={handleSaveQuickFolder} className="space-y-4">
          {quickFolderErr && (
            <div className="p-3 rounded-lg bg-[#F6465D]/15 border border-[#F6465D]/30 text-xs text-[#F6465D]">
              {quickFolderErr}
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-[#EAECEF] mb-1">
              Nama Folder *
            </label>
            <input
              type="text"
              value={quickFolderName}
              onChange={(e) => setQuickFolderName(e.target.value)}
              placeholder="Contoh: PEKELILING IKHTISAS"
              className="w-full px-3.5 py-2 text-sm bg-[#0B0E11] border border-[#2B3139] rounded-lg text-[#EAECEF] focus:outline-none focus:border-[#F0B90B]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#EAECEF] mb-1">
              Kategori Utama
            </label>
            <select
              value={quickFolderCatId}
              onChange={(e) => setQuickFolderCatId(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-[#0B0E11] border border-[#2B3139] rounded-lg text-[#EAECEF] focus:outline-none focus:border-[#F0B90B]"
            >
              {docCenterV15.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nama}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#EAECEF] mb-1">
              Keterangan
            </label>
            <textarea
              rows={2}
              value={quickFolderDesc}
              onChange={(e) => setQuickFolderDesc(e.target.value)}
              placeholder="Nyatakan kegunaan folder ini..."
              className="w-full px-3.5 py-2 text-sm bg-[#0B0E11] border border-[#2B3139] rounded-lg text-[#EAECEF] focus:outline-none focus:border-[#F0B90B]"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsQuickFolderOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-[#EAECEF] bg-[#1E2329] border border-[#2B3139] rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-[#0B0E11] bg-[#F0B90B] rounded-lg hover:bg-[#F8D12F]"
            >
              Cipta Folder
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Pengesahan Padam Dokumen */}
      <ConfirmDeleteModal
        isOpen={Boolean(deleteDocTarget)}
        onClose={() => setDeleteDocTarget(null)}
        onConfirm={handleConfirmDeleteDocument}
        title="Sahkan Pemadaman Dokumen"
        itemName={
          deleteDocTarget
            ? `[${deleteDocTarget.noRujukan}] ${deleteDocTarget.tajuk}`
            : ''
        }
        description="Tindakan ini akan memadam dokumen serta semua sejarah versinya daripada simpanan setempat semasa. Teruskan?"
      />
    </div>
  );
};
