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
  DoorClosed,
  Blocks,
  Megaphone,
  Settings
} from "lucide-react";

export const MENU_SIDEBAR_MAIN: MenuConfig = [
  {
    children: [
      {
        title: 'Home',
        path: '/condominiums/:code/configuration',
        icon: Bolt
      },
      {
        title: 'Lançar despesa',
        path: '/condominiums/:code/expenses',
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
        title: 'Configuração',
        path: '/condominiums/:code/configuration',
        icon: Settings
      },
      {
        title: 'Cadastro de grupos',
        path: '/condominiums/:code/unit-groups',
        icon: Blocks
      },
      {
        title: 'Unidades',
        path: '/condominiums/:code/units',
        icon: DoorClosed
      },
    ],
  }
];

export const MENU_TOOLBAR: MenuConfig = [];
