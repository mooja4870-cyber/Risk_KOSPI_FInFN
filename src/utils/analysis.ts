import type { DailyTradeData } from '../data/mockData';

// Extended entity key that supports composite 'combined' option
export type EntityKey = 'financialInvestment' | 'foreign' | 'combined' | 'individual';

/** Returns the net-buy value for a row based on the selected entity key */
function getEntityValue(d: DailyTradeData, entityKey: EntityKey): number {
  if (entityKey === 'combined') return d.financialInvestment + d.foreign;
  return d[entityKey] as number;
}

export interface StatsSummary {
  totalNetBuy: number;
  averageDailyNetBuy: number;
  financialBuySharePct: number;
  totalBuyAmount: number;
  individualBuyAmount: number;
  foreignBuyAmount: number;
  institutionBuyAmount: number;
  financialInvestmentBuyAmount: number;
  insuranceBuyAmount: number;
  investmentTrustBuyAmount: number;
  pensionBuyAmount: number;
  otherCorporationBuyAmount: number;
  netBuyDays: number;
  netSellDays: number;
  maxNetBuy: number;
  maxNetSell: number;
  standardDeviation: number;
  tradingDays: number;
}

export interface ConsecutiveSellInfo {
  maxStreak: number;
  streaks: { startDate: string; endDate: string; days: number; totalAmount: number }[];
  currentStreak: number;
  structuralStreakCount: number;
  highRiskStreakCount: number;
  repeatStrength: number;
  structuralCoveragePct: number;
  currentStreakAmount: number;
}

export interface RiskAssessment {
  score: number;
  level: 'normal' | 'caution' | 'warning' | 'danger';
  label: string;
  factors: string[];
}

// Filter data by date range
export function filterByDateRange(
  data: DailyTradeData[],
  startDate: string,
  endDate: string
): DailyTradeData[] {
  return data.filter((d) => d.date >= startDate && d.date <= endDate);
}

// Calculate statistics
export function calculateStats(data: DailyTradeData[], entityKey: EntityKey = 'financialInvestment'): StatsSummary {
  if (data.length === 0) {
    return {
      totalNetBuy: 0,
      averageDailyNetBuy: 0,
      financialBuySharePct: 0,
      totalBuyAmount: 0,
      individualBuyAmount: 0,
      foreignBuyAmount: 0,
      institutionBuyAmount: 0,
      financialInvestmentBuyAmount: 0,
      insuranceBuyAmount: 0,
      investmentTrustBuyAmount: 0,
      pensionBuyAmount: 0,
      otherCorporationBuyAmount: 0,
      netBuyDays: 0,
      netSellDays: 0,
      maxNetBuy: 0,
      maxNetSell: 0,
      standardDeviation: 0,
      tradingDays: 0,
    };
  }

  const values = data.map((d) => getEntityValue(d, entityKey));
  const total = values.reduce((a, b) => a + b, 0);
  const mean = total / values.length;
  const individualBuyAmount = data.reduce((sum, d) => sum + Math.max(0, d.individual), 0);
  const foreignBuyAmount = data.reduce((sum, d) => sum + Math.max(0, d.foreign), 0);
  const institutionBuyAmount = data.reduce((sum, d) => sum + Math.max(0, d.institution), 0);
  const financialInvestmentBuyAmount = data.reduce(
    (sum, d) => sum + Math.max(0, d.financialInvestment),
    0
  );
  const insuranceBuyAmount = data.reduce((sum, d) => sum + Math.max(0, d.insurance), 0);
  const investmentTrustBuyAmount = data.reduce(
    (sum, d) => sum + Math.max(0, d.investmentTrust),
    0
  );
  const pensionBuyAmount = data.reduce((sum, d) => sum + Math.max(0, d.pension), 0);
  const otherCorporationBuyAmount = data.reduce(
    (sum, d) => sum + Math.max(0, d.otherCorporation),
    0
  );

  const totalBuyAmount = data.reduce(
    (sum, d) =>
      sum +
      Math.max(0, d.individual) +
      Math.max(0, d.foreign) +
      Math.max(0, d.institution) +
      Math.max(0, d.otherCorporation),
    0
  );
  const currentEntityBuyAmount = data.reduce((sum, d) => sum + Math.max(0, getEntityValue(d, entityKey)), 0);
  const financialBuySharePct =
    totalBuyAmount > 0 ? (currentEntityBuyAmount / totalBuyAmount) * 100 : 0;

  const netBuyDays = values.filter((v) => v > 0).length;
  const netSellDays = values.filter((v) => v < 0).length;

  const maxNetBuy = Math.max(...values);
  const maxNetSell = Math.min(...values);

  const variance =
    values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  const standardDeviation = Math.sqrt(variance);

  return {
    totalNetBuy: total,
    averageDailyNetBuy: mean,
    financialBuySharePct,
    totalBuyAmount,
    individualBuyAmount,
    foreignBuyAmount,
    institutionBuyAmount,
    financialInvestmentBuyAmount,
    insuranceBuyAmount,
    investmentTrustBuyAmount,
    pensionBuyAmount,
    otherCorporationBuyAmount,
    netBuyDays,
    netSellDays,
    maxNetBuy,
    maxNetSell,
    standardDeviation,
    tradingDays: data.length,
  };
}

// Detect consecutive sell streaks
export function detectConsecutiveSells(
  data: DailyTradeData[],
  entityKey: EntityKey = 'financialInvestment'
): ConsecutiveSellInfo {
  const allStreaks: ConsecutiveSellInfo['streaks'] = [];
  let maxStreak = 0;
  let currentStreak = 0;
  let streakStart = '';
  let streakAmount = 0;

  const sorted = [...data].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  for (let i = 0; i < sorted.length; i++) {
    const val = getEntityValue(sorted[i], entityKey);
    if (val < 0) {
      if (currentStreak === 0) {
        streakStart = sorted[i].date;
        streakAmount = 0;
      }
      currentStreak++;
      streakAmount += val;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      if (currentStreak > 0) {
        allStreaks.push({
          startDate: streakStart,
          endDate: sorted[i - 1].date,
          days: currentStreak,
          totalAmount: streakAmount,
        });
      }
      currentStreak = 0;
      streakAmount = 0;
    }
  }

  // Handle streak at end of data
  if (currentStreak > 0) {
    allStreaks.push({
      startDate: streakStart,
      endDate: sorted[sorted.length - 1].date,
      days: currentStreak,
      totalAmount: streakAmount,
    });
  }

  const structuralStreaks = allStreaks.filter((streak) => streak.days >= 3);
  const highRiskStreakCount = structuralStreaks.filter((streak) => streak.days >= 5).length;
  const repeatStrength = structuralStreaks.reduce((sum, streak) => sum + (streak.days - 2), 0);
  const structuralDays = structuralStreaks.reduce((sum, streak) => sum + streak.days, 0);
  const structuralCoveragePct = sorted.length > 0 ? (structuralDays / sorted.length) * 100 : 0;

  return {
    maxStreak,
    streaks: structuralStreaks.sort((a, b) => b.days - a.days),
    currentStreak:
      sorted.length > 0 &&
        getEntityValue(sorted[sorted.length - 1], entityKey) < 0
        ? currentStreak
        : 0,
    structuralStreakCount: structuralStreaks.length,
    highRiskStreakCount,
    repeatStrength,
    structuralCoveragePct,
    currentStreakAmount:
      sorted.length > 0 &&
        getEntityValue(sorted[sorted.length - 1], entityKey) < 0
        ? streakAmount
        : 0,
  };
}

// Calculate risk score
export function calculateRiskScore(
  consecutiveInfo: ConsecutiveSellInfo
): RiskAssessment {
  const streak = consecutiveInfo.currentStreak;
  const streakAmount = consecutiveInfo.currentStreakAmount;
  let score = 0;
  const factors: string[] = [];

  // Risk score is linked only to end-date consecutive sell detection.
  if (streak <= 0) {
    score = 0;
    factors.push('종료일 기준 연속 순매도 없음');
  } else if (streak === 1) {
    score = 1;
    factors.push('종료일 기준 1일 연속 순매도');
  } else if (streak === 2) {
    score = 2;
    factors.push('종료일 기준 2일 연속 순매도 (경계)');
  } else if (streak <= 4) {
    score = 4;
    factors.push(`종료일 기준 ${streak}일 연속 순매도 (구조적 약세 시작)`);
  } else if (streak <= 6) {
    score = 7;
    factors.push(`종료일 기준 ${streak}일 연속 순매도 (위험)`);
  } else {
    score = 10;
    factors.push(`종료일 기준 ${streak}일 연속 순매도 (고위험)`);
  }

  if (streak >= 2) {
    factors.push(`종료일 기준 연속 구간 누적 ${formatNumber(Math.round(streakAmount))}억`);
  }

  let level: RiskAssessment['level'];
  let label: string;

  if (score <= 1) {
    level = 'normal';
    label = '정상';
  } else if (score <= 3) {
    level = 'caution';
    label = '경계';
  } else if (score <= 5) {
    level = 'warning';
    label = '위험';
  } else {
    level = 'danger';
    label = '고위험';
  }

  if (factors.length === 0) {
    factors.push('종료일 기준 연속 하락/순매도 구조 신호 없음');
  }

  return { score, level, label, factors };
}

// Calculate moving averages
export function calculateMovingAverages(
  data: DailyTradeData[],
  entityKey: EntityKey = 'financialInvestment'
): {
  date: string;
  value: number;
  ma5: number | null;
  ma20: number | null;
  cumulative: number;
  foreign: number;
  financialInvestment: number;
  isSell: boolean;
  kospiClose: number | null;
}[] {
  const sorted = [...data].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  let cumSum = 0;

  return sorted.map((d, i) => {
    const val = getEntityValue(d, entityKey);
    cumSum += val;

    let ma5: number | null = null;
    let ma20: number | null = null;

    if (i >= 4) {
      const slice5 = sorted.slice(i - 4, i + 1);
      ma5 = slice5.reduce((s, x) => s + getEntityValue(x, entityKey), 0) / 5;
    }

    if (i >= 19) {
      const slice20 = sorted.slice(i - 19, i + 1);
      ma20 = slice20.reduce((s, x) => s + getEntityValue(x, entityKey), 0) / 20;
    }

    return {
      date: d.date,
      value: val,
      ma5,
      ma20,
      cumulative: cumSum,
      foreign: d.foreign,
      financialInvestment: d.financialInvestment,
      isSell: val < 0,
      kospiClose: typeof d.kospiClose === 'number' ? d.kospiClose : null,
    };
  });
}


// Format number with commas and sign
export function formatNumber(num: number): string {
  const sign = num > 0 ? '+' : '';
  return sign + num.toLocaleString('ko-KR');
}

// Format date to Korean style
export function formatDateKR(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export interface CorrelationPoint {
  date: string;
  directionalAgreement: number | null; // 방향 일치율 0~100 (%)
  rollingCorrelation: number | null;   // 피어슨 상관계수 -1 ~ +1
}

/**
 * 거래주체 순매수 방향과 코스피 방향 간의 "방향 일치율"과 "롤링 피어슨 상관계수"를 계산.
 * @param data 날짜별 거래 데이터
 * @param entityKey 분석 대상 주체 키
 * @param window 이동 창 크기 (3, 5, 10, 20일)
 */
export function calculateCorrelationSeries(
  data: DailyTradeData[],
  entityKey: EntityKey,
  window: number
): CorrelationPoint[] {
  if (data.length < 2) return [];

  const sorted = [...data].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // 피어슨 상관계수 헬퍼
  function pearsonR(xs: number[], ys: number[]): number {
    const n = xs.length;
    if (n < 2) return 0;
    const meanX = xs.reduce((a, b) => a + b, 0) / n;
    const meanY = ys.reduce((a, b) => a + b, 0) / n;
    const num = xs.reduce((sum, x, i) => sum + (x - meanX) * (ys[i] - meanY), 0);
    const denX = Math.sqrt(xs.reduce((sum, x) => sum + Math.pow(x - meanX, 2), 0));
    const denY = Math.sqrt(ys.reduce((sum, y) => sum + Math.pow(y - meanY, 2), 0));
    if (denX === 0 || denY === 0) return 0;
    return num / (denX * denY);
  }

  return sorted.map((_, i) => {
    if (i < window) {
      return { date: sorted[i].date, directionalAgreement: null, rollingCorrelation: null };
    }

    const slice = sorted.slice(i - window, i);
    const entityVals = slice.map(d => getEntityValue(d, entityKey));
    const kospiVals = slice.map(d => d.kospiClose ?? 0);

    // 방향 일치율: 전일 대비 방향이 같으면 1, 다르면 0
    let matchCount = 0;
    let validDays = 0;
    for (let j = 1; j < slice.length; j++) {
      const entityDir = entityVals[j] - entityVals[j - 1];
      const kospiDir = kospiVals[j] - kospiVals[j - 1];
      if (entityDir !== 0 && kospiDir !== 0) {
        validDays++;
        if ((entityDir > 0) === (kospiDir > 0)) matchCount++;
      }
    }
    const directionalAgreement = validDays > 0
      ? Math.round((matchCount / validDays) * 100)
      : null;

    // 롤링 피어슨 상관계수: 순매수 값과 코스피 종가 간의 상관
    const rollingCorrelation = kospiVals.some(v => v !== 0)
      ? Math.round(pearsonR(entityVals, kospiVals) * 100) / 100
      : null;

    return {
      date: sorted[i].date,
      directionalAgreement,
      rollingCorrelation,
    };
  });
}

