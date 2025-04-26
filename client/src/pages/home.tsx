import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useView } from "@/hooks/use-view";
import ProductCard from "@/components/marketplace/ProductCard";
import FilterSidebar from "@/components/marketplace/FilterSidebar";
import { Product } from "@shared/schema";
import { useLocation } from "wouter";

export default function Home() {
  const { setView } = useView();
  const [, setLocation] = useLocation();

  useEffect(() => {
    setView("marketplace");
  }, [setView]);

  // Fetch products
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Fetch categories
  const { data: categories } = useQuery<{id: number, name: string}[]>({
    queryKey: ["/api/categories"],
  });

  return (
    <div id="marketplaceView" className="container mx-auto px-4 py-6">
      <div className="md:flex md:space-x-6">
        {/* Filters Sidebar */}
        <FilterSidebar categories={categories || []} />

        {/* Product Listings */}
        <div className="flex-grow">
          <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Featured Products</h2>
              <div className="flex space-x-2">
                <button className="p-2 text-gray-500 hover:text-primary">
                  <i className="ri-layout-grid-line"></i>
                </button>
                <button className="p-2 text-gray-500 hover:text-primary">
                  <i className="ri-list-check"></i>
                </button>
                <select className="text-sm border border-gray-300 rounded p-2">
                  <option>Sort by: Recommended</option>
                  <option>Price: Low to High</option>
                  <option>Price: High to Low</option>
                  <option>Newest Arrivals</option>
                  <option>Best Rated</option>
                </select>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg shadow-sm h-72 animate-pulse"
                />
              ))}
            </div>
          ) : products && products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-500">No products found</p>
              <button 
                onClick={() => setLocation("/create-product")}
                className="mt-4 px-4 py-2 bg-primary text-white rounded-md"
              >
                Add a product
              </button>
            </div>
          )}

          <div className="mt-6 flex justify-center">
            <nav className="inline-flex rounded-md shadow">
              <a href="#" className="py-2 px-4 bg-primary text-white font-medium rounded-l-md hover:bg-blue-600">
                1
              </a>
              <a href="#" className="py-2 px-4 bg-white text-gray-700 font-medium hover:bg-gray-50">
                2
              </a>
              <a href="#" className="py-2 px-4 bg-white text-gray-700 font-medium hover:bg-gray-50">
                3
              </a>
              <a href="#" className="py-2 px-4 bg-white text-gray-700 font-medium rounded-r-md hover:bg-gray-50">
                <i className="ri-arrow-right-s-line"></i>
              </a>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}
