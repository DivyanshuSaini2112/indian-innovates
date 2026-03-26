import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center px-6">
      <div className="relative mb-8">
        <p className="font-heading text-[10rem] font-bold text-primary/10 leading-none select-none">404</p>
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="font-heading text-6xl">🌊</p>
        </div>
      </div>
      <h1 className="font-heading text-3xl font-semibold text-foreground mb-3">Page Washed Away</h1>
      <p className="text-muted mb-8 max-w-md">The page you&apos;re looking for has been swept away by the floods. Navigate back to safety.</p>
      <div className="flex gap-3">
        <Link href="/" className="px-6 py-3 bg-primary text-white rounded-full font-medium hover:bg-primary/90 transition">Go Home</Link>
        <Link href="/dashboard" className="px-6 py-3 glass border border-white/15 rounded-full text-foreground hover:bg-white/8 transition">Dashboard</Link>
      </div>
    </div>
  );
}
