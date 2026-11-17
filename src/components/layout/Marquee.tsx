'use client';

import { useEffect, useState } from 'react';
import FastMarquee from 'react-fast-marquee';

export function Marquee({ marqueeText: initialText }: { marqueeText?: string }) {
  const [marqueeText, setMarqueeText] = useState(initialText || '');

  useEffect(() => {
    if (initialText !== undefined) {
      setMarqueeText(initialText);
      return;
    }

    const controller = new AbortController();

    async function fetchSettings() {
      try {
        const res = await fetch('/api/settings', { signal: controller.signal });
        if (!res.ok) throw new Error('Failed to fetch settings');

        const data = await res.json();
        if (data.marqueeText !== undefined) {
          setMarqueeText(data.marqueeText);
        } else {
          setMarqueeText('Welcome to our store! Free shipping on orders over ৳500.');
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Error fetching marquee text:', error);
        }
      }
    }
    fetchSettings();

    return () => controller.abort();
  }, [initialText]);

  if (!marqueeText || !marqueeText.trim()) return null;

  return (
    <div className="bg-primary text-primary-foreground py-2 overflow-hidden flex items-center font-semibold">
      <FastMarquee
        gradient={false}
        speed={50}
        pauseOnHover={true}
      >
        <span className="mx-10 font-medium tracking-wider text-xs sm:text-sm flex items-center">
          {marqueeText}
        </span>
        <span className="mx-10 font-medium tracking-wider text-xs sm:text-sm flex items-center border-l border-primary-foreground/25 pl-10">
          {marqueeText}
        </span>
        <span className="mx-10 font-medium tracking-wider text-xs sm:text-sm flex items-center border-l border-primary-foreground/25 pl-10">
          {marqueeText}
        </span>
        <span className="mx-10 font-medium tracking-wider text-xs sm:text-sm flex items-center border-l border-primary-foreground/25 pl-10">
          {marqueeText}
        </span>
      </FastMarquee>
    </div>
  );
}

