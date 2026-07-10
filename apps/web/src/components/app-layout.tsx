import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@korex/ui/components/sidebar";
import {
  Link,
  Outlet,
  useLocation,
  useMatchRoute,
} from "@tanstack/react-router";
import { RouteIcon } from "lucide-react";
import { WaypointDot } from "@/components/brand";
import { cn } from "@/lib/utils";
import {
  appNavigationItems,
  getActiveMobileTab,
  mobileTabs,
  shouldHideMobileBottomNav,
} from "./mobile-navigation";
import { useIsMobileViewport } from "./responsive";
import { useOnlineStatus } from "./use-online-status";

function AppLayout() {
  const isMobileShell = useIsMobileViewport();

  return isMobileShell ? <MobileAppLayout /> : <DesktopAppLayout />;
}

function DesktopAppLayout() {
  const matchRoute = useMatchRoute();
  const isDashboard = Boolean(matchRoute({ to: "/dashboard" }));
  const primaryNavigationItems = appNavigationItems.filter(
    (item) => item.id !== "settings",
  );
  const settingsNavigationItem = appNavigationItems.find(
    (item) => item.id === "settings",
  );
  const SettingsNavigationIcon = settingsNavigationItem?.icon;

  return (
    <SidebarProvider className="h-svh min-h-0 overflow-hidden">
      <Sidebar collapsible="icon">
        <SidebarHeader className="px-4 pt-6 group-data-[collapsible=icon]:px-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                className="h-auto gap-3 rounded-none px-1 py-0 hover:bg-transparent data-active:bg-transparent group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:justify-center"
                render={<Link to="/dashboard" />}
                size="lg"
                tooltip="korex"
              >
                <div className="grid aspect-square size-10 shrink-0 place-items-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground transition-[width,height] group-data-[collapsible=icon]:size-8">
                  <RouteIcon className="size-5 group-data-[collapsible=icon]:size-4" />
                </div>
                <div className="min-w-0 group-data-[collapsible=icon]:hidden">
                  <p className="truncate font-display font-semibold text-xl leading-none tracking-tight">
                    korex
                  </p>
                  <p className="mt-1 truncate text-[9px] text-sidebar-foreground/55 uppercase tracking-[0.2em]">
                    Run your way
                  </p>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className="px-3 pt-8 group-data-[collapsible=icon]:px-2">
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {primaryNavigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = Boolean(matchRoute({ to: item.to }));

                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        className="h-10 gap-3 rounded-xl px-3 font-normal text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-active:bg-sidebar-primary data-active:font-medium data-active:text-sidebar-primary-foreground data-active:shadow-lg group-data-[collapsible=icon]:justify-center"
                        isActive={isActive}
                        tooltip={item.label}
                        render={<Link to={item.to} />}
                      >
                        <Icon />
                        <span className="group-data-[collapsible=icon]:hidden">
                          {item.label}
                        </span>
                        {isActive ? (
                          <WaypointDot className="ml-auto size-1.5 bg-journal-route group-data-[collapsible=icon]:hidden" />
                        ) : null}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        {settingsNavigationItem && SettingsNavigationIcon ? (
          <SidebarFooter className="px-3 pb-5 group-data-[collapsible=icon]:px-2">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  className="h-10 gap-3 rounded-xl px-3 font-normal text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-active:bg-sidebar-primary data-active:font-medium data-active:text-sidebar-primary-foreground group-data-[collapsible=icon]:justify-center"
                  isActive={Boolean(
                    matchRoute({ to: settingsNavigationItem.to }),
                  )}
                  tooltip={settingsNavigationItem.label}
                  render={<Link to={settingsNavigationItem.to} />}
                >
                  <SettingsNavigationIcon />
                  <span className="group-data-[collapsible=icon]:hidden">
                    {settingsNavigationItem.label}
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        ) : null}
        <SidebarRail />
      </Sidebar>
      <SidebarInset className="min-h-0 overflow-hidden">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto">
          <div
            className={cn(
              "mx-auto w-full",
              isDashboard ? "max-w-none" : "max-w-7xl p-4 md:p-6",
            )}
          >
            <Outlet />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

function MobileAppLayout() {
  const location = useLocation();
  const activeTab = getActiveMobileTab(location.pathname);
  const hideBottomNav = shouldHideMobileBottomNav(location.pathname);
  const isOnline = useOnlineStatus();

  return (
    <div className="flex h-dvh min-h-svh flex-col overflow-hidden bg-background">
      <main
        className={cn(
          "min-h-0 flex-1 overflow-y-auto overscroll-contain pt-[env(safe-area-inset-top)] [-webkit-overflow-scrolling:touch]",
          hideBottomNav && "pb-[env(safe-area-inset-bottom)]",
        )}
      >
        <div className="mx-auto w-full max-w-7xl">
          {isOnline ? null : <MobileOfflineRequiredBanner />}
          <Outlet />
        </div>
      </main>
      {hideBottomNav ? null : (
        <nav
          aria-label="Primary"
          className="shrink-0 border-border/40 border-t bg-background/95 px-2 pt-1.5 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-[0_-10px_30px_color-mix(in_oklch,var(--background)_70%,transparent)] backdrop-blur"
        >
          <div className="grid grid-cols-5 gap-1">
            {mobileTabs.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <Link
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex min-w-0 flex-col items-center justify-center gap-1 rounded-md px-1 py-1.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                    isActive && "text-primary",
                  )}
                  key={item.id}
                  to={item.to}
                >
                  {isActive ? (
                    <WaypointDot className="size-1.5" />
                  ) : (
                    <span className="size-1.5" aria-hidden="true" />
                  )}
                  <Icon className="size-5" />
                  <span className="w-full truncate text-center font-display text-[10px] lowercase leading-tight tracking-wide">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}

function MobileOfflineRequiredBanner() {
  return (
    <div className="mx-4 mt-4 border-destructive/30 border-l-2 pl-3 text-destructive text-sm">
      <p className="font-display font-medium lowercase tracking-wide">
        Connection required
      </p>
      <p className="mt-0.5 text-destructive/80 text-xs leading-relaxed">
        Korex is online-only for now. Reconnect to load or update your training
        data.
      </p>
    </div>
  );
}

export { AppLayout };
