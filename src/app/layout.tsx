import type { Metadata } from 'next';
import { Inspector } from 'react-dev-inspector';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: '哄哄模拟器 | 代入感增强版',
    template: '%s | 哄哄模拟器',
  },
  description: '日系视觉小说风格的哄人模拟器，立绘表情切换+背景氛围联动+TTS语音情绪调节，让你看见也听见她的情绪变化。',
  keywords: ['哄哄模拟器', '恋爱模拟', '视觉小说', 'AI对话'],
  authors: [{ name: '哄哄模拟器' }],
  generator: 'Coze Code',
  openGraph: {
    title: '哄哄模拟器 | 代入感增强版',
    description: '日系视觉小说风格，10轮对话哄好她',
    locale: 'zh_CN',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDev = process.env.COZE_PROJECT_ENV === 'DEV';

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={`antialiased`} suppressHydrationWarning>
        {isDev && <Inspector />}
        {children}
      </body>
    </html>
  );
}
