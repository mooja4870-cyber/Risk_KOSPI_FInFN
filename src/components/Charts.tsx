import {
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
  ComposedChart,
  Legend,
  Cell,
} from 'recharts';
import { formatNumber, formatDateKR } from '../utils/analysis';
import type { IndexDataPoint } from '../data/benchmarkStaticData';

interface ChartDataPoint {
  date: string;
  value: number;
  ma5: number | null;
  ma20: number | null;
  cumulative: number;
  foreign: number;
  financialInvestment: number;
  isSell: boolean;
  kospiClose: number | null;
}

interface ChartsProps {
  data: ChartDataPoint[];
  compact?: boolean;
  entityLabel?: string; // 주 분석 대상 레이블 (예: "금융투자" or "외국인")
  crashDate?: string; // 충격일 수직선 표시 (YYYY-MM-DD)
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const formattedDate = typeof label === 'string' ? formatDateKR(label) : label;
    return (
      <div className="bg-gray-900/95 border border-gray-700 rounded-lg p-3 shadow-xl backdrop-blur-sm">
        <p className="text-gray-400 text-xs mb-2 font-mono font-medium">{formattedDate}</p>
        {payload.map((p: any, i: number) => {
          const isKospi = p.dataKey === 'kospiClose' || p.name === 'KOSPI';
          return (
            <p key={i} className="text-sm" style={{ color: p.color }}>
              {p.name}:{' '}
              {isKospi
                ? `${Number(p.value).toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} pt`
                : `${formatNumber(Math.round(p.value))}억`}
            </p>
          );
        })}
      </div>
    );
  }
  return null;
};

export function DailyBarChart({ data, compact = false, entityLabel = '금융투자', crashDate }: ChartsProps) {
  const chartData = data.map((d) => ({
    date: d.date,
    value: d.value,
    kospiClose: d.kospiClose,
    fill: d.value >= 0 ? '#10b981' : '#f43f5e',
  }));

  return (
    <div className="rounded-xl border border-gray-700/50 bg-gray-800/50 backdrop-blur-sm p-5">
      <h3 className="text-white font-bold mb-1">{entityLabel} 순매수/순매도 및 KOSPI 추이</h3>
      <p className="text-gray-400 text-xs mb-4">막대: {entityLabel} 순매수/순매도(억원) · 선: KOSPI 지수(pt)</p>
      <div className={compact ? 'h-[300px] sm:h-[357px]' : 'h-60 sm:h-72'}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} barCategoryGap="15%">
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              tickFormatter={(str) => (str ? str.slice(5) : '')}
              interval={Math.max(Math.floor(chartData.length / 12), 0)}
              axisLine={{ stroke: '#4b5563' }}
            />
            <YAxis
              yAxisId="flow"
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              axisLine={{ stroke: '#4b5563' }}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <YAxis
              yAxisId="kospi"
              orientation="right"
              tick={{ fill: '#67e8f9', fontSize: 10 }}
              axisLine={{ stroke: '#155e75' }}
              tickFormatter={(v) => Number(v).toLocaleString('ko-KR', { maximumFractionDigits: 0 })}
              domain={['auto', 'auto']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <ReferenceLine y={0} stroke="#6b7280" />
            {crashDate && (
              <ReferenceLine
                x={crashDate}
                stroke="#f43f5e"
                strokeDasharray="4 4"
                label={{ value: '충격일', fill: '#f87171', fontSize: 10, position: 'insideTopRight' }}
              />
            )}
            <Bar yAxisId="flow" dataKey="value" name={entityLabel} radius={[2, 2, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.fill} />
              ))}
            </Bar>
            <Line
              yAxisId="kospi"
              type="monotone"
              dataKey="kospiClose"
              name="KOSPI"
              stroke="#22d3ee"
              strokeWidth={2}
              dot={false}
              connectNulls={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function CumulativeChart({ data, compact = false, entityLabel = '금융투자' }: ChartsProps) {
  const chartData = data.map((d) => ({
    date: d.date,
    cumulative: d.cumulative,
  }));

  const isPositive =
    chartData.length > 0 && chartData[chartData.length - 1].cumulative >= 0;

  return (
    <div className="rounded-xl border border-gray-700/50 bg-gray-800/50 backdrop-blur-sm p-5">
      <h3 className="text-white font-bold mb-1">{entityLabel} 누적 순매수 추이</h3>
      <p className="text-gray-400 text-xs mb-4">Cumulative {entityLabel} Position (억원)</p>
      <div className={compact ? 'h-[200px] sm:h-[248px]' : 'h-60 sm:h-72'}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="cumGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={isPositive ? '#10b981' : '#f43f5e'}
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor={isPositive ? '#10b981' : '#f43f5e'}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              tickFormatter={(str) => (str ? str.slice(5) : '')}
              interval={Math.max(Math.floor(chartData.length / 12), 0)}
              axisLine={{ stroke: '#4b5563' }}
            />
            <YAxis
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              axisLine={{ stroke: '#4b5563' }}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="#6b7280" />
            <Area
              type="monotone"
              dataKey="cumulative"
              name={`누적 ${entityLabel} 순매수`}
              stroke={isPositive ? '#10b981' : '#f43f5e'}
              fill="url(#cumGradient)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function MovingAverageChart({ data, entityLabel = '금융투자' }: ChartsProps) {
  const chartData = data.map((d) => ({
    date: d.date,
    ma5: d.ma5 !== null ? Math.round(d.ma5) : null,
    ma20: d.ma20 !== null ? Math.round(d.ma20) : null,
  }));

  return (
    <div className="rounded-xl border border-gray-700/50 bg-gray-800/50 backdrop-blur-sm p-5">
      <h3 className="text-white font-bold mb-1">{entityLabel} 이동평균 방향성 분석</h3>
      <p className="text-gray-400 text-xs mb-4">5일 / 20일 이동평균 (MA5 &lt; MA20 = 매도 압력 우세)</p>
      <div className="h-60 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              tickFormatter={(str) => (str ? str.slice(5) : '')}
              interval={Math.max(Math.floor(chartData.length / 12), 0)}
              axisLine={{ stroke: '#4b5563' }}
            />
            <YAxis
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              axisLine={{ stroke: '#4b5563' }}
              tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '12px', color: '#9ca3af' }}
            />
            <ReferenceLine y={0} stroke="#6b7280" />
            <Line
              type="monotone"
              dataKey="ma5"
              name="MA5"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="ma20"
              name="MA20"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={false}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function ForeignCorrelationChart({ data, entityLabel = '금융투자' }: ChartsProps) {
  const counterpartLabel = entityLabel === '금융투자' ? '외국인' : '금융투자';
  const chartData = data.map((d) => ({
    date: d.date,
    primary: d.value,
    counterpart: entityLabel === '금융투자' ? d.foreign : d.financialInvestment,
    kospiClose: d.kospiClose,
  }));

  return (
    <div className="rounded-xl border border-gray-700/50 bg-gray-800/50 backdrop-blur-sm p-5">
      <h3 className="text-white font-bold mb-1">{entityLabel} vs {counterpartLabel} 수급 및 KOSPI 비교</h3>
      <p className="text-gray-400 text-xs mb-4">선: {entityLabel}/{counterpartLabel}(억원) · 하늘색 선: KOSPI 지수(pt)</p>
      <div className="h-60 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              tickFormatter={(str) => (str ? str.slice(5) : '')}
              interval={Math.max(Math.floor(chartData.length / 12), 0)}
              axisLine={{ stroke: '#4b5563' }}
            />
            <YAxis
              yAxisId="flow"
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              axisLine={{ stroke: '#4b5563' }}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <YAxis
              yAxisId="kospi"
              orientation="right"
              tick={{ fill: '#67e8f9', fontSize: 10 }}
              axisLine={{ stroke: '#155e75' }}
              tickFormatter={(v) => Number(v).toLocaleString('ko-KR', { maximumFractionDigits: 0 })}
              domain={['auto', 'auto']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <ReferenceLine y={0} yAxisId="flow" stroke="#6b7280" />
            <Line
              yAxisId="flow"
              type="monotone"
              dataKey="primary"
              name={entityLabel}
              stroke="#8b5cf6"
              strokeWidth={1.5}
              dot={false}
            />
            <Line
              yAxisId="flow"
              type="monotone"
              dataKey="counterpart"
              name={counterpartLabel}
              stroke="#06b6d4"
              strokeWidth={1.5}
              dot={false}
            />
            <Line
              yAxisId="kospi"
              type="monotone"
              dataKey="kospiClose"
              name="KOSPI"
              stroke="#22d3ee"
              strokeWidth={2}
              strokeOpacity={0.6}
              dot={false}
              connectNulls={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── 해외지수 전용 선 차트 (S&P500, DJIA 등) ──────────────────────────────────
interface IndexLineChartProps {
  data: IndexDataPoint[];
  indexLabel: string;  // 범례 표시명 (예: "S&P500", "DJIA")
  crashDate?: string;  // 기준일 (수직선): 예 "1987-10-19"
  color?: string;
}

const IndexTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900/95 border border-gray-700 rounded-lg p-3 shadow-xl">
        <p className="text-gray-400 text-xs mb-1 font-mono">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} className="text-sm" style={{ color: p.color }}>
            {p.name}: {Number(p.value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function IndexLineChart({ data, indexLabel, crashDate, color = '#f59e0b' }: IndexLineChartProps) {
  const isPositive = data.length > 1 && data[data.length - 1].close >= data[0].close;
  const areaColor = isPositive ? '#10b981' : '#f43f5e';

  return (
    <div className="rounded-xl border border-gray-700/50 bg-gray-800/50 backdrop-blur-sm p-5">
      <h3 className="text-white font-bold mb-1">{indexLabel} 지수 추이</h3>
      <p className="text-gray-400 text-xs mb-4">선: {indexLabel} 종가</p>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`indexGrad-${indexLabel}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={areaColor} stopOpacity={0.25} />
                <stop offset="95%" stopColor={areaColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              tickFormatter={(s: string) => s ? s.slice(5) : ''}
              interval={Math.max(Math.floor(data.length / 10), 0)}
              axisLine={{ stroke: '#4b5563' }}
            />
            <YAxis
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              axisLine={{ stroke: '#4b5563' }}
              tickFormatter={(v: number) => v.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              domain={['auto', 'auto']}
            />
            <Tooltip content={<IndexTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            {crashDate && (
              <ReferenceLine
                x={crashDate}
                stroke="#f43f5e"
                strokeDasharray="4 4"
                label={{ value: '충격일', fill: '#f87171', fontSize: 10 }}
              />
            )}
            <Area
              type="monotone"
              dataKey="close"
              name={indexLabel}
              stroke={color}
              fill={`url(#indexGrad-${indexLabel})`}
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
