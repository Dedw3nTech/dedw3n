import { useLocation } from "wouter";
import { useEffect } from "react";

// Redirect to the main checkout page
export default function PaymentGateway() {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    setLocation('/checkout');
  }, [setLocation]);

  return null;
}