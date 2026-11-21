export type ModuleId =
  | 'dashboard'
  | 'tugasan'
  | 'panitia'
  | 'akademik'
  | 'murid'
  | 'dokumentasi'
  | 'takwim'
  | 'aset'
  | 'guru'
  | 'program'
  | 'laporan'
  | 'ai-assistant';

export type UserRole =
  | 'Super Admin'
  | 'Pengetua'
  | 'Penolong Kanan'
  | 'Ketua Bidang'
  | 'Ketua Panitia'
  | 'Guru'
  | 'Staf';

export interface RoleProfile {
  role: UserRole;
  userName: string;
  title: string;
  department: string;
  email: string;
  initials: string;
  description: string;
}

export type TaskPriority = 'Rendah' | 'Sederhana' | 'Tinggi' | 'Segera';
export type TaskStatus = 'Belum Mula' | 'Dalam Proses' | 'Selesai';

export interface TaskStatusHistoryItem {
  id: string;
  statusLama?: TaskStatus;
  statusBaharu: TaskStatus;
  tarikhMasa: string;
  oleh: string;
  catatan?: string;
}

export interface TaskCommentItem {
  id: string;
  penulis: string;
  peranan: UserRole;
  mesej: string;
  tarikhMasa: string;
}

export interface TaskEvidenceItem {
  id: string;
  namaFail: string;
  jenisFail: string;
  saiz: string;
  dimuatNaikOleh: string;
  tarikh: string;
  catatan: string;
  modDemo: true;
}

export interface TaskItem {
  id: string;
  kodTugasan?: string;
  tajuk: string;
  keterangan: string;
  kategori?: string;
  unit?: string;
  pemberiArahan?: string;
  pegawai: string;
  tarikhMula: string;
  tarikhAkhir: string;
  keutamaan: TaskPriority;
  status: TaskStatus;
  catatan?: string;
  sejarahStatus?: TaskStatusHistoryItem[];
  komen?: TaskCommentItem[];
  evidens?: TaskEvidenceItem[];
}

export type PanitiaPlanCategory =
  | 'Perancangan Aktiviti'
  | 'Program Peningkatan Akademik'
  | 'Perancangan PLC';

export interface PanitiaPlan {
  id: string;
  kategori?: PanitiaPlanCategory;
  aktiviti: string;
  sasaran: string;
  tempoh: string;
  tarikhMula?: string;
  tarikhAkhir?: string;
  pegawai?: string;
  status: 'Dirancang' | 'Dilaksana' | 'Selesai';
}

export interface PanitiaFinance {
  id: string;
  tahunKewangan?: string;
  perkara: string;
  tarikh: string;
  jenis: 'Peruntukan' | 'Perbelanjaan';
  jumlah: number;
  sumberPeruntukan?: string;
  namaPembekal?: string;
  noInvois?: string;
  catatan?: string;
}

export interface PanitiaMeeting {
  id: string;
  panitiaId: string;
  bilangan: string;
  tajuk: string;
  tarikh: string;
  masa: string;
  tempat: string;
  kehadiran: string[];
  agenda: string;
  minit: string;
  keputusan: string;
  tindakanSusulan: string;
  pegawaiBertanggungjawab: string;
}

export type PanitiaActivityStatus =
  | 'Dirancang'
  | 'Sedang Berjalan'
  | 'Selesai'
  | 'Ditangguh';

export interface PanitiaActivity {
  id: string;
  panitiaId: string;
  nama: string;
  objektif: string;
  tarikh: string;
  tempat: string;
  sasaranPeserta: string;
  penyelaras: string;
  anggaranPerbelanjaan: number;
  perbelanjaanSebenar: number;
  status: PanitiaActivityStatus;
  hasilImpak: string;
}

export type PanitiaDocumentCategory =
  | 'Fail Pengurusan'
  | 'Minit Mesyuarat'
  | 'Perancangan Tahunan'
  | 'Laporan Aktiviti'
  | 'Rekod Kewangan'
  | 'PLC'
  | 'Analisis Peperiksaan'
  | 'Evidens PdP'
  | 'Laporan Pencapaian';

export interface PanitiaDocument {
  id: string;
  panitiaId: string;
  namaDokumen: string;
  kategori: PanitiaDocumentCategory;
  tarikh: string;
  pemilik: string;
  format: string;
  saiz: string;
  catatan: string;
  modSimulasi: true;
}

export interface PanitiaItem {
  id: string;
  kodPanitia?: string;
  nama: string;
  bidang: string;
  ketuaPanitia: string;
  setiausaha?: string;
  ahli: string[];
  tahunSemasa?: string;
  tarikhPenubuhan?: string;
  statusAktif?: 'Aktif' | 'Tidak Aktif';
  objektifPanitia?: string;
  sasaranPencapaian?: string;
  rumusanTahunan?: string;
  cadanganPenambahbaikan?: string;
  peruntukanTahunan: number;
  perancanganTahunan: PanitiaPlan[];
  aktivitiTerkini: string[];
  rekodKewangan: PanitiaFinance[];
  mesyuarat?: PanitiaMeeting[];
  aktivitiTerperinci?: PanitiaActivity[];
  dokumenPanitia?: PanitiaDocument[];
  bilanganLaporan: number;
}

export type GradeDistribution = {
  APlus: number;
  A: number;
  AMinus: number;
  BPlus: number;
  B: number;
  CPlus: number;
  C: number;
  D: number;
  E: number;
  G: number;
};

export interface ExamRecord {
  id: string;
  peperiksaan: string;
  tingkatan: string;
  mataPelajaran: string;
  kodSubjek: string;
  bilCalon: number;
  bilLulus: number;
  gred: GradeDistribution;
  tarikh: string;
}

export type StudentFollowUpStatus = 'Perlu Pemantauan' | 'Dalam Intervensi' | 'Memuaskan';

export interface InterventionEntry {
  id: string;
  tarikh: string;
  tindakan: string;
  pegawai: string;
}

export interface StudentRecord {
  id: string;
  nama: string;
  noIdMurid: string;
  tingkatan: string;
  kelas: string;
  kehadiranPeratus: number;
  purataMarkah: number;
  tahapPenguasaan: string;
  isuUtama: string;
  statusSusulan: StudentFollowUpStatus;
  rekodIntervensi: InterventionEntry[];
}

export type DocumentCategory =
  | 'Minit Mesyuarat'
  | 'Laporan Program'
  | 'Evidens Aktiviti'
  | 'Pekeliling & Surat';

export interface DigitalDocument {
  id: string;
  tajuk: string;
  kategori: DocumentCategory;
  penyedia: string;
  tarikh: string;
  format: string;
  saiz: string;
  ringkasan: string;
}

export type CalendarEventCategory =
  | 'Aktiviti Sekolah'
  | 'Mesyuarat'
  | 'Peperiksaan'
  | 'Program & Bengkel';

export interface CalendarEvent {
  id: string;
  tajuk: string;
  tarikh: string; // YYYY-MM-DD
  masa: string;
  lokasi: string;
  kategori: CalendarEventCategory;
  penyelaras: string;
  catatan: string;
}

export type AssetStatus = 'Baik' | 'Perlu Penyelenggaraan' | 'Rosak';

export interface AssetItem {
  id: string;
  kodAset: string;
  nama: string;
  kategori: string;
  lokasi: string;
  kuantiti: number;
  status: AssetStatus;
  tarikhKemaskini: string;
}

export interface DamageReport {
  id: string;
  asetId: string;
  namaAset: string;
  lokasi: string;
  tarikhAduan: string;
  pelapor: string;
  keterangan: string;
  statusTindakan: 'Dilaporkan' | 'Dalam Baik Pulih' | 'Selesai';
}

export interface TeacherItem {
  id: string;
  nama: string;
  jawatan: string;
  bidang: string;
  panitia: string;
  perananSistem: UserRole;
  emel: string;
  noSambungan: string;
}

export type ProgramStatus = 'Dirancang' | 'Dalam Persiapan' | 'Sedang Berjalan' | 'Selesai';

export interface SchoolProgram {
  id: string;
  nama: string;
  tarikh: string;
  penyelaras: string;
  jawatankuasa: string;
  anggaranBajet: number;
  status: ProgramStatus;
  laporanPelaksanaan: string;
}

export interface AnnouncementItem {
  id: string;
  tajuk: string;
  kandungan: string;
  tarikh: string;
  pengarang: string;
  keutamaan: 'Biasa' | 'Penting';
}

export type NotificationCategory = 'tugasan_baharu' | 'tarikh_akhir' | 'program' | 'umum';

export interface NotificationItem {
  id: string;
  tajuk: string;
  mesej: string;
  masa: string;
  dibaca: boolean;
  modulSasaran: ModuleId;
  kategori?: NotificationCategory;
  isAuto?: boolean;
}

export interface ActivityLogItem {
  id: string;
  tindakan: string;
  pelaku: string;
  modul: string;
  masa: string;
}

export type ExamType =
  | 'Ujian Diagnostik'
  | 'Ujian Setara'
  | 'Pertengahan Tahun'
  | 'Akhir Tahun'
  | 'Percubaan SPM'
  | 'Peperiksaan STPM';

export type AcademicExamStatus = 'Dirancang' | 'Sedang Berlangsung' | 'Selesai' | 'Disahkan';

export interface GradeBandConfig {
  id: string;
  label: string; // e.g., 'A+', 'A', 'A-', 'B+', ..., 'G' or 'F'
  kumpulan: 'A' | 'B' | 'C' | 'D' | 'E' | 'Gagal';
  minMarkah: number;
  maxMarkah: number;
  mataNilai: number; // e.g., 0..9 for SPM or 1..5 / 1..6
  lulus: boolean;
}

export interface GradeSchemeConfig {
  id: string;
  nama: string;
  penerangan: string;
  skalaMaksimum: number;
  gunaGpmp: boolean;
  kaedahPengiraan: string;
  bands: GradeBandConfig[];
}

export interface AcademicExam {
  id: string;
  kodPeperiksaan: string;
  nama: string;
  tahun: string;
  tingkatan: string;
  tarikh: string;
  jenis: ExamType;
  bilanganMuridSasaran: number;
  status: AcademicExamStatus;
  schemeId: string;
  catatan?: string;
}

export interface AcademicSubject {
  id: string;
  kod: string;
  nama: string;
  tingkatan: string;
  guruMataPelajaran: string;
  ketuaPanitia: string;
  bilanganMuridSasaran: number;
  bidang?: string;
}

export interface AcademicScoreRecord {
  id: string;
  examId: string;
  subjectId: string;
  noIdMurid: string;
  namaMurid: string;
  kelas: string;
  markah: number;
  tarikhKemaskini: string;
}

export type AcademicInterventionStatus =
  | 'Belum Dilaksanakan'
  | 'Dalam Pelaksanaan'
  | 'Selesai';

export interface AcademicIntervention {
  id: string;
  examId?: string;
  subjectId: string;
  mataPelajaran: string;
  kumpulanSasaran: string;
  isuPencapaian: string;
  objektif: string;
  strategiTindakan: string;
  guruBertanggungjawab: string;
  tarikhPelaksanaan: string;
  status: AcademicInterventionStatus;
  hasilPenilaian: string;
  dijanaSistem?: boolean;
}

export interface AcademicV14State {
  exams: AcademicExam[];
  subjects: AcademicSubject[];
  scores: AcademicScoreRecord[];
  gradeSchemes: GradeSchemeConfig[];
  interventions: AcademicIntervention[];
}

export type DocCenterSubmenuId =
  | 'dashboard'
  | 'dokumen'
  | 'kategori'
  | 'folder'
  | 'terkini'
  | 'laporan';

export type DocStatus = 'Draf' | 'Menunggu Pengesahan' | 'Aktif' | 'Arkib';

export interface DocApprovalStamp {
  disahkanOleh: string;
  perananPengesah: string;
  tarikhMasa: string;
  kodPengesahan: string;
  catatanPengesahan?: string;
}

export interface DocCategoryItem {
  id: string;
  nama: string;
  penerangan: string;
  lalai?: boolean;
}

export interface DocFolderItem {
  id: string;
  nama: string;
  induk: string;
  categoryId: string;
  penerangan: string;
  tarikhDicipta: string;
  pencipta: string;
}

export interface DocVersionItem {
  id: string;
  versi: string;
  tarikhPerubahan: string;
  oleh: string;
  catatanPerubahan: string;
  statusPadaVersi: DocStatus;
  jenisFail: string;
  saiz: string;
  namaFail?: string;
}

export interface DocCenterDocument {
  id: string;
  noRujukan: string;
  tajuk: string;
  categoryId: string;
  folderId: string;
  jenisFail: string;
  saiz: string;
  penerangan: string;
  tarikhDokumen: string;
  tarikhDimuatNaik: string;
  pemilik: string;
  bidangAkses?: string;
  status: DocStatus;
  catatan: string;
  versiSemasa: string;
  versions: DocVersionItem[];
  namaFail?: string;
  fileDataUrl?: string;
  storageMode: 'local_browser' | 'demo_metadata';
  cloudStoragePath?: string;
  pengesahan?: DocApprovalStamp;
}

export interface DocActivityItem {
  id: string;
  tindakan: string;
  dokumenTajuk: string;
  oleh: string;
  masa: string;
  jenis:
    | 'tambah'
    | 'sunting'
    | 'padam'
    | 'versi'
    | 'folder'
    | 'kategori'
    | 'muat_naik'
    | 'pengesahan';
}

export interface DocCenterV15State {
  categories: DocCategoryItem[];
  folders: DocFolderItem[];
  documents: DocCenterDocument[];
  activities: DocActivityItem[];
}

export interface EduSchoolState {
  activeRole: UserRole;
  tasks: TaskItem[];
  panitiaList: PanitiaItem[];
  examRecords: ExamRecord[];
  academicV14?: AcademicV14State;
  docCenterV15?: DocCenterV15State;
  students: StudentRecord[];
  documents: DigitalDocument[];
  calendarEvents: CalendarEvent[];
  assets: AssetItem[];
  damageReports: DamageReport[];
  teachers: TeacherItem[];
  programs: SchoolProgram[];
  announcements: AnnouncementItem[];
  notifications: NotificationItem[];
  activityLogs: ActivityLogItem[];
}
