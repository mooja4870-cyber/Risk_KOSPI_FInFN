import { useState } from 'react';
import { formatNumber } from '../utils/analysis';
import type { StatsSummary } from '../utils/analysis';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Calendar,
  ArrowUpCircle,
  ArrowDownCircle,
  Activity,
  Info,
} from 'lucide-react';

interface StatCardsProps {
  stats: StatsSummary;
  entityLabel?: string;
  entityKey?: 'financialInvestment' | 'foreign';
}

export default function StatCards({ stats, entityLabel = '금융투자', entityKey = 'financialInvestment' }: StatCardsProps) {
  const [showPopup, setShowPopup] = useState(false);

  const formatAmount = (amount: number) => `${Math.round(amount).toLocaleString('ko-KR')}억`;
  const totalBuyAmount = stats.totalBuyAmount;
  const asPct = (amount: number) => (totalBuyAmount > 0 ? (amount / totalBuyAmount) * 100 : 0);
  const formatAmountWithPct = (amount: number) =>
    `${formatAmount(amount)} (${asPct(amount).toFixed(1)}%)`;

  const buyDetailRows = [
    { label: '총매수', value: stats.totalBuyAmount },
    { label: '개인', value: stats.individualBuyAmount },
    { label: '외국인', value: stats.foreignBuyAmount },
    { label: '기관계', value: stats.institutionBuyAmount },
    { label: '금융투자', value: stats.financialInvestmentBuyAmount },
    { label: '보험', value: stats.insuranceBuyAmount },
    { label: '투신', value: stats.investmentTrustBuyAmount },
    { label: '연기금', value: stats.pensionBuyAmount },
    { label: '기타법인', value: stats.otherCorporationBuyAmount },
  ];

  const currentEntityBuyAmount = entityKey === 'financialInvestment' 
    ? stats.financialInvestmentBuyAmount 
    : stats.foreignBuyAmount;

  const cards = [
    {
      label: '총 순매수',
      value: `${formatNumber(Math.round(stats.totalNetBuy))}억`,
      icon: stats.totalNetBuy >= 0 ? TrendingUp : TrendingDown,
      color: stats.totalNetBuy >= 0 ? 'text-emerald-400' : 'text-rose-400',
      bg: stats.totalNetBuy >= 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20',
    },
    {
      label: '매수비중',
      value: `${stats.financialBuySharePct.toFixed(1)}%`,
      subValue: `${entityLabel} ${formatAmount(currentEntityBuyAmount)}`,
      icon: BarChart3,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10 border-blue-500/20',
      hasPopup: true,
    },
    {
      label: '순매수 일수',
      value: `${stats.netBuyDays}일`,
      icon: ArrowUpCircle,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
    },
    {
      label: '순매도 일수',
      value: `${stats.netSellDays}일`,
      icon: ArrowDownCircle,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10 border-rose-500/20',
    },
    {
      label: '최대 순매수',
      value: `${formatNumber(Math.round(stats.maxNetBuy))}억`,
      icon: TrendingUp,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
    },
    {
      label: '최대 순매도',
      value: `${formatNumber(Math.round(stats.maxNetSell))}억`,
      icon: TrendingDown,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10 border-rose-500/20',
    },
    {
      label: '변동성',
      value: `${formatNumber(Math.round(stats.standardDeviation))}억`,
      icon: Activity,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
    },
    {
      label: '거래일수',
      value: `${stats.tradingDays}일`,
      icon: Calendar,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10 border-blue-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          onClick={card.hasPopup ? () => setShowPopup(!showPopup) : undefined}
          className={`relative rounded-xl border p-3 sm:p-4 ${card.bg} backdrop-blur-sm transition-all ${card.hasPopup ? 'cursor-pointer active:scale-95' : 'hover:scale-[1.02]'}`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <card.icon className={`w-3.5 h-3.5 ${card.color}`} />
              <span className="text-[10px] sm:text-xs text-gray-400 font-medium">{card.label}</span>
            </div>
            {card.hasPopup && <Info className="w-3 h-3 text-blue-400/50" />}
          </div>
          <div className="text-base sm:text-xl font-bold truncate">
            <span className={card.color}>{card.value}</span>
          </div>
          {'subValue' in card && card.subValue && (
            <div className="mt-0.5 text-[9px] sm:text-[11px] text-slate-400 truncate">
              {card.subValue}
            </div>
          )}

          {card.hasPopup && showPopup && (
            <div
              className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 z-[70] w-[280px] sm:w-72 rounded-xl border border-blue-500/30 bg-gray-950 p-3 sm:p-4 shadow-2xl ring-1 ring-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-2 text-[11px] sm:text-xs font-bold text-blue-300">
                  <div className="h-2.5 w-1 rounded-full bg-blue-400" />
                  매수금액 상세 비중
                </div>
                <button
                  onClick={() => setShowPopup(false)}
                  className="text-gray-500 hover:text-white text-xs"
                >닫기</button>
              </div>
              <div className="space-y-1.5">
                {buyDetailRows.map((row) => {
                  const isHighlighted = row.label === entityLabel;
                  return (
                    <div
                      key={row.label}
                      className={`flex items-center justify-between border-b border-white/5 pb-1 text-[10px] sm:text-xs last:border-0 last:pb-0 ${isHighlighted
                          ? 'rounded-md bg-blue-500/10 px-2 py-1 ring-1 ring-blue-500/20'
                          : ''
                        }`}
                    >
                      <span className={`font-medium ${isHighlighted ? 'text-blue-200' : 'text-slate-400'}`}>
                        {row.label}
                      </span>
                      <span className={`font-mono font-bold ${isHighlighted ? 'text-blue-100' : 'text-white'}`}>
                        {row.label === '총매수' ? `${formatAmount(row.value)} (100%)` : formatAmountWithPct(row.value)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
