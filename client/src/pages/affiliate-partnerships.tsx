import { useEffect } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, PoundSterling, Users, TrendingUp, Award, ArrowRight } from 'lucide-react';
import professionalImage from '@assets/Building software today that will transform the world we live in tomorrow. II_1751993584729.png';
import businessWomanImage from '@assets/We are developing software today that will facilitate business operations in the world of tomorrow._1751996823481.png';
import activeWomanImage from '@assets/Copy of We are developing software today that will facilitate business operations in the world of tomorrow._1751998175092.png';

export default function AffiliatePartnerships() {
  // Set document title on mount
  useEffect(() => {
    document.title = "Affiliate Partnership - Dedw3n";
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-100 via-indigo-50 to-cyan-50">
        <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                  Become a Dedw3n Affiliate
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Earn up to 30% commission for life by referring new merchants to Dedw3n.
                </p>
              </div>
              
              <Button 
                className="bg-black hover:bg-gray-800 text-white px-8 py-3 text-lg font-semibold rounded-lg transition-all duration-200 hover:scale-105"
                size="lg"
              >
                Apply now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>

            {/* Right Visual */}
            <div className="relative lg:ml-8">
              <div className="relative bg-white rounded-2xl shadow-2xl p-8 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="flex items-center justify-between mb-6">
                  <PoundSterling className="h-8 w-8 text-green-600" />
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">£2,847</div>
                    <div className="text-sm text-gray-500">This month</div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="h-3 bg-green-200 rounded-full">
                    <div className="h-3 bg-green-500 rounded-full w-3/4"></div>
                  </div>
                  <div className="h-3 bg-blue-200 rounded-full">
                    <div className="h-3 bg-blue-500 rounded-full w-1/2"></div>
                  </div>
                  <div className="h-3 bg-purple-200 rounded-full">
                    <div className="h-3 bg-purple-500 rounded-full w-5/6"></div>
                  </div>
                </div>
                
                <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-semibold text-gray-900">47</div>
                    <div className="text-gray-500">Referrals</div>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">23</div>
                    <div className="text-gray-500">Conversions</div>
                  </div>
                </div>
              </div>
              
              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 bg-green-500 text-white p-3 rounded-full shadow-lg">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-blue-500 text-white p-3 rounded-full shadow-lg">
                <Award className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Partnership Benefits</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join our partner network and unlock exclusive benefits designed to help you grow your income.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              icon: PoundSterling,
              title: "Competitive Commissions",
              description: "Earn up to 25% commission on every successful referral with transparent tracking.",
              color: "bg-green-100 text-green-600"
            },
            {
              icon: Users,
              title: "Dedicated Support",
              description: "Get personalized support from our partnership team to maximize your success.",
              color: "bg-blue-100 text-blue-600"
            },
            {
              icon: TrendingUp,
              title: "Life Time Earnings",
              description: "Keep earning monthly commissions for life.",
              color: "bg-purple-100 text-purple-600"
            },
            {
              icon: Award,
              title: "Marketing Materials",
              description: "Access professional marketing assets and promotional materials for your campaigns.",
              color: "bg-orange-100 text-orange-600"
            },
            {
              icon: CheckCircle,
              title: "Monthly Payouts",
              description: "Receive timely payments every month with multiple payout options available.",
              color: "bg-emerald-100 text-emerald-600"
            },
            {
              icon: ArrowRight,
              title: "Flexible Terms",
              description: "Enjoy customizable partnership agreements that suit your business needs.",
              color: "bg-indigo-100 text-indigo-600"
            }
          ].map((benefit, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="text-center pb-4">
                <div className={`inline-flex p-3 rounded-full ${benefit.color} mb-4`}>
                  <benefit.icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  {benefit.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center leading-relaxed">
                  {benefit.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Professional Image Section */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Main professional image - Large, spans 2 columns */}
            <div className="relative lg:col-span-2">
              <img 
                src={professionalImage} 
                alt="Professional with phone representing innovation and future technology"
                className="w-full h-auto rounded-2xl shadow-2xl"
              />
              
              {/* Overlay gradient for better visual appeal */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent rounded-2xl"></div>
              
              {/* Text overlay positioned next to the image */}
              <div className="absolute inset-0 flex items-center justify-end pr-8">
                <div className="bg-black/70 backdrop-blur-sm rounded-xl p-6 max-w-md">
                  <h2 className="text-2xl font-bold text-white mb-3">
                    Building Software Today That Will Transform The World We Live In Tomorrow
                  </h2>
                  <p className="text-lg text-gray-200">
                    Join us in creating innovative solutions that shape the future of digital commerce and social interaction.
                  </p>
                </div>
              </div>
              

            </div>
            
            {/* Smaller images stacked vertically in single column */}
            <div className="flex flex-col gap-6">
              {/* Business woman image - smaller */}
              <div className="relative">
                <img 
                  src={businessWomanImage} 
                  alt="Business woman representing professional success and growth"
                  className="w-full h-auto rounded-2xl shadow-xl"
                />
                
                {/* Overlay gradient for better visual appeal */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent rounded-2xl"></div>
                
                {/* Optional overlay text */}
                <div className="absolute bottom-4 left-4 text-white">
                  <div className="bg-black/50 backdrop-blur-sm rounded-lg p-2">
                    <p className="text-xs font-medium">Success • Growth • Partnership</p>
                  </div>
                </div>
              </div>

              {/* Active woman image - smaller */}
              <div className="relative">
                <img 
                  src={activeWomanImage} 
                  alt="Active lifestyle woman representing vitality and success"
                  className="w-full h-auto rounded-2xl shadow-xl"
                />
                
                {/* Overlay gradient for better visual appeal */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent rounded-2xl"></div>
                
                {/* Optional overlay text */}
                <div className="absolute bottom-4 left-4 text-white">
                  <div className="bg-black/50 backdrop-blur-sm rounded-lg p-2">
                    <p className="text-xs font-medium">Lifestyle • Freedom • Success</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Partnership Types */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Partnership Opportunities</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose the partnership type that best fits your business model and audience.
            </p>
          </div>

          <div className="flex justify-center">
            {[
              {
                title: "Affiliate Marketing Partners",
                description: "Perfect for content creators, influencers, and marketing professionals.",
                features: [
                  "Competitive commission rates",
                  "Real-time tracking and analytics", 
                  "Marketing materials and support",
                  "Monthly payouts"
                ],
                highlight: "Most Popular"
              }
            ].map((type, index) => (
              <Card key={index} className="relative border-2 border-blue-500 shadow-lg hover:border-blue-500 transition-colors duration-300 max-w-md w-full">
                {type.highlight && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      {type.highlight}
                    </span>
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                    {type.title}
                  </CardTitle>
                  <p className="text-gray-600">{type.description}</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {type.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-black py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Ready to Start Earning?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of partners who are already earning with Dedw3n. 
            Apply now and start your partnership journey today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 text-lg font-semibold rounded-lg transition-all duration-200 hover:scale-105"
              size="lg"
            >
              Apply Now
            </Button>
            <Link href="/resources">
              <Button 
                variant="outline"
                className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-8 py-3 text-lg font-semibold rounded-lg transition-all duration-200"
                size="lg"
              >
                Resources
              </Button>
            </Link>
          </div>
          
          <div className="mt-8 text-blue-100 text-sm">
            <p>Questions? Contact our partnerships team at <a href="mailto:partnerships@dedw3n.com" className="text-white underline hover:no-underline">partnerships@dedw3n.com</a></p>
          </div>
        </div>
      </div>
    </div>
  );
}