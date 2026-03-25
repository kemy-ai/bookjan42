export default function Footer() {
  return (
    <footer className="border-t border-border bg-secondary/50 px-4 py-6 text-center text-xs text-muted-foreground">
      <div className="mx-auto max-w-screen-lg space-y-1.5">
        <p>
          <span className="font-medium text-foreground/80">익다컴퍼니 주식회사</span>
          <span className="mx-1.5 text-border">|</span>
          대표: 전유겸
        </p>
        <p>사업자등록번호: 225-88-03598</p>
        <p>서울특별시 마포구 와우산로29마길 10-3, 2층 일부(서교동)</p>
        <p className="pt-2 text-muted-foreground/50">
          &copy; {new Date().getFullYear()} 책잔사이. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
