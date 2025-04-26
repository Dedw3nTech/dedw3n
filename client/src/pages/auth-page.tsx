import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

// Login form schema
const loginSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

// Registration form schema
const registerSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const [, setLocation] = useLocation();
  const { user, isLoading, loginMutation, registerMutation } = useAuth();
  
  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Handle login submission
  const onLoginSubmit = async (values: LoginFormValues) => {
    try {
      await loginMutation.mutateAsync(values);
      // Redirect will happen automatically in the useEffect
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  // Handle registration submission
  const onRegisterSubmit = async (values: RegisterFormValues) => {
    try {
      const { confirmPassword, ...userData } = values;
      console.log("Attempting to register with:", userData);
      await registerMutation.mutateAsync({
        ...userData,
        isVendor: false, // Set default values that might be required by the schema
      });
      // Redirect will happen automatically in the useEffect
    } catch (error) {
      console.error("Registration failed:", error);
    }
  };

  // Don't render until we've checked if the user is logged in
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Forms */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Login</CardTitle>
                  <CardDescription>Enter your credentials to access your account</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Enter your password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={loginForm.formState.isSubmitting}
                      >
                        {loginForm.formState.isSubmitting ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        Login
                      </Button>
                    </form>
                  </Form>
                </CardContent>
                <CardFooter className="flex justify-center">
                  <p className="text-sm text-muted-foreground">
                    Don't have an account?{" "}
                    <Button 
                      variant="link" 
                      className="p-0" 
                      onClick={() => setActiveTab("register")}
                    >
                      Register
                    </Button>
                  </p>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Create an account</CardTitle>
                  <CardDescription>Enter your details to create a new account</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="Choose a username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your full name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="Enter your email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Create a password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Confirm your password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={registerForm.formState.isSubmitting}
                      >
                        {registerForm.formState.isSubmitting ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        Register
                      </Button>
                    </form>
                  </Form>
                </CardContent>
                <CardFooter className="flex justify-center">
                  <p className="text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Button 
                      variant="link" 
                      className="p-0" 
                      onClick={() => setActiveTab("login")}
                    >
                      Login
                    </Button>
                  </p>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Right side - Hero Section */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary to-primary-dark">
        <div className="flex flex-col justify-center items-center p-12 text-white">
          <div className="max-w-md">
            <h1 className="text-4xl font-bold mb-6">Welcome to SocialMarket</h1>
            <p className="text-xl mb-8">
              The all-in-one platform for buying, selling, and connecting with others.
            </p>
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="bg-white/20 p-2 rounded-full mr-4">
                  <i className="ri-store-2-line text-xl"></i>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Multi-Vendor Marketplace</h3>
                  <p className="text-white/80">Buy from and sell to users across the platform.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-white/20 p-2 rounded-full mr-4">
                  <i className="ri-group-line text-xl"></i>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Social Interaction</h3>
                  <p className="text-white/80">Connect with friends, share posts, and build your network.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-white/20 p-2 rounded-full mr-4">
                  <i className="ri-shield-check-line text-xl"></i>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Secure Transactions</h3>
                  <p className="text-white/80">Shop with confidence with our secure payment system.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}