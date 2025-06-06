import { Link, useLocation } from "wouter";
import { ChevronRight, Home } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

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
  
  const getBreadcrumbs = (path: string): BreadcrumbItem[] => {
    const segments = path.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [{ label: 'Home', path: '/' }];
    
    // Special handling for dating-profile to show proper hierarchy
    if (path === '/dating-profile') {
      breadcrumbs.push({ label: 'Dating', path: '/dating' });
      breadcrumbs.push({ label: 'Dating Profile' });
      return breadcrumbs;
    }
    
    // Special handling for events to show proper community hierarchy
    if (path === '/events') {
      breadcrumbs.push({ label: 'Community', path: '/wall' });
      breadcrumbs.push({ label: 'Events & Meetups' });
      return breadcrumbs;
    }
    
    // Special handling for vendor dashboard to show marketplace hierarchy
    if (path === '/vendor-dashboard') {
      breadcrumbs.push({ label: 'Marketplace', path: '/marketplace' });
      const vendorType = vendorData?.vendor?.vendorType;
      const dashboardLabel = vendorType === 'business' ? 'Business Vendor Dashboard' : 'Private Vendor Dashboard';
      breadcrumbs.push({ label: dashboardLabel });
      return breadcrumbs;
    }
    
    // Special handling for add-product to show proper vendor hierarchy
    if (path === '/add-product') {
      breadcrumbs.push({ label: 'Marketplace', path: '/marketplace' });
      breadcrumbs.push({ label: 'Private Vendor Dashboard', path: '/vendor-dashboard' });
      breadcrumbs.push({ label: 'Add Product/Service' });
      return breadcrumbs;
    }
    
    // Special handling for vendor registration to show marketplace hierarchy
    if (path === '/vendor-register') {
      breadcrumbs.push({ label: 'Marketplace', path: '/marketplace' });
      breadcrumbs.push({ label: 'Vendor Registration' });
      return breadcrumbs;
    }
    
    // Define route mappings for better breadcrumb labels
    const routeLabels: Record<string, string> = {
      'products': 'Marketplace',
      'product': 'Product Details',
      'marketplace': 'Marketplace',
      'b2c': 'B2C Marketplace',
      'b2b': 'B2B Marketplace', 
      'c2c': 'C2C Marketplace',
      'wall': 'Community',
      'dating': 'Dating',
      'dating-profile': 'Dating Profile',
      'contact': 'Contact',
      'login': 'Sign In',
      'register': 'Sign Up',
      'profile': 'Profile',
      'messages': 'Messages',
      'notifications': 'Notifications',
      'settings': 'Settings',
      'cart': 'Shopping Cart',
      'checkout': 'Checkout',
      'liked': 'Liked Products',
      'add-product': 'Add Product',
      'upload-product': 'Upload Product',
      'vendor-dashboard': 'Vendor Dashboard',
      'become-vendor': 'Become a Vendor',
      'members': 'Members',
      'wallet': 'Wallet',
      'admin': 'Admin Dashboard',
      'faq': 'FAQ',
      'privacy': 'Privacy Policy',
      'terms': 'Terms of Service',
      'shipping': 'Shipping Info',
      'cookies': 'Cookie Policy',
      'community-guidelines': 'Community Guidelines',
      'sitemap': 'Site Map'
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