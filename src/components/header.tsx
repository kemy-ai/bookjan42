import Link from "next/link";
import { BookOpen } from "lucide-react";

export default function Header() {
  return (
    <header className="shrink-0 border-b border-border bg-background px-4 py-3">
      <div className="mx-auto max-w-7xl">
        <Link href="/" className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity">
          <BookOpen className="h-5 w-5 text-primary" />
          <span className="text-lg font-bold text-foreground">책잔사이</span>
          <span className="text-xs text-muted-foreground">
            술 마시는 책방 지도
          </span>
        </Link>
      </div>
    </header>
  );
}
