'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { AppBar } from '@/components/navigation/AppBar';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import { Input } from '@/components/shared/Input';
import { useAppStore } from '@/store/app-store';

export default function SignInPage() {
  const router = useRouter();
  const { signIn } = useAppStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-8">
      <AppBar title="Sign In" showBack sticky />

      <Card className="mt-5 space-y-3">
        <Input label="Email" type="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} />
        <Input
          label="Password"
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <Button
          fullWidth
          disabled={submitting}
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
          {submitting ? 'Signing In...' : 'Sign In'}
        </Button>

        <Button
          variant="secondary"
          fullWidth
          disabled
          onClick={() => {
            alert('Google sign-in for web is not configured yet.');
          }}
        >
          Continue with Google
        </Button>

        <p className="text-center text-sm text-gray-600">
          Don&apos;t have an account?{' '}
          <Link href="/sign-up" className="font-semibold text-brand-700">
            Sign up
          </Link>
        </p>
      </Card>
    </div>
  );
}
