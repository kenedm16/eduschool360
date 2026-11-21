import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface ModuleHeaderProps {
  title: string;
  description: string;
  onBackToDashboard?: () => void;
  actions?: React.ReactNode;
}

export const ModuleHeader: React.FC<ModuleHeaderProps> = ({
  title,
  description,
  onBackToDashboard,
  actions,
}) => {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-[#2B3139] mb-6">
      <div className="space-y-1 min-w-0">
        {onBackToDashboard && (
          <button
            type="button"
            onClick={onBackToDashboard}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#F0B90B] hover:text-[#F8D12F] transition-colors mb-1 whitespace-nowrap"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali ke Papan Pemuka
          </button>
        )}
        <h1 className="text-2xl font-bold text-[#EAECEF] tracking-tight text-balance">
          {title}
        </h1>
        <p className="text-sm text-[#848E9C]">{description}</p>
      </div>
      {actions && (
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">{actions}</div>
      )}
    </div>
  );
};
