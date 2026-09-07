import { Suspense } from 'react';
import ExplorarContent from './ExplorarContent';

function ExplorarLoading() {
  return (
    <main className="min-h-screen bg-[#100b12] text-white">
      <div className="mx-auto max-w-7xl px-5 py-16">
        <div className="h-10 w-56 animate-pulse rounded-xl bg-white/5" />

        <div className="mt-4 h-5 w-96 max-w-full animate-pulse rounded-lg bg-white/5" />

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-44 animate-pulse rounded-2xl border border-white/5 bg-white/[0.025]"
            />
          ))}
        </div>
      </div>
    </main>
  );
}

export default function ExplorarPage() {
  return (
    <Suspense fallback={<ExplorarLoading />}>
      <ExplorarContent />
    </Suspense>
  );
}
