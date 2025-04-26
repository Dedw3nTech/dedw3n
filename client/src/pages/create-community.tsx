import { useState } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, ChevronLeft, Globe, Lock, Eye } from "lucide-react";

const formSchema = z.object({
  name: z.string()
    .min(3, "Community name must be at least 3 characters")
    .max(100, "Community name must be less than 100 characters"),
  description: z.string()
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description must be less than 500 characters"),
  visibility: z.enum(["public", "private", "secret"], {
    required_error: "Please select a visibility option",
  }),
  rules: z.string().optional(),
  topics: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function CreateCommunityPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect if not logged in
  if (!user) {
    toast({
      title: "Authentication required",
      description: "Please log in to create a community",
      variant: "destructive",
    });
    setLocation("/auth");
    return null;
  }

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      visibility: "public",
      rules: "",
      topics: "",
    },
  });

  const createCommunityMutation = useMutation({
    mutationFn: async (data: FormData) => {
      // Transform topics from comma-separated string to array
      const formattedData = {
        ...data,
        topics: data.topics ? data.topics.split(",").map(t => t.trim()).filter(Boolean) : undefined,
        ownerId: user.id,
      };

      const response = await apiRequest(
        "POST",
        "/api/communities",
        formattedData
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create community");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Community created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/communities"] });
      setLocation(`/communities/${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create community",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    createCommunityMutation.mutate(data);
  };

  return (
    <div className="container max-w-3xl mx-auto py-8">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          onClick={() => setLocation("/communities")}
          className="mr-2"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Create a New Community</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Community Details</CardTitle>
          <CardDescription>
            Create a community where people can connect and share ideas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Community Name*</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter a name for your community" {...field} />
                    </FormControl>
                    <FormDescription>
                      Choose a unique name that represents your community's purpose
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description*</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe what your community is about"
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Provide a clear description to help people understand what your community is about
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="visibility"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Visibility*</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-2"
                      >
                        <FormItem className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <RadioGroupItem value="public" />
                          </FormControl>
                          <div className="space-y-1">
                            <div className="flex items-center">
                              <Globe className="h-4 w-4 mr-2 text-primary" />
                              <FormLabel className="font-medium cursor-pointer">Public</FormLabel>
                            </div>
                            <FormDescription>
                              Anyone can find and join your community
                            </FormDescription>
                          </div>
                        </FormItem>
                        <FormItem className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <RadioGroupItem value="private" />
                          </FormControl>
                          <div className="space-y-1">
                            <div className="flex items-center">
                              <Lock className="h-4 w-4 mr-2 text-primary" />
                              <FormLabel className="font-medium cursor-pointer">Private</FormLabel>
                            </div>
                            <FormDescription>
                              Anyone can find your community, but members must be approved
                            </FormDescription>
                          </div>
                        </FormItem>
                        <FormItem className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <RadioGroupItem value="secret" />
                          </FormControl>
                          <div className="space-y-1">
                            <div className="flex items-center">
                              <Eye className="h-4 w-4 mr-2 text-primary" />
                              <FormLabel className="font-medium cursor-pointer">Secret</FormLabel>
                            </div>
                            <FormDescription>
                              Only visible to invited members
                            </FormDescription>
                          </div>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="topics"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Topics</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="finance, technology, education, art"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Add topics related to your community, separated by commas
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rules"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Community Rules</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Community guidelines and rules"
                        className="min-h-[150px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Establish rules to ensure a positive community environment
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <CardFooter className="flex justify-end px-0 pt-4">
                <Button
                  type="submit"
                  disabled={createCommunityMutation.isPending}
                  className="ml-auto"
                >
                  {createCommunityMutation.isPending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</>
                  ) : (
                    "Create Community"
                  )}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}