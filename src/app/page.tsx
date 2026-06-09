import { redirect } from 'next/navigation';

/**
 * Root route — middleware handles the actual redirect based on auth state.
 * This is a fallback server component in case middleware doesn't intercept.
 */
export default function Home() {
  redirect('/login');
}
