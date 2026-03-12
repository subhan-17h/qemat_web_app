'use client';

import { Database, Heart, Lock, Rocket, Sparkles, Store, Target, Users } from 'lucide-react';
import type { CSSProperties } from 'react';

import { AppBar } from '@/components/navigation/AppBar';
import { Card } from '@/components/shared/Card';

const sections = [
  {
    icon: Target,
    title: 'Our Mission',
    body: 'Qemat helps families and individuals buy smarter by making store-level price differences transparent and easy to compare.',
    points: ['Quickly compare grocery and pharma prices', 'Reduce overpaying on routine purchases', 'Build long-term savings habits'],
    iconClass: 'bg-blue-100 text-blue-700',
    accentClass: 'border-blue-100 bg-blue-50/40'
  },
  {
    icon: Store,
    title: 'How Qemat Works',
    body: 'We map equivalent products across participating stores so you can see where an item is cheapest before making a trip.',
    points: ['Search products with smart matching', 'View alternatives with store-specific pricing', 'Use product details to compare in one screen'],
    iconClass: 'bg-emerald-100 text-emerald-700',
    accentClass: 'border-emerald-100 bg-emerald-50/40'
  },
  {
    icon: Database,
    title: 'Price Data & Quality',
    body: 'Pricing comes from community contributions and verification checks to keep comparisons useful and trustworthy.',
    points: ['Validated submissions improve quality over time', 'Edge cases can happen, so confirm at checkout', 'Frequent contributors improve data freshness'],
    iconClass: 'bg-amber-100 text-amber-700',
    accentClass: 'border-amber-100 bg-amber-50/40'
  },
  {
    icon: Lock,
    title: 'Privacy & Accounts',
    body: 'Sign-in enables personalized experiences like favorites and synced usage across devices.',
    points: ['Authentication can be handled via Firebase', 'Product and pricing services run separately', 'Only needed data is used for app features'],
    iconClass: 'bg-violet-100 text-violet-700',
    accentClass: 'border-violet-100 bg-violet-50/40'
  },
  {
    icon: Rocket,
    title: 'What’s Next',
    body: 'Qemat is continuously evolving to make shopping decisions faster and more reliable.',
    points: ['Rewards for verified contributors', 'Broader city/store coverage', 'Smarter AI savings guidance'],
    iconClass: 'bg-sky-100 text-sky-700',
    accentClass: 'border-sky-100 bg-sky-50/40'
  },
  {
    icon: Users,
    title: 'Community First',
    body: 'Every correct update helps someone else save money. The platform improves as the community contributes.',
    points: ['Report missing or outdated prices', 'Share accurate product variants', 'Help keep store comparisons fair'],
    iconClass: 'bg-rose-100 text-rose-700',
    accentClass: 'border-rose-100 bg-rose-50/40'
  },
  {
    icon: Heart,
    title: 'Why Users Love Qemat',
    body: 'A clean shopping flow, transparent pricing, and clear savings potential make it a practical daily tool.',
    points: ['Fast search with meaningful sorting', 'Easy product-level compare view', 'Consistent interface across key screens'],
    iconClass: 'bg-pink-100 text-pink-700',
    accentClass: 'border-pink-100 bg-pink-50/40'
  }
];

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-8 lg:px-10 xl:px-12">
      <AppBar title="About Qemat" showBack sticky />

      <Card className="about-enter mt-4 rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-4" style={{ '--section-delay': '0ms' } as CSSProperties}>
        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
          <Sparkles size={14} />
          Product Overview
        </span>
        <h1 className="mt-2 text-xl font-bold text-gray-900">Built for transparent everyday shopping</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-gray-700">
          Qemat combines search, compare, and savings insights so users can choose the best store before buying.
        </p>
      </Card>

      <div className="mt-4 space-y-3">
        {sections.map((section, index) => (
          <Card
            key={section.title}
            className={`about-enter rounded-2xl border ${section.accentClass}`}
            style={{ '--section-delay': `${70 + index * 45}ms` } as CSSProperties}
          >
            <div className="mb-2.5 flex items-center gap-2">
              <span className={`grid h-8 w-8 place-items-center rounded-full ${section.iconClass}`}>
                <section.icon size={16} />
              </span>
              <h2 className="text-lg font-bold text-gray-900">{section.title}</h2>
            </div>
            <p className="text-sm leading-relaxed text-gray-700">{section.body}</p>
            <div className="mt-2.5 space-y-1.5">
              {section.points.map((point) => (
                <p key={point} className="text-sm text-gray-700">
                  • {point}
                </p>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <p className="about-enter mt-6 text-center text-sm text-gray-400" style={{ '--section-delay': '420ms' } as CSSProperties}>
        Version 1.0.0
      </p>

      <style jsx>{`
        .about-enter {
          opacity: 0;
          transform: translateY(14px) scale(0.986);
          animation: about-section-in 560ms cubic-bezier(0.2, 0.88, 0.22, 1) forwards;
          animation-delay: var(--section-delay, 0ms);
        }

        @keyframes about-section-in {
          0% {
            opacity: 0;
            transform: translateY(14px) scale(0.986);
            filter: blur(8px);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .about-enter {
            opacity: 1;
            transform: none;
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
