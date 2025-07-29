import { useEffect } from "react";
import { useLocation } from "wouter";

// Business Vendor form is simply the main vendor form with type=business
export default function BecomeBusinessVendorPage() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Redirect to the main vendor form with business type pre-selected
    setLocation("/become-vendor?type=business");
  }, [setLocation]);

  return null;
}