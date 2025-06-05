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
          <Link href="/">
            <button className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors">
              Go to Homepage
            </button>
          </Link>
          
          <Link href="/products">
            <button className="w-full bg-gray-200 text-gray-800 py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors">
              Browse Marketplace
            </button>
          </Link>
          
          <Link href="/wall">
            <button className="w-full bg-gray-200 text-gray-800 py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors">
              Visit Community
            </button>
          </Link>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p>If you believe this is an error, please <Link href="/contact" className="text-blue-600 hover:underline">contact us</Link>.</p>
        </div>
      </div>
    </div>
  );
}