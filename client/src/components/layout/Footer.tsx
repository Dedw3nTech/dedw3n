import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-10">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <h2 className="text-xl font-bold text-black">Dedw3n Ltd.</h2>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              The all-in-one platform to buy, sell, and connect with a community of creators and shoppers.
            </p>

          </div>

          <div>
            <h3 className="font-semibold text-gray-800 mb-4">Marketplace</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link href="/products?type=c2c" className="hover:text-primary">C2C Marketplace</Link></li>
              <li><Link href="/products?type=b2c" className="hover:text-primary">B2C Marketplace</Link></li>
              <li><Link href="/products?type=b2b" className="hover:text-primary">B2B Marketplace</Link></li>
              <li><Link href="/government" className="hover:text-primary">Governmental Services</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-800 mb-4">Community</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link href="/communities" className="hover:text-primary">Groups</Link></li>
              <li><Link href="/communities?filter=events" className="hover:text-primary">Events</Link></li>
              <li><Link href="/social" className="hover:text-primary">Creator Spotlights</Link></li>
              <li><Link href="/community-detail" className="hover:text-primary">Community Guidelines</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-800 mb-4">Help & Support</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link href="/contact" className="hover:text-primary">Contact Us</Link></li>
              <li><Link href="/faq" className="hover:text-primary">FAQ</Link></li>
              <li><Link href="/shipping" className="hover:text-primary">Shipping & Returns</Link></li>
              <li><Link href="/privacy" className="hover:text-primary">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-primary">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-8 pt-6 flex flex-col space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-600 mb-4 md:mb-0">© 2025 <span className="text-black font-medium">Dedw3n Ltd.</span> All rights reserved.</p>
            <div className="flex space-x-4">
              <Link href="/privacy" className="text-sm text-gray-600 hover:text-primary">Privacy Policy</Link>
              <Link href="/terms" className="text-sm text-gray-600 hover:text-primary">Terms of Service</Link>
              <Link href="/cookies" className="text-sm text-gray-600 hover:text-primary">Cookie Policy</Link>
            </div>
          </div>
          <p className="text-xs text-gray-500 text-center md:text-left">
            <span className="text-black font-medium">Dedw3n Ltd.</span> is a British Company registered in England, Wales and Scotland
            under registration number <span className="font-medium">15930281</span>, whose registered office is
            situated <span className="font-medium">50 Essex Street, London, England, WC2R3JF</span>.
          </p>
          <p className="text-xs text-gray-500 text-center md:text-left">
            Our bank is registered with HSBC UK IBAN <span className="font-medium">GB79 HBUK 4003 2782 3984 94</span>
            (BIC <span className="font-medium">BUKGB4B</span>), our sole official website is <a href="https://www.dedw3n.com" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">www.dedw3n.com</a>.
          </p>
        </div>
      </div>
    </footer>
  );
}
