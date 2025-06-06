import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Trash2, Edit, Calendar, Users, ShoppingBag, Percent } from "lucide-react";
import { formatDistance } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useCurrency } from "@/contexts/CurrencyContext";

interface Discount {
  id: number;
  vendorId: number;
  code: string | null;
  type: "discount-code" | "automatic";
  discountType: "percentage" | "fixed-amount";
  value: number;
  minOrderAmount: number | null;
  maxUsage: number | null;
  usageCount: number | null;
  isActive: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
  createdAt: Date;
  description: string | null;
  productIds: number[] | null;
  categoryFilter: string | null;
  userTierFilter: string | null;
}

interface DiscountListProps {
  vendorId: number | null;
  type: "discount-code" | "automatic";
}

export default function DiscountList({ vendorId, type }: DiscountListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { formatPriceFromGBP } = useCurrency();

  const { data: discounts = [], isLoading } = useQuery({
    queryKey: ["/api/vendors/discounts", vendorId, type],
    enabled: !!vendorId,
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      return apiRequest("PATCH", `/api/vendors/discounts/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors/discounts"] });
      toast({
        title: "Success",
        description: "Discount status updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update discount status",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/vendors/discounts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors/discounts"] });
      toast({
        title: "Success",
        description: "Discount deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete discount",
        variant: "destructive",
      });
    },
  });

  const handleToggleActive = (id: number, currentStatus: boolean) => {
    toggleActiveMutation.mutate({ id, isActive: !currentStatus });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this discount?")) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const filteredDiscounts = discounts.filter((discount: Discount) => discount.type === type);

  if (filteredDiscounts.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Percent className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No {type === "discount-code" ? "discount codes" : "automatic discounts"} yet
          </h3>
          <p className="text-gray-500 mb-4">
            Create your first {type === "discount-code" ? "discount code" : "automatic discount"} to start offering deals to your customers.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {filteredDiscounts.map((discount: Discount) => (
        <Card key={discount.id} className={!discount.isActive ? "opacity-60" : ""}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {discount.code && (
                    <Badge variant="outline" className="font-mono">
                      {discount.code}
                    </Badge>
                  )}
                  <Badge variant={discount.isActive ? "default" : "secondary"}>
                    {discount.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <Badge variant="outline">
                    {discount.discountType === "percentage" ? "%" : "Fixed"}
                  </Badge>
                </div>
                <CardTitle className="text-lg">
                  {discount.discountType === "percentage"
                    ? `${discount.value}% off`
                    : `${formatPriceFromGBP(discount.value)} off`}
                </CardTitle>
                {discount.description && (
                  <p className="text-sm text-gray-600">{discount.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={discount.isActive}
                  onCheckedChange={() => handleToggleActive(discount.id, discount.isActive)}
                  disabled={toggleActiveMutation.isPending}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(discount.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {discount.minOrderAmount && (
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-gray-400" />
                  <span>Min: {formatPriceFromGBP(discount.minOrderAmount)}</span>
                </div>
              )}
              
              {discount.maxUsage && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span>
                    {discount.usageCount || 0} / {discount.maxUsage} used
                  </span>
                </div>
              )}
              
              {discount.startsAt && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>
                    Starts: {formatDistance(new Date(discount.startsAt), new Date(), { addSuffix: true })}
                  </span>
                </div>
              )}
              
              {discount.endsAt && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>
                    Ends: {formatDistance(new Date(discount.endsAt), new Date(), { addSuffix: true })}
                  </span>
                </div>
              )}
            </div>
            
            {discount.userTierFilter && (
              <div className="mt-3 pt-3 border-t">
                <Badge variant="outline">
                  {discount.userTierFilter.toUpperCase()} members only
                </Badge>
              </div>
            )}
            
            {discount.categoryFilter && (
              <div className="mt-3 pt-3 border-t">
                <Badge variant="outline">
                  Category: {discount.categoryFilter}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}