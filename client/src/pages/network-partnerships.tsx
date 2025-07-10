import { useEffect } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, PoundSterling, Users, TrendingUp, Award, ArrowRight, Truck, Globe, Package } from 'lucide-react';
// Use server-served static asset paths for production compatibility
const professionalImage = '/attached_assets/Building software today that will transform the world we live in tomorrow. II_1751993584729.png';
const businessWomanImage = '/attached_assets/We are developing software today that will facilitate business operations in the world of tomorrow._1751996823481.png';
const activeWomanImage = '/attached_assets/Copy of We are developing software today that will facilitate business operations in the world of tomorrow._1751998175092.png';

export default function NetworkPartnerships() {
  // Set document title on mount
  useEffect(() => {
    document.title = "Network Partnership - Dedw3n";
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
                  Network Partnership
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Join our Network Partnership, designed to connect transportation, logistics, export and import companies, manufacturers, farmers, and miners.
                </p>
                <p className="text-lg text-gray-600 leading-relaxed">
                  We provide a dynamic supply chain that links developed and emerging markets, facilitating seamless business connections and offering support in identifying new global supply chain partners.
                </p>
              </div>
              
              <Button 
                className="bg-black hover:bg-gray-800 text-white px-8 py-3 text-lg font-semibold rounded-lg transition-all duration-200 hover:scale-105"
                size="lg"
              >
                Join Network
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>

            {/* Right Visual */}
            <div className="relative lg:ml-8">
              <div className="relative bg-white rounded-2xl shadow-2xl p-8 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="flex items-center justify-between mb-6">
                  <Truck className="h-8 w-8 text-blue-600" />
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">£3,247</div>
                    <div className="text-sm text-gray-500">This quarter</div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="h-3 bg-blue-200 rounded-full">
                    <div className="h-3 bg-blue-500 rounded-full w-3/4"></div>
                  </div>
                  <div className="h-3 bg-green-200 rounded-full">
                    <div className="h-3 bg-green-500 rounded-full w-1/2"></div>
                  </div>
                  <div className="h-3 bg-purple-200 rounded-full">
                    <div className="h-3 bg-purple-500 rounded-full w-5/6"></div>
                  </div>
                </div>
                
                <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-semibold text-gray-900">28</div>
                    <div className="text-gray-500">Partners</div>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">15</div>
                    <div className="text-gray-500">Active Routes</div>
                  </div>
                </div>
              </div>
              
              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 bg-blue-500 text-white p-3 rounded-full shadow-lg">
                <Globe className="h-6 w-6" />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-green-500 text-white p-3 rounded-full shadow-lg">
                <Package className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Network Benefits</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Connect with verified partners across global supply chains and unlock new business opportunities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              icon: Globe,
              title: "Global Reach",
              description: "Connect with partners in developed and emerging markets worldwide"
            },
            {
              icon: Truck,
              title: "Supply Chain Solutions",
              description: "Access comprehensive logistics and transportation networks"
            },
            {
              icon: Users,
              title: "Verified Partners",
              description: "Work with pre-screened manufacturers, farmers, and exporters"
            },
            {
              icon: TrendingUp,
              title: "Growth Opportunities",
              description: "Identify new markets and expand your business reach"
            },
            {
              icon: Package,
              title: "Export/Import Support",
              description: "Streamlined processes for international trade operations"
            },
            {
              icon: Award,
              title: "Premium Support",
              description: "Dedicated account management and business development assistance"
            }
          ].map((benefit, index) => (
            <Card key={index} className="p-6 hover:shadow-lg transition-shadow duration-200 border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <benefit.icon className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-xl text-gray-900">{benefit.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{benefit.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Professional Image Showcase */}
      <div className="max-w-7xl mx-auto px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Hero image with better proportions */}
          <div className="lg:col-span-2">
            <div className="relative h-[500px] overflow-hidden rounded-3xl shadow-2xl group">
              <img 
                src={professionalImage}
                alt="Building Software Today That Will Transform The World We Live In Tomorrow"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent">
                <div className="absolute bottom-8 left-8 right-8">
                  <div className="w-20 h-1 bg-blue-500 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Two feature images with improved spacing */}
          <div className="flex flex-col gap-8">
            <div className="relative h-[240px] overflow-hidden rounded-2xl shadow-xl group">
              <img 
                src={businessWomanImage}
                alt="Innovation and Technology"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent">
                <div className="absolute bottom-6 left-6 right-6">
                  <span className="inline-flex items-center bg-white/95 text-gray-900 px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                    Innovation • Technology • Future
                  </span>
                </div>
              </div>
            </div>
            
            <div className="relative h-[240px] overflow-hidden rounded-2xl shadow-xl group">
              <img 
                src={activeWomanImage}
                alt="Supply Chain Success"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent">
                <div className="absolute bottom-6 left-6 right-6">
                  <span className="inline-flex items-center bg-white/95 text-gray-900 px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                    Supply Chain • Freedom • Success
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Simple steps to join our global network and start connecting with supply chain partners
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              step: "01",
              title: "Join the Network",
              description: "Complete our partnership application and verification process"
            },
            {
              step: "02", 
              title: "Connect with Partners",
              description: "Browse verified partners or get matched based on your business needs"
            },
            {
              step: "03",
              title: "Grow Your Business",
              description: "Execute contracts, manage shipments, and expand your global reach"
            }
          ].map((step, index) => (
            <div key={index} className="text-center">
              <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6">
                {step.step}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">{step.title}</h3>
              <p className="text-gray-600">{step.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Partner Types Section */}
      <div className="bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Partner Types</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We connect diverse businesses across the entire supply chain ecosystem
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Transportation Companies",
                description: "Freight, shipping, and logistics service providers",
                features: ["Road Transport", "Maritime Shipping", "Air Cargo", "Rail Freight"]
              },
              {
                title: "Export/Import Companies", 
                description: "International trade specialists and customs experts",
                features: ["Trade Documentation", "Customs Clearance", "International Regulations", "Market Access"]
              },
              {
                title: "Manufacturers",
                description: "Production facilities and industrial manufacturers",
                features: ["Production Capacity", "Quality Assurance", "Supply Chain Integration", "Custom Manufacturing"]
              },
              {
                title: "Farmers & Agriculture",
                description: "Agricultural producers and food suppliers",
                features: ["Crop Production", "Livestock", "Organic Certification", "Seasonal Planning"]
              },
              {
                title: "Mining Companies",
                description: "Resource extraction and mineral suppliers",
                features: ["Raw Materials", "Processing Facilities", "Environmental Standards", "Global Distribution"]
              },
              {
                title: "Logistics Providers",
                description: "Warehousing and distribution specialists",
                features: ["Warehouse Management", "Inventory Control", "Distribution Networks", "Technology Integration"]
              }
            ].map((type, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow duration-200 bg-white border-0">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg text-gray-900">{type.title}</CardTitle>
                  <p className="text-sm text-gray-600">{type.description}</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {type.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        {feature}
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
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="bg-black rounded-3xl p-12 text-center text-white">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            Ready to Expand Your Global Network?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Join thousands of businesses already connected through our network partnership platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 text-lg font-semibold"
            >
              Apply Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3 text-lg font-semibold"
            >
              Learn More
            </Button>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Have Questions?</h3>
            <p className="text-gray-600 mb-6">
              Our network partnership team is here to help you find the right connections.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="mailto:sales@dedw3n.com"
                className="inline-flex items-center px-6 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
              >
                Contact Sales Team
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}