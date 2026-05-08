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
    <div className={`rounded-xl border border-[var(--panel-border)] bg-[var(--panel)] backdrop-blur-sm ${compact ? 'p-3 sm:p-4 h-[200px] sm:h-[220px]' : 'p-4 sm:p-5'} flex flex-col h-full overflow-hidden shadow-sm`}>
      <div className={`flex items-center gap-3 ${compact ? 'mb-2' : 'mb-6'}`}>
        <div className="p-2 rounded-lg bg-[var(--danger)]/10">
          <Flame className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-[var(--danger)]`} />
        </div>
        <div>
          <h3 className="text-[var(--text)] font-bold">{entityLabel} 연속 순매도</h3>
          <p className="text-[var(--text-dim)] text-xs font-medium">종료일 기준 연속 매도 추적</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center">
        {isCurrentlySelling ? (
          <>
            <div className={`${compact ? 'mb-2' : 'mb-4'} relative`}>
              <div className="absolute inset-0 bg-[var(--danger)]/10 blur-2xl rounded-full" />
              <div className={`relative bg-[var(--bg-elev)] border border-[var(--danger)]/30 rounded-2xl ${compact ? 'px-5 py-3' : 'px-8 py-6'} shadow-xl`}>
                <div className="text-[var(--text-dim)] text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1">현재 연속 매도</div>
                <div className={`${compact ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-5xl'} font-black text-[var(--danger)] mb-1`}>
                  {info.currentStreak}<span className={`${compact ? 'text-base sm:text-lg' : 'text-xl sm:text-2xl'} ml-1 font-bold`}>일</span>
                </div>
                <div className={`${compact ? 'text-[10px] sm:text-xs' : 'text-xs sm:text-sm'} font-mono text-[var(--danger)] font-bold bg-[var(--danger)]/10 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border border-[var(--danger)]/20`}>
                  총 {formatNumber(Math.round(info.currentStreakAmount))}억
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[var(--danger)]/80">
              <AlertTriangle className={`${compact ? 'w-3 h-3' : 'w-4 h-4'}`} />
              <span className={`${compact ? 'text-xs' : 'text-sm'} font-bold`}>종료일 포함 매도세 지속 중</span>
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

      <div className={`${compact ? 'mt-2 pt-2 text-[10px]' : 'mt-6 pt-4 text-[11px]'} border-t border-[var(--panel-border)]/50 text-[var(--text-dim)] font-medium`}>
        <p>• 선택한 기간의 '종료일'이 {entityLabel} 순매도일 경우만 계산합니다.</p>
        <p>• 종료일부터 과거로 소급하여 매수 전환 전까지의 일수입니다.</p>
      </div>
    </div>
  );
}
