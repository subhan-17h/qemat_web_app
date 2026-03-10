'use client';

import Link from 'next/link';
import { CheckCircle2, ChevronDown, CircleHelp, Clock3, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import { useState } from 'react';
import type { CSSProperties } from 'react';

import { AppBar } from '@/components/navigation/AppBar';
import { Card } from '@/components/shared/Card';

const faqs = [
  {
    question: 'How does price comparison work?',
    answer: 'Qemat groups similar products from multiple stores and highlights where each item is cheapest in real time.'
  },
  {
    question: 'How accurate are the prices?',
    answer: 'Prices come from user contributions and verification checks. We recommend confirming at checkout for edge cases.'
  },
  {
    question: 'Can I contribute price information?',
    answer: 'Yes. Use the Add/Update Price screen to submit the latest shelf prices and help the community.'
  },
  {
    question: 'How do I earn rewards?',
    answer: 'Rewards are being rolled out. You will earn points for verified contributions and consistency.'
  },
  {
    question: 'What stores are covered?',
    answer: 'Currently: Al-Fatah, Carrefour, Imtiaz, Jalal Sons, Metro, and Rainbow.'
  }
];

const supportSections = [
  {
    icon: Mail,
    title: 'Email Support',
    body: 'For account issues, missing products, and pricing corrections.',
    actionLabel: 'help.qemat@gmail.com',
    actionHref: 'mailto:help.qemat@gmail.com'
  },
  {
    icon: Clock3,
    title: 'Response Time',
    body: 'We usually respond within 24 hours on business days.',
    actionLabel: 'Mon - Sat · 10AM - 8PM PKT'
  },
  {
    icon: ShieldCheck,
    title: 'Trust & Moderation',
    body: 'Submitted prices are checked with validation rules before wider impact.',
    actionLabel: 'Community-first verification'
  }
];

const contributionSteps = [
  'Open Add/Update Price from the app and choose the product.',
  'Enter current store price and ensure quantity/variant matches.',
  'Submit and keep contributing consistently to unlock upcoming rewards.'
];

export default function HelpPage() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-8 lg:px-8">
      <AppBar title="Help & Support" showBack sticky />

      <Card className="section-enter mt-4 rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-emerald-50 p-4" style={{ '--section-delay': '0ms' } as CSSProperties}>
        <span className="inline-flex items-center gap-1 rounded-full bg-white/85 px-2.5 py-1 text-xs font-semibold text-sky-700">
          <CircleHelp size={14} />
          Support Center
        </span>
        <h2 className="mt-2 text-xl font-bold text-gray-900">Need help with Qemat?</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-gray-700">
          Get guidance for account access, product search, price updates, and contribution questions.
        </p>
      </Card>

      <section className="section-enter mt-4 space-y-2" style={{ '--section-delay': '70ms' } as CSSProperties}>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Support Channels</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {supportSections.map((section) => (
            <Card key={section.title} className="rounded-2xl border border-gray-200/80 bg-white p-3.5">
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gray-100 text-gray-700">
                  <section.icon size={15} />
                </span>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">{section.title}</h4>
                  <p className="mt-0.5 text-xs leading-relaxed text-gray-600">{section.body}</p>
                  {section.actionHref ? (
                    <Link href={section.actionHref} className="mt-2 inline-flex text-xs font-semibold text-emerald-700 hover:text-emerald-600">
                      {section.actionLabel}
                    </Link>
                  ) : (
                    <p className="mt-2 text-xs font-semibold text-gray-700">{section.actionLabel}</p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <Card className="section-enter mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4" style={{ '--section-delay': '120ms' } as CSSProperties}>
        <div className="mb-2 flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-emerald-100 text-emerald-700">
            <Sparkles size={14} />
          </span>
          <h3 className="text-base font-bold text-gray-900">How to Contribute Prices</h3>
        </div>
        <div className="space-y-2">
          {contributionSteps.map((step) => (
            <div key={step} className="flex items-start gap-2">
              <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-700" />
              <p className="text-sm leading-relaxed text-gray-700">{step}</p>
            </div>
          ))}
        </div>
      </Card>

      <section className="section-enter mt-4 space-y-2" style={{ '--section-delay': '170ms' } as CSSProperties}>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Frequently Asked Questions</h3>
        {faqs.map((faq, index) => {
          const open = openIndex === index;

          return (
            <Card key={faq.question} className="rounded-2xl border border-gray-200/80 bg-white p-0">
              <button
                className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
                onClick={() => setOpenIndex(open ? -1 : index)}
              >
                <span className="font-semibold text-gray-900">{faq.question}</span>
                <ChevronDown className={`transition-transform ${open ? 'rotate-180' : ''}`} size={16} />
              </button>
              {open ? <p className="px-4 pb-4 text-sm leading-relaxed text-gray-700">{faq.answer}</p> : null}
            </Card>
          );
        })}
      </section>

      <style jsx>{`
        .section-enter {
          opacity: 0;
          transform: translateY(14px) scale(0.986);
          animation: help-section-in 560ms cubic-bezier(0.2, 0.88, 0.22, 1) forwards;
          animation-delay: var(--section-delay, 0ms);
        }

        @keyframes help-section-in {
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
          .section-enter {
            opacity: 1;
            transform: none;
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
