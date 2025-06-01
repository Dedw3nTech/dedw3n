import { usePageTitle } from "@/hooks/usePageTitle";

export default function Partnerships() {
  usePageTitle({ title: "Partnerships" });

  const partners = [
    {
      name: "Stripe",
      category: "Payment Processing",
      description: "Secure payment processing for all transactions including subscriptions and one-time payments",
      website: "https://stripe.com",
      integration: "Payment Gateway & Subscription Management"
    },
    {
      name: "PayPal",
      category: "Payment Processing", 
      description: "Alternative payment method for global transactions and buyer protection",
      website: "https://paypal.com",
      integration: "Secondary Payment Gateway"
    },
    {
      name: "Pawapay",
      category: "Payment Processing",
      description: "Mobile payment platform enabling seamless transactions across Africa",
      website: "https://pawapay.co.uk",
      integration: "Mobile Payment Gateway for Africa"
    },

    {
      name: "Neon Database",
      category: "Database Infrastructure",
      description: "Serverless PostgreSQL database for scalable data storage and management",
      website: "https://neon.tech",
      integration: "Primary Database"
    },
    {
      name: "Firebase",
      category: "Authentication & Storage",
      description: "User authentication system and cloud storage for media files",
      website: "https://firebase.google.com",
      integration: "Authentication & File Storage"
    },

  ];

  const categories = Array.from(new Set(partners.map(p => p.category)));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 text-left">Partnerships</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Dedw3n is built on a foundation of trusted technology partners and APIs that enable us to deliver 
            a secure, scalable, and feature-rich marketplace experience.
          </p>
        </div>

        {categories.map(category => (
          <div key={category} className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 border-b border-gray-200 pb-2">
              {category}
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {partners
                .filter(partner => partner.category === category)
                .map(partner => (
                  <div key={partner.name} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-xl font-semibold text-gray-900">{partner.name}</h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {partner.category}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-4">{partner.description}</p>
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="font-medium text-gray-900">Integration:</span>
                        <span className="text-gray-600 ml-1">{partner.integration}</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium text-gray-900">Website:</span>
                        <a 
                          href={partner.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 ml-1 underline"
                        >
                          {partner.website.replace('https://', '')}
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}

        <div className="bg-white rounded-lg shadow-md p-8 mt-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Partnership Opportunities</h2>
          <p className="text-gray-600 mb-6">
            We're always looking to partner with innovative technology companies that share our vision 
            of creating the best marketplace experience. If you're interested in becoming a technology 
            partner or have a service that could benefit our platform, we'd love to hear from you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="/contact"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-black hover:bg-gray-800 transition-colors"
            >
              Contact Us for Partnerships
            </a>
            <a
              href="mailto:partnerships@dedw3n.com"
              className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              partnerships@dedw3n.com
            </a>
          </div>
        </div>

        <div className="bg-gray-100 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Security & Compliance</h3>
          <p className="text-gray-600 text-sm">
            All our technology partners are carefully vetted for security, reliability, and compliance standards. 
            We ensure that every integration meets our strict requirements for data protection, privacy, and 
            user security. Our partnerships are governed by comprehensive agreements that prioritize user trust and platform integrity.
          </p>
        </div>
      </div>
    </div>
  );
}