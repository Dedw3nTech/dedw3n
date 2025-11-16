import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { absolutizeImageUrl } from '@/lib/buildSeoStructuredData';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  siteName?: string;
  structuredData?: any | any[];
}

export function SEOHead({
  title = "Dedw3n - Multi-Vendor Social Marketplace & Dating Platform",
  description = "Dedw3n is a multi-vendor marketplace and social platform built with modern web technologies. The platform combines e-commerce capabilities with social networking features, creating an end-to-end transactional ecosystem where users can purchase products, interact socially, and access exclusive content. Dedw3n represents a comprehensive solution for online commerce with integrated social, financial and shipping features, designed to create meaningful digital connections while facilitating secure transactions in a multi-vendor environment.",
  keywords = "marketplace, social platform, dating, e-commerce, multi-vendor, online shopping, social networking",
  image = "/assets/og-image.png",
  url,
  type = "website",
  siteName = "Dedw3n",
  structuredData
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
    
    // Update canonical link - ensure only one canonical URL exists
    // Remove all existing canonical links first to prevent conflicts
    const existingCanonicals = document.querySelectorAll('link[rel="canonical"]');
    existingCanonicals.forEach(link => link.remove());
    
    // Create new canonical link
    const canonical = document.createElement('link');
    canonical.rel = 'canonical';
    canonical.href = currentUrl;
    document.head.appendChild(canonical);
    
    console.log(`[SEO] Set canonical URL: ${currentUrl}`);
    
    // Basic meta tags
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);
    updateMetaTag('robots', 'index, follow');
    updateMetaTag('viewport', 'width=device-width, initial-scale=1');
    
    // Absolutize image URL (handles both relative and absolute URLs)
    const absoluteImageUrl = absolutizeImageUrl(image);
    
    // Open Graph tags
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:image', absoluteImageUrl, true);
    updateMetaTag('og:url', currentUrl, true);
    updateMetaTag('og:type', type, true);
    updateMetaTag('og:site_name', siteName, true);
    
    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', absoluteImageUrl);
    
    // Additional SEO tags
    updateMetaTag('author', siteName);
    updateMetaTag('language', 'en');
    updateMetaTag('rating', 'general');
    
    // Inject structured data (JSON-LD) if provided
    // Remove any existing page-specific structured data first
    const existingPageSchemas = document.querySelectorAll('script[type="application/ld+json"][data-page-schema="true"]');
    existingPageSchemas.forEach(script => script.remove());
    
    if (structuredData) {
      const schemas = Array.isArray(structuredData) ? structuredData : [structuredData];
      schemas.forEach((schema) => {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.setAttribute('data-page-schema', 'true');
        script.textContent = JSON.stringify(schema);
        document.head.appendChild(script);
      });
    }
    
  }, [title, description, keywords, image, currentUrl, type, siteName, location, structuredData]);

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
  },
  contact: {
    title: "Contact Us - Dedw3n",
    description: "For any inquiries, please do not hesitate to contact us at info@dedw3n.com.",
    keywords: "contact, support, help, inquiries, customer service"
  },
  b2c: {
    title: "B2C Marketplace - Dedw3n",
    description: "Dedw3n Ltd. The all-in-one platform to buy, sell, and connect with a community of creators and shoppers.",
    keywords: "b2c, marketplace, buy, sell, creators, shoppers, community"
  },
  partnerships: {
    title: "Partnerships - Dedw3n",
    description: "We're always looking to partner with innovative companies that share our vision of creating the best marketplace experience. If you're interested in becoming a technology partner or have a service that could benefit our platform, we'd love to hear from you.",
    keywords: "partnerships, collaboration, technology partners, innovation, marketplace"
  }
};