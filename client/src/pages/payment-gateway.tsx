import { useLocation } from "wouter";
import { useEffect } from "react";

// Redirect to the new checkout page
export default function PaymentGateway() {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    setLocation('/checkout-new');
  }, [setLocation]);

  return null;
}