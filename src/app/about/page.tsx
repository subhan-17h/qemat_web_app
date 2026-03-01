'use client';

import { Heart, Rocket, Sparkles, TriangleAlert } from 'lucide-react';

import { AppBar } from '@/components/navigation/AppBar';
import { Card } from '@/components/shared/Card';

const sections = [
  {
    icon: Rocket,
    title: 'Our Mission',
    body: 'Qemat empowers consumers to make informed purchasing decisions by providing real-time price comparisons across local stores. We believe everyone deserves access to the best deals and transparent pricing information.',
    iconClass: 'bg-blue-100 text-blue-700'
  },
  {
    icon: TriangleAlert,
    title: 'The Problem We Solve',
    body: 'Price disparities across Pakistani supermarkets can be significant. Qemat makes this visible instantly, helping families avoid overpaying and save consistently on everyday essentials.',
    iconClass: 'bg-red-100 text-red-700'
  },
  {
    icon: Sparkles,
    title: 'Key Features',
    body: '• Real-time price comparison across stores.\n• Favorites list to track your regular products.\n• AI-powered savings recommendations.\n• Community-driven price updates.\n• Pharmaceutical prices alongside groceries.',
    iconClass: 'bg-amber-100 text-amber-700'
  },
  {
    icon: Heart,
    title: 'Why Users Love Qemat',
    body: 'Fast product discovery, trustworthy store-level prices, and clear savings insights make Qemat a daily companion for smart shopping decisions.',
    iconClass: 'bg-pink-100 text-pink-700'
  }
];

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-8 lg:px-8">
      <AppBar title="About Qemat" showBack />

      <div className="mt-4 space-y-3">
        {sections.map((section) => (
          <Card key={section.title} className="border border-gray-200">
            <div className="mb-2 flex items-center gap-2">
              <span className={`grid h-8 w-8 place-items-center rounded-full ${section.iconClass}`}>
                <section.icon size={16} />
              </span>
              <h2 className="text-lg font-bold text-gray-900">{section.title}</h2>
            </div>
            <p className="whitespace-pre-line text-sm leading-relaxed text-gray-700">{section.body}</p>
          </Card>
        ))}
      </div>

      <p className="mt-6 text-center text-sm text-gray-400">Version 1.0.0</p>
    </div>
  );
}
