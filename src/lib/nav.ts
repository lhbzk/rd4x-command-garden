import {
  Activity,
  BarChart3,
  FileText,
  LayoutDashboard,
  LifeBuoy,
  Rocket,
  ScrollText,
  Search,
  Settings,
  ShieldAlert,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  to:
    | "/overview"
    | "/statistics"
    | "/search"
    | "/users"
    | "/tickets"
    | "/transcripts"
    | "/releases"
    | "/incidents"
    | "/audit"
    | "/settings";
  icon: LucideIcon;
  badge?: string;
}

export const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "Workspace",
    items: [
      { title: "Overview", to: "/overview", icon: LayoutDashboard },
      { title: "Statistics", to: "/statistics", icon: BarChart3 },
      { title: "Search", to: "/search", icon: Search },
    ],
  },
  {
    label: "Management",
    items: [
      { title: "Users", to: "/users", icon: Users },
      { title: "Tickets", to: "/tickets", icon: LifeBuoy, badge: "5" },
      { title: "Transcripts", to: "/transcripts", icon: FileText },
      { title: "Releases", to: "/releases", icon: Rocket },
    ],
  },
  {
    label: "System",
    items: [
      { title: "Incidents", to: "/incidents", icon: ShieldAlert, badge: "2" },
      { title: "Audit", to: "/audit", icon: ScrollText },
      { title: "Settings", to: "/settings", icon: Settings },
    ],
  },
];

export const allNavItems = navGroups.flatMap((g) => g.items);

export const activityIcon = Activity;
