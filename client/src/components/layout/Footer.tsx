import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-10">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <h2 className="text-xl font-bold text-gray-800">Dedw3n</h2>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              The all-in-one platform to buy, sell, and connect with a community of creators and shoppers.
            </p>

          </div>

          <div>
            <h3 className="font-semibold text-gray-800 mb-4">Marketplace</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><a href="/products?type=c2c" className="hover:text-primary">C2C Marketplace</a></li>
              <li><a href="/products?type=b2c" className="hover:text-primary">B2C Marketplace</a></li>
              <li><a href="/products?type=b2b" className="hover:text-primary">B2B Marketplace</a></li>
              <li><a href="/government" className="hover:text-primary">Governmental Services</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-800 mb-4">Community</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><a href="/communities" className="hover:text-primary">Groups</a></li>
              <li><a href="/communities?filter=events" className="hover:text-primary">Events</a></li>
              <li><a href="/social" className="hover:text-primary">Creator Spotlights</a></li>
              <li><a href="/community-detail" className="hover:text-primary">Community Guidelines</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-800 mb-4">Help & Support</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><a href="/contact" className="hover:text-primary">Contact Us</a></li>
              <li><a href="/faq" className="hover:text-primary">FAQ</a></li>
              <li><a href="/shipping" className="hover:text-primary">Shipping & Returns</a></li>
              <li><a href="/privacy" className="hover:text-primary">Privacy Policy</a></li>
              <li><a href="/terms" className="hover:text-primary">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-600 mb-4 md:mb-0">© 2025 Dedw3n. All rights reserved.</p>
          <div className="flex space-x-4">
            <a href="/privacy" className="text-sm text-gray-600 hover:text-primary">Privacy Policy</a>
            <a href="/terms" className="text-sm text-gray-600 hover:text-primary">Terms of Service</a>
            <a href="/cookies" className="text-sm text-gray-600 hover:text-primary">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
