"use client";

import type { AppUser } from "@/lib/auth-user";
import { ArrowUpRight, CalendarRange, LogOut, Orbit, Settings, User, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";

interface HeaderProps {
  user: AppUser;
  isPreview?: boolean;
  accountType?: ReactNode;
}

export function Header({ user, isPreview = false, accountType = null }: HeaderProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    if (isPreview) {
      router.push("/auth/login");
      return;
    }
    await authClient.signOut();
    router.push("/auth/login");
    router.refresh();
  };

  const initials = user.email ? user.email.substring(0, 2).toUpperCase() : "П";
  const nickname = user.user_metadata?.nickname as string | undefined;
  const fullName = user.user_metadata?.full_name as string | undefined;
  const displayName = nickname || fullName || user.email?.split("@")[0] || "Пользователь";

  return (
    <header
      data-slot="site-header"
      className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/90 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-6 md:h-[72px] md:px-10 lg:px-16">
        <Link
          href={isPreview ? "/preview" : "/dashboard"}
          className="group flex min-w-0 items-center gap-2.5 rounded-xl outline-none transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4"
          aria-label="Квант-знаний — на главную"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-transform duration-200 group-hover:-rotate-6">
            <Orbit aria-hidden="true" className="size-5" strokeWidth={2.2} />
          </span>
          <span className="hidden truncate text-base font-extrabold tracking-[-0.035em] min-[420px]:block sm:text-lg">
            Квант<span className="text-primary">·</span>знаний
          </span>
          {isPreview && (
            <span className="ml-1 hidden rounded-full border border-primary/20 bg-primary/8 px-2.5 py-1 text-[11px] font-bold tracking-wide text-primary sm:inline-flex">
              ДЕМО
            </span>
          )}
        </Link>

        <nav aria-label="Основная навигация" className="flex shrink-0 items-center gap-1 sm:gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="sm" asChild className="h-11 px-2.5 sm:h-10 sm:px-3">
            <Link href="/schedule">
              <CalendarRange aria-hidden="true" className="size-[18px]" />
              <span className="hidden md:inline">Расписание</span>
              <span className="sr-only md:hidden">Расписание</span>
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild className="h-11 px-2.5 sm:h-10 sm:px-3">
            <Link href="/groups">
              <Users aria-hidden="true" className="size-[18px]" />
              <span className="hidden md:inline">Группы</span>
              <span className="sr-only md:hidden">Мои группы</span>
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild className="h-11 px-2.5 sm:h-10 sm:px-3">
            <Link href="/settings">
              <Settings aria-hidden="true" className="size-[18px]" />
              <span className="hidden md:inline">Настройки</span>
              <span className="sr-only md:hidden">Настройки</span>
            </Link>
          </Button>
          {isPreview ? (
            <Button asChild size="sm" className="ml-1 h-11 px-3 sm:h-10 sm:px-4">
              <Link href="/auth/login">
                <span className="hidden sm:inline">Войти, чтобы сохранить</span>
                <span className="sm:hidden">Войти</span>
                <ArrowUpRight aria-hidden="true" className="size-4" />
              </Link>
            </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative ml-1 size-11 rounded-full border border-border/80 p-0 hover:border-primary/40 sm:size-10"
                  aria-label="Открыть меню профиля"
                >
                  <Avatar className="size-9">
                    <AvatarImage
                      src={user.user_metadata?.avatar_url || "/placeholder.svg"}
                      alt={user.email || "Пользователь"}
                    />
                    <AvatarFallback className="bg-primary/10 font-bold text-primary">{initials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 rounded-2xl p-2">
                <DropdownMenuLabel className="font-normal">
                  <span className="block truncate text-sm font-semibold">{displayName}</span>
                  {fullName && nickname && (
                    <span className="block truncate text-xs text-muted-foreground">{fullName}</span>
                  )}
                  <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {accountType ? (
                  <>
                    <DropdownMenuLabel className="font-normal">{accountType}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                  </>
                ) : null}
                <DropdownMenuItem asChild className="cursor-pointer rounded-xl">
                  <Link href="/settings?tab=general" className="flex items-center gap-2">
                    <User className="size-4" />
                    <span className="max-w-[200px] truncate text-sm">{user.email}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer rounded-xl text-destructive">
                  <LogOut className="mr-2 size-4" />
                  Выйти
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </nav>
      </div>
    </header>
  );
}
