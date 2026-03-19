import { useMemo } from 'react';
import { BookOpen, ExternalLink, TrendingDown } from 'lucide-react';
import type { DailyTradeData } from '../data/mockData';
import { DailyBarChart, IndexLineChart } from './Charts';
import { calculateMovingAverages, filterByDateRange, type EntityKey } from '../utils/analysis';
import { sp500BlackMonday1987, sp500FlashCrash2010, kospiIMFCrisis1998 } from '../data/benchmarkStaticData';

interface BenchmarkingProps {
  allData: DailyTradeData[];
  entityKey?: EntityKey;
  entityLabel?: string;
}

interface BenchmarkCase {
  market: '한국' | '미국';
  title: string;
  period: string;
  shock: string;
  mechanism: string;
  takeaway: string;
  sources: { label: string; url: string }[];
}

function formatSignedEok(value: number): string {
  const abs = Math.abs(Math.round(value)).toLocaleString('ko-KR');
  return `${value > 0 ? '+' : value < 0 ? '-' : ''}${abs}억`;
}

function marketBadge(market: BenchmarkCase['market']): string {
  if (market === '한국') return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
  return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
}

function getEntityVal(d: DailyTradeData, key: EntityKey): number {
  if (key === 'combined') return d.financialInvestment + d.foreign;
  return d[key] as number;
}

function findWorstSellInYear(data: DailyTradeData[], year: string, key: EntityKey): DailyTradeData | undefined {
  const rows = data.filter((row) => row.date.startsWith(`${year}-`));
  if (rows.length === 0) return undefined;
  return rows.reduce((worst, row) =>
    getEntityVal(row, key) < getEntityVal(worst, key) ? row : worst
  );
}

export default function Benchmarking({
  allData,
  entityKey = 'financialInvestment',
  entityLabel = '금융투자',
}: BenchmarkingProps) {
  const kr2008WorstSellDay = findWorstSellInYear(allData, '2008', entityKey);

  const benchmark2008Data = useMemo(() => {
    const start = '2008-09-01';
    const end = '2008-10-31';
    const filtered = filterByDateRange(allData, start, end);
    return calculateMovingAverages(filtered, entityKey);
  }, [allData, entityKey]);

  const benchmarkCases: BenchmarkCase[] = [
    {
      market: '한국',
      title: `2008 리먼 사태 구간 (${entityLabel} 실측 가능)`,
      period: '2008-09 ~ 2008-10',
      shock:
        kr2008WorstSellDay
          ? `2008년 ${entityLabel} 최대 순매도: ${kr2008WorstSellDay.date} ${formatSignedEok(getEntityVal(kr2008WorstSellDay, entityKey))}`
          : `글로벌 금융위기 구간에서 KOSPI 급락과 유동성 경색 동반`,
      mechanism:
        `신용경색 국면에서 ${entityLabel}와 프로그램 매매 계정의 포지션 축소·차익실현 매도가 반복되면, 하락 변동성이 더 커지는 패턴이 나타날 수 있음.`,
      takeaway:
        `${entityLabel} 순매도 절대금액이 급증하고 연속일수가 길어질수록, 지수 하방 리스크 관리(현금비중/헤지) 우선순위를 높여야 함.`,
      sources: [
        {
          label: `Naver ${entityLabel} 일별 추이 (KOSPI)`,
          url: 'https://finance.naver.com/sise/investorDealTrendDay.nhn?bizdate=215600&sosok=',
        },
        {
          label: 'Federal Reserve History: 2008 Financial Crisis',
          url: 'https://www.federalreservehistory.org/essays/great-recession-of-200709',
        },
      ],
    },
    {
      market: '한국',
      title: '1998 IMF 외환위기 구간 (정성 벤치마킹)',
      period: '1997-11 ~ 1998',
      shock:
        `위기 국면에서 주가 급락과 자금경색이 동반. 다만 본 앱 데이터 공급원은 2005-01-03 이후만 제공되어 일별 ${entityLabel} 실측치는 별도 DB 필요.`,
      mechanism:
        '유동성 확보를 위한 금융중개기관의 동시 매도는 급락장에서 가격 하방 압력을 키우는 방향으로 작동할 수 있음.',
      takeaway:
        `1998 구간까지 정량 검증하려면 KRX 장기 투자자별 수급 DB를 별도 적재해 ${entityLabel} 순매도-지수수익률 시차 분석을 수행해야 함.`,
      sources: [
        {
          label: 'Federal Reserve History: The Asian Financial Crisis',
          url: 'https://www.federalreservehistory.org/essays/asian-financial-crisis',
        },
        {
          label: 'BIS: Korea and the 1997 crisis (historical review)',
          url: 'https://www.bis.org/publ/qtrpdf/r_qt1412f.htm',
        },
      ],
    },
    {
      market: '미국',
      title: '1987 블랙먼데이',
      period: '1987-10-19',
      shock: 'DJIA -22.6% (일일 최대 하락률)',
      mechanism:
        '포트폴리오 인슈어런스와 프로그램 매매(기관계 규칙기반 매도)가 하락 시 추가 매도를 유발하는 피드백 루프를 형성.',
      takeaway:
        `${entityLabel}/기관계 자동매도 전략이 동시 작동하면 펀더멘털 대비 과도한 급락이 발생할 수 있음.`,
      sources: [
        {
          label: 'Federal Reserve History: Stock Market Crash of 1987',
          url: 'https://www.federalreservehistory.org/essays/stock-market-crash-of-1987',
        },
        {
          label: 'Federal Reserve FEDS: 1987 Crash and Fed response',
          url: 'https://www.federalreserve.gov/pubs/feds/2007/200713/index.html',
        },
      ],
    },
    {
      market: '미국',
      title: '2010 플래시 크래시',
      period: '2010-05-06',
      shock: '수분 내 급락·급반등, 유동성 급격 위축',
      mechanism:
        '대형 펀드의 대량 매도 알고리즘이 시장 미시구조와 상호작용하면서 주문장 유동성이 빠르게 사라지는 현상이 확인됨.',
      takeaway:
        `${entityLabel}사의 주문 실행 규칙(속도·물량·가격제약)은 하락장 전이 속도에 직접적 영향을 준다.`,
      sources: [
        {
          label: 'SEC/CFTC Joint Report (May 6, 2010)',
          url: 'https://www.sec.gov/about/reports-publications/joint-report-cftc-sec-2010-0926',
        },
        {
          label: 'CFTC Staff Report portal',
          url: 'https://www.cftc.gov/MarketReports/StaffReportonMay6MarketEvents/index.htm',
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {benchmarkCases.map((item) => (
        <div
          key={`${item.market}-${item.title}`}
          className="rounded-xl border border-gray-700/50 bg-gray-800/50 backdrop-blur-sm p-5"
        >
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className={`px-2 py-0.5 rounded-full border text-xs ${marketBadge(item.market)}`}>
              {item.market}
            </span>
            <h4 className="text-white font-bold">{item.title}</h4>
            <span className="text-gray-500 text-xs">{item.period}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="rounded-lg bg-gray-900/50 border border-gray-700/40 p-3">
              <div className="text-gray-400 text-xs mb-1">충격</div>
              <div className="text-rose-300 font-medium">{item.shock}</div>
            </div>
            <div className="rounded-lg bg-gray-900/50 border border-gray-700/40 p-3">
              <div className="text-gray-400 text-xs mb-1">메커니즘</div>
              <div className="text-gray-200">{item.mechanism}</div>
            </div>
            <div className="rounded-lg bg-gray-900/50 border border-gray-700/40 p-3">
              <div className="text-gray-400 text-xs mb-1">실무 시사점</div>
              <div className="text-emerald-300">{item.takeaway}</div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-700/40">
            {item.title.includes('2008') && benchmark2008Data.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3 text-white font-semibold text-sm">
                  <TrendingDown className="w-4 h-4 text-rose-400" />
                  실측 데이터 추세 (2008-09 ~ 2008-10)
                </div>
                <div className="bg-gray-900/40 rounded-xl overflow-hidden border border-gray-700/30">
                  <DailyBarChart data={benchmark2008Data} compact crashDate="2008-09-15" entityLabel={entityLabel} />
                </div>
              </div>
            )}

            {item.title.includes('1998') && kospiIMFCrisis1998.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3 text-white font-semibold text-sm">
                  <TrendingDown className="w-4 h-4 text-rose-400" />
                  실측 데이터 추세 (KOSPI 1997-11 ~ 1998-12, 야후 파이낸스)
                </div>
                <div className="bg-gray-900/40 rounded-xl overflow-hidden border border-gray-700/30">
                  <IndexLineChart
                    data={kospiIMFCrisis1998}
                    indexLabel="KOSPI"
                    crashDate="1997-11-21"
                    color="#22d3ee"
                  />
                </div>
              </div>
            )}

            {item.title.includes('1987') && sp500BlackMonday1987.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3 text-white font-semibold text-sm">
                  <TrendingDown className="w-4 h-4 text-amber-400" />
                  실측 데이터 추세 (S&P500 1987-09 ~ 1987-12)
                </div>
                <div className="bg-gray-900/40 rounded-xl overflow-hidden border border-gray-700/30">
                  <IndexLineChart
                    data={sp500BlackMonday1987}
                    indexLabel="S&P500"
                    crashDate="1987-10-19"
                    color="#f59e0b"
                  />
                </div>
              </div>
            )}

            {item.title.includes('2010') && sp500FlashCrash2010.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3 text-white font-semibold text-sm">
                  <TrendingDown className="w-4 h-4 text-amber-400" />
                  실측 데이터 추세 (S&P500 2010-04 ~ 2010-06)
                </div>
                <div className="bg-gray-900/40 rounded-xl overflow-hidden border border-gray-700/30">
                  <IndexLineChart
                    data={sp500FlashCrash2010}
                    indexLabel="S&P500"
                    crashDate="2010-05-06"
                    color="#f59e0b"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
              <BookOpen className="w-3.5 h-3.5" />
              세부내역
            </div>
            <div className="flex flex-col gap-1.5">
              {item.sources.map((source) => (
                <a
                  key={source.url}
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-cyan-300 hover:text-cyan-200 hover:underline w-fit"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  {source.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
