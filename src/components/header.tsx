import Link from "next/link";
import { BookOpen } from "lucide-react";
import ThemeToggle from "@/components/theme-toggle";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 shrink-0 border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <Link
          href="/"
          className="inline-flex cursor-pointer items-center gap-2.5 transition-opacity duration-200 hover:opacity-80"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <BookOpen className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold leading-tight text-foreground tracking-tight">
              술방책방
            </span>
            <span className="text-[10px] leading-tight text-muted-foreground">
              술 마시는 책방 지도
            </span>
          </div>
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
