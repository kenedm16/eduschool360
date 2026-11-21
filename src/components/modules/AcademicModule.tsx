import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Award,
  BarChart3,
  BookOpen,
  Calendar,
  FileSpreadsheet,
  FileText,
  GitCompare,
  GraduationCap,
  ShieldCheck,
  Sliders,
  Sparkles,
  Users,
} from 'lucide-react';
import {
  AcademicExam,
  AcademicIntervention,
  AcademicScoreRecord,
  AcademicSubject,
  AcademicV14State,
  GradeSchemeConfig,
  PanitiaItem,
  TeacherItem,
  UserRole,
} from '../../types/eduschool';
import {
  computeExamOverview,
  CsvParseResult,
} from '../../utils/academicCalcHelper';
import { getRoleDisplayLabel } from '../../utils/rolePermissions';
import { ModuleHeader } from '../common/ModuleHeader';
import { AcademicOverviewPanel } from './academic/AcademicOverviewPanel';
import { AcademicExamsSubjectsPanel } from './academic/AcademicExamsSubjectsPanel';
import { AcademicScoresPanel } from './academic/AcademicScoresPanel';
import { AcademicComparisonPanel } from './academic/AcademicComparisonPanel';
import { AcademicGradeSchemePanel } from './academic/AcademicGradeSchemePanel';
import { AcademicInterventionPanel } from './academic/AcademicInterventionPanel';
import { AcademicReportPanel } from './academic/AcademicReportPanel';

type AcademicTabId =
  | 'overview'
  | 'exams-subjects'
  | 'scores'
  | 'comparison'
  | 'schemes'
  | 'interventions'
  | 'reports';

interface AcademicModuleProps {
  academicV14: AcademicV14State;
  teachers: TeacherItem[];
  panitiaList: PanitiaItem[];
  activeRole: UserRole;
  onBackToDashboard: () => void;
  onUpdateAcademicV14: (
    updater: (prev: AcademicV14State) => AcademicV14State,
    logActionText?: string,
    toastTitle?: string,
    toastMessage?: string
  ) => void;
  onNotify: (type: 'success' | 'info' | 'error', title: string, message?: string) => void;
}

export const AcademicModule: React.FC<AcademicModuleProps> = ({
  academicV14,
  teachers,
  panitiaList,
  activeRole,
  onBackToDashboard,
  onUpdateAcademicV14,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<AcademicTabId>('overview');
  const [selectedExamId, setSelectedExamId] = useState<string>(
    academicV14.exams[0]?.id ?? ''
  );
  const [scoreFilterSubjectId, setScoreFilterSubjectId] = useState<string>('Semua');

  // Kawalan akses berasaskan peranan simulasi (Bahagian L)
  const roleRights = useMemo(() => {
    const isTopAdmin =
      activeRole === 'Super Admin' ||
      activeRole === 'Pengetua' ||
      activeRole === 'Penolong Kanan';
    const isDeptHead = activeRole === 'Ketua Bidang';
    const isPanitiaHead = activeRole === 'Ketua Panitia';
    const isTeacher = activeRole === 'Guru';

    return {
      canManageExamsAndSubjects: isTopAdmin || isDeptHead || isPanitiaHead,
      canDeleteExamsAndSubjects: isTopAdmin || isDeptHead,
      canManageScores: isTopAdmin || isDeptHead || isPanitiaHead || isTeacher,
      canEditGradeSchemes: isTopAdmin || isDeptHead,
      canManageInterventions: isTopAdmin || isDeptHead || isPanitiaHead || isTeacher,
      roleSummary:
        isTopAdmin
          ? 'Akses penuh: mengurus peperiksaan, mata pelajaran, skema gred, markah, intervensi dan eksport laporan.'
          : isDeptHead
            ? `Akses Ketua Bidang (${panitiaList.length} panitia aktif): penyeliaan penuh peperiksaan, skema gred, GPMP/GPS dan intervensi.`
            : isPanitiaHead
              ? 'Akses Ketua Panitia: pengurusan peperiksaan, subjek, rekod markah, intervensi dan laporan (skema gred baca sahaja).'
              : isTeacher
                ? 'Akses Guru: memasukkan & mengemaskini markah murid, muat naik CSV, mengurus intervensi dan menjana laporan.'
                : 'Akses Baca Sahaja: melihat ringkasan analisis dan laporan akademik sekolah.',
    };
  }, [activeRole, panitiaList.length]);

  const effectiveSelectedExamId = useMemo(() => {
    if (academicV14.exams.some((e) => e.id === selectedExamId)) {
      return selectedExamId;
    }
    return academicV14.exams[0]?.id ?? '';
  }, [academicV14.exams, selectedExamId]);

  // Bahagian A: 6 Kad Statistik Dinamik
  const dashboardStats = useMemo(() => {
    const uniqueStudents = new Set(academicV14.scores.map((s) => s.noIdMurid)).size;

    const overviews = academicV14.exams.map((ex) =>
      computeExamOverview(ex, academicV14.subjects, academicV14.scores, academicV14.gradeSchemes)
    );

    const withScores = overviews.filter((o) => o.totalCandidates > 0);
    const totalCandidatesAll = withScores.reduce((sum, o) => sum + o.totalCandidates, 0);
    const totalPassAll = withScores.reduce((sum, o) => sum + o.passCount, 0);
    const avgPassRate =
      totalCandidatesAll > 0 ? Number(((totalPassAll / totalCandidatesAll) * 100).toFixed(1)) : 0;

    // GPS sekolah semasa diambil daripada peperiksaan terkini yang mengaktifkan GPS/GPMP
    const latestWithGps = [...withScores]
      .sort((a, b) => b.exam.tarikh.localeCompare(a.exam.tarikh))
      .find((o) => o.gps !== null);

    // Subjek memerlukan perhatian bagi peperiksaan terkini
    const latestExamOverview =
      overviews.find((o) => o.exam.id === effectiveSelectedExamId) ?? withScores[0];

    return {
      totalExams: academicV14.exams.length,
      totalSubjects: academicV14.subjects.length,
      totalStudents: uniqueStudents,
      avgPassRate,
      schoolGps: latestWithGps?.gps ?? null,
      gpsExamName: latestWithGps?.exam.nama ?? 'Tiada peperiksaan berskema GPS',
      attentionSubjects: latestExamOverview?.attentionSubjectsCount ?? 0,
      attentionExamName: latestExamOverview?.exam.nama ?? '-',
    };
  }, [academicV14, effectiveSelectedExamId]);

  // Handlers CRUD Peperiksaan
  const handleAddExam = (exam: Omit<AcademicExam, 'id'>) => {
    const newId = `exm-${Date.now()}`;
    onUpdateAcademicV14(
      (prev) => ({
        ...prev,
        exams: [{ ...exam, id: newId }, ...prev.exams],
      }),
      `Mendaftarkan peperiksaan baharu: ${exam.nama} (${exam.kodPeperiksaan})`,
      'Peperiksaan Didaftarkan',
      exam.nama
    );
    setSelectedExamId(newId);
  };

  const handleUpdateExam = (updated: AcademicExam) => {
    onUpdateAcademicV14(
      (prev) => ({
        ...prev,
        exams: prev.exams.map((e) => (e.id === updated.id ? updated : e)),
      }),
      `Mengemaskini peperiksaan: ${updated.nama}`,
      'Peperiksaan Dikemaskini',
      updated.nama
    );
  };

  const handleDeleteExam = (id: string) => {
    const target = academicV14.exams.find((e) => e.id === id);
    onUpdateAcademicV14(
      (prev) => ({
        ...prev,
        exams: prev.exams.filter((e) => e.id !== id),
        scores: prev.scores.filter((s) => s.examId !== id),
      }),
      target ? `Memadam peperiksaan: ${target.nama}` : undefined,
      'Peperiksaan Dipadam',
      target?.nama
    );
  };

  // Handlers CRUD Mata Pelajaran
  const handleAddSubject = (sub: Omit<AcademicSubject, 'id'>) => {
    const newId = `sub-${Date.now()}`;
    onUpdateAcademicV14(
      (prev) => ({
        ...prev,
        subjects: [...prev.subjects, { ...sub, id: newId }],
      }),
      `Mendaftarkan mata pelajaran: ${sub.nama} (${sub.kod})`,
      'Mata Pelajaran Ditambah',
      `${sub.nama} (${sub.tingkatan})`
    );
  };

  const handleUpdateSubject = (updated: AcademicSubject) => {
    onUpdateAcademicV14(
      (prev) => ({
        ...prev,
        subjects: prev.subjects.map((s) => (s.id === updated.id ? updated : s)),
      }),
      `Mengemaskini mata pelajaran: ${updated.nama}`,
      'Mata Pelajaran Dikemaskini',
      updated.nama
    );
  };

  const handleDeleteSubject = (id: string) => {
    const target = academicV14.subjects.find((s) => s.id === id);
    onUpdateAcademicV14(
      (prev) => ({
        ...prev,
        subjects: prev.subjects.filter((s) => s.id !== id),
        scores: prev.scores.filter((sc) => sc.subjectId !== id),
      }),
      target ? `Memadam mata pelajaran: ${target.nama}` : undefined,
      'Mata Pelajaran Dipadam',
      target?.nama
    );
  };

  // Handlers CRUD Markah & Muat Naik CSV (dengan pencegahan pendua)
  const handleUpsertScore = (
    payload: Omit<AcademicScoreRecord, 'id'>,
    existingId?: string
  ) => {
    onUpdateAcademicV14(
      (prev) => {
        if (existingId) {
          return {
            ...prev,
            scores: prev.scores.map((s) =>
              s.id === existingId ? { ...payload, id: existingId } : s
            ),
          };
        }
        const dup = prev.scores.find(
          (s) =>
            s.examId === payload.examId &&
            s.subjectId === payload.subjectId &&
            s.noIdMurid.toLowerCase() === payload.noIdMurid.toLowerCase()
        );
        if (dup) {
          return {
            ...prev,
            scores: prev.scores.map((s) =>
              s.id === dup.id ? { ...payload, id: dup.id } : s
            ),
          };
        }
        return {
          ...prev,
          scores: [
            { ...payload, id: `sc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` },
            ...prev.scores,
          ],
        };
      },
      `Merekod markah ${payload.namaMurid} (${payload.markah}%)`,
      existingId ? 'Markah Dikemaskini' : 'Markah Disimpan',
      `${payload.namaMurid}: ${payload.markah}%`
    );
  };

  const handleBulkUpsertScores = (
    examId: string,
    subjectId: string,
    rows: CsvParseResult['validRows']
  ) => {
    const today = new Date().toISOString().slice(0, 10);
    onUpdateAcademicV14(
      (prev) => {
        const nextScores = [...prev.scores];
        rows.forEach((row) => {
          const idx = nextScores.findIndex(
            (s) =>
              s.examId === examId &&
              s.subjectId === subjectId &&
              s.noIdMurid.toLowerCase() === row.noIdMurid.toLowerCase()
          );
          if (idx >= 0) {
            nextScores[idx] = {
              ...nextScores[idx],
              namaMurid: row.namaMurid,
              kelas: row.kelas,
              markah: row.markah,
              tarikhKemaskini: today,
            };
          } else {
            nextScores.unshift({
              id: `sc-csv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              examId,
              subjectId,
              noIdMurid: row.noIdMurid.toUpperCase(),
              namaMurid: row.namaMurid,
              kelas: row.kelas,
              markah: row.markah,
              tarikhKemaskini: today,
            });
          }
        });
        return { ...prev, scores: nextScores };
      },
      `Memuat naik ${rows.length} rekod markah CSV ke modul akademik`,
      'Muat Naik CSV Berjaya',
      `${rows.length} rekod markah diproses dan diselaraskan.`
    );
  };

  const handleDeleteScore = (id: string) => {
    onUpdateAcademicV14(
      (prev) => ({
        ...prev,
        scores: prev.scores.filter((s) => s.id !== id),
      }),
      undefined,
      'Rekod Markah Dipadam'
    );
  };

  // Handlers Skema Gred
  const handleUpdateScheme = (updated: GradeSchemeConfig) => {
    onUpdateAcademicV14(
      (prev) => ({
        ...prev,
        gradeSchemes: prev.gradeSchemes.map((sc) => (sc.id === updated.id ? updated : sc)),
      }),
      `Mengemaskini skema gred: ${updated.nama}`,
      'Skema Gred Disimpan',
      updated.nama
    );
  };

  const handleAddScheme = (scheme: Omit<GradeSchemeConfig, 'id'>) => {
    onUpdateAcademicV14(
      (prev) => ({
        ...prev,
        gradeSchemes: [...prev.gradeSchemes, { ...scheme, id: `skema-${Date.now()}` }],
      }),
      `Menambah skema gred baharu: ${scheme.nama}`,
      'Skema Gred Ditambah',
      scheme.nama
    );
  };

  // Handlers Intervensi Akademik
  const handleAddIntervention = (item: Omit<AcademicIntervention, 'id'>) => {
    onUpdateAcademicV14(
      (prev) => ({
        ...prev,
        interventions: [{ ...item, id: `aint-${Date.now()}` }, ...prev.interventions],
      }),
      `Menambah pelan intervensi akademik: ${item.mataPelajaran}`,
      'Intervensi Didaftarkan',
      item.mataPelajaran
    );
  };

  const handleUpdateIntervention = (updated: AcademicIntervention) => {
    onUpdateAcademicV14(
      (prev) => ({
        ...prev,
        interventions: prev.interventions.map((i) => (i.id === updated.id ? updated : i)),
      }),
      `Mengemaskini pelan intervensi: ${updated.mataPelajaran} (${updated.status})`,
      'Intervensi Dikemaskini',
      `${updated.mataPelajaran} · ${updated.status}`
    );
  };

  const handleDeleteIntervention = (id: string) => {
    onUpdateAcademicV14(
      (prev) => ({
        ...prev,
        interventions: prev.interventions.filter((i) => i.id !== id),
      }),
      undefined,
      'Rekod Intervensi Dipadam'
    );
  };

  const tabs: Array<{ id: AcademicTabId; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'overview', label: 'Ringkasan & Analisis', icon: BarChart3 },
    { id: 'exams-subjects', label: 'Peperiksaan & Subjek', icon: Calendar },
    { id: 'scores', label: 'Markah & CSV', icon: FileSpreadsheet },
    { id: 'comparison', label: 'Perbandingan', icon: GitCompare },
    { id: 'schemes', label: 'Skema Gred & Formula', icon: Sliders },
    { id: 'interventions', label: 'Intervensi', icon: Sparkles },
    { id: 'reports', label: 'Laporan Akademik', icon: FileText },
  ];

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="ANALISIS AKADEMIK DAN PEPERIKSAAN"
        description="Pusat analisis pintar pencapaian peperiksaan, pengiraan automatik GPS/GPMP, taburan gred, perbandingan dan pelan intervensi."
        onBackToDashboard={onBackToDashboard}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('scores')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#1E2329] text-[#EAECEF] border border-[#2B3139] rounded-lg hover:bg-[#2B3139] whitespace-nowrap"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#0ECB81]" />
              Rekod & Muat Naik Markah
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('reports')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-[#F0B90B] text-[#0B0E11] rounded-lg hover:bg-[#F8D12F] whitespace-nowrap"
            >
              <FileText className="w-4 h-4" />
              Jana Laporan Akademik
            </button>
          </div>
        }
      />

      {/* Jalur Peranan Simulasi (Bahagian L) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3 rounded-xl bg-[#161A1E] border border-[#2B3139] text-xs">
        <div className="flex items-center gap-2 text-[#EAECEF]">
          <ShieldCheck className="w-4 h-4 text-[#F0B90B] shrink-0" />
          <span>
            Mod Peranan Simulasi: <strong className="text-[#F0B90B]">{getRoleDisplayLabel(activeRole)}</strong>
            <span className="text-[#848E9C] ml-1.5">— {roleRights.roleSummary}</span>
          </span>
        </div>
        <span className="text-[11px] text-[#848E9C] shrink-0">
          Data Demonstrasi (Murid Rekaan)
        </span>
      </div>

      {/* Bahagian A: 6 Kad Statistik Dinamik */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] p-4">
          <div className="flex items-center justify-between text-xs text-[#848E9C] font-semibold">
            <span>Jumlah Peperiksaan</span>
            <Calendar className="w-4 h-4 text-[#F0B90B]" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono tabular-nums mt-2">
            {dashboardStats.totalExams}
          </div>
          <div className="text-[11px] text-[#848E9C] mt-1">Rekod aktif tahun semasa</div>
        </div>

        <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] p-4">
          <div className="flex items-center justify-between text-xs text-[#848E9C] font-semibold">
            <span>Mata Pelajaran</span>
            <BookOpen className="w-4 h-4 text-[#38BDF8]" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono tabular-nums mt-2">
            {dashboardStats.totalSubjects}
          </div>
          <div className="text-[11px] text-[#848E9C] mt-1">Subjek berdaftar</div>
        </div>

        <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] p-4">
          <div className="flex items-center justify-between text-xs text-[#848E9C] font-semibold">
            <span>Murid Berdaftar</span>
            <Users className="w-4 h-4 text-[#0ECB81]" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono tabular-nums mt-2">
            {dashboardStats.totalStudents}
          </div>
          <div className="text-[11px] text-[#848E9C] mt-1">Calon unik direkodkan</div>
        </div>

        <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] p-4">
          <div className="flex items-center justify-between text-xs text-[#848E9C] font-semibold">
            <span>Purata Peratus Lulus</span>
            <GraduationCap className="w-4 h-4 text-[#0ECB81]" />
          </div>
          <div className="text-2xl font-extrabold text-[#0ECB81] font-mono tabular-nums mt-2">
            {dashboardStats.avgPassRate.toFixed(1)}%
          </div>
          <div className="text-[11px] text-[#848E9C] mt-1">Merentas semua rekod</div>
        </div>

        <div className="bg-[#161A1E] rounded-xl border border-[#F0B90B]/40 p-4">
          <div className="flex items-center justify-between text-xs text-[#F0B90B] font-semibold">
            <span>GPS Sekolah</span>
            <Award className="w-4 h-4 text-[#F0B90B]" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono tabular-nums mt-2">
            {dashboardStats.schoolGps !== null ? dashboardStats.schoolGps.toFixed(2) : '-'}
          </div>
          <div className="text-[11px] text-[#848E9C] mt-1 truncate">
            {dashboardStats.gpsExamName}
          </div>
        </div>

        <div className="bg-[#161A1E] rounded-xl border border-[#F6465D]/30 p-4">
          <div className="flex items-center justify-between text-xs text-[#F6465D] font-semibold">
            <span>Perlu Perhatian</span>
            <AlertTriangle className="w-4 h-4 text-[#F6465D]" />
          </div>
          <div className="text-2xl font-extrabold text-[#F6465D] font-mono tabular-nums mt-2">
            {dashboardStats.attentionSubjects}
          </div>
          <div className="text-[11px] text-[#848E9C] mt-1 truncate">
            Subjek dalam {dashboardStats.attentionExamName}
          </div>
        </div>
      </div>

      {/* Navigasi Tab Submodul */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-[#2B3139]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
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

      {/* Kandungan Tab Aktif */}
      {activeTab === 'overview' && (
        <AcademicOverviewPanel
          exams={academicV14.exams}
          subjects={academicV14.subjects}
          scores={academicV14.scores}
          gradeSchemes={academicV14.gradeSchemes}
          selectedExamId={effectiveSelectedExamId}
          onSelectExamId={setSelectedExamId}
          onJumpToScores={(exId, subId) => {
            setSelectedExamId(exId);
            setScoreFilterSubjectId(subId ?? 'Semua');
            setActiveTab('scores');
          }}
          onJumpToInterventions={() => setActiveTab('interventions')}
        />
      )}

      {activeTab === 'exams-subjects' && (
        <AcademicExamsSubjectsPanel
          exams={academicV14.exams}
          subjects={academicV14.subjects}
          scores={academicV14.scores}
          gradeSchemes={academicV14.gradeSchemes}
          teachers={teachers}
          canManageExams={roleRights.canManageExamsAndSubjects}
          canDeleteExams={roleRights.canDeleteExamsAndSubjects}
          onAddExam={handleAddExam}
          onUpdateExam={handleUpdateExam}
          onDeleteExam={handleDeleteExam}
          onAddSubject={handleAddSubject}
          onUpdateSubject={handleUpdateSubject}
          onDeleteSubject={handleDeleteSubject}
          onInspectExam={(exId) => {
            setSelectedExamId(exId);
            setActiveTab('overview');
          }}
        />
      )}

      {activeTab === 'scores' && (
        <AcademicScoresPanel
          exams={academicV14.exams}
          subjects={academicV14.subjects}
          scores={academicV14.scores}
          gradeSchemes={academicV14.gradeSchemes}
          selectedExamId={effectiveSelectedExamId}
          initialSubjectId={scoreFilterSubjectId}
          canManageScores={roleRights.canManageScores}
          onSelectExamId={setSelectedExamId}
          onUpsertScore={handleUpsertScore}
          onBulkUpsertScores={handleBulkUpsertScores}
          onDeleteScore={handleDeleteScore}
        />
      )}

      {activeTab === 'comparison' && (
        <AcademicComparisonPanel
          exams={academicV14.exams}
          subjects={academicV14.subjects}
          scores={academicV14.scores}
          gradeSchemes={academicV14.gradeSchemes}
        />
      )}

      {activeTab === 'schemes' && (
        <AcademicGradeSchemePanel
          gradeSchemes={academicV14.gradeSchemes}
          canEditSchemes={roleRights.canEditGradeSchemes}
          onUpdateScheme={handleUpdateScheme}
          onAddScheme={handleAddScheme}
        />
      )}

      {activeTab === 'interventions' && (
        <AcademicInterventionPanel
          exams={academicV14.exams}
          subjects={academicV14.subjects}
          scores={academicV14.scores}
          gradeSchemes={academicV14.gradeSchemes}
          interventions={academicV14.interventions}
          teachers={teachers}
          selectedExamId={effectiveSelectedExamId}
          canManageInterventions={roleRights.canManageInterventions}
          onAddIntervention={handleAddIntervention}
          onUpdateIntervention={handleUpdateIntervention}
          onDeleteIntervention={handleDeleteIntervention}
        />
      )}

      {activeTab === 'reports' && (
        <AcademicReportPanel
          exams={academicV14.exams}
          subjects={academicV14.subjects}
          scores={academicV14.scores}
          gradeSchemes={academicV14.gradeSchemes}
          interventions={academicV14.interventions}
          activeRole={activeRole}
          onNotifyExport={(format, fileName) =>
            onNotify(
              'success',
              `Eksport ${format} Akademik Berjaya`,
              `Fail ${fileName} telah dijana dan dimuat turun.`
            )
          }
        />
      )}
    </div>
  );
};
