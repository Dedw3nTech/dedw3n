import { Container } from "@/components/ui/container";
import { useEffect, useMemo } from "react";
import { useMasterBatchTranslation } from "@/hooks/use-master-translation";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

// Component for rendering translated Privacy Policy content
function PrivacyContent() {
  // All the text content from the privacy policy
  const privacyTexts = [
    "Privacy Policy",
    "When it comes to your personal data, safety and transparency take top priority here at Dedw3n. To help you understand what information we collect about you, how we use it and what rights you have, we've prepared this detailed Privacy Policy.",
    "General",
    "This Privacy Policy pertains to the online platform Dedw3n (\"Website\") and its associated application (\"App\"), collectively referred to as the \"Platform,\" intended for users in the United States.",
    "The data controller of your personal data is a British company registered in England, Wales, and Scotland under registration number 15930281, with its registered office located at 50 Essex Street, London, England, WC2R 3JF. The data controller will be referred to as \"We,\" \"Us,\" or \"Dedw3n.\" For further inquiries, please contact us at legal@dedw3n.com.",
    "We take your privacy very seriously. All personal data will be collected, stored, and used in accordance with the European Union General Data Protection Regulation No. 2016/679 (\"GDPR\") and any other applicable statutory regulations. Additionally, if you are a California resident, your personal data will be managed in compliance with the California Privacy Rights Act (CPRA), also known as Proposition 24.",
    "Our services, provided through the Website and/or App, require the collection, storage, transfer, deletion, and/or other use (\"collect and use\") of specific data related to you (\"personal data\" or \"data\"). Personal data encompasses all information that relates to an identified or identifiable natural person, such as your name, date of birth, address, or email address.",
    "This Privacy Policy outlines the types of data we collect from you, the purposes for which we collect and utilize this data when you engage with our services on the Platform, and essential information regarding the protection of your data, particularly the statutory rights you possess in relation to it.",
    "Certain services offered on our platform may be provided by third-party suppliers. When you utilize these services, the data protection regulations governing those suppliers will apply. Prior to using such services, these third-party suppliers may require your consent in accordance with data protection laws.",
    "Under applicable data protection laws, Dedw3n is obligated to inform you about data processing, a responsibility we fulfill within this Privacy Policy. It is important to note that this Privacy Policy, in its entirety or in parts, does not constitute contractual clauses and is not part of the Terms of Service (TOS) established with registered users.",
    "Why and How Do We Collect and Use Your Personal Data?",
    "We collect and utilize your personal data to facilitate your use of the platform, deliver our services, and fulfil our contractual obligations (TOS). This includes enabling commercial transactions via the platform, utilizing the electronic payment system, and facilitating reviews and communication with other members. To access these services, you must create a Dedw3n account by registering as a member on our website or app.",
    "Most of the personal data we collect is essential for fulfilling our contractual obligations (TOS) with you. Without this information, we would be unable to enter into or fulfil a contract (TOS) with you. Additionally, certain data is necessary for us to comply with legal obligations as a member of our platform.",
    "We also utilize your data to enhance and improve the platform, ultimately enriching the user experience for our members. We will retain and use your personal data for these purposes until your Dedw3n account is deactivated or remains inactive for a period of five (5) years.",
    "Data Collection Purposes",
    "To facilitate user registration on the Platform",
    "To allow you to set up your profile information",
    "To provide other members with relevant information regarding your activity on the Platform",
    "To enable you to list your items",
    "To provide notifications on the Platform",
    "To facilitate communication with other members",
    "To allow you to post on the General Feed",
    "To enable you to leave reviews for other members on the Platform",
    "To receive reviews from other members",
    "To accept gifts from other members",
    "To allow participation in the forum and discussions within our community",
    "To address your public feedback about our services",
    "To send you important communications regarding the Platform",
    "To deliver offers through the Platform's messaging system",
    "To provide customer support services",
    "To resolve any purchase-related disputes between members",
    "To temporarily retain your deactivated account",
    "To enhance your overall experience while using the Platform",
    "Platform Enhancement",
    "We collect and utilize your personal data to enhance your experience on the Platform. This includes enabling the personalization of your feed and search results, providing relevant suggestions, storing your previous searches, sending notifications, and generally making your interaction with the Platform more enjoyable.",
    "Enhancement Features",
    "To customize your feed and search results according to your preferences",
    "To prioritize high-value items for sale from reputable sellers",
    "To recommend relevant items tailored to your interests",
    "To suggest appropriate item descriptions",
    "To enhance search results on the Platform",
    "To retain records of your recent searches",
    "To increase visibility for your listings",
    "To propose a price during the creation of an item listing",
    "To facilitate notifications about your favourite items",
    "To inform sellers when you add their items to your favourites",
    "To enable you to follow other members",
    "To improve our Platform continuously",
    "To conduct surveys and interviews to gather feedback",
    "To allow you to share your user journey",
    "To enable automatic content translation",
    "Security Measures",
    "To ensure the security of your account and the overall Platform",
    "Dedw3n is committed to safeguarding our member accounts and the Platform from cyber threats, unauthorized access, and other similar risks. Our security measures include:",
    "Security Features",
    "Monitoring visits to the Platform for security purposes",
    "Assisting you in avoiding the use of compromised passwords",
    "Facilitating password resets",
    "Verifying accounts in response to suspicious activities",
    "Conducting phone number and two-step verifications",
    "Implementing security checks for payment sources",
    "Performing security checks for PayPal accounts",
    "Preventing fraudulent transactions",
    "Ensuring compliance with our Authenticity Policy for listings",
    "Conducting ownership verifications for accounts",
    "Providing a mechanism for reporting inappropriate behaviour or content",
    "Addressing reports of suicidal posts",
    "Supervising compliance with and enforcing our Terms of Service (TOS)",
    "Platform Monitoring",
    "Dedw3n actively monitors compliance with and enforces TOS to ensure both your account's security and the overall integrity of the Platform.",
    "Monitoring Activities",
    "Calculate the trust score",
    "Identify and prevent malicious accounts and activities",
    "Enforce spam filtering measures",
    "Moderate user activity on the platform",
    "Issue and enforce warnings as necessary",
    "Remove or conceal content that is illegal or violates our Terms of Service",
    "Detect and lock compromised accounts",
    "Suspend members when appropriate",
    "Enforce bans as required",
    "Implement IP blocks to mitigate abuse",
    "Restrict fraudulent use of payment instruments",
    "Verify the ownership of accounts suspected to belong to minors",
    "Payment Processing",
    "Facilitate payment processing for items. Payments made on the Platform are carried out via payment service providers that offer payment processing and escrow services.",
    "The majority of your personal data is essential for fulfilling our contractual obligations with you, as outlined in our Terms of Service (TOS). Failure to provide this information will hinder our ability to enter into and execute the contract.",
    "Payment Features",
    "Facilitating purchases and enabling the addition of payment cards",
    "Allowing the addition of bank accounts for withdrawal purposes",
    "Enabling payment processing and receipt of payments on our platform",
    "Supporting donation transactions",
    "Implementing Know Your Customer (KYC) checks",
    "Processing refunds and maintaining accurate financial records",
    "Ensuring the shipment of items purchased through the platform",
    "Shipping Services",
    "Dedw3n is committed to providing a seamless shipping experience by offering various shipping methods. Most personal data is essential for fulfilling our Terms of Service (TOS) contract; without it, we cannot enter into or fulfil this agreement.",
    "Shipping Features",
    "Enabling you to ship or receive items and track your parcels",
    "Marketing Activities",
    "Conducting marketing activities that engage our members and provide relevant information",
    "Sending marketing emails and personalizing marketing communications to better suit your preferences",
    "To contact you for publicity and/or earning opportunities",
    "To conduct advertisement campaigns involving you",
    "To feature your items in marketing campaigns",
    "To allow you to see personalized advertisements",
    "Information is collected for this purpose by advertising service partners and is not stored by Dedw3n.",
    "To evaluate efficiency of promotional campaigns",
    "To manage our social media profiles",
    "To enable you to participate in Dedw3n's referrals program",
    "Legal Purposes",
    "To handle your requests related to personal data",
    "To provide information to law enforcement and other state institutions",
    "To defend our rights against chargebacks",
    "To defend the rights and interests of Dedw3n",
    "Personal Data Recipients",
    "Dedw3n transfers or shares personal data with service providers only to the extent necessary and permitted in accordance with applicable laws. The specific service providers to whom your personal data is transferred or shared for particular purposes are outlined above.",
    "We conduct ongoing technical maintenance and upgrades to the Platform to safeguard the security and confidentiality of the personal data we process. This also facilitates various business-related functions that enhance the availability and functionality of our services.",
    "The following service provider is located outside the European Economic Area (EEA), which may result in your data being transferred internationally. In such cases, personal data is protected through the service provider's adherence to the EU standard contractual clauses for data transfer as approved by the European Commission:",
    "1. Cloudflare, Inc. (USA).",
    "We may also transfer personal data to attorneys, legal assistants, notaries, bailiffs, auditors, accountants, bookkeepers, debt collectors, consultants, translation agencies, IT service providers, insurance companies, and archiving services that support Dedw3n.",
    "Dedw3n is legally required to provide personal and/or usage data to investigative, criminal prosecution, or supervisory authorities when necessary to mitigate public risk or to prosecute criminal activities.",
    "Additionally, Dedw3n may share your data with third parties when transferring rights and obligations related to our contractual relationship, in accordance with the Terms of Service (TOS).",
    "Use of Cookies",
    "Dedw3n uses cookies and similar technologies on the Platform. You can find out more by visiting our Cookie Policy.",
    "Right of Amendment",
    "As our services are constantly evolving, we reserve the right to change this Privacy Policy at any time subject to the applicable regulations. Any changes will be published promptly on this page. You should, nevertheless, check this page regularly for any updates.",
    "Your Statutory Rights Regarding Personal Data",
    "In accordance with the statutory data protection provisions, you possess certain rights related to your personal data, subject to specific conditions, limitations, and exceptions. These rights include:",
    "Your Rights",
    "Right to Access: You have the right to be informed about the data we collect and utilize, as well as to request access to or a copy of such data.",
    "Right to Rectification: You may demand the correction of any inaccurate data and, depending on the nature of the data collection and use, the completion of incomplete data.",
    "Right to Deletion: You may request the deletion of your data, provided there is just cause for such a request.",
    "Right to Restrict Processing: You can demand that the collection and use of your data be restricted, provided that the legal criteria are met.",
    "Right to Data Portability: Subject to legal criteria, you have the right to receive the data you have provided in a structured, current, and machine-readable format.",
    "Right to Object: You have the right to object to the collection and use of your data, particularly if such actions are based on the performance of a task carried out in the public interest or in the exercise of official authority.",
    "Right to Withdraw Consent: You may revoke any permissions granted to us at any time. Such revocation will not affect the legality of data collection and use conducted prior to the revocation based on the granted permission.",
    "Protection Against Discrimination: You have the right not to be subjected to discriminatory treatment while exercising any of the aforementioned rights.",
    "To exercise any of these rights, please contact Dedw3n using the contact information provided below.",
    "California Privacy Policy",
    "This Privacy Policy pertains to the online platform Dedw3n.com (\"Website\") and the associated application (\"App\") (collectively referred to as the \"Platform\") operated by Dedw3n. We are committed to upholding your confidence and trust regarding the privacy of your information.",
    "Overview of this California Privacy Policy",
    "The California Consumer Privacy Act of 2018 (\"CCPA\") and other relevant privacy laws provide California consumers with specific rights concerning their personal information. These rights are in addition to any privacy rights described in the Dedw3n Privacy Policy.",
    "What is \"personal information\"?",
    "For the purposes of this California Privacy Policy, \"personal information\" is defined as any information that identifies, relates to, describes, or could reasonably be linked, directly or indirectly, to a specific California consumer or household.",
    "What are \"California consumers\"?",
    "A \"California consumer\" is defined as a natural person who resides in California. For the purposes of this California Privacy Policy, this term does not include individuals acting in the capacity of an employee, owner, director, officer, or contractor of a business entity.",
    "How We Collect, Use, and Share Personal Information",
    "Dedw3n may collect personal information from you through various methods and for distinct purposes. It is important to recognize that the types of personal information we gather will vary based on your interactions with us, including the specific products or services you utilize.",
    "Categories of Personal Information",
    "Identifiers: This includes your name, postal address, unique personal identifier, online identifier, email address, account name, and other similar identifiers.",
    "Demographic Information: This encompasses characteristics protected by law, such as gender or age.",
    "Commercial Information: This includes details regarding your purchasing and shipping history.",
    "Internet or Other Electronic Network Activity Information: This refers to the data we collect when you interact with our website.",
    "Audio, Electronic, Visual, or Similar Information: This includes photographs or voice recordings.",
    "Geolocation Data: This consists of information regarding your device's location, such as that derived from your IP address.",
    "Information Sources",
    "We obtain the categories of personal information listed above from the following sources:",
    "1. Directly from You: For example, when you register as a member on the platform, enter your Google or Facebook login details, list items, communicate with other members, or submit queries, requests, or complaints.",
    "2. Information Generated About You: This includes data collected through cookies and similar technologies, as described in our Cookie Policy.",
    "3. Your Activity on the Platform: Automatically collected usage information related to your interactions on the platform.",
    "4. Third-Party Suppliers: Information obtained from third-party suppliers that engage with us in connection with the services they provide.",
    "5. Affiliated Businesses: Information sourced from our affiliated businesses.",
    "CCPA Rights for California Consumers",
    "The California Consumer Privacy Act (CCPA) grants California residents specific rights concerning their personal information. This section outlines those rights.",
    "1. Right to Know about and Access Your Personal Information",
    "2. Right to Delete Your Personal Information",
    "3. Right to Opt-Out of the Sale of Your Personal Information",
    "4. Right to Non-Discrimination",
    "5. How to Submit a Request",
    "6. Submitting a Request through Your Authorized Agent",
    "7. How We Verify Your Request",
    "Contact Us",
    "If you have any questions about this Privacy Policy or wish to exercise your rights, please contact us at legal@dedw3n.com",
    "Last updated:"
  ];

  const { translations, isLoading } = useMasterBatchTranslation(privacyTexts, 'high');

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

  const t = (index: number) => translations[index] || privacyTexts[index];

  return (
    <div className="prose prose-lg max-w-none text-gray-700 mb-8">
      <div className="privacy-section">
        <p className="text-lg mb-6">{t(1)}</p>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{t(2)}</h2>
        <p className="mb-4">{t(3)}</p>
        <p className="mb-4">{t(4)}</p>
        <p className="mb-4">{t(5)}</p>
        <p className="mb-4">{t(6)}</p>
        <p className="mb-4">{t(7)}</p>
        <p className="mb-4">{t(8)}</p>
        <p className="mb-6">{t(9)}</p>

        <h2 className="text-2xl font-bold text-gray-900 mb-6">{t(10)}</h2>
        <p className="mb-4">{t(11)}</p>
        <p className="mb-4">{t(12)}</p>
        <p className="mb-6">{t(13)}</p>

        <h3 className="text-xl font-semibold text-gray-800 mb-4">{t(14)}</h3>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li>{t(15)}</li>
          <li>{t(16)}</li>
          <li>{t(17)}</li>
          <li>{t(18)}</li>
          <li>{t(19)}</li>
          <li>{t(20)}</li>
          <li>{t(21)}</li>
          <li>{t(22)}</li>
          <li>{t(23)}</li>
          <li>{t(24)}</li>
          <li>{t(25)}</li>
          <li>{t(26)}</li>
          <li>{t(27)}</li>
          <li>{t(28)}</li>
          <li>{t(29)}</li>
          <li>{t(30)}</li>
          <li>{t(31)}</li>
        </ul>

        <h3 className="text-xl font-semibold text-gray-800 mb-4">{t(32)}</h3>
        <p className="mb-4">{t(33)}</p>
        
        <h4 className="text-lg font-medium text-gray-700 mb-3">{t(34)}</h4>
        <ul className="list-disc pl-6 mb-6 space-y-1">
          <li>{t(35)}</li>
          <li>{t(36)}</li>
          <li>{t(37)}</li>
          <li>{t(38)}</li>
          <li>{t(39)}</li>
          <li>{t(40)}</li>
          <li>{t(41)}</li>
          <li>{t(42)}</li>
          <li>{t(43)}</li>
          <li>{t(44)}</li>
          <li>{t(45)}</li>
          <li>{t(46)}</li>
        </ul>

        <h3 className="text-xl font-semibold text-gray-800 mb-4">{t(47)}</h3>
        <h4 className="text-lg font-medium text-gray-700 mb-3">{t(48)}</h4>
        <p className="mb-4">{t(49)}</p>
        
        <h4 className="text-lg font-medium text-gray-700 mb-3">{t(50)}</h4>
        <ul className="list-disc pl-6 mb-6 space-y-1">
          <li>{t(51)}</li>
          <li>{t(52)}</li>
          <li>{t(53)}</li>
          <li>{t(54)}</li>
          <li>{t(55)}</li>
          <li>{t(56)}</li>
          <li>{t(57)}</li>
          <li>{t(58)}</li>
          <li>{t(59)}</li>
          <li>{t(60)}</li>
          <li>{t(61)}</li>
          <li>{t(62)}</li>
          <li>{t(63)}</li>
        </ul>

        <h3 className="text-xl font-semibold text-gray-800 mb-4">{t(64)}</h3>
        <p className="mb-4">{t(65)}</p>
        
        <h4 className="text-lg font-medium text-gray-700 mb-3">{t(66)}</h4>
        <ul className="list-disc pl-6 mb-6 space-y-1">
          <li>{t(67)}</li>
          <li>{t(68)}</li>
          <li>{t(69)}</li>
          <li>{t(70)}</li>
          <li>{t(71)}</li>
          <li>{t(72)}</li>
        </ul>

        <h3 className="text-xl font-semibold text-gray-800 mb-4">{t(73)}</h3>
        <p className="mb-4">{t(74)}</p>
        
        <h4 className="text-lg font-medium text-gray-700 mb-3">{t(75)}</h4>
        <ul className="list-disc pl-6 mb-6 space-y-1">
          <li>{t(76)}</li>
          <li>{t(77)}</li>
          <li>{t(78)}</li>
          <li>{t(79)}</li>
          <li>{t(80)}</li>
          <li>{t(81)}</li>
          <li>{t(82)}</li>
          <li>{t(83)}</li>
          <li>{t(84)}</li>
          <li>{t(85)}</li>
          <li>{t(86)}</li>
        </ul>

        <h3 className="text-xl font-semibold text-gray-800 mb-4">{t(87)}</h3>
        <p className="mb-4">{t(88)}</p>
        <p className="mb-4">{t(89)}</p>
        
        <h4 className="text-lg font-medium text-gray-700 mb-3">{t(90)}</h4>
        <ul className="list-disc pl-6 mb-6 space-y-1">
          <li>{t(91)}</li>
          <li>{t(92)}</li>
          <li>{t(93)}</li>
          <li>{t(94)}</li>
          <li>{t(95)}</li>
          <li>{t(96)}</li>
          <li>{t(97)}</li>
        </ul>

        <h3 className="text-xl font-semibold text-gray-800 mb-4">{t(98)}</h3>
        <p className="mb-4">{t(99)}</p>
        
        <h4 className="text-lg font-medium text-gray-700 mb-3">{t(100)}</h4>
        <p className="mb-4">{t(101)}</p>

        <h3 className="text-xl font-semibold text-gray-800 mb-4">{t(102)}</h3>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li>{t(103)}</li>
          <li>{t(104)}</li>
          <li>{t(105)}</li>
          <li>{t(106)}</li>
          <li>{t(107)}</li>
          <li>{t(108)}</li>
          <li>{t(109)}</li>
          <li>{t(110)}</li>
          <li>{t(111)}</li>
        </ul>

        <h3 className="text-xl font-semibold text-gray-800 mb-4">{t(112)}</h3>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li>{t(113)}</li>
          <li>{t(114)}</li>
          <li>{t(115)}</li>
          <li>{t(116)}</li>
        </ul>

        <h3 className="text-xl font-semibold text-gray-800 mb-4">{t(117)}</h3>
        <p className="mb-4">{t(118)}</p>
        <p className="mb-4">{t(119)}</p>
        <p className="mb-4">{t(120)}</p>
        <p className="mb-4">{t(121)}</p>
        <p className="mb-4">{t(122)}</p>
        <p className="mb-4">{t(123)}</p>
        <p className="mb-6">{t(124)}</p>

        <h3 className="text-xl font-semibold text-gray-800 mb-4">{t(125)}</h3>
        <p className="mb-6">{t(126)}</p>

        <h3 className="text-xl font-semibold text-gray-800 mb-4">{t(127)}</h3>
        <p className="mb-6">{t(128)}</p>

        <h3 className="text-xl font-semibold text-gray-800 mb-4">{t(129)}</h3>
        <p className="mb-4">{t(130)}</p>
        
        <h4 className="text-lg font-medium text-gray-700 mb-3">{t(131)}</h4>
        <ul className="list-disc pl-6 mb-6 space-y-1">
          <li>{t(132)}</li>
          <li>{t(133)}</li>
          <li>{t(134)}</li>
          <li>{t(135)}</li>
          <li>{t(136)}</li>
          <li>{t(137)}</li>
          <li>{t(138)}</li>
        </ul>

        <h2 className="text-2xl font-bold text-gray-900 mb-6">{t(139)}</h2>
        <p className="mb-4">{t(140)}</p>
        
        <h3 className="text-xl font-semibold text-gray-800 mb-4">{t(141)}</h3>
        <p className="mb-4">{t(142)}</p>
        
        <h4 className="text-lg font-medium text-gray-700 mb-3">{t(143)}</h4>
        <p className="mb-4">{t(144)}</p>
        
        <h4 className="text-lg font-medium text-gray-700 mb-3">{t(145)}</h4>
        <p className="mb-6">{t(146)}</p>

        <h3 className="text-xl font-semibold text-gray-800 mb-4">{t(147)}</h3>
        <p className="mb-4">{t(148)}</p>
        
        <h4 className="text-lg font-medium text-gray-700 mb-3">{t(149)}</h4>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li>{t(150)}</li>
          <li>{t(151)}</li>
          <li>{t(152)}</li>
          <li>{t(153)}</li>
          <li>{t(154)}</li>
          <li>{t(155)}</li>
        </ul>

        <h4 className="text-lg font-medium text-gray-700 mb-3">{t(156)}</h4>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li>{t(157)}</li>
          <li>{t(158)}</li>
          <li>{t(159)}</li>
          <li>{t(160)}</li>
          <li>{t(161)}</li>
        </ul>

        <h3 className="text-xl font-semibold text-gray-800 mb-4">{t(162)}</h3>
        <p className="mb-4">{t(163)}</p>
        
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li>{t(164)}</li>
          <li>{t(165)}</li>
          <li>{t(166)}</li>
          <li>{t(167)}</li>
          <li>{t(168)}</li>
          <li>{t(169)}</li>
          <li>{t(170)}</li>
        </ul>

        <div className="mb-8">
          <h3 className="text-lg font-semibold text-black mb-2">{t(171)}</h3>
          <p className="text-black">{t(172)}</p>
        </div>
      </div>
    </div>
  );
}

export default function PrivacyPage() {
  // Set document title on mount
  useEffect(() => {
    document.title = "Privacy Policy - Dedw3n";
  }, []);

  return (
    <Container className="py-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
        <PrivacyContent />
        <p className="text-sm text-gray-500 mt-12">
          Last updated: {format(new Date(), "MMMM dd, yyyy")}
        </p>
      </div>
    </Container>
  );
}