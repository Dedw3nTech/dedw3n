import { Link } from "wouter";
import { useEffect } from "react";

export default function NotFoundPage() {
  useEffect(() => {
    // Set proper 404 status in document title for SEO
    document.title = "404 - Page Not Found | Dedw3n";
    
    // Add canonical URL for 404 page
    const canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink) {
      canonicalLink.setAttribute('href', window.location.href);
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center px-6">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-200">404</h1>
          <h2 className="text-2xl font-semibold text-gray-800 mt-4">Page Not Found</h2>
          <p className="text-gray-600 mt-2">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <Link href="/" className="text-black text-base hover:underline">
              Go to Homepage
            </Link>
          </div>
          
          <div>
            <Link href="/products" className="text-black text-base hover:underline">
              Browse Marketplace
            </Link>
          </div>
          
          <div>
            <Link href="/wall" className="text-black text-base hover:underline">
              Visit Community
            </Link>
          </div>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p>If you believe this is an error, please <Link href="/contact" className="text-blue-600 hover:underline">contact us</Link>.</p>
        </div>
      </div>
    </div>
  );
}