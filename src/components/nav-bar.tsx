"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

const navLinks = [
  { href: "/admin", label: "Admin" },
  { href: "/annotate", label: "Annotate" },
  { href: "/dashboard", label: "Dashboard" },
];

export function NavBar() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4">
        <span className="text-sm font-semibold tracking-tight">
          TI Annotation Workbench
        </span>
        <nav className="flex items-center gap-1">
          {navLinks.map(({ href, label }) => (
            <Button key={href} variant="ghost" size="sm" asChild>
              <Link href={href}>{label}</Link>
            </Button>
          ))}
        </nav>
      </div>
    </header>
  );
}
