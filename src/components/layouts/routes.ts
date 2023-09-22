import {
  LayoutDashboard,
  LineChart,
  ListTree,
  Settings,
  TextSelect,
  UsersIcon,
} from "lucide-react";

export const ROUTES = [
  {
    name: "Dashboard",
    pathname: `/project/[projectId]`,
    icon: LayoutDashboard,
  },
  {
    name: "Traces",
    pathname: `/project/[projectId]/traces`,
    icon: ListTree,
  },
  {
    name: "Generations",
    pathname: `/project/[projectId]/generations`,
    icon: TextSelect,
  },
  {
    name: "Scores",
    pathname: `/project/[projectId]/scores`,
    icon: LineChart,
  },
  {
    name: "Users",
    pathname: `/project/[projectId]/users`,
    icon: UsersIcon,
  },
  {
    name: "Settings",
    pathname: "/project/[projectId]/settings",
    icon: Settings,
  },
];
