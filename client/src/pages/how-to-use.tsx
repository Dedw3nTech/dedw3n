import { useMasterBatchTranslation } from "@/hooks/use-master-translation";
import { useMemo } from "react";

export default function HowToUsePage() {
  const pageTexts = useMemo(() => [
    "How to Use Dedw3n",
    "User Manual for www.dedw3n.com",
    "Welcome to Dedw3n - your all-in-one platform for social commerce. This comprehensive guide will help you navigate and use all features of our website effectively.",
    
    "1. Getting Started",
    "1.1 Creating an Account",
    "Visit www.dedw3n.com and click the 'Sign Up' button in the top right corner.",
    "Enter your email address, create a secure password, and fill in your profile information.",
    "Verify your email address by clicking the link sent to your inbox.",
    "Complete your profile by adding a profile picture, bio, and location.",
    
    "1.2 Logging In",
    "Click the 'Login' button and enter your credentials.",
    "If you forget your password, use the 'Forgot Password' link to reset it.",
    "Enable two-factor authentication in your settings for enhanced security.",
    
    "2. Browsing the Marketplace",
    "2.1 Finding Products",
    "Use the search bar at the top of the page to find specific products or vendors.",
    "Browse by categories from the navigation menu to discover new items.",
    "Use filters on the sidebar to narrow results by price, rating, location, and more.",
    "Click on any product to view detailed information, images, and vendor details.",
    
    "2.2 Understanding Marketplace Types",
    "B2C (Business to Consumer): Purchase products directly from verified business vendors.",
    "B2B (Business to Business): Access wholesale products and business services for your company.",
    "C2C (Consumer to Consumer): Buy and sell with other individual users in a peer-to-peer marketplace.",
    "Raw Materials: Find bulk raw materials and commodities for your business needs.",
    "RQST: Post product requests and let vendors come to you with customized offers.",
    
    "3. Making a Purchase",
    "3.1 Adding Items to Cart",
    "Click the 'Add to Cart' button on any product page.",
    "Select product variations (size, color, quantity) as needed.",
    "View your cart by clicking the shopping cart icon in the top navigation.",
    
    "3.2 Checkout Process",
    "Review all items in your cart before proceeding.",
    "Click 'Proceed to Checkout' when ready to complete your purchase.",
    "Enter your shipping address and contact information.",
    "Choose your preferred delivery method and speed.",
    "Select your payment method and complete the transaction.",
    
    "3.3 Order Tracking",
    "Track your order status from your account dashboard under 'My Orders'.",
    "Receive email notifications about order status updates.",
    "View estimated delivery dates and shipping information.",
    
    "4. Becoming a Vendor",
    "4.1 Vendor Registration",
    "Click on 'Become a Vendor' from the user menu.",
    "Choose between Private Vendor (individual) or Business Vendor account.",
    "Fill in your business information, including store name and description.",
    "Upload required verification documents (business license, tax ID, etc.).",
    "Wait for admin approval (typically 2-5 business days).",
    
    "4.2 Managing Your Store",
    "Once approved, access your vendor dashboard to manage your store.",
    "Upload products with detailed descriptions, images, and pricing.",
    "Set inventory levels and shipping options for each product.",
    "Monitor sales, orders, and customer reviews.",
    "Respond to customer inquiries through the messaging system.",
    
    "5. Social Features",
    "5.1 Creating Content",
    "Create posts to share updates, images, and videos with your network.",
    "Use hashtags to increase discoverability of your content.",
    "Tag other users and locations in your posts.",
    
    "5.2 Networking",
    "Follow other users to see their content in your feed.",
    "Like, comment, and share posts to engage with the community.",
    "Send direct messages to connect with other users and vendors.",
    "Join communities based on your interests and participate in discussions.",
    
    "6. Payment Options",
    "6.1 Accepted Payment Methods",
    "Credit cards (Visa, Mastercard, American Express)",
    "Debit cards",
    "Mobile money payments",
    "PayPal and other digital wallets",
    "Gift cards (can be purchased on our site)",
    "Business accounts can access invoice payment options",
    
    "6.2 Payment Security",
    "All transactions are secured with SSL encryption.",
    "We never store your full credit card details.",
    "Payment information is processed through secure, certified payment gateways.",
    
    "7. Managing Your Account",
    "7.1 Account Settings",
    "Access your account settings from the user menu in the top right corner.",
    "Update your profile information, email address, and password.",
    "Manage shipping addresses and payment methods.",
    "Set your communication preferences and notification settings.",
    
    "7.2 Privacy Settings",
    "Control who can see your profile and posts.",
    "Manage data sharing preferences.",
    "Review and update your privacy settings regularly.",
    
    "8. Returns & Exchanges",
    "8.1 Return Policy",
    "Most items can be returned within 30 days of delivery.",
    "Items must be unused, in original packaging, with all tags attached.",
    "Some items (personalized, perishable) may not be eligible for return.",
    
    "8.2 Return Process",
    "Visit your order history and select the item you wish to return.",
    "Select the reason for return and follow the on-screen instructions.",
    "Print the prepaid return label provided.",
    "Package the item securely and drop it off at an authorized shipping location.",
    "Refunds are processed within 5-10 business days after we receive your return.",
    
    "8.3 Exchanges",
    "Select the exchange option when initiating your return.",
    "Choose your preferred replacement item (size, color, style).",
    "We will ship the replacement once we receive your return.",
    
    "9. Safety & Security",
    "9.1 Account Security",
    "Never share your password with anyone.",
    "Enable two-factor authentication for added security.",
    "Use a strong, unique password for your Dedw3n account.",
    "Log out from shared or public devices.",
    
    "9.2 Safe Shopping",
    "Review vendor ratings and reviews before making purchases.",
    "Be cautious of deals that seem too good to be true.",
    "Report suspicious activity or listings to our support team immediately.",
    "Read product descriptions carefully before purchasing.",
    
    "9.3 Privacy",
    "Read our Privacy Policy and Terms of Service for detailed information.",
    "Control your data sharing preferences in account settings.",
    "Report privacy concerns to our support team.",
    
    "10. Mobile App",
    "10.1 Download the App",
    "Download the Dedw3n mobile app from the App Store (iOS) or Google Play (Android).",
    "Search for 'Dedw3n' in your device's app store.",
    "Install the app and sign in with your existing account credentials.",
    
    "10.2 Mobile Features",
    "Access all website features on your mobile device.",
    "Receive push notifications for orders, messages, and updates.",
    "Use your device's camera to search for similar products.",
    "Enjoy optimized mobile shopping experience on-the-go.",
    
    "11. Customer Support",
    "11.1 Getting Help",
    "Visit our FAQ page for answers to common questions.",
    "Contact our support team via the Contact Us page.",
    "Use the live chat feature for immediate assistance during business hours.",
    "Email support@dedw3n.com for detailed inquiries.",
    
    "11.2 Community Help",
    "Join our community forums to get help from other users.",
    "Follow us on social media for tips, updates, and announcements.",
    "Subscribe to our newsletter for exclusive offers and guides.",
    
    "12. Tips for Best Experience",
    "Keep your profile information updated for better recommendations.",
    "Enable notifications to stay informed about orders and messages.",
    "Leave reviews for products and vendors to help the community.",
    "Use the wishlist feature to save items for later.",
    "Check the deals and promotions page regularly for special offers.",
    "Participate in community events and discussions.",
    
    "Contact Information",
    "Website: www.dedw3n.com",
    "Email: support@dedw3n.com",
    "Business Hours: Monday - Friday, 9:00 AM - 6:00 PM GMT",
    
    "Last Updated: November 2025",
    "Version: 1.0",
  ], []);

  const { translations } = useMasterBatchTranslation(pageTexts);
  
  const [
    titleText,
    subtitleText,
    introText,
    
    section1Title,
    section1_1Title,
    section1_1_1,
    section1_1_2,
    section1_1_3,
    section1_1_4,
    
    section1_2Title,
    section1_2_1,
    section1_2_2,
    section1_2_3,
    
    section2Title,
    section2_1Title,
    section2_1_1,
    section2_1_2,
    section2_1_3,
    section2_1_4,
    
    section2_2Title,
    section2_2_1,
    section2_2_2,
    section2_2_3,
    section2_2_4,
    section2_2_5,
    
    section3Title,
    section3_1Title,
    section3_1_1,
    section3_1_2,
    section3_1_3,
    
    section3_2Title,
    section3_2_1,
    section3_2_2,
    section3_2_3,
    section3_2_4,
    section3_2_5,
    
    section3_3Title,
    section3_3_1,
    section3_3_2,
    section3_3_3,
    
    section4Title,
    section4_1Title,
    section4_1_1,
    section4_1_2,
    section4_1_3,
    section4_1_4,
    section4_1_5,
    
    section4_2Title,
    section4_2_1,
    section4_2_2,
    section4_2_3,
    section4_2_4,
    section4_2_5,
    
    section5Title,
    section5_1Title,
    section5_1_1,
    section5_1_2,
    section5_1_3,
    
    section5_2Title,
    section5_2_1,
    section5_2_2,
    section5_2_3,
    section5_2_4,
    
    section6Title,
    section6_1Title,
    section6_1_1,
    section6_1_2,
    section6_1_3,
    section6_1_4,
    section6_1_5,
    section6_1_6,
    
    section6_2Title,
    section6_2_1,
    section6_2_2,
    section6_2_3,
    
    section7Title,
    section7_1Title,
    section7_1_1,
    section7_1_2,
    section7_1_3,
    section7_1_4,
    
    section7_2Title,
    section7_2_1,
    section7_2_2,
    section7_2_3,
    
    section8Title,
    section8_1Title,
    section8_1_1,
    section8_1_2,
    section8_1_3,
    
    section8_2Title,
    section8_2_1,
    section8_2_2,
    section8_2_3,
    section8_2_4,
    section8_2_5,
    
    section8_3Title,
    section8_3_1,
    section8_3_2,
    section8_3_3,
    
    section9Title,
    section9_1Title,
    section9_1_1,
    section9_1_2,
    section9_1_3,
    section9_1_4,
    
    section9_2Title,
    section9_2_1,
    section9_2_2,
    section9_2_3,
    section9_2_4,
    
    section9_3Title,
    section9_3_1,
    section9_3_2,
    section9_3_3,
    
    section10Title,
    section10_1Title,
    section10_1_1,
    section10_1_2,
    section10_1_3,
    
    section10_2Title,
    section10_2_1,
    section10_2_2,
    section10_2_3,
    section10_2_4,
    
    section11Title,
    section11_1Title,
    section11_1_1,
    section11_1_2,
    section11_1_3,
    section11_1_4,
    
    section11_2Title,
    section11_2_1,
    section11_2_2,
    section11_2_3,
    
    section12Title,
    section12_1,
    section12_2,
    section12_3,
    section12_4,
    section12_5,
    section12_6,
    
    contactTitle,
    contact1,
    contact2,
    contact3,
    
    lastUpdated,
    version,
  ] = translations || pageTexts;

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-6 py-10 max-w-4xl">
        <div className="mb-10 pb-6 border-b border-gray-300">
          <h1 className="text-3xl font-bold text-black mb-2" data-testid="text-title">
            {titleText}
          </h1>
          <p className="text-lg text-gray-700 mb-3">{subtitleText}</p>
          <p className="text-base text-gray-600 leading-relaxed">{introText}</p>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-black mb-4">{section1Title}</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-black mb-2">{section1_1Title}</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li>{section1_1_1}</li>
                  <li>{section1_1_2}</li>
                  <li>{section1_1_3}</li>
                  <li>{section1_1_4}</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-black mb-2">{section1_2Title}</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li>{section1_2_1}</li>
                  <li>{section1_2_2}</li>
                  <li>{section1_2_3}</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-black mb-4">{section2Title}</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-black mb-2">{section2_1Title}</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li>{section2_1_1}</li>
                  <li>{section2_1_2}</li>
                  <li>{section2_1_3}</li>
                  <li>{section2_1_4}</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-black mb-2">{section2_2Title}</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li>{section2_2_1}</li>
                  <li>{section2_2_2}</li>
                  <li>{section2_2_3}</li>
                  <li>{section2_2_4}</li>
                  <li>{section2_2_5}</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-black mb-4">{section3Title}</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-black mb-2">{section3_1Title}</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li>{section3_1_1}</li>
                  <li>{section3_1_2}</li>
                  <li>{section3_1_3}</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-black mb-2">{section3_2Title}</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li>{section3_2_1}</li>
                  <li>{section3_2_2}</li>
                  <li>{section3_2_3}</li>
                  <li>{section3_2_4}</li>
                  <li>{section3_2_5}</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-black mb-2">{section3_3Title}</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li>{section3_3_1}</li>
                  <li>{section3_3_2}</li>
                  <li>{section3_3_3}</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-black mb-4">{section4Title}</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-black mb-2">{section4_1Title}</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li>{section4_1_1}</li>
                  <li>{section4_1_2}</li>
                  <li>{section4_1_3}</li>
                  <li>{section4_1_4}</li>
                  <li>{section4_1_5}</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-black mb-2">{section4_2Title}</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li>{section4_2_1}</li>
                  <li>{section4_2_2}</li>
                  <li>{section4_2_3}</li>
                  <li>{section4_2_4}</li>
                  <li>{section4_2_5}</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-black mb-4">{section5Title}</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-black mb-2">{section5_1Title}</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li>{section5_1_1}</li>
                  <li>{section5_1_2}</li>
                  <li>{section5_1_3}</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-black mb-2">{section5_2Title}</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li>{section5_2_1}</li>
                  <li>{section5_2_2}</li>
                  <li>{section5_2_3}</li>
                  <li>{section5_2_4}</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-black mb-4">{section6Title}</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-black mb-2">{section6_1Title}</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li>{section6_1_1}</li>
                  <li>{section6_1_2}</li>
                  <li>{section6_1_3}</li>
                  <li>{section6_1_4}</li>
                  <li>{section6_1_5}</li>
                  <li>{section6_1_6}</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-black mb-2">{section6_2Title}</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li>{section6_2_1}</li>
                  <li>{section6_2_2}</li>
                  <li>{section6_2_3}</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-black mb-4">{section7Title}</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-black mb-2">{section7_1Title}</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li>{section7_1_1}</li>
                  <li>{section7_1_2}</li>
                  <li>{section7_1_3}</li>
                  <li>{section7_1_4}</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-black mb-2">{section7_2Title}</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li>{section7_2_1}</li>
                  <li>{section7_2_2}</li>
                  <li>{section7_2_3}</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-black mb-4">{section8Title}</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-black mb-2">{section8_1Title}</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li>{section8_1_1}</li>
                  <li>{section8_1_2}</li>
                  <li>{section8_1_3}</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-black mb-2">{section8_2Title}</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li>{section8_2_1}</li>
                  <li>{section8_2_2}</li>
                  <li>{section8_2_3}</li>
                  <li>{section8_2_4}</li>
                  <li>{section8_2_5}</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-black mb-2">{section8_3Title}</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li>{section8_3_1}</li>
                  <li>{section8_3_2}</li>
                  <li>{section8_3_3}</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-black mb-4">{section9Title}</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-black mb-2">{section9_1Title}</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li>{section9_1_1}</li>
                  <li>{section9_1_2}</li>
                  <li>{section9_1_3}</li>
                  <li>{section9_1_4}</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-black mb-2">{section9_2Title}</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li>{section9_2_1}</li>
                  <li>{section9_2_2}</li>
                  <li>{section9_2_3}</li>
                  <li>{section9_2_4}</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-black mb-2">{section9_3Title}</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li>{section9_3_1}</li>
                  <li>{section9_3_2}</li>
                  <li>{section9_3_3}</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-black mb-4">{section10Title}</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-black mb-2">{section10_1Title}</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li>{section10_1_1}</li>
                  <li>{section10_1_2}</li>
                  <li>{section10_1_3}</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-black mb-2">{section10_2Title}</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li>{section10_2_1}</li>
                  <li>{section10_2_2}</li>
                  <li>{section10_2_3}</li>
                  <li>{section10_2_4}</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-black mb-4">{section11Title}</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-black mb-2">{section11_1Title}</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li>{section11_1_1}</li>
                  <li>{section11_1_2}</li>
                  <li>{section11_1_3}</li>
                  <li>{section11_1_4}</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-black mb-2">{section11_2Title}</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li>{section11_2_1}</li>
                  <li>{section11_2_2}</li>
                  <li>{section11_2_3}</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-black mb-4">{section12Title}</h2>
            <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
              <li>{section12_1}</li>
              <li>{section12_2}</li>
              <li>{section12_3}</li>
              <li>{section12_4}</li>
              <li>{section12_5}</li>
              <li>{section12_6}</li>
            </ul>
          </section>

          <section className="pt-6 border-t border-gray-300">
            <h2 className="text-2xl font-bold text-black mb-4">{contactTitle}</h2>
            <div className="space-y-1 text-gray-700">
              <p>{contact1}</p>
              <p>{contact2}</p>
              <p>{contact3}</p>
            </div>
          </section>

          <div className="pt-6 border-t border-gray-300 text-sm text-gray-600">
            <p>{lastUpdated}</p>
            <p>{version}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
