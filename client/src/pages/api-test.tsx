import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function NotFoundPage() {
  return (
    <div className="container flex flex-col items-center justify-center min-h-[70vh] py-10 text-center">
      <h1 className="text-4xl font-bold mb-6">404 - Page Not Found</h1>
      <p className="text-lg text-muted-foreground mb-8">
        The API testing page has been removed as requested. Only production APIs are available.
      </p>
      <Link href="/">
        <Button size="lg">
          Return to Home
        </Button>
      </Link>
    </div>
  );
}