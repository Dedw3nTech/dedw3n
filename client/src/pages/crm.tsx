import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";

export default function CRMPage() {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: crmStats } = useQuery<any>({
    queryKey: ['/api/crm/stats'],
  });

  const { data: recentCustomers } = useQuery<any>({
    queryKey: ['/api/crm/customers/recent'],
  });

  const sections = [
    {
      id: 'customer-management',
      title: 'Customer Management',
      description: 'View and manage customer profiles and interactions',
      links: [
        { name: 'All Customers', href: '/community' },
        { name: 'Active Accounts', href: '/profile-settings' },
        { name: 'Customer Database', href: '/crm/customers' },
      ]
    },
    {
      id: 'sales-pipeline',
      title: 'Sales Pipeline',
      description: 'Track sales opportunities and conversion rates',
      links: [
        { name: 'Marketplace Sales', href: '/marketplace' },
        { name: 'Vendor Relationships', href: '/vendors' },
        { name: 'Sales Dashboard', href: '/crm/sales' },
      ]
    },
    {
      id: 'marketing',
      title: 'Marketing Automation',
      description: 'Campaign management and customer engagement',
      links: [
        { name: 'Community Engagement', href: '/community' },
        { name: 'Email Campaigns', href: '/crm/campaigns' },
        { name: 'Marketing Analytics', href: '/crm/marketing' },
      ]
    },
    {
      id: 'finance',
      title: 'Financial Integration',
      description: 'Customer payment history and financial data',
      links: [
        { name: 'Transaction History', href: '/marketplace' },
        { name: 'Payment Management', href: '/orders' },
        { name: 'Financial Reports', href: '/crm/finance' },
      ]
    },
    {
      id: 'government',
      title: 'Government Compliance',
      description: 'Regulatory compliance and customer data management',
      links: [
        { name: 'Government Services', href: '/government' },
        { name: 'Compliance Dashboard', href: '/crm/compliance' },
        { name: 'Data Privacy', href: '/crm/privacy' },
      ]
    },
    {
      id: 'lifestyle',
      title: 'Lifestyle Services',
      description: 'Customer lifestyle preferences and service management',
      links: [
        { name: 'Lifestyle Portal', href: '/lifestyle' },
        { name: 'Service Subscriptions', href: '/services' },
        { name: 'Customer Preferences', href: '/crm/preferences' },
      ]
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">
            Customer Relationship Management
          </h1>
          <p className="text-black">
            Centralized customer data and relationship management system
          </p>
        </div>

        <Separator className="mb-8" />

        {/* Search Bar */}
        <div className="mb-8">
          <Input
            type="text"
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md bg-white border-black text-black placeholder:text-gray-400"
            data-testid="input-search-customers"
          />
        </div>

        {/* Statistics Dashboard */}
        {crmStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-white border-black">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-black">Total Customers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-black">{crmStats.totalCustomers || 0}</div>
              </CardContent>
            </Card>
            <Card className="bg-white border-black">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-black">Active Interactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-black">{crmStats.activeInteractions || 0}</div>
              </CardContent>
            </Card>
            <Card className="bg-white border-black">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-black">Total Sales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-black">{crmStats.totalSales || 0}</div>
              </CardContent>
            </Card>
            <Card className="bg-white border-black">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-black">Conversion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-black">{crmStats.conversionRate || 0}%</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recent Customers */}
        {recentCustomers && recentCustomers.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-black mb-4">Recent Customer Activity</h2>
            <Card className="bg-white border-black">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {recentCustomers.map((customer: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between border-b border-gray-200 pb-3 last:border-0">
                      <div>
                        <p className="font-medium text-black">{customer.name || customer.username}</p>
                        <p className="text-sm text-black">{customer.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-black">{customer.lastActivity || 'Recently active'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* CRM Sections */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-black">CRM Modules</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sections.map((section) => (
              <Card 
                key={section.id} 
                className="bg-white border-black hover:border-2 transition-all cursor-pointer"
                onClick={() => setActiveSection(activeSection === section.id ? null : section.id)}
                data-testid={`card-section-${section.id}`}
              >
                <CardHeader>
                  <CardTitle className="text-black">{section.title}</CardTitle>
                  <CardDescription className="text-black">
                    {section.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {activeSection === section.id && (
                    <div className="space-y-2">
                      {section.links.map((link, idx) => (
                        <Link key={idx} href={link.href}>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-black hover:bg-white border-black"
                            data-testid={`button-${section.id}-${idx}`}
                          >
                            {link.name}
                          </Button>
                        </Link>
                      ))}
                    </div>
                  )}
                  {activeSection !== section.id && (
                    <Button
                      variant="outline"
                      className="w-full text-black border-black hover:bg-white"
                      data-testid={`button-expand-${section.id}`}
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

        {/* Quick Actions */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-black">Quick Access</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Link href="/marketplace">
              <Button
                variant="outline"
                className="w-full text-black border-black hover:bg-white"
                data-testid="button-marketplace"
              >
                Marketplace
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
            <Link href="/lifestyle">
              <Button
                variant="outline"
                className="w-full text-black border-black hover:bg-white"
                data-testid="button-lifestyle"
              >
                Lifestyle
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
          </div>
        </div>
      </div>
    </div>
  );
}
