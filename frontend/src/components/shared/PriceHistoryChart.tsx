'use client';

import { useEffect, useState } from 'react';
import { Clock, History } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Area,
} from 'recharts';
import { cn } from '@/lib/utils';
import { formatPKR } from '@/lib/formatters';
import type { PriceHistoryEntry } from '@/types/product';

interface PriceHistoryChartProps {
  data: PriceHistoryEntry[];
  loading?: boolean;
  className?: string;
}

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
});

function formatDate(iso: string): string {
  try {
    return dateFormatter.format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatCurrency(value: number): string {
  return `Rs.${value.toLocaleString('en-PK', { maximumFractionDigits: 0 })}`;
}

interface ChartDataPoint extends PriceHistoryEntry {
  displayDate: string;
}

function prepareChartData(data: PriceHistoryEntry[]): ChartDataPoint[] {
  return [...data]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((entry) => ({
      ...entry,
      displayDate: formatDate(entry.date),
    }));
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: ChartDataPoint }[];
}) {
  if (!active || !payload || !payload.length) return null;
  const entry = payload[0].payload;
  return (
    <div className="rounded-xl border border-gray-100 bg-white px-3 py-2.5 shadow-lg">
      <p className="text-xs text-[#6B7280]">{entry.displayDate}</p>
      <p className="font-mono text-sm font-semibold text-[#1F2933]">
        {formatPKR(entry.price)}
      </p>
    </div>
  );
}

function SinglePointView({ entry }: { entry: ChartDataPoint }) {
  return (
    <div className="flex flex-col items-center justify-center py-6">
      <div className="relative mb-3">
        <div className="h-4 w-4 rounded-full border-2 border-white bg-[#2E7D60] shadow-[0_0_0_3px_rgba(46,125,96,0.2)]" />
      </div>
      <p className="font-mono text-2xl font-bold text-[#2E7D60]">
        {formatPKR(entry.price)}
      </p>
      <p className="mt-1 text-xs text-[#6B7280]">Current price</p>
      <p className="mt-0.5 text-xs text-[#6B7280]">{entry.displayDate}</p>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="rounded-[1.1rem] border border-white/40 bg-white/60 p-4 backdrop-blur-[18px] saturate-[150%] shadow-[0_16px_28px_-24px_rgba(15,23,42,0.48)]">
      <div className="mb-3 flex items-center gap-2">
        <div className="details-modern-shimmer h-7 w-7 rounded-full" />
        <div className="details-modern-shimmer h-5 w-28 rounded-lg" />
      </div>
      <div className="details-modern-shimmer h-48 w-full rounded-lg" />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-[1.1rem] border border-white/40 bg-white/60 p-4 backdrop-blur-[18px] saturate-[150%] shadow-[0_16px_28px_-24px_rgba(15,23,42,0.48)]">
      <div className="mb-3 flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-emerald-100/80 text-[#2E7D60]">
          <Clock size={14} />
        </span>
        <h3 className="text-[17px] font-semibold text-[#1F2933]">Price History</h3>
      </div>
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <span className="mb-2 grid h-10 w-10 place-items-center rounded-full bg-gray-100 text-gray-400">
          <History size={20} />
        </span>
        <p className="text-sm font-medium text-gray-500">No price history available</p>
        <p className="mt-0.5 text-xs text-gray-400">
          Price changes will appear here once tracked.
        </p>
      </div>
    </div>
  );
}

export function PriceHistoryChart({ data, loading = false, className }: PriceHistoryChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (loading) {
    return <ChartSkeleton />;
  }

  if (!data || data.length === 0) {
    return <EmptyState />;
  }

  const chartData = prepareChartData(data);
  const isSinglePoint = chartData.length === 1;

  return (
    <div
      className={cn(
        'rounded-[1.1rem] border border-white/40 bg-white/60 p-4 backdrop-blur-[18px] saturate-[150%] shadow-[0_16px_28px_-24px_rgba(15,23,42,0.48)] transition-opacity duration-500',
        mounted ? 'opacity-100' : 'opacity-0',
        className,
      )}
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-emerald-100/80 text-[#2E7D60]">
          <Clock size={14} />
        </span>
        <h3 className="text-[17px] font-semibold text-[#1F2933]">Price History</h3>
      </div>

      {isSinglePoint ? (
        <SinglePointView entry={chartData[0]} />
      ) : (
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 15, left: 5, bottom: 5 }}
            >
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2E7D60" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="#2E7D60" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#E5E7EB"
                vertical={false}
              />
              <XAxis
                dataKey="displayDate"
                tick={{ fontSize: 12, fill: '#6B7280' }}
                tickLine={false}
                axisLine={{ stroke: '#E5E7EB' }}
                interval="preserveStartEnd"
                minTickGap={40}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#6B7280' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatCurrency}
                width={60}
                domain={['dataMin - 10', 'dataMax + 10']}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="price"
                fill="url(#priceGradient)"
                stroke="none"
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#2E7D60"
                strokeWidth={2.5}
                dot={(props: { cx?: number; cy?: number; payload?: ChartDataPoint }) => {
                  const { cx, cy, payload: entry } = props;
                  if (cx == null || cy == null || !entry) return <></>;
                  const isCurrent = entry.isCurrent;
                  return (
                    <circle
                      key={entry.date}
                      cx={cx}
                      cy={cy}
                      r={isCurrent ? 5 : 4}
                      fill="#2E7D60"
                      stroke="#fff"
                      strokeWidth={isCurrent ? 2.5 : 2}
                    />
                  );
                }}
                activeDot={{ r: 6, fill: '#2E7D60', stroke: '#fff', strokeWidth: 2.5 }}
                animationDuration={800}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
