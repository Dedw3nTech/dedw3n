import { useEffect } from 'react';
// Use server-served static asset path for production compatibility
const campaignImage = '/attached_assets/Pre Launch Campaingn Car Drive_1751997729010.png';

export default function Resources() {
  // Set document title on mount
  useEffect(() => {
    document.title = "Affiliate Resources - Dedw3n";
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Header Image */}
      <div className="w-full">
        <img 
          src={campaignImage}
          alt="Dedw3n Affiliate Resources" 
          className="w-full h-64 md:h-96 object-cover"
        />
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Affiliate Resources</h1>
          
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">About Dedw3n</h2>
          <p className="text-gray-700 mb-6">
            Dedw3n is a groundbreaking social marketplace platform designed to connect individuals and businesses globally through innovative technology and meaningful experiences. By integrating the strengths of social networking with robust e-commerce functionalities, we have created a unique ecosystem where users can confidently discover, connect, and engage in transactions.
          </p>
          <p className="text-gray-700 mb-8">
            Our platform fosters authentic connections within diverse communities, offering a wide range of services, from product discovery to the cultivation of meaningful relationships. With advanced matching algorithms and comprehensive safety features, we are shaping the future of social commerce.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Creative Assets</h2>
          <p className="text-gray-700 mb-8">
            For any inquiries regarding Creative Assets, please reach out to us at{' '}
            <a href="mailto:sales@dedw3n.com" className="text-blue-600 hover:text-blue-700 font-medium">
              sales@dedw3n.com
            </a>. We are happy to provide you with the necessary materials.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mb-4">How Much is the Commission?</h2>
          <p className="text-gray-700 mb-8">
            We offer a 30% commission for all users and accounts, regardless of their location. Our approach is distinctive; we do not differentiate among our users. You will receive the same commission for referring any user, irrespective of where they are based. Our affiliate program remains active for the lifetime of your referrals, or until they cease using our platform.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mb-4">How Do I Earn Commissions?</h2>
          <h3 className="text-xl font-medium text-gray-900 mb-3">Earning Commissions by Referring Users</h3>
          <h4 className="text-lg font-medium text-gray-900 mb-3">When and how are commissions disbursed?</h4>
          <p className="text-gray-700 mb-6">
            The Dedw3n Affiliate Program facilitates payments via direct deposit to your bank account or through PayPal in most countries. To initiate a withdrawal, affiliates must first accumulate a minimum balance of £1 GBP. Participants have the option to receive payments either upon reaching a specified balance or on a bi-weekly basis. It is important to note that Dedw3n credits commissions to your account balance only once a month, specifically on the 29th, for referrals made in the previous month.
          </p>

          <h3 className="text-xl font-medium text-gray-900 mb-3">Understanding the Dedw3n Affiliate Commission Timeline</h3>
          <h4 className="text-lg font-medium text-gray-900 mb-3">Step I: Locking Period</h4>
          <p className="text-gray-700 mb-4">
            Upon selection of a vendor account, your referral enters a 28-day locking period. During this timeframe, the affiliated partnership team conducts a thorough review of each referral to confirm their compliance with the eligibility criteria for commission.
          </p>
          <h4 className="text-lg font-medium text-gray-900 mb-3">Step II: Payment</h4>
          <p className="text-gray-700 mb-8">
            Once the locking period concludes, your referral becomes eligible for payment. Payments are processed the day following the end of the locking period.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Dedw3n Affiliate Program Compliance Guidelines</h2>
          <h3 className="text-xl font-medium text-gray-900 mb-3">Understanding Our Compliance Guidelines to Prevent Expiration</h3>
          <h4 className="text-lg font-medium text-gray-900 mb-3">Introduction</h4>
          <p className="text-gray-700 mb-6">
            As a Dedw3n Affiliate, your long-term success is our foremost priority. To foster a fair and transparent partnership, it is essential for all Dedw3n Affiliates to adhere to the compliance guidelines outlined in our current terms. Non-compliance may lead to the forfeiture of commissions or termination of your account, which we aim to help you avoid. This article outlines fundamental compliance rules and best practices within the Dedw3n Affiliate Program to position you for success.
          </p>

          <h3 className="text-xl font-medium text-gray-900 mb-3">Compliance Rules</h3>
          <h4 className="text-lg font-medium text-gray-900 mb-3">Prohibited Promotion Methods</h4>
          <p className="text-gray-700 mb-4">
            <strong>Trademark bidding:</strong> Many affiliate marketers utilize pay-per-click (PPC) advertising through search engines and social media platforms. However, bidding on our branded search terms constitutes a direct violation of the Dedw3n Affiliate Program. Additionally, direct bidding on misspellings of our brand name is also prohibited. To prevent suspension from our program, all affiliates must include "Dedw3n" in their negative keyword list.
          </p>
          <p className="text-gray-700 mb-4">
            <strong>I. Ad Hijacking:</strong> Dedw3n Affiliates are not permitted to replicate Dedw3n's official advertisements or to impersonate Dedw3n in any manner. Such actions are strictly forbidden under our Affiliate Program Terms and may result in immediate suspension from the program.
          </p>
          <p className="text-gray-700 mb-4">
            <strong>II. Cookie Stuffing:</strong> Dedw3n Affiliates must refrain from employing hidden cookie injections or unauthorized tracking methods. Engaging in these practices can lead to immediate removal from our program.
          </p>
          <p className="text-gray-700 mb-8">
            <strong>III.</strong> Affiliates may not use "Dedw3n" or any variations of its spelling in their promotional domain names. Such instances are deemed violations of trademark protections outlined in our Terms.
          </p>

          <h3 className="text-xl font-medium text-gray-900 mb-3">Operating as a sub-affiliate or sub-network</h3>
          <p className="text-gray-700 mb-8">
            We maintain stringent guidelines regarding our collaboration with sub-affiliate networks. Dedw3n Affiliates are prohibited from joining or operating a sub-affiliate network without explicit written permission from Dedw3n. Please be advised that until you receive formal approval for your sub-affiliate program and the individual sub-contributors, you are not permitted to operate in this capacity. Engaging in such activities without authorization will be deemed a violation of the program's terms.
          </p>

          <h3 className="text-xl font-medium text-gray-900 mb-3">Regulatory compliance guidelines</h3>
          <p className="text-gray-700 mb-2">When sharing your affiliate link, please keep the following guidelines in mind:</p>
          <p className="text-gray-700 mb-4">
            <strong>I. Disclosure Requirements:</strong> It is imperative to clearly disclose your affiliate relationship. As an affiliate, you must inform your audience that you may earn a commission for specific actions they take.
          </p>
          <p className="text-gray-700 mb-4">
            <strong>II. Avoid Misrepresentation:</strong> As a Dedw3n Affiliate, refrain from claiming that Dedw3n compensates you for building shops, delivering courses, or other activities.
          </p>
          <p className="text-gray-700 mb-8">
            <strong>III. Distinguish Your Role:</strong> Do not state or imply that your status as an affiliate indicates employment with Dedw3n.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Dedw3n Affiliate Program FAQs</h2>
          <h3 className="text-xl font-medium text-gray-900 mb-3">What is the Dedw3n Affiliate Program?</h3>
          <p className="text-gray-700 mb-6">
            The Dedw3n Affiliate Program is a complimentary initiative that allows you to monetize your audience by earning up to 30% commission for each qualified referral to Dedw3n merchants. As an affiliate, you can earn commissions when new merchants purchase a full-priced Dedw3n store plan through your unique referral link.
          </p>

          <h3 className="text-xl font-medium text-gray-900 mb-3">What is Dedw3n?</h3>
          <p className="text-gray-700 mb-6">
            Dedw3n is an innovative social marketplace platform designed to connect individuals and businesses globally through advanced technology and meaningful experiences. By merging the strengths of social networking with robust e-commerce capabilities, we have created a unique ecosystem that enables users to confidently discover, connect, and engage in transactions. Our platform promotes authentic connections within diverse communities, offering a wide array of services from product discovery to relationship building. With sophisticated matching algorithms and comprehensive safety features, we are shaping the future of social commerce.
          </p>

          <h3 className="text-xl font-medium text-gray-900 mb-3">How can I promote Dedw3n?</h3>
          <p className="text-gray-700 mb-6">
            There are numerous effective strategies to promote Dedw3n and earn commissions. Whether through creating engaging social media content, sharing Dedw3n with your merchant network, or utilizing paid advertising, you can find a method that suits your style. To assist you in this endeavour, please refer to our Dedw3n Affiliate Referral Guide, which is filled with tips, tricks, and best practices for successful promotion and maximizing your earnings.
          </p>

          <h3 className="text-xl font-medium text-gray-900 mb-3">Where can I find my Dedw3n affiliate code(s)?</h3>
          <p className="text-gray-700 mb-8">
            Your affiliate code will be sent to you via email. If you have misplaced your code, please contact us at{' '}
            <a href="mailto:sales@dedw3n.com" className="text-blue-600 hover:text-blue-700 font-medium">
              sales@dedw3n.com
            </a>, providing your name, last name, address, telephone number, and your request for your affiliate code(s).
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Commissions & Payouts</h2>
          <h3 className="text-xl font-medium text-gray-900 mb-3">How do I earn commission?</h3>
          <p className="text-gray-700 mb-6">
            As a Dedw3n Affiliate, you earn commissions when new users sign up for a full-priced Dedw3n vendor account using your unique affiliate code. Your referrals are tracked throughout the sign-up process, and commissions are earned when your referred merchants generate sales exceeding £100 per month or an average of £100 over three months. We charge a 15% fee on total sales, from which you will receive 4.5%. For example, if your affiliate generates £100 in sales, you will earn £4.50.
          </p>

          <h3 className="text-xl font-medium text-gray-900 mb-3">How do I get paid?</h3>
          <p className="text-gray-700 mb-6">
            The Dedw3n Affiliate Program offers payments via direct deposit to your bank account or through PayPal. A minimum balance of £1 GBP is required before payouts can be processed. Affiliates can choose to receive payments once their balance reaches a specific amount or on a bi-weekly basis. Please note that Dedw3n processes commissions once a month, on the 2nd, for the previous month's referrals, regardless of your withdrawal settings.
          </p>

          <h3 className="text-xl font-medium text-gray-900 mb-3">In what currency are my earned commissions paid?</h3>
          <p className="text-gray-700 mb-6">
            Commissions from the Dedw3n Affiliate Program are issued in GBP.
          </p>

          <h3 className="text-xl font-medium text-gray-900 mb-3">Is there a cap on how much I can earn as a Dedw3n Affiliate?</h3>
          <p className="text-gray-700 mb-6">
            No, there is no cap on your earnings as a Dedw3n Affiliate, allowing for limitless earning potential!
          </p>

          <h3 className="text-xl font-medium text-gray-900 mb-3">How long are my Dedw3n referrals tracked?</h3>
          <p className="text-gray-700 mb-8">
            All referrals are tracked for a 30-day period from the date of the initial click.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Support & Resources</h2>
          <h3 className="text-xl font-medium text-gray-900 mb-3">Where can I find additional Dedw3n Affiliate resources?</h3>
          <ul className="text-gray-700 mb-6 list-disc pl-6">
            <li>Dedw3n Affiliate Resource Library: Access guides and blog posts focused on effective promotion and scaling your success as an affiliate.</li>
            <li>Dedw3n Affiliate Newsletter: Stay updated on program developments, new promotional assets, and the latest news from Dedw3n.</li>
          </ul>

          <h3 className="text-xl font-medium text-gray-900 mb-3">Who can I contact for Dedw3n Affiliate support?</h3>
          <ul className="text-gray-700 mb-6 list-disc pl-6">
            <li>For general inquiries regarding your Dedw3n affiliate partnership, please reach out to us at{' '}
              <a href="mailto:sales@dedw3n.com" className="text-blue-600 hover:text-blue-700 font-medium">
                sales@dedw3n.com
              </a>.
            </li>
            <li>For questions about compliance or our Terms of Service, please contact us at{' '}
              <a href="mailto:legal@dedw3n.com" className="text-blue-600 hover:text-blue-700 font-medium">
                legal@dedw3n.com
              </a>.
            </li>
          </ul>

          <h3 className="text-xl font-medium text-gray-900 mb-3">Can I get an exclusive Dedw3n discount to promote?</h3>
          <p className="text-gray-700 mb-8">
            We do not offer discounts or coupons for affiliates to promote.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Promotional Guidelines</h2>
          <h3 className="text-xl font-medium text-gray-900 mb-3">Are there any restrictions on how I promote Dedw3n?</h3>
          <p className="text-gray-700 mb-2">Yes, certain promotional methods are strictly prohibited, including:</p>
          <ul className="text-gray-700 mb-6 list-disc pl-6">
            <li><strong>Trademark Bidding:</strong> Bidding on Dedw3n-branded keywords in paid search campaigns is not allowed. All affiliates must include "Dedw3n" as a negative keyword in all campaigns.</li>
            <li><strong>Ad Hijacking:</strong> Imitating Dedw3n's ads or deceptively redirecting traffic is prohibited.</li>
            <li><strong>Cookie Stuffing:</strong> Placing cookies without user consent to fraudulently earn commissions is not permitted.</li>
            <li><strong>Sub-Affiliate Relationships:</strong> Participating in any sub-affiliate or similar third-party relationships without written consent is not allowed.</li>
            <li><strong>Browser Extensions:</strong> Promoting Dedw3n through a browser extension requires explicit written approval from Dedw3n.</li>
          </ul>
          <p className="text-gray-700 mb-6">
            Please review our Dedw3n Affiliate Program Terms of Service for a complete list of restrictions.
          </p>

          <h3 className="text-xl font-medium text-gray-900 mb-3">As a Dedw3n Affiliate, can I engage in trademark bidding?</h3>
          <p className="text-gray-700 mb-6">
            Bidding on our branded search terms is a direct violation of the Dedw3n Affiliate Program Terms. We also do not allow bidding on misspellings of our brand name, and all affiliates must include "Dedw3n" as a negative keyword in their campaigns.
          </p>

          <h3 className="text-xl font-medium text-gray-900 mb-3">Can I use Dedw3n branding when sharing my affiliate link?</h3>
          <p className="text-gray-700 mb-6">
            Please refer to Dedw3n's brand guidelines to ensure proper use of our brand assets. Utilizing our brand assets signifies your acceptance of our Trademark Usage Guidelines, and any violations may result in the termination of your Dedw3n Affiliate account.
          </p>

          <h3 className="text-xl font-medium text-gray-900 mb-3">Am I required to disclose my affiliate partnership with Dedw3n when sharing my affiliate link?</h3>
          <p className="text-gray-700 mb-8">
            Yes, as a Dedw3n Affiliate, you must disclose that you may earn a commission from certain actions taken by your audience. It is important not to imply that your affiliate status equates to employment by Dedw3n.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Program Policies</h2>
          <h3 className="text-xl font-medium text-gray-900 mb-3">Can my Dedw3n Affiliate account be suspended or terminated?</h3>
          <p className="text-gray-700 mb-2">
            Yes, your Dedw3n Affiliate account may be terminated under specific circumstances. According to our program Terms of Service, Dedw3n reserves the right to terminate accounts without cause or prior notice. Common reasons for termination include:
          </p>
          <ul className="text-gray-700 mb-6 list-disc pl-6">
            <li>Violating the Dedw3n Affiliate Program Terms of Service</li>
            <li>Engaging in prohibited promotional methods</li>
            <li>Misrepresentation</li>
          </ul>
          <p className="text-gray-700 mb-8">
            To avoid account suspension or termination, please consult the Dedw3n Affiliate Program Compliance Guide to stay informed about our rules.
          </p>

          <p className="text-gray-700 text-center text-lg">
            For any further information please contact us at{' '}
            <a href="mailto:sales@dedw3n.com" className="text-blue-600 hover:text-blue-700 font-medium">
              sales@dedw3n.com
            </a>.
          </p>
        </div>
      </div>
    </div>
  );
}