import { useEffect } from 'react';

export default function NetworkPartnershipResources() {
  // Set document title on mount
  useEffect(() => {
    document.title = "Network Partnership Resources - Dedw3n";
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Header Image Section */}
      <div className="w-full max-w-6xl mx-auto">
        <img 
          src="/attached_assets/Dedw3n Business  (6)_1753734936099.png"
          alt="Dedw3n Network Partnership - Professional business networking and partnerships"
          className="w-full h-auto object-cover"
        />
      </div>

      {/* Content Section */}
      <div className="max-w-6xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Network Partnership Resources</h1>
          
          <div className="space-y-8 text-gray-700 leading-relaxed">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">About Network Partnerships</h2>
              <p>
                Our Network Partnership program connects transportation, logistics, export/import companies, manufacturers, farmers, and miners across global markets. We facilitate dynamic supply chain connections that bridge developed and emerging markets, creating opportunities for sustainable business growth and expansion.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Partnership Benefits</h2>
              <ul className="space-y-3">
                <li><strong>Global Market Access:</strong> Connect with verified partners across multiple continents and industries.</li>
                <li><strong>Supply Chain Optimization:</strong> Streamline your operations through strategic partnerships and shared resources.</li>
                <li><strong>Risk Mitigation:</strong> Diversify your supplier and buyer network to reduce business risks.</li>
                <li><strong>Technology Integration:</strong> Access our platform's advanced tools for partner discovery and relationship management.</li>
                <li><strong>Regulatory Support:</strong> Navigate international trade regulations with expert guidance and partner support.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Partnership Types</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Transportation & Logistics</h3>
                  <p>Connect with freight companies, shipping providers, warehousing facilities, and last-mile delivery services.</p>
                </div>
                
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Export & Import</h3>
                  <p>Partner with international trade specialists, customs brokers, and market entry consultants.</p>
                </div>
                
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Manufacturing</h3>
                  <p>Access production facilities, contract manufacturers, and quality assurance partners globally.</p>
                </div>
                
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Agriculture & Mining</h3>
                  <p>Connect with farmers, agricultural producers, mining companies, and raw material suppliers.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Getting Started</h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Complete Partnership Application</h4>
                    <p>Submit your company information and partnership requirements through our secure application process.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Verification & Matching</h4>
                    <p>Our team verifies your credentials and matches you with compatible partners based on your business needs.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Begin Collaboration</h4>
                    <p>Start building relationships, executing contracts, and expanding your global network through our platform.</p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Support & Resources</h2>
              <p>
                Our dedicated network partnership team provides ongoing support to ensure successful collaborations. Access training materials, best practices guides, and technical support through our comprehensive resource center.
              </p>
              
              <div className="mt-6 space-y-2">
                <p><strong>Partnership Support:</strong> <a href="mailto:partnerships@dedw3n.com" className="text-blue-600 hover:underline">partnerships@dedw3n.com</a></p>
                <p><strong>Technical Support:</strong> <a href="mailto:support@dedw3n.com" className="text-blue-600 hover:underline">support@dedw3n.com</a></p>
                <p><strong>General Inquiries:</strong> <a href="mailto:info@dedw3n.com" className="text-blue-600 hover:underline">info@dedw3n.com</a></p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}