import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE, getSessionUser } from '@server/adminAuth';
import App from '@/App';

export const dynamic = 'force-dynamic';

/**
 * /dashboard  (server-rendered gate)
 * Tanpa sesi admin valid -> redirect ke /login. Data user (role owner/kasir)
 * diberikan ke client agar dashboard tidak menampilkan konten sebelum login.
 */
export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getSessionUser(token);

  if (!user) {
    redirect('/login');
  }

  return <App dashboardOnly initialUser={user} />;
}