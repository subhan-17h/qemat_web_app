'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import {
  BarChart3,
  Bot,
  CalendarDays,
  Globe2,
  RefreshCw,
  Smartphone,
  UsersRound
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { AppBar } from '@/components/navigation/AppBar';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import { ApiError, fetchQrAnalytics, type QrAnalyticsResponse } from '@/lib/api';
import { useAppStore } from '@/store/app-store';

function toDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function defaultDateRange() {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - 29);
  return { from: toDateInput(from), to: toDateInput(to) };
}

function compactNumber(value: number): string {
  return new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(value);
}

function chartDate(value: string): string {
  return new Intl.DateTimeFormat('en-PK', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${value}T00:00:00Z`)
  );
}

export default function QrAnalyticsPage() {
  const router = useRouter();
  const { user } = useAppStore();
  const initialRange = useMemo(defaultDateRange, []);
  const [mounted, setMounted] = useState(false);
  const [from, setFrom] = useState(initialRange.from);
  const [to, setTo] = useState(initialRange.to);
  const [appliedRange, setAppliedRange] = useState(initialRange);
  const [data, setData] = useState<QrAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  const loadAnalytics = useCallback(async () => {
    if (!user?.token) return;
    setLoading(true);
    setError(null);
    setForbidden(false);
    try {
      const response = await fetchQrAnalytics(user.token, appliedRange.from, appliedRange.to);
      setData(response);
    } catch (requestError) {
      setData(null);
      if (requestError instanceof ApiError && requestError.status === 403) {
        setForbidden(true);
      } else if (requestError instanceof ApiError && requestError.status === 401) {
        setError('Your session has expired. Sign in again to continue.');
      } else {
        setError(requestError instanceof Error ? requestError.message : 'Unable to load QR analytics.');
      }
    } finally {
      setLoading(false);
    }
  }, [appliedRange, user?.token]);

  useEffect(() => {
    void loadAnalytics();
  }, [loadAnalytics]);

  if (!mounted) {
    return <div className="min-h-[60vh] animate-pulse bg-gray-50" />;
  }

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-screen-xl px-4 pb-10 lg:px-10">
        <AppBar title="QR Analytics" sticky />
        <Card className="mx-auto mt-8 max-w-lg p-8 text-center">
          <BarChart3 className="mx-auto text-brand-700" size={44} />
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Admin sign-in required</h1>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            Sign in with an allowlisted Qemat account to view poster QR performance.
          </p>
          <Button className="mt-6" onClick={() => router.push('/sign-in')}>
            Sign in
          </Button>
        </Card>
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="mx-auto w-full max-w-screen-xl px-4 pb-10 lg:px-10">
        <AppBar title="QR Analytics" sticky />
        <Card className="mx-auto mt-8 max-w-lg border-red-100 p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Access not authorized</h1>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            {user.email} is signed in, but it is not included in the QR analytics admin allowlist.
          </p>
        </Card>
      </div>
    );
  }

  const totals = data?.totals;
  const cards = [
    { label: 'QR link visits', value: totals?.totalVisits ?? 0, icon: Globe2, color: 'text-emerald-700', background: 'bg-emerald-50' },
    { label: 'Estimated unique visitors', value: totals?.estimatedUniqueVisitors ?? 0, icon: UsersRound, color: 'text-blue-700', background: 'bg-blue-50' },
    { label: 'Android visits', value: totals?.androidVisits ?? 0, icon: Smartphone, color: 'text-green-700', background: 'bg-green-50' },
    { label: 'iOS/web visits', value: totals?.iosVisits ?? 0, icon: Globe2, color: 'text-violet-700', background: 'bg-violet-50' },
    { label: 'All-time visits', value: data?.allTimeTotalVisits ?? 0, icon: BarChart3, color: 'text-amber-700', background: 'bg-amber-50' }
  ];

  return (
    <div className="mx-auto w-full max-w-screen-2xl px-4 pb-10 lg:px-10 xl:px-12">
      <AppBar title="QR Analytics" sticky />

      <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 lg:text-3xl">Poster performance</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">
            These are visits to the tracked QR links. Unique visitors are estimates based on a privacy-conscious first-party cookie.
          </p>
        </div>
        <Card className="flex flex-wrap items-end gap-3 p-3">
          <label className="text-xs font-semibold text-gray-600">
            From
            <input
              type="date"
              value={from}
              max={to}
              onChange={(event) => setFrom(event.target.value)}
              className="mt-1 block h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none focus:border-brand-500"
            />
          </label>
          <label className="text-xs font-semibold text-gray-600">
            To
            <input
              type="date"
              value={to}
              min={from}
              onChange={(event) => setTo(event.target.value)}
              className="mt-1 block h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none focus:border-brand-500"
            />
          </label>
          <Button
            size="sm"
            disabled={!from || !to || from > to}
            loading={loading}
            onClick={() => setAppliedRange({ from, to })}
          >
            Apply
          </Button>
          <Button size="sm" variant="ghost" aria-label="Refresh analytics" onClick={() => void loadAnalytics()} disabled={loading}>
            <RefreshCw size={16} />
          </Button>
        </Card>
      </div>

      {error ? (
        <Card className="mt-5 border-red-200 bg-red-50 text-sm text-red-700">
          {error}
          <button className="ml-2 font-semibold underline" onClick={() => void loadAnalytics()}>Try again</button>
        </Card>
      ) : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => (
          <Card key={card.label} className="p-4">
            <div className={`grid h-10 w-10 place-items-center rounded-xl ${card.background} ${card.color}`}>
              <card.icon size={20} />
            </div>
            <p className="mt-4 text-3xl font-extrabold text-gray-900">{loading && !data ? '—' : compactNumber(card.value)}</p>
            <p className="mt-1 text-xs font-semibold text-gray-500">{card.label}</p>
          </Card>
        ))}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <Card className="min-h-[390px] p-4 lg:p-6">
          <div className="flex items-center gap-2">
            <CalendarDays className="text-brand-700" size={20} />
            <h2 className="text-lg font-bold text-gray-900">Daily visits</h2>
          </div>
          {data && data.daily.every((point) => point.totalVisits === 0) ? (
            <div className="grid h-[300px] place-items-center text-center text-sm text-gray-500">
              No human QR link visits were recorded in this date range.
            </div>
          ) : (
            <div className="mt-5 h-[310px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.daily ?? []} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="androidFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0.03} />
                    </linearGradient>
                    <linearGradient id="iosFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={chartDate} tick={{ fontSize: 11 }} minTickGap={28} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip labelFormatter={(label) => chartDate(String(label))} />
                  <Legend />
                  <Area type="monotone" dataKey="androidVisits" name="Android" stroke="#16a34a" fill="url(#androidFill)" strokeWidth={2} />
                  <Area type="monotone" dataKey="iosVisits" name="iOS/web" stroke="#7c3aed" fill="url(#iosFill)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2">
            <Bot className="text-gray-500" size={20} />
            <h2 className="font-bold text-gray-900">Automated traffic</h2>
          </div>
          <p className="mt-5 text-4xl font-extrabold text-gray-900">
            {compactNumber(totals?.excludedAutomatedVisits ?? 0)}
          </p>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            Known bots, link previewers, and command-line clients excluded from the primary totals.
          </p>
          <div className="mt-6 rounded-xl bg-gray-50 p-3 text-xs leading-5 text-gray-500">
            Reporting timezone: <span className="font-semibold text-gray-700">{data?.period.timezone ?? 'Asia/Karachi'}</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
