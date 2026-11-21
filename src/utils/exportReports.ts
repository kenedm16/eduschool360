import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { EduSchoolState, UserRole } from '../types/eduschool';
import { calculateGPMP } from './academicCalcHelper';
import { formatCurrencyRM, formatMalayFullDate, formatShortDate } from './formatters';
import { computeSchoolStats } from './reportHelpers';
import { getRoleDisplayLabel } from './rolePermissions';

export type ReportScope =
  | 'eksekutif'
  | 'tugasan'
  | 'akademik'
  | 'panitia'
  | 'program'
  | 'murid_aset';

export const REPORT_SCOPE_LABELS: Record<ReportScope, string> = {
  eksekutif: 'Ringkasan Eksekutif Sekolah',
  tugasan: 'Laporan Pengurusan Tugasan',
  akademik: 'Laporan Akademik (GPS & GPMP)',
  panitia: 'Laporan Panitia & Kewangan PCG',
  program: 'Laporan Program Sekolah',
  murid_aset: 'Laporan Pemantauan Murid & Aset',
};

function addPdfHeader(doc: jsPDF, title: string, activeRole: UserRole) {
  doc.setFillColor(16, 45, 70); // Navy #102D46
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 32, 'F');

  doc.setTextColor(240, 185, 11); // Amber Gold #F0B90B
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('EDUSCHOOL 360 · SMK SALAPING, SABAH', 14, 13);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(title, 14, 21);

  doc.setFontSize(8);
  doc.setTextColor(210, 220, 230);
  doc.text(
    `DATA DEMONSTRASI (BUKAN REKOD SEBENAR) | Peranan: ${getRoleDisplayLabel(activeRole)} | Dijana: ${formatMalayFullDate(new Date())}`,
    14,
    27
  );
}

export function exportReportToPDF(
  scope: ReportScope,
  state: EduSchoolState,
  activeRole: UserRole
): string {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const stats = computeSchoolStats(state);
  const title = REPORT_SCOPE_LABELS[scope];
  addPdfHeader(doc, title, activeRole);

  let yPos = 40;

  const appendSectionTitle = (label: string) => {
    if (yPos > 260) {
      doc.addPage();
      yPos = 20;
    }
    doc.setTextColor(16, 45, 70);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(label, 14, yPos);
    yPos += 4;
  };

  if (scope === 'eksekutif') {
    appendSectionTitle('1. Ringkasan Petunjuk Utama Sekolah (Data Dinamik Semasa)');
    autoTable(doc, {
      startY: yPos,
      head: [['Petunjuk Utama', 'Nilai Semasa', 'Catatan']],
      body: [
        ['Jumlah Guru & Staf (Simulasi)', String(stats.totalTeachers), 'Pegawai berdaftar dalam direktori'],
        ['Tugasan Aktif', String(stats.activeTasksCount), `Daripada ${stats.totalTasks} jumlah tugasan (${stats.urgentTasksCount} Segera/Tinggi)`],
        ['Program Akan Datang', String(stats.upcomingProgramsCount), `Daripada ${stats.totalPrograms} program berdaftar`],
        ['Jumlah Laporan Konsisten', String(stats.totalReportsCount), `${stats.docReportsCount} dokumen laporan/minit + ${stats.programReportsCount} laporan program`],
        ['Gred Purata Sekolah (GPS)', stats.currentGPS.toFixed(2), `Kadar Lulus Keseluruhan: ${stats.avgPassRate}%`],
        ['Baki Keseluruhan PCG Panitia', formatCurrencyRM(stats.totalPcgBalance), `Merentasi ${state.panitiaList.length} panitia aktif`],
        ['Murid Dalam Pemantauan/Intervensi', String(stats.studentsInInterventionCount), `Daripada ${state.students.length} rekod contoh`],
        ['Aduan Kerosakan Aset Terbuka', String(stats.openDamageCount), `Daripada ${state.assets.length} item inventori aset`],
      ],
      theme: 'grid',
      headStyles: { fillColor: [16, 45, 70], textColor: [240, 185, 11] },
      styles: { fontSize: 8.5, cellPadding: 2.5 },
    });
    yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

    appendSectionTitle('2. Senarai Tugasan Terkini');
    autoTable(doc, {
      startY: yPos,
      head: [['Tajuk Tugasan', 'Pegawai', 'Keutamaan', 'Tarikh Akhir', 'Status']],
      body: state.tasks.map((t) => [
        t.tajuk,
        t.pegawai,
        t.keutamaan,
        formatShortDate(t.tarikhAkhir),
        t.status,
      ]),
      theme: 'striped',
      headStyles: { fillColor: [16, 45, 70], textColor: [255, 255, 255] },
      styles: { fontSize: 8, cellPadding: 2.2 },
    });
    yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

    appendSectionTitle('3. Senarai Program & Laporan Pelaksanaan');
    autoTable(doc, {
      startY: yPos,
      head: [['Nama Program', 'Penyelaras', 'Tarikh', 'Peruntukan', 'Status']],
      body: state.programs.map((p) => [
        p.nama,
        p.penyelaras,
        formatShortDate(p.tarikh),
        formatCurrencyRM(p.anggaranBajet),
        p.status,
      ]),
      theme: 'striped',
      headStyles: { fillColor: [16, 45, 70], textColor: [255, 255, 255] },
      styles: { fontSize: 8, cellPadding: 2.2 },
    });
  } else if (scope === 'tugasan') {
    appendSectionTitle(`Senarai Tugasan Sekolah (${state.tasks.length} Rekod)`);
    autoTable(doc, {
      startY: yPos,
      head: [['Tajuk', 'Kategori', 'Pegawai', 'Mula', 'Akhir', 'Keutamaan', 'Status']],
      body: state.tasks.map((t) => [
        t.tajuk,
        t.kategori || 'Umum',
        t.pegawai,
        formatShortDate(t.tarikhMula),
        formatShortDate(t.tarikhAkhir),
        t.keutamaan,
        t.status,
      ]),
      theme: 'grid',
      headStyles: { fillColor: [16, 45, 70], textColor: [240, 185, 11] },
      styles: { fontSize: 8, cellPadding: 2.2 },
    });
  } else if (scope === 'akademik') {
    appendSectionTitle(
      `Analisis Peperiksaan · GPS Keseluruhan: ${stats.currentGPS.toFixed(2)} (${stats.avgPassRate}% Lulus)`
    );
    autoTable(doc, {
      startY: yPos,
      head: [['Mata Pelajaran', 'Kod', 'Tingkatan', 'Calon', 'Lulus', '% Lulus', 'A+/A/A-', 'G', 'GPMP']],
      body: state.examRecords.map((r) => {
        const pct = r.bilCalon > 0 ? ((r.bilLulus / r.bilCalon) * 100).toFixed(1) : '0.0';
        const cemerlang = (r.gred.APlus || 0) + (r.gred.A || 0) + (r.gred.AMinus || 0);
        return [
          r.mataPelajaran,
          r.kodSubjek,
          r.tingkatan,
          String(r.bilCalon),
          String(r.bilLulus),
          `${pct}%`,
          String(cemerlang),
          String(r.gred.G),
          calculateGPMP(r.gred).toFixed(2),
        ];
      }),
      theme: 'grid',
      headStyles: { fillColor: [16, 45, 70], textColor: [240, 185, 11] },
      styles: { fontSize: 8, cellPadding: 2.2 },
    });
  } else if (scope === 'panitia') {
    appendSectionTitle(`Ringkasan Panitia & Kewangan PCG (${state.panitiaList.length} Panitia)`);
    autoTable(doc, {
      startY: yPos,
      head: [['Panitia', 'Bidang', 'Ketua Panitia', 'Ahli', 'Peruntukan', 'Belanja', 'Baki PCG']],
      body: state.panitiaList.map((p) => {
        const alloc = p.rekodKewangan
          .filter((k) => k.jenis === 'Peruntukan')
          .reduce((s, k) => s + k.jumlah, 0);
        const spent = p.rekodKewangan
          .filter((k) => k.jenis === 'Perbelanjaan')
          .reduce((s, k) => s + k.jumlah, 0);
        return [
          p.nama,
          p.bidang,
          p.ketuaPanitia,
          String(p.ahli.length),
          formatCurrencyRM(alloc),
          formatCurrencyRM(spent),
          formatCurrencyRM(alloc - spent),
        ];
      }),
      theme: 'grid',
      headStyles: { fillColor: [16, 45, 70], textColor: [240, 185, 11] },
      styles: { fontSize: 8, cellPadding: 2.2 },
    });
  } else if (scope === 'program') {
    appendSectionTitle(`Laporan Program Sekolah (${state.programs.length} Program)`);
    autoTable(doc, {
      startY: yPos,
      head: [['Nama Program', 'Tarikh', 'Penyelaras', 'Peruntukan', 'Status', 'Ringkasan Pelaksanaan']],
      body: state.programs.map((p) => [
        p.nama,
        formatShortDate(p.tarikh),
        p.penyelaras,
        formatCurrencyRM(p.anggaranBajet),
        p.status,
        p.laporanPelaksanaan,
      ]),
      theme: 'grid',
      headStyles: { fillColor: [16, 45, 70], textColor: [240, 185, 11] },
      styles: { fontSize: 7.8, cellPadding: 2.2 },
    });
  } else if (scope === 'murid_aset') {
    appendSectionTitle('1. Rekod Pemantauan Murid (Data Demonstrasi Rekaan)');
    autoTable(doc, {
      startY: yPos,
      head: [['Nama Murid (Simulasi)', 'ID', 'Kelas', 'Kehadiran', 'Purata', 'Status Susulan']],
      body: state.students.map((s) => [
        s.nama,
        s.noIdMurid,
        s.kelas,
        `${s.kehadiranPeratus}%`,
        `${s.purataMarkah}%`,
        s.statusSusulan,
      ]),
      theme: 'grid',
      headStyles: { fillColor: [16, 45, 70], textColor: [240, 185, 11] },
      styles: { fontSize: 8, cellPadding: 2.2 },
    });
    yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

    appendSectionTitle('2. Inventori Aset & Rekod Aduan Kerosakan');
    autoTable(doc, {
      startY: yPos,
      head: [['Kod Aset', 'Nama Aset', 'Lokasi', 'Kuantiti', 'Status']],
      body: state.assets.map((a) => [
        a.kodAset,
        a.nama,
        a.lokasi,
        String(a.kuantiti),
        a.status,
      ]),
      theme: 'striped',
      headStyles: { fillColor: [16, 45, 70], textColor: [255, 255, 255] },
      styles: { fontSize: 8, cellPadding: 2.2 },
    });
  }

  const fileName = `EDUSCHOOL360_${scope}_SMKSalaping_Simulasi.pdf`;
  doc.save(fileName);
  return fileName;
}

export function exportReportToExcel(
  scope: ReportScope | 'semua',
  state: EduSchoolState,
  activeRole: UserRole
): string {
  const wb = XLSX.utils.book_new();
  const stats = computeSchoolStats(state);

  const addSheet = (name: string, rows: Record<string, string | number>[]) => {
    const safeRows =
      rows.length > 0
        ? rows
        : [{ Nota: 'Tiada rekod buat masa ini (Data Demonstrasi SMK Salaping)' }];
    const ws = XLSX.utils.json_to_sheet(safeRows);
    XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
  };

  if (scope === 'eksekutif' || scope === 'semua') {
    addSheet('Ringkasan_Eksekutif', [
      { Perkara: 'Sistem', Nilai: 'EDUSCHOOL 360 (Versi 1.3.1)' },
      { Perkara: 'Sekolah Rintis', Nilai: 'SMK Salaping, Sabah' },
      { Perkara: 'Amaran Data', Nilai: 'DATA DEMONSTRASI SAHAJA (BUKAN REKOD SEBENAR)' },
      { Perkara: 'Peranan Paparan Aktif', Nilai: getRoleDisplayLabel(activeRole) },
      { Perkara: 'Jumlah Guru & Staf (Simulasi)', Nilai: stats.totalTeachers },
      { Perkara: 'Tugasan Aktif', Nilai: stats.activeTasksCount },
      { Perkara: 'Jumlah Tugasan Keseluruhan', Nilai: stats.totalTasks },
      { Perkara: 'Program Akan Datang', Nilai: stats.upcomingProgramsCount },
      { Perkara: 'Jumlah Program Keseluruhan', Nilai: stats.totalPrograms },
      { Perkara: 'Jumlah Laporan Konsisten', Nilai: stats.totalReportsCount },
      { Perkara: 'Gred Purata Sekolah (GPS)', Nilai: Number(stats.currentGPS.toFixed(2)) },
      { Perkara: 'Peratus Lulus Akademik (%)', Nilai: Number(stats.avgPassRate) },
      { Perkara: 'Baki Keseluruhan PCG Panitia (RM)', Nilai: stats.totalPcgBalance },
      { Perkara: 'Aduan Kerosakan Terbuka', Nilai: stats.openDamageCount },
    ]);
  }

  if (scope === 'tugasan' || scope === 'eksekutif' || scope === 'semua') {
    addSheet(
      'Pengurusan_Tugasan',
      state.tasks.map((t) => ({
        Tajuk: t.tajuk,
        Kategori: t.kategori ?? 'Umum',
        Pegawai_Bertanggungjawab: t.pegawai,
        Tarikh_Mula: t.tarikhMula,
        Tarikh_Akhir: t.tarikhAkhir,
        Keutamaan: t.keutamaan,
        Status: t.status,
        Keterangan: t.keterangan,
      }))
    );
  }

  if (scope === 'akademik' || scope === 'semua') {
    addSheet(
      'Akademik_GPS_GPMP',
      state.examRecords.map((r) => ({
        Peperiksaan: r.peperiksaan,
        Tingkatan: r.tingkatan,
        Kod_Subjek: r.kodSubjek,
        Mata_Pelajaran: r.mataPelajaran,
        Bil_Calon: r.bilCalon,
        Bil_Lulus: r.bilLulus,
        Peratus_Lulus: r.bilCalon > 0 ? Number(((r.bilLulus / r.bilCalon) * 100).toFixed(1)) : 0,
        A_Plus: r.gred.APlus,
        A: r.gred.A,
        A_Minus: r.gred.AMinus,
        G_Gagal: r.gred.G,
        GPMP: calculateGPMP(r.gred),
      }))
    );
  }

  if (scope === 'panitia' || scope === 'semua') {
    addSheet(
      'Panitia_PCG',
      state.panitiaList.map((p) => {
        const alloc = p.rekodKewangan
          .filter((k) => k.jenis === 'Peruntukan')
          .reduce((s, k) => s + k.jumlah, 0);
        const spent = p.rekodKewangan
          .filter((k) => k.jenis === 'Perbelanjaan')
          .reduce((s, k) => s + k.jumlah, 0);
        return {
          Nama_Panitia: p.nama,
          Bidang: p.bidang,
          Ketua_Panitia: p.ketuaPanitia,
          Bilangan_Ahli: p.ahli.length,
          Bilangan_Pelan_Tahunan: p.perancanganTahunan.length,
          Jumlah_Peruntukan_RM: alloc,
          Jumlah_Perbelanjaan_RM: spent,
          Baki_PCG_RM: alloc - spent,
        };
      })
    );
  }

  if (scope === 'program' || scope === 'eksekutif' || scope === 'semua') {
    addSheet(
      'Program_Sekolah',
      state.programs.map((p) => ({
        Nama_Program: p.nama,
        Tarikh: p.tarikh,
        Penyelaras: p.penyelaras,
        Jawatankuasa: p.jawatankuasa,
        Anggaran_Peruntukan_RM: p.anggaranBajet,
        Status: p.status,
        Laporan_Pelaksanaan: p.laporanPelaksanaan,
      }))
    );
  }

  if (scope === 'murid_aset' || scope === 'semua') {
    addSheet(
      'Murid_Simulasi',
      state.students.map((s) => ({
        Nota_Privasi: 'DATA REKAAN SAHAJA',
        ID_Rujukan: s.noIdMurid,
        Nama_Murid_Simulasi: s.nama,
        Tingkatan: s.tingkatan,
        Kelas: s.kelas,
        Kehadiran_Peratus: s.kehadiranPeratus,
        Purata_Markah_Peratus: s.purataMarkah,
        Tahap_Penguasaan: s.tahapPenguasaan,
        Status_Susulan: s.statusSusulan,
        Bil_Intervensi: s.rekodIntervensi.length,
      }))
    );
    addSheet(
      'Aset_Sekolah',
      state.assets.map((a) => ({
        Kod_Aset: a.kodAset,
        Nama_Aset: a.nama,
        Kategori: a.kategori,
        Lokasi: a.lokasi,
        Kuantiti: a.kuantiti,
        Status: a.status,
        Tarikh_Kemaskini: a.tarikhKemaskini,
      }))
    );
  }

  if (scope === 'semua') {
    addSheet(
      'Dokumentasi_Digital',
      state.documents.map((d) => ({
        Tajuk: d.tajuk,
        Kategori: d.kategori,
        Penyedia: d.penyedia,
        Tarikh: d.tarikh,
        Format: d.format,
        Saiz: d.saiz,
        Ringkasan: d.ringkasan,
      }))
    );
    addSheet(
      'Guru_Staf_Simulasi',
      state.teachers.map((g) => ({
        Nota_Privasi: 'DATA REKAAN SAHAJA',
        Nama: g.nama,
        Jawatan: g.jawatan,
        Bidang: g.bidang,
        Panitia: g.panitia,
        Peranan_Sistem: getRoleDisplayLabel(g.perananSistem),
        Emel_Simulasi: g.emel,
      }))
    );
  }

  const fileName = `EDUSCHOOL360_${scope}_SMKSalaping_Simulasi.xlsx`;
  XLSX.writeFile(wb, fileName);
  return fileName;
}
