import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, 
  Camera, 
  Wand2, 
  Eye, 
  DollarSign, 
  Hash, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Sparkles,
  FileText,
  Tag,
  TrendingUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProductSpecs {
  title?: string;
  category?: string;
  brand?: string;
  condition?: string;
  material?: string;
  size?: string;
  color?: string;
  weight?: string;
  dimensions?: string;
  additionalSpecs?: Record<string, any>;
}

interface ImageAnalysis {
  productType: string;
  suggestedTitle: string;
  characteristics: {
    size?: string;
    brand?: string;
    material?: string;
    color?: string;
    condition?: string;
  };
  priceRange: {
    min: number;
    max: number;
    currency: string;
  };
  category: string;
}

interface AIAssistantResults {
  title?: string;
  description?: string;
  keywords?: string[];
  priceRange?: {
    min: number;
    max: number;
    currency: string;
  };
  analysis?: ImageAnalysis;
}

const categories = [
  'Fashion & Apparel',
  'Electronics',
  'Home & Garden',
  'Sports & Outdoors',
  'Books & Media',
  'Toys & Games',
  'Automotive',
  'Health & Beauty',
  'Collectibles',
  'Art & Crafts'
];

const conditions = ['New', 'Excellent', 'Good', 'Fair', 'Poor'];

export function AIProductUpload() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [specs, setSpecs] = useState<ProductSpecs>({});
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [aiResults, setAiResults] = useState<AIAssistantResults>({});
  const [activeTab, setActiveTab] = useState('manual');

  // Image analysis mutation
  const analyzeImageMutation = useMutation({
    mutationFn: async (imageFile: File) => {
      const formData = new FormData();
      formData.append('image', imageFile);
      return apiRequest('/api/ai/analyze-image', {
        method: 'POST',
        body: formData,
      });
    },
    onSuccess: (data) => {
      if (data.success && data.analysis) {
        setAiResults(prev => ({ ...prev, analysis: data.analysis }));
        
        // Auto-fill form with AI analysis
        setSpecs(prev => ({
          ...prev,
          title: data.analysis.suggestedTitle,
          category: data.analysis.category,
          brand: data.analysis.characteristics.brand || prev.brand,
          condition: data.analysis.characteristics.condition || prev.condition,
          material: data.analysis.characteristics.material || prev.material,
          size: data.analysis.characteristics.size || prev.size,
          color: data.analysis.characteristics.color || prev.color,
        }));

        setAiResults(prev => ({ 
          ...prev, 
          priceRange: data.analysis.priceRange 
        }));

        toast({
          title: "Image Analyzed Successfully",
          description: "Product details have been auto-filled based on your image.",
        });

        setActiveTab('ai-enhanced');
      }
    },
    onError: (error: any) => {
      toast({
        title: "Image Analysis Failed",
        description: error.message || "Failed to analyze image. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Generate description mutation
  const generateDescriptionMutation = useMutation({
    mutationFn: async (productSpecs: ProductSpecs) => {
      return apiRequest('/api/ai/generate-description', {
        method: 'POST',
        body: JSON.stringify(productSpecs),
        headers: { 'Content-Type': 'application/json' },
      });
    },
    onSuccess: (data) => {
      if (data.success) {
        setAiResults(prev => ({ ...prev, description: data.description }));
        toast({
          title: "Description Generated",
          description: "AI has created an SEO-optimized product description.",
        });
      }
    },
  });

  // Generate title mutation
  const generateTitleMutation = useMutation({
    mutationFn: async (productSpecs: ProductSpecs) => {
      return apiRequest('/api/ai/generate-title', {
        method: 'POST',
        body: JSON.stringify(productSpecs),
        headers: { 'Content-Type': 'application/json' },
      });
    },
    onSuccess: (data) => {
      if (data.success) {
        setAiResults(prev => ({ ...prev, title: data.title }));
        setSpecs(prev => ({ ...prev, title: data.title }));
        toast({
          title: "Title Generated",
          description: "AI has created an optimized product title.",
        });
      }
    },
  });

  // Generate keywords mutation
  const generateKeywordsMutation = useMutation({
    mutationFn: async ({ title, description, category }: { title: string; description: string; category: string }) => {
      return apiRequest('/api/ai/generate-keywords', {
        method: 'POST',
        body: JSON.stringify({ title, description, category }),
        headers: { 'Content-Type': 'application/json' },
      });
    },
    onSuccess: (data) => {
      if (data.success) {
        setAiResults(prev => ({ ...prev, keywords: data.keywords }));
        toast({
          title: "SEO Keywords Generated",
          description: "AI has generated relevant search keywords for your listing.",
        });
      }
    },
  });

  // Suggest price mutation
  const suggestPriceMutation = useMutation({
    mutationFn: async ({ specs, category }: { specs: ProductSpecs; category: string }) => {
      return apiRequest('/api/ai/suggest-price', {
        method: 'POST',
        body: JSON.stringify({ specs, category }),
        headers: { 'Content-Type': 'application/json' },
      });
    },
    onSuccess: (data) => {
      if (data.success) {
        setAiResults(prev => ({ ...prev, priceRange: data.priceRange }));
        toast({
          title: "Price Range Suggested",
          description: "AI has analyzed similar products to suggest a competitive price range.",
        });
      }
    },
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Analyze image with AI
      analyzeImageMutation.mutate(file);
    }
  };

  const handleSpecChange = (field: keyof ProductSpecs, value: string) => {
    setSpecs(prev => ({ ...prev, [field]: value }));
  };

  const generateAIContent = () => {
    if (!specs.category) {
      toast({
        title: "Category Required",
        description: "Please select a product category first.",
        variant: "destructive",
      });
      return;
    }

    // Generate all AI content
    if (specs.title || specs.brand || specs.material) {
      generateDescriptionMutation.mutate(specs);
    }
    
    if (!specs.title && (specs.brand || specs.material || specs.category)) {
      generateTitleMutation.mutate(specs);
    }

    if (specs.category) {
      suggestPriceMutation.mutate({ specs, category: specs.category });
    }

    // Generate keywords after we have title and description
    setTimeout(() => {
      if (aiResults.title && aiResults.description && specs.category) {
        generateKeywordsMutation.mutate({
          title: aiResults.title,
          description: aiResults.description,
          category: specs.category
        });
      }
    }, 2000);
  };

  const isAnyMutationLoading = 
    analyzeImageMutation.isPending ||
    generateDescriptionMutation.isPending ||
    generateTitleMutation.isPending ||
    generateKeywordsMutation.isPending ||
    suggestPriceMutation.isPending;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-blue-600" />
            AI-Powered Product Upload
          </CardTitle>
          <CardDescription>
            Upload a photo and let AI automatically create optimized product listings with SEO descriptions, 
            suggested pricing, and relevant keywords.
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manual">Manual Entry</TabsTrigger>
          <TabsTrigger value="ai-enhanced">AI Enhanced</TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="space-y-6">
          {/* Image Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Product Image
              </CardTitle>
              <CardDescription>
                Upload a clear photo of your product for AI analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  {imagePreview ? (
                    <div className="space-y-4">
                      <img 
                        src={imagePreview} 
                        alt="Product preview" 
                        className="max-w-xs max-h-64 mx-auto rounded-lg object-cover"
                      />
                      <Button 
                        variant="outline" 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={analyzeImageMutation.isPending}
                      >
                        Change Image
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Upload className="h-12 w-12 mx-auto text-gray-400" />
                      <div>
                        <Button 
                          onClick={() => fileInputRef.current?.click()}
                          disabled={analyzeImageMutation.isPending}
                        >
                          {analyzeImageMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Analyzing...
                            </>
                          ) : (
                            <>
                              <Upload className="mr-2 h-4 w-4" />
                              Upload Image
                            </>
                          )}
                        </Button>
                      </div>
                      <p className="text-sm text-gray-500">
                        Supports JPG, PNG, and WebP files
                      </p>
                    </div>
                  )}
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </CardContent>
          </Card>

          {/* Manual Specifications */}
          <Card>
            <CardHeader>
              <CardTitle>Product Specifications</CardTitle>
              <CardDescription>
                Enter basic product details to generate AI-enhanced content
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Product Title</Label>
                <Input
                  id="title"
                  value={specs.title || ''}
                  onChange={(e) => handleSpecChange('title', e.target.value)}
                  placeholder="Enter product title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select 
                  value={specs.category || ''} 
                  onValueChange={(value) => handleSpecChange('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  value={specs.brand || ''}
                  onChange={(e) => handleSpecChange('brand', e.target.value)}
                  placeholder="Product brand"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="condition">Condition</Label>
                <Select 
                  value={specs.condition || ''} 
                  onValueChange={(value) => handleSpecChange('condition', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    {conditions.map((condition) => (
                      <SelectItem key={condition} value={condition}>{condition}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="material">Material</Label>
                <Input
                  id="material"
                  value={specs.material || ''}
                  onChange={(e) => handleSpecChange('material', e.target.value)}
                  placeholder="e.g., Cotton, Plastic, Metal"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="size">Size</Label>
                <Input
                  id="size"
                  value={specs.size || ''}
                  onChange={(e) => handleSpecChange('size', e.target.value)}
                  placeholder="e.g., Large, 10cm x 5cm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  value={specs.color || ''}
                  onChange={(e) => handleSpecChange('color', e.target.value)}
                  placeholder="Primary color"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight">Weight</Label>
                <Input
                  id="weight"
                  value={specs.weight || ''}
                  onChange={(e) => handleSpecChange('weight', e.target.value)}
                  placeholder="e.g., 500g, 2kg"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <Button 
              onClick={generateAIContent}
              disabled={isAnyMutationLoading || !specs.category}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isAnyMutationLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating AI Content...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-5 w-5" />
                  Generate AI-Enhanced Listing
                </>
              )}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="ai-enhanced" className="space-y-6">
          {/* AI Results Display */}
          {Object.keys(aiResults).length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Generated Title */}
              {aiResults.title && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-green-600" />
                      AI-Generated Title
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-medium text-lg">{aiResults.title}</p>
                  </CardContent>
                </Card>
              )}

              {/* Suggested Price Range */}
              {aiResults.priceRange && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      Suggested Price Range
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-medium">
                      £{aiResults.priceRange.min} - £{aiResults.priceRange.max}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Based on similar products in the marketplace
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Generated Description */}
              {aiResults.description && (
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5 text-green-600" />
                      AI-Generated Description
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea 
                      value={aiResults.description}
                      readOnly
                      className="min-h-32"
                    />
                  </CardContent>
                </Card>
              )}

              {/* SEO Keywords */}
              {aiResults.keywords && aiResults.keywords.length > 0 && (
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Hash className="h-5 w-5 text-green-600" />
                      SEO Keywords
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {aiResults.keywords.map((keyword, index) => (
                        <Badge key={index} variant="secondary">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Image Analysis Results */}
              {aiResults.analysis && (
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5 text-blue-600" />
                      Image Analysis Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Product Type</Label>
                        <p className="text-sm">{aiResults.analysis.productType}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Category</Label>
                        <p className="text-sm">{aiResults.analysis.category}</p>
                      </div>
                      {aiResults.analysis.characteristics.brand && (
                        <div>
                          <Label className="text-sm font-medium">Brand</Label>
                          <p className="text-sm">{aiResults.analysis.characteristics.brand}</p>
                        </div>
                      )}
                      {aiResults.analysis.characteristics.condition && (
                        <div>
                          <Label className="text-sm font-medium">Condition</Label>
                          <p className="text-sm">{aiResults.analysis.characteristics.condition}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {Object.keys(aiResults).length === 0 && (
            <Card>
              <CardContent className="py-16 text-center">
                <Sparkles className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">No AI Content Generated Yet</h3>
                <p className="text-gray-600 mb-4">
                  Switch to the Manual Entry tab to add product details and generate AI-enhanced content.
                </p>
                <Button onClick={() => setActiveTab('manual')}>
                  Go to Manual Entry
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}