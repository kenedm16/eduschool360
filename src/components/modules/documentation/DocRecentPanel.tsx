import React, { useMemo, useState } from 'react';
import { Clock, Download, Eye, FileText, GitBranch } from 'lucide-react';
import {
  DocCategoryItem,
  DocCenterDocument,
  DocFolderItem,
} from '../../../types/eduschool';
import { getCategoryName, getFolderName } from '../../../utils/docCenterHelpers';
import { triggerLocalFileDownload } from '../../../services/documentStorageAdapter';
import { EmptyState } from '../../common/EmptyState';

interface DocRecentPanelProps {
  documents: DocCenterDocument[];
  categories: DocCategoryItem[];
  folders: DocFolderItem[];
  onViewDocument: (doc: DocCenterDocument) => void;
  onNotify: (type: 'success' | 'info' | 'error', title: string, message?: string) => void;
}

export const DocRecentPanel: React.FC<DocRecentPanelProps> = ({
  documents,
  categories,
  folders,
  onViewDocument,
  onNotify,
}) => {
  const [filterScope, setFilterScope] = useState<'semua' | 'bulan_ini' | 'dikemaskini'>(
    'semua'
  );

  const currentYm = new Date().toISOString().slice(0, 7);

  const recentDocs = useMemo(() => {
    return [...documents]
      .filter((d) => {
        if (filterScope === 'bulan_ini') {
          return (d.tarikhDimuatNaik || d.tarikhDokumen).startsWith(currentYm);
        }
        if (filterScope === 'dikemaskini') {
          return d.versions.length > 1;
        }
        return true;
      })
      .sort(
        (a, b) =>
          b.tarikhDimuatNaik.localeCompare(a.tarikhDimuatNaik) ||
          b.tarikhDokumen.localeCompare(a.tarikhDokumen)
      );
  }, [documents, filterScope, currentYm]);

  return (
    <div className="space-y-5">
      <div className="bg-[#161A1E] p-4 rounded-xl border border-[#2B3139] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-[#EAECEF] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#F0B90B]" />
            Dokumen Terkini & Kemaskini Versi
          </h2>
          <p className="text-xs text-[#848E9C] mt-0.5">
            Senarai dokumen yang paling baharu dimuat naik atau mempunyai sejarah semakan versi terkini.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'semua', label: 'Semua Terkini' },
            { id: 'bulan_ini', label: 'Ditambah Bulan Ini' },
            { id: 'dikemaskini', label: 'Versi Dikemaskini' },
          ].map((btn) => (
            <button
              key={btn.id}
              type="button"
              onClick={() =>
                setFilterScope(btn.id as 'semua' | 'bulan_ini' | 'dikemaskini')
              }
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                filterScope === btn.id
                  ? 'bg-[#F0B90B] text-[#0B0E11] border-[#F0B90B] font-bold'
                  : 'bg-[#0B0E11] text-[#EAECEF] border-[#2B3139] hover:bg-[#1E2329]'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {recentDocs.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Tiada Dokumen Terkini Bagi Tapisan Ini"
          description="Pilih paparan 'Semua Terkini' atau muat naik dokumen baharu untuk melihat rekod di sini."
          actionLabel="Papar Semua Terkini"
          onAction={() => setFilterScope('semua')}
        />
      ) : (
        <div className="space-y-3">
          {recentDocs.map((doc) => {
            const latestVer = doc.versions[doc.versions.length - 1];
            return (
              <div
                key={doc.id}
                className="bg-[#161A1E] rounded-xl border border-[#2B3139] p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:border-[#F0B90B]/40 transition-colors"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-[#F0B90B]">
                      {doc.noRujukan}
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#1E2329] border border-[#2B3139] text-[#EAECEF]">
                      {getCategoryName(categories, doc.categoryId)}
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#0B0E11] border border-[#2B3139] text-[#38BDF8]">
                      {getFolderName(folders, doc.folderId)}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-[#F0B90B]/15 text-[#F0B90B]">
                      <GitBranch className="w-3 h-3" />
                      {doc.versiSemasa}
                    </span>
                  </div>

                  <h3 className="text-sm font-extrabold text-[#EAECEF]">
                    {doc.tajuk}
                  </h3>

                  {latestVer && (
                    <p className="text-xs text-[#848E9C]">
                      Catatan versi terkini ({latestVer.tarikhPerubahan}):{' '}
                      <span className="text-[#EAECEF]">{latestVer.catatanPerubahan}</span>
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <div className="text-left lg:text-right mr-2">
                    <div className="text-xs font-semibold text-[#EAECEF]">
                      {doc.pemilik}
                    </div>
                    <div className="text-[11px] font-mono text-[#848E9C]">
                      Muat naik: {doc.tarikhDimuatNaik} · {doc.jenisFail} ({doc.saiz})
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onViewDocument(doc)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-[#0B0E11] bg-[#F0B90B] rounded-lg hover:bg-[#F8D12F]"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Butiran & Versi
                  </button>

                  {doc.fileDataUrl ? (
                    <button
                      type="button"
                      onClick={() => {
                        triggerLocalFileDownload(
                          doc.fileDataUrl!,
                          doc.namaFail || `${doc.tajuk}.${doc.jenisFail.toLowerCase()}`
                        );
                        onNotify('success', 'Fail Dimuat Turun', doc.namaFail || doc.tajuk);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#0ECB81] bg-[#0ECB81]/15 border border-[#0ECB81]/30 rounded-lg hover:bg-[#0ECB81]/25"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Muat Turun
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
