import { useEffect } from 'react';
import { useLocation } from 'wouter';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  siteName?: string;
}

export function SEOHead({
  title = "Dedw3n - Multi-Vendor Social Marketplace & Dating Platform",
  description = "Dedw3n is a multi-vendor marketplace and social platform built with modern web technologies. The platform combines e-commerce capabilities with social networking features, creating an end-to-end transactional ecosystem where users can purchase products, interact socially, and access exclusive content. Dedw3n represents a comprehensive solution for online commerce with integrated social, financial and shipping features, designed to create meaningful digital connections while facilitating secure transactions in a multi-vendor environment.",
  keywords = "marketplace, social platform, dating, e-commerce, multi-vendor, online shopping, social networking",
  image = "/assets/og-image.png",
  url,
  type = "website",
  siteName = "Dedw3n"
}: SEOHeadProps) {
  const [location] = useLocation();
  
  // Get current URL
  const currentUrl = url || `${window.location.origin}${location}`;
  
  useEffect(() => {
    // Update document title
    document.title = title;
    
    // Update or create meta tags
    const updateMetaTag = (property: string, content: string, useProperty = false) => {
      const selector = useProperty ? `meta[property="${property}"]` : `meta[name="${property}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement;
      
      if (!meta) {
        meta = document.createElement('meta');
        if (useProperty) {
          meta.setAttribute('property', property);
        } else {
          meta.setAttribute('name', property);
        }
        document.head.appendChild(meta);
      }
      meta.content = content;
    };
    
    // Update canonical link
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = currentUrl;
    
    // Basic meta tags
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);
    updateMetaTag('robots', 'index, follow');
    updateMetaTag('viewport', 'width=device-width, initial-scale=1');
    
    // Open Graph tags
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:image', `${window.location.origin}${image}`, true);
    updateMetaTag('og:url', currentUrl, true);
    updateMetaTag('og:type', type, true);
    updateMetaTag('og:site_name', siteName, true);
    
    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', `${window.location.origin}${image}`);
    
    // Additional SEO tags
    updateMetaTag('author', siteName);
    updateMetaTag('language', 'en');
    updateMetaTag('rating', 'general');
    
  }, [title, description, keywords, image, currentUrl, type, siteName, location]);

  return null;
}

// Page-specific SEO configurations
export const seoConfigs = {
  home: {
    title: "Dedw3n - Multi-Vendor Social Marketplace & Dating Platform",
    description: "Dedw3n is a multi-vendor marketplace and social platform built with modern web technologies. The platform combines e-commerce capabilities with social networking features, creating an end-to-end transactional ecosystem where users can purchase products, interact socially, and access exclusive content. Dedw3n represents a comprehensive solution for online commerce with integrated social, financial and shipping features, designed to create meaningful digital connections while facilitating secure transactions in a multi-vendor environment.",
    keywords: "marketplace, social platform, dating, e-commerce, multi-vendor, online shopping"
  },
  products: {
    title: "Products - Dedw3n Marketplace",
    description: "Browse thousands of products from verified vendors. Shop B2C, B2B, and C2C marketplaces with secure payments and fast delivery.",
    keywords: "products, marketplace, shopping, vendors, b2c, b2b, c2c"
  },
  community: {
    title: "Community - Dedw3n Social Platform",
    description: "Join our vibrant community. Share posts, connect with friends, and engage in meaningful conversations.",
    keywords: "community, social network, posts, friends, social media"
  },
  dating: {
    title: "Dating - Find Your Perfect Match | Dedw3n",
    description: "Discover meaningful connections and find your perfect match with Dedw3n's intelligent dating platform.",
    keywords: "dating, relationships, match, love, connections"
  },
  vendors: {
    title: "Vendors - Trusted Sellers | Dedw3n",
    description: "Discover trusted vendors and sellers offering quality products with verified ratings and reviews.",
    keywords: "vendors, sellers, trusted, verified, ratings, reviews"
  },
  government: {
    title: "Government Services - Dedw3n",
    description: "Access government services and official information through our secure platform.",
    keywords: "government, services, official, secure, platform"
  }
};