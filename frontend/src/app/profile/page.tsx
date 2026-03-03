'use client';

import { ChevronRight, Gift, HelpCircle, Info, LogOut, Star, Trophy, UserCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { AppBar } from '@/components/navigation/AppBar';
import { Badge } from '@/components/shared/Badge';
import { Card } from '@/components/shared/Card';
import { useAppStore } from '@/store/app-store';

export default function ProfilePage() {
  const router = useRouter();
  const { user, signOut } = useAppStore();

  const settingsItems = [
    { label: 'Help & Support', icon: HelpCircle, onClick: () => router.push('/help') },
    { label: 'About', icon: Info, onClick: () => router.push('/about') }
  ];

  return (
    <div className="mx-auto w-full max-w-screen-xl px-4 pb-8 lg:px-8">
      <AppBar title="Profile" sticky />

      <Card className="mx-auto mt-4 max-w-xl p-6 text-center">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-green-500 text-white">
          <UserCircle2 size={40} />
        </div>
        <p className="mt-3 text-xl font-semibold text-gray-900">{user?.name ?? 'Guest User'}</p>
        <p className="text-sm text-gray-500">{user?.email ?? 'Sign in to personalize your profile.'}</p>
      </Card>

      <Card className="mx-auto mt-4 max-w-xl bg-gradient-to-br from-green-50 to-amber-50">
        <h2 className="text-lg font-bold text-gray-900">Earn Rewards</h2>
        <div className="mt-3 space-y-3">
          <div className="flex items-center gap-3 rounded-xl bg-white/70 p-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-green-100 text-brand-700">
              <Trophy size={18} />
            </span>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">Contribute Prices</p>
              <p className="text-xs text-gray-600">Add/update prices at local stores, earn points.</p>
            </div>
            <Badge>Coming Soon</Badge>
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-white/70 p-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-amber-100 text-amber-700">
              <Star size={18} />
            </span>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">Verify Information</p>
              <p className="text-xs text-gray-600">Confirm price accuracy and help the community.</p>
            </div>
            <Badge>Coming Soon</Badge>
          </div>
        </div>
      </Card>

      <Card className="mx-auto mt-4 max-w-xl p-5">
        <h2 className="text-lg font-bold text-gray-900">Settings</h2>
        

        <div className="space-y-1">
          {settingsItems.map((item) => (
            <button
              key={item.label}
              onClick={item.onClick}
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
            <button onClick={() => router.push('/sign-up')} className="flex w-full items-center gap-3 rounded-xl px-2 py-3 text-left hover:bg-gray-50">
              <Gift className="text-gray-500" size={18} />
              <span className="flex-1 text-base text-gray-900">Create Account</span>
              <ChevronRight size={16} className="text-gray-400" />
            </button>
          )}
        </div>
      </Card>
    </div>
  );
}
