import {
  AcademicExam,
  AcademicIntervention,
  AcademicScoreRecord,
  AcademicSubject,
  AcademicV14State,
  GradeSchemeConfig,
} from '../types/eduschool';

export const INITIAL_GRADE_SCHEMES: GradeSchemeConfig[] = [
  {
    id: 'skema-spm',
    nama: 'Skema Menengah Atas / SPM (10 Gred)',
    penerangan:
      'Skema 10 peringkat gred (A+ hingga G) dengan pemberat mata nilai 0 hingga 9 (lebih rendah lebih cemerlang).',
    skalaMaksimum: 9,
    gunaGpmp: true,
    kaedahPengiraan:
      'GPMP = Jumlah(Bilangan Calon × Mata Nilai Gred) ÷ Jumlah Calon Hadir; GPS = Purata Berwajaran Mata Nilai Semua Kertas Peperiksaan (Skala 0.00–9.00, konfigurasi dalaman sekolah).',
    bands: [
      { id: 'spm-ap', label: 'A+', kumpulan: 'A', minMarkah: 90, maxMarkah: 100, mataNilai: 0, lulus: true },
      { id: 'spm-a', label: 'A', kumpulan: 'A', minMarkah: 80, maxMarkah: 89, mataNilai: 1, lulus: true },
      { id: 'spm-am', label: 'A-', kumpulan: 'A', minMarkah: 70, maxMarkah: 79, mataNilai: 2, lulus: true },
      { id: 'spm-bp', label: 'B+', kumpulan: 'B', minMarkah: 65, maxMarkah: 69, mataNilai: 3, lulus: true },
      { id: 'spm-b', label: 'B', kumpulan: 'B', minMarkah: 60, maxMarkah: 64, mataNilai: 4, lulus: true },
      { id: 'spm-cp', label: 'C+', kumpulan: 'C', minMarkah: 55, maxMarkah: 59, mataNilai: 5, lulus: true },
      { id: 'spm-c', label: 'C', kumpulan: 'C', minMarkah: 50, maxMarkah: 54, mataNilai: 6, lulus: true },
      { id: 'spm-d', label: 'D', kumpulan: 'D', minMarkah: 45, maxMarkah: 49, mataNilai: 7, lulus: true },
      { id: 'spm-e', label: 'E', kumpulan: 'E', minMarkah: 40, maxMarkah: 44, mataNilai: 8, lulus: true },
      { id: 'spm-g', label: 'G', kumpulan: 'Gagal', minMarkah: 0, maxMarkah: 39, mataNilai: 9, lulus: false },
    ],
  },
  {
    id: 'skema-menengah-rendah',
    nama: 'Skema Pentaksiran Sekolah / Menengah Rendah (6 Gred)',
    penerangan:
      'Skema 6 peringkat gred (A hingga F) untuk peperiksaan dalaman Tingkatan 1 hingga 4.',
    skalaMaksimum: 6,
    gunaGpmp: true,
    kaedahPengiraan:
      'GPMP & GPS Skala 1.00–6.00 (A=1, B=2, C=3, D=4, E=5, F=6) mengikut ketetapan Jawatankuasa Kurikulum Sekolah.',
    bands: [
      { id: 'mr-a', label: 'A', kumpulan: 'A', minMarkah: 82, maxMarkah: 100, mataNilai: 1, lulus: true },
      { id: 'mr-b', label: 'B', kumpulan: 'B', minMarkah: 66, maxMarkah: 81, mataNilai: 2, lulus: true },
      { id: 'mr-c', label: 'C', kumpulan: 'C', minMarkah: 50, maxMarkah: 65, mataNilai: 3, lulus: true },
      { id: 'mr-d', label: 'D', kumpulan: 'D', minMarkah: 40, maxMarkah: 49, mataNilai: 4, lulus: true },
      { id: 'mr-e', label: 'E', kumpulan: 'E', minMarkah: 30, maxMarkah: 39, mataNilai: 5, lulus: true },
      { id: 'mr-f', label: 'F', kumpulan: 'Gagal', minMarkah: 0, maxMarkah: 29, mataNilai: 6, lulus: false },
    ],
  },
  {
    id: 'skema-diagnostik',
    nama: 'Skema Ujian Diagnostik (Tanpa GPMP)',
    penerangan:
      'Skema khas saringan diagnostik yang menumpukan peratus lulus dan penguasaan asas tanpa pengiraan GPMP.',
    skalaMaksimum: 5,
    gunaGpmp: false,
    kaedahPengiraan:
      'Penilaian berasaskan peratus lulus (>= 40%) dan taburan penguasaan kumpulan gred tanpa indeks GPMP/GPS.',
    bands: [
      { id: 'dg-a', label: 'A', kumpulan: 'A', minMarkah: 80, maxMarkah: 100, mataNilai: 1, lulus: true },
      { id: 'dg-b', label: 'B', kumpulan: 'B', minMarkah: 65, maxMarkah: 79, mataNilai: 2, lulus: true },
      { id: 'dg-c', label: 'C', kumpulan: 'C', minMarkah: 50, maxMarkah: 64, mataNilai: 3, lulus: true },
      { id: 'dg-d', label: 'D', kumpulan: 'D', minMarkah: 40, maxMarkah: 49, mataNilai: 4, lulus: true },
      { id: 'dg-g', label: 'G', kumpulan: 'Gagal', minMarkah: 0, maxMarkah: 39, mataNilai: 5, lulus: false },
    ],
  },
];

export const INITIAL_ACADEMIC_EXAMS: AcademicExam[] = [
  {
    id: 'exm-2',
    kodPeperiksaan: 'PEP-2026-002',
    nama: 'Percubaan SPM 2026',
    tahun: '2026',
    tingkatan: 'Tingkatan 5',
    tarikh: '2026-10-20',
    jenis: 'Percubaan SPM',
    bilanganMuridSasaran: 12,
    status: 'Selesai',
    schemeId: 'skema-spm',
    catatan: 'Peperiksaan percubaan utama calon SPM SMK Salaping (data simulasi).',
  },
  {
    id: 'exm-1',
    kodPeperiksaan: 'PEP-2026-001',
    nama: 'Ujian Setara 1 2026',
    tahun: '2026',
    tingkatan: 'Tingkatan 5',
    tarikh: '2026-06-18',
    jenis: 'Ujian Setara',
    bilanganMuridSasaran: 12,
    status: 'Disahkan',
    schemeId: 'skema-spm',
    catatan: 'Penilaian garis asas pertengahan tahun bagi kohort Tingkatan 5.',
  },
  {
    id: 'exm-3',
    kodPeperiksaan: 'PEP-2026-003',
    nama: 'Pertengahan Tahun 2026 (T4)',
    tahun: '2026',
    tingkatan: 'Tingkatan 4',
    tarikh: '2026-07-15',
    jenis: 'Pertengahan Tahun',
    bilanganMuridSasaran: 6,
    status: 'Disahkan',
    schemeId: 'skema-menengah-rendah',
    catatan: 'Menggunakan Skema Pentaksiran Sekolah 6 gred (A hingga F).',
  },
];

export const INITIAL_ACADEMIC_SUBJECTS: AcademicSubject[] = [
  {
    id: 'sub-bm5',
    kod: '1103',
    nama: 'Bahasa Melayu',
    tingkatan: 'Tingkatan 5',
    guruMataPelajaran: 'Cikgu Siti Mariam binti Osman',
    ketuaPanitia: 'Cikgu Siti Mariam binti Osman',
    bilanganMuridSasaran: 12,
    bidang: 'Bahasa',
  },
  {
    id: 'sub-bi5',
    kod: '1119',
    nama: 'Bahasa Inggeris',
    tingkatan: 'Tingkatan 5',
    guruMataPelajaran: 'Puan Clarice Anak Banting',
    ketuaPanitia: 'Puan Clarice Anak Banting',
    bilanganMuridSasaran: 12,
    bidang: 'Bahasa',
  },
  {
    id: 'sub-mt5',
    kod: '1449',
    nama: 'Matematik',
    tingkatan: 'Tingkatan 5',
    guruMataPelajaran: 'Encik Raymond Mojilis',
    ketuaPanitia: 'Encik Raymond Mojilis',
    bilanganMuridSasaran: 12,
    bidang: 'Sains & Matematik',
  },
  {
    id: 'sub-sn5',
    kod: '1511',
    nama: 'Sains',
    tingkatan: 'Tingkatan 5',
    guruMataPelajaran: 'Puan Dayang Nurul Huda binti Ag Damit',
    ketuaPanitia: 'Puan Dayang Nurul Huda binti Ag Damit',
    bilanganMuridSasaran: 12,
    bidang: 'Sains & Matematik',
  },
  {
    id: 'sub-sj5',
    kod: '1249',
    nama: 'Sejarah',
    tingkatan: 'Tingkatan 5',
    guruMataPelajaran: 'Cikgu Evelyn Linus',
    ketuaPanitia: 'Cikgu Evelyn Linus',
    bilanganMuridSasaran: 12,
    bidang: 'Kemanusiaan',
  },
  {
    id: 'sub-pi5',
    kod: '1223',
    nama: 'Pendidikan Islam',
    tingkatan: 'Tingkatan 5',
    guruMataPelajaran: 'Ustaz Muhammad Hafiz bin Razak',
    ketuaPanitia: 'Ustaz Muhammad Hafiz bin Razak',
    bilanganMuridSasaran: 9,
    bidang: 'Kemanusiaan',
  },
  {
    id: 'sub-bm4',
    kod: '1103-T4',
    nama: 'Bahasa Melayu',
    tingkatan: 'Tingkatan 4',
    guruMataPelajaran: 'Cikgu Siti Mariam binti Osman',
    ketuaPanitia: 'Cikgu Siti Mariam binti Osman',
    bilanganMuridSasaran: 6,
    bidang: 'Bahasa',
  },
  {
    id: 'sub-mt4',
    kod: '1449-T4',
    nama: 'Matematik',
    tingkatan: 'Tingkatan 4',
    guruMataPelajaran: 'Encik Raymond Mojilis',
    ketuaPanitia: 'Encik Raymond Mojilis',
    bilanganMuridSasaran: 6,
    bidang: 'Sains & Matematik',
  },
];

// Senarai murid rekaan (Simulasi SMK Salaping) bagi penjanaan markah awal yang realistik
const T5_DEMO_STUDENTS: Array<{
  noIdMurid: string;
  namaMurid: string;
  kelas: string;
  islamic: boolean;
  // [BM, BI, MT, SN, SJ, PI] untuk Ujian Setara 1 & Percubaan SPM
  ex1: [number, number, number, number, number, number];
  ex2: [number, number, number, number, number, number];
}> = [
  {
    noIdMurid: 'SLP-2026-014',
    namaMurid: 'Amirul Hakim bin Roslan',
    kelas: '5 Ibnu Sina',
    islamic: true,
    ex1: [54, 34, 28, 42, 46, 58],
    ex2: [60, 32, 36, 46, 52, 64],
  },
  {
    noIdMurid: 'SLP-2026-029',
    namaMurid: 'Nurul Aina binti Zulkifli',
    kelas: '5 Al-Farabi',
    islamic: true,
    ex1: [84, 72, 76, 78, 82, 88],
    ex2: [91, 70, 84, 82, 86, 92],
  },
  {
    noIdMurid: 'SLP-2026-101',
    namaMurid: 'Daniel Petrus Mojuntin',
    kelas: '5 Al-Farabi',
    islamic: false,
    ex1: [76, 68, 82, 74, 71, 0],
    ex2: [82, 64, 88, 79, 77, 0],
  },
  {
    noIdMurid: 'SLP-2026-102',
    namaMurid: 'Siti Nurhaliza binti Awang',
    kelas: '5 Al-Farabi',
    islamic: true,
    ex1: [88, 79, 71, 75, 84, 90],
    ex2: [92, 76, 78, 80, 89, 94],
  },
  {
    noIdMurid: 'SLP-2026-103',
    namaMurid: 'Mohd Syafiq bin Harun',
    kelas: '5 Ibnu Sina',
    islamic: true,
    ex1: [58, 41, 35, 48, 52, 61],
    ex2: [65, 37, 42, 54, 59, 68],
  },
  {
    noIdMurid: 'SLP-2026-104',
    namaMurid: 'Melissa Anak Empawi',
    kelas: '5 Ibnu Sina',
    islamic: false,
    ex1: [66, 55, 44, 53, 60, 0],
    ex2: [71, 51, 52, 58, 66, 0],
  },
  {
    noIdMurid: 'SLP-2026-105',
    namaMurid: 'Farah Nadia binti Suhaimi',
    kelas: '5 Al-Farabi',
    islamic: true,
    ex1: [79, 66, 68, 71, 75, 81],
    ex2: [85, 62, 74, 76, 80, 86],
  },
  {
    noIdMurid: 'SLP-2026-106',
    namaMurid: 'Aiman Zikri bin Mazlan',
    kelas: '5 Cemerlang',
    islamic: true,
    ex1: [47, 36, 26, 38, 43, 55],
    ex2: [55, 34, 34, 41, 50, 62],
  },
  {
    noIdMurid: 'SLP-2026-107',
    namaMurid: 'Elviera Jolius',
    kelas: '5 Cemerlang',
    islamic: false,
    ex1: [62, 48, 39, 44, 54, 0],
    ex2: [68, 44, 45, 50, 61, 0],
  },
  {
    noIdMurid: 'SLP-2026-108',
    namaMurid: 'Muhammad Ikmal bin Azmi',
    kelas: '5 Cemerlang',
    islamic: true,
    ex1: [51, 38, 32, 41, 48, 56],
    ex2: [58, 35, 38, 47, 54, 63],
  },
  {
    noIdMurid: 'SLP-2026-109',
    namaMurid: 'Nurul Hidayah binti Jamil',
    kelas: '5 Ibnu Sina',
    islamic: true,
    ex1: [72, 60, 58, 63, 69, 77],
    ex2: [78, 56, 65, 68, 74, 83],
  },
  {
    noIdMurid: 'SLP-2026-110',
    namaMurid: 'Haziq Danial bin Kamarul',
    kelas: '5 Cemerlang',
    islamic: true,
    ex1: [44, 33, 29, 36, 41, 49],
    ex2: [52, 31, 35, 43, 47, 56],
  },
];

const T4_DEMO_STUDENTS: Array<{
  noIdMurid: string;
  namaMurid: string;
  kelas: string;
  bm: number;
  mt: number;
}> = [
  { noIdMurid: 'SLP-2026-052', namaMurid: 'Derrick Anak Lajang', kelas: '4 Wawasan', bm: 48, mt: 27 },
  { noIdMurid: 'SLP-2026-111', namaMurid: 'Alia Maisarah binti Razak', kelas: '4 Wawasan', bm: 83, mt: 74 },
  { noIdMurid: 'SLP-2026-112', namaMurid: 'Kevin Wong Ka Ming', kelas: '4 Wawasan', bm: 69, mt: 86 },
  { noIdMurid: 'SLP-2026-113', namaMurid: 'Norshahira binti Sabri', kelas: '4 Cekal', bm: 74, mt: 56 },
  { noIdMurid: 'SLP-2026-114', namaMurid: 'Mohd Aidil bin Salleh', kelas: '4 Cekal', bm: 59, mt: 38 },
  { noIdMurid: 'SLP-2026-115', namaMurid: 'Vanessa Anak Banting', kelas: '4 Cekal', bm: 64, mt: 52 },
];

function buildInitialScores(): AcademicScoreRecord[] {
  const records: AcademicScoreRecord[] = [];
  const t5SubIds = ['sub-bm5', 'sub-bi5', 'sub-mt5', 'sub-sn5', 'sub-sj5', 'sub-pi5'];

  T5_DEMO_STUDENTS.forEach((st) => {
    t5SubIds.forEach((subId, i) => {
      if (subId === 'sub-pi5' && !st.islamic) return;
      records.push({
        id: `sc-ex1-${subId}-${st.noIdMurid}`,
        examId: 'exm-1',
        subjectId: subId,
        noIdMurid: st.noIdMurid,
        namaMurid: st.namaMurid,
        kelas: st.kelas,
        markah: st.ex1[i],
        tarikhKemaskini: '2026-06-22',
      });
      records.push({
        id: `sc-ex2-${subId}-${st.noIdMurid}`,
        examId: 'exm-2',
        subjectId: subId,
        noIdMurid: st.noIdMurid,
        namaMurid: st.namaMurid,
        kelas: st.kelas,
        markah: st.ex2[i],
        tarikhKemaskini: '2026-10-25',
      });
    });
  });

  T4_DEMO_STUDENTS.forEach((st) => {
    records.push({
      id: `sc-ex3-bm4-${st.noIdMurid}`,
      examId: 'exm-3',
      subjectId: 'sub-bm4',
      noIdMurid: st.noIdMurid,
      namaMurid: st.namaMurid,
      kelas: st.kelas,
      markah: st.bm,
      tarikhKemaskini: '2026-07-19',
    });
    records.push({
      id: `sc-ex3-mt4-${st.noIdMurid}`,
      examId: 'exm-3',
      subjectId: 'sub-mt4',
      noIdMurid: st.noIdMurid,
      namaMurid: st.namaMurid,
      kelas: st.kelas,
      markah: st.mt,
      tarikhKemaskini: '2026-07-19',
    });
  });

  return records;
}

export const INITIAL_ACADEMIC_INTERVENTIONS: AcademicIntervention[] = [
  {
    id: 'aint-1',
    examId: 'exm-2',
    subjectId: 'sub-mt5',
    mataPelajaran: 'Matematik',
    kumpulanSasaran: 'Calon Gred G & E Tingkatan 5 (5 Ibnu Sina & 5 Cemerlang)',
    isuPencapaian: '4 daripada 12 calon sampel masih di bawah markah lulus 40% terutamanya dalam topik Algebra & Kebarangkalian.',
    objektif: 'Meningkatkan peratus lulus Matematik kepada 90% sebelum peperiksaan sebenar SPM.',
    strategiTindakan: 'Klinik Pecutan Akhir berfokus menggunakan modul 20 soalan asas kertas 1 & kertas 2.',
    guruBertanggungjawab: 'Encik Raymond Mojilis',
    tarikhPelaksanaan: '2026-11-04',
    status: 'Dalam Pelaksanaan',
    hasilPenilaian: 'Peningkatan purata +7.4 markah berbanding Ujian Setara 1.',
    dijanaSistem: false,
  },
  {
    id: 'aint-2',
    examId: 'exm-2',
    subjectId: 'sub-bi5',
    mataPelajaran: 'Bahasa Inggeris',
    kumpulanSasaran: 'Murid Tingkatan 5 kumpulan markah < 40%',
    isuPencapaian: 'Penurunan purata markah penulisan bahagian esei Kertas 2 dan perbendaharaan kata.',
    objektif: 'Mengurangkan bilangan calon gagal Bahasa Inggeris sebanyak 50% melalui bengkel penulisan berpandu.',
    strategiTindakan: 'Latihan templat karangan berstruktur CEFR dan sesi bacaan terpandu 30 minit setiap pagi.',
    guruBertanggungjawab: 'Puan Clarice Anak Banting',
    tarikhPelaksanaan: '2026-11-18',
    status: 'Belum Dilaksanakan',
    hasilPenilaian: 'Dijadualkan bermula minggu hadapan selepas semakan ketua panitia.',
    dijanaSistem: false,
  },
  {
    id: 'aint-3',
    examId: 'exm-2',
    subjectId: 'sub-bm5',
    mataPelajaran: 'Bahasa Melayu',
    kumpulanSasaran: 'Semua kelas Tingkatan 5 (5 Al-Farabi, 5 Ibnu Sina, 5 Cemerlang)',
    isuPencapaian: 'Pemantapan penguasaan teknik rumusan dan karangan respons terbuka untuk mengekalkan 100% lulus.',
    objektif: 'Mengekalkan 100% lulus dan menambah bilangan gred A+ / A kepada 40%.',
    strategiTindakan: 'Bengkel Teknik Menjawab Pemahaman & Tatabahasa serta semakan berkala guru.',
    guruBertanggungjawab: 'Cikgu Siti Mariam binti Osman',
    tarikhPelaksanaan: '2026-10-28',
    status: 'Selesai',
    hasilPenilaian: '100% calon mencapai tahap lulus dengan purata markah meningkat daripada 64.3% kepada 71.4%.',
    dijanaSistem: false,
  },
];

export const INITIAL_ACADEMIC_V14_STATE: AcademicV14State = {
  exams: INITIAL_ACADEMIC_EXAMS,
  subjects: INITIAL_ACADEMIC_SUBJECTS,
  scores: buildInitialScores(),
  gradeSchemes: INITIAL_GRADE_SCHEMES,
  interventions: INITIAL_ACADEMIC_INTERVENTIONS,
};
