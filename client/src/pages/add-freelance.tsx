import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMasterBatchTranslation } from '@/hooks/use-master-translation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import type { Vendor } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const FREELANCE_CATEGORIES = [
  { value: 'freelance-webdev', label: 'Web Development', fields: ['project_title', 'project_duration', 'budget_range', 'tech_stack', 'experience_required', 'portfolio_required'] },
  { value: 'freelance-design', label: 'Graphic Design', fields: ['project_title', 'project_duration', 'budget_range', 'design_tools', 'deliverables', 'portfolio_required'] },
  { value: 'freelance-writing', label: 'Content Writing', fields: ['project_title', 'word_count', 'budget_range', 'content_type', 'deadline', 'samples_required'] },
  { value: 'freelance-marketing', label: 'Digital Marketing', fields: ['project_title', 'project_duration', 'budget_range', 'marketing_channels', 'experience_required'] },
  { value: 'freelance-video', label: 'Video Editing', fields: ['project_title', 'video_length', 'budget_range', 'editing_software', 'deliverables', 'deadline'] },
  { value: 'freelance-consulting', label: 'Consulting', fields: ['project_title', 'consulting_area', 'project_duration', 'budget_range', 'experience_required'] },
];

const FIELD_CONFIGS: Record<string, {label: string; type: string; placeholder?: string; options?: string[]}> = {
  project_title: { label: 'Project Title', type: 'text', placeholder: 'Name of the project' },
  project_duration: { label: 'Project Duration', type: 'text', placeholder: 'e.g., 2 weeks, 1 month' },
  budget_range: { label: 'Budget Range', type: 'text', placeholder: 'e.g., $500 - $1000' },
  tech_stack: { label: 'Tech Stack', type: 'text', placeholder: 'e.g., React, Node.js, MongoDB' },
  experience_required: { label: 'Experience Required', type: 'select', options: ['Beginner', 'Intermediate', 'Expert', 'Any'] },
  portfolio_required: { label: 'Portfolio Required', type: 'select', options: ['Yes', 'No'] },
  design_tools: { label: 'Design Tools', type: 'text', placeholder: 'e.g., Figma, Adobe XD, Photoshop' },
  deliverables: { label: 'Deliverables', type: 'text', placeholder: 'e.g., Logo, Brand Kit, Website Mockup' },
  word_count: { label: 'Word Count', type: 'number', placeholder: 'e.g., 1000' },
  content_type: { label: 'Content Type', type: 'select', options: ['Blog Post', 'Article', 'Copy Writing', 'Technical Writing', 'Product Description'] },
  deadline: { label: 'Deadline', type: 'date' },
  samples_required: { label: 'Writing Samples Required', type: 'select', options: ['Yes', 'No'] },
  marketing_channels: { label: 'Marketing Channels', type: 'text', placeholder: 'e.g., SEO, Social Media, Email' },
  video_length: { label: 'Video Length', type: 'text', placeholder: 'e.g., 5 minutes, 30 seconds' },
  editing_software: { label: 'Editing Software', type: 'text', placeholder: 'e.g., Adobe Premiere, Final Cut Pro' },
  consulting_area: { label: 'Consulting Area', type: 'text', placeholder: 'e.g., Business Strategy, Marketing' },
};

const productSchema = z.object({
  name: z.string().min(3, { message: "Product name must be at least 3 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  price: z.coerce.number().positive({ message: "Price must be positive" }),
  discountPrice: z.coerce.number().nonnegative().optional(),
  category: z.string().min(1, { message: "Please select a category" }),
  imageUrl: z.string().optional(),
  inventory: z.coerce.number().int().nonnegative({ message: "Inventory must be a non-negative number" }),
  isNew: z.boolean().default(false),
  isOnSale: z.boolean().default(false),
  status: z.enum(['active', 'draft', 'archived']).default('active'),
  offeringType: z.enum(['product', 'service', 'digital_product']).default('service'),
  marketplace: z.enum(['c2c', 'b2c', 'b2b', 'raw', 'rqst', 'government-dr-congo']),
  categoryFields: z.record(z.string(), z.string()).optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function AddFreelancePage() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const texts = useMemo(() => [
    "Post Freelance Project",
    "List your freelance project opportunities",
    "Freelance Category",
    "Select freelance category",
    "Project Name",
    "Enter project name",
    "Description",
    "Describe the freelance project",
    "Budget",
    "Available Positions",
    "Category-Specific Details",
    "Select",
    "Cancel",
    "Post Project",
    "Posting...",
    "Success",
    "Freelance project posted successfully",
    "Error",
    "Failed to post freelance project",
    "Please log in to post a freelance project",
    "Login",
    "You need to create a vendor account before you can post freelance projects.",
    "Become a Vendor",
    "Web Development",
    "Graphic Design",
    "Content Writing",
    "Digital Marketing",
    "Video Editing",
    "Consulting",
    "Project Title",
    "Project Duration",
    "Budget Range",
    "Tech Stack",
    "Experience Required",
    "Portfolio Required",
    "Design Tools",
    "Deliverables",
    "Word Count",
    "Content Type",
    "Deadline",
    "Writing Samples Required",
    "Marketing Channels",
    "Video Length",
    "Editing Software",
    "Consulting Area",
    "Beginner", "Intermediate", "Expert", "Any",
    "Yes", "No",
    "Blog Post", "Article", "Copy Writing", "Technical Writing", "Product Description",
  ], []);

  const { translations } = useMasterBatchTranslation(texts);
  const t = (key: string) => {
    const index = texts.indexOf(key);
    return index >= 0 ? (translations[index] || key) : key;
  };

  const { data: vendorAccounts } = useQuery<Vendor[]>({
    queryKey: ['/api/vendors/user/accounts'],
    enabled: !!user,
  });

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      discountPrice: 0,
      category: '',
      imageUrl: '',
      inventory: 1,
      isNew: false,
      isOnSale: false,
      status: 'active',
      offeringType: 'service',
      marketplace: 'rqst',
      categoryFields: {},
    },
  });


  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormValues) => {
      return apiRequest('/api/vendors/products', 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendors/products'] });
      toast({
        title: t("Success"),
        description: t("Freelance project posted successfully"),
      });
      setLocation('/vendor-dashboard');
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: t("Error"),
        description: error.message || t("Failed to post freelance project"),
      });
    },
  });

  const onSubmit = (data: ProductFormValues) => {
    createProductMutation.mutate(data);
  };

  if (!user) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="mb-4" data-testid="text-login-message">{t("Please log in to post a freelance project")}</p>
            <Button onClick={() => setLocation('/login')} data-testid="button-login">
              {t("Login")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!vendorAccounts || vendorAccounts.length === 0) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="mb-4" data-testid="text-vendor-message">{t("You need to create a vendor account before you can post freelance projects.")}</p>
            <Button onClick={() => setLocation('/become-vendor')} data-testid="button-become-vendor">
              {t("Become a Vendor")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedCategoryFields = FREELANCE_CATEGORIES.find(c => c.value === selectedCategory)?.fields || [];

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle data-testid="text-card-title">{t("Post Freelance Project")}</CardTitle>
          <CardDescription data-testid="text-card-description">{t("List your freelance project opportunities")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("Freelance Category")}</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedCategory(value);
                      }} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-category">
                          <SelectValue placeholder={t("Select freelance category")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {FREELANCE_CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {t(cat.label)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("Project Name")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("Enter project name")} {...field} data-testid="input-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("Description")}</FormLabel>
                    <FormControl>
                      <Textarea placeholder={t("Describe the freelance project")} {...field} data-testid="textarea-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("Budget")}</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-price" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="inventory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("Available Positions")}</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="1" {...field} data-testid="input-inventory" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {selectedCategoryFields.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold" data-testid="text-heading-category-details">{t("Category-Specific Details")}</h3>
                  {selectedCategoryFields.map((fieldKey) => {
                    const fieldConfig = FIELD_CONFIGS[fieldKey];
                    if (!fieldConfig) return null;

                    return (
                      <div key={fieldKey}>
                        <label className="block text-sm font-medium mb-2" data-testid={`text-label-${fieldKey}`}>{t(fieldConfig.label)}</label>
                        {fieldConfig.type === 'select' ? (
                          <Select
                            value={form.watch(`categoryFields.${fieldKey}`) || ''}
                            onValueChange={(value) => {
                              const currentFields = form.getValues('categoryFields') || {};
                              form.setValue('categoryFields', { ...currentFields, [fieldKey]: value });
                            }}
                          >
                            <SelectTrigger data-testid={`select-${fieldKey}`}>
                              <SelectValue placeholder={t(`Select ${fieldConfig.label}`)} />
                            </SelectTrigger>
                            <SelectContent>
                              {fieldConfig.options?.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {t(option)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            type={fieldConfig.type}
                            placeholder={fieldConfig.placeholder ? t(fieldConfig.placeholder) : ''}
                            value={form.watch(`categoryFields.${fieldKey}`) || ''}
                            onChange={(e) => {
                              const currentFields = form.getValues('categoryFields') || {};
                              form.setValue('categoryFields', { ...currentFields, [fieldKey]: e.target.value });
                            }}
                            data-testid={`input-${fieldKey}`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation('/add-product')}
                  data-testid="button-cancel"
                >
                  {t("Cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={createProductMutation.isPending}
                  data-testid="button-submit"
                >
                  {createProductMutation.isPending ? t("Posting...") : t("Post Project")}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
