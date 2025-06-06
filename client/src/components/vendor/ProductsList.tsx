import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Edit, Eye, MoreHorizontal, Plus, Search } from "lucide-react";
import { useLocation } from "wouter";
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

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: number) => {
      const response = await apiRequest("DELETE", `/api/products/${productId}`);
      if (!response.ok) {
        throw new Error("Failed to delete product");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Product Deleted",
        description: "Your product has been deleted successfully.",
      });
      
      // Invalidate products query
      queryClient.invalidateQueries({ queryKey: ["/api/vendors/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      
      // Close dialog
      setIsDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to delete product: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Filter products based on search query
  const filteredProducts = products?.filter((product: any) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      product.name?.toLowerCase().includes(query) ||
      product.description?.toLowerCase().includes(query) ||
      product.category?.toLowerCase().includes(query)
    );
  });

  // Handle view product details
  const handleViewProduct = (productId: number) => {
    setLocation(`/product/${productId}`);
  };

  // Handle edit product
  const handleEditProduct = (productId: number) => {
    setLocation(`/edit-product/${productId}`);
  };

  // Handle delete product
  const handleDeleteProduct = (product: any) => {
    setSelectedProduct(product);
    setIsDeleteDialogOpen(true);
  };

  // Handle add product
  const handleAddProduct = () => {
    setLocation("/add-product");
  };

  // Handle confirm delete
  const handleConfirmDelete = () => {
    if (!selectedProduct) return;
    deleteProductMutation.mutate(selectedProduct.id);
  };

  // Format price with discount
  const formatPrice = (price: number, discountPrice?: number) => {
    if (discountPrice && discountPrice < price) {
      return (
        <div>
          <span className="line-through text-muted-foreground text-sm mr-2">${price.toFixed(2)}</span>
          <span className="text-green-600 font-medium">${discountPrice.toFixed(2)}</span>
        </div>
      );
    }
    return <span>${price.toFixed(2)}</span>;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button onClick={handleAddProduct}>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      {!products || products.length === 0 ? (
        <div className="text-center py-10 border rounded-md">
          <h3 className="text-lg font-medium">No products yet</h3>
          <p className="text-muted-foreground mt-2 mb-4">
            Start adding products to your store
          </p>
          <Button onClick={handleAddProduct}>
            <Plus className="mr-2 h-4 w-4" />
            Add Your First Product
          </Button>
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
                        <DropdownMenuItem 
                          onClick={() => handleDeleteProduct(product)}
                          className="text-red-600 focus:text-red-600"
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
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the product "{selectedProduct?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteProductMutation.isPending}
            >
              {deleteProductMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Product
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}