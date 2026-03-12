'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowRight, Loader2, Lock, Mail, ShieldCheck, Sparkles, TrendingDown } from 'lucide-react';

import { AppBar } from '@/components/navigation/AppBar';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import { Input } from '@/components/shared/Input';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/app-store';

export default function SignInPage() {
  const router = useRouter();
  const { signIn, signInWithGoogle } = useAppStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  return (
    <div className="relative mx-auto min-h-full w-full max-w-md overflow-hidden px-4 pb-4 lg:max-w-6xl lg:overflow-visible lg:px-6 lg:pb-6">
      <div className="pointer-events-none absolute -left-12 -top-16 h-44 w-44 rounded-full bg-emerald-200/50 blur-2xl" />
      <div className="pointer-events-none absolute -right-10 top-24 h-36 w-36 rounded-full bg-sky-200/50 blur-2xl" />
      <div className="pointer-events-none absolute inset-0 -z-10 hidden lg:block">
        <div className="auth-stage-edge-glow" />
        <div className="auth-stage-backdrop" />
        <div className="auth-orb auth-orb-left" />
        <div className="auth-orb auth-orb-right" />
      </div>

      <AppBar title="Sign In" showBack sticky />

      <div className="relative z-[1] lg:mt-8 lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-8 xl:gap-12">
        <section className="auth-copy-enter hidden lg:block">
          <div className="max-w-xl space-y-5">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/65 bg-white/55 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700 backdrop-blur-xl">
              <Sparkles size={14} />
              Smart Shopping Access
            </span>
            <h2 className="text-4xl font-black leading-tight text-gray-900 xl:text-5xl">
              Sign in and pick
              <span className="block bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 bg-clip-text text-transparent">
                the best price in seconds
              </span>
            </h2>
            <p className="max-w-lg text-base leading-relaxed text-gray-600">
              Keep favorites synced, compare stores instantly, and continue your shopping flow across mobile and desktop.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="auth-feature-card rounded-2xl border border-white/70 bg-white/60 p-3.5 backdrop-blur-xl">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <TrendingDown size={16} />
                </span>
                <p className="mt-2 text-sm font-semibold text-gray-900">Live price comparison</p>
                <p className="mt-1 text-xs text-gray-600">Catch better deals before checkout.</p>
              </div>
              <div className="auth-feature-card rounded-2xl border border-white/70 bg-white/60 p-3.5 backdrop-blur-xl">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-sky-700">
                  <ShieldCheck size={16} />
                </span>
                <p className="mt-2 text-sm font-semibold text-gray-900">Secure sign in</p>
                <p className="mt-1 text-xs text-gray-600">Fast access with Google or email.</p>
              </div>
            </div>
          </div>
        </section>

        <Card className="auth-panel-enter relative mt-4 overflow-hidden rounded-[1.75rem] border border-white/65 bg-white/82 p-4 shadow-[0_24px_42px_-32px_rgba(15,23,42,0.45)] backdrop-blur-xl lg:mt-0 lg:p-6 lg:shadow-[0_34px_58px_-40px_rgba(15,23,42,0.6)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-r from-emerald-100/55 via-white/35 to-sky-100/45" />

          <div className="relative mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Welcome Back</p>
            <h1 className="mt-1 text-2xl font-bold text-gray-900">Sign in to Qemat</h1>
            <p className="mt-1 text-sm text-gray-600">Compare smarter and sync your favorites across devices.</p>
          </div>

          <div className="space-y-3">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              startSlot={<Mail size={16} />}
              wrapperClassName="h-11 rounded-xl border-gray-200 bg-white/95"
            />
            <Input
              label="Password"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              startSlot={<Lock size={16} />}
              wrapperClassName="h-11 rounded-xl border-gray-200 bg-white/95"
            />

            <Button
              fullWidth
              disabled={submitting || googleSubmitting}
              className={cn(
                'auth-primary-btn mt-1 h-11 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500',
                submitting ? 'auth-primary-btn-loading' : ''
              )}
              onClick={async () => {
                if (!email || !password) {
                  alert('Please enter email and password.');
                  return;
                }

                try {
                  setSubmitting(true);
                  await signIn(email, password);
                  router.push('/');
                } catch (error) {
                  const message = error instanceof Error ? error.message : 'Failed to sign in.';
                  alert(message);
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Signing In...
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={16} />
                </>
              )}
            </Button>

            <div className="flex items-center gap-3 py-1 text-xs text-gray-500">
              <div className="h-px flex-1 bg-gray-200" />
              <span>or</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            <Button
              variant="secondary"
              fullWidth
              disabled={submitting || googleSubmitting}
              className="h-11 rounded-xl border-gray-200 bg-white text-gray-900 hover:bg-gray-50"
              onClick={async () => {
                try {
                  setGoogleSubmitting(true);
                  await signInWithGoogle();
                  router.push('/');
                } catch (error) {
                  const message = error instanceof Error ? error.message : 'Google sign-in failed.';
                  alert(message);
                } finally {
                  setGoogleSubmitting(false);
                }
              }}
            >
              {googleSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Image src="/assets/images/google_icon.png" alt="Google" width={18} height={18} />
                  Continue with Google
                </>
              )}
            </Button>
          </div>

          <p className="mt-4 text-center text-sm text-gray-600">
            Don&apos;t have an account?{' '}
            <Link href="/sign-up" className="font-semibold text-emerald-700 hover:text-emerald-600">
              Sign up
            </Link>
          </p>
        </Card>
      </div>

      <style jsx>{`
        .auth-panel-enter {
          animation: auth-panel-enter 620ms cubic-bezier(0.2, 0.88, 0.22, 1);
        }

        .auth-copy-enter {
          animation: auth-copy-enter 680ms cubic-bezier(0.2, 0.88, 0.22, 1);
        }

        .auth-feature-card {
          animation: auth-feature-float 6s ease-in-out infinite;
        }

        .auth-feature-card:nth-child(2) {
          animation-delay: 1.2s;
        }

        .auth-primary-btn {
          box-shadow: 0 14px 24px -20px rgba(16, 185, 129, 0.9);
          transition:
            transform 220ms cubic-bezier(0.2, 0.9, 0.2, 1),
            box-shadow 240ms ease;
        }

        .auth-primary-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 16px 26px -18px rgba(16, 185, 129, 0.78);
        }

        .auth-primary-btn-loading {
          animation: auth-submit-glow 1.05s ease-in-out infinite;
        }

        .auth-orb {
          position: absolute;
          border-radius: 999px;
          filter: blur(34px);
          opacity: 0.45;
          pointer-events: none;
        }

        .auth-stage-edge-glow {
          position: absolute;
          inset: 4.25rem -2.2rem -1.2rem;
          border-radius: 2.5rem;
          background:
            radial-gradient(72% 62% at 20% 16%, rgba(16, 185, 129, 0.16), transparent 62%),
            radial-gradient(62% 54% at 84% 22%, rgba(14, 165, 233, 0.16), transparent 64%);
          filter: blur(34px);
          opacity: 0.56;
        }

        .auth-stage-backdrop {
          position: absolute;
          inset: 4.4rem -0.75rem 0.15rem;
          border-radius: 2rem;
          border: 1px solid rgba(255, 255, 255, 0.72);
          background:
            radial-gradient(90% 72% at 16% 10%, rgba(16, 185, 129, 0.2), transparent 62%),
            radial-gradient(75% 60% at 86% 18%, rgba(14, 165, 233, 0.16), transparent 63%),
            linear-gradient(180deg, rgba(248, 250, 252, 0.96) 0%, rgba(241, 245, 249, 0.96) 44%, rgba(236, 253, 245, 0.95) 100%);
          box-shadow:
            0 30px 60px -48px rgba(15, 23, 42, 0.58),
            inset 0 1px 0 rgba(255, 255, 255, 0.78);
          overflow: hidden;
        }

        .auth-stage-backdrop::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: radial-gradient(118% 84% at 52% -10%, rgba(255, 255, 255, 0.55) 0%, transparent 72%);
          pointer-events: none;
        }

        .auth-orb-left {
          left: 10%;
          top: 22%;
          height: 11rem;
          width: 11rem;
          background: rgba(16, 185, 129, 0.42);
          animation: auth-orb-float-left 8s ease-in-out infinite;
        }

        .auth-orb-right {
          right: 6%;
          top: 32%;
          height: 10rem;
          width: 10rem;
          background: rgba(14, 165, 233, 0.36);
          animation: auth-orb-float-right 9s ease-in-out infinite;
        }

        @keyframes auth-panel-enter {
          0% {
            opacity: 0;
            transform: translateY(18px) scale(0.985);
            filter: blur(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }

        @keyframes auth-copy-enter {
          0% {
            opacity: 0;
            transform: translateY(12px);
            filter: blur(8px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }

        @keyframes auth-feature-float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-3px);
          }
        }

        @keyframes auth-submit-glow {
          0%,
          100% {
            box-shadow: 0 14px 24px -20px rgba(16, 185, 129, 0.9);
          }
          50% {
            box-shadow: 0 18px 28px -16px rgba(16, 185, 129, 0.78);
          }
        }

        @keyframes auth-orb-float-left {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
          }
          50% {
            transform: translate3d(14px, -10px, 0);
          }
        }

        @keyframes auth-orb-float-right {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
          }
          50% {
            transform: translate3d(-12px, 11px, 0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .auth-panel-enter,
          .auth-copy-enter,
          .auth-feature-card,
          .auth-primary-btn,
          .auth-primary-btn:hover,
          .auth-primary-btn-loading,
          .auth-stage-edge-glow,
          .auth-stage-backdrop,
          .auth-orb-left,
          .auth-orb-right {
            animation: none;
            transition: none;
            transform: none;
          }
        }
      `}</style>
    </div>
  );
}
