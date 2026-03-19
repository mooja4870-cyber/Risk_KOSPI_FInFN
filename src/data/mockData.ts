// Generate realistic mock data for Korean stock market investor trading
// Based on typical patterns from KOSPI investor trading data

export interface DailyTradeData {
  date: string; // YYYY-MM-DD
  individual: number; // 개인
  foreign: number; // 외국인
  institution: number; // 기관계
  financialInvestment: number; // 금융투자
  insurance: number; // 보험
  investmentTrust: number; // 투신
  bank: number; // 은행
  otherFinancial: number; // 기타금융
  pension: number; // 연기금
  otherCorporation: number; // 기타법인
  kospiClose?: number; // KOSPI 종가
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateMockData(): DailyTradeData[] {
  const data: DailyTradeData[] = [];
  const rand = seededRandom(42);

  const startDate = new Date('2024-01-02');
  const endDate = getKstYesterday();
  const current = new Date(startDate);

  // Patterns: financial investment tends to have streaks
  let financialTrend = 0;
  let foreignTrend = 0;
  let kospiLevel = 2500;

  while (current <= endDate) {
    const day = current.getDay();
    if (day === 0 || day === 6) {
      current.setDate(current.getDate() + 1);
      continue;
    }

    // Simulate trend shifts every ~15-25 days
    if (rand() < 0.05) {
      financialTrend = (rand() - 0.5) * 4000;
    }
    if (rand() < 0.05) {
      foreignTrend = (rand() - 0.5) * 6000;
    }

    const financialInvestment = Math.round(
      financialTrend + (rand() - 0.48) * 5000
    );
    const foreign = Math.round(foreignTrend + (rand() - 0.5) * 8000);
    const insurance = Math.round((rand() - 0.45) * 1500);
    const investmentTrust = Math.round((rand() - 0.52) * 2500);
    const bank = Math.round((rand() - 0.5) * 800);
    const otherFinancial = Math.round((rand() - 0.5) * 400);
    const pension = Math.round((rand() - 0.4) * 3000);
    const otherCorporation = Math.round((rand() - 0.5) * 1000);
    const institution =
      financialInvestment +
      insurance +
      investmentTrust +
      bank +
      otherFinancial +
      pension;
    const individual = -(institution + foreign + otherCorporation);
    const kospiDelta = (financialInvestment / 5000) * 2 + (rand() - 0.5) * 20;
    kospiLevel = Math.max(1500, Math.min(4000, kospiLevel + kospiDelta));

    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    const dateStr = String(current.getDate()).padStart(2, '0');

    data.push({
      date: `${year}-${month}-${dateStr}`,
      individual,
      foreign,
      institution,
      financialInvestment,
      insurance,
      investmentTrust,
      bank,
      otherFinancial,
      pension,
      otherCorporation,
      kospiClose: Number(kospiLevel.toFixed(2)),
    });

    current.setDate(current.getDate() + 1);
  }

  return data;
}

export const mockData = generateMockData();

function getKstYesterday(): Date {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const y = kst.getUTCFullYear();
  const m = kst.getUTCMonth();
  const d = kst.getUTCDate() - 1;
  return new Date(Date.UTC(y, m, d));
}
