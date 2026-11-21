import {
  DigitalDocument,
  DocCategoryItem,
  DocCenterDocument,
  DocCenterV15State,
  DocFolderItem,
  DocStatus,
  DocumentCategory,
  UserRole,
} from '../types/eduschool';
import { ROLE_PROFILES } from './rolePermissions';

export interface DocRolePermissions {
  canViewAll: boolean;
  canAddDocument: boolean;
  canEditAnyDocument: boolean;
  canDeleteAnyDocument: boolean;
  canManageFolders: boolean;
  canManageCategories: boolean;
  canApproveDocuments: boolean;
  canExportReport: boolean;
  scopeNote: string;
}

export function getDocRolePermissions(role: UserRole): DocRolePermissions {
  switch (role) {
    case 'Super Admin':
      return {
        canViewAll: true,
        canAddDocument: true,
        canEditAnyDocument: true,
        canDeleteAnyDocument: true,
        canManageFolders: true,
        canManageCategories: true,
        canApproveDocuments: true,
        canExportReport: true,
        scopeNote:
          'Akses penuh pentadbir: semua dokumen, pengesahan digital, folder, kategori, sejarah versi dan laporan dokumentasi.',
      };
    case 'Pengetua':
      return {
        canViewAll: true,
        canAddDocument: true,
        canEditAnyDocument: true,
        canDeleteAnyDocument: false,
        canManageFolders: true,
        canManageCategories: true,
        canApproveDocuments: true,
        canExportReport: true,
        scopeNote:
          'Akses eksekutif Pengetua: melihat semua dokumen sekolah, melulus & mengesahkan dokumen/folder serta mengeksport laporan.',
      };
    case 'Penolong Kanan':
      return {
        canViewAll: true,
        canAddDocument: true,
        canEditAnyDocument: true,
        canDeleteAnyDocument: false,
        canManageFolders: true,
        canManageCategories: true,
        canApproveDocuments: true,
        canExportReport: true,
        scopeNote:
          'Akses Penolong Kanan: mengurus, menyemak dan mengesahkan dokumen, folder serta kategori mengikut bidang pengurusan sekolah.',
      };
    case 'Ketua Bidang':
      return {
        canViewAll: true,
        canAddDocument: true,
        canEditAnyDocument: false,
        canDeleteAnyDocument: false,
        canManageFolders: true,
        canManageCategories: false,
        canApproveDocuments: true,
        canExportReport: true,
        scopeNote:
          'Akses Ketua Bidang: menyelia, menyunting dan mengesahkan dokumen bidang/kurikulum/panitia serta mengurus folder berkaitan.',
      };
    case 'Ketua Panitia':
      return {
        canViewAll: true,
        canAddDocument: true,
        canEditAnyDocument: false,
        canDeleteAnyDocument: false,
        canManageFolders: true,
        canManageCategories: false,
        canApproveDocuments: true,
        canExportReport: true,
        scopeNote:
          'Akses Ketua Panitia: mengurus dan mengesahkan dokumen panitia, PdP, peperiksaan serta dokumen yang dimuat naik sendiri.',
      };
    case 'Guru':
    case 'Staf':
      return {
        canViewAll: true,
        canAddDocument: true,
        canEditAnyDocument: false,
        canDeleteAnyDocument: false,
        canManageFolders: false,
        canManageCategories: false,
        canApproveDocuments: false,
        canExportReport: true,
        scopeNote:
          `Akses ${role}: melihat dokumen aktif, menghantar draf untuk pengesahan dan mengemaskini versi dokumen milik sendiri (${ROLE_PROFILES[role].userName}).`,
      };
  }
}

export function canUserEditDoc(
  doc: DocCenterDocument,
  role: UserRole
): boolean {
  const perms = getDocRolePermissions(role);
  if (perms.canEditAnyDocument) return true;
  const userName = ROLE_PROFILES[role].userName.toLowerCase();
  if (doc.pemilik.toLowerCase() === userName) return true;

  if (role === 'Ketua Bidang') {
    return (
      doc.categoryId === 'cat-kurikulum' ||
      doc.categoryId === 'cat-panitia' ||
      doc.categoryId === 'cat-peperiksaan' ||
      doc.categoryId === 'cat-pdp'
    );
  }
  if (role === 'Ketua Panitia') {
    return (
      doc.categoryId === 'cat-panitia' ||
      doc.categoryId === 'cat-pdp' ||
      doc.categoryId === 'cat-peperiksaan' ||
      doc.categoryId === 'cat-mesyuarat'
    );
  }
  return false;
}

export function canUserDeleteDoc(
  doc: DocCenterDocument,
  role: UserRole
): boolean {
  const perms = getDocRolePermissions(role);
  if (perms.canDeleteAnyDocument) return true;
  const userName = ROLE_PROFILES[role].userName.toLowerCase();
  return doc.pemilik.toLowerCase() === userName && doc.status === 'Draf';
}

function mapCategoryToLegacy(catName: string): DocumentCategory {
  const low = catName.toLowerCase();
  if (low.includes('mesyuarat') || low.includes('minit')) return 'Minit Mesyuarat';
  if (low.includes('laporan')) return 'Laporan Program';
  if (low.includes('surat') || low.includes('pekeliling')) return 'Pekeliling & Surat';
  return 'Evidens Aktiviti';
}

/**
 * Menyelaraskan rekod dokumen V1.5 ke `state.documents` supaya Papan Pemuka Utama,
 * Panitia, Carian Global dan Laporan bersepadu sentiasa konsisten.
 */
export function syncLegacyDocuments(state: DocCenterV15State): DigitalDocument[] {
  return state.documents.map((d) => {
    const cat = state.categories.find((c) => c.id === d.categoryId);
    return {
      id: d.id,
      tajuk: d.tajuk,
      kategori: mapCategoryToLegacy(cat?.nama ?? ''),
      penyedia: d.pemilik,
      tarikh: d.tarikhDokumen,
      format: d.jenisFail,
      saiz: d.saiz,
      ringkasan: d.penerangan,
    };
  });
}

export function generateNextDocRef(docs: DocCenterDocument[]): string {
  const year = new Date().getFullYear();
  let maxNum = 0;
  docs.forEach((d) => {
    const m = d.noRujukan.match(/(\d+)$/);
    if (m) {
      const n = Number(m[1]);
      if (n > maxNum) maxNum = n;
    }
  });
  return `SMKS/DOK/${year}/${String(maxNum + 1).padStart(3, '0')}`;
}

export function suggestNextVersion(currentVersion: string, major = false): string {
  const m = currentVersion.match(/(\d+)\.(\d+)/);
  if (!m) return major ? 'Versi 2.0' : 'Versi 1.1';
  const maj = Number(m[1]);
  const min = Number(m[2]);
  return major ? `Versi ${maj + 1}.0` : `Versi ${maj}.${min + 1}`;
}

export interface SmartDocFilters {
  query: string;
  categoryId: string;
  folderId: string;
  status: 'Semua' | DocStatus;
  tahun: string;
  bulan: string;
  jenisFail: string;
  pemilik: string;
  tarikhDari?: string;
  tarikhHingga?: string;
  sortBy: 'tarikh_terbaharu' | 'tarikh_terdahulu' | 'nama_az' | 'nama_za';
}

export function filterDocumentsSmart(
  docs: DocCenterDocument[],
  categories: DocCategoryItem[],
  filters: SmartDocFilters
): DocCenterDocument[] {
  const q = filters.query.trim().toLowerCase();

  const filtered = docs.filter((d) => {
    const catName =
      categories.find((c) => c.id === d.categoryId)?.nama.toLowerCase() ?? '';

    if (q) {
      const matchText =
        d.tajuk.toLowerCase().includes(q) ||
        d.noRujukan.toLowerCase().includes(q) ||
        catName.includes(q) ||
        d.pemilik.toLowerCase().includes(q) ||
        d.penerangan.toLowerCase().includes(q) ||
        d.catatan.toLowerCase().includes(q);
      if (!matchText) return false;
    }

    if (filters.categoryId !== 'Semua' && d.categoryId !== filters.categoryId) {
      return false;
    }
    if (filters.folderId !== 'Semua' && d.folderId !== filters.folderId) {
      return false;
    }
    if (filters.status !== 'Semua' && d.status !== filters.status) {
      return false;
    }
    if (filters.jenisFail !== 'Semua' && d.jenisFail.toUpperCase() !== filters.jenisFail.toUpperCase()) {
      return false;
    }
    if (filters.pemilik !== 'Semua' && d.pemilik !== filters.pemilik) {
      return false;
    }

    const docDate = d.tarikhDokumen || d.tarikhDimuatNaik;
    if (filters.tahun !== 'Semua' && !docDate.startsWith(filters.tahun)) {
      return false;
    }
    if (filters.bulan !== 'Semua') {
      const monthPart = docDate.slice(5, 7);
      if (monthPart !== filters.bulan) return false;
    }
    if (filters.tarikhDari && docDate < filters.tarikhDari) {
      return false;
    }
    if (filters.tarikhHingga && docDate > filters.tarikhHingga) {
      return false;
    }
    return true;
  });

  return [...filtered].sort((a, b) => {
    switch (filters.sortBy) {
      case 'nama_az':
        return a.tajuk.localeCompare(b.tajuk, 'ms');
      case 'nama_za':
        return b.tajuk.localeCompare(a.tajuk, 'ms');
      case 'tarikh_terdahulu':
        return a.tarikhDokumen.localeCompare(b.tarikhDokumen);
      case 'tarikh_terbaharu':
      default:
        return b.tarikhDimuatNaik.localeCompare(a.tarikhDimuatNaik) ||
          b.tarikhDokumen.localeCompare(a.tarikhDokumen);
    }
  });
}

export const MALAY_MONTHS = [
  { code: '01', short: 'Jan', label: 'Januari' },
  { code: '02', short: 'Feb', label: 'Februari' },
  { code: '03', short: 'Mac', label: 'Mac' },
  { code: '04', short: 'Apr', label: 'April' },
  { code: '05', short: 'Mei', label: 'Mei' },
  { code: '06', short: 'Jun', label: 'Jun' },
  { code: '07', short: 'Jul', label: 'Julai' },
  { code: '08', short: 'Ogos', label: 'Ogos' },
  { code: '09', short: 'Sep', label: 'September' },
  { code: '10', short: 'Okt', label: 'Oktober' },
  { code: '11', short: 'Nov', label: 'November' },
  { code: '12', short: 'Dis', label: 'Disember' },
];

export interface DocCenterComputedStats {
  totalDocs: number;
  totalFolders: number;
  totalCategories: number;
  addedThisMonth: number;
  currentMonthLabel: string;
  activeCount: number;
  pendingApprovalCount: number;
  draftCount: number;
  archiveCount: number;
  byCategory: Array<{ category: DocCategoryItem; count: number }>;
  byYear: Array<{ tahun: string; count: number }>;
  byOwner: Array<{ pemilik: string; count: number }>;
  byMonthCurrentYear: Array<{ code: string; short: string; label: string; count: number }>;
  updatedDocs: DocCenterDocument[];
}

export function computeDocCenterStats(state: DocCenterV15State): DocCenterComputedStats {
  const now = new Date();
  const currentYear = String(now.getFullYear());
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
  const currentYm = `${currentYear}-${currentMonth}`;
  const monthMeta = MALAY_MONTHS.find((m) => m.code === currentMonth);
  const currentMonthLabel = `${monthMeta?.label ?? currentMonth} ${currentYear}`;

  const addedThisMonth = state.documents.filter((d) =>
    (d.tarikhDimuatNaik || d.tarikhDokumen).startsWith(currentYm)
  ).length;

  const activeCount = state.documents.filter((d) => d.status === 'Aktif').length;
  const pendingApprovalCount = state.documents.filter(
    (d) => d.status === 'Menunggu Pengesahan'
  ).length;
  const draftCount = state.documents.filter((d) => d.status === 'Draf').length;
  const archiveCount = state.documents.filter((d) => d.status === 'Arkib').length;

  const byCategory = state.categories.map((category) => ({
    category,
    count: state.documents.filter((d) => d.categoryId === category.id).length,
  }));

  const yearMap = new Map<string, number>();
  const ownerMap = new Map<string, number>();
  state.documents.forEach((d) => {
    const yr = (d.tarikhDokumen || d.tarikhDimuatNaik).slice(0, 4) || currentYear;
    yearMap.set(yr, (yearMap.get(yr) ?? 0) + 1);
    ownerMap.set(d.pemilik, (ownerMap.get(d.pemilik) ?? 0) + 1);
  });

  const byYear = Array.from(yearMap.entries())
    .map(([tahun, count]) => ({ tahun, count }))
    .sort((a, b) => b.tahun.localeCompare(a.tahun));

  const byOwner = Array.from(ownerMap.entries())
    .map(([pemilik, count]) => ({ pemilik, count }))
    .sort((a, b) => b.count - a.count);

  const byMonthCurrentYear = MALAY_MONTHS.map((m) => {
    const ym = `${currentYear}-${m.code}`;
    const count = state.documents.filter((d) =>
      (d.tarikhDimuatNaik || d.tarikhDokumen).startsWith(ym)
    ).length;
    return { ...m, count };
  });

  const updatedDocs = state.documents.filter((d) => d.versions.length > 1);

  return {
    totalDocs: state.documents.length,
    totalFolders: state.folders.length,
    totalCategories: state.categories.length,
    addedThisMonth,
    currentMonthLabel,
    activeCount,
    pendingApprovalCount,
    draftCount,
    archiveCount,
    byCategory,
    byYear,
    byOwner,
    byMonthCurrentYear,
    updatedDocs,
  };
}

export function getFolderName(folders: DocFolderItem[], folderId: string): string {
  if (!folderId || folderId === 'umum') return 'Kategori Umum (Tanpa Folder)';
  return folders.find((f) => f.id === folderId)?.nama ?? 'Folder Umum';
}

export function getCategoryName(categories: DocCategoryItem[], categoryId: string): string {
  return categories.find((c) => c.id === categoryId)?.nama ?? 'Lain-lain';
}

export function exportDocCenterReportToCSV(
  state: DocCenterV15State,
  activeRoleLabel: string
): string {
  const stats = computeDocCenterStats(state);
  const esc = (v: string | number) => {
    const s = String(v ?? '');
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };

  const rows: string[] = [];
  rows.push('LAPORAN PUSAT DOKUMENTASI DIGITAL SEKOLAH - EDUSCHOOL 360');
  rows.push('Sekolah,SMK Salaping Sabah');
  rows.push(`Peranan Paparan (Simulasi),${esc(activeRoleLabel)}`);
  rows.push(`Tarikh Dijana,${new Date().toISOString().slice(0, 10)}`);
  rows.push('');

  rows.push('1. RINGKASAN STATISTIK DOKUMENTASI');
  rows.push('Jumlah Dokumen,Jumlah Folder,Jumlah Kategori,Aktif,Menunggu Pengesahan,Draf,Arkib,Ditambah Bulan Ini');
  rows.push(
    [
      stats.totalDocs,
      stats.totalFolders,
      stats.totalCategories,
      stats.activeCount,
      stats.pendingApprovalCount,
      stats.draftCount,
      stats.archiveCount,
      stats.addedThisMonth,
    ].join(',')
  );
  rows.push('');

  rows.push('2. DOKUMEN MENGIKUT KATEGORI');
  rows.push('Kategori,Jumlah Dokumen');
  stats.byCategory.forEach((c) => {
    rows.push(`${esc(c.category.nama)},${c.count}`);
  });
  rows.push('');

  rows.push('3. DOKUMEN MENGIKUT TAHUN');
  rows.push('Tahun,Jumlah Dokumen');
  stats.byYear.forEach((y) => {
    rows.push(`${esc(y.tahun)},${y.count}`);
  });
  rows.push('');

  rows.push('4. DOKUMEN MENGIKUT PEMILIK');
  rows.push('Pemilik Dokumen,Jumlah Dokumen');
  stats.byOwner.forEach((o) => {
    rows.push(`${esc(o.pemilik)},${o.count}`);
  });
  rows.push('');

  rows.push('5. SENARAI PENUH DOKUMEN & VERSI');
  rows.push(
    'No Rujukan,Tajuk Dokumen,Kategori,Folder,Jenis Fail,Saiz,Pemilik,Tarikh Dokumen,Status,Versi Semasa,Bilangan Versi,Disahkan Oleh'
  );
  state.documents.forEach((d) => {
    rows.push(
      [
        esc(d.noRujukan),
        esc(d.tajuk),
        esc(getCategoryName(state.categories, d.categoryId)),
        esc(getFolderName(state.folders, d.folderId)),
        esc(d.jenisFail),
        esc(d.saiz),
        esc(d.pemilik),
        esc(d.tarikhDokumen),
        esc(d.status),
        esc(d.versiSemasa),
        d.versions.length,
        esc(d.pengesahan?.disahkanOleh ?? '-'),
      ].join(',')
    );
  });

  const csvContent = '\uFEFF' + rows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const fileName = `Laporan_Pusat_Dokumentasi_SMKSalaping_${new Date().toISOString().slice(0, 10)}.csv`;
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return fileName;
}
