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
    <div className="mx-auto w-full max-w-4xl px-4 pb-8 lg:px-10 xl:px-12">
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
            <Card
              key={faq.question}
              className="faq-card rounded-2xl border border-gray-200/80 bg-white p-0"
              style={{ '--faq-delay': `${index * 50}ms` } as CSSProperties}
            >
              <button
                className={`faq-trigger flex w-full items-center justify-between gap-2 rounded-2xl px-4 py-3 text-left ${open ? 'faq-trigger-open' : ''}`}
                onClick={() => setOpenIndex(open ? -1 : index)}
              >
                <span className="font-semibold text-gray-900">{faq.question}</span>
                <span className={`faq-chevron-wrap ${open ? 'faq-chevron-wrap-open' : ''}`}>
                  <ChevronDown className={`faq-chevron ${open ? 'rotate-180' : ''}`} size={16} />
                </span>
              </button>
              <div className={`faq-answer-grid ${open ? 'faq-answer-grid-open' : ''}`}>
                <p className={`faq-answer-content px-4 pb-4 text-sm leading-relaxed text-gray-700 ${open ? 'faq-answer-content-open' : ''}`}>
                  {faq.answer}
                </p>
              </div>
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

        .faq-card {
          opacity: 0;
          transform: translateY(10px) scale(0.992);
          animation: faq-card-in 460ms cubic-bezier(0.2, 0.88, 0.22, 1) forwards;
          animation-delay: var(--faq-delay, 0ms);
          transition:
            border-color 260ms ease,
            box-shadow 320ms cubic-bezier(0.2, 0.9, 0.2, 1),
            transform 320ms cubic-bezier(0.2, 0.9, 0.2, 1);
        }

        .faq-card:hover {
          border-color: rgba(16, 185, 129, 0.35);
          box-shadow: 0 12px 28px -24px rgba(15, 23, 42, 0.45);
          transform: translateY(-1px);
        }

        .faq-trigger {
          transition:
            background-color 260ms ease,
            color 220ms ease;
        }

        .faq-trigger-open {
          background: linear-gradient(180deg, rgba(236, 253, 245, 0.65) 0%, rgba(255, 255, 255, 0.96) 100%);
        }

        .faq-chevron-wrap {
          display: grid;
          place-items: center;
          height: 1.75rem;
          width: 1.75rem;
          border-radius: 9999px;
          background: rgba(243, 244, 246, 0.9);
          color: rgb(75, 85, 99);
          transition:
            background-color 260ms ease,
            color 260ms ease,
            transform 260ms cubic-bezier(0.2, 0.9, 0.2, 1);
        }

        .faq-chevron-wrap-open {
          background: rgba(16, 185, 129, 0.14);
          color: rgb(5, 150, 105);
          transform: scale(1.05);
        }

        .faq-chevron {
          transition: transform 320ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .faq-answer-grid {
          display: grid;
          grid-template-rows: 0fr;
          transition: grid-template-rows 360ms cubic-bezier(0.2, 0.88, 0.22, 1);
        }

        .faq-answer-grid-open {
          grid-template-rows: 1fr;
        }

        .faq-answer-content {
          overflow: hidden;
          opacity: 0;
          transform: translateY(-6px);
          transition:
            opacity 280ms ease,
            transform 320ms cubic-bezier(0.2, 0.88, 0.22, 1);
        }

        .faq-answer-content-open {
          opacity: 1;
          transform: translateY(0);
          transition-delay: 85ms;
        }

        @keyframes faq-card-in {
          0% {
            opacity: 0;
            transform: translateY(10px) scale(0.992);
            filter: blur(7px);
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

          .faq-card {
            opacity: 1;
            transform: none;
            animation: none;
            transition: none;
          }

          .faq-trigger,
          .faq-chevron-wrap,
          .faq-chevron,
          .faq-answer-grid,
          .faq-answer-content,
          .faq-answer-content-open {
            transition: none;
          }

          .faq-answer-content {
            opacity: 1;
            transform: none;
          }
        }
      `}</style>
    </div>
  );
}
