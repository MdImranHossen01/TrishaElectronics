"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useSettings } from '@/components/SettingsProvider';

interface LogoProps {
  className?: string;
  imageClassName?: string;
  textClassName?: string;
  showText?: boolean;
  onClick?: () => void;
  sizes?: string;
  src?: string;
  href?: string;
  children?: React.ReactNode;
}

export function formatBrandText(text: string, baseClassName?: string, bazClassName = "text-primary") {
  if (!text) return null;
  const upper = text.toUpperCase();
  if (upper.endsWith("BAZ")) {
    const main = upper.slice(0, -3);
    return (
      <>
        <span className={baseClassName}>{main}</span>
        <span className={bazClassName}>BAZ</span>
      </>
    );
  }
  return <span className={baseClassName}>{text}</span>;
}

export function Logo({ className, imageClassName, textClassName, showText = true, onClick, sizes, src, href = "/", children }: LogoProps) {
  const { brandName, logoUrl } = useSettings();

  const finalBrandName = brandName || process.env.NEXT_PUBLIC_STORE_NAME || "TRISHNA ELECTRONICS";
  const finalLogoUrl = src || logoUrl || "/logo.webp";

  const renderContent = () => {
    if (children) {
      if (typeof children === 'string') {
        return formatBrandText(children);
      }
      return children;
    }
    return formatBrandText(finalBrandName);
  };

  return (
    <Link href={href} className={cn("flex items-center gap-2 group", className)} onClick={onClick}>
      <div className={cn("relative flex items-center justify-center size-6 md:size-8 shrink-0", imageClassName)}>
        <Image
          src={finalLogoUrl}
          alt={`${finalBrandName} Logo`}
          fill
          sizes={sizes || "(max-width: 768px) 24px, 32px"}
          className="object-contain"
          quality={80}
          priority
        />
      </div>
      {showText && (
        <span className={cn(
          "text-xl md:text-2xl uppercase text-foreground transition-colors font-black tracking-tighter font-logo",
          textClassName
        )}>
          {renderContent()}
        </span>
      )}
    </Link>
  );
}

