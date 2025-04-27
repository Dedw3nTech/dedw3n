import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MoreHorizontal, Plus, Search, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Checkbox } from "@/components/ui/checkbox";

export default function ProductManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddProductDialog, setShowAddProductDialog] = useState(false);
  const [showEditProductDialog, setShowEditProductDialog] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<any>(null);
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    discountPrice: "",
    imageUrl: "",
    category: "",
    inventory: "1",
    isNew: true,
    isOnSale: false,
    vendorId: 1, // Default to admin vendor
  });

  // Fetch products
  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["/api/admin/products", searchTerm],
    queryFn: async () => {
      const endpoint = searchTerm 
        ? `/api/admin/products/search?term=${encodeURIComponent(searchTerm)}` 
        : "/api/admin/products";
      const res = await fetch(endpoint);
      return res.json();
    },
  });

  // Fetch categories for dropdown
  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
  });

  // Fetch vendors for dropdown
  const { data: vendors } = useQuery({
    queryKey: ["/api/admin/vendors"],
  });

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: async (productData: any) => {
      // Convert string values to numbers
      const formattedData = {
        ...productData,
        price: parseFloat(productData.price),
        discountPrice: productData.discountPrice ? parseFloat(productData.discountPrice) : null,
        inventory: parseInt(productData.inventory),
        vendorId: parseInt(productData.vendorId.toString()),
      };
      
      const res = await apiRequest("POST", "/api/admin/products", formattedData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Product Created",
        description: "Product has been created successfully.",
      });
      setNewProduct({
        name: "",
        description: "",
        price: "",
        discountPrice: "",
        imageUrl: "",
        category: "",
        inventory: "1",
        isNew: true,
        isOnSale: false,
        vendorId: 1,
      });
      setShowAddProductDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create product.",
        variant: "destructive",
      });
    },
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async (productData: any) => {
      // Convert string values to numbers
      const formattedData = {
        ...productData,
        price: parseFloat(productData.price),
        discountPrice: productData.discountPrice ? parseFloat(productData.discountPrice) : null,
        inventory: parseInt(productData.inventory),
        vendorId: parseInt(productData.vendorId.toString()),
      };
      
      const res = await apiRequest("PATCH", `/api/admin/products/${productData.id}`, formattedData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Product Updated",
        description: "Product has been updated successfully.",
      });
      setShowEditProductDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update product.",
        variant: "destructive",
      });
    },
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: number) => {
      const res = await apiRequest("DELETE", `/api/admin/products/${productId}`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Product Deleted",
        description: "Product has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete product.",
        variant: "destructive",
      });
    },
  });

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    createProductMutation.mutate(newProduct);
  };

  const handleUpdateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentProduct) {
      updateProductMutation.mutate(currentProduct);
    }
  };

  const handleEditProduct = (product: any) => {
    // Convert numbers to strings for form inputs
    setCurrentProduct({
      ...product,
      price: product.price.toString(),
      discountPrice: product.discountPrice ? product.discountPrice.toString() : "",
      inventory: product.inventory.toString(),
      vendorId: product.vendorId.toString(),
    });
    setShowEditProductDialog(true);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(price);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-bold">Product Management</CardTitle>
          <Button 
            size="sm" 
            onClick={() => setShowAddProductDialog(true)}
            className="flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search products..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  className="absolute right-2.5 top-2.5"
                  onClick={() => setSearchTerm("")}
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>

          {isLoadingProducts ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Image</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Inventory</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products && products.length > 0 ? (
                    products.map((product: any) => (
                      <TableRow key={product.id}>
                        <TableCell>{product.id}</TableCell>
                        <TableCell>
                          {product.imageUrl ? (
                            <img 
                              src={product.imageUrl} 
                              alt={product.name} 
                              className="w-10 h-10 rounded object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center text-gray-500">
                              No img
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell>
                          {product.discountPrice ? (
                            <div>
                              <span className="line-through text-muted-foreground mr-2">
                                {formatPrice(product.price)}
                              </span>
                              <span className="text-red-600 font-bold">
                                {formatPrice(product.discountPrice)}
                              </span>
                            </div>
                          ) : (
                            formatPrice(product.price)
                          )}
                        </TableCell>
                        <TableCell>
                          {product.inventory > 0 ? (
                            <span>{product.inventory} in stock</span>
                          ) : (
                            <span className="text-red-500">Out of stock</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {product.isNew && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                New
                              </span>
                            )}
                            {product.isOnSale && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Sale
                              </span>
                            )}
                            {product.inventory <= 0 && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                Sold Out
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleEditProduct(product)}>
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => {
                                  if (window.confirm("Are you sure you want to delete this product?")) {
                                    deleteProductMutation.mutate(product.id);
                                  }
                                }}
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        {searchTerm ? "No products found matching your search." : "No products found."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Product Dialog */}
      <Dialog open={showAddProductDialog} onOpenChange={setShowAddProductDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription>
              Create a new product listing.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddProduct}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Product Name
                  </label>
                  <Input
                    id="name"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="category" className="text-sm font-medium">
                    Category
                  </label>
                  <Select
                    value={newProduct.category}
                    onValueChange={(value) => setNewProduct({ ...newProduct, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories && categories.map((category: any) => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description
                </label>
                <Textarea
                  id="description"
                  rows={3}
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label htmlFor="price" className="text-sm font-medium">
                    Price (£)
                  </label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="discountPrice" className="text-sm font-medium">
                    Discount Price (£) (Optional)
                  </label>
                  <Input
                    id="discountPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={newProduct.discountPrice}
                    onChange={(e) => setNewProduct({ ...newProduct, discountPrice: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label htmlFor="inventory" className="text-sm font-medium">
                    Inventory
                  </label>
                  <Input
                    id="inventory"
                    type="number"
                    min="0"
                    value={newProduct.inventory}
                    onChange={(e) => setNewProduct({ ...newProduct, inventory: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="vendorId" className="text-sm font-medium">
                    Vendor
                  </label>
                  <Select
                    value={newProduct.vendorId.toString()}
                    onValueChange={(value) => setNewProduct({ ...newProduct, vendorId: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendors && vendors.map((vendor: any) => (
                        <SelectItem key={vendor.id} value={vendor.id.toString()}>
                          {vendor.storeName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <label htmlFor="imageUrl" className="text-sm font-medium">
                  Image URL
                </label>
                <Input
                  id="imageUrl"
                  type="url"
                  value={newProduct.imageUrl}
                  onChange={(e) => setNewProduct({ ...newProduct, imageUrl: e.target.value })}
                  required
                />
              </div>

              <div className="flex flex-wrap gap-x-8 gap-y-4 mt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isNew"
                    checked={newProduct.isNew}
                    onCheckedChange={(checked) => 
                      setNewProduct({ ...newProduct, isNew: Boolean(checked) })
                    }
                  />
                  <label htmlFor="isNew" className="text-sm font-medium">
                    Mark as New
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isOnSale"
                    checked={newProduct.isOnSale}
                    onCheckedChange={(checked) => 
                      setNewProduct({ ...newProduct, isOnSale: Boolean(checked) })
                    }
                  />
                  <label htmlFor="isOnSale" className="text-sm font-medium">
                    On Sale
                  </label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowAddProductDialog(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createProductMutation.isPending}
              >
                {createProductMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Product
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={showEditProductDialog} onOpenChange={setShowEditProductDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update product details.
            </DialogDescription>
          </DialogHeader>
          {currentProduct && (
            <form onSubmit={handleUpdateProduct}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label htmlFor="edit-name" className="text-sm font-medium">
                      Product Name
                    </label>
                    <Input
                      id="edit-name"
                      value={currentProduct.name}
                      onChange={(e) => setCurrentProduct({ ...currentProduct, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="edit-category" className="text-sm font-medium">
                      Category
                    </label>
                    <Select
                      value={currentProduct.category}
                      onValueChange={(value) => setCurrentProduct({ ...currentProduct, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories && categories.map((category: any) => (
                          <SelectItem key={category.id} value={category.name}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <label htmlFor="edit-description" className="text-sm font-medium">
                    Description
                  </label>
                  <Textarea
                    id="edit-description"
                    rows={3}
                    value={currentProduct.description}
                    onChange={(e) => setCurrentProduct({ ...currentProduct, description: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label htmlFor="edit-price" className="text-sm font-medium">
                      Price (£)
                    </label>
                    <Input
                      id="edit-price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={currentProduct.price}
                      onChange={(e) => setCurrentProduct({ ...currentProduct, price: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="edit-discountPrice" className="text-sm font-medium">
                      Discount Price (£) (Optional)
                    </label>
                    <Input
                      id="edit-discountPrice"
                      type="number"
                      step="0.01"
                      min="0"
                      value={currentProduct.discountPrice}
                      onChange={(e) => setCurrentProduct({ ...currentProduct, discountPrice: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label htmlFor="edit-inventory" className="text-sm font-medium">
                      Inventory
                    </label>
                    <Input
                      id="edit-inventory"
                      type="number"
                      min="0"
                      value={currentProduct.inventory}
                      onChange={(e) => setCurrentProduct({ ...currentProduct, inventory: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="edit-vendorId" className="text-sm font-medium">
                      Vendor
                    </label>
                    <Select
                      value={currentProduct.vendorId.toString()}
                      onValueChange={(value) => setCurrentProduct({ ...currentProduct, vendorId: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select vendor" />
                      </SelectTrigger>
                      <SelectContent>
                        {vendors && vendors.map((vendor: any) => (
                          <SelectItem key={vendor.id} value={vendor.id.toString()}>
                            {vendor.storeName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <label htmlFor="edit-imageUrl" className="text-sm font-medium">
                    Image URL
                  </label>
                  <Input
                    id="edit-imageUrl"
                    type="url"
                    value={currentProduct.imageUrl}
                    onChange={(e) => setCurrentProduct({ ...currentProduct, imageUrl: e.target.value })}
                    required
                  />
                </div>

                <div className="flex flex-wrap gap-x-8 gap-y-4 mt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-isNew"
                      checked={currentProduct.isNew}
                      onCheckedChange={(checked) => 
                        setCurrentProduct({ ...currentProduct, isNew: Boolean(checked) })
                      }
                    />
                    <label htmlFor="edit-isNew" className="text-sm font-medium">
                      Mark as New
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-isOnSale"
                      checked={currentProduct.isOnSale}
                      onCheckedChange={(checked) => 
                        setCurrentProduct({ ...currentProduct, isOnSale: Boolean(checked) })
                      }
                    />
                    <label htmlFor="edit-isOnSale" className="text-sm font-medium">
                      On Sale
                    </label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowEditProductDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateProductMutation.isPending}
                >
                  {updateProductMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Update Product
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}