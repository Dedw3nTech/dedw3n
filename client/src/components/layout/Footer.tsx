import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-10">
      <div className="container mx-auto px-4 py-8">


        <div className="border-t border-gray-200 mt-8 pt-6 flex flex-col space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-600 mb-4 md:mb-0">© 2025 <span className="text-black font-medium">Dedw3n Ltd.</span> All rights reserved.</p>
            <div className="flex space-x-4">
              <Link href="/privacy" className="text-sm text-gray-600 hover:text-primary">Privacy Policy</Link>
              <Link href="/terms" className="text-sm text-gray-600 hover:text-primary">Terms of Service</Link>
              <Link href="/cookies" className="text-sm text-gray-600 hover:text-primary">Cookie Policy</Link>
              <Link href="/community-guidelines" className="text-sm text-gray-600 hover:text-primary">Community Guidelines</Link>
            </div>
          </div>
          
          {/* App Download Section */}
          <div className="flex flex-col md:flex-row justify-center md:justify-start items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-sm text-gray-600 mb-2 text-center md:text-left">Download our mobile app</p>
              <div className="flex space-x-3 justify-center md:justify-start">
                <a
                  href="#"
                  className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors duration-200"
                  aria-label="Download on the App Store"
                >
                  <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  <div className="text-left">
                    <div className="text-xs leading-tight">Download on the</div>
                    <div className="text-sm font-semibold leading-tight">App Store</div>
                  </div>
                </a>
                
                <a
                  href="#"
                  className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors duration-200"
                  aria-label="Get it on Google Play"
                >
                  <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                  </svg>
                  <div className="text-left">
                    <div className="text-xs leading-tight">Get it on</div>
                    <div className="text-sm font-semibold leading-tight">Google Play</div>
                  </div>
                </a>
              </div>
            </div>
          </div>
          
          <p className="text-xs text-gray-500 text-center md:text-left">
            <span className="text-black font-medium">Dedw3n Ltd.</span> is a British Company registered in England, Wales and Scotland
            under registration number <span className="font-medium">15930281</span>, whose registered office is
            situated <span className="font-medium">50 Essex Street, London, England, WC2R3JF</span>.
          </p>
          <p className="text-xs text-gray-500 text-center md:text-left">
            Our bank is registered with HSBC UK IBAN <span className="font-medium">GB79 HBUK 4003 2782 3984 94</span>
            (BIC <span className="font-medium">BUKGB4B</span>), our sole official website is <a href="https://www.dedw3n.com" className="text-gray-500 hover:underline" target="_blank" rel="noopener noreferrer">www.dedw3n.com</a>.
          </p>
        </div>
      </div>
    </footer>
  );
}
