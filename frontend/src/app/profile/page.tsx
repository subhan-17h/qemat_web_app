'use client';

import { ChevronRight, Gift, HelpCircle, Info, LogOut, UserCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type MouseEvent } from 'react';

import { AppBar } from '@/components/navigation/AppBar';
import { Card } from '@/components/shared/Card';
import { useAppStore } from '@/store/app-store';

export default function ProfilePage() {
  const router = useRouter();
  const { user, signOut } = useAppStore();

  const handleProfileNavigation = (event: MouseEvent<HTMLElement>, href: string) => {
    const isModifiedClick = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;
    if (isModifiedClick) return;

    const docWithTransition = document as Document & {
      startViewTransition?: (callback: () => void) => { finished: Promise<void> };
    };

    if (!docWithTransition.startViewTransition) {
      event.preventDefault();
      router.push(href);
      return;
    }

    event.preventDefault();
    const root = document.documentElement;
    const trigger = event.currentTarget as HTMLElement;
    const rect = trigger.getBoundingClientRect();
    const originX = `${((rect.left + rect.width / 2) / window.innerWidth) * 100}%`;
    const originY = `${((rect.top + rect.height / 2) / window.innerHeight) * 100}%`;

    root.setAttribute('data-nav-intent', 'profile-open');
    root.style.setProperty('--vt-origin-x', originX);
    root.style.setProperty('--vt-origin-y', originY);

    const transition = docWithTransition.startViewTransition(() => {
      router.push(href);
    });

    transition.finished.finally(() => {
      root.removeAttribute('data-nav-intent');
      root.style.removeProperty('--vt-origin-x');
      root.style.removeProperty('--vt-origin-y');
    });
  };

  const settingsItems = [
    { label: 'Help & Support', icon: HelpCircle, href: '/help' },
    { label: 'About', icon: Info, href: '/about' }
  ];

  return (
    <div className="mx-auto w-full max-w-screen-2xl px-4 pb-8 lg:px-10 xl:px-12">
      <AppBar title="Profile" sticky />

      <Card className="mx-auto mt-4 max-w-xl p-6 text-center lg:max-w-4xl">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-green-500 text-white">
          <UserCircle2 size={40} />
        </div>
        <p className="mt-3 text-xl font-semibold text-gray-900">{user?.name ?? 'Guest User'}</p>
        <p className="text-sm text-gray-500">{user?.email ?? 'Sign in to personalize your profile.'}</p>
      </Card>

      <Card className="mx-auto mt-4 max-w-xl rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-teal-50 to-amber-50 p-3.5 lg:max-w-4xl">
        <span className="inline-flex rounded-full bg-emerald-200/60 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">Coming Soon</span>
        <div className="mt-2.5 flex items-start gap-2">
          <span className="mt-0.5 text-emerald-600">
            <Gift size={20} />
          </span>
          <div>
            <h2 className="text-xl font-extrabold leading-tight text-gray-900">🎉 Earn Free Rewards!</h2>
            <p className="mt-1.5 max-w-md text-sm font-medium leading-relaxed text-gray-500">
              Make contributions and earn free mobile top-ups & rewards!
            </p>
            <button
              className="mt-3 rounded-full border-2 border-emerald-500 px-4 py-1 text-sm font-bold text-emerald-600 transition-colors hover:bg-emerald-50"
              onClick={(event) => handleProfileNavigation(event, '/help')}
            >
              View How to Earn
            </button>
          </div>
        </div>
      </Card>

      <Card className="mx-auto mt-4 max-w-xl p-5 lg:max-w-4xl">
        <h2 className="text-lg font-bold text-gray-900">Settings</h2>
        

        <div className="space-y-1">
          {settingsItems.map((item) => (
            <button
              key={item.label}
              onClick={(event) => handleProfileNavigation(event, item.href)}
              className="flex w-full items-center gap-3 rounded-xl px-2 py-3 text-left hover:bg-gray-50"
            >
              <item.icon className="text-gray-500" size={18} />
              <span className="flex-1 text-base text-gray-900">{item.label}</span>
              <ChevronRight size={16} className="text-gray-400" />
            </button>
          ))}

          {user ? (
            <button
              onClick={() => {
                signOut();
                router.push('/');
              }}
              className="flex w-full items-center gap-3 rounded-xl px-2 py-3 text-left text-red-600 hover:bg-red-50"
            >
              <LogOut size={18} />
              <span className="flex-1 text-base">Sign Out</span>
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={(event) => handleProfileNavigation(event, '/sign-in')}
              className="flex w-full items-center gap-3 rounded-xl px-2 py-3 text-left hover:bg-gray-50"
            >
              <Gift className="text-gray-500" size={18} />
              <span className="flex-1 text-base text-gray-900">Sign In</span>
              <ChevronRight size={16} className="text-gray-400" />
            </button>
          )}
        </div>
      </Card>
    </div>
  );
}
