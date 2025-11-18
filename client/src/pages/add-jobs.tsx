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

const JOBS_CATEGORIES = [
  { value: 'job-fulltime', label: 'Full-time Position', fields: ['job_title', 'employment_type', 'experience_level', 'salary_range', 'skills_required', 'education_required', 'job_location'] },
  { value: 'job-parttime', label: 'Part-time Position', fields: ['job_title', 'employment_type', 'experience_level', 'hourly_rate', 'skills_required', 'job_location'] },
  { value: 'job-contract', label: 'Contract Position', fields: ['job_title', 'contract_duration', 'experience_level', 'salary_range', 'skills_required', 'job_location'] },
  { value: 'job-internship', label: 'Internship', fields: ['job_title', 'internship_duration', 'experience_level', 'stipend_amount', 'skills_required', 'education_required'] },
  { value: 'job-remote', label: 'Remote Job', fields: ['job_title', 'employment_type', 'experience_level', 'salary_range', 'skills_required', 'time_zone'] },
];

const FIELD_CONFIGS: Record<string, {label: string; type: string; placeholder?: string; options?: string[]}> = {
  job_title: { label: 'Job Title', type: 'text', placeholder: 'e.g., Senior Software Engineer' },
  employment_type: { label: 'Employment Type', type: 'select', options: ['Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship'] },
  experience_level: { label: 'Experience Level', type: 'select', options: ['Entry Level', 'Mid Level', 'Senior Level', 'Executive'] },
  salary_range: { label: 'Salary Range', type: 'text', placeholder: 'e.g., $50,000 - $70,000' },
  skills_required: { label: 'Required Skills', type: 'text', placeholder: 'e.g., JavaScript, React, Node.js' },
  education_required: { label: 'Education Required', type: 'select', options: ['High School', 'Associate Degree', 'Bachelor Degree', 'Master Degree', 'PhD', 'Not Required'] },
  job_location: { label: 'Job Location', type: 'text', placeholder: 'City, State/Country' },
  contract_duration: { label: 'Contract Duration', type: 'text', placeholder: 'e.g., 6 months, 1 year' },
  internship_duration: { label: 'Internship Duration', type: 'text', placeholder: 'e.g., 3 months, Summer 2024' },
  stipend_amount: { label: 'Stipend Amount', type: 'text', placeholder: 'e.g., $500/month or Unpaid' },
  time_zone: { label: 'Time Zone', type: 'text', placeholder: 'e.g., EST, PST, UTC+2' },
  hourly_rate: { label: 'Hourly Rate', type: 'number', placeholder: 'e.g., 50' },
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

export default function AddJobsPage() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const texts = useMemo(() => [
    "Post Job Opening",
    "List your job openings for candidates",
    "Job Category",
    "Select job category",
    "Job Title",
    "Enter job title",
    "Description",
    "Describe the job position",
    "Salary/Rate",
    "Available Positions",
    "Category-Specific Details",
    "Select",
    "Cancel",
    "Post Job",
    "Posting...",
    "Success",
    "Job posted successfully",
    "Error",
    "Failed to post job",
    "Please log in to post a job",
    "Login",
    "You need to create a vendor account before you can post jobs.",
    "Become a Vendor",
    "Full-time Position",
    "Part-time Position",
    "Contract Position",
    "Internship",
    "Remote Job",
    "Job Title",
    "Employment Type",
    "Experience Level",
    "Salary Range",
    "Required Skills",
    "Education Required",
    "Job Location",
    "Contract Duration",
    "Internship Duration",
    "Stipend Amount",
    "Time Zone",
    "Hourly Rate",
    "Full-time", "Part-time", "Contract", "Temporary",
    "Entry Level", "Mid Level", "Senior Level", "Executive",
    "High School", "Associate Degree", "Bachelor Degree", "Master Degree", "PhD", "Not Required",
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
        description: t("Job posted successfully"),
      });
      setLocation('/vendor-dashboard');
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: t("Error"),
        description: error.message || t("Failed to post job"),
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
            <p className="mb-4" data-testid="text-login-message">{t("Please log in to post a job")}</p>
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
            <p className="mb-4" data-testid="text-vendor-message">{t("You need to create a vendor account before you can post jobs.")}</p>
            <Button onClick={() => setLocation('/become-vendor')} data-testid="button-become-vendor">
              {t("Become a Vendor")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedCategoryFields = JOBS_CATEGORIES.find(c => c.value === selectedCategory)?.fields || [];

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle data-testid="text-card-title">{t("Post Job Opening")}</CardTitle>
          <CardDescription data-testid="text-card-description">{t("List your job openings for candidates")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("Job Category")}</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedCategory(value);
                      }} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-category">
                          <SelectValue placeholder={t("Select job category")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {JOBS_CATEGORIES.map((cat) => (
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
                    <FormLabel>{t("Job Title")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("Enter job title")} {...field} data-testid="input-name" />
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
                      <Textarea placeholder={t("Describe the job position")} {...field} data-testid="textarea-description" />
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
                      <FormLabel>{t("Salary/Rate")}</FormLabel>
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
                  {createProductMutation.isPending ? t("Posting...") : t("Post Job")}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
