import { redirect } from 'next/navigation';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SigninAliasPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const redirectTarget = typeof params.redirect === 'string' ? params.redirect : undefined;

  if (redirectTarget) {
    redirect(`/login?redirect=${encodeURIComponent(redirectTarget)}`);
  } else {
    redirect('/login');
  }
}
