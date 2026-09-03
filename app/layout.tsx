import './globals.css';
import { ReactNode } from 'react';

export const metadata = {
title: 'Nooklie — seu cantinho de histórias',
description: 'Um cantinho para histórias que nunca aconteceram.',
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
