import { MenuConfig } from "@/config/types";
import {
  Bolt,
  ReceiptText,
  UserPlus,
  Download,
  FileChartLine,
  SquareActivity,
  Newspaper,
  Briefcase,
  Building2,
  DoorClosed,
  Megaphone,
  ClipboardList,
  Grid,
  Calendar
} from "lucide-react";

export const MENU_SIDEBAR_MAIN: MenuConfig = [
  {
    children: [
      {
        title: 'Home',
        path: '#',
        icon: Bolt
      },
      {
        title: 'Lançar despesa',
        path: '#',
        icon: ReceiptText
      },
      {
        title: 'Enviar Convite',
        path: '#',
        icon: UserPlus
      },
    ],
  }
];

export const MENU_SIDEBAR_RESOURCES: MenuConfig = [
  {
    title: 'Resources',
    children: [
      {
        title: 'About Metronic',
        path: '#',
        icon: Download
      },
      {
        title: 'Advertise',
        path: '#',
        icon: FileChartLine,
        badge: 'Pro'
      },
      {
        title: 'Help',
        path: '#',
        icon: SquareActivity
      },
      {
        title: 'Blog',
        path: '#',
        icon: Newspaper
      },
      {
        title: 'Careers',
        path: '#',
        icon: Briefcase
      },
      {
        title: 'Press',
        path: '#',
        icon: Megaphone
      },
    ],
  }
];

export const MENU_SIDEBAR_WORKSPACES: MenuConfig = [
  {
    title: 'Configurações',
    children: [
      {
        title: 'Condomínio',
        path: '#',
        icon: Building2
      },
      {
        title: 'Unidade',
        path: '#',
        icon: DoorClosed
      },
    ],
  }
];

export const MENU_TOOLBAR: MenuConfig = [
  {
    title: 'List',
    path: '/layout-14',
    icon: ClipboardList
  },
  {
    title: 'Kanban',
    path: '#',
    icon: Grid
  },
  {
    title: 'Calendar',
    path: '#',
    icon: Calendar
  },
  {
    title: 'Dashboard',
    path: '#',
    icon: Bolt
  },
];
