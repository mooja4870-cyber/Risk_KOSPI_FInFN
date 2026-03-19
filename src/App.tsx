import { useEffect, useMemo, useState } from 'react';
import { mockData, type DailyTradeData } from './data/mockData';
import {
  filterByDateRange,
  calculateStats,
  detectConsecutiveSells,
  calculateRiskScore,
  calculateMovingAverages,
  type EntityKey,
} from './utils/analysis';
import StatCards from './components/StatCards';
import RiskScore from './components/RiskScore';
import ConsecutiveSells from './components/ConsecutiveSells';
import {
  DailyBarChart,
  CumulativeChart,
  MovingAverageChart,
  ForeignCorrelationChart,
} from './components/Charts';
import DataTable from './components/DataTable';
import Benchmarking from './components/Benchmarking';
import {
  Search,
  BarChart3,
  CalendarDays,
  TrendingDown,
  Activity,
  Database,
  Zap,
  Globe2,
} from 'lucide-react';

type TabId = 'overview' | 'charts' | 'streaks' | 'data' | 'benchmark';

interface LatestTradingDataPayload {
  data?: DailyTradeData[];
  meta?: {
    source?: string;
    updatedAtKst?: string;
    latestTradingDate?: string;
  };
}

declare global {
  interface Window {
    BACKEND_DATA?: LatestTradingDataPayload;
  }
}

function getKstDateString(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value ?? '1970';
  const month = parts.find((part) => part.type === 'month')?.value ?? '01';
  const day = parts.find((part) => part.type === 'day')?.value ?? '01';
  return `${year}-${month}-${day}`;
}

function shiftMonths(dateStr: string, monthsBack: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const base = new Date(y, m - 1, d);
  base.setMonth(base.getMonth() - monthsBack);
  const year = base.getFullYear();
  const month = String(base.getMonth() + 1).padStart(2, '0');
  const day = String(base.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function clampToMinDate(date: string, minDate: string): string {
  return date < minDate ? minDate : date;
}

export default function App() {
  const [tradingData, setTradingData] = useState<DailyTradeData[]>(mockData);
  const [dataSource, setDataSource] = useState('시뮬레이션 데이터 (Demo)');
  const [dataUpdatedAt, setDataUpdatedAt] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(() => {
    const latest = mockData[mockData.length - 1]?.date ?? getKstDateString(new Date());
    const first = mockData[0]?.date ?? latest;
    return clampToMinDate(shiftMonths(latest, 3), first);
  });
  const [endDate, setEndDate] = useState(() => mockData[mockData.length - 1]?.date ?? getKstDateString(new Date()));
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [isAnalyzed, setIsAnalyzed] = useState(true);
  const [selectedEntity, setSelectedEntity] = useState<EntityKey>('financialInvestment');

  const entities: { id: EntityKey; label: string; desc: string }[] = [
    { id: 'financialInvestment', label: '금융투자', desc: '기관 중심 금융투자' },
    { id: 'foreign', label: '외국인', desc: '해외 자본 수급' },
    { id: 'combined', label: '금융투자+외국인', desc: '금융투자·외국인 합산' },
    { id: 'individual', label: '개인', desc: '개인 투자자 수급' },
  ];

  const currentEntity = entities.find((e) => e.id === selectedEntity)!;

  const earliestDataDate = tradingData[0]?.date ?? startDate;
  const latestDataDate = tradingData[tradingData.length - 1]?.date ?? endDate;
  const todayKst = useMemo(() => getKstDateString(new Date()), []);
  const yesterdayKst = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return getKstDateString(d);
  }, []);

  useEffect(() => {
    let cancelled = false;

    function applyPayload(payload: LatestTradingDataPayload) {
      if (!Array.isArray(payload.data) || payload.data.length === 0 || cancelled) return;

      const normalized = [...payload.data].sort((a, b) => a.date.localeCompare(b.date));
      const first = normalized[0].date;
      const latest = normalized[normalized.length - 1].date;

      setTradingData(normalized);
      setDataSource(payload.meta?.source ?? '네이버 API 업데이트 데이터');
      setDataUpdatedAt(payload.meta?.updatedAtKst ?? null);
      setStartDate(clampToMinDate(shiftMonths(latest, 3), first));
      setEndDate(latest);
      setIsAnalyzed(true);
    }

    async function loadLatestData() {
      try {
        if (window.BACKEND_DATA) {
          applyPayload(window.BACKEND_DATA);
          return;
        }

        const latestDataPath = `${import.meta.env.BASE_URL}latest-trading-data.json`;
        const response = await fetch(`${latestDataPath}?_ts=${Date.now()}`, {
          cache: 'no-store',
        });
        if (!response.ok) return;

        const payload = (await response.json()) as LatestTradingDataPayload;
        applyPayload(payload);
      } catch (error) {
        console.error('Failed to load latest data file:', error);
      }
    }

    void loadLatestData();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredData = useMemo(
    () => {
      if (!isAnalyzed) return [];
      const rangeStart = startDate <= endDate ? startDate : endDate;
      const rangeEnd = startDate <= endDate ? endDate : startDate;
      return filterByDateRange(tradingData, rangeStart, rangeEnd);
    },
    [tradingData, startDate, endDate, isAnalyzed]
  );
  const analyzedStartDate = startDate <= endDate ? startDate : endDate;
  const analyzedEndDate = startDate <= endDate ? endDate : startDate;

  const stats = useMemo(
    () => calculateStats(filteredData, selectedEntity),
    [filteredData, selectedEntity]
  );

  const consecutiveInfo = useMemo(
    () => detectConsecutiveSells(filteredData, selectedEntity),
    [filteredData, selectedEntity]
  );

  const riskAssessment = useMemo(
    () => calculateRiskScore(consecutiveInfo),
    [consecutiveInfo]
  );

  const chartData = useMemo(
    () => calculateMovingAverages(filteredData, selectedEntity),
    [filteredData, selectedEntity]
  );

  const handleAnalyze = () => {
    setIsAnalyzed(true);
  };

  const shortRangeEndDate = useMemo(
    () => (tradingData.some((row) => row.date === todayKst) ? todayKst : yesterdayKst),
    [tradingData, todayKst, yesterdayKst]
  );

  const presetRanges = useMemo(
    () => [
      {
        label: '최근 1개월',
        start: clampToMinDate(shiftMonths(shortRangeEndDate, 1), earliestDataDate),
        end: shortRangeEndDate,
      },
      {
        label: '최근 3개월',
        start: clampToMinDate(shiftMonths(shortRangeEndDate, 3), earliestDataDate),
        end: shortRangeEndDate,
      },
      {
        label: '최근 6개월',
        start: clampToMinDate(shiftMonths(latestDataDate, 6), earliestDataDate),
        end: latestDataDate,
      },
      {
        label: '최근 1년',
        start: clampToMinDate(shiftMonths(latestDataDate, 12), earliestDataDate),
        end: latestDataDate,
      },
      { label: '전체', start: earliestDataDate, end: latestDataDate },
    ],
    [shortRangeEndDate, earliestDataDate, latestDataDate]
  );

  const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: '개요', icon: BarChart3 },
    { id: 'charts', label: '차트분석', icon: Activity },
    { id: 'streaks', label: '연속매도', icon: TrendingDown },
    { id: 'data', label: '데이터', icon: Database },
    { id: 'benchmark', label: '벤치마킹', icon: Globe2 },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <header className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-x-4 gap-y-4 mb-2">
            <div className="flex flex-col sm:flex-row sm:items-end gap-x-4 gap-y-1">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/20">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl md:text-3xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  KOSPI '{currentEntity.label}' 수급 분석
                </h1>
              </div>
              <div className="flex flex-col">
                <p className="text-gray-400 text-[10px] sm:text-xs">
                  {currentEntity.desc} Flow Analyzer · 리스크 수급 분석
                </p>
                <p className="text-gray-500 text-[9px] sm:text-[11px] leading-tight mt-0.5">
                  거래주체 중 {currentEntity.label}에 대한 매도매수 추세분석으로 주식급락 예방 차원
                </p>
              </div>
            </div>

            {/* Entity Selector Toggle */}
            <div className="flex bg-gray-900/80 p-1 rounded-xl border border-gray-700/50 self-start sm:self-center">
              {entities.map((e) => (
                <button
                  key={e.id}
                  onClick={() => setSelectedEntity(e.id)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedEntity === e.id
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'text-gray-500 hover:text-gray-300'
                    }`}
                >
                  {e.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Control Panel */}
        <div className="mb-4 rounded-xl border border-gray-700/50 bg-gray-800/50 backdrop-blur-sm p-3 sm:p-4">
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-end gap-3 sm:gap-4">
            {/* Date inputs */}
            <div className="space-y-1">
              <label className="block text-[10px] text-gray-400 font-medium">
                <CalendarDays className="w-3 h-3 inline mr-1" />
                시작일
              </label>
              <input
                type="date"
                value={startDate}
                min={earliestDataDate}
                max={latestDataDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setIsAnalyzed(false);
                }}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-2 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] text-gray-400 font-medium">
                <CalendarDays className="w-3 h-3 inline mr-1" />
                종료일
              </label>
              <input
                type="date"
                value={endDate}
                min={earliestDataDate}
                max={latestDataDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setIsAnalyzed(false);
                }}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-2 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleAnalyze}
              className="col-span-2 sm:col-auto flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-lg text-xs font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95"
            >
              <Search className="w-3.5 h-3.5" />
              분석하기
            </button>

            {/* Preset ranges */}
            <div className="col-span-2 flex flex-wrap gap-1.5 sm:mt-0 mt-2">
              {presetRanges.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => {
                    setStartDate(preset.start);
                    setEndDate(preset.end);
                    setIsAnalyzed(true);
                  }}
                  className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-all border ${startDate === preset.start && endDate === preset.end
                    ? 'bg-blue-500/20 border-blue-500/40 text-blue-400'
                    : 'bg-gray-900/50 border-gray-700/50 text-gray-400 hover:border-gray-500 hover:text-gray-300'
                    }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="col-span-2 sm:col-auto sm:ml-auto">
              <a
                href="https://finance.naver.com/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-emerald-500/40 text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 hover:text-emerald-200 transition-all"
              >
                <Globe2 className="w-3.5 h-3.5" />
                네이버
              </a>
            </div>
          </div>

          {/* Data info */}
          {isAnalyzed && (
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-gray-500">
              <span className="flex items-center gap-1">📊 {analyzedStartDate} ~ {analyzedEndDate}</span>
              <span className="flex items-center gap-1">📅 {stats.tradingDays}일</span>
              <span className="text-emerald-400/80 flex items-center gap-1">
                🔄
                <a
                  href="https://finance.naver.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-400 hover:text-emerald-300 hover:underline"
                >
                  네이버
                </a>
              </span>
              {dataUpdatedAt && <span>🕒 {dataUpdatedAt.slice(5, 16)}</span>}
            </div>
          )}
        </div>


        {!isAnalyzed ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <Search className="w-16 h-16 text-gray-600 mb-4" />
            <h2 className="text-xl font-bold text-gray-400 mb-2">
              기간을 선택하고 분석하기를 클릭하세요
            </h2>
            <p className="text-gray-500 text-sm">
              날짜 범위를 설정하거나 프리셋 버튼을 사용할 수 있습니다
            </p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <Database className="w-16 h-16 text-gray-600 mb-4" />
            <h2 className="text-xl font-bold text-gray-400 mb-2">
              해당 기간에 데이터가 없습니다
            </h2>
            <p className="text-gray-500 text-sm">
              다른 기간을 선택해 주세요 ({earliestDataDate} ~ {latestDataDate})
            </p>
          </div>
        ) : (
          <>
            {/* Tab Navigation */}
            <div className="flex gap-1 mb-6 bg-gray-800/50 rounded-xl p-1 border border-gray-700/50 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all whitespace-nowrap ${activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border border-blue-500/30'
                    : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/30'
                    }`}
                  style={{ fontSize: '102%', fontWeight: 700 }}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Risk Score + Consecutive Sells side by side */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <RiskScore risk={riskAssessment} entityLabel={currentEntity.label} compact />
                  <ConsecutiveSells info={consecutiveInfo} entityLabel={currentEntity.label} compact />
                </div>

                {/* Quick Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="lg:col-span-2">
                    <DailyBarChart data={chartData} entityLabel={currentEntity.label} compact />
                  </div>
                </div>

                {/* Stat Cards */}
                <StatCards stats={stats} entityLabel={currentEntity.label} entityKey={selectedEntity} />

                {/* Market Interpretation Guide */}
                <div className="rounded-xl border border-gray-700/50 bg-gray-800/50 backdrop-blur-sm p-5">
                  <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                    <span className="text-lg">📖</span> 시장 해석 가이드
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold text-amber-400">⚠️ 하락 위험 신호</h4>
                      <div className="space-y-2 text-sm text-gray-400">
                        <p>• {currentEntity.label} 5일 연속 순매도 유지</p>
                        <p>• 코스피 20일선 하향 이탈 시 방어적 포지션 권고</p>
                        <p>• 대규모 단일일 순매도 폭증 시 급락 주의</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold text-emerald-400">📈 반등 가능 신호</h4>
                      <div className="space-y-2 text-sm text-gray-400">
                        <p>• 7일+ 연속 순매도 후 대규모 순매수 전환</p>
                        <p>• {currentEntity.label} 숏커버링 가능성 → 급반등 구간</p>
                        <p>• MA5가 MA20 상향 돌파 시 추세 전환 신호</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Charts Tab */}
            {activeTab === 'charts' && (
              <div className="space-y-6">
                <DailyBarChart data={chartData} entityLabel={currentEntity.label} />
                <CumulativeChart data={chartData} entityLabel={currentEntity.label} />
                <MovingAverageChart data={chartData} entityLabel={currentEntity.label} />
                <ForeignCorrelationChart data={chartData} entityLabel={currentEntity.label} />
              </div>
            )}

            {/* Streaks Tab */}
            {activeTab === 'streaks' && (
              <div className="space-y-6">
                <ConsecutiveSells info={consecutiveInfo} entityLabel={currentEntity.label} />

                {/* Streak Pattern Guide */}
                <div className="rounded-xl border border-gray-700/50 bg-gray-800/50 backdrop-blur-sm p-5">
                  <h3 className="text-white font-bold mb-4">연속 순매도 패턴별 시장 반응 ({currentEntity.label})</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">패턴</th>
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">시장 반응</th>
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">위험도</th>
                        </tr>
                      </thead>
                      <tbody className="text-gray-300">
                        <tr className="border-b border-gray-700/30">
                          <td className="py-3 px-4 font-medium">3일 연속 순매도</td>
                          <td className="py-3 px-4">단기 조정 가능성 증가</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              주의
                            </span>
                          </td>
                        </tr>
                        <tr className="border-b border-gray-700/30">
                          <td className="py-3 px-4 font-medium">5일 연속 순매도</td>
                          <td className="py-3 px-4">프로그램 매도 동반 시 하락 확률 상승</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30">
                              위험
                            </span>
                          </td>
                        </tr>
                        <tr className="border-b border-gray-700/30">
                          <td className="py-3 px-4 font-medium">7일 이상 순매도</td>
                          <td className="py-3 px-4">지수 변동성 급등 구간 가능성</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full text-xs bg-rose-500/20 text-rose-400 border border-rose-500/30">
                              고위험
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 font-medium">단일일 -1조 이상</td>
                          <td className="py-3 px-4">급락 구간과 동행하는 경우 다수</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full text-xs bg-rose-500/20 text-rose-400 border border-rose-500/30">
                              고위험
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Streaks Tab footer risk score */}
                <RiskScore risk={riskAssessment} entityLabel={currentEntity.label} />
              </div>
            )}

            {/* Data Tab */}
            {activeTab === 'data' && (
              <div className="space-y-6">
                <StatCards stats={stats} entityLabel={currentEntity.label} entityKey={selectedEntity} />
                <DataTable data={filteredData} entityLabel={currentEntity.label} entityKey={selectedEntity} />
              </div>
            )}

            {/* Benchmark Tab */}
            {activeTab === 'benchmark' && (
              <Benchmarking
                allData={tradingData}
                entityLabel={currentEntity.label}
                entityKey={selectedEntity}
              />
            )}
          </>
        )}

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-gray-800 text-center text-gray-500 text-xs pb-6">
          <p>⚠️ 본 분석 정보는 투자 참고용이며 투자 손익을 보장하지 않습니다.</p>
          <p className="mt-1">데이터 출처: {dataSource}</p>
        </footer>
      </div>
    </div>
  );
}
