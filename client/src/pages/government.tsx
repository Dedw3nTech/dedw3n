import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

const GovernmentPage = () => {
  const [selectedService, setSelectedService] = useState<string | null>(null);
  
  const serviceOptions = [
    { id: "business", label: "Start a Business", 
      description: "Register a new business entity, obtain licenses and permits" },
    { id: "certificates", label: "Certificates", 
      description: "Apply for birth, marriage, death or other official certificates" },
    { id: "identification", label: "Apply for Passport / ID", 
      description: "Apply for new passport, ID card or renew existing documents" },
    { id: "country", label: "Country Information", 
      description: "Access country-specific information, laws, and regulations" },
  ];
  
  const formSchema = z.object({
    service: z.string(),
    fullName: z.string().min(2, { message: "Name is required" }),
    email: z.string().email({ message: "Invalid email address" }),
    country: z.string().min(1, { message: "Country is required" }),
    details: z.string().optional(),
  });
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      service: "",
      fullName: "",
      email: "",
      country: "",
      details: "",
    },
  });
  
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    console.log(values);
    // In a real app, this would submit the form to the server
    alert("Your application has been submitted. You will receive further instructions via email.");
    form.reset();
    setSelectedService(null);
  };
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
        Government Services
      </h1>
      
      <div className="mb-8">
        <p className="text-gray-600 mb-4">
          Access government services and applications in one convenient place. 
          Select the service you need to get started.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {serviceOptions.map((service) => (
            <Card key={service.id} className={`cursor-pointer transition-all hover:shadow-md ${selectedService === service.id ? 'border-blue-500 shadow-md' : ''}`} 
              onClick={() => {
                setSelectedService(service.id);
                form.setValue("service", service.id);
              }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{service.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{service.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      
      {selectedService && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>
              Apply for {serviceOptions.find(s => s.id === selectedService)?.label}
            </CardTitle>
            <CardDescription>
              Please fill out the required information to proceed with your application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="service"
                  render={({ field }) => (
                    <FormItem className="hidden">
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="fullName"
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
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your email address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your country" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="us">United States</SelectItem>
                          <SelectItem value="uk">United Kingdom</SelectItem>
                          <SelectItem value="ca">Canada</SelectItem>
                          <SelectItem value="au">Australia</SelectItem>
                          <SelectItem value="fr">France</SelectItem>
                          <SelectItem value="de">Germany</SelectItem>
                          <SelectItem value="jp">Japan</SelectItem>
                          <SelectItem value="cn">China</SelectItem>
                          <SelectItem value="in">India</SelectItem>
                          <SelectItem value="br">Brazil</SelectItem>
                          <SelectItem value="ng">Nigeria</SelectItem>
                          <SelectItem value="za">South Africa</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {selectedService === 'business' && (
                  <FormField
                    control={form.control}
                    name="details"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Details</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe the type of business you want to register"
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                {selectedService === 'certificates' && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="details"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>Certificate Type</FormLabel>
                          <FormControl>
                            <RadioGroup 
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex flex-col space-y-1"
                            >
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="birth" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Birth Certificate
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="marriage" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Marriage Certificate
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="death" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Death Certificate
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="other" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Other Certificate
                                </FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
                
                {selectedService === 'identification' && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="details"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>Document Type</FormLabel>
                          <FormControl>
                            <RadioGroup 
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex flex-col space-y-1"
                            >
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="passport-new" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  New Passport
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="passport-renew" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Passport Renewal
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="id-new" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  New ID Card
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="id-renew" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  ID Card Renewal
                                </FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
                
                {selectedService === 'country' && (
                  <FormField
                    control={form.control}
                    name="details"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Information Request</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe what country information you're looking for"
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                <Button type="submit" className="w-full">Submit Application</Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GovernmentPage;