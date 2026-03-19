import type { ConsecutiveSellInfo } from '../utils/analysis';
import { formatNumber } from '../utils/analysis';
import { Flame, AlertTriangle, TrendingDown } from 'lucide-react';

interface Props {
  info: ConsecutiveSellInfo;
  compact?: boolean;
  entityLabel?: string;
}

export default function ConsecutiveSells({ info, compact = false, entityLabel = '금융투자' }: Props) {
  const isCurrentlySelling = info.currentStreak > 0;

  return (
    <div className={`rounded-xl border border-gray-700/50 bg-gray-800/50 backdrop-blur-sm ${compact ? 'p-3 sm:p-4 h-[200px] sm:h-[220px]' : 'p-4 sm:p-5'} flex flex-col h-full overflow-hidden`}>
      <div className={`flex items-center gap-3 ${compact ? 'mb-2' : 'mb-6'}`}>
        <div className="p-2 rounded-lg bg-rose-500/20">
          <Flame className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-rose-400`} />
        </div>
        <div>
          <h3 className="text-white font-bold">{entityLabel} 연속 순매도</h3>
          <p className="text-gray-400 text-xs">종료일 기준 연속 매도 추적</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center">
        {isCurrentlySelling ? (
          <>
            <div className={`${compact ? 'mb-2' : 'mb-4'} relative`}>
              <div className="absolute inset-0 bg-rose-500/20 blur-2xl rounded-full" />
              <div className={`relative bg-gray-900 border border-rose-500/30 rounded-2xl ${compact ? 'px-5 py-3' : 'px-8 py-6'} shadow-2xl`}>
                <div className="text-gray-400 text-[10px] sm:text-xs font-medium mb-1">현재 연속 매도</div>
                <div className={`${compact ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-5xl'} font-black text-rose-500 mb-1`}>
                  {info.currentStreak}<span className={`${compact ? 'text-base sm:text-lg' : 'text-xl sm:text-2xl'} ml-1 font-bold`}>일</span>
                </div>
                <div className={`${compact ? 'text-[10px] sm:text-xs' : 'text-xs sm:text-sm'} font-mono text-rose-300 font-semibold bg-rose-500/10 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border border-rose-500/20`}>
                  총 {formatNumber(Math.round(info.currentStreakAmount))}억
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-rose-400/80">
              <AlertTriangle className={`${compact ? 'w-3 h-3' : 'w-4 h-4'}`} />
              <span className={`${compact ? 'text-xs' : 'text-sm'} font-medium`}>종료일 포함 매도세 지속 중</span>
            </div>
          </>
        ) : (
          <div className={compact ? 'space-y-2' : 'space-y-4'}>
            <div className={`${compact ? 'w-12 h-12' : 'w-16 h-16'} bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20`}>
              <TrendingDown className={`${compact ? 'w-6 h-6' : 'w-8 h-8'} text-emerald-500 rotate-180`} />
            </div>
            <div>
              <div className={`text-emerald-400 font-bold ${compact ? 'text-base' : 'text-lg'}`}>연속 매도세 끊김</div>
              <p className={`text-gray-500 ${compact ? 'text-xs' : 'text-sm'} mt-1`}>
                종료일 매도세가 없거나<br />매수세로 전환되었습니다.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className={`${compact ? 'mt-2 pt-2 text-[10px]' : 'mt-6 pt-4 text-[11px]'} border-t border-gray-700/30 text-gray-500`}>
        <p>• 선택한 기간의 '종료일'이 {entityLabel} 순매도일 경우만 계산합니다.</p>
        <p>• 종료일부터 과거로 소급하여 매수 전환 전까지의 일수입니다.</p>
      </div>
    </div>
  );
}
