import { useLocation } from "wouter";
import UserMenu from "../ui/user-menu";
import Logo from "../ui/logo";

export default function Header() {
  const [location, setLocation] = useLocation();

  return (
    <header className="bg-background shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        {/* Single header row with everything aligned */}
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-3">
            <Logo size="md" />
            <span className="text-xs font-bold text-red-600 ml-1">BETA VERSION</span>
          </div>

          {/* Center navigation links */}
          <div className="flex items-center space-x-8">
            <button
              onClick={() => setLocation("/products")}
              className="text-sm font-medium text-gray-600 hover:text-black transition-colors"
            >
              Marketplace
            </button>
            <button
              onClick={() => setLocation("/wall")}
              className="text-sm font-medium text-gray-600 hover:text-black transition-colors"
            >
              Community
            </button>
            <button
              onClick={() => setLocation("/dating")}
              className="text-sm font-medium text-gray-600 hover:text-black transition-colors"
            >
              Dating
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
}