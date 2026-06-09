import {
  Sidebar,
  SidebarContent,
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
import { Link, Outlet, useMatchRoute } from "@tanstack/react-router";
import {
  Activity,
  CalendarDaysIcon,
  FlameIcon,
  Home,
  LineChartIcon,
  SettingsIcon,
  TargetIcon,
  TrophyIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

function AppLayout() {
  const matchRoute = useMatchRoute();
  const isDashboard = Boolean(matchRoute({ to: "/dashboard" }));

  return (
    <SidebarProvider className="h-svh min-h-0 overflow-hidden">
      <Sidebar collapsible="icon">
        <SidebarHeader className="px-4 pt-5">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                className="gap-2.5 px-0 hover:bg-transparent data-active:bg-transparent"
                size="lg"
                tooltip="korex"
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-none bg-transparent text-sidebar-primary">
                  <Activity className="size-6" />
                </div>
                <span className="truncate font-semibold text-2xl tracking-tight">
                  korex
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent className="relative overflow-hidden">
          <SidebarGroup className="relative z-10 px-3 pt-6">
            <SidebarGroupContent>
              <SidebarMenu className="gap-1.5">
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={Boolean(matchRoute({ to: "/dashboard" }))}
                    tooltip="Dashboard"
                    render={<Link to="/dashboard" />}
                  >
                    <Home />
                    <span>Dashboard</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={Boolean(matchRoute({ to: "/calendar" }))}
                    tooltip="Calendar"
                    render={<Link to="/calendar" />}
                  >
                    <CalendarDaysIcon />
                    <span>Calendar</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={Boolean(matchRoute({ to: "/analytics" }))}
                    tooltip="Analytics"
                    render={<Link to="/analytics" />}
                  >
                    <LineChartIcon />
                    <span>Analytics</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={Boolean(matchRoute({ to: "/goals" }))}
                    tooltip="Goals"
                    render={<Link to="/goals" />}
                  >
                    <TargetIcon />
                    <span>Goals</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={Boolean(matchRoute({ to: "/heatmap" }))}
                    tooltip="Heatmap"
                    render={<Link to="/heatmap" />}
                  >
                    <FlameIcon />
                    <span>Heatmap</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={Boolean(matchRoute({ to: "/weekly-summaries" }))}
                    tooltip="Weekly Summaries"
                    render={<Link to="/weekly-summaries" />}
                  >
                    <TrophyIcon />
                    <span>Weekly Summaries</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={Boolean(matchRoute({ to: "/settings" }))}
                    tooltip="Settings"
                    render={<Link to="/settings" />}
                  >
                    <SettingsIcon />
                    <span>Settings</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-[58svh] min-h-130 bg-[url('/dashboard/sidebar_mountains.png')] bg-cover bg-position-[center_68%] opacity-100 group-data-[collapsible=icon]:hidden md:block"
          >
            <div className="absolute inset-0 bg-linear-to-t from-sidebar/70 via-sidebar/5 to-sidebar/0" />
          </div>
        </SidebarContent>
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

export { AppLayout };
