import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

interface FilterSidebarProps {
  categories: {
    id: number;
    name: string;
  }[];
}

export default function FilterSidebar({ categories }: FilterSidebarProps) {
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const { toast } = useToast();

  const handleApplyFilter = () => {
    toast({
      title: "Filters applied",
      description: "Your product filters have been applied.",
    });
  };

  return (
    <div className="hidden md:block w-64 flex-shrink-0">
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <h3 className="text-lg font-semibold mb-3">Categories</h3>
        <ul className="space-y-2">
          {categories.length > 0 ? (
            categories.map((category) => (
              <li key={category.id} className="flex items-center">
                <Checkbox
                  id={`category-${category.id}`}
                  className="rounded text-primary focus:ring-primary mr-2"
                />
                <Label
                  htmlFor={`category-${category.id}`}
                  className="text-sm cursor-pointer"
                >
                  {category.name}
                </Label>
              </li>
            ))
          ) : (
            <li className="text-sm text-gray-500">No categories found</li>
          )}
        </ul>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <h3 className="text-lg font-semibold mb-3">Price Range</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between space-x-4">
            <div className="w-1/2">
              <Label className="text-xs text-gray-500">Min ($)</Label>
              <input
                type="number"
                min="0"
                placeholder="0"
                className="w-full p-2 border border-gray-300 rounded text-sm"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
            </div>
            <div className="w-1/2">
              <Label className="text-xs text-gray-500">Max ($)</Label>
              <input
                type="number"
                min="0"
                placeholder="1000"
                className="w-full p-2 border border-gray-300 rounded text-sm"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
          </div>
          <Button
            onClick={handleApplyFilter}
            variant="outline"
            className="w-full py-2 bg-gray-100 text-gray-800 hover:bg-gray-200"
          >
            Apply Filter
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4">
        <h3 className="text-lg font-semibold mb-3">Vendor Rating</h3>
        <div className="space-y-2">
          <div className="flex items-center">
            <Checkbox
              id="rating-4"
              className="rounded text-primary focus:ring-primary mr-2"
            />
            <Label htmlFor="rating-4" className="text-sm flex items-center cursor-pointer">
              <div className="flex text-amber-400">
                <i className="ri-star-fill"></i>
                <i className="ri-star-fill"></i>
                <i className="ri-star-fill"></i>
                <i className="ri-star-fill"></i>
                <i className="ri-star-line text-gray-300"></i>
              </div>
              <span className="ml-1">& up</span>
            </Label>
          </div>
          <div className="flex items-center">
            <Checkbox
              id="rating-3"
              className="rounded text-primary focus:ring-primary mr-2"
            />
            <Label htmlFor="rating-3" className="text-sm flex items-center cursor-pointer">
              <div className="flex text-amber-400">
                <i className="ri-star-fill"></i>
                <i className="ri-star-fill"></i>
                <i className="ri-star-fill"></i>
                <i className="ri-star-line text-gray-300"></i>
                <i className="ri-star-line text-gray-300"></i>
              </div>
              <span className="ml-1">& up</span>
            </Label>
          </div>
        </div>
      </div>
    </div>
  );
}
