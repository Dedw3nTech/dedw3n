import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function ERPPage() {
  const [activeModule, setActiveModule] = useState<string | null>(null);

  const { data: erpStats } = useQuery<any>({
    queryKey: ['/api/erp/stats'],
  });

  const modules = [
    {
      id: 'accounting',
      title: 'Accounting',
      description: 'Manage financial transactions, ledgers, and reports',
      links: [
        { name: 'Marketplace Transactions', href: '/marketplace' },
        { name: 'Vendor Payments', href: '/vendors' },
        { name: 'Financial Reports', href: '/erp/accounting' },
      ]
    },
    {
      id: 'hr',
      title: 'Human Resources',
      description: 'Employee management, payroll, and performance tracking',
      links: [
        { name: 'Team Management', href: '/community' },
        { name: 'User Profiles', href: '/profile-settings' },
        { name: 'HR Dashboard', href: '/erp/hr' },
      ]
    },
    {
      id: 'procurement',
      title: 'Procurement',
      description: 'Purchase orders, vendor management, and sourcing',
      links: [
        { name: 'Marketplace Products', href: '/marketplace' },
        { name: 'Vendor Management', href: '/vendors' },
        { name: 'Purchase Orders', href: '/erp/procurement' },
      ]
    },
    {
      id: 'supply-chain',
      title: 'Supply Chain Management',
      description: 'Inventory, logistics, and order fulfillment',
      links: [
        { name: 'Inventory Overview', href: '/marketplace' },
        { name: 'Order Management', href: '/orders' },
        { name: 'Logistics Dashboard', href: '/erp/supply-chain' },
      ]
    },
    {
      id: 'government',
      title: 'Government Services',
      description: 'Compliance, regulations, and government interactions',
      links: [
        { name: 'Government Portal', href: '/government' },
        { name: 'Compliance Documents', href: '/erp/compliance' },
        { name: 'Regulatory Reports', href: '/erp/government' },
      ]
    },
    {
      id: 'lifestyle',
      title: 'Lifestyle & Services',
      description: 'Customer services, subscriptions, and benefits',
      links: [
        { name: 'Services Portal', href: '/services' },
        { name: 'Lifestyle Hub', href: '/lifestyle' },
        { name: 'Customer Management', href: '/erp/customer-service' },
      ]
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">
            Enterprise Resource Planning
          </h1>
          <p className="text-black">
            Integrated business management system connecting all core operations
          </p>
        </div>

        <Separator className="mb-8" />

        {erpStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-white border-black">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-black">Total Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-black">{erpStats.totalTransactions || 0}</div>
              </CardContent>
            </Card>
            <Card className="bg-white border-black">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-black">Active Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-black">{erpStats.activeUsers || 0}</div>
              </CardContent>
            </Card>
            <Card className="bg-white border-black">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-black">Pending Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-black">{erpStats.pendingOrders || 0}</div>
              </CardContent>
            </Card>
            <Card className="bg-white border-black">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-black">Active Vendors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-black">{erpStats.activeVendors || 0}</div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-black">Business Modules</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module) => (
              <Card 
                key={module.id} 
                className="bg-white border-black hover:border-2 transition-all cursor-pointer"
                onClick={() => setActiveModule(activeModule === module.id ? null : module.id)}
                data-testid={`card-module-${module.id}`}
              >
                <CardHeader>
                  <CardTitle className="text-black">{module.title}</CardTitle>
                  <CardDescription className="text-black">
                    {module.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {activeModule === module.id && (
                    <div className="space-y-2">
                      {module.links.map((link, idx) => (
                        <Link key={idx} href={link.href}>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-black hover:bg-white border-black"
                            data-testid={`button-${module.id}-${idx}`}
                          >
                            {link.name}
                          </Button>
                        </Link>
                      ))}
                    </div>
                  )}
                  {activeModule !== module.id && (
                    <Button
                      variant="outline"
                      className="w-full text-black border-black hover:bg-white"
                      data-testid={`button-expand-${module.id}`}
                    >
                      View Module
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Separator className="my-8" />

        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-black">Quick Access</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/marketplace">
              <Button
                variant="outline"
                className="w-full text-black border-black hover:bg-white"
                data-testid="button-marketplace"
              >
                Marketplace
              </Button>
            </Link>
            <Link href="/community">
              <Button
                variant="outline"
                className="w-full text-black border-black hover:bg-white"
                data-testid="button-community"
              >
                Community
              </Button>
            </Link>
            <Link href="/services">
              <Button
                variant="outline"
                className="w-full text-black border-black hover:bg-white"
                data-testid="button-services"
              >
                Services
              </Button>
            </Link>
            <Link href="/government">
              <Button
                variant="outline"
                className="w-full text-black border-black hover:bg-white"
                data-testid="button-government"
              >
                Government
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
