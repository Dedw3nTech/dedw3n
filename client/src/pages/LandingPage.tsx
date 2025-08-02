import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowRight, Users, TrendingUp, MessageCircle, Star, Shield, Globe } from 'lucide-react';
import spendMoreTimeImage from "@assets/spend more time enjoying life (Website)_1754111008640.png";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Background Image */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${spendMoreTimeImage})`,
            filter: 'brightness(0.7)'
          }}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent" />
        
        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Main Content */}
          <div className="text-white">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
              The Leading
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                Social Platform
              </span>
              for Modern
              <span className="block">Commerce</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-200 mb-8 max-w-lg">
              With millions of users worldwide, Dedw3n helps you tap into 
              real-time market insights and trending opportunities across 
              products, services, and communities.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Button 
                asChild 
                size="lg" 
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 text-lg rounded-full"
              >
                <Link href="/register">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              
              <Button 
                asChild 
                variant="outline" 
                size="lg" 
                className="border-white text-white hover:bg-white hover:text-black px-8 py-4 text-lg rounded-full"
              >
                <Link href="/marketplace">
                  Explore Marketplace
                </Link>
              </Button>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-8 border-t border-white/20">
              <div>
                <div className="text-3xl font-bold mb-1">10M+</div>
                <div className="text-gray-300 text-sm">Active Users</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-1">500K+</div>
                <div className="text-gray-300 text-sm">Products Listed</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-1">150+</div>
                <div className="text-gray-300 text-sm">Countries</div>
              </div>
            </div>
          </div>
          
          {/* Right Side - Phone Mockups */}
          <div className="relative lg:block hidden">
            <div className="relative">
              {/* Main Phone */}
              <div className="relative z-20 bg-gray-900 rounded-[3rem] p-3 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="bg-white rounded-[2.5rem] overflow-hidden">
                  <div className="bg-gradient-to-b from-purple-50 to-white p-6 h-[600px]">
                    {/* Phone Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="text-2xl font-bold text-gray-900">Dedw3n</div>
                      <div className="w-8 h-8 bg-purple-600 rounded-full"></div>
                    </div>
                    
                    {/* Content */}
                    <div className="space-y-4">
                      <div className="bg-white rounded-lg p-4 shadow-sm border">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-semibold text-gray-900">Trending Product</div>
                          <div className="text-xs text-green-600 font-medium">+24.5%</div>
                        </div>
                        <div className="text-lg font-bold text-gray-900">Eco-Friendly Bottle</div>
                        <div className="text-sm text-gray-600">$29.99</div>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 shadow-sm border">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-semibold text-gray-900">Market Insight</div>
                          <div className="text-xs text-blue-600 font-medium">Live</div>
                        </div>
                        <div className="text-sm text-gray-700">
                          "Sustainable products seeing 40% increase in demand this quarter..."
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 shadow-sm border">
                        <div className="text-sm font-semibold text-gray-900 mb-2">Community Activity</div>
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-purple-600 rounded-full"></div>
                          <div className="flex-1">
                            <div className="text-sm font-medium">Sarah M.</div>
                            <div className="text-xs text-gray-600">Just launched new store!</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Secondary Phone */}
              <div className="absolute -left-16 top-16 z-10 bg-gray-900 rounded-[2.5rem] p-2 shadow-xl transform -rotate-6 scale-75">
                <div className="bg-gray-800 rounded-[2rem] overflow-hidden">
                  <div className="bg-gradient-to-b from-gray-800 to-gray-900 p-4 h-[400px]">
                    <div className="text-white text-lg font-bold mb-4">Analytics</div>
                    <div className="space-y-3">
                      <div className="bg-gray-700 rounded p-3">
                        <div className="text-green-400 text-sm font-medium">Sales +15%</div>
                      </div>
                      <div className="bg-gray-700 rounded p-3">
                        <div className="text-blue-400 text-sm font-medium">Views +28%</div>
                      </div>
                      <div className="bg-gray-700 rounded p-3">
                        <div className="text-purple-400 text-sm font-medium">Engagement +42%</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose Dedw3n?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Join millions of entrepreneurs, creators, and businesses building the future of commerce
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-sm border hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Global Community</h3>
              <p className="text-gray-600">
                Connect with millions of users worldwide. Share insights, discover trends, and build meaningful business relationships.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-8 shadow-sm border hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Real-Time Analytics</h3>
              <p className="text-gray-600">
                Get instant insights into market trends, product performance, and customer behavior to make informed decisions.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-8 shadow-sm border hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-6">
                <MessageCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Smart Messaging</h3>
              <p className="text-gray-600">
                Communicate seamlessly with customers and partners through our integrated messaging platform.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-8 shadow-sm border hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-6">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Premium Tools</h3>
              <p className="text-gray-600">
                Access advanced tools for inventory management, marketing automation, and customer relationship management.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-8 shadow-sm border hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-6">
                <Shield className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Secure Platform</h3>
              <p className="text-gray-600">
                Your data and transactions are protected with enterprise-grade security and compliance standards.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-8 shadow-sm border hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-6">
                <Globe className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Global Reach</h3>
              <p className="text-gray-600">
                Expand your business internationally with our multi-language, multi-currency platform support.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
            Join thousands of successful entrepreneurs who are already using Dedw3n to grow their businesses and spend more time enjoying life.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              asChild 
              size="lg" 
              className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-4 text-lg rounded-full font-semibold"
            >
              <Link href="/register">
                Start Your Journey
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            
            <Button 
              asChild 
              variant="outline" 
              size="lg" 
              className="border-white text-white hover:bg-white hover:text-purple-600 px-8 py-4 text-lg rounded-full"
            >
              <Link href="/about">
                Learn More
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}