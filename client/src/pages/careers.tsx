export default function CareersPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Careers</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 mb-6">
              Join our team and help us build the future of social commerce.
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
              Why Work With Us
            </h2>
            <p className="text-gray-700 mb-6">
              We're building a platform that connects people and businesses around the world. 
              Our team is passionate about creating innovative solutions that make a difference.
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
              Open Positions
            </h2>
            <p className="text-gray-700 mb-6">
              We're always looking for talented individuals to join our team. 
              Check back soon for available positions.
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
              Get In Touch
            </h2>
            <p className="text-gray-700">
              Interested in joining our team? Send us your resume and portfolio at{' '}
              <a href="mailto:careers@dedw3n.com" className="text-primary hover:underline">
                careers@dedw3n.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
