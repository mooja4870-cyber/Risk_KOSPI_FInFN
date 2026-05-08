import type { RiskAssessment } from '../utils/analysis';
import { Shield, ShieldAlert, ShieldX, AlertTriangle } from 'lucide-react';

interface RiskScoreProps {
  risk: RiskAssessment;
  compact?: boolean;
  entityLabel?: string;
}

export default function RiskScore({ risk, compact = false, entityLabel = '금융투자' }: RiskScoreProps) {
  const config = {
    normal: {
      icon: Shield,
      gradient: 'from-emerald-500 to-green-600',
      bg: 'bg-emerald-500/10 border-emerald-500/30',
      textColor: 'text-emerald-400',
      barColor: 'bg-emerald-500',
      glow: 'shadow-emerald-500/20',
    },
    caution: {
      icon: AlertTriangle,
      gradient: 'from-amber-500 to-yellow-600',
      bg: 'bg-amber-500/10 border-amber-500/30',
      textColor: 'text-amber-400',
      barColor: 'bg-amber-500',
      glow: 'shadow-amber-500/20',
    },
    warning: {
      icon: ShieldAlert,
      gradient: 'from-orange-500 to-red-500',
      bg: 'bg-orange-500/10 border-orange-500/30',
      textColor: 'text-orange-400',
      barColor: 'bg-orange-500',
      glow: 'shadow-orange-500/20',
    },
    danger: {
      icon: ShieldX,
      gradient: 'from-red-500 to-rose-700',
      bg: 'bg-rose-500/10 border-rose-500/30',
      textColor: 'text-rose-400',
      barColor: 'bg-rose-500',
      glow: 'shadow-rose-500/20',
    },
  };

  const c = config[risk.level];
  const Icon = c.icon;
  const scorePercent = Math.min((risk.score / 10) * 100, 100);

  return (
    <div className={`rounded-xl border ${compact ? 'p-3 sm:p-4 h-[200px] sm:h-[220px]' : 'p-4 sm:p-5'} ${c.bg} backdrop-blur-sm shadow-lg ${c.glow} overflow-hidden`}>
      <div className={`flex items-center justify-between ${compact ? 'mb-2' : 'mb-4'}`}>
        <div className="flex items-center gap-3">
          <div className={`${compact ? 'p-2' : 'p-2.5'} rounded-lg bg-gradient-to-br ${c.gradient}`}>
            <Icon className={`${compact ? 'w-5 h-5' : 'w-6 h-6'} text-white`} />
          </div>
          <div>
            <h3 className={`text-[var(--text)] font-bold ${compact ? 'text-sm sm:text-base' : 'text-base sm:text-lg'}`}>{entityLabel} 리스크 점수</h3>
            <p className="text-[var(--text-dim)] text-[10px]">종료일 기준 연속 순매도 평가</p>
          </div>
        </div>
        <div className="text-right">
          <div className={`${compact ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-4xl'} font-black ${c.textColor}`}>{risk.score}</div>
          <div className={`${compact ? 'text-[9px] sm:text-xs' : 'text-[10px] sm:text-sm'} font-bold ${c.textColor} px-1.5 py-0.5 rounded-full ${c.bg}`}>
            {risk.label}
          </div>
        </div>
      </div>

      {/* Score bar */}
      <div className={compact ? 'mb-2' : 'mb-4'}>
        <div className="flex justify-between text-[10px] text-[var(--text-dim)] mb-1 font-medium">
          <span>0</span>
          <span>정상</span>
          <span>경계</span>
          <span>위험</span>
          <span>고위험</span>
          <span>10</span>
        </div>
        <div className={`${compact ? 'h-2' : 'h-3'} bg-[var(--bg-elev)] rounded-full border border-[var(--panel-border)] overflow-hidden shadow-inner`}>
          <div
            className={`h-full rounded-full bg-gradient-to-r ${c.gradient} transition-all duration-1000 ease-out`}
            style={{ width: `${scorePercent}%` }}
          />
        </div>
      </div>

      {/* Risk factors */}
      <div className={`${compact ? 'space-y-1' : 'space-y-1.5'} ${compact ? 'max-h-[90px] overflow-y-auto' : ''}`}>
        <p className="text-[10px] text-[var(--text-dim)] font-bold uppercase tracking-wider mb-1">리스크 요인 분석</p>
        {(compact ? risk.factors.slice(0, 2) : risk.factors).map((factor, i) => (
          <div
            key={i}
            className={`flex items-start gap-2 ${compact ? 'text-xs' : 'text-sm'} text-[var(--text-muted)]`}
          >
            <span className={`mt-1.5 w-1.5 h-1.5 rounded-full ${c.barColor} shrink-0 shadow-sm`} />
            <span className="leading-relaxed">{factor}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
