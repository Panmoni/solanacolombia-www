
import Link from 'next/link';

export function Header() {
  return (
    <header className="sticky top-0 w-full bg-background/80 backdrop-blur-lg z-50 border-b">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="font-bold text-xl">
            Solana Colombia
          </Link>
      </div></div>
    </header>
  );
}