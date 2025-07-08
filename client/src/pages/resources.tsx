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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Affiliate Resources</h1>
          
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">About Dedw3n</h2>
          <p className="text-gray-700 mb-6">
            Dedw3n is a revolutionary social marketplace platform that connects people worldwide through 
            innovative technology and meaningful experiences. We combine the power of social networking 
            with robust e-commerce capabilities to create a unique ecosystem where users can discover, 
            connect, and transact with confidence.
          </p>
          <p className="text-gray-700 mb-8">
            Our platform facilitates authentic connections across diverse communities, offering everything 
            from product discovery to meaningful relationships. With advanced matching algorithms and 
            comprehensive safety features, we're building the future of social commerce.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Mission & Goals</h2>
          <h3 className="text-xl font-medium text-gray-900 mb-3">Our Mission</h3>
          <p className="text-gray-700 mb-4">
            To create a global community where authentic connections drive meaningful commerce 
            and lasting relationships.
          </p>
          <h3 className="text-xl font-medium text-gray-900 mb-3">Our Goals</h3>
          <ul className="text-gray-700 mb-8 list-disc pl-6">
            <li>Democratize global commerce</li>
            <li>Foster genuine connections</li>
            <li>Ensure user safety & privacy</li>
            <li>Drive innovation in social tech</li>
          </ul>

          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Affiliate Benefits</h2>
          <p className="text-gray-700 mb-4">
            <strong>Commission Rate:</strong> 25% industry-leading rates
          </p>
          <p className="text-gray-700 mb-4">
            <strong>Real-time Tracking:</strong> 24/7 live performance data
          </p>
          <p className="text-gray-700 mb-4">
            <strong>Minimum Payout:</strong> $0 - No threshold limits
          </p>
          <p className="text-gray-700 mb-8">
            <strong>Cookie Duration:</strong> 30 days tracking window
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mb-4">24/7 Support</h2>
          <p className="text-gray-700 mb-4">
            <strong>Live Chat Support:</strong> Instant help when you need it most
          </p>
          <p className="text-gray-700 mb-4">
            <strong>Email Support:</strong> partnerships@dedw3n.com
          </p>
          <p className="text-gray-700 mb-4">
            <strong>Dedicated Account Manager:</strong> Personal guidance for top performers
          </p>
          <p className="text-gray-700 mb-8">
            <strong>Comprehensive Documentation:</strong> Guides, tutorials, and best practices
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Strong Community</h2>
          <p className="text-gray-700 mb-4">
            <strong>Partner Forums:</strong> Connect with fellow affiliates
          </p>
          <p className="text-gray-700 mb-4">
            <strong>Weekly Webinars:</strong> Learn from industry experts
          </p>
          <p className="text-gray-700 mb-4">
            <strong>Networking Events:</strong> Build valuable connections
          </p>
          <p className="text-gray-700 mb-8">
            <strong>Recognition Programs:</strong> Celebrate your achievements
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Ready to Get Started?</h2>
          <p className="text-gray-700 mb-4">
            Join thousands of successful affiliates and start earning with Dedw3n today.
          </p>
          <p className="text-gray-700">
            Questions? Contact us at{' '}
            <a 
              href="mailto:partnerships@dedw3n.com" 
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              partnerships@dedw3n.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}