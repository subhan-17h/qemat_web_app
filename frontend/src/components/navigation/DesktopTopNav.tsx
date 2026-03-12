'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Home } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

import { useAppStore } from '@/store/app-store';

export function DesktopTopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAppStore();
  const showAuthHomeAction = pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up');

  const goHome = () => {
    const docWithTransition = document as Document & {
      startViewTransition?: (callback: () => void) => { finished: Promise<void> };
    };

    if (!docWithTransition.startViewTransition) {
      router.push('/');
      return;
    }

    const root = document.documentElement;
    root.setAttribute('data-tab-direction', 'left');
    const transition = docWithTransition.startViewTransition(() => {
      router.push('/');
    });
    transition.finished.finally(() => {
      root.removeAttribute('data-tab-direction');
    });
  };

  return (
    <header className="desktop-top-nav fixed inset-x-0 top-0 z-50 hidden lg:block">
      <div className="mx-auto max-w-[1680px] px-6 pb-3 pt-3 xl:px-10">
        <div className="desktop-top-nav-glow relative">
          <div className="desktop-top-nav-frame flex h-[72px] items-center justify-between rounded-[1.35rem] border px-4 backdrop-blur-2xl backdrop-saturate-150">
            <div className="flex min-w-[140px] items-center justify-start">
              <Link
                href="/"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/94 shadow-[0_12px_22px_-16px_rgba(15,23,42,0.58)]"
              >
                <Image src="/assets/logo/logo.png" width={30} height={30} alt="Qemat" className="rounded-full" />
              </Link>
            </div>

            <div className="flex flex-1 items-center justify-center px-4 text-center">
              <p className="font-urdu text-[28px] leading-none text-emerald-700 xl:text-[30px]">بازار آپ کے ہاتھ میں</p>
            </div>

            <div className="flex min-w-[140px] items-center justify-end">
              {showAuthHomeAction ? (
                <button
                  aria-label="Back to home"
                  onClick={goHome}
                  className="inline-flex h-8 items-center gap-1 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 px-3 text-xs font-semibold text-white shadow-[0_12px_22px_-18px_rgba(16,185,129,0.95)] transition-all hover:-translate-y-0.5 hover:from-emerald-500 hover:to-emerald-500"
                >
                  <Home size={14} />
                  Back to Home
                </button>
              ) : user ? (
                <Link
                  href="/profile"
                  className="inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
                >
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  {user.name.split(' ')[0] ?? 'Signed In'}
                </Link>
              ) : (
                <Link
                  href="/sign-in"
                  className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .desktop-top-nav {
          animation: desktop-top-nav-enter 420ms cubic-bezier(0.2, 0.88, 0.22, 1);
        }

        .desktop-top-nav-glow::after {
          content: '';
          position: absolute;
          left: 2.5rem;
          right: 2.5rem;
          top: 0.9rem;
          bottom: -0.6rem;
          border-radius: 999px;
          background: radial-gradient(ellipse at center, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.08) 42%, rgba(16, 185, 129, 0) 72%);
          filter: blur(18px);
          opacity: 0.55;
          pointer-events: none;
          z-index: -1;
        }

        .desktop-top-nav-frame {
          border-color: rgba(255, 255, 255, 0.62);
          background: linear-gradient(
            142deg,
            rgba(255, 255, 255, 0.58) 0%,
            rgba(248, 250, 252, 0.5) 58%,
            rgba(236, 253, 245, 0.46) 100%
          );
          box-shadow:
            0 30px 52px -38px rgba(15, 23, 42, 0.72),
            0 8px 20px -18px rgba(15, 23, 42, 0.48),
            inset 0 1px 0 rgba(255, 255, 255, 0.9);
        }

        @keyframes desktop-top-nav-enter {
          0% {
            opacity: 0;
            transform: translateY(-10px);
            filter: blur(8px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .desktop-top-nav {
            animation: none;
          }

          .desktop-top-nav-glow::after {
            display: none;
          }
        }
      `}</style>
    </header>
  );
}
