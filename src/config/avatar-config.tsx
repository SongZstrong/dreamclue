'use client';

import { Routes } from '@/routes';
import type { MenuItem } from '@/types';
import {
  CreditCardIcon,
  LayoutDashboardIcon,
  MoonIcon,
  Settings2Icon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

/**
 * Get avatar config with translations
 *
 * NOTICE: used in client components only
 *
 * docs:
 * DreamClue AI docs/config/avatar
 *
 * @returns The avatar config with translated titles
 */
export function useAvatarLinks(): MenuItem[] {
  const t = useTranslations('Marketing.avatar');

  return [
    {
      title: t('dashboard'),
      href: Routes.Dashboard,
      icon: <LayoutDashboardIcon className="size-4 shrink-0" />,
    },
    {
      title: t('journal'),
      href: Routes.Journal,
      icon: <MoonIcon className="size-4 shrink-0" />,
    },
    {
      title: t('billing'),
      href: Routes.SettingsBilling,
      icon: <CreditCardIcon className="size-4 shrink-0" />,
    },
    {
      title: t('settings'),
      href: Routes.SettingsProfile,
      icon: <Settings2Icon className="size-4 shrink-0" />,
    },
  ];
}
