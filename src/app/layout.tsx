import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import { ThemeFamilyProvider } from '@/components/layout/ThemeFamilyProvider';
import { I18nProvider } from '@/components/layout/I18nProvider';
import { AppShell } from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: 'NightShift - AI原生编辑器',
  description: '多Agent并发执行开发任务的AI原生编辑器',
  keywords: ['AI', '代码生成', '多Agent', '开发工具', 'NightShift'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className="h-full dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var f=localStorage.getItem('codepilot_theme_family')||'default';document.documentElement.setAttribute('data-theme-family',f)}catch(e){}})();` }} />
      </head>
      <body className="h-full bg-background text-foreground font-sans antialiased">
        <ThemeProvider>
          <ThemeFamilyProvider families={[]}>
            <I18nProvider>
              <AppShell>{children}</AppShell>
            </I18nProvider>
          </ThemeFamilyProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
