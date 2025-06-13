import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useCurrency } from '@/contexts/CurrencyContext';
import {
  Package,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  Download,
  Upload,
  Star,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  Tags,
  Image as ImageIcon,
  DollarSign,
  Package2,
  Truck,
  Globe
} from 'lucide-react';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  category: string;
  subcategory?: string;
  brand?: string;
  sku: string;
  barcode?: string;
  weight?: number;
  dimensions?: string;
  status: 'draft' | 'active' | 'inactive' | 'out_of_stock';
  inventory: {
    quantity: number;
    lowStockThreshold: number;
    trackQuantity: boolean;
    allowBackorder: boolean;
  };
  images: string[];
  tags: string[];
  seoTitle?: string;
  seoDescription?: string;
  variants?: ProductVariant[];
  createdAt: string;
  updatedAt: string;
  totalSales: number;
  revenue: number;
  views: number;
  rating: number;
  reviewCount: number;
}

interface ProductVariant {
  id: number;
  name: string;
  sku: string;
  price: number;
  inventory: number;
  image?: string;
  attributes: Record<string, string>;
}

interface VendorProductManagementProps {
  vendorId: number;
}

export default function VendorProductManagement({ vendorId }: VendorProductManagementProps) {
  const { toast } = useToast();
  const { formatPriceFromGBP } = useCurrency();
  const queryClient = useQueryClient();

  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Product form state
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    compareAtPrice: '',
    category: '',
    subcategory: '',
    brand: '',
    sku: '',
    barcode: '',
    weight: '',
    dimensions: '',
    status: 'draft' as const,
    quantity: '',
    lowStockThreshold: '',
    trackQuantity: true,
    allowBackorder: false,
    tags: '',
    seoTitle: '',
    seoDescription: ''
  });

  // Fetch vendor products
  const { data: products, isLoading, error } = useQuery({
    queryKey: ['/api/vendors/products', vendorId, searchTerm, statusFilter, categoryFilter, sortBy, sortOrder],
    queryFn: async () => {
      const params = new URLSearchParams({
        vendorId: vendorId.toString(),
        search: searchTerm,
        status: statusFilter !== 'all' ? statusFilter : '',
        category: categoryFilter !== 'all' ? categoryFilter : '',
        sortBy,
        sortOrder
      });
      
      const response = await apiRequest(`/api/vendors/products?${params}`);
      return response;
    },
    enabled: !!vendorId
  });

  // Fetch categories for filter
  const { data: categories } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const response = await apiRequest('/api/categories');
      return response;
    }
  });

  // Product mutation
  const productMutation = useMutation({
    mutationFn: async (productData: any) => {
      const url = editingProduct 
        ? `/api/vendors/products/${editingProduct.id}`
        : '/api/vendors/products';
      const method = editingProduct ? 'PUT' : 'POST';
      
      return await apiRequest(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...productData, vendorId })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendors/products'] });
      setShowProductDialog(false);
      resetForm();
      toast({
        title: "Success",
        description: editingProduct ? "Product updated successfully" : "Product created successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save product",
        variant: "destructive"
      });
    }
  });

  // Delete product mutation
  const deleteMutation = useMutation({
    mutationFn: async (productId: number) => {
      return await apiRequest(`/api/vendors/products/${productId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendors/products'] });
      toast({
        title: "Success",
        description: "Product deleted successfully"
      });
    }
  });

  // Bulk operations mutation
  const bulkMutation = useMutation({
    mutationFn: async ({ action, productIds }: { action: string; productIds: number[] }) => {
      return await apiRequest('/api/vendors/products/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, productIds, vendorId })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendors/products'] });
      setSelectedProducts([]);
      toast({
        title: "Success",
        description: "Bulk operation completed successfully"
      });
    }
  });

  const resetForm = () => {
    setProductForm({
      name: '',
      description: '',
      price: '',
      compareAtPrice: '',
      category: '',
      subcategory: '',
      brand: '',
      sku: '',
      barcode: '',
      weight: '',
      dimensions: '',
      status: 'draft',
      quantity: '',
      lowStockThreshold: '',
      trackQuantity: true,
      allowBackorder: false,
      tags: '',
      seoTitle: '',
      seoDescription: ''
    });
    setEditingProduct(null);
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      compareAtPrice: product.compareAtPrice?.toString() || '',
      category: product.category,
      subcategory: product.subcategory || '',
      brand: product.brand || '',
      sku: product.sku,
      barcode: product.barcode || '',
      weight: product.weight?.toString() || '',
      dimensions: product.dimensions || '',
      status: product.status,
      quantity: product.inventory.quantity.toString(),
      lowStockThreshold: product.inventory.lowStockThreshold.toString(),
      trackQuantity: product.inventory.trackQuantity,
      allowBackorder: product.inventory.allowBackorder,
      tags: product.tags.join(', '),
      seoTitle: product.seoTitle || '',
      seoDescription: product.seoDescription || ''
    });
    setShowProductDialog(true);
  };

  const handleSubmit = () => {
    const productData = {
      name: productForm.name,
      description: productForm.description,
      price: parseFloat(productForm.price),
      compareAtPrice: productForm.compareAtPrice ? parseFloat(productForm.compareAtPrice) : undefined,
      category: productForm.category,
      subcategory: productForm.subcategory || undefined,
      brand: productForm.brand || undefined,
      sku: productForm.sku,
      barcode: productForm.barcode || undefined,
      weight: productForm.weight ? parseFloat(productForm.weight) : undefined,
      dimensions: productForm.dimensions || undefined,
      status: productForm.status,
      inventory: {
        quantity: parseInt(productForm.quantity),
        lowStockThreshold: parseInt(productForm.lowStockThreshold),
        trackQuantity: productForm.trackQuantity,
        allowBackorder: productForm.allowBackorder
      },
      tags: productForm.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      seoTitle: productForm.seoTitle || undefined,
      seoDescription: productForm.seoDescription || undefined
    };

    productMutation.mutate(productData);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Active', variant: 'default' as const, icon: CheckCircle },
      draft: { label: 'Draft', variant: 'secondary' as const, icon: Clock },
      inactive: { label: 'Inactive', variant: 'destructive' as const, icon: XCircle },
      out_of_stock: { label: 'Out of Stock', variant: 'outline' as const, icon: AlertTriangle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getStockStatus = (product: Product) => {
    if (!product.inventory.trackQuantity) return null;
    
    if (product.inventory.quantity <= 0) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    } else if (product.inventory.quantity <= product.inventory.lowStockThreshold) {
      return <Badge variant="outline" className="text-orange-600">Low Stock</Badge>;
    }
    return <Badge variant="default" className="bg-green-100 text-green-800">In Stock</Badge>;
  };

  const filteredProducts = products?.filter((product: Product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  }) || [];

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading products...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Product Management</h2>
          <p className="text-muted-foreground">
            Manage your product catalog, inventory, and pricing
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowBulkActions(!showBulkActions)}>
            <Package2 className="mr-2 h-4 w-4" />
            Bulk Actions
          </Button>
          <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </DialogTitle>
              </DialogHeader>
              
              <div className="grid gap-6 py-4">
                {/* Basic Information */}
                <div className="grid gap-4">
                  <h3 className="text-lg font-semibold">Basic Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Product Name *</Label>
                      <Input
                        id="name"
                        value={productForm.name}
                        onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter product name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="sku">SKU *</Label>
                      <Input
                        id="sku"
                        value={productForm.sku}
                        onChange={(e) => setProductForm(prev => ({ ...prev, sku: e.target.value }))}
                        placeholder="Enter SKU"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={productForm.description}
                      onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter product description"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Pricing */}
                <div className="grid gap-4">
                  <h3 className="text-lg font-semibold">Pricing</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="price">Price (GBP) *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={productForm.price}
                        onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="compareAtPrice">Compare at Price (GBP)</Label>
                      <Input
                        id="compareAtPrice"
                        type="number"
                        step="0.01"
                        value={productForm.compareAtPrice}
                        onChange={(e) => setProductForm(prev => ({ ...prev, compareAtPrice: e.target.value }))}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>

                {/* Categorization */}
                <div className="grid gap-4">
                  <h3 className="text-lg font-semibold">Categorization</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="category">Category *</Label>
                      <Select
                        value={productForm.category}
                        onValueChange={(value) => setProductForm(prev => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories?.map((category: any) => (
                            <SelectItem key={category.id} value={category.name}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="subcategory">Subcategory</Label>
                      <Input
                        id="subcategory"
                        value={productForm.subcategory}
                        onChange={(e) => setProductForm(prev => ({ ...prev, subcategory: e.target.value }))}
                        placeholder="Enter subcategory"
                      />
                    </div>
                    <div>
                      <Label htmlFor="brand">Brand</Label>
                      <Input
                        id="brand"
                        value={productForm.brand}
                        onChange={(e) => setProductForm(prev => ({ ...prev, brand: e.target.value }))}
                        placeholder="Enter brand"
                      />
                    </div>
                  </div>
                </div>

                {/* Inventory */}
                <div className="grid gap-4">
                  <h3 className="text-lg font-semibold">Inventory Management</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input
                        id="quantity"
                        type="number"
                        value={productForm.quantity}
                        onChange={(e) => setProductForm(prev => ({ ...prev, quantity: e.target.value }))}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
                      <Input
                        id="lowStockThreshold"
                        type="number"
                        value={productForm.lowStockThreshold}
                        onChange={(e) => setProductForm(prev => ({ ...prev, lowStockThreshold: e.target.value }))}
                        placeholder="5"
                      />
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={productForm.status}
                    onValueChange={(value) => setProductForm(prev => ({ ...prev, status: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Tags */}
                <div>
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    value={productForm.tags}
                    onChange={(e) => setProductForm(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="tag1, tag2, tag3"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowProductDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={productMutation.isPending}>
                  {productMutation.isPending ? 'Saving...' : (editingProduct ? 'Update' : 'Create')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search products by name or SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="out_of_stock">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories?.map((category: any) => (
                  <SelectItem key={category.id} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Products ({filteredProducts.length})</span>
            {selectedProducts.length > 0 && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => bulkMutation.mutate({ action: 'activate', productIds: selectedProducts })}
                >
                  Activate Selected
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => bulkMutation.mutate({ action: 'deactivate', productIds: selectedProducts })}
                >
                  Deactivate Selected
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => bulkMutation.mutate({ action: 'delete', productIds: selectedProducts })}
                >
                  Delete Selected
                </Button>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <input
                    type="checkbox"
                    checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedProducts(filteredProducts.map(p => p.id));
                      } else {
                        setSelectedProducts([]);
                      }
                    }}
                  />
                </TableHead>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Sales</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product: Product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(product.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProducts(prev => [...prev, product.id]);
                        } else {
                          setSelectedProducts(prev => prev.filter(id => id !== product.id));
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        {product.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <ImageIcon className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">{product.category}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{formatPriceFromGBP(product.price)}</div>
                      {product.compareAtPrice && (
                        <div className="text-sm text-muted-foreground line-through">
                          {formatPriceFromGBP(product.compareAtPrice)}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(product.status)}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {product.inventory.trackQuantity ? (
                        <>
                          <div className="font-medium">{product.inventory.quantity} units</div>
                          {getStockStatus(product)}
                        </>
                      ) : (
                        <Badge variant="secondary">Not tracked</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{product.totalSales} sold</div>
                      <div className="text-sm text-muted-foreground">
                        {formatPriceFromGBP(product.revenue)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(product)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(product.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredProducts.length === 0 && (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">No products found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
                  ? 'Try adjusting your search criteria'
                  : 'Get started by adding your first product'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && categoryFilter === 'all' && (
                <Button onClick={() => setShowProductDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Product
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}