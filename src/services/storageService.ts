import { INITIAL_ACADEMIC_V14_STATE } from '../data/academicDemoData';
import { INITIAL_DOC_CENTER_V15_STATE } from '../data/docCenterDemoData';
import { INITIAL_EDUSCHOOL_STATE } from '../data/demoData';
import {
  AcademicV14State,
  DocCenterV15State,
  EduSchoolState,
  PanitiaItem,
  TaskItem,
} from '../types/eduschool';
import { buildSyncedExamRecords } from '../utils/academicCalcHelper';
import { syncLegacyDocuments } from '../utils/docCenterHelpers';
import { normalizePanitiaItem } from '../utils/panitiaHelpers';
import { normalizeTaskItem } from '../utils/taskHelpers';

const STORAGE_KEY = 'eduschool360_smk_salaping_v1';

function deduplicateAndNormalizeTasks(tasks: TaskItem[]): TaskItem[] {
  const seenIds = new Set<string>();
  const result: TaskItem[] = [];
  tasks.forEach((t, idx) => {
    if (!t || !t.id || seenIds.has(t.id)) return;
    seenIds.add(t.id);
    result.push(normalizeTaskItem(t, idx));
  });
  return result;
}

function deduplicateAndNormalizePanitias(list: PanitiaItem[]): PanitiaItem[] {
  const seenIds = new Set<string>();
  const result: PanitiaItem[] = [];
  list.forEach((p, idx) => {
    if (!p || !p.id || seenIds.has(p.id)) return;
    seenIds.add(p.id);
    result.push(normalizePanitiaItem(p, idx));
  });
  return result;
}

function normalizeAcademicV14(raw?: Partial<AcademicV14State>): AcademicV14State {
  if (!raw) return INITIAL_ACADEMIC_V14_STATE;
  const exams =
    Array.isArray(raw.exams) && raw.exams.length > 0
      ? raw.exams
      : INITIAL_ACADEMIC_V14_STATE.exams;
  const subjects =
    Array.isArray(raw.subjects) && raw.subjects.length > 0
      ? raw.subjects
      : INITIAL_ACADEMIC_V14_STATE.subjects;
  const gradeSchemes =
    Array.isArray(raw.gradeSchemes) && raw.gradeSchemes.length > 0
      ? raw.gradeSchemes
      : INITIAL_ACADEMIC_V14_STATE.gradeSchemes;
  const interventions = Array.isArray(raw.interventions)
    ? raw.interventions
    : INITIAL_ACADEMIC_V14_STATE.interventions;

  // Pastikan tiada markah berganda bagi (examId + subjectId + noIdMurid)
  const rawScores = Array.isArray(raw.scores) ? raw.scores : INITIAL_ACADEMIC_V14_STATE.scores;
  const seenComposite = new Set<string>();
  const scores = rawScores.filter((sc) => {
    if (!sc || !sc.id || !sc.examId || !sc.subjectId || !sc.noIdMurid) return false;
    const key = `${sc.examId}::${sc.subjectId}::${sc.noIdMurid.toLowerCase()}`;
    if (seenComposite.has(key)) return false;
    seenComposite.add(key);
    return true;
  });

  return {
    exams,
    subjects,
    scores,
    gradeSchemes,
    interventions,
  };
}

function normalizeDocCenterV15(raw?: Partial<DocCenterV15State>): DocCenterV15State {
  if (!raw) return INITIAL_DOC_CENTER_V15_STATE;
  const categories =
    Array.isArray(raw.categories) && raw.categories.length > 0
      ? raw.categories
      : INITIAL_DOC_CENTER_V15_STATE.categories;
  const folders = Array.isArray(raw.folders)
    ? raw.folders
    : INITIAL_DOC_CENTER_V15_STATE.folders;
  const documents = Array.isArray(raw.documents)
    ? raw.documents.map((d) => ({
        ...d,
        versions:
          Array.isArray(d.versions) && d.versions.length > 0
            ? d.versions
            : [
                {
                  id: `ver-${d.id}-init`,
                  versi: d.versiSemasa || 'Versi 1.0',
                  tarikhPerubahan: d.tarikhDimuatNaik || d.tarikhDokumen,
                  oleh: d.pemilik,
                  catatanPerubahan: 'Rekod asal dokumen.',
                  statusPadaVersi: d.status || 'Aktif',
                  jenisFail: d.jenisFail || 'PDF',
                  saiz: d.saiz || '1.0 MB',
                  namaFail: d.namaFail,
                },
              ],
      }))
    : INITIAL_DOC_CENTER_V15_STATE.documents;
  const activities = Array.isArray(raw.activities)
    ? raw.activities
    : INITIAL_DOC_CENTER_V15_STATE.activities;

  return {
    categories,
    folders,
    documents,
    activities,
  };
}

/**
 * Lapisan storan tempatan (localStorage) yang direka secara modular.
 * Pada Fasa 2, fungsi di dalam servis ini boleh ditukar kepada pangkalan data awan
 * tanpa mengubah struktur komponen UI utama.
 */
export const storageService = {
  loadState(): EduSchoolState {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const academicV14 = normalizeAcademicV14();
        const docCenterV15 = normalizeDocCenterV15();
        return {
          ...INITIAL_EDUSCHOOL_STATE,
          academicV14,
          docCenterV15,
          examRecords: buildSyncedExamRecords(academicV14),
          documents: syncLegacyDocuments(docCenterV15),
          tasks: deduplicateAndNormalizeTasks(INITIAL_EDUSCHOOL_STATE.tasks),
          panitiaList: deduplicateAndNormalizePanitias(INITIAL_EDUSCHOOL_STATE.panitiaList),
        };
      }
      const migratedRaw = raw
        .replaceAll('Cikgu Azlan bin Hamzah', 'Cikgu Fedelish Modirim')
        .replaceAll('azlan.hamzah@smksalaping.demo.my', 'fedelish.modirim@smksalaping.demo.my');
      const parsed = JSON.parse(migratedRaw) as Partial<EduSchoolState>;
      const rawTasks = Array.isArray(parsed.tasks) ? parsed.tasks : INITIAL_EDUSCHOOL_STATE.tasks;
      const rawPanitias = Array.isArray(parsed.panitiaList)
        ? parsed.panitiaList
        : INITIAL_EDUSCHOOL_STATE.panitiaList;
      const academicV14 = normalizeAcademicV14(parsed.academicV14);
      const syncedRecords = buildSyncedExamRecords(academicV14);
      const docCenterV15 = normalizeDocCenterV15(parsed.docCenterV15);
      const syncedDocs = syncLegacyDocuments(docCenterV15);

      return {
        ...INITIAL_EDUSCHOOL_STATE,
        ...parsed,
        academicV14,
        docCenterV15,
        examRecords:
          syncedRecords.length > 0
            ? syncedRecords
            : Array.isArray(parsed.examRecords)
              ? parsed.examRecords
              : INITIAL_EDUSCHOOL_STATE.examRecords,
        documents: syncedDocs,
        tasks: deduplicateAndNormalizeTasks(rawTasks),
        panitiaList: deduplicateAndNormalizePanitias(rawPanitias),
      };
    } catch {
      const academicV14 = normalizeAcademicV14();
      const docCenterV15 = normalizeDocCenterV15();
      return {
        ...INITIAL_EDUSCHOOL_STATE,
        academicV14,
        docCenterV15,
        examRecords: buildSyncedExamRecords(academicV14),
        documents: syncLegacyDocuments(docCenterV15),
        tasks: deduplicateAndNormalizeTasks(INITIAL_EDUSCHOOL_STATE.tasks),
        panitiaList: deduplicateAndNormalizePanitias(INITIAL_EDUSCHOOL_STATE.panitiaList),
      };
    }
  },

  saveState(state: EduSchoolState): void {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Abaikan jika storan penuh atau disekat oleh pelayar
    }
  },

  resetState(): EduSchoolState {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Abaikan
    }
    const academicV14 = normalizeAcademicV14();
    const docCenterV15 = normalizeDocCenterV15();
    return {
      ...INITIAL_EDUSCHOOL_STATE,
      academicV14,
      docCenterV15,
      examRecords: buildSyncedExamRecords(academicV14),
      documents: syncLegacyDocuments(docCenterV15),
      tasks: deduplicateAndNormalizeTasks(INITIAL_EDUSCHOOL_STATE.tasks),
      panitiaList: deduplicateAndNormalizePanitias(INITIAL_EDUSCHOOL_STATE.panitiaList),
    };
  },
};
