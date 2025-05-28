import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { 
  ShoppingBag, 
  Users, 
  Building, 
  ArrowRight, 
  Star, 
  Globe, 
  Shield, 
  Zap,
  TrendingUp,
  MessageCircle,
  Heart,
  Search
} from "lucide-react";

// Import promotional images
import luxuryB2CImage from "@assets/Dedw3n Marketplace (1).png";
import businessMeetingImage from "@assets/Dedw3n Business.png";
import c2cHeaderImage from "@assets/Dedw3n Business II (2).png";

export default function LandingPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'b2c' | 'b2b' | 'c2c'>('b2c');

  const marketplaces = {
    b2c: {
      title: "Shop Latest Products",
      subtitle: "Discover amazing products from trusted vendors",
      description: "Browse thousands of products, find great deals, and shop with confidence in our secure B2C marketplace.",
      image: luxuryB2CImage,
      features: ["Secure Payments", "Fast Shipping", "Quality Guarantee", "24/7 Support"],
      cta: "Start Shopping",
      link: "/products"
    },
    b2b: {
      title: "Business Solutions",
      subtitle: "Connect with professional suppliers",
      description: "Source products for your business, negotiate bulk deals, and build lasting partnerships with verified suppliers.",
      image: businessMeetingImage,
      features: ["Bulk Ordering", "Business Pricing", "Credit Terms", "Account Management"],
      cta: "Explore B2B",
      link: "/products"
    },
    c2c: {
      title: "Community Marketplace",
      subtitle: "Buy and sell with your community",
      description: "Join a trusted community where individuals buy, sell, and trade items safely with their neighbors.",
      image: c2cHeaderImage,
      features: ["Local Sellers", "Community Reviews", "Safe Transactions", "Personal Touch"],
      cta: "Join Community",
      link: "/products"
    }
  };

  const stats = [
    { label: "Active Users", value: "50K+", icon: Users },
    { label: "Products Listed", value: "100K+", icon: ShoppingBag },
    { label: "Successful Orders", value: "250K+", icon: TrendingUp },
    { label: "Community Posts", value: "1M+", icon: MessageCircle }
  ];

  const features = [
    {
      icon: Shield,
      title: "Secure & Trusted",
      description: "Advanced security measures protect your transactions and personal information."
    },
    {
      icon: Globe,
      title: "Global Reach",
      description: "Connect with buyers and sellers from around the world with localized support."
    },
    {
      icon: Zap,
      title: "Fast & Reliable",
      description: "Lightning-fast search, instant messaging, and reliable order processing."
    },
    {
      icon: Heart,
      title: "Community Driven",
      description: "Built by and for the community with social features and peer support."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <div className="text-center">
            <Badge variant="secondary" className="mb-4">
              Welcome to Dedw3n
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
              The Complete
              <span className="text-blue-600 block">Social Marketplace</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Shop, sell, and connect in one powerful platform. From business solutions to community trading, 
              find everything you need in our integrated marketplace and social network.
            </p>
            
            {!user ? (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="text-lg px-8">
                  <Link href="/auth">Get Started</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="text-lg px-8">
                  <Link href="/community">Explore Community</Link>
                </Button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="text-lg px-8">
                  <Link href="/products">Browse Products</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="text-lg px-8">
                  <Link href="/community">Join Community</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-blue-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-2">
                  <stat.icon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Marketplace Types Section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Choose Your Marketplace
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Whether you're shopping for yourself, sourcing for business, or connecting with your community, 
              we have the perfect marketplace for you.
            </p>
          </div>

          {/* Marketplace Tabs */}
          <div className="flex justify-center mb-8">
            <div className="flex bg-gray-100 rounded-lg p-1">
              {Object.entries(marketplaces).map(([key, marketplace]) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as 'b2c' | 'b2b' | 'c2c')}
                  className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === key
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {key.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Active Marketplace Content */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="grid lg:grid-cols-2 gap-0">
                <div className="p-8 lg:p-12 flex flex-col justify-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    {marketplaces[activeTab].title}
                  </h3>
                  <p className="text-lg text-blue-600 mb-4">
                    {marketplaces[activeTab].subtitle}
                  </p>
                  <p className="text-gray-600 mb-6">
                    {marketplaces[activeTab].description}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3 mb-8">
                    {marketplaces[activeTab].features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Button asChild className="self-start">
                    <Link href={marketplaces[activeTab].link}>
                      {marketplaces[activeTab].cta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                
                <div className="relative h-64 lg:h-auto">
                  <img
                    src={marketplaces[activeTab].image}
                    alt={marketplaces[activeTab].title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose Dedw3n?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We've built more than just a marketplace - it's a complete ecosystem for commerce and community.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center p-6">
                <CardContent className="pt-4">
                  <div className="flex justify-center mb-4">
                    <div className="bg-blue-100 rounded-full p-3">
                      <feature.icon className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-blue-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of users who are already buying, selling, and connecting on Dedw3n.
          </p>
          
          {!user ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" variant="secondary" className="text-lg px-8">
                <Link href="/auth">Create Account</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8 text-white border-white hover:bg-white hover:text-blue-600">
                <Link href="/products">Browse Products</Link>
              </Button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" variant="secondary" className="text-lg px-8">
                <Link href="/add-product">Start Selling</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8 text-white border-white hover:bg-white hover:text-blue-600">
                <Link href="/community">Join Discussion</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}