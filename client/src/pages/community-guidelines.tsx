import { Link } from "wouter";

export default function CommunityGuidelines() {
  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-900 rounded-lg shadow-sm p-8">
            <div className="mb-8">
              <Link href="/" className="text-primary hover:underline text-sm mb-4 inline-block">
                ← Back to Home
              </Link>
              <h1 className="text-3xl font-bold text-white mb-4">Community Guidelines</h1>
              <p className="text-gray-300">
                Welcome to Dedw3n! These guidelines help ensure our community remains a safe, inclusive, and positive space for everyone.
              </p>
            </div>

            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Respectful Communication</h2>
                <div className="space-y-3 text-gray-700">
                  <p>• Treat all community members with respect and kindness</p>
                  <p>• Use appropriate language and avoid offensive content</p>
                  <p>• Respect different perspectives and engage in constructive dialogue</p>
                  <p>• No harassment, bullying, or discriminatory behavior</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Marketplace Ethics</h2>
                <div className="space-y-3 text-gray-700">
                  <p>• Provide accurate descriptions and images of products or services</p>
                  <p>• Honor your commitments and complete transactions as agreed</p>
                  <p>• Report any fraudulent or suspicious activity immediately</p>
                  <p>• Respect intellectual property rights</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Content Standards</h2>
                <div className="space-y-3 text-gray-700">
                  <p>• Share content that is relevant and valuable to the community</p>
                  <p>• No spam, excessive self-promotion, or duplicate posts</p>
                  <p>• Respect privacy and do not share personal information without consent</p>
                  <p>• Report inappropriate content using our reporting tools</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Dating & Social Interactions</h2>
                <div className="space-y-3 text-gray-700">
                  <p>• Be genuine and honest in your profile and interactions</p>
                  <p>• Respect boundaries and consent in all communications</p>
                  <p>• Report any inappropriate behavior or harassment</p>
                  <p>• No solicitation for commercial purposes in dating sections</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Prohibited Activities</h2>
                <div className="space-y-3 text-gray-700">
                  <p>• No illegal activities or content</p>
                  <p>• No hate speech, threats, or violent content</p>
                  <p>• No impersonation of others or false identities</p>
                  <p>• No unauthorized access or attempts to breach security</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Enforcement</h2>
                <div className="space-y-3 text-gray-700">
                  <p>• Violations may result in content removal, warnings, or account suspension</p>
                  <p>• Repeated violations may lead to permanent account termination</p>
                  <p>• Appeals can be submitted through our support channels</p>
                  <p>• We reserve the right to modify these guidelines as needed</p>
                </div>
              </section>

              <section className="bg-gray-50 p-6 rounded-lg">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Need Help?</h2>
                <p className="text-gray-700 mb-4">
                  If you have questions about these guidelines or need to report a violation, please contact our support team.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/contact" className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition-colors text-center">
                    Contact Support
                  </Link>
                  <Link href="/faq" className="bg-white text-primary border border-primary px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors text-center">
                    View FAQ
                  </Link>
                </div>
              </section>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Last updated: January 2025
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}