'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { User, LogOut, LayoutDashboard, Truck, Settings, Package } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { MobileMenu } from '@/components/layout/MobileMenu';
import { Logo } from '@/components/ui/logo';
import { useSettings } from '@/components/SettingsProvider';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface MobileNavbarProps {
  navItems: { href: string; label: string }[];
  categories: any[];
}

/**
 * MobileNavbar — Reusable mobile top bar (V1 standard).
 * MUST be used by ALL navbar versions for mobile (lg:hidden).
 * Always sticky top-0 with solid bg-background. No transparent/floating on mobile.
 */
export function MobileNavbar({ navItems, categories }: MobileNavbarProps) {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    if (status === 'authenticated') {
      if (!profile) {
        fetch('/api/user/profile', { signal: controller.signal })
          .then(res => {
            if (!res.ok) return null;
            return res.json();
          })
          .then(data => {
            if (isMounted && data) setProfile(data);
          })
          .catch(err => {
            if (err.name !== 'AbortError') {
              console.error('Failed to fetch profile', err);
            }
          });
      }
    } else {
      if (profile !== null) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setProfile(null);
      }
    }

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [status, profile]);

  return (
    <header className="lg:hidden sticky top-0 z-50 w-full bg-background border-b shadow-sm">
      <div className="relative flex h-14 items-center justify-between px-3">

        {/* Left: Mobile Menu Drawer Trigger */}
        <div className="flex items-center">
          <MobileMenu
            navItems={navItems}
            categories={categories}
            session={session}
          />
        </div>

        {/* Center: Logo */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center">
          <Logo textClassName="text-base sm:text-lg whitespace-nowrap" />
        </div>

        {/* Right: Icons (Empty for layout balance) */}
        <div className="flex items-center w-8">
        </div>
      </div>
    </header>
  );
}
