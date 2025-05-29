import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Hash, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";

interface TrendingCategory {
  id: string;
  name: string;
  count: number;
  growth: number;
  posts: number;
  tags: number;
  shares: number;
}

export function TrendingCategoriesCard() {
  const { data: categories, isLoading } = useQuery({
    queryKey: ['/api/trending-categories'],
    retry: false,
  });

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="font-semibold tracking-tight flex items-center gap-2 text-[15px]">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          Trending Product Categories
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-12 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : !categories || !Array.isArray(categories) || categories.length === 0 ? (
          <div className="text-center py-6">
            <Hash className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500" style={{ fontSize: '12px' }}>No trending categories yet</p>
            <Button 
              asChild 
              variant="ghost" 
              className="mt-2 border-0"
              style={{ fontSize: '12px' }}
            >
              <Link href="/products">
                <ExternalLink className="h-4 w-4 mr-2" />
                Explore Products
              </Link>
            </Button>
          </div>
        ) : (
          <>
            {categories.slice(0, 5).map((category: TrendingCategory, index: number) => (
              <div key={category.id} className="flex items-center gap-3 p-2 border rounded-lg hover:bg-gray-50 transition-colors">
                {/* Trending Rank */}
                <div className="w-6 h-6 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0">
                  {index + 1}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-sm truncate">
                      {category.name}
                    </h4>
                    {category.growth > 0 && (
                      <div className="flex items-center gap-1 text-green-600">
                        <TrendingUp className="h-3 w-3" />
                        <span className="text-xs">+{category.growth}%</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span>{category.posts} posts</span>
                    <span>{category.tags} tags</span>
                    <span>{category.shares} shares</span>
                  </div>
                </div>
                
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 flex-shrink-0"
                  asChild
                >
                  <Link href={`/products?category=${encodeURIComponent(category.name)}`}>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
            ))}
            
            <div className="pt-2">
              <Button 
                asChild 
                variant="ghost" 
                className="w-full border-0 text-[12px]"
              >
                <Link href="/categories">
                  <Hash className="h-4 w-4 mr-2" />
                  View All Categories
                </Link>
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}