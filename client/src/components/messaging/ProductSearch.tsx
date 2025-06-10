import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, 
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Search, ShoppingBag } from "lucide-react";
import ProductMessage from "./ProductMessage";

interface Product {
  id: number;
  name: string;
  price: number;
  discountPrice?: number | null;
  imageUrl: string;
  vendorId: number;
  vendorName?: string;
}

interface ProductSearchProps {
  onSelect: (product: Product) => void;
}

export default function ProductSearch({ onSelect }: ProductSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  
  // Fetch all products
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    staleTime: 60000, // 1 minute
  });
  
  // Filter products based on search term
  const filteredProducts = products?.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (product: Product) => {
    onSelect(product);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <ShoppingBag className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Share Product</DialogTitle>
          <DialogDescription>
            Search for products to share in this conversation.
          </DialogDescription>
        </DialogHeader>
        
        <div className="my-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">All Products</TabsTrigger>
            <TabsTrigger value="recommended" className="flex-1">Recommended</TabsTrigger>
          </TabsList>
          
          <ScrollArea className="max-h-[40vh] mt-2">
            <TabsContent value="all" className="p-0 mt-0">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : !filteredProducts || filteredProducts.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  {searchTerm 
                    ? "No products found with that name." 
                    : "No products available."}
                </div>
              ) : (
                <div className="space-y-3 py-2">
                  {filteredProducts.map((product) => (
                    <div key={product.id} className="pb-2">
                      <ProductMessage 
                        product={product} 
                        inConversation={false} 
                        onSend={handleSelect}
                      />
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="recommended" className="p-0 mt-0">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : !products || products.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No recommended products available.
                </div>
              ) : (
                <div className="space-y-3 py-2">
                  {products.slice(0, 5).map((product) => (
                    <div key={product.id} className="pb-2">
                      <ProductMessage 
                        product={product} 
                        inConversation={false} 
                        onSend={handleSelect}
                      />
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
        
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}