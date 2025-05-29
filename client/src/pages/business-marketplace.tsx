import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingProductsToolbar } from "@/components/products/TrendingProductsToolbar";
import { SidebarAdCard } from "@/components/SidebarAdCard";
import { AdPostCard } from "@/components/AdPostCard";
import { useAuth } from "@/hooks/use-auth";
import { useLoginPrompt } from "@/hooks/use-login-prompt";
import { LoginPromptModal } from "@/components/LoginPromptModal";
import { Heart, ShoppingBag, Filter, Grid, List, Search } from "lucide-react";

export default function BusinessMarketplace() {
  const { user } = useAuth();
  const { isOpen, action, showLoginPrompt, closePrompt } = useLoginPrompt();
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("trending");
  const [priceRange, setPriceRange] = useState<string>("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterType, setFilterType] = useState<string>("");
  const [productsPerPage, setProductsPerPage] = useState<number>(12);

  // Queries
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['/api/products', { 
      category: selectedCategory, 
      sortBy, 
      priceRange,
      type: filterType,
      search: searchTerm 
    }],
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
  });

  const { data: likedProducts = [] } = useQuery({
    queryKey: ['/api/liked-products'],
    enabled: !!user,
  });

  const { data: trendingCategories = [] } = useQuery({
    queryKey: ['/api/trending-categories'],
  });

  const handleAddToCart = (product: Product) => {
    if (!user) {
      showLoginPrompt('add to cart');
      return;
    }
    // Add to cart logic here
    console.log('Added to cart:', product);
  };

  const handleLikeProduct = (productId: number) => {
    if (!user) {
      showLoginPrompt('like product');
      return;
    }
    // Like product logic here
    console.log('Liked product:', productId);
  };

  const clearFilters = () => {
    setSelectedCategory("");
    setSortBy("trending");
    setPriceRange("");
    setFilterType("");
    if (setSearchTerm) {
      setSearchTerm("");
    }
  };

  const filteredProducts = products
    .filter(product => {
      if (searchTerm && !product.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      if (selectedCategory && product.category !== selectedCategory) {
        return false;
      }
      if (priceRange) {
        const price = parseFloat(product.price);
        const [min, max] = priceRange.split('-').map(p => parseFloat(p));
        if (price < min || (max && price > max)) {
          return false;
        }
      }
      return true;
    })
    .slice(0, productsPerPage);

  const isLiked = (productId: number) => likedProducts.some((p: any) => p.id === productId);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Business Marketplace</h1>
              <p className="text-gray-600 mt-1">Discover premium business solutions and services</p>
            </div>
            
            {/* Quick Stats */}
            <div className="flex gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{products.length}</div>
                <div className="text-sm text-gray-500">Products</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{categories.length}</div>
                <div className="text-sm text-gray-500">Categories</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">4.8</div>
                <div className="text-sm text-gray-500">Rating</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-80 space-y-6">
            {/* Search */}
            <Card>
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search business products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm?.(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Trending Categories */}
            <TrendingCategoriesCard categories={trendingCategories} />

            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Filters
                  </h3>
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Category</label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="All categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All categories</SelectItem>
                        {categories.map((category: any) => (
                          <SelectItem key={category.id} value={category.name}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Price Range</label>
                    <Select value={priceRange} onValueChange={setPriceRange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Any price" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Any price</SelectItem>
                        <SelectItem value="0-100">$0 - $100</SelectItem>
                        <SelectItem value="100-500">$100 - $500</SelectItem>
                        <SelectItem value="500-1000">$500 - $1,000</SelectItem>
                        <SelectItem value="1000-5000">$1,000 - $5,000</SelectItem>
                        <SelectItem value="5000-">$5,000+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Type</label>
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger>
                        <SelectValue placeholder="All types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All types</SelectItem>
                        <SelectItem value="product">Products</SelectItem>
                        <SelectItem value="service">Services</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Advertisement */}
            <SidebarAdCard />
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Toolbar */}
            <TrendingProductsToolbar />

            {/* Controls */}
            <div className="bg-white rounded-lg shadow-sm border mb-6 p-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Sort by:</span>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="trending">Trending</SelectItem>
                        <SelectItem value="newest">Newest</SelectItem>
                        <SelectItem value="price-low">Price: Low to High</SelectItem>
                        <SelectItem value="price-high">Price: High to Low</SelectItem>
                        <SelectItem value="rating">Highest Rated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Show:</span>
                    <Select value={productsPerPage.toString()} onValueChange={(value) => setProductsPerPage(Number(value))}>
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12">12</SelectItem>
                        <SelectItem value="24">24</SelectItem>
                        <SelectItem value="48">48</SelectItem>
                        <SelectItem value="96">96</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">View:</span>
                  <div className="flex rounded-md border">
                    <Button
                      variant={viewMode === "grid" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                      className="rounded-r-none"
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                      className="rounded-l-none"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Showing {filteredProducts.length} of {products.length} products
              </p>
            </div>

            {/* Products Grid */}
            {productsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-200 aspect-[3/4] rounded-lg mb-4"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className={viewMode === "grid" 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-4"
              }>
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={handleAddToCart}
                    onLike={handleLikeProduct}
                    isLiked={isLiked(product.id)}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
                  <Search className="h-full w-full" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your filters or search terms to find what you're looking for.
                </p>
                <Button onClick={clearFilters}>Clear all filters</Button>
              </div>
            )}

            {/* Advertisement */}
            <div className="mt-12">
              <AdPostCard />
            </div>
          </main>
        </div>
      </div>

      {/* Login Prompt Modal */}
      <LoginPromptModal 
        isOpen={isOpen} 
        onClose={closePrompt} 
        action={action} 
      />
    </div>
  );
}