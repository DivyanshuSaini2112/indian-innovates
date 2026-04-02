import Navbar from "@/components/Navbar";
import BadalChatbot from "@/components/BadalChatbot";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1">
        {children}
      </div>
      {/* Badal AI Chatbot — floating on all app pages */}
      <BadalChatbot />
    </div>
  );
}
