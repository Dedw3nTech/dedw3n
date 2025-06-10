import { useState } from "react";
import { Container } from "@/components/ui/container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Zap, Shield, Crown } from "lucide-react";

export default function RemoveAdsPage() {
  const [selectedPlan, setSelectedPlan] = useState<string>("");

  const plans = [
    {
      id: "basic",
      name: "Basic",
      price: "$4.99",
      period: "/month",
      description: "Remove ads and enjoy basic premium features",
      features: [
        "Ad-free browsing",
        "Basic analytics",
        "Standard support",
        "Mobile app access"
      ],
      popular: false,
      color: "bg-gray-100"
    },
    {
      id: "premium",
      name: "Premium",
      price: "$9.99",
      period: "/month",
      description: "Complete premium experience with all features",
      features: [
        "Ad-free browsing",
        "Advanced analytics",
        "Priority support",
        "Exclusive content",
        "Advanced filters",
        "Custom themes"
      ],
      popular: true,
      color: "bg-blue-50"
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: "$19.99",
      period: "/month",
      description: "Full business features and white-label options",
      features: [
        "Everything in Premium",
        "White-label branding",
        "API access",
        "Dedicated support",
        "Custom integrations",
        "Advanced security"
      ],
      popular: false,
      color: "bg-purple-50"
    }
  ];

  return (
    <Container className="py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Remove Ads & Go Premium
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Enjoy an ad-free experience and unlock premium features to enhance your social marketplace journey
          </p>
        </div>

        {/* Benefits Section */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="text-center">
            <CardContent className="pt-6">
              <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Ad-Free Experience</h3>
              <p className="text-gray-600">Browse without interruptions and enjoy a cleaner interface</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <Zap className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Premium Features</h3>
              <p className="text-gray-600">Access exclusive tools and advanced functionality</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <Crown className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Priority Support</h3>
              <p className="text-gray-600">Get faster responses and dedicated assistance</p>
            </CardContent>
          </Card>
        </div>

        {/* Pricing Plans */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {plans.map((plan) => (
            <Card 
              key={plan.id}
              className={`relative cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedPlan === plan.id ? 'ring-2 ring-blue-500' : ''
              } ${plan.color}`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600">
                  Most Popular
                </Badge>
              )}
              
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-gray-600">{plan.period}</span>
                </div>
                <p className="text-gray-600 mt-2">{plan.description}</p>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <Check className="h-5 w-5 text-green-600 mr-3" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className={`w-full mt-6 ${
                    plan.popular 
                      ? 'bg-blue-600 hover:bg-blue-700' 
                      : 'bg-gray-600 hover:bg-gray-700'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPlan(plan.id);
                  }}
                >
                  {selectedPlan === plan.id ? 'Selected' : 'Choose Plan'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Button 
            size="lg" 
            className="bg-blue-600 hover:bg-blue-700 px-8 py-3"
            disabled={!selectedPlan}
          >
            {selectedPlan ? `Upgrade to ${plans.find(p => p.id === selectedPlan)?.name}` : 'Select a Plan to Continue'}
          </Button>
          <p className="text-sm text-gray-600 mt-4">
            30-day money-back guarantee • Cancel anytime • Secure payment
          </p>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Can I cancel anytime?</h3>
                <p className="text-gray-600">Yes, you can cancel your subscription at any time. Your premium features will remain active until the end of your billing period.</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Is there a free trial?</h3>
                <p className="text-gray-600">We offer a 7-day free trial for new premium subscribers. No credit card required to start.</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
                <p className="text-gray-600">We accept all major credit cards, PayPal, and bank transfers for enterprise plans.</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Do you offer refunds?</h3>
                <p className="text-gray-600">Yes, we offer a 30-day money-back guarantee for all new subscriptions.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Container>
  );
}