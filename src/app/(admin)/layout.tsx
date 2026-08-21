'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AppSidebar } from '@/components/layout/AppSidebar';
import AdminTopbar from '@/components/layout/AdminTopbar';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user) {
      const role = (session.user as any)?.role;
      if (role !== 'admin' && role !== 'super_admin') {
        router.push('/dashboard');
      }
    }
  }, [status, session, router]);

  if (status === 'unauthenticated') {
    return null;
  }

  if (status === 'authenticated') {
    const role = (session?.user as any)?.role;
    if (role !== 'admin' && role !== 'super_admin') {
      return null;
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AdminTopbar />
        <main className="flex-1 items-start gap-4 p-4 pb-20 sm:px-6 sm:py-0 md:gap-8">
          {children}
        </main>
      </SidebarInset>
      <MobileBottomNav />
    </SidebarProvider>
  );
}

