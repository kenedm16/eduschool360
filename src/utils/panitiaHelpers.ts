import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  PanitiaActivity,
  PanitiaActivityStatus,
  PanitiaDocument,
  PanitiaDocumentCategory,
  PanitiaItem,
  PanitiaMeeting,
  PanitiaPlanCategory,
  UserRole,
} from '../types/eduschool';
import { formatCurrencyRM, formatMalayFullDate, formatShortDate } from './formatters';
import { ROLE_PROFILES } from './rolePermissions';

export const PANITIA_BIDANG_OPTIONS = [
  'Bahasa',
  'Sains & Matematik',
  'Kemanusiaan',
  'Teknik & Vokasional',
];

export const PANITIA_PLAN_CATEGORIES: PanitiaPlanCategory[] = [
  'Perancangan Aktiviti',
  'Program Peningkatan Akademik',
  'Perancangan PLC',
];

export const PANITIA_ACTIVITY_STATUSES: PanitiaActivityStatus[] = [
  'Dirancang',
  'Sedang Berjalan',
  'Selesai',
  'Ditangguh',
];

export const PANITIA_DOC_CATEGORIES: PanitiaDocumentCategory[] = [
  'Fail Pengurusan',
  'Minit Mesyuarat',
  'Perancangan Tahunan',
  'Laporan Aktiviti',
  'Rekod Kewangan',
  'PLC',
  'Analisis Peperiksaan',
  'Evidens PdP',
  'Laporan Pencapaian',
];

export const PANITIA_FINANCE_SOURCES = [
  'PCG Mata Pelajaran Teras',
  'PCG Mata Pelajaran Elektif',
  'Bantuan Perkapita Kerajaan',
  'Sumbangan PIBG / Komuniti',
  'Peruntukan Khas Kecemerlangan',
];

export function getPanitiaCode(pan: PanitiaItem, indexFallback = 0): string {
  if (pan.kodPanitia && pan.kodPanitia.trim()) return pan.kodPanitia.trim();
  const numMatch = pan.id.match(/(\d+)$/);
  const num = numMatch ? Number(numMatch[1]) : indexFallback + 1;
  const norm = num > 999 ? (num % 900) + 100 : num;
  return `PAN-2026-${String(norm).padStart(3, '0')}`;
}

export function generateNextPanitiaCode(list: PanitiaItem[]): string {
  const existing = new Set(list.map((p, idx) => getPanitiaCode(p, idx)));
  let maxNum = list.length;
  existing.forEach((code) => {
    const m = code.match(/PAN-\d{4}-(\d+)/i);
    if (m) {
      const val = Number(m[1]);
      if (val > maxNum) maxNum = val;
    }
  });
  let candidateNum = maxNum + 1;
  let candidate = `PAN-2026-${String(candidateNum).padStart(3, '0')}`;
  while (existing.has(candidate)) {
    candidateNum += 1;
    candidate = `PAN-2026-${String(candidateNum).padStart(3, '0')}`;
  }
  return candidate;
}

export function normalizePanitiaItem(pan: PanitiaItem, index = 0): PanitiaItem {
  const kodPanitia = getPanitiaCode(pan, index);
  const ahli = Array.isArray(pan.ahli) && pan.ahli.length > 0 ? pan.ahli : [pan.ketuaPanitia];
  const setiausaha = pan.setiausaha || ahli[1] || ahli[0] || pan.ketuaPanitia;

  const plans = (pan.perancanganTahunan ?? []).map((pl, pIdx) => ({
    ...pl,
    kategori: pl.kategori || 'Perancangan Aktiviti',
    tarikhMula: pl.tarikhMula || `2026-${String(((pIdx * 2) % 10) + 2).padStart(2, '0')}-05`,
    tarikhAkhir: pl.tarikhAkhir || `2026-${String(((pIdx * 2) % 10) + 2).padStart(2, '0')}-20`,
    pegawai: pl.pegawai || pan.ketuaPanitia,
  }));

  const finances = (pan.rekodKewangan ?? []).map((fin) => ({
    ...fin,
    tahunKewangan: fin.tahunKewangan || fin.tarikh?.slice(0, 4) || '2026',
    sumberPeruntukan:
      fin.sumberPeruntukan ||
      (fin.jenis === 'Peruntukan' ? 'PCG Mata Pelajaran Teras' : 'Tabung PCG Panitia'),
    namaPembekal: fin.namaPembekal || (fin.jenis === 'Perbelanjaan' ? 'Pembekal Berdaftar SMK Salaping' : '-'),
    noInvois: fin.noInvois || (fin.jenis === 'Perbelanjaan' ? `INV-${fin.id.toUpperCase()}` : '-'),
    catatan: fin.catatan || '',
  }));

  const detailedActivities: PanitiaActivity[] =
    pan.aktivitiTerperinci && pan.aktivitiTerperinci.length > 0
      ? pan.aktivitiTerperinci
      : (pan.aktivitiTerkini ?? []).map((act, aIdx) => ({
          id: `act-${pan.id}-${aIdx + 1}`,
          panitiaId: pan.id,
          nama: act,
          objektif: `Meningkatkan penguasaan dan minat murid dalam ${pan.nama}.`,
          tarikh: `2026-${String(((aIdx + 4) % 11) + 1).padStart(2, '0')}-15`,
          tempat: 'Dewan Salaping / Bilik Darjah',
          sasaranPeserta: 'Murid Tingkatan 4 & 5',
          penyelaras: pan.ketuaPanitia,
          anggaranPerbelanjaan: 350,
          perbelanjaanSebenar: 320,
          status: aIdx === 0 ? 'Selesai' : 'Sedang Berjalan',
          hasilImpak: 'Penglibatan murid sangat menggalakkan dan peningkatan skor latihan direkodkan.',
        }));

  const meetings: PanitiaMeeting[] =
    pan.mesyuarat && pan.mesyuarat.length > 0
      ? pan.mesyuarat
      : [
          {
            id: `mtg-${pan.id}-1`,
            panitiaId: pan.id,
            bilangan: 'Bil. 1/2026',
            tajuk: `Mesyuarat ${pan.nama} Kali Pertama 2026`,
            tarikh: '2026-02-18',
            masa: '14:00 - 15:30',
            tempat: 'Bilik Gerakan SMK Salaping',
            kehadiran: ahli,
            agenda:
              '1. Perutusan Pengerusi\n2. Pengesahan Minit Lalu\n3. Perancangan Tahunan & Agihan PCG\n4. Hal-hal Lain',
            minit:
              'Ketua Panitia membentangkan fokus kurikulum tahun 2026 dan jadual pencerapan PdP serta program PLC berkala.',
            keputusan:
              'Ahli panitia bersetuju melaksanakan sekurang-kurangnya dua program peningkatan akademik dan dua sesi PLC pada penggal semasa.',
            tindakanSusulan:
              'Menyediakan kertas kerja program pertama dan mengemaskini fail induk panitia.',
            pegawaiBertanggungjawab: setiausaha,
          },
        ];

  const docs: PanitiaDocument[] = (pan.dokumenPanitia ?? []).map((d) => ({
    ...d,
    panitiaId: pan.id,
    modSimulasi: true,
  }));

  return {
    ...pan,
    kodPanitia,
    setiausaha,
    ahli,
    tahunSemasa: pan.tahunSemasa || '2026',
    tarikhPenubuhan: pan.tarikhPenubuhan || '2016-01-04',
    statusAktif: pan.statusAktif || 'Aktif',
    objektifPanitia:
      pan.objektifPanitia ||
      `Memperkukuh kualiti pengajaran dan pembelajaran serta melonjakkan pencapaian murid dalam ${pan.nama}.`,
    sasaranPencapaian:
      pan.sasaranPencapaian ||
      'Mencapai sekurang-kurangnya 95% kelulusan dan peningkatan GPMP sekurang-kurangnya 0.20 mata.',
    rumusanTahunan:
      pan.rumusanTahunan ||
      'Pelaksanaan aktiviti kurikulum, PLC dan penggunaan peruntukan PCG berjalan mengikut jadual yang dirancang.',
    cadanganPenambahbaikan:
      pan.cadanganPenambahbaikan ||
      'Memperluas bimbingan berfokus murid galus serta perkongsian amalan terbaik PdP digital.',
    perancanganTahunan: plans,
    rekodKewangan: finances,
    aktivitiTerperinci: detailedActivities,
    mesyuarat: meetings,
    dokumenPanitia: docs,
  };
}

export function computePanitiaFinanceSummary(pan: PanitiaItem) {
  const peruntukan = pan.rekodKewangan
    .filter((f) => f.jenis === 'Peruntukan')
    .reduce((sum, f) => sum + Number(f.jumlah || 0), 0);
  const perbelanjaan = pan.rekodKewangan
    .filter((f) => f.jenis === 'Perbelanjaan')
    .reduce((sum, f) => sum + Number(f.jumlah || 0), 0);
  const baki = peruntukan - perbelanjaan;
  const peratusPenggunaan =
    peruntukan > 0 ? Math.min(100, Math.round((perbelanjaan / peruntukan) * 100)) : 0;

  return { peruntukan, perbelanjaan, baki, peratusPenggunaan };
}

export function computeAllPanitiaStats(panitiaList: PanitiaItem[]) {
  const jumlahPanitia = panitiaList.length;
  const jumlahAktiviti = panitiaList.reduce(
    (sum, p) =>
      sum +
      ((p.aktivitiTerperinci && p.aktivitiTerperinci.length > 0
        ? p.aktivitiTerperinci.length
        : p.aktivitiTerkini.length) || 0),
    0
  );
  const jumlahMesyuarat = panitiaList.reduce(
    (sum, p) => sum + (p.mesyuarat?.length ?? 0),
    0
  );
  let jumlahPeruntukan = 0;
  let jumlahPerbelanjaan = 0;
  panitiaList.forEach((p) => {
    const fin = computePanitiaFinanceSummary(p);
    jumlahPeruntukan += fin.peruntukan;
    jumlahPerbelanjaan += fin.perbelanjaan;
  });
  const bakiPeruntukan = jumlahPeruntukan - jumlahPerbelanjaan;

  return {
    jumlahPanitia,
    jumlahAktiviti,
    jumlahMesyuarat,
    jumlahPeruntukan,
    jumlahPerbelanjaan,
    bakiPeruntukan,
  };
}

export interface PanitiaRoleControl {
  scopeLabel: string;
  description: string;
  canCreatePanitia: boolean;
  canEditPanitiaProfile: boolean;
  canDeletePanitia: boolean;
  canManageSubRecords: boolean;
  canUploadDocuments: boolean;
  canExportReports: boolean;
}

export function getPanitiaRoleControl(role: UserRole): PanitiaRoleControl {
  switch (role) {
    case 'Super Admin':
      return {
        scopeLabel: 'Semua Panitia (Akses Keseluruhan)',
        description:
          'Capaian penuh untuk mencipta, mengemaskini, memadam panitia serta mengurus semua rekod mesyuarat, aktiviti, kewangan dan dokumen.',
        canCreatePanitia: true,
        canEditPanitiaProfile: true,
        canDeletePanitia: true,
        canManageSubRecords: true,
        canUploadDocuments: true,
        canExportReports: true,
      };
    case 'Pengetua':
      return {
        scopeLabel: 'Pemantauan Semua Panitia',
        description:
          'Memantau prestasi, kewangan PCG, mesyuarat dan laporan tahunan kesemua panitia sekolah (mod pemantauan baca sahaja).',
        canCreatePanitia: false,
        canEditPanitiaProfile: false,
        canDeletePanitia: false,
        canManageSubRecords: false,
        canUploadDocuments: false,
        canExportReports: true,
      };
    case 'Penolong Kanan':
      return {
        scopeLabel: 'Pemantauan & Penyelarasan Mengikut Bidang',
        description:
          'Memantau dan menyelaras perancangan tahunan, aktiviti, mesyuarat serta laporan panitia merentasi semua bidang.',
        canCreatePanitia: true,
        canEditPanitiaProfile: true,
        canDeletePanitia: false,
        canManageSubRecords: true,
        canUploadDocuments: true,
        canExportReports: true,
      };
    case 'Ketua Bidang':
      return {
        scopeLabel: 'Panitia Bidang Sains & Matematik',
        description:
          'Memantau dan mengurus panitia di bawah Bidang Sains & Matematik serta menyemak laporan pencapaian dan PCG bidang.',
        canCreatePanitia: false,
        canEditPanitiaProfile: true,
        canDeletePanitia: false,
        canManageSubRecords: true,
        canUploadDocuments: true,
        canExportReports: true,
      };
    case 'Ketua Panitia':
      return {
        scopeLabel: 'Pengurusan Panitia Sendiri (Panitia Matematik)',
        description:
          'Mengurus profil, ahli, perancangan tahunan, mesyuarat, transaksi kewangan PCG, aktiviti dan dokumen panitia sendiri.',
        canCreatePanitia: false,
        canEditPanitiaProfile: true,
        canDeletePanitia: false,
        canManageSubRecords: true,
        canUploadDocuments: true,
        canExportReports: true,
      };
    case 'Guru':
      return {
        scopeLabel: 'Akses Maklumat Panitia Berkaitan',
        description:
          'Melihat perancangan, minit mesyuarat, aktiviti dan memuat naik evidens PdP bagi panitia yang dianggotai.',
        canCreatePanitia: false,
        canEditPanitiaProfile: false,
        canDeletePanitia: false,
        canManageSubRecords: false,
        canUploadDocuments: true,
        canExportReports: true,
      };
    case 'Staf':
      return {
        scopeLabel: 'Akses Terhad (Paparan Rujukan)',
        description: 'Paparan rujukan maklumat asas panitia dalam mod simulasi.',
        canCreatePanitia: false,
        canEditPanitiaProfile: false,
        canDeletePanitia: false,
        canManageSubRecords: false,
        canUploadDocuments: false,
        canExportReports: false,
      };
  }
}

export function filterPanitiasByRoleScope(
  panitiaList: PanitiaItem[],
  role: UserRole
): PanitiaItem[] {
  const profile = ROLE_PROFILES[role];
  switch (role) {
    case 'Super Admin':
    case 'Pengetua':
    case 'Penolong Kanan':
      return panitiaList;
    case 'Ketua Bidang':
      return panitiaList.filter((p) => p.bidang === 'Sains & Matematik');
    case 'Ketua Panitia':
      return panitiaList.filter(
        (p) =>
          p.ketuaPanitia.toLowerCase().includes('raymond') ||
          p.nama.toLowerCase().includes('matematik')
      );
    case 'Guru':
      return panitiaList.filter(
        (p) =>
          p.ketuaPanitia === profile.userName ||
          p.ahli.some((a) => a.toLowerCase().includes('siti mariam'))
      );
    case 'Staf':
      return panitiaList;
  }
}

function addPanitiaPdfHeader(doc: jsPDF, subtitle: string) {
  doc.setFillColor(16, 45, 70);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 32, 'F');
  doc.setTextColor(240, 185, 11);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('EDUSCHOOL 360 · SMK SALAPING, SABAH', 14, 12);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text(subtitle, 14, 20);
  doc.setFontSize(8);
  doc.setTextColor(210, 220, 230);
  doc.text(
    `DATA DEMONSTRASI (BUKAN REKOD SEBENAR) | Dijana: ${formatMalayFullDate(new Date())}`,
    14,
    27
  );
}

export function exportMeetingMinutesToPDF(
  panitia: PanitiaItem,
  meeting: PanitiaMeeting
): string {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  addPanitiaPdfHeader(
    doc,
    `MINIT MESYUARAT ${panitia.nama.toUpperCase()} (${meeting.bilangan})`
  );

  autoTable(doc, {
    startY: 38,
    head: [['Maklumat Mesyuarat', 'Butiran']],
    body: [
      ['Panitia & Bidang', `${panitia.nama} (${panitia.bidang})`],
      ['Bilangan / Tajuk', `${meeting.bilangan} - ${meeting.tajuk}`],
      ['Tarikh & Masa', `${formatShortDate(meeting.tarikh)} · ${meeting.masa}`],
      ['Tempat', meeting.tempat],
      ['Kehadiran Ahli', `${meeting.kehadiran.length} orang: ${meeting.kehadiran.join(', ')}`],
      ['Pegawai Bertanggungjawab', meeting.pegawaiBertanggungjawab],
    ],
    theme: 'grid',
    headStyles: { fillColor: [16, 45, 70], textColor: [240, 185, 11] },
    styles: { fontSize: 8.5, cellPadding: 2.8 },
  });

  const y1 = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  autoTable(doc, {
    startY: y1,
    head: [['Perkara', 'Catatan Rasmi (Mod Simulasi)']],
    body: [
      ['Agenda Mesyuarat', meeting.agenda || '-'],
      ['Ringkasan Minit', meeting.minit || '-'],
      ['Keputusan Mesyuarat', meeting.keputusan || '-'],
      ['Tindakan Susulan', meeting.tindakanSusulan || '-'],
    ],
    theme: 'striped',
    headStyles: { fillColor: [16, 45, 70], textColor: [255, 255, 255] },
    styles: { fontSize: 8.5, cellPadding: 3 },
  });

  const safeName = panitia.nama.replace(/\s+/g, '_');
  const fileName = `Minit_${safeName}_${meeting.bilangan.replace(/[^a-zA-Z0-9]/g, '')}_Simulasi.pdf`;
  doc.save(fileName);
  return fileName;
}

export function exportActivityReportToPDF(
  panitia: PanitiaItem,
  activity: PanitiaActivity
): string {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  addPanitiaPdfHeader(doc, `LAPORAN AKTIVITI ${panitia.nama.toUpperCase()}`);

  autoTable(doc, {
    startY: 38,
    head: [['Komponen Laporan Aktiviti', 'Maklumat']],
    body: [
      ['Nama Panitia', `${panitia.nama} (${panitia.bidang})`],
      ['Nama Aktiviti', activity.nama],
      ['Objektif', activity.objektif],
      ['Tarikh & Tempat', `${formatShortDate(activity.tarikh)} · ${activity.tempat}`],
      ['Sasaran Peserta', activity.sasaranPeserta],
      ['Penyelaras', activity.penyelaras],
      ['Status Pelaksanaan', activity.status],
      ['Anggaran Perbelanjaan', formatCurrencyRM(activity.anggaranPerbelanjaan)],
      ['Perbelanjaan Sebenar', formatCurrencyRM(activity.perbelanjaanSebenar)],
      ['Hasil & Impak Aktiviti', activity.hasilImpak],
    ],
    theme: 'grid',
    headStyles: { fillColor: [16, 45, 70], textColor: [240, 185, 11] },
    styles: { fontSize: 8.8, cellPadding: 3 },
  });

  const fileName = `Laporan_Aktiviti_${panitia.nama.replace(/\s+/g, '_')}_Simulasi.pdf`;
  doc.save(fileName);
  return fileName;
}

export function exportPanitiaAnnualReportToPDF(panitia: PanitiaItem): string {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const fin = computePanitiaFinanceSummary(panitia);
  const plans = panitia.perancanganTahunan ?? [];
  const meetings = panitia.mesyuarat ?? [];
  const activities = panitia.aktivitiTerperinci ?? [];
  const docs = panitia.dokumenPanitia ?? [];

  addPanitiaPdfHeader(
    doc,
    `LAPORAN TAHUNAN ${panitia.nama.toUpperCase()} · SESI ${panitia.tahunSemasa || '2026'}`
  );

  let yPos = 38;
  const appendTitle = (txt: string) => {
    if (yPos > 255) {
      doc.addPage();
      yPos = 20;
    }
    doc.setTextColor(16, 45, 70);
    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.text(txt, 14, yPos);
    yPos += 3.5;
  };

  appendTitle('1. Profil Panitia & 2. Senarai Ahli');
  autoTable(doc, {
    startY: yPos,
    head: [['Medan Profil', 'Butiran']],
    body: [
      ['ID & Nama Panitia', `${getPanitiaCode(panitia)} · ${panitia.nama}`],
      ['Bidang & Status', `${panitia.bidang} · ${panitia.statusAktif || 'Aktif'}`],
      ['Ketua Panitia', panitia.ketuaPanitia],
      ['Setiausaha', panitia.setiausaha || '-'],
      ['Tahun & Tarikh Penubuhan', `${panitia.tahunSemasa || '2026'} (Ditubuhkan: ${formatShortDate(panitia.tarikhPenubuhan || '2016-01-04')})`],
      ['Senarai Ahli (' + panitia.ahli.length + ')', panitia.ahli.join(', ')],
      ['Objektif Panitia', panitia.objektifPanitia || '-'],
      ['Sasaran Pencapaian', panitia.sasaranPencapaian || '-'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [16, 45, 70], textColor: [240, 185, 11] },
    styles: { fontSize: 8, cellPadding: 2.2 },
  });
  yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  appendTitle(`3. Perancangan Tahunan (${plans.length} Pelan)`);
  autoTable(doc, {
    startY: yPos,
    head: [['Kategori', 'Aktiviti / Program', 'Sasaran', 'Tempoh', 'Status']],
    body: plans.length > 0
      ? plans.map((p) => [p.kategori || 'Aktiviti', p.aktiviti, p.sasaran, p.tempoh, p.status])
      : [['-', 'Tiada perancangan direkodkan', '-', '-', '-']],
    theme: 'striped',
    headStyles: { fillColor: [16, 45, 70], textColor: [255, 255, 255] },
    styles: { fontSize: 7.8, cellPadding: 2 },
  });
  yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  appendTitle(`4. Rekod Mesyuarat (${meetings.length} Mesyuarat)`);
  autoTable(doc, {
    startY: yPos,
    head: [['Bilangan', 'Tajuk', 'Tarikh', 'Tempat', 'Kehadiran', 'Keputusan Ringkas']],
    body: meetings.length > 0
      ? meetings.map((m) => [
          m.bilangan,
          m.tajuk,
          formatShortDate(m.tarikh),
          m.tempat,
          `${m.kehadiran.length} ahli`,
          m.keputusan,
        ])
      : [['-', 'Tiada mesyuarat direkodkan', '-', '-', '-', '-']],
    theme: 'striped',
    headStyles: { fillColor: [16, 45, 70], textColor: [255, 255, 255] },
    styles: { fontSize: 7.8, cellPadding: 2 },
  });
  yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  appendTitle(`5. Rekod Aktiviti & Program (${activities.length} Aktiviti)`);
  autoTable(doc, {
    startY: yPos,
    head: [['Nama Aktiviti', 'Tarikh', 'Penyelaras', 'Anggaran', 'Sebenar', 'Status']],
    body: activities.length > 0
      ? activities.map((a) => [
          a.nama,
          formatShortDate(a.tarikh),
          a.penyelaras,
          formatCurrencyRM(a.anggaranPerbelanjaan),
          formatCurrencyRM(a.perbelanjaanSebenar),
          a.status,
        ])
      : [['Tiada aktiviti direkodkan', '-', '-', '-', '-', '-']],
    theme: 'striped',
    headStyles: { fillColor: [16, 45, 70], textColor: [255, 255, 255] },
    styles: { fontSize: 7.8, cellPadding: 2 },
  });
  yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  appendTitle('6. Rekod Kewangan PCG');
  autoTable(doc, {
    startY: yPos,
    head: [['Tarikh', 'Perkara / Tujuan', 'Jenis', 'Pembekal / Sumber', 'No. Invois', 'Jumlah']],
    body: [
      ...panitia.rekodKewangan.map((f) => [
        formatShortDate(f.tarikh),
        f.perkara,
        f.jenis,
        f.jenis === 'Peruntukan' ? f.sumberPeruntukan || '-' : f.namaPembekal || '-',
        f.noInvois || '-',
        formatCurrencyRM(f.jumlah),
      ]),
      [
        'RINGKASAN',
        `Peruntukan: ${formatCurrencyRM(fin.peruntukan)}`,
        `Belanja: ${formatCurrencyRM(fin.perbelanjaan)}`,
        `Penggunaan: ${fin.peratusPenggunaan}%`,
        'Baki Semasa',
        formatCurrencyRM(fin.baki),
      ],
    ],
    theme: 'grid',
    headStyles: { fillColor: [16, 45, 70], textColor: [240, 185, 11] },
    styles: { fontSize: 7.8, cellPadding: 2 },
  });
  yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  const doneActivities = activities.filter((a) => a.status === 'Selesai').length;
  appendTitle('7. Analisis Pencapaian & 8. Rumusan / Cadangan Penambahbaikan');
  autoTable(doc, {
    startY: yPos,
    head: [['Bahagian', 'Ringkasan Laporan Tahunan']],
    body: [
      [
        'Analisis Pelaksanaan',
        `${doneActivities} daripada ${activities.length} aktiviti telah selesai dilaksanakan · ${meetings.length} mesyuarat direkodkan · ${docs.length} dokumen arkib · Penggunaan kewangan ${fin.peratusPenggunaan}%.`,
      ],
      ['Rumusan Tahunan', panitia.rumusanTahunan || '-'],
      ['Cadangan Penambahbaikan', panitia.cadanganPenambahbaikan || '-'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [16, 45, 70], textColor: [240, 185, 11] },
    styles: { fontSize: 8.2, cellPadding: 2.5 },
  });

  const fileName = `Laporan_Tahunan_${panitia.nama.replace(/\s+/g, '_')}_Simulasi.pdf`;
  doc.save(fileName);
  return fileName;
}

export function exportPanitiaAnnualReportToExcel(panitia: PanitiaItem): string {
  const wb = XLSX.utils.book_new();
  const fin = computePanitiaFinanceSummary(panitia);

  const addSheet = (name: string, rows: Record<string, string | number>[]) => {
    const ws = XLSX.utils.json_to_sheet(
      rows.length > 0 ? rows : [{ Catatan: 'Tiada rekod buat masa ini (Data Demonstrasi)' }]
    );
    XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
  };

  addSheet('Profil_dan_Analisis', [
    { Perkara: 'ID Panitia', Nilai: getPanitiaCode(panitia) },
    { Perkara: 'Nama Panitia', Nilai: panitia.nama },
    { Perkara: 'Bidang', Nilai: panitia.bidang },
    { Perkara: 'Ketua Panitia', Nilai: panitia.ketuaPanitia },
    { Perkara: 'Setiausaha', Nilai: panitia.setiausaha || '-' },
    { Perkara: 'Bilangan Ahli', Nilai: panitia.ahli.length },
    { Perkara: 'Senarai Ahli', Nilai: panitia.ahli.join(', ') },
    { Perkara: 'Objektif', Nilai: panitia.objektifPanitia || '-' },
    { Perkara: 'Sasaran Pencapaian', Nilai: panitia.sasaranPencapaian || '-' },
    { Perkara: 'Jumlah Peruntukan (RM)', Nilai: fin.peruntukan },
    { Perkara: 'Jumlah Perbelanjaan (RM)', Nilai: fin.perbelanjaan },
    { Perkara: 'Baki Semasa (RM)', Nilai: fin.baki },
    { Perkara: 'Peratus Penggunaan (%)', Nilai: fin.peratusPenggunaan },
    { Perkara: 'Rumusan Tahunan', Nilai: panitia.rumusanTahunan || '-' },
    { Perkara: 'Cadangan Penambahbaikan', Nilai: panitia.cadanganPenambahbaikan || '-' },
  ]);

  addSheet(
    'Perancangan_Tahunan',
    (panitia.perancanganTahunan ?? []).map((p) => ({
      Kategori: p.kategori || 'Perancangan Aktiviti',
      Aktiviti: p.aktiviti,
      Sasaran: p.sasaran,
      Tempoh: p.tempoh,
      Pegawai: p.pegawai || panitia.ketuaPanitia,
      Status: p.status,
    }))
  );

  addSheet(
    'Rekod_Mesyuarat',
    (panitia.mesyuarat ?? []).map((m) => ({
      Bilangan: m.bilangan,
      Tajuk: m.tajuk,
      Tarikh: m.tarikh,
      Masa: m.masa,
      Tempat: m.tempat,
      Bilangan_Hadir: m.kehadiran.length,
      Keputusan: m.keputusan,
      Tindakan_Susulan: m.tindakanSusulan,
    }))
  );

  addSheet(
    'Aktiviti_Program',
    (panitia.aktivitiTerperinci ?? []).map((a) => ({
      Nama_Aktiviti: a.nama,
      Tarikh: a.tarikh,
      Tempat: a.tempat,
      Penyelaras: a.penyelaras,
      Anggaran_RM: a.anggaranPerbelanjaan,
      Sebenar_RM: a.perbelanjaanSebenar,
      Status: a.status,
      Hasil_Impak: a.hasilImpak,
    }))
  );

  addSheet(
    'Kewangan_PCG',
    panitia.rekodKewangan.map((f) => ({
      Tahun: f.tahunKewangan || '2026',
      Tarikh: f.tarikh,
      Jenis: f.jenis,
      Perkara: f.perkara,
      Sumber_atau_Pembekal: f.jenis === 'Peruntukan' ? f.sumberPeruntukan || '-' : f.namaPembekal || '-',
      No_Invois: f.noInvois || '-',
      Jumlah_RM: f.jumlah,
      Catatan: f.catatan || '',
    }))
  );

  addSheet(
    'Dokumentasi',
    (panitia.dokumenPanitia ?? []).map((d) => ({
      Kategori: d.kategori,
      Nama_Dokumen: d.namaDokumen,
      Tarikh: d.tarikh,
      Pemilik: d.pemilik,
      Format: d.format,
      Saiz: d.saiz,
      Catatan: d.catatan,
    }))
  );

  const fileName = `Laporan_Tahunan_${panitia.nama.replace(/\s+/g, '_')}_Simulasi.xlsx`;
  XLSX.writeFile(wb, fileName);
  return fileName;
}

export function exportPanitiaSummaryToCSV(panitia: PanitiaItem): string {
  const fin = computePanitiaFinanceSummary(panitia);
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;

  const lines: string[] = [
    esc(`EDUSCHOOL 360 - LAPORAN TAHUNAN ${panitia.nama.toUpperCase()} (DATA DEMONSTRASI)`),
    [
      'ID Panitia',
      'Nama Panitia',
      'Bidang',
      'Ketua Panitia',
      'Setiausaha',
      'Ahli',
      'Peruntukan (RM)',
      'Perbelanjaan (RM)',
      'Baki (RM)',
      'Bil Perancangan',
      'Bil Mesyuarat',
      'Bil Aktiviti',
      'Bil Dokumen',
    ]
      .map(esc)
      .join(','),
    [
      getPanitiaCode(panitia),
      panitia.nama,
      panitia.bidang,
      panitia.ketuaPanitia,
      panitia.setiausaha || '-',
      panitia.ahli.length,
      fin.peruntukan,
      fin.perbelanjaan,
      fin.baki,
      panitia.perancanganTahunan.length,
      panitia.mesyuarat?.length ?? 0,
      panitia.aktivitiTerperinci?.length ?? 0,
      panitia.dokumenPanitia?.length ?? 0,
    ]
      .map(esc)
      .join(','),
  ];

  const csv = '\uFEFF' + lines.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const fileName = `Ringkasan_${panitia.nama.replace(/\s+/g, '_')}_Simulasi.csv`;
  const a = document.createElement('a');
  a.href = url;
  a.setAttribute('download', fileName);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return fileName;
}

export function downloadDemoPanitiaDocument(
  panitia: PanitiaItem,
  docItem: PanitiaDocument
): string {
  const content = [
    `EDUSCHOOL 360 · SMK SALAPING, SABAH`,
    `DOKUMEN SIMULASI PANITIA (BUKAN FAIL AWAN SEBENAR)`,
    `================================================`,
    `Panitia        : ${panitia.nama} (${getPanitiaCode(panitia)})`,
    `Kategori       : ${docItem.kategori}`,
    `Nama Dokumen   : ${docItem.namaDokumen}`,
    `Tarikh Rekod   : ${docItem.tarikh}`,
    `Pemilik        : ${docItem.pemilik}`,
    `Format / Saiz  : ${docItem.format} (${docItem.saiz})`,
    `Catatan        : ${docItem.catatan || '-'}`,
    ``,
    `Nota: Dokumen ini dijana oleh prototaip tempatan EDUSCHOOL 360.`,
  ].join('\n');

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const fileName = `${docItem.namaDokumen.replace(/[^a-zA-Z0-9._-]/g, '_')}_Simulasi.txt`;
  const a = document.createElement('a');
  a.href = url;
  a.setAttribute('download', fileName);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return fileName;
}
