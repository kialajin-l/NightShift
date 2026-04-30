'use client';

import { ReactNode } from 'react';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import { ThemeFamilyProvider } from '@/components/layout/ThemeFamilyProvider';
import { I18nProvider } from '@/components/layout/I18nProvider';
import { AppShell } from '@/components/layout/AppShell';
import { ThemeFamilyMeta } from '@/lib/theme/types';

interface ClientProvidersProps {
  familiesMeta: ThemeFamilyMeta[];
  themeFamilyCSS: string;
  validIds: string[];
  dbThemeFamily: string | null;
  dbThemeMode: string | null;
  children: ReactNode;
}

export function ClientProviders({
  familiesMeta,
  themeFamilyCSS,
  validIds,
  dbThemeFamily,
  dbThemeMode,
  children,
}: ClientProvidersProps) {
  return (
    <>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var v=${JSON.stringify(validIds)};var db=${JSON.stringify(dbThemeFamily)};var f=localStorage.getItem('codepilot_theme_family')||db||'default';if(v.indexOf(f)<0)f='default';document.documentElement.setAttribute('data-theme-family',f);if(!localStorage.getItem('codepilot_theme_family')&&f!=='default'){localStorage.setItem('codepilot_theme_family',f)}}catch(e){}})();`,
          }}
        />
        {dbThemeMode && (
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){try{if(!localStorage.getItem('theme')){localStorage.setItem('theme',${JSON.stringify(dbThemeMode)})}}catch(e){}})();`,
            }}
          />
        )}
        <style
          id="theme-family-vars"
          dangerouslySetInnerHTML={{ __html: themeFamilyCSS }}
        />
      </head>
      <ThemeProvider>
        <ThemeFamilyProvider families={familiesMeta}>
          <I18nProvider>
            <AppShell>{children}</AppShell>
          </I18nProvider>
        </ThemeFamilyProvider>
      </ThemeProvider>
    </>
  );
}
