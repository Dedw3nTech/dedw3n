import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { Edit, Trash2, FileCog, Package } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface ProductsListProps {
  vendorId?: number;
}

export default function ProductsList({ vendorId }: ProductsListProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Fetch vendor products
  const { data: products, isLoading } = useQuery({
    queryKey: ["/api/vendors/products"],
    enabled: !!vendorId,
  });

  const handleDelete = async (id: number) => {
    try {
      await apiRequest("DELETE", `/api/products/${id}`);
      
      // Show success message
      toast({
        title: "Product deleted",
        description: "The product has been deleted successfully.",
      });
      
      // Invalidate products cache
      queryClient.invalidateQueries({ queryKey: ["/api/vendors/products"] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete product. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div>Loading products...</div>;
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
          <Package className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="font-medium mb-1">No products yet</h3>
        <p className="text-sm">You haven't added any products yet.</p>
        <Button onClick={() => setLocation("/add-product")} className="mt-4">
          <Package className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product: any) => (
            <TableRow key={product.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-md overflow-hidden bg-muted">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <Package className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="font-medium">{product.name}</div>
                    <div className="text-xs text-muted-foreground">
                      ID: {product.id}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                ${product.price.toFixed(2)}
                {product.discountPrice && (
                  <div className="text-xs text-muted-foreground line-through">
                    ${product.discountPrice.toFixed(2)}
                  </div>
                )}
              </TableCell>
              <TableCell>{product.category}</TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  {product.inventory > 0 ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      In Stock ({product.inventory})
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      Out of Stock
                    </Badge>
                  )}
                  {product.isNew && (
                    <Badge className="bg-blue-50 text-blue-700 border-blue-200">New</Badge>
                  )}
                  {product.isOnSale && (
                    <Badge className="bg-amber-50 text-amber-700 border-amber-200">On Sale</Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <FileCog className="h-4 w-4" />
                      <span className="sr-only">Actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => setLocation(`/product-edit/${product.id}`)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => handleDelete(product.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}