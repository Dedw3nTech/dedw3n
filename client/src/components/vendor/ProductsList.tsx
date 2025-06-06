import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Edit, Eye, MoreHorizontal, Search } from "lucide-react";
import { useLocation } from "wouter";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ProductsListProps {
  vendorId?: number;
}

export default function ProductsList({ vendorId }: ProductsListProps) {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const { formatPriceFromGBP } = useCurrency();

  // Fetch vendor products
  const { data: products, isLoading } = useQuery({
    queryKey: ["/api/vendors/products"],
    queryFn: async () => {
      const response = await fetch("/api/vendors/products");
      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }
      return response.json();
    },
    enabled: !!vendorId,
  });

  // Filter products based on search query
  const filteredProducts = products?.filter((product: any) => {
    if (!searchQuery) return true;
    return (
      product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleViewProduct = (productId: number) => {
    setLocation(`/product/${productId}`);
  };

  const handleEditProduct = (productId: number) => {
    setLocation(`/vendor-dashboard/edit-product/${productId}`);
  };

  const formatPrice = (price: number, discountPrice?: number) => {
    if (discountPrice && discountPrice < price) {
      return (
        <div className="flex flex-col">
          <span className="text-sm line-through text-muted-foreground">
            {formatPriceFromGBP(price)}
          </span>
          <span className="text-green-600 font-medium">
            {formatPriceFromGBP(discountPrice)}
          </span>
        </div>
      );
    }
    return <span>{formatPriceFromGBP(price)}</span>;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Products</h2>
        </div>
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

      </div>

      {!products || products.length === 0 ? (
        <div className="text-center py-10 border rounded-md">
          <h3 className="text-lg font-medium">No products yet</h3>
          <p className="text-muted-foreground mt-2 mb-4">
            Start adding products to your store
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Inventory</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts?.map((product: any) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-md overflow-hidden bg-muted">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-gray-100">
                            <div className="text-muted-foreground text-xs">No image</div>
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium max-w-[200px] truncate" title={product.name}>
                          {product.name}
                        </div>
                        <div className="text-xs text-muted-foreground">ID: {product.id}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{product.category || "—"}</TableCell>
                  <TableCell>
                    {formatPrice(product.price, product.discountPrice)}
                  </TableCell>
                  <TableCell>
                    <span className={product.inventory <= 0 ? "text-red-600" : undefined}>
                      {product.inventory}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {product.isNew && (
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100">New</Badge>
                      )}
                      {product.isOnSale && (
                        <Badge variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-100">Sale</Badge>
                      )}
                      {product.inventory <= 0 && (
                        <Badge variant="secondary" className="bg-red-50 text-red-700 hover:bg-red-100">Out of Stock</Badge>
                      )}
                      {!product.isNew && !product.isOnSale && product.inventory > 0 && (
                        <Badge variant="secondary" className="bg-gray-50 text-gray-700 hover:bg-gray-100">Active</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleViewProduct(product.id)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditProduct(product.id)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}