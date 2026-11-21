import {
  Home,
  User,
  LayoutDashboard,
  CalendarDays,
  Receipt,
  Coins,
  AlertTriangle,
  Gauge,
  Send,
  Activity,
  CheckCircle2,
  RotateCcw,
  ShieldCheck,
  Hash,
  ClipboardCheck,
  Banknote,
  Map,
  Route,
  HandCoins,
  FileCheck2,
  Settings,
  Briefcase,
  Tag,
  SlidersHorizontal,
  BarChart3,
  History,
  Building2,
  Lock,
  Paperclip,
  KeyRound,
  FileQuestion,
} from 'lucide-react';

// Maps icon name strings (stored in terModules.js) to Lucide components.
// Every key here is used by at least one module in the data file.

const ICON_MAP = {
  home: Home,
  user: User,
  'layout-dashboard': LayoutDashboard,
  'calendar-days': CalendarDays,
  receipt: Receipt,
  coins: Coins,
  'alert-triangle': AlertTriangle,
  gauge: Gauge,
  send: Send,
  activity: Activity,
  'check-circle-2': CheckCircle2,
  'rotate-ccw': RotateCcw,
  'shield-check': ShieldCheck,
  hash: Hash,
  'clipboard-check': ClipboardCheck,
  banknote: Banknote,
  map: Map,
  route: Route,
  'hand-coins': HandCoins,
  'file-check-2': FileCheck2,
  settings: Settings,
  briefcase: Briefcase,
  tag: Tag,
  'sliders-horizontal': SlidersHorizontal,
  'bar-chart-3': BarChart3,
  history: History,
  'building-2': Building2,
  lock: Lock,
  paperclip: Paperclip,
  'key-round': KeyRound,
};

export const ICON_OPTIONS = Object.keys(ICON_MAP);

export function IconResolver({ name, className = 'h-5 w-5', ...props }) {
  const Icon = ICON_MAP[name] || FileQuestion;
  return <Icon className={className} aria-hidden="true" {...props} />;
}

export default IconResolver;
