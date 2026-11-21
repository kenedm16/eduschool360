import { ModuleId, RoleProfile, UserRole } from '../types/eduschool';

export const ROLE_PROFILES: Record<UserRole, RoleProfile> = {
  'Super Admin': {
    role: 'Super Admin',
    userName: 'Cikgu Fedelish Modirim',
    title: 'Pentadbir Sistem & Penyelaras ICT',
    department: 'Unit Pengurusan Maklumat Sekolah',
    email: 'fedelish.modirim@smksalaping.demo.my',
    initials: 'FM',
    description: 'Akses penuh kesemua modul, konfigurasi peranan, dan pengurusan rekod sistem.',
  },
  Pengetua: {
    role: 'Pengetua',
    userName: 'Puan Hajah Rosnah binti Majid',
    title: 'Pengetua',
    department: 'Pengurusan Tertinggi SMK Salaping',
    email: 'rosnah.majid@smksalaping.demo.my',
    initials: 'RM',
    description: 'Pemantauan eksekutif prestasi akademik, program sekolah, kewangan panitia dan guru.',
  },
  'Penolong Kanan': {
    role: 'Penolong Kanan',
    userName: 'Encik Mohd Faizal bin Salleh',
    title: 'Penolong Kanan Pentadbiran',
    department: 'Pengurusan Kurikulum & Operasi',
    email: 'faizal.salleh@smksalaping.demo.my',
    initials: 'MF',
    description: 'Penyelarasan tugasan, takwim sekolah, akademik, pemantauan murid dan program.',
  },
  'Ketua Bidang': {
    role: 'Ketua Bidang',
    userName: 'Puan Dayang Nurul Huda',
    title: 'Ketua Bidang Sains & Matematik',
    department: 'Bidang Sains dan Matematik',
    email: 'dayang.huda@smksalaping.demo.my',
    initials: 'DH',
    description: 'Penyeliaan panitia bawah bidang, analisis GPMP/GPS, intervensi murid dan dokumen.',
  },
  'Ketua Panitia': {
    role: 'Ketua Panitia',
    userName: 'Encik Raymond Mojilis',
    title: 'Ketua Panitia Matematik',
    department: 'Panitia Matematik',
    email: 'raymond.mojilis@smksalaping.demo.my',
    initials: 'RM',
    description: 'Pengurusan perancangan tahunan panitia, PCG, tugasan ahli dan markah mata pelajaran.',
  },
  Guru: {
    role: 'Guru',
    userName: 'Cikgu Siti Mariam binti Osman',
    title: 'Guru Akademik Biasa',
    department: 'Panitia Bahasa Melayu',
    email: 'siti.mariam@smksalaping.demo.my',
    initials: 'SM',
    description: 'Kemaskini tugasan peribadi, rekod murid & intervensi, dokumentasi, takwim dan aduan aset.',
  },
  Staf: {
    role: 'Staf',
    userName: 'Encik Jamil bin Kadir',
    title: 'Pembantu Tadbir (Operasi)',
    department: 'Pejabat Pentadbiran SMK Salaping',
    email: 'jamil.kadir@smksalaping.demo.my',
    initials: 'JK',
    description: 'Pengurusan inventori & kerosakan aset, dokumentasi rasmi, takwim dan sokongan program.',
  },
};

export const ROLE_MODULE_ACCESS: Record<UserRole, ModuleId[]> = {
  'Super Admin': [
    'dashboard',
    'tugasan',
    'panitia',
    'akademik',
    'murid',
    'dokumentasi',
    'takwim',
    'aset',
    'guru',
    'program',
    'laporan',
    'ai-assistant',
  ],
  Pengetua: [
    'dashboard',
    'tugasan',
    'panitia',
    'akademik',
    'murid',
    'dokumentasi',
    'takwim',
    'aset',
    'guru',
    'program',
    'laporan',
    'ai-assistant',
  ],
  'Penolong Kanan': [
    'dashboard',
    'tugasan',
    'panitia',
    'akademik',
    'murid',
    'dokumentasi',
    'takwim',
    'aset',
    'guru',
    'program',
    'laporan',
    'ai-assistant',
  ],
  'Ketua Bidang': [
    'dashboard',
    'tugasan',
    'panitia',
    'akademik',
    'murid',
    'dokumentasi',
    'takwim',
    'guru',
    'program',
    'laporan',
    'ai-assistant',
  ],
  'Ketua Panitia': [
    'dashboard',
    'tugasan',
    'panitia',
    'akademik',
    'murid',
    'dokumentasi',
    'takwim',
    'program',
    'laporan',
    'ai-assistant',
  ],
  Guru: [
    'dashboard',
    'tugasan',
    'panitia',
    'akademik',
    'murid',
    'dokumentasi',
    'takwim',
    'aset',
    'program',
    'laporan',
    'ai-assistant',
  ],
  Staf: [
    'dashboard',
    'tugasan',
    'dokumentasi',
    'takwim',
    'aset',
    'guru',
    'program',
    'laporan',
  ],
};

export interface RoleCapabilities {
  canManageAllTasks: boolean;
  canManagePanitia: boolean;
  canManageExams: boolean;
  canManageStudents: boolean;
  canManageDocuments: boolean;
  canManageCalendar: boolean;
  canManageAssets: boolean;
  canManageTeachers: boolean;
  canManagePrograms: boolean;
  canPostAnnouncements: boolean;
}

export function getRoleCapabilities(role: UserRole): RoleCapabilities {
  switch (role) {
    case 'Super Admin':
    case 'Pengetua':
    case 'Penolong Kanan':
      return {
        canManageAllTasks: true,
        canManagePanitia: true,
        canManageExams: true,
        canManageStudents: true,
        canManageDocuments: true,
        canManageCalendar: true,
        canManageAssets: true,
        canManageTeachers: true,
        canManagePrograms: true,
        canPostAnnouncements: true,
      };
    case 'Ketua Bidang':
      return {
        canManageAllTasks: true,
        canManagePanitia: true,
        canManageExams: true,
        canManageStudents: true,
        canManageDocuments: true,
        canManageCalendar: true,
        canManageAssets: false,
        canManageTeachers: false,
        canManagePrograms: true,
        canPostAnnouncements: true,
      };
    case 'Ketua Panitia':
      return {
        canManageAllTasks: true,
        canManagePanitia: true,
        canManageExams: true,
        canManageStudents: true,
        canManageDocuments: true,
        canManageCalendar: false,
        canManageAssets: false,
        canManageTeachers: false,
        canManagePrograms: true,
        canPostAnnouncements: false,
      };
    case 'Guru':
      return {
        canManageAllTasks: false,
        canManagePanitia: false,
        canManageExams: true,
        canManageStudents: true,
        canManageDocuments: true,
        canManageCalendar: false,
        canManageAssets: false, // Guru can still file damage reports
        canManageTeachers: false,
        canManagePrograms: false,
        canPostAnnouncements: false,
      };
    case 'Staf':
      return {
        canManageAllTasks: false,
        canManagePanitia: false,
        canManageExams: false,
        canManageStudents: false,
        canManageDocuments: true,
        canManageCalendar: true,
        canManageAssets: true,
        canManageTeachers: false,
        canManagePrograms: false,
        canPostAnnouncements: false,
      };
  }
}

export const MODULE_METADATA: Record<
  ModuleId,
  { label: string; shortLabel: string; description: string }
> = {
  dashboard: {
    label: 'Papan Pemuka Utama',
    shortLabel: 'Papan Pemuka',
    description: 'Ringkasan keseluruhan operasi, statistik dan aktiviti semasa SMK Salaping.',
  },
  tugasan: {
    label: 'Pengurusan Tugasan',
    shortLabel: 'Tugasan',
    description: 'Penyelarasan tugasan pentadbiran, guru dan staf dengan penjejakan keutamaan.',
  },
  panitia: {
    label: 'Pengurusan Panitia',
    shortLabel: 'Panitia',
    description: 'Struktur panitia, perancangan tahunan, kewangan PCG dan pelaporan aktiviti.',
  },
  akademik: {
    label: 'Akademik dan Peperiksaan',
    shortLabel: 'Akademik',
    description: 'Analisis gred mata pelajaran, pengiraan GPS dan GPMP serta prestasi peperiksaan.',
  },
  murid: {
    label: 'Pemantauan Murid',
    shortLabel: 'Murid',
    description: 'Rekod perkembangan akademik, kehadiran dan tindakan susulan intervensi murid.',
  },
  dokumentasi: {
    label: 'Pusat Dokumentasi',
    shortLabel: 'Pusat Dokumentasi',
    description: 'Pusat dokumentasi digital sekolah, folder berstruktur, pengurusan versi dan laporan arkib.',
  },
  takwim: {
    label: 'Takwim Sekolah',
    shortLabel: 'Takwim',
    description: 'Kalendar bersepadu aktiviti sekolah, mesyuarat, peperiksaan dan bengkel.',
  },
  aset: {
    label: 'Pengurusan Aset',
    shortLabel: 'Aset',
    description: 'Inventori harta modal, peralatan sekolah dan pengurusan aduan kerosakan.',
  },
  guru: {
    label: 'Pengurusan Guru',
    shortLabel: 'Guru',
    description: 'Direktori pegawai pendidikan, jawatan, bidang, panitia dan peranan sistem.',
  },
  program: {
    label: 'Program Sekolah',
    shortLabel: 'Program',
    description: 'Perancangan program kecemerlangan, jawatankuasa, peruntukan dan laporan pelaksanaan.',
  },
  laporan: {
    label: 'Laporan dan Eksport',
    shortLabel: 'Laporan',
    description: 'Pusat penjanaan laporan bersepadu sekolah dengan sokongan eksport PDF dan Excel.',
  },
  'ai-assistant': {
    label: 'Pembantu AI Pintar',
    shortLabel: 'Pembantu AI',
    description: 'Ruang bantuan pintar mod simulasi untuk draf laporan, idea program dan analisis.',
  },
};

export function getRoleDisplayLabel(role: UserRole): string {
  if (role === 'Super Admin') return 'Pentadbir Utama';
  return role;
}

