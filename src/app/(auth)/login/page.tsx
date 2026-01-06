import { LoginForm } from '@/components/auth/LoginForm';

interface LoginPageProps {
  searchParams: Promise<{
    redirect?: string;
    error?: string;
  }>;
}

export const metadata = {
  title: 'Sign In | Margen',
  description: 'Sign in to your Margen account',
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  const errorMessages: Record<string, string> = {
    auth_callback_error: 'There was an error during authentication. Please try again.',
  };

  const error = params.error ? errorMessages[params.error] || params.error : undefined;

  return <LoginForm redirectTo={params.redirect} error={error} />;
}
