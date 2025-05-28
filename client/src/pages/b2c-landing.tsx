import { useLocation } from 'wouter';
import { useMarketType } from '@/hooks/use-market-type';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, ShoppingBag, Truck, Shield, CreditCard, Users, Zap, Gift } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

// Import promotional images
import luxuryB2CImage from '@assets/Dedw3n Marketplace (1).png';
import bottomPromoImage from '@assets/Copy of Dedw3n Marketplace.png';

export default function B2CLandingPage() {
  const [, setLocation] = useLocation();
  const { setMarketType } = useMarketType();

  // Fetch featured products for B2C
  const { data: featuredProducts } = useQuery({
    queryKey: ['/api/products', { marketType: 'b2c', featured: true, limit: 8 }],
    queryFn: () => fetch('/api/products?marketType=b2c&featured=true&limit=8').then(res => res.json())
  });

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: () => fetch('/api/categories').then(res => res.json())
  });

  const handleShopNow = () => {
    setMarketType('b2c');
    setLocation('/products');
  };

  const handleCategoryClick = (categoryId: number) => {
    setMarketType('b2c');
    setLocation(`/products?category=${categoryId}`);
  };

  const features = [
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Secure Shopping",
      description: "Advanced fraud protection and secure payment processing"
    },
    {
      icon: <Truck className="h-6 w-6" />,
      title: "Fast Delivery",
      description: "Quick and reliable shipping to your doorstep"
    },
    {
      icon: <CreditCard className="h-6 w-6" />,
      title: "Easy Payments",
      description: "Multiple payment options including mobile money"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Trusted Vendors",
      description: "Verified stores with quality guarantees"
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Instant Access",
      description: "Browse thousands of products instantly"
    },
    {
      icon: <Gift className="h-6 w-6" />,
      title: "Special Offers",
      description: "Exclusive deals and seasonal promotions"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative">
        <div className="w-full">
          <img 
            src={luxuryB2CImage}
            alt="Dedwen B2C Marketplace - Premium Shopping Experience"
            className="w-full h-[500px] object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="text-center text-white max-w-4xl mx-auto px-4">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Shop Premium Brands
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              Discover quality products from trusted stores worldwide
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={handleShopNow}
                size="lg" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
              >
                <ShoppingBag className="mr-2 h-5 w-5" />
                Start Shopping
              </Button>
              <Button 
                onClick={() => setLocation('/become-vendor')}
                variant="outline" 
                size="lg"
                className="border-white text-white hover:bg-white hover:text-black px-8 py-3 text-lg"
              >
                Become a Vendor
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose Our B2C Marketplace?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the best in online shopping with our premium features and trusted vendor network
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-8 text-center">
                  <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 text-blue-600">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      {categories && categories.length > 0 && (
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Shop by Category
              </h2>
              <p className="text-xl text-gray-600">
                Explore our wide range of product categories
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {categories.slice(0, 8).map((category: any) => (
                <Card 
                  key={category.id} 
                  className="cursor-pointer hover:shadow-lg transition-shadow border-0 shadow-md"
                  onClick={() => handleCategoryClick(category.id)}
                >
                  <CardContent className="p-6 text-center">
                    <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                      <ShoppingBag className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900">{category.name}</h3>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products Section */}
      {featuredProducts && featuredProducts.length > 0 && (
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Featured Products
              </h2>
              <p className="text-xl text-gray-600">
                Discover our most popular and trending items
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.slice(0, 8).map((product: any) => (
                <Card 
                  key={product.id} 
                  className="cursor-pointer hover:shadow-lg transition-shadow border-0 shadow-md"
                  onClick={() => setLocation(`/product/${product.id}`)}
                >
                  <div className="aspect-square bg-gray-100 rounded-t-lg overflow-hidden">
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {product.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-blue-600">
                        ${product.price}
                      </span>
                      {product.rating && (
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="ml-1 text-sm text-gray-600">
                            {product.rating}
                          </span>
                        </div>
                      )}
                    </div>
                    {product.category && (
                      <Badge variant="secondary" className="mt-2">
                        {product.category}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="text-center mt-12">
              <Button 
                onClick={handleShopNow}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
              >
                View All Products
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="relative">
        <div className="w-full">
          <img 
            src={bottomPromoImage}
            alt="Dedwen B2C Marketplace - Join Today"
            className="w-full h-[350px] object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="text-center text-white max-w-3xl mx-auto px-4">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Start Shopping?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of satisfied customers who trust our B2C marketplace
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={handleShopNow}
                size="lg" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
              >
                <ShoppingBag className="mr-2 h-5 w-5" />
                Shop Now
              </Button>
              <Button 
                onClick={() => setLocation('/auth')}
                variant="outline" 
                size="lg"
                className="border-white text-white hover:bg-white hover:text-black px-8 py-3 text-lg"
              >
                Sign Up Free
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}