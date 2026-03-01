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
          onClick={() => {
            if (!email || !password) {
              alert('Please enter email and password.');
              return;
            }

            signIn('Qemat User', email);
            router.push('/');
          }}
        >
          Sign In
        </Button>

        <Button
          variant="secondary"
          fullWidth
          onClick={() => {
            signIn('Google User', email || 'google-user@qemat.app');
            router.push('/');
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
