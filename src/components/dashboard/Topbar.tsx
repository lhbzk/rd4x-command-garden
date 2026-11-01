import { Fragment } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { KeyRound, LogOut, Settings, User } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { allNavItems } from "@/lib/nav";
import { currentAdmin } from "@/lib/api";
import { notify } from "@/lib/notify";
import { GlobalSearch } from "./GlobalSearch";
import { NotificationsMenu } from "./Notifications";
import { UserAvatar } from "./UserAvatar";

export function Topbar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const current = allNavItems.find((i) => pathname.startsWith(i.to));
  const crumbs = [{ label: "Dashboard", to: "/overview" as const }, ...(current ? [{ label: current.title, to: current.to }] : [])];

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/75 px-3 backdrop-blur-xl sm:gap-3 sm:px-5">
      <SidebarTrigger className="size-8 text-muted-foreground hover:text-foreground" />
      <Separator orientation="vertical" className="hidden h-5 sm:block" />
      <Breadcrumb className="min-w-0">
        <BreadcrumbList className="flex-nowrap">
          {crumbs.map((c, i) => (
            <Fragment key={c.to}>
              {i > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem className={i === 0 && crumbs.length > 1 ? "hidden sm:inline-flex" : ""}>
                {i === crumbs.length - 1 ? (
                  <BreadcrumbPage className="truncate font-medium">{c.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={c.to}>{c.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {i === 0 && crumbs.length > 1 && <BreadcrumbSeparator className="hidden sm:inline-flex" />}
            </Fragment>
          )).flatMap((el, i) => (i === 1 ? [el] : [el]))}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <GlobalSearch className="w-9 justify-center px-0 md:w-72 md:justify-start md:px-3 lg:w-80" />
        <NotificationsMenu />
        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" aria-label="User menu">
            <UserAvatar name={currentAdmin.displayName} hue={currentAdmin.hue} status="online" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="surface-float w-60 rounded-xl">
            <DropdownMenuLabel className="flex items-center gap-3 py-2.5 font-normal">
              <UserAvatar name={currentAdmin.displayName} hue={currentAdmin.hue} size="md" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{currentAdmin.displayName}</p>
                <p className="truncate font-mono text-[11px] text-muted-foreground">@{currentAdmin.username}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => navigate({ to: "/settings", search: { tab: "profile" } })}>
              <User className="size-4" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => navigate({ to: "/settings" })}>
              <Settings className="size-4" /> Settings
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => navigate({ to: "/key" })}>
              <KeyRound className="size-4" /> RD4X Key
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-danger focus:text-danger"
              onSelect={() => {
                notify.info("Signed out", "Your session has ended.");
                navigate({ to: "/login" });
              }}
            >
              <LogOut className="size-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
