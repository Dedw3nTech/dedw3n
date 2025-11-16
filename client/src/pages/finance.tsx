import { useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Building2, 
  Shield, 
  Landmark, 
  TrendingUp, 
  Bitcoin, 
  Send,
  Search,
  Plus
} from 'lucide-react';
import bankingImg from '@assets/stock_images/person_using_laptop__e471afb4.jpg';
import insuranceImg from '@assets/stock_images/family_insurance_pro_b8a82cf4.jpg';
import loansImg from '@assets/stock_images/home_loan_mortgage_c_4892dc49.jpg';
import investingImg from '@assets/stock_images/financial_investment_f7b852d4.jpg';
import cryptoImg from '@assets/stock_images/cryptocurrency_bitco_7f09fc42.jpg';
import remittanceImg from '@assets/stock_images/money_remittance_int_4eae21d7.jpg';
import heroImg from '@assets/stock_images/elderly_couple_revie_ec2c37d7.jpg';

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const financialServices = [
    {
      id: 'banking',
      title: 'Banking',
      description: 'Secure digital banking solutions for all your financial needs',
      icon: Building2,
      image: bankingImg,
      link: '/finance/banking'
    },
    {
      id: 'insurance',
      title: 'Insurance',
      description: 'Comprehensive insurance coverage for you and your family',
      icon: Shield,
      image: insuranceImg,
      link: '/finance/insurance'
    },
    {
      id: 'loans',
      title: 'Loans',
      description: 'Flexible loan options with competitive interest rates',
      icon: Landmark,
      image: loansImg,
      link: '/finance/loans'
    },
    {
      id: 'investing',
      title: 'Investing',
      description: 'Smart investment opportunities to grow your wealth',
      icon: TrendingUp,
      image: investingImg,
      link: '/finance/investing'
    },
    {
      id: 'crypto',
      title: 'Crypto /Stablecoins',
      description: 'Trade and manage digital currencies securely',
      icon: Bitcoin,
      image: cryptoImg,
      link: '/finance/crypto'
    },
    {
      id: 'remittance',
      title: 'Remittance',
      description: 'Fast and affordable international money transfers',
      icon: Send,
      image: remittanceImg,
      link: '/finance/remittance'
    }
  ];

  const tabs = [
    { id: 'all', label: 'All Services' },
    { id: 'banking', label: 'Banking' },
    { id: 'insurance', label: 'Insurance' },
    { id: 'loans', label: 'Loans' },
    { id: 'investing', label: 'Investing' },
    { id: 'crypto', label: 'Crypto /Stablecoins' },
    { id: 'remittance', label: 'Remittance' }
  ];

  const filteredServices = activeTab === 'all' 
    ? financialServices 
    : financialServices.filter(service => service.id === activeTab);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-6">
              <Link href="/finance">
                <a className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                  Finance
                </a>
              </Link>
              <Link href="/government">
                <a className="text-gray-600 hover:text-gray-900 transition-colors">
                  Government
                </a>
              </Link>
              <Link href="/travel">
                <a className="text-gray-600 hover:text-gray-900 transition-colors">
                  Travel
                </a>
              </Link>
              <Link href="/services">
                <a className="text-gray-600 hover:text-gray-900 transition-colors">
                  Services
                </a>
              </Link>
              <Link href="/marketplace">
                <a className="text-gray-600 hover:text-gray-900 transition-colors">
                  Marketplace
                </a>
              </Link>
              <Link href="/community">
                <a className="text-gray-600 hover:text-gray-900 transition-colors">
                  Community
                </a>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button 
                className="bg-black text-white hover:bg-gray-800"
                data-testid="button-open-bank-account"
              >
                <Plus className="h-4 w-4 mr-2" />
                Open Bank Account
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Service Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            <div className="flex space-x-6 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  data-testid={`tab-${tab.id}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            
            <div className="relative ml-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64 bg-gray-50 border-gray-200"
                data-testid="input-search"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Mastery of Financial Flow
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Navigate your financial seas with grace and clarity through Dedw3n's expert guidance.
            </p>
          </div>
          
          <div className="rounded-lg overflow-hidden shadow-lg">
            <img 
              src={heroImg} 
              alt="Financial planning consultation" 
              className="w-full h-96 object-cover"
            />
          </div>
        </div>
      </div>

      {/* Financial Services Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <Card 
              key={service.id} 
              className="overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer"
              data-testid={`card-${service.id}`}
            >
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={service.image} 
                  alt={service.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <service.icon className="h-8 w-8 text-white mb-2" />
                </div>
              </div>
              
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {service.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  {service.description}
                </p>
                <Link href={service.link}>
                  <a>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      data-testid={`button-learn-more-${service.id}`}
                    >
                      Learn More
                    </Button>
                  </a>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Additional Info Section */}
      <div className="bg-blue-50 border-t border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose Dedw3n Finance?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto mb-8">
              We provide comprehensive financial solutions with expert guidance, 
              competitive rates, and secure platforms to help you achieve your financial goals.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="font-semibold text-lg text-gray-900 mb-2">Secure & Trusted</h3>
                <p className="text-gray-600 text-sm">
                  Bank-level security with industry-leading encryption
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <TrendingUp className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="font-semibold text-lg text-gray-900 mb-2">Competitive Rates</h3>
                <p className="text-gray-600 text-sm">
                  Best-in-class rates for all your financial services
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <Building2 className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="font-semibold text-lg text-gray-900 mb-2">Expert Support</h3>
                <p className="text-gray-600 text-sm">
                  24/7 customer support from financial experts
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
