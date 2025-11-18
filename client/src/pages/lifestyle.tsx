import { useLocation } from "wouter";
import { useMasterBatchTranslation } from "@/hooks/use-master-translation";
import { LifestyleNav } from "@/components/layout/LifestyleNav";
import {
  Utensils,
  Home,
  ShoppingCart
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function LifestylePage() {
  const [, setLocation] = useLocation();

  const texts = [
    "Order Food",
    "Browse restaurants and order delicious meals",
    "Groceries",
    "Shop for fresh groceries and essentials",
    "Reservations",
    "Book hotels, venues, and accommodations",
    "Lifestyle Services",
    "Choose a category to explore"
  ];

  const { translations: t } = useMasterBatchTranslation(texts);

  const subcategories = [
    {
      id: "order-food",
      title: t[0] || "Order Food",
      description: t[1] || "Browse restaurants and order delicious meals",
      icon: Utensils,
      route: "/lifestyle/order-food",
      gradient: "bg-gradient-to-br from-red-500 to-red-600",
      testId: "card-order-food"
    },
    {
      id: "groceries",
      title: t[2] || "Groceries",
      description: t[3] || "Shop for fresh groceries and essentials",
      icon: ShoppingCart,
      route: "/lifestyle/groceries",
      gradient: "bg-gradient-to-br from-green-500 to-green-600",
      testId: "card-groceries"
    },
    {
      id: "reservations",
      title: t[4] || "Reservations",
      description: t[5] || "Book hotels, venues, and accommodations",
      icon: Home,
      route: "/lifestyle/reservations",
      gradient: "bg-gradient-to-br from-teal-500 to-teal-600",
      testId: "card-reservations"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <LifestyleNav 
        searchTerm=""
        setSearchTerm={() => {}}
        selectedCategory="restaurant"
        setSelectedCategory={() => {}}
      />

      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-black mb-4">
            {t[6] || "Lifestyle Services"}
          </h1>
          <p className="text-lg text-gray-600">
            {t[7] || "Choose a category to explore"}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {subcategories.map((category) => {
            const Icon = category.icon;
            return (
              <Card
                key={category.id}
                className="group cursor-pointer hover:shadow-2xl transition-all duration-300 border-2 border-gray-100 hover:border-gray-300 overflow-hidden"
                onClick={() => setLocation(category.route)}
                data-testid={category.testId}
              >
                <CardContent className="p-0">
                  <div className={`${category.gradient} p-8 text-white relative overflow-hidden`}>
                    <div className="absolute -right-6 -top-6 opacity-20">
                      <Icon className="h-32 w-32" />
                    </div>
                    <div className="relative z-10">
                      <Icon className="h-12 w-12 mb-4" />
                      <h3 className="text-2xl font-bold mb-2">{category.title}</h3>
                    </div>
                  </div>
                  <div className="p-6 bg-white">
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {category.description}
                    </p>
                    <div className="mt-4 flex items-center text-black font-medium text-sm group-hover:translate-x-2 transition-transform duration-300">
                      Explore
                      <svg 
                        className="ml-2 h-4 w-4" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M9 5l7 7-7 7" 
                        />
                      </svg>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
