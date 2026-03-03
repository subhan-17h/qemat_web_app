'use client';

import Link from 'next/link';
import { ChevronDown, Mail } from 'lucide-react';
import { useState } from 'react';

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

export default function HelpPage() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-8 lg:px-8">
      <AppBar title="Help & Support" showBack sticky />

      <Card className="mt-4 bg-gray-50">
        <h2 className="text-lg font-bold text-gray-900">Need Help?</h2>
        <p className="mt-1 text-sm text-gray-700">Our support team is here to help you with any questions or concerns.</p>
        <Link
          href="mailto:help.qemat@gmail.com"
          className="mt-3 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800"
        >
          <Mail size={16} /> help.qemat@gmail.com
        </Link>
      </Card>

      <div className="mt-4 space-y-2">
        {faqs.map((faq, index) => {
          const open = openIndex === index;

          return (
            <Card key={faq.question} className="p-0">
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
      </div>
    </div>
  );
}
