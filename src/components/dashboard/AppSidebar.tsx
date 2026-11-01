import { Link, useRouterState } from "@tanstack/react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { navGroups } from "@/lib/nav";
import { currentAdmin } from "@/lib/api";
import { Logo } from "./Logo";
import { UserAvatar } from "./UserAvatar";

export function AppSidebar() {
  const { state, setOpenMobile, isMobile } = useSidebar();
  const collapsed = state === "collapsed" && !isMobile;
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <Sidebar collapsible="icon" className="border-sidebar-border">
      <SidebarHeader className="h-14 justify-center border-b border-sidebar-border px-3">
        <Link to="/overview" className="flex items-center" onClick={() => setOpenMobile(false)}>
          <Logo compact={collapsed} />
        </Link>
      </SidebarHeader>

      <SidebarContent className="gap-0 py-2">
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-eyebrow !text-[10px]">{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
                  return (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={item.title}
                        className="h-9 data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[active=true]:[&>svg]:text-primary"
                      >
                        <Link to={item.to} onClick={() => setOpenMobile(false)}>
                          <item.icon className="size-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                      {item.badge && (
                        <SidebarMenuBadge className="rounded-md bg-muted font-mono text-[10px] text-muted-foreground">
                          {item.badge}
                        </SidebarMenuBadge>
                      )}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        {!collapsed && (
          <div className="mb-2 rounded-lg border border-sidebar-border bg-sidebar-accent/50 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">System status</span>
              <span className="flex items-center gap-1.5 text-[11px] text-warning">
                <span className="size-1.5 animate-pulse rounded-full bg-warning" /> Degraded
              </span>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
              2 active incidents · API latency elevated in EU
            </p>
          </div>
        )}
        <div className="flex items-center gap-2.5 overflow-hidden">
          <UserAvatar name={currentAdmin.displayName} hue={currentAdmin.hue} status="online" />
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{currentAdmin.displayName}</p>
              <p className="truncate font-mono text-[11px] text-muted-foreground">@{currentAdmin.username}</p>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
