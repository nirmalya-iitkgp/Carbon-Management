import React from 'react';
import { Download } from 'lucide-react';

export type WorkspaceSection = 'overview' | 'matrix' | 'macc' | 'arbitrage';

interface TopBarProps {
  activeSection: WorkspaceSection;
  onSelectSection: (section: WorkspaceSection) => void;
  onExportCsv: () => void;
}

const NAV_ITEMS: { id: WorkspaceSection; label: string }[] = [
  { id: 'overview', label: 'Command Overview' },
  { id: 'matrix', label: 'CBAM Matrix' },
  { id: 'macc', label: 'MACC & Capex' },
  { id: 'arbitrage', label: 'Sourcing Arbitrage' },
];

export const TopBar: React.FC<TopBarProps> = ({
  activeSection,
  onSelectSection,
  onExportCsv,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#0B120E]/95 backdrop-blur-sm border-b border-[#22352A]">
      <div className="max-w-[1440px] mx-auto px-6 h-14 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#overview"
          onClick={(e) => {
            e.preventDefault();
            onSelectSection('overview');
          }}
          className="font-display text-lg font-bold tracking-tight text-[#ECF3EE] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#84CC16] rounded"
        >
          CarbonLedger Trade
        </a>

        {/* Zone 2: 4 concise single-line text navigation links */}
        <nav aria-label="Primary Workspace Navigation" className="hidden md:flex items-center gap-7">
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectSection(item.id)}
                className={`relative py-1.5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#84CC16] rounded ${
                  isActive
                    ? 'text-[#84CC16]'
                    : 'text-[#9CB0A4] hover:text-[#ECF3EE]'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute left-0 right-0 -bottom-[17px] h-[2px] bg-[#84CC16]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onExportCsv}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#0B120E] bg-[#84CC16] hover:bg-[#95DC28] rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ECF3EE]"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Export Audit Report</span>
          </button>
        </div>
      </div>
    </header>
  );
};
