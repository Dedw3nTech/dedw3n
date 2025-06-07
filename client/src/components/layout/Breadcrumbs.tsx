import { Link, useLocation } from "wouter";
import { ChevronRight, Home } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useStableDOMBatchTranslation } from "@/hooks/use-stable-dom-translation";
import { useMemo } from "react";

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

  // Define translatable texts with stable references to prevent translation loss
  const breadcrumbTexts = useMemo(() => [
    'Home', 'Marketplace', 'Private Vendor Dashboard', 'Business Vendor Dashboard',
    'Dating', 'Dating Profile', 'Community', 'Events & Meetups', 'Add Product/Service',
    'Vendor Registration', 'Orders & Returns', 'B2C Marketplace', 'B2B Marketplace',
    'C2C Marketplace', 'Product Details', 'Contact', 'Sign In', 'Sign Up', 'Profile',
    'Messages', 'Notifications', 'Settings', 'Shopping Cart', 'Checkout',
    'Liked Products', 'Add Product', 'Upload Product', 'Vendor Dashboard',
    'Become a Vendor', 'Members', 'Wallet', 'Admin Dashboard', 'FAQ',
    'Privacy Policy', 'Terms of Service', 'Shipping Info', 'Cookie Policy',
    'Community Guidelines', 'Site Map'
  ], []);

  // Use DOM-safe batch translation with error boundary protection
  const { translations: translatedTexts, isLoading: isTranslating } = useStableDOMBatchTranslation(breadcrumbTexts, 'high');
  
  // Memoize translated values to prevent re-render loops
  const translatedLabels = useMemo(() => ({
    home: translatedTexts["Home"] || "Home",
    marketplace: translatedTexts["Marketplace"] || "Marketplace",
    privateVendorDashboard: translatedTexts["Private Vendor Dashboard"] || "Private Vendor Dashboard",
    businessVendorDashboard: translatedTexts["Business Vendor Dashboard"] || "Business Vendor Dashboard",
    dating: translatedTexts["Dating"] || "Dating",
    datingProfile: translatedTexts["Dating Profile"] || "Dating Profile",
    community: translatedTexts["Community"] || "Community",
    eventsAndMeetups: translatedTexts["Events & Meetups"] || "Events & Meetups",
    addProductService: translatedTexts["Add Product/Service"] || "Add Product/Service",
    vendorRegistration: translatedTexts["Vendor Registration"] || "Vendor Registration",
    ordersReturns: translatedTexts["Orders & Returns"] || "Orders & Returns",
    b2cMarketplace: translatedTexts["B2C Marketplace"] || "B2C Marketplace",
    b2bMarketplace: translatedTexts["B2B Marketplace"] || "B2B Marketplace",
    c2cMarketplace: translatedTexts["C2C Marketplace"] || "C2C Marketplace",
    productDetails: translatedTexts["Product Details"] || "Product Details",
    contact: translatedTexts["Contact"] || "Contact",
    signIn: translatedTexts["Sign In"] || "Sign In",
    signUp: translatedTexts["Sign Up"] || "Sign Up",
    profile: translatedTexts["Profile"] || "Profile",
    messages: translatedTexts["Messages"] || "Messages",
    notifications: translatedTexts["Notifications"] || "Notifications",
    settings: translatedTexts["Settings"] || "Settings",
    shoppingCart: translatedTexts["Shopping Cart"] || "Shopping Cart",
    checkout: translatedTexts["Checkout"] || "Checkout",
    likedProducts: translatedTexts["Liked Products"] || "Liked Products",
    addProduct: translatedTexts["Add Product"] || "Add Product",
    uploadProduct: translatedTexts["Upload Product"] || "Upload Product",
    vendorDashboard: translatedTexts["Vendor Dashboard"] || "Vendor Dashboard",
    becomeVendor: translatedTexts["Become a Vendor"] || "Become a Vendor",
    members: translatedTexts["Members"] || "Members",
    wallet: translatedTexts["Wallet"] || "Wallet",
    adminDashboard: translatedTexts["Admin Dashboard"] || "Admin Dashboard",
    faq: translatedTexts["FAQ"] || "FAQ",
    privacyPolicy: translatedTexts["Privacy Policy"] || "Privacy Policy",
    termsOfService: translatedTexts["Terms of Service"] || "Terms of Service",
    shippingInfo: translatedTexts["Shipping Info"] || "Shipping Info",
    cookiePolicy: translatedTexts["Cookie Policy"] || "Cookie Policy",
    communityGuidelines: translatedTexts["Community Guidelines"] || "Community Guidelines",
    siteMap: translatedTexts["Site Map"] || "Site Map"
  }), [translatedTexts]);

  const getBreadcrumbs = (path: string): BreadcrumbItem[] => {
    const segments = path.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [{ label: translatedLabels.home, path: '/' }];
    
    // Special handling for dating-profile to show proper hierarchy
    if (path === '/dating-profile') {
      breadcrumbs.push({ label: translatedLabels.dating, path: '/dating' });
      breadcrumbs.push({ label: translatedLabels.datingProfile });
      return breadcrumbs;
    }
    
    // Special handling for events to show proper community hierarchy
    if (path === '/events') {
      breadcrumbs.push({ label: translatedLabels.community, path: '/wall' });
      breadcrumbs.push({ label: translatedLabels.eventsAndMeetups });
      return breadcrumbs;
    }
    
    // Special handling for vendor dashboard to show marketplace hierarchy
    if (path === '/vendor-dashboard') {
      breadcrumbs.push({ label: translatedLabels.marketplace, path: '/marketplace' });
      const vendorType = vendorData?.vendor?.vendorType;
      const dashboardLabel = vendorType === 'business' ? 
        translatedLabels.businessVendorDashboard : 
        translatedLabels.privateVendorDashboard;
      breadcrumbs.push({ label: dashboardLabel });
      return breadcrumbs;
    }
    
    // Special handling for add-product to show proper vendor hierarchy
    if (path === '/add-product') {
      breadcrumbs.push({ label: translatedLabels.marketplace, path: '/marketplace' });
      breadcrumbs.push({ label: translatedLabels.privateVendorDashboard, path: '/vendor-dashboard' });
      breadcrumbs.push({ label: translatedLabels.addProductService });
      return breadcrumbs;
    }
    
    // Special handling for vendor registration to show marketplace hierarchy
    if (path === '/vendor-register') {
      breadcrumbs.push({ label: translatedLabels.marketplace, path: '/marketplace' });
      breadcrumbs.push({ label: translatedLabels.vendorRegistration });
      return breadcrumbs;
    }
    
    // Special handling for orders-returns to show marketplace hierarchy
    if (path === '/orders-returns') {
      breadcrumbs.push({ label: translatedLabels.marketplace, path: '/marketplace' });
      breadcrumbs.push({ label: translatedLabels.ordersReturns });
      return breadcrumbs;
    }

    // Special handling for marketplace subsections (C2C, B2C, B2B)
    if (path === '/c2c') {
      breadcrumbs.push({ label: translatedLabels.marketplace, path: '/marketplace' });
      breadcrumbs.push({ label: translatedLabels.c2cMarketplace });
      return breadcrumbs;
    }

    if (path === '/b2c') {
      breadcrumbs.push({ label: translatedLabels.marketplace, path: '/marketplace' });
      breadcrumbs.push({ label: translatedLabels.b2cMarketplace });
      return breadcrumbs;
    }

    if (path === '/b2b') {
      breadcrumbs.push({ label: translatedLabels.marketplace, path: '/marketplace' });
      breadcrumbs.push({ label: translatedLabels.b2bMarketplace });
      return breadcrumbs;
    }
    
    // Define route mappings for better breadcrumb labels with translation support
    const routeLabels: Record<string, string> = {
      'products': translatedLabels.marketplace,
      'product': translatedLabels.productDetails,
      'marketplace': translatedLabels.marketplace,
      'b2c': translatedLabels.b2cMarketplace,
      'b2b': translatedLabels.b2bMarketplace, 
      'c2c': translatedLabels.c2cMarketplace,
      'wall': translatedLabels.community,
      'dating': translatedLabels.dating,
      'dating-profile': translatedLabels.datingProfile,
      'contact': translatedLabels.contact,
      'login': translatedLabels.signIn,
      'register': translatedLabels.signUp,
      'profile': translatedLabels.profile,
      'messages': translatedLabels.messages,
      'notifications': translatedLabels.notifications,
      'settings': translatedLabels.settings,
      'cart': translatedLabels.shoppingCart,
      'checkout': translatedLabels.checkout,
      'liked': translatedLabels.likedProducts,
      'add-product': translatedLabels.addProduct,
      'upload-product': translatedLabels.uploadProduct,
      'vendor-dashboard': translatedLabels.vendorDashboard,
      'become-vendor': translatedLabels.becomeVendor,
      'members': translatedLabels.members,
      'wallet': translatedLabels.wallet,
      'admin': translatedLabels.adminDashboard,
      'faq': translatedLabels.faq,
      'privacy': translatedLabels.privacyPolicy,
      'terms': translatedLabels.termsOfService,
      'shipping': translatedLabels.shippingInfo,
      'cookies': translatedLabels.cookiePolicy,
      'community-guidelines': translatedLabels.communityGuidelines,
      'sitemap': translatedLabels.siteMap
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