"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import { CheckIcon, LogOutIcon, MenuIcon } from "lucide-react";
import { Logo } from "@/components/logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { User } from "@/lib/types";

const nav = [
  { href: "/app/projects", label: "Projects" },
  { href: "/app/my-tasks", label: "My tasks" },
  { href: "/app/tags", label: "Tags" },
  { href: "/app/people", label: "People" },
] as const;

const roleLabel: Record<User["role"], string> = {
  owner: "Owner",
  member: "Member",
};

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

// Giriş yapmış kullanıcının gördüğü kabuk: üstte logo, bölümler ve kullanıcı menüsü.
export function AppShell({
  user,
  onLogout,
  loggingOut,
  logoutError,
  children,
}: {
  user: User;
  onLogout: () => void;
  loggingOut: boolean;
  // Çıkış API'ye ulaşamadıysa oturum hâlâ açık; kullanıcıya söylenmeli.
  logoutError: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-line bg-surface/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:gap-6 sm:px-6">
          {/* 640px'in altında bölümler hamburger menüsünde. */}
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Open navigation"
              className="-ml-2 flex size-9 shrink-0 items-center justify-center rounded-md outline-none hover:bg-wash focus-visible:ring-3 focus-visible:ring-ring/50 sm:hidden"
            >
              <MenuIcon className="size-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {nav.map((item) => {
                const active = pathname.startsWith(item.href);
                return (
                  <MenuPrimitive.LinkItem
                    key={item.href}
                    closeOnClick
                    render={<Link href={item.href} />}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center justify-between rounded-md px-2 py-2 text-sm text-ink-muted outline-hidden select-none",
                      "focus:bg-accent focus:text-ink data-highlighted:bg-accent data-highlighted:text-ink",
                      active && "font-medium text-ink",
                    )}
                  >
                    {item.label}
                    {active && <CheckIcon className="size-4" />}
                  </MenuPrimitive.LinkItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* flex: satır içi bağlantı logoyu metin satırı gibi yukarı itmesin. */}
          <Link href="/app/projects" className="flex shrink-0">
            <Logo />
          </Link>

          {/* 640px ve üstü: bölümler yan yana. Bağlantılar çubuğun tam yüksekliğinde,
              aktif çizgi kutunun içinde kalır. */}
          <nav aria-label="Main" className="-mx-2 hidden min-w-0 flex-1 gap-1 self-stretch sm:flex">
            {nav.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex shrink-0 items-center px-2.5 text-sm text-ink-muted transition-colors hover:text-ink",
                    "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none focus-visible:ring-inset",
                    active &&
                      "font-medium text-ink after:absolute after:inset-x-2.5 after:bottom-0 after:h-0.5 after:rounded-full after:bg-ink",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <DropdownMenu>
            <DropdownMenuTrigger
              className="-mr-1 ml-auto flex shrink-0 items-center gap-2 rounded-full py-1 pr-1 pl-1 text-sm outline-none hover:bg-wash focus-visible:ring-3 focus-visible:ring-ring/50 sm:pr-3"
              aria-label="Account menu"
            >
              <span
                aria-hidden
                className="flex size-7 items-center justify-center rounded-full bg-ink text-xs font-semibold text-white"
              >
                {initials(user.name)}
              </span>
              <span className="hidden max-w-40 truncate sm:inline">{user.name}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <div className="px-2 py-1.5">
                <p className="truncate font-medium">{user.name}</p>
                <p className="truncate text-sm text-ink-muted">{user.email}</p>
                <p className="mt-1 text-xs text-ink-muted">{roleLabel[user.role]}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout} disabled={loggingOut}>
                <LogOutIcon />
                {loggingOut ? "Logging out..." : "Log out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {logoutError && (
        <div role="alert" className="border-b border-danger/20 bg-danger/5">
          <p className="mx-auto max-w-6xl px-4 py-2.5 text-sm text-danger sm:px-6">
            You&apos;re still logged in. {logoutError}
          </p>
        </div>
      )}

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}
