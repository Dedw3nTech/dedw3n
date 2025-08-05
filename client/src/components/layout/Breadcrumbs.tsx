import { Link, useLocation } from "wouter";
import { ChevronRight, Home } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useMasterBatchTranslation } from "@/hooks/use-master-translation";
import { useMemo } from "react";
import { Vendor } from "@shared/schema";
import { createStoreSlug } from "@shared/utils";

interface BreadcrumbItem {
  label: string;
  path?: string;
}

export function Breadcrumbs() {
  const [location] = useLocation();
  
  // Extract vendor ID or slug from URL if it's a vendor detail page
  const vendorMatch = useMemo(() => {
    const idMatch = location.match(/^\/vendor\/(\d+)$/);
    const slugMatch = location.match(/^\/vendor\/([^\/]+)$/);
    
    if (idMatch) {
      return { type: 'id', value: parseInt(idMatch[1]) };
    } else if (slugMatch && !idMatch) {
      return { type: 'slug', value: slugMatch[1] };
    }
    return null;
  }, [location]);

  // Extract product identifier from URL if it's a product detail page
  const productMatch = useMemo(() => {
    const match = location.match(/^\/product\/([^\/]+)$/);
    return match ? match[1] : null;
  }, [location]);
  
  // Fetch vendor data to determine correct vendor type for breadcrumb
  const { data: vendorData } = useQuery({
    queryKey: ['/api/vendors/me'],
    enabled: location === '/vendor-dashboard',
    staleTime: 5 * 60 * 1000,
  });
  
  // Fetch specific vendor data for vendor detail pages
  const { data: specificVendor } = useQuery<Vendor>({
    queryKey: vendorMatch?.type === 'id' 
      ? [`/api/vendors/${vendorMatch.value}`]
      : [`/api/vendors/by-slug/${vendorMatch?.value}`],
    enabled: !!vendorMatch,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch product data for product detail pages
  const { data: productData } = useQuery({
    queryKey: [`/api/products/${productMatch}`],
    enabled: !!productMatch,
    staleTime: 5 * 60 * 1000,
  });

  // Define translatable texts with stable references to prevent translation loss
  const breadcrumbTexts = useMemo(() => [
    'Home', 'Marketplace', 'Private Vendor Dashboard', 'Business Vendor Dashboard',
    'Dating', 'Dating Profile', 'Community', 'Events & Meetups', 'Add Product/Service',
    'Vendor Registration', 'Orders & Returns', 'B2C Marketplace', 'B2B Marketplace',
    'C2C Marketplace', 'RQST Marketplace', 'Product Details', 'Contact', 'Sign In', 'Sign Up', 'Profile',
    'Messages', 'Notifications', 'Settings', 'Shopping Cart', 'Checkout',
    'Liked Products', 'Add Product', 'Upload Product', 'Vendor Dashboard',
    'Become a Vendor', 'Members', 'Wallet', 'Admin Dashboard', 'FAQ',
    'Privacy Policy', 'Terms of Service', 'Business Terms of Service', 'Shipping Info', 'Cookie Policy',
    'Community Guidelines', 'Site Map', 'Network Partnerships', 'Affiliate Partnerships', 'Resources', 'Vendor'
  ], []);

  // Use master translation system for unified performance
  const { translations: translatedTexts } = useMasterBatchTranslation(breadcrumbTexts, 'high');
  
  // Memoize translated values to prevent re-render loops
  const translatedLabels = useMemo(() => ({
    home: translatedTexts[0] || "Home",
    marketplace: translatedTexts[1] || "Marketplace",
    privateVendorDashboard: translatedTexts[2] || "Private Vendor Dashboard",
    businessVendorDashboard: translatedTexts[3] || "Business Vendor Dashboard",
    dating: translatedTexts[4] || "Dating",
    datingProfile: translatedTexts[5] || "Dating Profile",
    community: translatedTexts[6] || "Community",
    eventsAndMeetups: translatedTexts[7] || "Events & Meetups",
    addProductService: translatedTexts[8] || "Add Product/Service",
    vendorRegistration: translatedTexts[9] || "Vendor Registration",
    ordersReturns: translatedTexts[10] || "Orders & Returns",
    b2cMarketplace: translatedTexts[11] || "B2C Marketplace",
    b2bMarketplace: translatedTexts[12] || "B2B Marketplace",
    c2cMarketplace: translatedTexts[13] || "C2C Marketplace",
    rqstMarketplace: translatedTexts[14] || "RQST Marketplace",
    productDetails: translatedTexts[15] || "Product Details",
    contact: translatedTexts[16] || "Contact",
    signIn: translatedTexts[17] || "Sign In",
    signUp: translatedTexts[18] || "Sign Up",
    profile: translatedTexts[19] || "Profile",
    messages: translatedTexts[20] || "Messages",
    notifications: translatedTexts[21] || "Notifications",
    settings: translatedTexts[22] || "Settings",
    shoppingCart: translatedTexts[23] || "Shopping Cart",
    checkout: translatedTexts[24] || "Checkout",
    likedProducts: translatedTexts[25] || "Liked Products",
    addProduct: translatedTexts[26] || "Add Product",
    uploadProduct: translatedTexts[27] || "Upload Product",
    vendorDashboard: translatedTexts[28] || "Vendor Dashboard",
    becomeVendor: translatedTexts[29] || "Become a Vendor",
    members: translatedTexts[30] || "Members",
    wallet: translatedTexts[31] || "Wallet",
    adminDashboard: translatedTexts[32] || "Admin Dashboard",
    faq: translatedTexts[33] || "FAQ",
    privacyPolicy: translatedTexts[34] || "Privacy Policy",
    termsOfService: translatedTexts[35] || "Terms of Service",
    businessTermsOfService: translatedTexts[36] || "Business Terms of Service",
    shippingInfo: translatedTexts[37] || "Shipping Info",
    cookiePolicy: translatedTexts[38] || "Cookie Policy",
    communityGuidelines: translatedTexts[39] || "Community Guidelines",
    siteMap: translatedTexts[40] || "Site Map",
    networkPartnerships: translatedTexts[41] || "Network Partnerships",
    affiliatePartnerships: translatedTexts[42] || "Affiliate Partnerships",
    resources: translatedTexts[43] || "Resources",
    vendor: translatedTexts[44] || "Vendor"
  }), [translatedTexts]);

  const getBreadcrumbs = (path: string): BreadcrumbItem[] => {
    const segments = path.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [{ label: translatedLabels.home, path: '/' }];
    
    // Special handling for vendor detail pages to show vendor store name
    if (vendorMatch && specificVendor) {
      breadcrumbs.push({ label: translatedLabels.vendor });
      breadcrumbs.push({ label: specificVendor.storeName });
      return breadcrumbs;
    }

    // Special handling for product detail pages to show product name
    if (productMatch && productData) {
      breadcrumbs.push({ label: translatedLabels.marketplace, path: '/marketplace' });
      if (productData.category) {
        breadcrumbs.push({ label: productData.category, path: `/category/${encodeURIComponent(productData.category)}` });
      }
      breadcrumbs.push({ label: productData.name });
      return breadcrumbs;
    }
    
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
    
    // Special handling for network partnerships
    if (path === '/network-partnerships') {
      breadcrumbs.push({ label: translatedLabels.networkPartnerships });
      return breadcrumbs;
    }
    
    // Special handling for network partnership resources to show network partnership hierarchy
    if (path === '/network-partnership-resources') {
      breadcrumbs.push({ label: translatedLabels.networkPartnerships, path: '/network-partnerships' });
      breadcrumbs.push({ label: translatedLabels.resources });
      return breadcrumbs;
    }
    
    // Special handling for affiliate partnerships
    if (path === '/affiliate-partnerships') {
      breadcrumbs.push({ label: translatedLabels.affiliatePartnerships });
      return breadcrumbs;
    }
    
    // Special handling for resources to show affiliate partnership hierarchy
    if (path === '/resources') {
      breadcrumbs.push({ label: translatedLabels.affiliatePartnerships, path: '/affiliate-partnerships' });
      breadcrumbs.push({ label: translatedLabels.resources });
      return breadcrumbs;
    }
    
    // Special handling for business terms to show terms of service hierarchy
    if (path === '/business-terms') {
      breadcrumbs.push({ label: translatedLabels.termsOfService, path: '/terms' });
      breadcrumbs.push({ label: translatedLabels.businessTermsOfService });
      return breadcrumbs;
    }

    // Special handling for marketplace subsections (C2C, B2C, B2B)
    if (path === '/c2c' || path === '/marketplace/c2c') {
      breadcrumbs.push({ label: translatedLabels.marketplace, path: '/marketplace' });
      breadcrumbs.push({ label: translatedLabels.c2cMarketplace });
      return breadcrumbs;
    }

    if (path === '/b2c' || path === '/marketplace/b2c' || path === '/') {
      breadcrumbs.push({ label: translatedLabels.marketplace, path: '/marketplace' });
      breadcrumbs.push({ label: translatedLabels.b2cMarketplace });
      return breadcrumbs;
    }

    if (path === '/b2b' || path === '/marketplace/b2b') {
      breadcrumbs.push({ label: translatedLabels.marketplace, path: '/marketplace' });
      breadcrumbs.push({ label: translatedLabels.b2bMarketplace });
      return breadcrumbs;
    }

    if (path === '/rqst' || path === '/marketplace/rqst') {
      breadcrumbs.push({ label: translatedLabels.marketplace, path: '/marketplace' });
      breadcrumbs.push({ label: translatedLabels.rqstMarketplace });
      return breadcrumbs;
    }

    // Special handling for marketplace main page
    if (path === '/marketplace' || path === '/products') {
      breadcrumbs.push({ label: translatedLabels.marketplace });
      return breadcrumbs;
    }
    
    // Define route mappings for better breadcrumb labels with translation support
    const routeLabels: Record<string, string> = {
      'products': translatedLabels.marketplace,
      'product': productData?.name || translatedLabels.productDetails,
      'marketplace': translatedLabels.marketplace,
      'b2c': translatedLabels.b2cMarketplace,
      'b2b': translatedLabels.b2bMarketplace, 
      'c2c': translatedLabels.c2cMarketplace,
      'rqst': translatedLabels.rqstMarketplace,
      'wall': translatedLabels.community,
      'community': translatedLabels.community,
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
      'business-terms': translatedLabels.businessTermsOfService,
      'shipping': translatedLabels.shippingInfo,
      'cookies': translatedLabels.cookiePolicy,
      'community-guidelines': translatedLabels.communityGuidelines,
      'sitemap': translatedLabels.siteMap,
      'network-partnerships': translatedLabels.networkPartnerships,
      'affiliate-partnerships': translatedLabels.affiliatePartnerships,
      'resources': translatedLabels.resources
    };
    
    let currentPath = '';
    for (let index = 0; index < segments.length; index++) {
      const segment = segments[index];
      currentPath += `/${segment}`;
      let label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
      
      // Special marketplace path handling for proper translation
      if (segment === 'marketplace' && index < segments.length - 1) {
        const nextSegment = segments[index + 1];
        if (nextSegment === 'b2c' || nextSegment === 'b2b' || nextSegment === 'c2c') {
          // Skip adding marketplace as we'll handle it in the subsection segment
          continue;
        }
      }
      
      // Handle marketplace subsections with proper parent hierarchy
      if (segment === 'b2c' && index > 0 && segments[index - 1] === 'marketplace') {
        breadcrumbs.push({ label: translatedLabels.marketplace, path: '/marketplace' });
        label = translatedLabels.b2cMarketplace;
      } else if (segment === 'b2b' && index > 0 && segments[index - 1] === 'marketplace') {
        breadcrumbs.push({ label: translatedLabels.marketplace, path: '/marketplace' });
        label = translatedLabels.b2bMarketplace;
      } else if (segment === 'c2c' && index > 0 && segments[index - 1] === 'marketplace') {
        breadcrumbs.push({ label: translatedLabels.marketplace, path: '/marketplace' });
        label = translatedLabels.c2cMarketplace;
      }
      
      // Don't add path for the last segment (current page)
      breadcrumbs.push({
        label,
        path: index === segments.length - 1 ? undefined : currentPath
      });
    }
    
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