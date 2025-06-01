import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SiteMap() {
  const siteStructure = {
    "Main Platform": [
      { name: "Marketplace", path: "/products", description: "Browse and sell products across B2B, B2C, and C2C markets" },
      { name: "Community", path: "/wall", description: "Connect with verified users and share experiences" },
      { name: "Dating", path: "/dating", description: "Meet people through our secure dating platform" },
      { name: "Contact", path: "/contact", description: "Get in touch with our support team" }
    ],
    "User Account": [
      { name: "Login", path: "/login", description: "Sign in to your account" },
      { name: "Register", path: "/register", description: "Create a new account" },
      { name: "Profile", path: "/profile", description: "Manage your profile settings" },
      { name: "Messages", path: "/messages", description: "View your conversations" },
      { name: "Notifications", path: "/notifications", description: "Check your notifications" }
    ],
    "Marketplace Features": [
      { name: "B2B Commerce", path: "/products?market=b2b", description: "Business-to-business marketplace" },
      { name: "B2C Shopping", path: "/products?market=b2c", description: "Business-to-consumer marketplace" },
      { name: "C2C Trading", path: "/products?market=c2c", description: "Consumer-to-consumer marketplace" },
      { name: "Product Categories", path: "/products#categories", description: "Browse by product category" }
    ],
    "Community Features": [
      { name: "Social Feed", path: "/wall", description: "Community posts and updates" },
      { name: "User Profiles", path: "/wall#profiles", description: "Discover community members" },
      { name: "Groups", path: "/wall#groups", description: "Join interest-based groups" }
    ]
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Site Map</h1>
        <p className="text-gray-600 max-w-2xl">
          Navigate through all sections of the Dedw3n platform. Our site is organized to help you 
          easily find marketplace products, connect with the community, and discover meaningful relationships.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        {Object.entries(siteStructure).map(([section, links]) => (
          <Card key={section} className="h-fit">
            <CardHeader>
              <CardTitle className="text-lg">{section}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.path}>
                    <Link href={link.path} className="block group">
                      <div className="text-blue-600 hover:text-blue-800 font-medium group-hover:underline">
                        {link.name}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {link.description}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-12 p-6 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Platform Architecture</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <h3 className="font-medium text-blue-600 mb-2">Commerce Layer</h3>
            <p className="text-sm text-gray-600">
              Multi-market marketplace supporting B2B, B2C, and C2C transactions with secure payment processing.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-blue-600 mb-2">Social Layer</h3>
            <p className="text-sm text-gray-600">
              Community platform with verified users, social feeds, messaging, and group features.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-blue-600 mb-2">Connection Layer</h3>
            <p className="text-sm text-gray-600">
              Dating platform with advanced matching, secure communication, and relationship building tools.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}