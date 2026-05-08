import type { DailyTradeData } from '../data/mockData';
import { formatNumber, formatDateKR } from '../utils/analysis';
import { Table } from 'lucide-react';

interface Props {
  data: DailyTradeData[];
  entityKey?: import('../utils/analysis').EntityKey;
  entityLabel?: string;
}

export default function DataTable({ data, entityKey = 'financialInvestment', entityLabel = '금융투자' }: Props) {
  const sorted = [...data].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="rounded-xl border border-[var(--panel-border)] bg-[var(--panel)] backdrop-blur-sm p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-[var(--accent-primary)]/10">
          <Table className="w-5 h-5 text-[var(--accent-primary)]" />
        </div>
        <div>
          <h3 className="text-[var(--text)] font-bold">상세 데이터 테이블</h3>
          <p className="text-[var(--text-dim)] text-xs font-bold uppercase tracking-tight">현재 '{entityLabel}' 중심 데이터 분석 중</p>
        </div>
      </div>
      <div className="overflow-x-auto max-h-[600px] scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        <table className="w-full text-sm table-fixed">
          <thead>
            <tr className="border-b border-[var(--panel-border)] sticky top-0 bg-[var(--bg-elev)] z-10 transition-colors">
              <th className="text-left text-[var(--text-dim)] font-bold py-2 px-2 text-[10px] sm:text-xs whitespace-nowrap">날짜</th>
              <th className="text-right text-[var(--text-dim)] font-bold py-2 px-2 text-[10px] sm:text-xs whitespace-nowrap">코스피</th>
              <th className={`text-right text-[var(--text-dim)] font-bold py-2 px-2 text-[10px] sm:text-xs ${entityKey === 'foreign' ? 'text-[var(--accent-primary)] font-black bg-[var(--accent-primary)]/5' : ''}`}>외국인</th>
              <th className={`text-right text-[var(--text-dim)] font-bold py-2 px-2 text-[10px] sm:text-xs whitespace-nowrap ${entityKey === 'financialInvestment' ? 'text-[var(--accent-primary)] font-black bg-[var(--accent-primary)]/5' : ''}`}>금융투자</th>
              <th className="text-right text-[var(--text-dim)] font-bold py-2 px-2 text-[10px] sm:text-xs">개인</th>
              <th className="text-right text-[var(--text-dim)] font-bold py-2 px-2 text-[10px] sm:text-xs hidden md:table-cell">연기금</th>
              <th className="text-right text-[var(--text-dim)] font-bold py-2 px-2 text-[10px] sm:text-xs hidden md:table-cell">투신</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, idx) => {
              const prevClose = idx < sorted.length - 1 ? sorted[idx + 1].kospiClose : undefined;
              const kospiChange = (row.kospiClose != null && prevClose != null) ? row.kospiClose - prevClose : 0;
              const kospiColor = kospiChange > 0 ? 'text-red-500' : kospiChange < 0 ? 'text-blue-400' : 'text-gray-400';
              return (
                <tr
                  key={row.date}
                  className="border-b border-[var(--panel-border)]/30 hover:bg-[var(--bg-elev)]/50 transition-colors"
                >
                  <td className="py-2 px-2 text-[var(--text)] text-[10px] sm:text-xs whitespace-nowrap font-medium">
                    {formatDateKR(row.date)}
                  </td>
                  <td className={`py-2 px-2 text-right text-[10px] sm:text-xs font-mono whitespace-nowrap ${kospiColor}`}>
                    {row.kospiClose?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '-'}
                  </td>
                  <td
                    className={`py-2 px-2 text-right text-[10px] sm:text-xs font-mono ${entityKey === 'foreign' ? 'bg-[var(--accent-primary)]/5 font-black' : ''}`}
                    style={{color: row.foreign >= 0 ? 'var(--accent-primary)' : 'var(--danger)'}}
                  >
                    {formatNumber(row.foreign)}
                  </td>
                  <td
                    className={`py-2 px-2 text-right text-[10px] sm:text-xs font-mono ${entityKey === 'financialInvestment' ? 'bg-[var(--accent-primary)]/5 font-black' : ''}`}
                    style={{color: row.financialInvestment >= 0 ? 'var(--warning)' : 'var(--danger)'}}
                  >
                    {formatNumber(row.financialInvestment)}
                  </td>
                  <td
                    className={`py-2 px-2 text-right text-[10px] sm:text-xs font-mono`}
                    style={{color: row.individual >= 0 ? 'var(--text-dim)' : 'var(--danger)'}}
                  >
                    {formatNumber(row.individual)}
                  </td>
                  <td
                    className={`py-2 px-2 text-right text-[10px] sm:text-xs font-mono hidden md:table-cell`}
                    style={{color: row.pension >= 0 ? 'var(--accent-secondary)' : 'var(--danger)'}}
                  >
                    {formatNumber(row.pension)}
                  </td>
                  <td
                    className={`py-2 px-2 text-right text-[10px] sm:text-xs font-mono hidden md:table-cell`}
                    style={{color: row.investmentTrust >= 0 ? 'var(--accent-tertiary)' : 'var(--danger)'}}
                  >
                    {formatNumber(row.investmentTrust)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
