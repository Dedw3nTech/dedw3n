import { useEffect } from 'react';

interface PageTitleOptions {
  title: string;
  suffix?: string;
}

export function usePageTitle({ title, suffix = 'Dedw3n' }: PageTitleOptions) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${suffix}` : suffix;
    document.title = fullTitle;
    
    // Update meta description based on page
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      const descriptions: Record<string, string> = {
        'Home': 'Join Dedw3n\'s innovative social marketplace platform. Buy and sell products, connect with a verified community, and discover meaningful relationships.',
        'Products': 'Discover products from verified sellers in our secure B2B, B2C, and C2C marketplace with integrated social features.',
        'Marketplace': 'Discover products from verified sellers in our secure B2B, B2C, and C2C marketplace with integrated social features.',
        'Community': 'Connect with verified creators, shoppers, and professionals in our secure community platform.',
        'Wall': 'Connect with verified creators, shoppers, and professionals in our secure community platform.',
        'Dating': 'Meet and connect with people through our trusted dating platform with verified profiles.',
        'Login': 'Sign in to your Dedw3n account to access the marketplace, community, and dating features.',
        'Register': 'Create your Dedw3n account to start buying, selling, and connecting with our verified community.',
        'Contact': 'Get in touch with the Dedw3n team for support, partnerships, or general inquiries.',
        'FAQ': 'Find answers to frequently asked questions about Dedw3n marketplace, community, and dating features.',
        'Privacy': 'Learn about Dedw3n\'s privacy policy and how we protect your personal information.',
        'Terms': 'Read Dedw3n\'s terms of service and user agreement for our platform.',
        'Vendors': 'Discover trusted vendors and sellers on the Dedw3n marketplace platform.',
        'Messages': 'Access your private messages and conversations on Dedw3n.',
        'Notifications': 'View your notifications and updates from the Dedw3n community.',
        'Settings': 'Manage your Dedw3n account settings, preferences, and privacy options.',
        'Profile': 'View and edit your Dedw3n profile information and preferences.'
      };
      
      const pageDescription = descriptions[title] || descriptions['Home'];
      metaDescription.setAttribute('content', pageDescription);
    }
    
    // Update favicon to ensure it's always visible
    updateFavicon();
    
    return () => {
      // Cleanup if needed
    };
  }, [title, suffix]);
}

function updateFavicon() {
  // Ensure favicon is visible by updating existing links
  const existingFavicons = document.querySelectorAll('link[rel*="icon"]');
  existingFavicons.forEach(link => {
    const href = link.getAttribute('href');
    if (href?.includes('favicon')) {
      // Add cache busting to ensure favicon loads
      const separator = href.includes('?') ? '&' : '?';
      link.setAttribute('href', href.split('?')[0] + separator + 't=' + Date.now());
    }
  });
  
  // If no favicon links exist, add them
  if (existingFavicons.length === 0) {
    const head = document.head;
    
    const favicon = document.createElement('link');
    favicon.rel = 'icon';
    favicon.type = 'image/x-icon';
    favicon.href = '/favicon.ico';
    head.appendChild(favicon);
    
    const faviconPng = document.createElement('link');
    faviconPng.rel = 'icon';
    faviconPng.type = 'image/png';
    faviconPng.href = '/favicon.png';
    head.appendChild(faviconPng);
  }
}