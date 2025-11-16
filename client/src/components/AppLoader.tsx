import { ThinkingLoader } from "@/components/ui/thinking-loader";

export function AppLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <ThinkingLoader size="md" />
    </div>
  );
}
