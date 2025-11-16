import { Link } from 'wouter';
import { 
  Home,
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  Settings,
  Shield,
  FileText,
  TrendingUp,
  DollarSign,
  UserPlus,
  ChevronDown,
  ChevronRight,
  BarChart3,
  Database,
  Lock,
  Scale,
  Megaphone,
  Briefcase,
  Calculator,
  UserCog,
  User,
  AlertTriangle,
  CreditCard,
  Truck,
  UserCheck,
  Ticket,
  MessageSquare,
  Inbox,
  Menu
} from 'lucide-react';
import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useAdminTab } from '@/hooks/use-admin-tab';
import logoImage from '@assets/Dedw3n Logo png white_1762591228754.png';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

interface MenuItem {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  badge?: number;
  children?: MenuItem[];
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

const menuSections: MenuSection[] = [
  {
    title: 'Tickets',
    items: [
      { title: 'All Tickets', icon: Inbox, href: '/admin-control-center?tab=tickets' },
      { title: 'Open Tickets', icon: Ticket, href: '/admin-control-center?tab=tickets&status=open' },
      { title: 'In Progress', icon: MessageSquare, href: '/admin-control-center?tab=tickets&status=in_progress' },
      { title: 'Resolved', icon: UserCheck, href: '/admin-control-center?tab=tickets&status=resolved' },
    ]
  },
  {
    title: 'Operations',
    items: [
      { title: 'Dashboard', icon: LayoutDashboard, href: '/admin-control-center' },
      { title: 'Admin', icon: UserCheck, href: '/admin-control-center?tab=operations-admin' },
      { title: 'Credit & Collection', icon: CreditCard, href: '/admin-control-center?tab=operations-credit' },
      { title: 'Finance', icon: Calculator, href: '/admin-control-center?tab=operations-finance' },
      { title: 'Fraud', icon: AlertTriangle, href: '/admin-control-center?tab=operations-fraud' },
      { title: 'Orders', icon: ShoppingCart, href: '/admin-control-center?tab=operations-orders' },
      { title: 'Shipping & Return', icon: Truck, href: '/admin-control-center?tab=operations-shipping' },
      { title: 'User Management', icon: Users, href: '/admin-control-center?tab=users' },
      { title: 'Product Management', icon: Package, href: '/admin-control-center?tab=products' },
      { title: 'Order Management', icon: ShoppingCart, href: '/admin-control-center?tab=orders' },
      { title: 'Vendor Requests', icon: Briefcase, href: '/admin-control-center?tab=vendors' },
    ]
  },
  {
    title: 'Tech',
    items: [
      { title: 'System Settings', icon: Settings, href: '/admin-control-center?tab=settings' },
      { title: 'Database', icon: Database, href: '/admin-control-center?tab=database' },
      { title: 'Security', icon: Shield, href: '/admin-control-center?tab=security' },
      { title: 'API Management', icon: Lock, href: '/admin-control-center?tab=api' },
    ]
  },
  {
    title: 'Legal',
    items: [
      { title: 'Content Moderation', icon: Shield, href: '/admin-control-center?tab=reports' },
      { title: 'Legal Documents', icon: FileText, href: '/admin-control-center?tab=legal' },
      { title: 'Compliance', icon: Scale, href: '/admin-control-center?tab=compliance' },
    ]
  },
  {
    title: 'Marketing',
    items: [
      { title: 'Campaigns', icon: Megaphone, href: '/admin-control-center?tab=campaigns' },
      { title: 'Analytics', icon: BarChart3, href: '/admin-control-center?tab=analytics' },
      { title: 'Promotions', icon: TrendingUp, href: '/admin-control-center?tab=promotions' },
    ]
  },
  {
    title: 'Sales',
    items: [
      { title: 'Sales Overview', icon: TrendingUp, href: '/admin-control-center?tab=sales' },
      { title: 'Revenue Reports', icon: DollarSign, href: '/admin-control-center?tab=revenue' },
      { title: 'Customer Insights', icon: Users, href: '/admin-control-center?tab=customers' },
    ]
  },
  {
    title: 'Finance',
    items: [
      { title: 'Financial Dashboard', icon: Calculator, href: '/admin-control-center?tab=finance' },
      { title: 'Transactions', icon: DollarSign, href: '/admin-control-center?tab=transactions' },
      { title: 'Payouts', icon: Briefcase, href: '/admin-control-center?tab=payouts' },
    ]
  },
  {
    title: 'HR',
    items: [
      { title: 'Team Management', icon: UserCog, href: '/admin-control-center?tab=team' },
      { title: 'Roles & Permissions', icon: Lock, href: '/admin-control-center?tab=roles' },
      { title: 'Activity Logs', icon: FileText, href: '/admin-control-center?tab=logs' },
    ]
  }
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface SidebarContentProps {
  user: any;
  expandedSections: string[];
  toggleSection: (title: string) => void;
  isActive: (href: string) => boolean;
  isMobile?: boolean;
}

function SidebarContent({ user, expandedSections, toggleSection, isActive, isMobile = false }: SidebarContentProps) {
  const NavLink = isMobile ? SheetClose : 'div';
  
  return (
    <>
      <div className="p-6 border-b border-blue-800/50">
        {isMobile ? (
          <SheetClose asChild>
            <Link 
              href="/"
              className="flex flex-col items-center hover:opacity-80 transition-opacity" 
              data-testid="link-home-mobile"
            >
              <div className="h-48 w-48 mx-auto overflow-hidden mb-2">
                <img 
                  src={logoImage} 
                  alt="Dedw3n Logo" 
                  className="h-full w-full object-cover"
                />
              </div>
              <p className="text-base text-blue-200">Admin Centre</p>
            </Link>
          </SheetClose>
        ) : (
          <Link 
            href="/"
            className="flex flex-col items-center hover:opacity-80 transition-opacity" 
            data-testid="link-home"
          >
            <div className="h-48 w-48 mx-auto overflow-hidden mb-2">
              <img 
                src={logoImage} 
                alt="Dedw3n Logo" 
                className="h-full w-full object-cover"
              />
            </div>
            <p className="text-base text-blue-200">Admin Centre</p>
          </Link>
        )}
      </div>
      
      {user && (
        <div className="p-6 border-b border-blue-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
              {user.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.name || user.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="h-5 w-5 text-blue-200" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate" data-testid="text-admin-name">
                {user.name || user.username}
              </p>
              <p className="text-xs text-blue-200 truncate" data-testid="text-admin-role">
                {user.role}
              </p>
            </div>
          </div>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-thin scrollbar-thumb-blue-700 scrollbar-track-transparent">
        {menuSections.map((section) => (
          <div key={section.title} className="mb-4">
            <button
              type="button"
              onClick={() => toggleSection(section.title)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-blue-200 hover:text-white transition-colors"
              data-testid={`button-toggle-${section.title.toLowerCase()}`}
            >
              <span>{section.title}</span>
              {expandedSections.includes(section.title) ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
            
            {expandedSections.includes(section.title) && (
              <div className="mt-1 space-y-1">
                {section.items.map((item) => (
                  isMobile ? (
                    <SheetClose asChild key={item.title}>
                      <Link 
                        href={item.href || '#'}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all",
                          isActive(item.href || '')
                            ? "bg-blue-600 text-white shadow-md"
                            : "text-blue-100 hover:bg-white/10 hover:text-white"
                        )}
                        data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        <span className="flex-1 truncate">{item.title}</span>
                        {item.badge !== undefined && item.badge > 0 && (
                          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full" data-testid={`badge-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </SheetClose>
                  ) : (
                    <Link 
                      key={item.title} 
                      href={item.href || '#'}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all",
                        isActive(item.href || '')
                          ? "bg-blue-600 text-white shadow-md"
                          : "text-blue-100 hover:bg-white/10 hover:text-white"
                      )}
                      data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      <span className="flex-1 truncate">{item.title}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full" data-testid={`badge-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  )
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-blue-800/50">
        {isMobile ? (
          <SheetClose asChild>
            <Link 
              href="/"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-blue-100 hover:bg-white/10 hover:text-white transition-colors" 
              data-testid="link-back-to-dedw3n-mobile"
            >
              <Home className="h-4 w-4" />
              <span>Back to Dedw3n</span>
            </Link>
          </SheetClose>
        ) : (
          <Link 
            href="/"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-blue-100 hover:bg-white/10 hover:text-white transition-colors" 
            data-testid="link-back-to-dedw3n"
          >
            <Home className="h-4 w-4" />
            <span>Back to Dedw3n</span>
          </Link>
        )}
      </div>
    </>
  );
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(['Tickets', 'Operations']);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const { isActive } = useAdminTab();

  const toggleSection = useCallback((title: string) => {
    setExpandedSections(prev =>
      prev.includes(title)
        ? prev.filter(t => t !== title)
        : [...prev, title]
    );
  }, []);

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50 overflow-hidden">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between bg-[#1e3a5f] text-white p-4 border-b border-blue-800/50">
        <h1 className="text-lg font-semibold">Admin Centre</h1>
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-white hover:bg-white/10" data-testid="button-menu-mobile">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 bg-[#1e3a5f] text-white border-blue-800/50 p-0">
            <div className="h-full flex flex-col">
              <SidebarContent 
                user={user}
                expandedSections={expandedSections}
                toggleSection={toggleSection}
                isActive={isActive}
                isMobile={true}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-[#1e3a5f] text-white flex-col shadow-xl">
        <SidebarContent 
          user={user}
          expandedSections={expandedSections}
          toggleSection={toggleSection}
          isActive={isActive}
          isMobile={false}
        />
      </aside>

      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
