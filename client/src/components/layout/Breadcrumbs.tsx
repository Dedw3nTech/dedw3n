import { Link, useLocation } from "wouter";
import { ChevronRight, Home } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useUnifiedBatchTranslation } from "@/hooks/use-unified-translation";

interface BreadcrumbItem {
  label: string;
  path?: string;
}

export function Breadcrumbs() {
  const [location] = useLocation();
  
  // Fetch vendor data to determine correct vendor type for breadcrumb
  const { data: vendorData } = useQuery({
    queryKey: ['/api/vendors/me'],
    enabled: location === '/vendor-dashboard',
    staleTime: 5 * 60 * 1000,
  });

  // Initialize unified translation system for breadcrumbs
  const { translations } = useUnifiedBatchTranslation([
    'Home', 'Marketplace', 'Private Vendor Dashboard', 'Business Vendor Dashboard',
    'Dating', 'Dating Profile', 'Community', 'Events & Meetups', 'Add Product/Service',
    'Vendor Registration', 'Orders & Returns', 'B2C Marketplace', 'B2B Marketplace',
    'C2C Marketplace', 'Product Details', 'Contact', 'Sign In', 'Sign Up', 'Profile',
    'Messages', 'Notifications', 'Settings', 'Shopping Cart', 'Checkout',
    'Liked Products', 'Add Product', 'Upload Product', 'Vendor Dashboard',
    'Become a Vendor', 'Members', 'Wallet', 'Admin Dashboard', 'FAQ',
    'Privacy Policy', 'Terms of Service', 'Shipping Info', 'Cookie Policy',
    'Community Guidelines', 'Site Map'
  ]);
  
  const getBreadcrumbs = (path: string): BreadcrumbItem[] => {
    const segments = path.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [{ label: translations?.['Home'] || 'Home', path: '/' }];
    
    // Special handling for dating-profile to show proper hierarchy
    if (path === '/dating-profile') {
      breadcrumbs.push({ label: translations?.['Dating'] || 'Dating', path: '/dating' });
      breadcrumbs.push({ label: translations?.['Dating Profile'] || 'Dating Profile' });
      return breadcrumbs;
    }
    
    // Special handling for events to show proper community hierarchy
    if (path === '/events') {
      breadcrumbs.push({ label: translations?.['Community'] || 'Community', path: '/wall' });
      breadcrumbs.push({ label: translations?.['Events & Meetups'] || 'Events & Meetups' });
      return breadcrumbs;
    }
    
    // Special handling for vendor dashboard to show marketplace hierarchy
    if (path === '/vendor-dashboard') {
      breadcrumbs.push({ label: translations?.['Marketplace'] || 'Marketplace', path: '/marketplace' });
      const vendorType = vendorData?.vendor?.vendorType;
      const dashboardLabel = vendorType === 'business' ? 
        (translations?.['Business Vendor Dashboard'] || 'Business Vendor Dashboard') : 
        (translations?.['Private Vendor Dashboard'] || 'Private Vendor Dashboard');
      breadcrumbs.push({ label: dashboardLabel });
      return breadcrumbs;
    }
    
    // Special handling for add-product to show proper vendor hierarchy
    if (path === '/add-product') {
      breadcrumbs.push({ label: translations?.['Marketplace'] || 'Marketplace', path: '/marketplace' });
      breadcrumbs.push({ label: translations?.['Private Vendor Dashboard'] || 'Private Vendor Dashboard', path: '/vendor-dashboard' });
      breadcrumbs.push({ label: translations?.['Add Product/Service'] || 'Add Product/Service' });
      return breadcrumbs;
    }
    
    // Special handling for vendor registration to show marketplace hierarchy
    if (path === '/vendor-register') {
      breadcrumbs.push({ label: translations?.['Marketplace'] || 'Marketplace', path: '/marketplace' });
      breadcrumbs.push({ label: translations?.['Vendor Registration'] || 'Vendor Registration' });
      return breadcrumbs;
    }
    
    // Special handling for orders-returns to show marketplace hierarchy
    if (path === '/orders-returns') {
      breadcrumbs.push({ label: translations?.['Marketplace'] || 'Marketplace', path: '/marketplace' });
      breadcrumbs.push({ label: translations?.['Orders & Returns'] || 'Orders & Returns' });
      return breadcrumbs;
    }
    
    // Define route mappings for better breadcrumb labels with translation support
    const routeLabels: Record<string, string> = {
      'products': translations?.['Marketplace'] || 'Marketplace',
      'product': translations?.['Product Details'] || 'Product Details',
      'marketplace': translations?.['Marketplace'] || 'Marketplace',
      'b2c': translations?.['B2C Marketplace'] || 'B2C Marketplace',
      'b2b': translations?.['B2B Marketplace'] || 'B2B Marketplace', 
      'c2c': translations?.['C2C Marketplace'] || 'C2C Marketplace',
      'wall': translations?.['Community'] || 'Community',
      'dating': translations?.['Dating'] || 'Dating',
      'dating-profile': translations?.['Dating Profile'] || 'Dating Profile',
      'contact': translations?.['Contact'] || 'Contact',
      'login': translations?.['Sign In'] || 'Sign In',
      'register': translations?.['Sign Up'] || 'Sign Up',
      'profile': translations?.['Profile'] || 'Profile',
      'messages': translations?.['Messages'] || 'Messages',
      'notifications': translations?.['Notifications'] || 'Notifications',
      'settings': translations?.['Settings'] || 'Settings',
      'cart': translations?.['Shopping Cart'] || 'Shopping Cart',
      'checkout': translations?.['Checkout'] || 'Checkout',
      'liked': translations?.['Liked Products'] || 'Liked Products',
      'add-product': translations?.['Add Product'] || 'Add Product',
      'upload-product': translations?.['Upload Product'] || 'Upload Product',
      'vendor-dashboard': translations?.['Vendor Dashboard'] || 'Vendor Dashboard',
      'become-vendor': translations?.['Become a Vendor'] || 'Become a Vendor',
      'members': translations?.['Members'] || 'Members',
      'wallet': translations?.['Wallet'] || 'Wallet',
      'admin': translations?.['Admin Dashboard'] || 'Admin Dashboard',
      'faq': translations?.['FAQ'] || 'FAQ',
      'privacy': translations?.['Privacy Policy'] || 'Privacy Policy',
      'terms': translations?.['Terms of Service'] || 'Terms of Service',
      'shipping': translations?.['Shipping Info'] || 'Shipping Info',
      'cookies': translations?.['Cookie Policy'] || 'Cookie Policy',
      'community-guidelines': translations?.['Community Guidelines'] || 'Community Guidelines',
      'sitemap': translations?.['Site Map'] || 'Site Map'
    };
    
    let currentPath = '';
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
      
      // Special handling for B2C - redirect to main B2C marketplace page
      let finalPath = currentPath;
      if (segment === 'b2c') {
        finalPath = '/marketplace/b2c';
      }
      
      // Don't add path for the last segment (current page)
      breadcrumbs.push({
        label,
        path: index === segments.length - 1 ? undefined : finalPath
      });
    });
    
    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs(location);
  
  // Don't show breadcrumbs on home page or if only one item
  if (location === '/' || breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav className="flex items-center space-x-1 text-sm text-gray-600 py-2 px-4 bg-gray-50 border-b" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-1">
        {breadcrumbs.map((item, index) => (
          <li key={index} className="flex items-center">
            {index === 0 && <Home className="h-4 w-4 mr-1" />}
            {item.path ? (
              <Link 
                href={item.path}
                className="hover:text-blue-600 transition-colors duration-200"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-gray-900 font-medium">{item.label}</span>
            )}
            {index < breadcrumbs.length - 1 && (
              <ChevronRight className="h-4 w-4 mx-2 text-gray-400" />
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}