'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { AppBar } from '@/components/navigation/AppBar';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import { Input } from '@/components/shared/Input';
import { useAppStore } from '@/store/app-store';

export default function SignUpPage() {
  const router = useRouter();
  const { signIn } = useAppStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-8">
      <AppBar title="Sign Up" showBack sticky />

      <Card className="mt-5 space-y-3">
        <Input label="Name" placeholder="Your name" value={name} onChange={(event) => setName(event.target.value)} />
        <Input label="Email" type="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} />
        <Input
          label="Password"
          type="password"
          placeholder="Create password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <Button
          fullWidth
          onClick={() => {
            if (!name || !email || !password) {
              alert('Please complete all fields.');
              return;
            }

            signIn(name, email);
            router.push('/');
          }}
        >
          Create Account
        </Button>

        <p className="text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/sign-in" className="font-semibold text-brand-700">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
