'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowRight, Lock, Mail } from 'lucide-react';

import { AppBar } from '@/components/navigation/AppBar';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import { Input } from '@/components/shared/Input';
import { useAppStore } from '@/store/app-store';

export default function SignInPage() {
  const router = useRouter();
  const { signIn, signInWithGoogle } = useAppStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  return (
    <div className="relative mx-auto min-h-full w-full max-w-md overflow-hidden px-4 pb-8">
      <div className="pointer-events-none absolute -left-12 -top-16 h-44 w-44 rounded-full bg-emerald-200/50 blur-2xl" />
      <div className="pointer-events-none absolute -right-10 top-24 h-36 w-36 rounded-full bg-sky-200/50 blur-2xl" />

      <AppBar title="Sign In" showBack sticky />

      <Card className="relative mt-5 overflow-hidden rounded-[1.75rem] border border-white/65 bg-white/85 p-5 shadow-[0_24px_42px_-32px_rgba(15,23,42,0.45)] backdrop-blur-xl">
        <div className="mb-4">
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
            className="mt-1 h-11 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500"
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
            <span>{submitting ? 'Signing In...' : 'Sign In'}</span>
            {!submitting ? <ArrowRight size={16} /> : null}
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
              'Connecting...'
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
  );
}
