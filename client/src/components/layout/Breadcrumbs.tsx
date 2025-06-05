import { Link, useLocation } from "wouter";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  path?: string;
}

export function Breadcrumbs() {
  const [location] = useLocation();
  
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
    
    // Define route mappings for better breadcrumb labels
    const routeLabels: Record<string, string> = {
      'products': 'Marketplace',
      'product': 'Product Details',
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
      
      // Don't add path for the last segment (current page)
      breadcrumbs.push({
        label,
        path: index === segments.length - 1 ? undefined : currentPath
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