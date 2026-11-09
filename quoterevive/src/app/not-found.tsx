import Link from "next/link";
export default function NotFound() {
  return (<main id="main" className="mx-auto max-w-xl px-4 py-24 text-center"><h1 className="font-display text-5xl">Page not found</h1><p className="mt-4 text-muted">That page doesn&apos;t exist or you don&apos;t have access to it.</p><Link className="btn btn-primary mt-6" href="/">Go home</Link></main>);
}
