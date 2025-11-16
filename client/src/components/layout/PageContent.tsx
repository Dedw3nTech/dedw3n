import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Container } from "@/components/ui/container";
import { format } from "date-fns";
import { Link } from "wouter";
import { useMasterBatchTranslation } from "@/hooks/use-master-translation";

interface PageContentProps {
  pageId: string;
  showLastUpdated?: boolean;
}

interface PageData {
  id: string;
  title: string;
  content: string;
  lastUpdated: Date;
}

// Component for rendering Dedw3n Education Policy content
function EducationPolicyContent() {
  const educationPolicyTexts = [
    "Dedw3n Learn: Terms of Service",
    "Last Updated: April 2025",
    "The following terms of service (the \"Terms\") govern your access to and use of the Learn from Dedw3n platform (\"Learn from Dedw3n\" or the \"Site\"), which is owned and operated by Dedw3n International Ltd. (\"Dedw3n,\" also referred to as \"we\" or \"our\").",
    "Please thoroughly review these Terms prior to utilizing Learn from Dedw3n. By accessing or using Learn from Dedw3n, you acknowledge and consent to be legally bound by these Terms and our Privacy Policy, accessible here, which is incorporated by reference. Should you disagree with these Terms or the Privacy Policy, you are required to cease access or use of the Site. These Terms supplement Dedw3n.com's general terms of service, accessible here (the \"Terms of Service\"), which also apply to your access and use of Learn from Dedw3n.",
    "Learn from Dedw3n acts as a digital marketplace for online courses across various disciplines (the \"Courses\"), available exclusively to Dedw3n users. All Courses are developed and delivered by independent instructors (the \"Instructors\"). Dedw3n disclaims responsibility for the content, quality, or academic level of the Courses and does not assure the accuracy or completeness of any information provided by the Instructors. We recommend users to employ our rating system for evaluating the quality of each Course.",
    "As a service provider, we do not inspect Courses for legal compliance or assess the legality of their content. Your participation in any Course and its associated materials is at your own risk, and you accept full responsibility for any actions taken post-engagement with a Course.",
    "1. Copyright Infringement",
    "Instructors affirm that all content included in their Courses is original and does not violate any third-party rights, including copyrights, trademarks, or service marks. Where music or stock footage is utilized, Instructors must confirm possession of a valid license for such media.",
    "Dedw3n will respond to precise and complete notices of alleged copyright or trademark infringement. Our Intellectual Property claims procedures can be reviewed here.",
    "2. Third-Party Websites",
    "Courses on Learn from Dedw3n may include links to third-party websites not owned or controlled by Dedw3n. Accessing third-party websites is done at your own risk. Dedw3n disclaims liability for any damage or loss incurred from using or relying on information, materials, products, or services obtained through third-party websites. Users should thoroughly review the terms and conditions of each third-party service provider.",
    "3. License",
    "Upon registration for a Course, Instructors grant you a restricted, non-transferable right to view the Course and its related materials for personal, non-commercial use. You are prohibited from distributing, transmitting, assigning, selling, broadcasting, renting, sharing, modifying, creating derivative works of, or otherwise transferring or utilizing the Course.",
    "4. Payment",
    "Courses require advance payment, exclusively via credit card. For additional payment terms, refer to the purchasing section in our Terms of Service here. Applicable indirect taxes (such as sales tax, VAT, or GST) may apply based on your residency and relevant laws.",
    "5. Refunds",
    "If dissatisfied with a Course, contact us via the Contact Us page. Refund requests are accepted within 30 days of purchase.",
    "Please Note: Completion of a Course disqualifies you from a refund. Users with repeated purchase and refund behavior may face suspension for abusing the refund policy.",
    "Refunds generally process within 7-12 business days, although they may take up to 30 days to reflect in your account. If over 10 business days have passed since processing, contact your bank directly for updates.",
    "For programs with multiple Courses, refunds are only available for incomplete Courses, calculated as the program's total price minus the completed Courses' full price.",
    "6. Promo Codes",
    "We may offer promo codes for Course and program discounts. To apply a promo code, enter it at checkout. Promo codes are non-combinable with other promotions, subject to expiration, non-refundable, and hold no cash value. Dedw3n reserves the right to modify or cancel promo codes at any time.",
    "7. Course Badges and Benefits",
    "Upon successful Course completion, a badge will display on your Seller page. This badge enhances visibility in the marketplace, as Course completion contributes to professional skills.",
    "\"Successful Completion\" involves viewing all video content, completing all exercises, and independently finishing the final exam and/or quizzes.",
    "8. Disclaimer of Warranties",
    "THE SITE AND ITS CONTENT ARE PROVIDED \"AS IS\" AND \"AS AVAILABLE,\" WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED. Dedw3n MAKES NO WARRANTIES OR REPRESENTATIONS REGARDING THE COMPLETENESS, SECURITY, RELIABILITY, QUALITY, ACCURACY, OR AVAILABILITY OF THE WEBSITE. THIS DISCLAIMER DOES NOT AFFECT WARRANTIES THAT CANNOT BE EXCLUDED OR LIMITED UNDER APPLICABLE LAW.",
    "9. Limitation on Liability",
    "IN NO EVENT WILL Dedw3n, ITS AFFILIATES, OR THEIR LICENSORS, SERVICE PROVIDERS, EMPLOYEES, AGENTS, OFFICERS, OR DIRECTORS BE LIABLE FOR DAMAGES ARISING FROM YOUR USE OR INABILITY TO USE THE SITE, ANY LINKED WEBSITES, SITE CONTENT, OR COURSES OBTAINED THROUGH THE SITE OR OTHER WEBSITES. THIS INCLUDES DIRECT, INDIRECT, SPECIAL, INCIDENTAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, EVEN IF FORESEEABLE.",
    "THIS LIMITATION DOES NOT AFFECT LIABILITY THAT CANNOT BE EXCLUDED OR LIMITED UNDER APPLICABLE LAW.",
    "We reserve the right to suspend your account for any fraudulent or inappropriate activity. Users suspended for Terms of Service violations will lose access to Learn from Dedw3n and their Courses, with refund requests denied.",
    "We may amend these Terms periodically. New versions will be available on this page. Continued use of the Site post-amendment constitutes acceptance of the updated Terms.",
    "We reserve the right to close or suspend the Site and/or Learn from Dedw3n platform (including badges and related benefits) at any time without notice.",
    "For any inquiries, please contact us at legal@dedw3n.com."
  ];

  const { translations, isLoading } = useMasterBatchTranslation(educationPolicyTexts, 'high');

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    );
  }

  const t = (index: number) => translations[index] || educationPolicyTexts[index];

  return (
    <div className="prose prose-lg max-w-none text-gray-700 mb-8">
      <p className="text-sm text-gray-600 mb-6">{t(1)}</p>
      <p className="mb-6">{t(2)}</p>
      <p className="mb-6">{t(3)}</p>
      <p className="mb-6">{t(4)}</p>
      <p className="mb-6">{t(5)}</p>
      
      <h3 className="text-xl font-semibold text-gray-800 mb-4">{t(6)}</h3>
      <p className="mb-6">{t(7)}</p>
      <p className="mb-6">{t(8)}</p>
      
      <h3 className="text-xl font-semibold text-gray-800 mb-4">{t(9)}</h3>
      <p className="mb-6">{t(10)}</p>
      
      <h3 className="text-xl font-semibold text-gray-800 mb-4">{t(11)}</h3>
      <p className="mb-6">{t(12)}</p>
      
      <h3 className="text-xl font-semibold text-gray-800 mb-4">{t(13)}</h3>
      <p className="mb-6">{t(14)}</p>
      
      <h3 className="text-xl font-semibold text-gray-800 mb-4">{t(15)}</h3>
      <p className="mb-6">{t(16)}</p>
      <p className="mb-6">{t(17)}</p>
      <p className="mb-6">{t(18)}</p>
      <p className="mb-6">{t(19)}</p>
      
      <h3 className="text-xl font-semibold text-gray-800 mb-4">{t(20)}</h3>
      <p className="mb-6">{t(21)}</p>
      <p className="mb-6">{t(22)}</p>
      
      <h3 className="text-xl font-semibold text-gray-800 mb-4">{t(23)}</h3>
      <p className="mb-6">{t(24)}</p>
      <p className="mb-6">{t(25)}</p>
      
      <h3 className="text-xl font-semibold text-gray-800 mb-4">{t(26)}</h3>
      <p className="mb-6">{t(27)}</p>
      
      <h3 className="text-xl font-semibold text-gray-800 mb-4">{t(28)}</h3>
      <p className="mb-6">{t(29)}</p>
      
      <p className="mb-6">{t(30)}</p>
      <p className="mb-6">{t(31)}</p>
      <p className="mb-6">{t(32)}</p>
      
      <div className="mt-8 pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-600">{t(33)}</p>
      </div>
    </div>
  );
}

// Component for rendering translated Cookie Policy content
function CookiePolicyContent() {
  // All the text content from the cookies policy page
  const cookiePolicyTexts = [
    "Cookie Policy",
    "Thank you for choosing our platform!",
    "When you utilize the Dedw3n Website or App (collectively referred to as the \"Platform\"), we may automatically store and/or access information on your device through cookies and similar technologies. This data processing is essential for the operation of the Platform, enabling authentication, personalization, and security features. This Cookie Policy outlines what cookies are, how we use them, and how you can control them.",
    "For general information regarding Dedw3n's data practices, please refer to our Privacy Policy. The capitalized terms used in this Cookie Policy carry the same meaning as those in the Privacy Policy.",
    "What Are Cookies?",
    "Cookies are small text files that your browser stores on your device (e.g., computer, mobile phone, tablet) while browsing websites. Other technologies, such as data storage methods on your web browser or device, identifiers linked to your device, and various software solutions, serve similar purposes. These technologies are commonly employed to enhance website functionality and efficiency. In this Cookie Policy, we refer to all these technologies collectively as \"cookies.\"",
    "The cookies we utilize are essential for the Platform's functionality and performance. This includes cookies that allow you to register for protected areas of the Platform, make purchases, utilize electronic payment systems, and maintain your session while logged in. Some cookies are deleted from your device after your browsing session ends (session cookies), while others persist to remember your preferences. The information stored in our cookies is used solely to provide the requested services and functionalities.",
    "Why Do We Use Cookies?",
    "We employ cookies to:",
    "Ensure the Platform operates as expected and securely",
    "Maintain your login session and authentication state",
    "Protect against security threats and fraudulent activities",
    "Remember your language and currency preferences",
    "Store your privacy and cookie consent choices",
    "Enable core platform features like messaging and notifications",
    "Enhance the speed and performance of the Platform",
    "Ensure security, prevent fraud, and debug systems to maintain proper functionality",
    "What Information Do Cookies Facilitate Collecting?",
    "The information collected through cookies includes unique identification tokens to enable authentication and features, as well as essential details about your browsing session, such as session identifiers, login state, language preferences, and security tokens.",
    "How Can I Manage Cookies?",
    "Upon your first visit to the Platform, you will see a cookie consent notice allowing you to review and accept our cookie usage. You can modify your cookie settings at any time in the App by navigating to Profile ▸ Cookie Settings or by accessing Cookie Settings at the bottom of our website.",
    "You may configure your browser to decline cookies or to request permission before accepting them. Please note that deleting or disabling necessary cookies will prevent you from accessing certain areas or features of our Platform, including account login and secure transactions. For more information on adjusting your browser settings, please visit www.aboutcookies.org or www.allaboutcookies.org.",
    "If you use multiple devices to access our Platform, it is essential to ensure that each browser on each device is configured according to your cookie preferences.",
    "What Cookies Do We Use?",
    "We utilize first-party cookies (set directly by Dedw3n) to provide essential platform functionality and optional preference cookies to enhance your experience. We do not use commercial third-party tracking cookies for advertising or analytics purposes.",
    "Strictly Necessary Cookies",
    "These cookies are essential for website functionality and cannot be disabled in our systems. They are set in response to actions you take, such as logging in, setting privacy preferences, or making purchases. Without these cookies, our Platform cannot function properly.",
    "Essential cookies we use include:",
    "connect.sid - Session management and authentication",
    "dedwen_session - User session state and login tracking",
    "dedwen_cookie_consent - Stores your cookie consent preferences",
    "dedwen_first_visit - Tracks if you are a first-time visitor for consent purposes",
    "CSRF tokens - Security cookies that protect against cross-site request forgery attacks",
    "Authentication tokens - Secure tokens for maintaining your logged-in state",
    "Functional Cookies (Optional - User Consent Required)",
    "These cookies enable enhanced functionality and personalization on the Platform. They remember your preferences and settings to provide a more personalized experience. You can control these through your cookie preferences.",
    "Functional cookies we use include:",
    "Language preference - Stores your selected language for the interface",
    "Currency preference - Remembers your chosen currency for pricing",
    "Theme preference - Stores your dark/light mode selection",
    "UI preference - Remembers your interface customization settings",
    "Privacy-First Approach",
    "Dedw3n is committed to protecting your privacy. We do not use commercial third-party tracking cookies, advertising cookies, or analytics cookies from external providers. Our platform operates on a privacy-first principle, ensuring that your data is not shared with advertising networks or analytics companies for profiling or behavioral tracking purposes.",
    "Cookie Consent Management System",
    "The platform implements a comprehensive GDPR/CCPA compliant cookie management system with the following features:",
    "Global Privacy Control (GPC) Support - Automatically respects browser privacy signals and honors your privacy preferences",
    "Transparent Control - Clear information about each cookie category we use",
    "California Privacy Rights - Full compliance with CCPA requirements for California residents",
    "Easy Management - Simple controls to adjust your cookie preferences at any time",
    "Consent Withdrawal - Ability to withdraw consent and have preference cookies removed",
    "Data Collection Purposes",
    "Our cookies facilitate collecting only essential information necessary for platform operation:",
    "Session management and authentication state",
    "User preferences (language, currency, theme)",
    "Security and fraud prevention data",
    "Essential platform functionality metrics",
    "User Control Options",
    "You have full control over your cookie preferences. You can:",
    "Accept necessary cookies only (required for platform functionality)",
    "Enable optional functional cookies for enhanced personalization",
    "Withdraw consent for functional cookies at any time",
    "Access detailed information about each cookie we use",
    "The platform provides transparent cookie management with clear information about our privacy-first approach and respects your privacy choices through our advanced consent management system.",
    "Contact Us",
    "For any inquiries about our cookie usage or privacy practices, please contact us at legal@dedw3n.com.",
    "Last updated:"
  ];

  const { translations, isLoading } = useMasterBatchTranslation(cookiePolicyTexts, 'high');

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    );
  }

  const t = (index: number) => translations[index] || cookiePolicyTexts[index];

  return (
    <div className="prose prose-lg max-w-none text-gray-700 mb-8">
      <p className="mb-6">{t(1)}</p>
      
      <p className="mb-6">{t(2)}</p>
      
      <p className="mb-6">{t(3)}</p>
      
      <h3 className="text-xl font-semibold text-gray-800 mb-4">{t(4)}</h3>
      <p className="mb-6">{t(5)}</p>
      
      <p className="mb-6">{t(6)}</p>
      
      <h3 className="text-xl font-semibold text-gray-800 mb-4">{t(7)}</h3>
      <p className="mb-4">{t(8)}</p>
      <ul className="list-disc pl-6 mb-6 space-y-2">
        <li>{t(9)}</li>
        <li>{t(10)}</li>
        <li>{t(11)}</li>
        <li>{t(12)}</li>
        <li>{t(13)}</li>
        <li>{t(14)}</li>
        <li>{t(15)}</li>
        <li>{t(16)}</li>
      </ul>
      
      <h3 className="text-xl font-semibold text-gray-800 mb-4">{t(17)}</h3>
      <p className="mb-6">{t(18)}</p>
      
      <h3 className="text-xl font-semibold text-gray-800 mb-4">{t(19)}</h3>
      <p className="mb-6">{t(20)}</p>
      
      <p className="mb-6">{t(21)}</p>
      
      <p className="mb-6">{t(22)}</p>
      
      <h3 className="text-xl font-semibold text-gray-800 mb-4">{t(23)}</h3>
      <p className="mb-6">{t(24)}</p>
      
      <h4 className="text-lg font-medium text-gray-700 mb-3">{t(25)}</h4>
      <p className="mb-6">{t(26)}</p>
      
      <p className="mb-4">{t(27)}</p>
      <ul className="list-disc pl-6 mb-6 space-y-2">
        <li><strong>{t(28)}</strong></li>
        <li><strong>{t(29)}</strong></li>
        <li><strong>{t(30)}</strong></li>
        <li><strong>{t(31)}</strong></li>
        <li><strong>{t(32)}</strong></li>
        <li><strong>{t(33)}</strong></li>
      </ul>
      
      <h4 className="text-lg font-medium text-gray-700 mb-3">{t(34)}</h4>
      <p className="mb-6">{t(35)}</p>
      
      <p className="mb-4">{t(36)}</p>
      <ul className="list-disc pl-6 mb-6 space-y-2">
        <li><strong>{t(37)}</strong></li>
        <li><strong>{t(38)}</strong></li>
        <li><strong>{t(39)}</strong></li>
        <li><strong>{t(40)}</strong></li>
      </ul>
      
      <h4 className="text-lg font-medium text-gray-700 mb-3">{t(41)}</h4>
      <p className="mb-6">{t(42)}</p>
      
      <h4 className="text-lg font-medium text-gray-700 mb-3">{t(43)}</h4>
      <p className="mb-6">{t(44)}</p>
      <ul className="list-disc pl-6 mb-6 space-y-2">
        <li>{t(45)}</li>
        <li>{t(46)}</li>
        <li>{t(47)}</li>
        <li>{t(48)}</li>
        <li>{t(49)}</li>
      </ul>
      
      <h4 className="text-lg font-medium text-gray-700 mb-3">{t(50)}</h4>
      <p className="mb-4">{t(51)}</p>
      <ul className="list-disc pl-6 mb-6 space-y-2">
        <li>{t(52)}</li>
        <li>{t(53)}</li>
        <li>{t(54)}</li>
        <li>{t(55)}</li>
      </ul>
      
      <h4 className="text-lg font-medium text-gray-700 mb-3">{t(56)}</h4>
      <p className="mb-4">{t(57)}</p>
      <ul className="list-disc pl-6 mb-6 space-y-2">
        <li>{t(58)}</li>
        <li>{t(59)}</li>
        <li>{t(60)}</li>
        <li>{t(61)}</li>
      </ul>
      
      <p className="mb-6">{t(62)}</p>
      
      <h3 className="text-xl font-semibold text-gray-800 mb-4">{t(63)}</h3>
      <p className="mb-6">{t(64)}</p>
      
      <div className="mt-8 pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-600">{t(65)} {format(new Date(), 'MMMM dd, yyyy')}</p>
      </div>
    </div>
  );
}

// Component for rendering translated Tips & Tricks content
function TipsTricksContent() {
  // All the text content from the tips-tricks page
  const tipsTricksTexts = [
    "Tips & Tricks",
    "MARKETPLACE",
    "For Sellers:",
    "Craft Compelling Listings:",
    "High-Quality Photos:",
    "Utilize good lighting and a clean background to effectively showcase your items.",
    "Detailed Descriptions:",
    "Provide all pertinent information, including dimensions, materials, and any unique features.",
    "Competitive Pricing:",
    "Conduct research on similar items to ensure your pricing is appropriate.",
    "Keywords:",
    "Incorporate relevant keywords within your title and description to enhance discoverability for buyers.",
    "Be Responsive:",
    "Promptly address inquiries in a courteous manner.",
    "Build Trust and Reputation:",
    "Respond to Inquiries Promptly:",
    "This demonstrates reliability and attentiveness to potential buyers.",
    "Be Honest and Transparent:",
    "Disclose any flaws or imperfections present in your items.",
    "Encourage Reviews:",
    "After a successful transaction, kindly request that buyers leave a review.",
    "Optimize for Success:",
    "Consider Boosting Your Listings:",
    "This strategy may enhance visibility and attract more potential buyers.",
    "Utilize Social Media:",
    "Promote your listings through your personal and relevant social media platforms.",
    "Negotiate Fairly:",
    "Be open to reasonable offers while standing firm on your pricing when necessary.",
    "Ensure Safe Transactions:",
    "Opt to meet in public locations or utilize secure payment methods.",
    "Carpooling:",
    "Verify Reliability:",
    "Look for a Verified Profile badge and Super Driver profiles when seeking a ride. Members committed to fostering a trustworthy community have verified their ID, email, and phone number.",
    "Check Ratings:",
    "Ratings are essential for establishing trust among members and for making informed decisions. Review them when selecting travel companions.",
    "Communicate through Dedw3n only:",
    "Use our messaging system to share ride details and report any inappropriate or suspicious messages.",
    "Confirm the Meeting Point:",
    "Familiarize yourself with the meeting location, ensuring it is a public and easily accessible site, such as a train station, airport, or shopping centre. Dedw3n provides a list of suggested meeting points near departure and arrival locations.",
    "Keep an Eye Out for Women-Only Rides:",
    "To promote trust and safety, Dedw3n offers an option to display rides exclusively for women wishing to travel with other women, creating a more inclusive environment.",
    "Dedw3n Carpool:",
    "Charge Your Phone:",
    "It is advisable to have a fully charged phone and keep it on during the ride. Take screenshots of essential ride details in case of low battery.",
    "Consider Sharing Your Trip Details:",
    "Inform a trusted individual of your itinerary before departure and provide updates throughout the journey.",
    "At the Meeting Point:",
    "Verify Fellow Car-poolers:",
    "Ensure that the individuals match their profile descriptions to prevent misunderstandings.",
    "Check the Car:",
    "Confirm that the driver's vehicle corresponds with the make and model listed in the ride details.",
    "For Buyers:",
    "Being a Smart Buyer:",
    "Haggle Respectfully:",
    "Don't hesitate to negotiate, particularly on items that have been listed for an extended period.",
    "Be Proactive:",
    "If you are interested in an item, message the seller promptly, especially for in-demand items.",
    "Use Keywords Effectively:",
    "Employ specific keywords to refine your search and locate precisely what you seek.",
    "Pay Attention to Details:",
    "Carefully review photos and descriptions before contacting the seller.",
    "Utilize Escrow Services:",
    "Consider using escrow services before receiving the goods to ensure a secure transaction.",
    "Community Platform",
    "Being a Responsible User:",
    "Be Mindful of Your Online Presence:",
    "Your posts serve as a reflection of your character; therefore, it is essential to maintain professionalism and respect in all interactions.",
    "Exercise Caution When Sharing Personal Information:",
    "Refrain from disclosing sensitive information online to protect your privacy.",
    "Establish Boundaries and Limits:",
    "Develop healthy habits regarding social media usage, and avoid excessive scrolling to maintain a balanced relationship with technology.",
    "Remain Vigilant Against Misinformation and Scams:",
    "Approach online information critically, and steer clear of engaging with dubious content.",
    "Take Breaks When Necessary:",
    "Given the potential overwhelming nature of social media, it is vital to disconnect and recharge periodically.",
    "Understand Algorithms:",
    "Social media platforms utilize algorithms to curate user content. Stay informed about changes to these algorithms and their implications for your posts.",
    "Monitor Your Engagement:",
    "Track the performance of your posts, analyse what resonates with your audience, and adjust your strategy accordingly.",
    "DATING",
    "Tips and Tricks",
    "Meeting new people is exciting, but you should always be cautious when communicating with someone you don't know. Use common sense and put your safety first, whether you're exchanging initial messages or meeting in person. While you can't control the actions of others, there are things you can do to stay safe during your Dedw3n experience.",
    "Protect your personal information",
    "Never share personal information, such as your social security number, home or work address, or details about your daily routine (e.g., that you go to a certain gym every Monday) with people you don't know. If you have children, limit the information you share about them on your profile and in initial conversations. Don't give details such as your children's names, where they go to school, or their age or gender.",
    "Never send money or share financial information",
    "Never send money, especially via bank transfer, even if the person claims to be in an emergency situation. Transferring money is like sending cash. It is almost impossible to reverse the transaction or trace where the money has gone. Never share information that could be used to access your financial accounts. If another user asks you for money, report it to us immediately.",
    "Stay on the platform",
    "Conduct your conversations on the Dedw3n platform when you are just getting to know someone. Because exchanges on Dedw3n must comply with our secure message filters (more information here), users with malicious intentions often try to move the conversation immediately to text, messaging apps, email or phone.",
    "Be wary of long-distance relationships",
    "Watch out for scammers who claim to be from your country but are stuck somewhere else, especially if they ask for financial help to return home. Be wary of anyone who does not want to meet in person or talk on the phone/video chat. They may not be who they say they are. If someone avoids your questions or insists on a serious relationship without first meeting you or getting to know you, be careful. This is usually a red flag.",
    "Report any suspicious or offensive behaviour",
    "You know when someone crosses the line, and when they do, we want to know about it. Block and report anyone who violates our terms and conditions. Here are some examples of violations:",
    "Requests for money or donations",
    "Underage users",
    "Harassment, threats and offensive messages",
    "Inappropriate or negative behaviour during or after a personal meeting",
    "Fraudulent profiles",
    "Spam or requests including links to commercial websites or attempts to sell products or services",
    "You can report suspicious behaviour via any profile page or message window, or by sending an email to love@Dedw3n.com.",
    "Secure your account",
    "Make sure you choose a strong password and always be careful when logging into your account from a public or shared computer. Dedw3n will never send you an email asking for your username and password. If you receive an email asking for account information, report it immediately. If you log in with your phone number, do not share your SMS code with anyone. Any website that asks for this code to verify your identity is in no way affiliated with Dedw3n.",
    "Meeting in person",
    "Don't rush",
    "Take your time and get to know the other person before meeting them or chatting outside the Dedw3n platform. Don't be afraid to ask questions to screen for red flags or personal deal-breakers. After moving the conversation outside the Dedw3n platform, a phone call or video chat can be a useful screening tool before meeting someone in person.",
    "Meet in a public place and stay in a public place",
    "For the first few times, meet in a busy, public place. Never meet at home, at your date's house, or at any other private location. If your date pressures you to go to a private location, end the date.",
    "Tell friends and family about your plans",
    "Tell a friend or family member about your plans. Also tell them when you are leaving and where you are going. Make sure you always have a charged phone with you.",
    "Know your limits",
    "Be aware of the effects that drugs or alcohol have on you. They can affect your judgement and alertness. If your date tries to pressure you into using drugs or drinking more than you feel comfortable with, stand your ground and end the date.",
    "Do not leave drinks or personal items unattended",
    "Know where your drink comes from and keep it with you. Only accept drinks that are poured or served directly by the bartender or wait staff. Many substances added to drinks to facilitate sexual assault are odourless, colourless and tasteless. Also, always keep your phone, handbag, wallet and anything containing personal information with you.",
    "If you feel uncomfortable, leave",
    "It is perfectly acceptable to end the date early if you feel uncomfortable. In fact, it is recommended. And if your instincts tell you that something is wrong or you feel unsafe, ask the bartender or wait staff for help.",
    "Last updated:"
  ];

  const { translations, isLoading } = useMasterBatchTranslation(tipsTricksTexts, 'high');

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    );
  }

  const t = (index: number) => translations[index] || tipsTricksTexts[index];

  return (
    <div className="prose prose-lg max-w-none text-gray-700 mb-8">
      <div className="marketplace-section">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{t(1)}</h2>
        
        <h3 className="text-xl font-semibold text-gray-800 mb-4">{t(2)}</h3>
        <h4 className="text-lg font-medium text-gray-700 mb-3">{t(3)}</h4>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li><strong>{t(4)}</strong> {t(5)}</li>
          <li><strong>{t(6)}</strong> {t(7)}</li>
          <li><strong>{t(8)}</strong> {t(9)}</li>
          <li><strong>{t(10)}</strong> {t(11)}</li>
          <li><strong>{t(12)}</strong> {t(13)}</li>
        </ul>
        
        <h4 className="text-lg font-medium text-gray-700 mb-3">{t(14)}</h4>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li><strong>{t(15)}</strong> {t(16)}</li>
          <li><strong>{t(17)}</strong> {t(18)}</li>
          <li><strong>{t(19)}</strong> {t(20)}</li>
        </ul>
        
        <h4 className="text-lg font-medium text-gray-700 mb-3">{t(21)}</h4>
        <ul className="list-disc pl-6 mb-8 space-y-2">
          <li><strong>{t(22)}</strong> {t(23)}</li>
          <li><strong>{t(24)}</strong> {t(25)}</li>
          <li><strong>{t(26)}</strong> {t(27)}</li>
          <li><strong>{t(28)}</strong> {t(29)}</li>
        </ul>

        <h3 className="text-xl font-semibold text-gray-800 mb-4">{t(30)}</h3>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li><strong>{t(31)}</strong> {t(32)}</li>
          <li><strong>{t(33)}</strong> {t(34)}</li>
          <li><strong>{t(35)}</strong> {t(36)}</li>
          <li><strong>{t(37)}</strong> {t(38)}</li>
          <li><strong>{t(39)}</strong> {t(40)}</li>
        </ul>

        <h3 className="text-xl font-semibold text-gray-800 mb-4">{t(41)}</h3>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li><strong>{t(42)}</strong> {t(43)}</li>
          <li><strong>{t(44)}</strong> {t(45)}</li>
        </ul>

        <h3 className="text-xl font-semibold text-gray-800 mb-4">{t(46)}</h3>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li><strong>{t(47)}</strong> {t(48)}</li>
          <li><strong>{t(49)}</strong> {t(50)}</li>
        </ul>

        <h3 className="text-xl font-semibold text-gray-800 mb-4">{t(51)}</h3>
        <h4 className="text-lg font-medium text-gray-700 mb-3">{t(52)}</h4>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li><strong>{t(53)}</strong> {t(54)}</li>
          <li><strong>{t(55)}</strong> {t(56)}</li>
          <li><strong>{t(57)}</strong> {t(58)}</li>
          <li><strong>{t(59)}</strong> {t(60)}</li>
          <li><strong>{t(61)}</strong> {t(62)}</li>
        </ul>

        <h3 className="text-xl font-semibold text-gray-800 mb-4">{t(63)}</h3>
        <h4 className="text-lg font-medium text-gray-700 mb-3">{t(64)}</h4>
        <ul className="list-disc pl-6 mb-8 space-y-2">
          <li><strong>{t(65)}</strong> {t(66)}</li>
          <li><strong>{t(67)}</strong> {t(68)}</li>
          <li><strong>{t(69)}</strong> {t(70)}</li>
          <li><strong>{t(71)}</strong> {t(72)}</li>
          <li><strong>{t(73)}</strong> {t(74)}</li>
          <li><strong>{t(75)}</strong> {t(76)}</li>
          <li><strong>{t(77)}</strong> {t(78)}</li>
        </ul>
      </div>

      <div className="dating-section">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{t(79)}</h2>
        <h3 className="text-xl font-semibold text-gray-800 mb-4">{t(80)}</h3>
        <p className="mb-6">{t(81)}</p>

        <h3 className="text-xl font-semibold text-gray-800 mb-4">{t(82)}</h3>
        <p className="mb-6">{t(83)}</p>

        <h3 className="text-xl font-semibold text-gray-800 mb-4">{t(84)}</h3>
        <p className="mb-6">{t(85)}</p>

        <h3 className="text-xl font-semibold text-gray-800 mb-4">{t(86)}</h3>
        <p className="mb-6">{t(87)}</p>

        <h3 className="text-xl font-semibold text-gray-800 mb-4">{t(88)}</h3>
        <p className="mb-6">{t(89)}</p>

        <h3 className="text-xl font-semibold text-gray-800 mb-4">{t(90)}</h3>
        <p className="mb-4">{t(91)}</p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>{t(92)}</li>
          <li>{t(93)}</li>
          <li>{t(94)}</li>
          <li>{t(95)}</li>
          <li>{t(96)}</li>
          <li>{t(97)}</li>
        </ul>
        <p className="mb-6">{t(98)}</p>

        <h3 className="text-xl font-semibold text-gray-800 mb-4">{t(99)}</h3>
        <p className="mb-6">{t(100)}</p>

        <h3 className="text-xl font-semibold text-gray-800 mb-4">{t(101)}</h3>
        
        <h4 className="text-lg font-medium text-gray-700 mb-3">{t(102)}</h4>
        <p className="mb-6">{t(103)}</p>
        
        <h4 className="text-lg font-medium text-gray-700 mb-3">{t(104)}</h4>
        <p className="mb-6">{t(105)}</p>
        
        <h4 className="text-lg font-medium text-gray-700 mb-3">{t(106)}</h4>
        <p className="mb-6">{t(107)}</p>
        
        <h4 className="text-lg font-medium text-gray-700 mb-3">{t(108)}</h4>
        <p className="mb-6">{t(109)}</p>
        
        <h4 className="text-lg font-medium text-gray-700 mb-3">{t(110)}</h4>
        <p className="mb-6">{t(111)}</p>
        
        <h4 className="text-lg font-medium text-gray-700 mb-3">{t(112)}</h4>
        <p className="mb-6">{t(113)}</p>
      </div>
    </div>
  );
}

// Component for rendering translated Catalogue Rules content
function CatalogueRulesContent() {
  // All the text content from the catalogue-rules page
  const catalogueRulesTexts = [
    "Catalogue Rules",
    "Welcome to Dedw3n's Marketplace Catalogue Rules",
    "At Dedw3n, we strive to maintain a safe, trustworthy, and high-quality marketplace for all our users. These catalogue rules ensure that all listings meet our community standards and legal requirements.",
    "General Listing Requirements",
    "Item Authenticity",
    "All items must be genuine and authentic. Counterfeit, replica, or imitation products are strictly prohibited.",
    "Accurate Descriptions",
    "Provide truthful and detailed descriptions of your items, including condition, dimensions, materials, and any defects or wear.",
    "Quality Images",
    "Upload clear, well-lit photos that accurately represent the item from multiple angles.",
    "Appropriate Pricing",
    "Set fair and reasonable prices. Price manipulation or artificial inflation is not allowed.",
    "Legal Compliance",
    "All listings must comply with local, national, and international laws and regulations.",
    "Prohibited Items",
    "The following items are strictly prohibited on Dedw3n:",
    "Illegal Substances",
    "Drugs, controlled substances, drug paraphernalia, or any illegal materials.",
    "Weapons and Dangerous Items",
    "Firearms, ammunition, explosives, knives (except kitchen knives and tools), or any dangerous weapons.",
    "Stolen or Fraudulent Items",
    "Items obtained through theft, fraud, or other illegal means.",
    "Counterfeit Products",
    "Fake designer items, replica products, or any unauthorized reproductions.",
    "Adult Content",
    "Sexually explicit materials, adult services, or inappropriate content.",
    "Live Animals",
    "Living animals or endangered species products are not permitted.",
    "Human Body Parts",
    "Organs, blood, or any human biological materials.",
    "Personal Information",
    "Items containing personal data, private information, or identity documents.",
    "Restricted Categories",
    "These items require special verification or approval:",
    "Electronics",
    "Must be in working condition with proof of purchase when possible. Ensure all personal data is removed.",
    "Vehicles",
    "Must have clear title and proper documentation. Vehicle history reports recommended.",
    "Jewelry and Precious Metals",
    "High-value items may require authentication or proof of ownership.",
    "Medical Equipment",
    "Must comply with health regulations and require proper documentation.",
    "Professional Services",
    "Service providers must have appropriate licenses and certifications.",
    "Quality Standards",
    "Content Requirements",
    "Use appropriate and professional language in all descriptions.",
    "Titles must be clear, descriptive, and relevant to the item.",
    "Avoid excessive use of capital letters or promotional language.",
    "Include relevant keywords to help buyers find your items.",
    "Image Standards",
    "Minimum resolution of 800x600 pixels recommended.",
    "No watermarks, logos, or promotional text on images.",
    "Images must show the actual item being sold.",
    "Avoid stock photos unless specifically noted.",
    "Category Guidelines",
    "Electronics and Technology",
    "Include model numbers, specifications, and compatibility information.",
    "State battery condition for portable devices.",
    "Mention any included accessories or original packaging.",
    "Fashion and Apparel",
    "Provide accurate size measurements and sizing charts when applicable.",
    "Describe material composition and care instructions.",
    "Note any signs of wear, stains, or alterations.",
    "Home and Garden",
    "Include dimensions and weight for furniture items.",
    "Specify indoor or outdoor suitability.",
    "Mention assembly requirements or included tools.",
    "Collectibles and Antiques",
    "Provide authentication documents when available.",
    "Describe age, origin, and rarity of items.",
    "Note any restoration or repairs made to the item.",
    "Safety Requirements",
    "Product Safety",
    "All items must meet applicable safety standards and regulations.",
    "Recalled items or products deemed unsafe are prohibited.",
    "Include safety warnings for potentially hazardous items.",
    "Child Safety",
    "Items intended for children must comply with child safety regulations.",
    "Age-appropriate warnings and recommendations must be included.",
    "Small parts warnings required for items that may pose choking hazards.",
    "Seller Responsibilities",
    "Accurate Representation",
    "Sellers are responsible for ensuring all information provided is accurate and complete.",
    "Any changes to item condition must be promptly updated in the listing.",
    "Responsive Communication",
    "Respond to buyer inquiries within 24 hours during business days.",
    "Provide additional information or photos when requested by serious buyers.",
    "Fulfillment Standards",
    "Items must be shipped within the timeframe specified in the listing.",
    "Package items securely to prevent damage during transit.",
    "Provide tracking information when available.",
    "Consequences of Non-Compliance",
    "Violations of these catalogue rules may result in:",
    "Listing removal without prior notice.",
    "Temporary or permanent account suspension.",
    "Forfeiture of seller fees and commissions.",
    "Reporting to appropriate authorities for illegal activities.",
    "Appeal Process",
    "If you believe your listing was removed in error, you may appeal the decision by contacting our support team at love@dedw3n.com within 7 days of the removal.",
    "Updates to Rules",
    "These catalogue rules may be updated periodically to reflect changes in laws, regulations, or platform policies. Users will be notified of significant changes via email or platform notifications.",
    "Contact Information",
    "For questions about these catalogue rules or to report violations, please contact us at:",
    "Email: love@dedw3n.com",
    "Through our in-app messaging system",
    "Via the 'Report' function on individual listings",
    "By following our community guidelines, we can maintain a trustworthy marketplace that benefits all users. Thank you for your cooperation in keeping Dedw3n safe and reliable."
  ];

  const { translations, isLoading } = useMasterBatchTranslation(catalogueRulesTexts, 'high');

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    );
  }

  const t = (index: number) => translations[index] || catalogueRulesTexts[index];

  return (
    <div className="prose prose-lg max-w-none text-gray-700 mb-8">
      <p className="mb-6">{t(1)}</p>
      <p className="mb-6">{t(2)}</p>
      
      <h3 className="text-xl font-semibold text-gray-800 mb-4">{t(3)}</h3>
      
      <h4 className="text-lg font-medium text-gray-700 mb-3">{t(4)}</h4>
      <p className="mb-4">{t(5)}</p>
      
      <h4 className="text-lg font-medium text-gray-700 mb-3">{t(6)}</h4>
      <p className="mb-4">{t(7)}</p>
      
      <h4 className="text-lg font-medium text-gray-700 mb-3">{t(8)}</h4>
      <p className="mb-4">{t(9)}</p>
      
      <h4 className="text-lg font-medium text-gray-700 mb-3">{t(10)}</h4>
      <p className="mb-4">{t(11)}</p>
      
      <h4 className="text-lg font-medium text-gray-700 mb-3">{t(12)}</h4>
      <p className="mb-6">{t(13)}</p>
      
      <h3 className="text-xl font-semibold text-gray-800 mb-4">{t(14)}</h3>
      <p className="mb-4">{t(15)}</p>
      
      <h4 className="text-lg font-medium text-gray-700 mb-3">{t(16)}</h4>
      <p className="mb-4">{t(17)}</p>
      
      <h4 className="text-lg font-medium text-gray-700 mb-3">{t(18)}</h4>
      <p className="mb-4">{t(19)}</p>
      
      <h4 className="text-lg font-medium text-gray-700 mb-3">{t(20)}</h4>
      <p className="mb-4">{t(21)}</p>
      
      <h4 className="text-lg font-medium text-gray-700 mb-3">{t(22)}</h4>
      <p className="mb-4">{t(23)}</p>
      
      <h4 className="text-lg font-medium text-gray-700 mb-3">{t(24)}</h4>
      <p className="mb-4">{t(25)}</p>
      
      <h4 className="text-lg font-medium text-gray-700 mb-3">{t(26)}</h4>
      <p className="mb-4">{t(27)}</p>
      
      <h4 className="text-lg font-medium text-gray-700 mb-3">{t(28)}</h4>
      <p className="mb-4">{t(29)}</p>
      
      <h4 className="text-lg font-medium text-gray-700 mb-3">{t(30)}</h4>
      <p className="mb-6">{t(31)}</p>
      
      <h3 className="text-xl font-semibold text-gray-800 mb-4">{t(32)}</h3>
      <p className="mb-4">{t(33)}</p>
      
      <h4 className="text-lg font-medium text-gray-700 mb-3">{t(34)}</h4>
      <p className="mb-4">{t(35)}</p>
      
      <h4 className="text-lg font-medium text-gray-700 mb-3">{t(36)}</h4>
      <p className="mb-4">{t(37)}</p>
      
      <h4 className="text-lg font-medium text-gray-700 mb-3">{t(38)}</h4>
      <p className="mb-4">{t(39)}</p>
      
      <h4 className="text-lg font-medium text-gray-700 mb-3">{t(40)}</h4>
      <p className="mb-4">{t(41)}</p>
      
      <h4 className="text-lg font-medium text-gray-700 mb-3">{t(42)}</h4>
      <p className="mb-6">{t(43)}</p>
      
      <h3 className="text-xl font-semibold text-gray-800 mb-4">{t(44)}</h3>
      
      <h4 className="text-lg font-medium text-gray-700 mb-3">{t(45)}</h4>
      <ul className="list-disc pl-6 mb-4 space-y-2">
        <li>{t(46)}</li>
        <li>{t(47)}</li>
        <li>{t(48)}</li>
        <li>{t(49)}</li>
      </ul>
      
      <h4 className="text-lg font-medium text-gray-700 mb-3">{t(50)}</h4>
      <ul className="list-disc pl-6 mb-6 space-y-2">
        <li>{t(51)}</li>
        <li>{t(52)}</li>
        <li>{t(53)}</li>
        <li>{t(54)}</li>
      </ul>
      
      <h3 className="text-xl font-semibold text-gray-800 mb-4">{t(55)}</h3>
      
      <h4 className="text-lg font-medium text-gray-700 mb-3">{t(56)}</h4>
      <ul className="list-disc pl-6 mb-4 space-y-2">
        <li>{t(57)}</li>
        <li>{t(58)}</li>
        <li>{t(59)}</li>
      </ul>
      
      <h4 className="text-lg font-medium text-gray-700 mb-3">{t(60)}</h4>
      <ul className="list-disc pl-6 mb-4 space-y-2">
        <li>{t(61)}</li>
        <li>{t(62)}</li>
        <li>{t(63)}</li>
      </ul>
      
      <h4 className="text-lg font-medium text-gray-700 mb-3">{t(64)}</h4>
      <ul className="list-disc pl-6 mb-4 space-y-2">
        <li>{t(65)}</li>
        <li>{t(66)}</li>
        <li>{t(67)}</li>
      </ul>
      
      <h4 className="text-lg font-medium text-gray-700 mb-3">{t(68)}</h4>
      <ul className="list-disc pl-6 mb-4 space-y-2">
        <li>{t(69)}</li>
        <li>{t(70)}</li>
        <li>{t(71)}</li>
      </ul>
      
      <h4 className="text-lg font-medium text-gray-700 mb-3">{t(72)}</h4>
      <ul className="list-disc pl-6 mb-6 space-y-2">
        <li>{t(73)}</li>
        <li>{t(74)}</li>
        <li>{t(75)}</li>
      </ul>
      
      <h3 className="text-xl font-semibold text-gray-800 mb-4">{t(76)}</h3>
      
      <h4 className="text-lg font-medium text-gray-700 mb-3">{t(77)}</h4>
      <ul className="list-disc pl-6 mb-4 space-y-2">
        <li>{t(78)}</li>
        <li>{t(79)}</li>
        <li>{t(80)}</li>
      </ul>
      
      <h4 className="text-lg font-medium text-gray-700 mb-3">{t(81)}</h4>
      <ul className="list-disc pl-6 mb-6 space-y-2">
        <li>{t(82)}</li>
        <li>{t(83)}</li>
        <li>{t(84)}</li>
      </ul>
      
      <h3 className="text-xl font-semibold text-gray-800 mb-4">{t(85)}</h3>
      
      <h4 className="text-lg font-medium text-gray-700 mb-3">{t(86)}</h4>
      <ul className="list-disc pl-6 mb-4 space-y-2">
        <li>{t(87)}</li>
        <li>{t(88)}</li>
      </ul>
      
      <h4 className="text-lg font-medium text-gray-700 mb-3">{t(89)}</h4>
      <ul className="list-disc pl-6 mb-4 space-y-2">
        <li>{t(90)}</li>
        <li>{t(91)}</li>
      </ul>
      
      <h4 className="text-lg font-medium text-gray-700 mb-3">{t(92)}</h4>
      <ul className="list-disc pl-6 mb-6 space-y-2">
        <li>{t(93)}</li>
        <li>{t(94)}</li>
        <li>{t(95)}</li>
      </ul>
      
      <h3 className="text-xl font-semibold text-gray-800 mb-4">{t(96)}</h3>
      <ul className="list-disc pl-6 mb-6 space-y-2">
        <li>{t(97)}</li>
        <li>{t(98)}</li>
        <li>{t(99)}</li>
        <li>{t(100)}</li>
      </ul>
      
      <h3 className="text-xl font-semibold text-gray-800 mb-4">{t(101)}</h3>
      <p className="mb-6">{t(102)}</p>
      
      <h3 className="text-xl font-semibold text-gray-800 mb-4">{t(103)}</h3>
      <p className="mb-6">{t(104)}</p>
      
      <h3 className="text-xl font-semibold text-gray-800 mb-4">{t(105)}</h3>
      <p className="mb-4">{t(106)}</p>
      <ul className="list-disc pl-6 mb-6 space-y-2">
        <li>{t(107)}</li>
        <li>{t(108)}</li>
        <li>{t(109)}</li>
      </ul>
    </div>
  );
}

// Component for rendering Intellectual Property Claims Policy content
function IntellectualPropertyContent() {
  const intellectualPropertyTexts = [
    "Intellectual Property Claims Policy",
    "REPORTING CLAIMS OF INTELLECTUAL PROPERTY",
    "Dedw3n.com's content is based on User Generated Content (UGC). Dedw3n does not check user uploaded/created content for violations of copyright or other rights. However, if you believe any of the uploaded content violates your copyright or a related exclusive right, you should follow the process below. Dedw3n looks into reported violations and removes or disables content shown to be violating third party rights.",
    "In case you encounter any violation of intellectual property rights on Dedw3n, please use Dedw3n's easy-to-use online tools, which allow users to add all of the relevant information to their report. Learn more on how to report content on Dedw3n here. In addition, Dedw3n maintains additional reporting flows for DMCA notices and counter-notices, and for trademark infringement, through designated agents, as set forth in detail below.",
    "REPORTING COPYRIGHT CLAIMS UNDER THE US DIGITAL MILLENIUM COPYRIGHT ACT (DMCA)",
    "In case you are reporting under the U.S DMCA, you can either report through the existing online tools, or send an infringement notice (\"Infrigement Notice\") on our contact form to Dedw3n's designated DMCA agent.",
    "DMCA NOTICE REQUIREMENTS",
    "In order to allow us to review your report promptly and effectively, the Notice should include the following:",
    "Identification of your copyrighted work and what is protected under the copyright(s) that you are referring to.",
    "Your copyright certificate(s)/designation(s) and the type, e.g., registered or unregistered.",
    "Proof of your copyrights ownership, such as the registration number or a copy of the registration certificate.",
    "A short description of how our user(s) allegedly infringe(s) your copyright(s).",
    "Clear reference to the materials you allege are infringing and which you are requesting to be removed, for example, the GIG® url, a link to the deliverable provided to a user, etc.",
    "Your complete name, address, email address, and telephone number.",
    "A statement that you have a good faith belief that use of the material in the manner complained of is not authorized by the copyright owner, its agent, or the law.",
    "A statement made under penalty of perjury that the information provided in the notice is accurate and that you are the copyright owner or the owner of an exclusive right that is being infringed, or are authorized to make the complaint on behalf of the copyright owner or the owner of an exclusive right that is being infringed.",
    "Your electronic or physical signature.",
    "You can send your Notice to our designated DMCA Claims Agent at:",
    "Dedw3n Ltd.\nAttention: DMCA Claims Agent\n50 Essex St, Temple, London WC2R3JF\nEngland, United Kingdom",
    "Alternatively you can submit the Notice electronically to DMCA@Dedw3n.com or by submitting a ticket to our DMCA Agent via our contact us form here.",
    "Note that we will provide the user who is allegedly infringing your copyright with information about the Notice and allow them to respond. In cases where sufficient proof of infringement is provided, we may remove or suspend the reported materials prior to receiving the user's response. In cases where the allegedly infringing user provides us with a proper counter-notice indicating that it is permitted to post the allegedly infringing material, we may notify you and then replace the removed or disabled material. In all such cases, we will act in accordance with 17 U.S.C Section 512 and other applicable laws.",
    "If you fail to comply with all of the requirements of Section 512(c)(3) of the DMCA, your DMCA Notice may not be effective.",
    "Please be aware that if you knowingly materially misrepresent that material or activity on the Website is infringing your copyright, you may be held liable for damages (including costs and attorneys' fees) under Section 512(f) of the DMCA.",
    "DMCA COUNTER-NOTICE REQUIREMENTS",
    "If you believe that material you posted on the site was removed or access to it was disabled by mistake or misidentification, you may file a counter-notice with us (a \"Counter-Notice\") by submitting written notification to our DMCA Claims agent (identified above). Pursuant to the DMCA, the Counter-Notice must include substantially the following:",
    "Your physical or electronic signature.",
    "An identification of the material that has been removed or to which access has been disabled and the location at which the material appeared before it was removed or access disabled.",
    "Adequate information by which we can contact you (including your name, postal address, telephone number and, if available, e-mail address).",
    "A statement under penalty of perjury by you that you have a good faith belief that the material identified above was removed or disabled as a result of a mistake or misidentification of the material to be removed or disabled.",
    "A statement that you will consent to the jurisdiction of the Federal District Court for the judicial district in which your address is located (or if you reside outside the United States for any judicial district in which the Website may be found) and that you will accept service from the person (or an agent of that person) who provided the Website with the complaint at issue.",
    "The DMCA allows us to restore the removed content if the party filing the original DMCA Notice does not file a court action against you within ten business days of receiving the copy of your Counter-Notice. Please be aware that if you knowingly materially misrepresent that material or activity on the Website was removed or disabled by mistake or misidentification, you may be held liable for damages (including costs and attorneys' fees) under Section 512(f) of the DMCA.",
    "REPORTING TRADEMARK INFRINGEMENT",
    "Dedw3n.com's content is based on User Generated Content (UGC). Dedw3n does not check user uploaded/created content for violations of trademark or other rights. However, if you believe any of the uploaded content violates your trademark, you should follow the process below. Dedw3n looks into reported violations and removes or disables content shown to be violating third party trademark rights.",
    "In order to allow us to review your report promptly and effectively, a trademark infringement notice (\"TM Notice\") should include the following:",
    "Identification of your trademark and the goods/services for which you claim trademark rights.",
    "Your trademark registration certificate and a printout from the pertinent country's trademark office records showing current status and title of the registration. Alternatively, a statement that your mark is unregistered, together with a court ruling confirming your rights.",
    "A short description of how our user(s) allegedly infringe(s) your trademark(s).",
    "Clear reference to the materials you allege are infringing and which you are requesting to be removed, for example, the GIG® url, a link to the deliverable provided to a user, etc.",
    "Your complete name, address, email address, and telephone number.",
    "A statement that you have a good faith belief that use of the material in the manner complained of is not authorized by the trademark owner, its agent, or the law.",
    "A statement made under penalty of perjury that the information provided in the notice is accurate and that you are the trademark or are authorized to make the complaint on behalf of the trademark owner.",
    "Your electronic or physical signature",
    "You can send your Notice to:",
    "Dedw3n Ltd.\nAttention: DMCA Claims Agent\n50 Essex St, Temple, London WC2R3JF\nEngland, United Kingdom",
    "Note that we will provide the user who is allegedly infringing your trademark with information about the TM Notice and allow them to respond. In cases where sufficient proof of infringement is provided, we may remove or suspend the reported materials prior to receiving the user's response. In cases where the allegedly infringing user provides us with information indicating that it is permitted to post the allegedly infringing material, we may notify you and then replace the removed or disabled material. In all such cases, we will act in accordance with applicable law.",
    "REPEAT INFRINGERS",
    "It is our policy in appropriate circumstances to disable and/or terminate the accounts of users who are repeat infringers."
  ];

  const { translations, isLoading } = useMasterBatchTranslation(intellectualPropertyTexts, 'high');

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    );
  }

  const t = (index: number) => translations[index] || intellectualPropertyTexts[index];

  return (
    <div className="prose prose-lg max-w-none text-gray-700 mb-8">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">{t(1)}</h3>
      <p className="mb-6">{t(2)}</p>
      <p className="mb-6">{t(3)}</p>
      
      <h3 className="text-xl font-semibold text-gray-800 mb-4">{t(4)}</h3>
      <p className="mb-6">{t(5)}</p>
      
      <h3 className="text-xl font-semibold text-gray-800 mb-4">{t(6)}</h3>
      <p className="mb-6">{t(7)}</p>
      
      <ul className="list-disc ml-6 mb-6 space-y-2">
        <li>{t(8)}</li>
        <li>{t(9)}</li>
        <li>{t(10)}</li>
        <li>{t(11)}</li>
        <li>{t(12)}</li>
        <li>{t(13)}</li>
        <li>{t(14)}</li>
        <li>{t(15)}</li>
        <li>{t(16)}</li>
      </ul>
      
      <p className="mb-4">{t(17)}</p>
      <p className="mb-6 whitespace-pre-line">{t(18)}</p>
      
      <p className="mb-6">{t(19)}</p>
      <p className="mb-6">{t(20)}</p>
      <p className="mb-6">{t(21)}</p>
      <p className="mb-6">{t(22)}</p>
      
      <h3 className="text-xl font-semibold text-gray-800 mb-4">{t(23)}</h3>
      <p className="mb-6">{t(24)}</p>
      
      <ul className="list-disc ml-6 mb-6 space-y-2">
        <li>{t(25)}</li>
        <li>{t(26)}</li>
        <li>{t(27)}</li>
        <li>{t(28)}</li>
        <li>{t(29)}</li>
      </ul>
      
      <p className="mb-6">{t(30)}</p>
      
      <h3 className="text-xl font-semibold text-gray-800 mb-4">{t(31)}</h3>
      <p className="mb-6">{t(32)}</p>
      <p className="mb-6">{t(33)}</p>
      
      <ul className="list-disc ml-6 mb-6 space-y-2">
        <li>{t(34)}</li>
        <li>{t(35)}</li>
        <li>{t(36)}</li>
        <li>{t(37)}</li>
        <li>{t(38)}</li>
        <li>{t(39)}</li>
        <li>{t(40)}</li>
        <li>{t(41)}</li>
      </ul>
      
      <p className="mb-4">{t(42)}</p>
      <p className="mb-6 whitespace-pre-line">{t(43)}</p>
      
      <p className="mb-6">{t(44)}</p>
      
      <h3 className="text-xl font-semibold text-gray-800 mb-4">{t(45)}</h3>
      <p className="mb-6">{t(46)}</p>
    </div>
  );
}

function AdvertisementTermsContent() {
  const advertisementTermsTexts = [
    "Dedw3n Advertisement Terms of Service",
    "The following terms of service (the \"Terms\") govern your access to and use of the Dedw3n Advertisement program (\"Dedw3n Advertisement\", the \"Program\", or the \"Service\") by Dedw3n Ltd. and its subsidiaries as applicable (collectively, \"Dedw3n\" or \"we\").",
    "Please read these Terms carefully before you start using Dedw3n Advertisement. By using Dedw3n Advertisement, you accept and agree to be bound and abide by the Terms, incorporated herein by reference. If you do not want to agree to these Terms, you must not access or use the Service. These Terms are supplemental to Dedw3n.com's general Terms of Service (the \"Terms of Service\"), which also apply to Dedw3n Advertisement. Capitalized terms used but not defined herein shall have the respective meanings given to them in the Terms of Service.",
    "1. Dedw3n Advertisement",
    "The Dedw3n Advertisement Program allows qualified Sellers to promote their business by making their services visible as Advertisement in prime locations in the marketplace (the \"Advertisement\"), within certain categories. Dedw3n Advertisement uses a first-price auction mechanism to determine the cost and placement of Advertisement from participating Sellers. In Dedw3n Advertisement, Sellers pay a fee only when Buyers click on the Sellers' Advertisement. Dedw3n Advertisement is available for qualified Sellers who meet various quality metrics and are not found to be in violation of the Terms of Service and/or Dedw3n's Community Standards.",
    "2. Bids",
    "A bid is the highest amount the Seller is willing to pay for one click on their Dedw3n Advertisement' Ad. Higher bids may increase Sellers' chances of winning auctions; however, other metrics—such as relevancy or quality (the likelihood of views, sales, etc.)—are also taken into consideration for determining the service's \"Ad rank\", which ultimately determines the auction winners.",
    "Please note that the highest bid does not necessarily win the auction. High-quality services may win auctions with lower bids (while maintaining the highest Ad ranks). Under no circumstances does the Program constitute a guarantee or obligation by Dedw3n to promote your services. Furthermore, we cannot promise that an Ad will be clicked, nor that if the Ad is clicked, that the Dedw3n Ad will be purchased. Should you win an auction, the placement of your Dedw3n Ad, if any, will be subject to Dedw3n's sole choice and discretion. Bids are subject to minimum amounts set by Dedw3n in advance.",
    "3. Auction",
    "Dedw3n Advertisement are based on a \"First-Price Auction\" process, which means that while the service with the highest Ad rank wins, the price that the Seller will be charged for each click (Cost-Per-Click) is based on the bid for the winning Ad, and calculated automatically by Dedw3n. Click here to learn more.",
    "4. Advertisement Location",
    "Locations of Advertisement on the Site are based on a variety of factors, including the bid amount, the quality of the service, relevance, and others, and in any event, are subject, at any time, to Dedw3n's sole discretion.",
    "5. Daily Limit",
    "The daily limit is the maximum amount a Seller is willing to pay in a single day to promote their services. Sellers are required to define a daily limit in order to turn on Dedw3n Advertisement. A day, for this purpose, is defined as a calendar day in Coordinated Universal Time (UTC).",
    "Please note that there is no guarantee that the entire daily limit will be used on any day. The daily limit may be updated by the Seller at any point, with effect no later than the next business day.",
    "6. Payment Terms",
    "Dedw3n Advertisement' fees are charged on a monthly basis, during the first week of each calendar month, based on the clicks made in the previous month. By default, the fee is charged from the Seller's Dedw3n Credits and/or Dedw3n Balance (if there are not enough Dedw3n Credits). However, when there are no sufficient funds in the Seller's Dedw3n Balance, the remaining fee will be charged from the payment method defined by the Seller in their account, or deducted from the Seller's future earnings if no payment method is defined.",
    "Sellers may be charged with indirect taxes (such as Sales Tax, VAT, or GST) depending on residency, location, and any applicable law, in addition to the fee which was calculated in the auction process. Please note that the daily limit set by the Sellers does not include any and all taxes.",
    "For all other terms, please read the Purchasing section in our Terms of Service.",
    "7. Disclaimer of Warranties",
    "THE Dedw3n Advertisement PROGRAM IS PROVIDED ON AN \"AS IS\" AND \"AS AVAILABLE\" BASIS, WITHOUT ANY WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. NEITHER Dedw3n NOR ANY PERSON ASSOCIATED WITH Dedw3n MAKES ANY WARRANTY OR REPRESENTATION WITH RESPECT TO THE COMPLETENESS, SECURITY, RELIABILITY, QUALITY, ACCURACY, OR AVAILABILITY OF THE SERVICE. THE FOREGOING DOES NOT AFFECT ANY WARRANTIES WHICH CANNOT BE EXCLUDED OR LIMITED UNDER APPLICABLE LAW.",
    "8. Limitation on Liability",
    "IN NO EVENT WILL Dedw3n, ITS AFFILIATES OR THEIR LICENSORS, SERVICE PROVIDERS, EMPLOYEES, AGENTS, OFFICERS, OR DIRECTORS BE LIABLE FOR DAMAGES OF ANY KIND, UNDER ANY LEGAL THEORY, ARISING OUT OF OR IN CONNECTION WITH YOUR USE, OR INABILITY TO USE, THE SITE, ANY WEBSITES LINKED TO IT, ANY CONTENT ON THE WEBSITE OR SUCH OTHER WEBSITES OR ANY COURSES OR ITEMS OBTAINED THROUGH THE WEBSITE OR SUCH OTHER WEBSITES, INCLUDING ANY DIRECT, INDIRECT, SPECIAL, INCIDENTAL, CONSEQUENTIAL OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO, PERSONAL INJURY, PAIN AND SUFFERING, EMOTIONAL DISTRESS, LOSS OF REVENUE, LOSS OF PROFITS, LOSS OF BUSINESS OR ANTICIPATED SAVINGS, LOSS OF USE, LOSS OF GOODWILL, LOSS OF DATA, AND WHETHER CAUSED BY TORT (INCLUDING NEGLIGENCE), BREACH OF CONTRACT OR OTHERWISE, EVEN IF FORESEEABLE.",
    "THE FOREGOING DOES NOT AFFECT ANY LIABILITY WHICH CANNOT BE EXCLUDED OR LIMITED UNDER APPLICABLE LAW.",
    "We reserve the right to suspend your account should we notice any activity we determine fraudulent or inappropriate.",
    "Users who are suspended from Dedw3n due to a violation of our Terms of Service cannot access the Program.",
    "We may make changes to these Terms from time to time. When these changes are made, we will make a new copy of the Terms available on this page.",
    "You understand and agree that if you use the Service after the date on which the Terms have changed, we will treat your use as acceptance of the updated Terms.",
    "We reserve the right to suspend the Program at any time without notice."
  ];

  const { translations, isLoading } = useMasterBatchTranslation(advertisementTermsTexts, 'high');

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    );
  }

  const t = (index: number) => translations[index] || advertisementTermsTexts[index];

  return (
    <div className="prose prose-lg max-w-none text-gray-700 mb-8">
      <p className="mb-6">{t(1)}</p>
      <p className="mb-6">{t(2)}</p>
      
      <h3 className="text-xl font-semibold text-gray-800 mb-4">{t(3)}</h3>
      <p className="mb-6">{t(4)}</p>
      
      <h3 className="text-xl font-semibold text-gray-800 mb-4">{t(5)}</h3>
      <p className="mb-6">{t(6)}</p>
      <p className="mb-6">{t(7)}</p>
      
      <h3 className="text-xl font-semibold text-gray-800 mb-4">{t(8)}</h3>
      <p className="mb-6">{t(9)}</p>
      
      <h3 className="text-xl font-semibold text-gray-800 mb-4">{t(10)}</h3>
      <p className="mb-6">{t(11)}</p>
      
      <h3 className="text-xl font-semibold text-gray-800 mb-4">{t(12)}</h3>
      <p className="mb-6">{t(13)}</p>
      <p className="mb-6">{t(14)}</p>
      
      <h3 className="text-xl font-semibold text-gray-800 mb-4">{t(15)}</h3>
      <p className="mb-6">{t(16)}</p>
      <p className="mb-6">{t(17)}</p>
      
      <h3 className="text-xl font-semibold text-gray-800 mb-4">{t(18)}</h3>
      <p className="mb-6">{t(19)}</p>
      
      <h3 className="text-xl font-semibold text-gray-800 mb-4">{t(20)}</h3>
      <p className="mb-6">{t(21)}</p>
      
      <p className="mb-6">{t(22)}</p>
      <p className="mb-6">{t(23)}</p>
      <p className="mb-6">{t(24)}</p>
      <p className="mb-6">{t(25)}</p>
      <p className="mb-6">{t(26)}</p>
    </div>
  );
}

export default function PageContent({ pageId, showLastUpdated = true }: PageContentProps) {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  const { data: page, isLoading, error } = useQuery<PageData>({
    queryKey: [`/api/page/${pageId}`],
    enabled: isClient,
  });

  // Special handling for education policy page with translation
  if (pageId === "education-policy" && page) {
    return (
      <Container className="py-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">{page.title}</h1>
          <EducationPolicyContent />
          {showLastUpdated && page.lastUpdated && (
            <p className="text-sm text-gray-500 mt-12">
              Last updated: {format(new Date(page.lastUpdated), "MMMM dd, yyyy")}
            </p>
          )}
        </div>
      </Container>
    );
  }

  // Special handling for intellectual property page with translation
  if (pageId === "intellectual-property" && page) {
    return (
      <Container className="py-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">{page.title}</h1>
          <IntellectualPropertyContent />
          {showLastUpdated && page.lastUpdated && (
            <p className="text-sm text-gray-500 mt-12">
              Last updated: {format(new Date(page.lastUpdated), "MMMM dd, yyyy")}
            </p>
          )}
        </div>
      </Container>
    );
  }

  // Special handling for advertisement terms page with translation
  if (pageId === "advertisement-terms" && page) {
    return (
      <Container className="py-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">{page.title}</h1>
          <AdvertisementTermsContent />
          {showLastUpdated && page.lastUpdated && (
            <p className="text-sm text-gray-500 mt-12">
              Last updated: {format(new Date(page.lastUpdated), "MMMM dd, yyyy")}
            </p>
          )}
        </div>
      </Container>
    );
  }

  // Special handling for cookies page with translation
  if (pageId === "cookies" && page) {
    return (
      <Container className="py-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">{page.title}</h1>
          <CookiePolicyContent />
          {showLastUpdated && page.lastUpdated && (
            <p className="text-sm text-gray-500 mt-12">
              Last updated: {format(new Date(page.lastUpdated), "MMMM dd, yyyy")}
            </p>
          )}
        </div>
      </Container>
    );
  }

  // Special handling for tips-tricks page with translation
  if (pageId === "tips-tricks" && page) {
    return (
      <Container className="py-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">{page.title}</h1>
          <TipsTricksContent />
          {showLastUpdated && page.lastUpdated && (
            <p className="text-sm text-gray-500 mt-12">
              Last updated: {format(new Date(page.lastUpdated), "MMMM dd, yyyy")}
            </p>
          )}
        </div>
      </Container>
    );
  }

  // Special handling for catalogue-rules page with translation
  if (pageId === "catalogue-rules" && page) {
    return (
      <Container className="py-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">{page.title}</h1>
          <CatalogueRulesContent />
          {showLastUpdated && page.lastUpdated && (
            <p className="text-sm text-gray-500 mt-12">
              Last updated: {format(new Date(page.lastUpdated), "MMMM dd, yyyy")}
            </p>
          )}
        </div>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Container className="py-16">
        <Skeleton className="h-12 w-3/4 mb-8" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-5/6 mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-4/5 mb-6" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4 mb-6" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-5/6 mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Error Loading Content</h1>
          <p className="text-gray-700 mb-6">
            We're having trouble loading the content you requested. Please try again later.
          </p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">{page?.title}</h1>
        <div 
          className="prose prose-lg max-w-none text-gray-700 mb-8"
          dangerouslySetInnerHTML={{ __html: page?.content || "" }}
        />
        {showLastUpdated && page?.lastUpdated && (
          <p className="text-sm text-gray-500 mt-12">
            Last updated: {format(new Date(page.lastUpdated), "MMMM dd, yyyy")}
          </p>
        )}
      </div>
    </Container>
  );
}