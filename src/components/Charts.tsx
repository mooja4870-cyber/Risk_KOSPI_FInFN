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
import { useMemo, useState } from 'react';
import {
  formatNumber,
  formatDateKR,
  aggregateMovingAverageSeries,
  aggregateTradeData,
  calculateCorrelationSeries,
  type EntityKey,
  type CandleResolution,
} from '../utils/analysis';
import type { IndexDataPoint } from '../data/benchmarkStaticData';
import type { DailyTradeData } from '../data/mockData';

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
  entityLabel?: string; // 二?遺꾩꽍 ????덉씠釉?(?? "湲덉쑖?ъ옄" or "?멸뎅??)
  crashDate?: string; // 異⑷꺽???섏쭅???쒖떆 (YYYY-MM-DD)
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

export function DailyBarChart({ data, compact = false, entityLabel = '湲덉쑖?ъ옄', crashDate }: ChartsProps) {
  const [resolution, setResolution] = useState<CandleResolution>('day');
  const aggregated = useMemo(() => aggregateMovingAverageSeries(data, resolution), [data, resolution]);
  const chartData = aggregated.map((d) => ({
    date: d.date,
    value: d.value,
    kospiClose: d.kospiClose,
    fill: d.value >= 0 ? '#fbbf24' : '#dc2626',
  }));

  return (
    <div className="rounded-xl border border-gray-700/50 bg-gray-800/50 backdrop-blur-sm p-5">
      <div className="flex items-start justify-between gap-3 mb-1">
        <h3 className="text-white font-bold">{entityLabel} ?쒕ℓ???쒕ℓ??諛?KOSPI 異붿씠</h3>
        <div className="flex bg-gray-900/80 p-1 rounded-xl border border-gray-700/50">
          {[
            { value: 'day', label: '일봉' },
            { value: 'week', label: '주봉' },
            { value: 'month', label: '월봉' },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setResolution(opt.value as CandleResolution)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                resolution === opt.value
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <p className="text-gray-400 text-xs mb-4">留됰?: {entityLabel} ?쒕ℓ???쒕ℓ???듭썝) 쨌 ?? KOSPI 吏??pt)</p>
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
              stroke="#ef4444"
              strokeWidth={3}
              dot={false}
              connectNulls={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function CumulativeChart({ data, compact = false, entityLabel = '湲덉쑖?ъ옄' }: ChartsProps) {
  const chartData = data.map((d) => ({
    date: d.date,
    cumulative: d.cumulative,
  }));

  const isPositive =
    chartData.length > 0 && chartData[chartData.length - 1].cumulative >= 0;

  return (
    <div className="rounded-xl border border-gray-700/50 bg-gray-800/50 backdrop-blur-sm p-5">
      <h3 className="text-white font-bold mb-1">{entityLabel} ?꾩쟻 ?쒕ℓ??異붿씠</h3>
      <p className="text-gray-400 text-xs mb-4">Cumulative {entityLabel} Position (?듭썝)</p>
      <div className={compact ? 'h-[200px] sm:h-[248px]' : 'h-60 sm:h-72'}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="cumGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={isPositive ? '#fbbf24' : '#dc2626'}
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor={isPositive ? '#fbbf24' : '#dc2626'}
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
              stroke={isPositive ? '#fbbf24' : '#dc2626'}
              fill="url(#cumGradient)"
              strokeWidth={3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function MovingAverageChart({ data, entityLabel = '湲덉쑖?ъ옄' }: ChartsProps) {
  const chartData = data.map((d) => ({
    date: d.date,
    ma5: d.ma5 !== null ? Math.round(d.ma5) : null,
    ma20: d.ma20 !== null ? Math.round(d.ma20) : null,
  }));

  return (
    <div className="rounded-xl border border-gray-700/50 bg-gray-800/50 backdrop-blur-sm p-5">
      <h3 className="text-white font-bold mb-1">{entityLabel} ?대룞?됯퇏 諛⑺뼢??遺꾩꽍</h3>
      <p className="text-gray-400 text-xs mb-4">5??/ 20???대룞?됯퇏 (MA5 &lt; MA20 = 留ㅻ룄 ?뺣젰 ?곗꽭)</p>
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
              stroke="#10b981"
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

export function ForeignCorrelationChart({ data, entityLabel = '湲덉쑖?ъ옄' }: ChartsProps) {
  const counterpartLabel = entityLabel === '금융투자' ? '외국인' : '금융투자';
  const chartData = data.map((d) => ({
    date: d.date,
    primary: d.value,
    counterpart: entityLabel === '湲덉쑖?ъ옄' ? d.foreign : d.financialInvestment,
    kospiClose: d.kospiClose,
  }));

  return (
    <div className="rounded-xl border border-gray-700/50 bg-gray-800/50 backdrop-blur-sm p-5">
      <h3 className="text-white font-bold mb-1">{entityLabel} vs {counterpartLabel} ?섍툒 諛?KOSPI 鍮꾧탳</h3>
      <p className="text-gray-400 text-xs mb-4">?? {entityLabel}/{counterpartLabel}(?듭썝) 쨌 ?섎뒛???? KOSPI 吏??pt)</p>
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
              stroke="#fbbf24"
              strokeWidth={2.5}
              dot={false}
            />
            <Line
              yAxisId="flow"
              type="monotone"
              dataKey="counterpart"
              name={counterpartLabel}
              stroke="#3b82f6"
              strokeWidth={2.5}
              dot={false}
            />
            <Line
              yAxisId="kospi"
              type="monotone"
              dataKey="kospiClose"
              name="KOSPI"
              stroke="#ef4444"
              strokeWidth={3}
              strokeOpacity={0.9}
              dot={false}
              connectNulls={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ?? ?댁쇅吏???꾩슜 ??李⑦듃 (S&P500, DJIA ?? ??????????????????????????????????
interface IndexLineChartProps {
  data: IndexDataPoint[];
  indexLabel: string;  // 踰붾? ?쒖떆紐?(?? "S&P500", "DJIA")
  crashDate?: string;  // 湲곗???(?섏쭅??: ??"1987-10-19"
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
      <h3 className="text-white font-bold mb-1">{indexLabel} 吏??異붿씠</h3>
      <p className="text-gray-400 text-xs mb-4">?? {indexLabel} 醫낃?</p>
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

// ?? 嫄곕옒二쇱껜-肄붿뒪??諛⑺뼢 ?쇱튂??& 濡ㅻ쭅 ?곴?怨꾩닔 李⑦듃 ????????????????????????

interface CorrelationChartProps {
  data: DailyTradeData[];
  entityKey: EntityKey;
  entityLabel: string;
}

const WINDOW_OPTIONS = [
  { value: 200, label: '200일' },
  { value: 60, label: '60일' },
  { value: 20, label: '20일' },
  { value: 10, label: '10일' },
  { value: 5, label: '5일' },
  { value: 3, label: '3일' },
];

const CorrelationTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900/95 border border-gray-700 rounded-lg p-3 shadow-xl backdrop-blur-sm">
        <p className="text-gray-400 text-xs mb-2 font-mono">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} className="text-sm" style={{ color: p.color }}>
            {p.name}:{' '}
            {p.dataKey === 'directionalAgreement'
              ? `${p.value}%`
              : p.value?.toFixed(2)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function CorrelationChart({ data, entityKey, entityLabel }: CorrelationChartProps) {
  const [window, setWindow] = useState(10);
  const [resolution, setResolution] = useState<CandleResolution>('day');
  const aggregated = useMemo(() => aggregateTradeData(data, resolution), [data, resolution]);

  const series = calculateCorrelationSeries(aggregated, entityKey, window);

  return (
    <div className="rounded-xl border border-gray-700/50 bg-gray-800/50 backdrop-blur-sm p-5">
      {/* ?ㅻ뜑 */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-1">
        <div>
          <h3 className="text-white font-bold">
            {entityLabel} ??KOSPI 諛⑺뼢 ?쇱튂??&amp; ?곴?怨꾩닔
          </h3>
          <p className="text-gray-400 text-xs mt-0.5">
            ?뚮??? {window}??諛⑺뼢 ?쇱튂??%) 쨌 二쇳솴?? {window}??濡ㅻ쭅 ?쇱뼱???곴?怨꾩닔(-1~+1)
          </p>
        </div>
        {/* 李??ш린 ?좉? */}
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-900/80 p-1 rounded-xl border border-gray-700/50">
            {[
              { value: 'day', label: '일봉' },
              { value: 'week', label: '주봉' },
              { value: 'month', label: '월봉' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setResolution(opt.value as CandleResolution)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  resolution === opt.value
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="flex bg-gray-900/80 p-1 rounded-xl border border-gray-700/50">
            {WINDOW_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setWindow(opt.value)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  window === opt.value
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ?ㅻ챸 諛뺤뒪 */}
      <div className="mb-4 flex flex-wrap gap-3 text-[11px]">
        <span className="flex items-center gap-1.5 text-blue-400">
          <span className="inline-block w-4 h-0.5 bg-blue-400" />
          諛⑺뼢 ?쇱튂??50% ?댁긽 = ?숉뻾
        </span>
        <span className="flex items-center gap-1.5 text-amber-400">
          <span className="inline-block w-4 h-0.5 bg-amber-400" />
          ?곴?怨꾩닔 +0.5??= 媛뺥븳 ?묒쓽 ?곴?
        </span>
        <span className="flex items-center gap-1.5 text-rose-400">
          <span className="inline-block w-4 h-0.5 bg-rose-400 border-dashed" />
          ?곴?怨꾩닔 0??= 臾댁긽愿
        </span>
      </div>

      <div className="h-64 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={series}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              tickFormatter={(str) => (str ? str.slice(5) : '')}
              interval={Math.max(Math.floor(series.length / 12), 0)}
              axisLine={{ stroke: '#4b5563' }}
            />
            {/* ?쇱そ Y異? 諛⑺뼢 ?쇱튂??(0~100%) */}
            <YAxis
              yAxisId="agree"
              domain={[0, 100]}
              tick={{ fill: '#60a5fa', fontSize: 10 }}
              axisLine={{ stroke: '#1e40af' }}
              tickFormatter={(v) => `${v}%`}
            />
            {/* ?ㅻⅨ履?Y異? ?쇱뼱???곴?怨꾩닔 (-1~+1) */}
            <YAxis
              yAxisId="corr"
              orientation="right"
              domain={[-1, 1]}
              tick={{ fill: '#f59e0b', fontSize: 10 }}
              axisLine={{ stroke: '#78350f' }}
              tickFormatter={(v) => v.toFixed(1)}
            />
            <Tooltip content={<CorrelationTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />

            {/* 諛⑺뼢 ?쇱튂??50% 湲곗???*/}
            <ReferenceLine yAxisId="agree" y={50} stroke="#6b7280" strokeDasharray="4 4"
              label={{ value: '50%', fill: '#9ca3af', fontSize: 9, position: 'insideTopLeft' }} />
            {/* ?곴?怨꾩닔 0 湲곗???*/}
            <ReferenceLine yAxisId="corr" y={0} stroke="#f43f5e" strokeDasharray="3 3"
              label={{ value: 'r=0', fill: '#f87171', fontSize: 9, position: 'insideTopRight' }} />

            {/* 諛⑺뼢 ?쇱튂????*/}
            <Line
              yAxisId="agree"
              type="monotone"
              dataKey="directionalAgreement"
              name={`諛⑺뼢 ?쇱튂??(${window}??`}
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              connectNulls={false}
            />
            {/* 濡ㅻ쭅 ?쇱뼱???곴?怨꾩닔 ??*/}
            <Line
              yAxisId="corr"
              type="monotone"
              dataKey="rollingCorrelation"
              name={`濡ㅻ쭅 ?곴?怨꾩닔 (${window}??`}
              stroke="#f59e0b"
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

