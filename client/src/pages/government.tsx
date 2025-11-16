import { useEffect } from "react";
import { useLocation } from "wouter";

export default function GovernmentPage() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    setLocation("/dr-congo", { replace: true });
  }, [setLocation]);

  return null;
}
