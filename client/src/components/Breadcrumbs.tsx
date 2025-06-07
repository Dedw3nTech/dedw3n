import React from 'react';
import { useLocation, Link } from 'wouter';
import { ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export function Breadcrumbs() {
  const [location] = useLocation();
  const { t } = useLanguage();

  // Don't show breadcrumbs on home page
  if (location === '/') return null;

  const pathSegments = location.split('/').filter(Boolean);
  
  const breadcrumbs = [
    { href: '/', label: t('nav.home') }
  ];

  let currentPath = '';
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    
    let label = segment;
    // Map common segments to translated labels
    switch (segment) {
      case 'marketplace':
        label = t('nav.marketplace');
        break;
      case 'community':
        label = t('nav.community');
        break;
      case 'dating':
        label = t('nav.dating');
        break;
      case 'products':
        label = t('breadcrumbs.products');
        break;
      case 'vendors':
        label = t('breadcrumbs.vendors');
        break;
      case 'profile':
        label = t('breadcrumbs.profile');
        break;
      case 'settings':
        label = t('breadcrumbs.settings');
        break;
      default:
        // Capitalize first letter and replace hyphens with spaces
        label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
    }

    breadcrumbs.push({ 
      href: currentPath, 
      label: label
    });
  });

  return (
    <nav className="bg-gray-50 px-4 py-2 border-b">
      <div className="max-w-7xl mx-auto">
        <ol className="flex items-center space-x-2 text-sm">
          {breadcrumbs.map((breadcrumb, index) => (
            <li key={breadcrumb.href} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 text-gray-400 mx-2" />
              )}
              {index === breadcrumbs.length - 1 ? (
                <span className="text-gray-900 font-medium">
                  {breadcrumb.label}
                </span>
              ) : (
                <Link href={breadcrumb.href}>
                  <span className="text-blue-600 hover:text-blue-800 cursor-pointer">
                    {breadcrumb.label}
                  </span>
                </Link>
              )}
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}