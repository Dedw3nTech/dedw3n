import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Schema for discount code creation
const discountCodeSchema = z.object({
  code: z.string().min(3, "Code must be at least 3 characters").max(50),
  discountType: z.enum(["percentage", "fixed_amount"]),
  discountValue: z.number().min(0.01, "Discount value must be greater than 0"),
  minimumPurchaseAmount: z.number().min(0).optional(),
  maximumDiscountAmount: z.number().min(0).optional(),
  usageLimit: z.number().min(1).optional(),
  usageLimitPerCustomer: z.number().min(1).optional(),
  validFrom: z.date().optional(),
  validUntil: z.date().optional(),
  isActive: z.boolean().default(true),
  description: z.string().max(500).optional(),
});

// Schema for automatic discount creation
const automaticDiscountSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(100),
  discountType: z.enum(["percentage", "fixed_amount"]),
  discountValue: z.number().min(0.01, "Discount value must be greater than 0"),
  conditionType: z.enum(["minimum_purchase", "quantity_based", "product_specific"]),
  conditionValue: z.number().min(0),
  targetProductIds: z.array(z.number()).optional(),
  maximumDiscountAmount: z.number().min(0).optional(),
  validFrom: z.date().optional(),
  validUntil: z.date().optional(),
  isActive: z.boolean().default(true),
  description: z.string().max(500).optional(),
});

type DiscountCodeFormData = z.infer<typeof discountCodeSchema>;
type AutomaticDiscountFormData = z.infer<typeof automaticDiscountSchema>;

interface DiscountFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "discount-code" | "automatic";
  vendorId: number;
}

export default function DiscountForm({ open, onOpenChange, type, vendorId }: DiscountFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const discountCodeForm = useForm<DiscountCodeFormData>({
    resolver: zodResolver(discountCodeSchema),
    defaultValues: {
      discountType: "percentage",
      isActive: true,
    },
  });

  const automaticDiscountForm = useForm<AutomaticDiscountFormData>({
    resolver: zodResolver(automaticDiscountSchema),
    defaultValues: {
      discountType: "percentage",
      conditionType: "minimum_purchase",
      isActive: true,
    },
  });

  const createDiscountCodeMutation = useMutation({
    mutationFn: async (data: DiscountCodeFormData) => {
      const response = await apiRequest("POST", `/api/vendors/${vendorId}/discounts`, data);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Discount code created successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/discounts`] });
      onOpenChange(false);
      discountCodeForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create discount code",
        variant: "destructive",
      });
    },
  });

  const createAutomaticDiscountMutation = useMutation({
    mutationFn: async (data: AutomaticDiscountFormData) => {
      const response = await apiRequest("POST", `/api/vendors/${vendorId}/automatic-discounts`, data);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Automatic discount created successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/automatic-discounts`] });
      onOpenChange(false);
      automaticDiscountForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create automatic discount",
        variant: "destructive",
      });
    },
  });

  const onDiscountCodeSubmit = async (data: DiscountCodeFormData) => {
    setIsSubmitting(true);
    try {
      await createDiscountCodeMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onAutomaticDiscountSubmit = async (data: AutomaticDiscountFormData) => {
    setIsSubmitting(true);
    try {
      await createAutomaticDiscountMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderDiscountCodeForm = () => (
    <Form {...discountCodeForm}>
      <form onSubmit={discountCodeForm.handleSubmit(onDiscountCodeSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={discountCodeForm.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Discount Code</FormLabel>
                <FormControl>
                  <Input placeholder="SAVE20" {...field} />
                </FormControl>
                <FormDescription>
                  Unique code customers will enter at checkout
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={discountCodeForm.control}
            name="discountType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Discount Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select discount type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={discountCodeForm.control}
            name="discountValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Discount Value ({discountCodeForm.watch("discountType") === "percentage" ? "%" : "£"})
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder={discountCodeForm.watch("discountType") === "percentage" ? "20" : "10.00"}
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={discountCodeForm.control}
            name="minimumPurchaseAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minimum Purchase (£)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="50.00"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </FormControl>
                <FormDescription>
                  Optional minimum purchase amount
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {discountCodeForm.watch("discountType") === "percentage" && (
          <FormField
            control={discountCodeForm.control}
            name="maximumDiscountAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maximum Discount Amount (£)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="100.00"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </FormControl>
                <FormDescription>
                  Optional cap on percentage discounts
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={discountCodeForm.control}
            name="usageLimit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Usage Limit</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    placeholder="100"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                </FormControl>
                <FormDescription>
                  Maximum number of times code can be used
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={discountCodeForm.control}
            name="usageLimitPerCustomer"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Usage Limit Per Customer</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    placeholder="1"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                </FormControl>
                <FormDescription>
                  Maximum uses per customer
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={discountCodeForm.control}
            name="validFrom"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Valid From</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  When the discount becomes active
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={discountCodeForm.control}
            name="validUntil"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Valid Until</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  When the discount expires
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={discountCodeForm.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Optional description for internal use"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={discountCodeForm.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">
                  Active
                </FormLabel>
                <FormDescription>
                  Enable this discount code immediately
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Discount Code
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );

  const renderAutomaticDiscountForm = () => (
    <Form {...automaticDiscountForm}>
      <form onSubmit={automaticDiscountForm.handleSubmit(onAutomaticDiscountSubmit)} className="space-y-6">
        <FormField
          control={automaticDiscountForm.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Discount Name</FormLabel>
              <FormControl>
                <Input placeholder="New Customer Discount" {...field} />
              </FormControl>
              <FormDescription>
                Internal name for this automatic discount
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={automaticDiscountForm.control}
            name="discountType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Discount Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select discount type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={automaticDiscountForm.control}
            name="discountValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Discount Value ({automaticDiscountForm.watch("discountType") === "percentage" ? "%" : "£"})
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder={automaticDiscountForm.watch("discountType") === "percentage" ? "15" : "5.00"}
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={automaticDiscountForm.control}
            name="conditionType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Condition Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="minimum_purchase">Minimum Purchase Amount</SelectItem>
                    <SelectItem value="quantity_based">Minimum Quantity</SelectItem>
                    <SelectItem value="product_specific">Specific Products</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={automaticDiscountForm.control}
            name="conditionValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Condition Value 
                  {automaticDiscountForm.watch("conditionType") === "minimum_purchase" && " (£)"}
                  {automaticDiscountForm.watch("conditionType") === "quantity_based" && " (items)"}
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step={automaticDiscountForm.watch("conditionType") === "minimum_purchase" ? "0.01" : "1"}
                    min="0"
                    placeholder={
                      automaticDiscountForm.watch("conditionType") === "minimum_purchase" ? "100.00" :
                      automaticDiscountForm.watch("conditionType") === "quantity_based" ? "3" : "0"
                    }
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {automaticDiscountForm.watch("discountType") === "percentage" && (
          <FormField
            control={automaticDiscountForm.control}
            name="maximumDiscountAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maximum Discount Amount (£)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="50.00"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </FormControl>
                <FormDescription>
                  Optional cap on percentage discounts
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={automaticDiscountForm.control}
            name="validFrom"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Valid From</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  When the discount becomes active
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={automaticDiscountForm.control}
            name="validUntil"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Valid Until</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  When the discount expires
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={automaticDiscountForm.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Optional description for internal use"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={automaticDiscountForm.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">
                  Active
                </FormLabel>
                <FormDescription>
                  Enable this automatic discount immediately
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Automatic Discount
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {type === "discount-code" ? "Create Discount Code" : "Create Automatic Discount"}
          </DialogTitle>
          <DialogDescription>
            {type === "discount-code" 
              ? "Create a discount code that customers can enter at checkout"
              : "Create an automatic discount that applies when conditions are met"
            }
          </DialogDescription>
        </DialogHeader>
        
        {type === "discount-code" ? renderDiscountCodeForm() : renderAutomaticDiscountForm()}
      </DialogContent>
    </Dialog>
  );
}