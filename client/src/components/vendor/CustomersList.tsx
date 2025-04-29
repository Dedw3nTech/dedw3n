import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, User, Search, Mail, DollarSign, ShoppingBag } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface CustomersListProps {
  vendorId?: number;
}

export default function CustomersList({ vendorId }: CustomersListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Fetch top customers for this vendor
  const { data: customers, isLoading } = useQuery({
    queryKey: ["/api/vendors/customers"],
    enabled: !!vendorId,
  });

  const filteredCustomers = searchTerm && customers 
    ? customers.filter((customer: any) => 
        customer.username.toLowerCase().includes(searchTerm.toLowerCase()))
    : customers;

  if (isLoading) {
    return <div>Loading customer data...</div>;
  }

  if (!customers || customers.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
          <Users className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="font-medium mb-1">No customers yet</h3>
        <p className="text-sm">Once customers start ordering your products, they'll appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center bg-white rounded-lg p-1">
        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        <Input
          placeholder="Search customers..."
          className="h-9 focus-visible:ring-0 border-0 shadow-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${customers.reduce((acc: number, customer: any) => acc + customer.totalSpent, 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(customers.reduce((acc: number, customer: any) => acc + customer.totalSpent, 0) / 
                customers.reduce((acc: number, customer: any) => acc + customer.orderCount, 0)).toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Avg. Customer Value</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(customers.reduce((acc: number, customer: any) => acc + customer.totalSpent, 0) / 
                customers.length).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="customers">
        <TabsList>
          <TabsTrigger value="customers">All Customers</TabsTrigger>
          <TabsTrigger value="top">Top Spenders</TabsTrigger>
        </TabsList>
        <TabsContent value="customers" className="mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Total Spent</TableHead>
                <TableHead>Avg. Order Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers?.map((customer: any) => (
                <TableRow key={customer.userId}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        {customer.avatar ? (
                          <AvatarImage src={customer.avatar} alt={customer.username} />
                        ) : null}
                        <AvatarFallback>
                          {customer.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{customer.username}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {customer.email || "N/A"}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{customer.orderCount}</TableCell>
                  <TableCell>${customer.totalSpent.toFixed(2)}</TableCell>
                  <TableCell>
                    ${(customer.totalSpent / customer.orderCount).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
        <TabsContent value="top" className="mt-4">
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCustomers
              ?.sort((a: any, b: any) => b.totalSpent - a.totalSpent)
              .slice(0, 6)
              .map((customer: any, index: number) => (
                <Card key={customer.userId}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        {customer.username}
                      </CardTitle>
                      {index < 3 && (
                        <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                          Top {index + 1}
                        </Badge>
                      )}
                    </div>
                    <CardDescription>
                      {customer.email || "No email available"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Orders</div>
                        <div className="text-2xl font-bold">{customer.orderCount}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Spent</div>
                        <div className="text-2xl font-bold">${customer.totalSpent.toFixed(2)}</div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full" size="sm">
                      View Details
                    </Button>
                  </CardFooter>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}