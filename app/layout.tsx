import './globals.css';
import { ReactNode } from 'react';

export const metadata = {
  title: 'Dragonfic — seu cantinho de fanfics',
  description: 'Uma casa interativa para histórias e leitores.',
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
