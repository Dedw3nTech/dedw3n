import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LoginPromptModal } from "@/components/LoginPromptModal";

export default function CleanHome() {
  const [showLoginModal, setShowLoginModal] = useState(false);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <Button
          onClick={() => setShowLoginModal(true)}
          className="px-8 py-3 text-lg font-medium bg-black hover:bg-gray-900 text-white"
        >
          Login
        </Button>
      </div>
      
      <LoginPromptModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        action="join"
      />
    </div>
  );
}