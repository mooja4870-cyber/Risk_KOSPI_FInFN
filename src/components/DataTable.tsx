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
    <div className="rounded-xl border border-gray-700/50 bg-gray-800/50 backdrop-blur-sm p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-blue-500/20">
          <Table className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h3 className="text-white font-bold">상세 데이터 테이블</h3>
          <p className="text-gray-400 text-xs text-blue-400/80">현재 '{entityLabel}' 중심 데이터 분석 중</p>
        </div>
      </div>
      <div className="overflow-x-auto max-h-[600px] scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        <table className="w-full text-sm table-fixed">
          <thead>
            <tr className="border-b border-gray-700 sticky top-0 bg-gray-800 z-10">
              <th className="text-left text-gray-400 font-medium py-2 px-2 text-[10px] sm:text-xs whitespace-nowrap">날짜</th>
              <th className="text-right text-gray-400 font-medium py-2 px-2 text-[10px] sm:text-xs whitespace-nowrap">코스피</th>
              <th className={`text-right text-gray-400 font-medium py-2 px-2 text-[10px] sm:text-xs ${entityKey === 'foreign' ? 'text-blue-400 font-bold bg-blue-500/5' : ''}`}>외국인</th>
              <th className={`text-right text-gray-400 font-medium py-2 px-2 text-[10px] sm:text-xs whitespace-nowrap ${entityKey === 'financialInvestment' ? 'text-blue-400 font-bold bg-blue-500/5' : ''}`}>금융투자</th>
              <th className="text-right text-gray-400 font-medium py-2 px-2 text-[10px] sm:text-xs">개인</th>
              <th className="text-right text-gray-400 font-medium py-2 px-2 text-[10px] sm:text-xs hidden md:table-cell">연기금</th>
              <th className="text-right text-gray-400 font-medium py-2 px-2 text-[10px] sm:text-xs hidden md:table-cell">투신</th>
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
                  className="border-b border-gray-700/30 hover:bg-gray-700/20 transition-colors"
                >
                  <td className="py-2 px-2 text-gray-300 text-[10px] sm:text-xs whitespace-nowrap">
                    {formatDateKR(row.date)}
                  </td>
                  <td className={`py-2 px-2 text-right text-[10px] sm:text-xs font-mono whitespace-nowrap ${kospiColor}`}>
                    {row.kospiClose?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '-'}
                  </td>
                  <td
                    className={`py-2 px-2 text-right text-[10px] sm:text-xs font-mono ${entityKey === 'foreign' ? 'bg-blue-500/5 font-black' : ''} ${row.foreign >= 0 ? 'text-red-500' : 'text-blue-400'
                      }`}
                  >
                    {formatNumber(row.foreign)}
                  </td>
                  <td
                    className={`py-2 px-2 text-right text-[10px] sm:text-xs font-mono ${entityKey === 'financialInvestment' ? 'bg-blue-500/5 font-black' : ''} ${row.financialInvestment >= 0 ? 'text-red-500' : 'text-blue-400'
                      }`}
                  >
                    {formatNumber(row.financialInvestment)}
                  </td>
                  <td
                    className={`py-2 px-2 text-right text-[10px] sm:text-xs font-mono ${row.individual >= 0 ? 'text-red-500' : 'text-blue-400'
                      }`}
                  >
                    {formatNumber(row.individual)}
                  </td>
                  <td
                    className={`py-2 px-2 text-right text-[10px] sm:text-xs font-mono hidden md:table-cell ${row.pension >= 0 ? 'text-red-500' : 'text-blue-400'
                      }`}
                  >
                    {formatNumber(row.pension)}
                  </td>
                  <td
                    className={`py-2 px-2 text-right text-[10px] sm:text-xs font-mono hidden md:table-cell ${row.investmentTrust >= 0 ? 'text-red-500' : 'text-blue-400'
                      }`}
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
