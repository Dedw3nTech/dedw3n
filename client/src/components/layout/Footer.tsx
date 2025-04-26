import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-10">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <i className="ri-store-2-line text-primary text-2xl"></i>
              <h2 className="text-xl font-bold text-gray-800">SocialMarket</h2>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              The all-in-one platform to buy, sell, and connect with a community of creators and shoppers.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-500 hover:text-primary">
                <i className="ri-facebook-fill text-xl"></i>
              </a>
              <a href="#" className="text-gray-500 hover:text-primary">
                <i className="ri-twitter-fill text-xl"></i>
              </a>
              <a href="#" className="text-gray-500 hover:text-primary">
                <i className="ri-instagram-fill text-xl"></i>
              </a>
              <a href="#" className="text-gray-500 hover:text-primary">
                <i className="ri-pinterest-fill text-xl"></i>
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-800 mb-4">Marketplace</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link href="#" className="hover:text-primary">All Categories</Link></li>
              <li><Link href="#" className="hover:text-primary">Featured Products</Link></li>
              <li><Link href="#" className="hover:text-primary">Popular Vendors</Link></li>
              <li><Link href="#" className="hover:text-primary">Deals & Discounts</Link></li>
              <li><Link href="#" className="hover:text-primary">Gift Cards</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-800 mb-4">Community</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link href="#" className="hover:text-primary">Groups</Link></li>
              <li><Link href="#" className="hover:text-primary">Events</Link></li>
              <li><Link href="#" className="hover:text-primary">Creator Spotlights</Link></li>
              <li><Link href="#" className="hover:text-primary">Community Guidelines</Link></li>
              <li><Link href="#" className="hover:text-primary">Creator Resources</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-800 mb-4">Help & Support</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link href="#" className="hover:text-primary">Contact Us</Link></li>
              <li><Link href="#" className="hover:text-primary">FAQ</Link></li>
              <li><Link href="#" className="hover:text-primary">Shipping & Returns</Link></li>
              <li><Link href="#" className="hover:text-primary">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-primary">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-600 mb-4 md:mb-0">© 2023 SocialMarket. All rights reserved.</p>
          <div className="flex space-x-4">
            <Link href="#" className="text-sm text-gray-600 hover:text-primary">Privacy Policy</Link>
            <Link href="#" className="text-sm text-gray-600 hover:text-primary">Terms of Service</Link>
            <Link href="#" className="text-sm text-gray-600 hover:text-primary">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
