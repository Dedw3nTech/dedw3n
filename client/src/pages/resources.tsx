import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Users, Target, Heart, Headphones, Shield, TrendingUp, Award, Globe, Clock } from 'lucide-react';

export default function Resources() {
  // Set document title on mount
  useEffect(() => {
    document.title = "Affiliate Resources - Dedw3n";
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header Section */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Affiliate Resources
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              A comprehensive guide for affiliates with everything you need to know about Dedw3n, 
              our mission, goals, and the benefits of joining our community.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        
        {/* About Dedw3n Section */}
        <div className="mb-16">
          <Card className="border-2 border-blue-200 bg-white shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
              <CardTitle className="text-2xl font-bold flex items-center">
                <Globe className="mr-3 h-8 w-8" />
                About Dedw3n
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-6">
                <p className="text-lg text-gray-700">
                  Dedw3n is a sophisticated multi-purpose social marketplace platform that bridges global communication 
                  through advanced technological innovations. We enable seamless product discovery and community 
                  interaction with enhanced transactional capabilities.
                </p>
                <p className="text-lg text-gray-700">
                  Our platform combines the power of social networking with marketplace functionality, creating 
                  a unique ecosystem where users can connect, discover, and transact in a safe and engaging environment.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                  <div className="flex items-start">
                    <CheckCircle className="h-6 w-6 text-blue-600 mt-1 mr-3 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Social Marketplace</h3>
                      <p className="text-gray-600">Unique platform combining social features with marketplace functionality</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="h-6 w-6 text-blue-600 mt-1 mr-3 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Global Reach</h3>
                      <p className="text-gray-600">Connecting users worldwide through advanced technology</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mission & Goals Section */}
        <div className="mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="border-2 border-green-200 bg-white shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
                <CardTitle className="text-xl font-bold flex items-center">
                  <Target className="mr-3 h-6 w-6" />
                  Our Mission
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-700 mb-4">
                  To create innovative solutions that shape the future of digital commerce and social interaction, 
                  enabling meaningful connections and seamless transactions across global communities.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-gray-700">Foster global connectivity and understanding</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-gray-700">Democratize access to global markets</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-gray-700">Build trust through secure transactions</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-200 bg-white shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-t-lg">
                <CardTitle className="text-xl font-bold flex items-center">
                  <TrendingUp className="mr-3 h-6 w-6" />
                  Our Goals
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-700 mb-4">
                  We aim to become the leading platform for social commerce, setting new standards for 
                  user experience, security, and community engagement.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-purple-600 mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-gray-700">Achieve 10M+ active users globally</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-purple-600 mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-gray-700">Expand to 50+ countries</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-purple-600 mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-gray-700">Lead innovation in social commerce</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mb-16">
          <Card className="border-2 border-yellow-200 bg-white shadow-lg">
            <CardHeader className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-t-lg">
              <CardTitle className="text-2xl font-bold flex items-center">
                <Award className="mr-3 h-8 w-8" />
                Affiliate Benefits
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="bg-blue-100 rounded-full p-4 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">High Commission Rates</h3>
                  <p className="text-gray-600">Competitive rates up to 15% on all referred sales</p>
                </div>
                <div className="text-center">
                  <div className="bg-green-100 rounded-full p-4 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <Clock className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Real-time Tracking</h3>
                  <p className="text-gray-600">Advanced analytics and real-time performance monitoring</p>
                </div>
                <div className="text-center">
                  <div className="bg-purple-100 rounded-full p-4 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <Shield className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Secure Payments</h3>
                  <p className="text-gray-600">Monthly payouts with secure payment processing</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Support & Community Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="border-2 border-blue-200 bg-white shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-t-lg">
              <CardTitle className="text-xl font-bold flex items-center">
                <Headphones className="mr-3 h-6 w-6" />
                24/7 Support
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-gray-700 mb-4">
                Our dedicated support team is available around the clock to help you succeed. 
                Get assistance with technical issues, marketing strategies, and performance optimization.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                  <span className="text-gray-700">Live chat support</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                  <span className="text-gray-700">Email support within 2 hours</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                  <span className="text-gray-700">Dedicated account manager</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                  <span className="text-gray-700">Comprehensive documentation</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 border-red-200 bg-white shadow-lg">
            <CardHeader className="bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-t-lg">
              <CardTitle className="text-xl font-bold flex items-center">
                <Users className="mr-3 h-6 w-6" />
                Strong Community
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-gray-700 mb-4">
                Join a thriving community of affiliates, share strategies, learn from experts, 
                and build lasting relationships that drive mutual success.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <Heart className="h-5 w-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
                  <span className="text-gray-700">Private affiliate forums</span>
                </li>
                <li className="flex items-start">
                  <Heart className="h-5 w-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
                  <span className="text-gray-700">Monthly webinars and training</span>
                </li>
                <li className="flex items-start">
                  <Heart className="h-5 w-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
                  <span className="text-gray-700">Networking events and meetups</span>
                </li>
                <li className="flex items-start">
                  <Heart className="h-5 w-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
                  <span className="text-gray-700">Recognition and rewards program</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Contact Section */}
        <div className="mt-16 text-center">
          <Card className="border-2 border-gray-200 bg-white shadow-lg">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Get Started?</h2>
              <p className="text-lg text-gray-600 mb-6">
                Have questions or need more information? Our partnerships team is here to help.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a 
                  href="mailto:partnerships@dedw3n.com" 
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  Contact Partnerships Team
                </a>
                <a 
                  href="/affiliate-partnerships" 
                  className="inline-flex items-center justify-center px-6 py-3 border border-blue-600 text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 transition-colors"
                >
                  Back to Affiliate Program
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}