'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface AdminPageHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  badge?: React.ReactNode;
  action?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export default function AdminPageHeader({
  title,
  subtitle,
  breadcrumbs,
  badge,
  action,
  children,
  className = '',
}: AdminPageHeaderProps) {
  return (
    <header className={`bg-white border-b border-neutral-200 w-full transition-all ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-4">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="flex items-center space-x-1.5 text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-400">
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <React.Fragment key={`${crumb.label}-${idx}`}>
                  {idx > 0 && <ChevronRight className="w-3 h-3 text-neutral-300 shrink-0" />}
                  {crumb.href && !isLast ? (
                    <Link href={crumb.href} className="hover:text-neutral-700 transition-colors">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className={isLast ? 'text-neutral-900 font-medium' : ''}>{crumb.label}</span>
                  )}
                </React.Fragment>
              );
            })}
          </nav>
        )}

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            {subtitle && (
              <span className="text-[10px] uppercase tracking-[0.35em] text-neutral-400 font-mono block mb-0.5">
                {subtitle}
              </span>
            )}
            <div className="flex items-center space-x-3 flex-wrap gap-y-2">
              <h1 className="font-serif text-xl sm:text-2xl font-light text-neutral-900">
                {title}
              </h1>
              {badge && <div className="flex-shrink-0">{badge}</div>}
            </div>
          </div>

          {action && <div className="flex-shrink-0 flex items-center space-x-3">{action}</div>}
        </div>

        {children && <div className="pt-2">{children}</div>}
      </div>
    </header>
  );
}
