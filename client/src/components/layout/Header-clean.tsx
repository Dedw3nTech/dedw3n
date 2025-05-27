import { useLocation } from "wouter";
import UserMenu from "../ui/user-menu";
import Logo from "../ui/logo";

export default function Header() {
  return (
    <header className="bg-background shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-3">
            <Logo size="md" />
            <span className="text-xs font-bold text-red-600 ml-1">BETA VERSION</span>
          </div>

          <div className="flex items-center space-x-4">
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
}