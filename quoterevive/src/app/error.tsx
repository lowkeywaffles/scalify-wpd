"use client";
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (<main id="main" className="mx-auto max-w-xl px-4 py-24 text-center"><h1 className="font-display text-4xl">Something went wrong</h1><p className="mt-4 text-muted">Your data is safe. Please try again.</p><button className="btn btn-primary mt-6" onClick={reset}>Try again</button></main>);
}
