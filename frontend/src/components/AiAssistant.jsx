import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Bot, Send, User, X, Maximize, Minimize } from "lucide-react";
import { cn } from "@/lib/utils";
import aiService from "@/lib/ai-service";
import { useAuth } from "@/contexts/AuthContext";
import instance from "@/api/instance";

const HorizontalExpandIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M18 8L22 12L18 16"></path>
    <path d="M6 8L2 12L6 16"></path>
    <line x1="2" y1="12" x2="22" y2="12"></line>
  </svg>
);

const VerticalExpandIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M8 18L12 22L16 18"></path>
    <path d="M8 6L12 2L16 6"></path>
    <line x1="12" y1="2" x2="12" y2="22"></line>
  </svg>
);

const formatMessageText = (text) => {
  const boldFormatted = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  const bulletFormatted = boldFormatted.replace(
    /^([-•])\s+(.*?)$/gm,
    '<div class="flex gap-2 mb-1"><span>$1</span><span>$2</span></div>'
  );

  const lineFormatted = bulletFormatted.replace(/\n/g, "<br>");

  return lineFormatted;
};

const AiAssistant = () => {
  const { user, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [expandedHorizontal, setExpandedHorizontal] = useState(false);
  const [expandedVertical, setExpandedVertical] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "assistant",
      content:
        "Welcome to your Vehicle Maintenance Assistant. I can help you with:\n\n• Vehicle maintenance questions - oil changes, tire rotations, etc.\n• Using this application - finding features, booking services\n• Understanding service schedules - when your vehicle needs maintenance\n• Tracking maintenance requests - checking status and next steps\n\nWhat can I help you with today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [userVehicles, setUserVehicles] = useState([]);
  const [readingHistory, setReadingHistory] = useState([]);
  const [maintenanceHistory, setMaintenanceHistory] = useState([]);
  const [recommendedServices, setRecommendedServices] = useState([]);

  useEffect(() => {
    if (open && isAuthenticated) {
      fetchUserData();
    }
  }, [open, isAuthenticated]);

  const fetchUserData = async () => {
    try {
      const [
        vehiclesResponse,
        readingsResponse,
        maintenanceResponse,
        servicesResponse,
      ] = await Promise.all([
        instance.get("/vehicles"),
        instance.get("/odometer/history"),
        instance.get("/maintenance"),
        instance.get("/maintenance-services"),
      ]);

      setUserVehicles(vehiclesResponse || []);
      setReadingHistory(readingsResponse || []);
      setMaintenanceHistory(maintenanceResponse || []);

      const vehicles = vehiclesResponse || [];
      const services = servicesResponse || [];

      const recommendations = vehicles.map((vehicle) => {
        const currentOdometer = vehicle.currentOdometer || 0;
        const applicableServices = services.filter(
          (service) =>
            currentOdometer >= service.minMileage &&
            currentOdometer <= service.maxMileage
        );

        return {
          vehicleId: vehicle.vehicleId || vehicle.id,
          services: applicableServices.map((s) => s.name || s.serviceName),
        };
      });

      setRecommendedServices(recommendations);
    } catch (error) {
      console.error("Error fetching data for AI context:", error);
    }
  };

  useEffect(() => {
    if (
      open &&
      isAuthenticated &&
      user &&
      messages.length === 1 &&
      userVehicles.length > 0
    ) {
      const systemContext = {
        id: Date.now(),
        role: "system",
        content: `PRIVATE USER CONTEXT (NEVER EXPOSE THIS DATA IN RESPONSES):\nUser: ${
          user.username || user.email.split("@")[0]
        }\nEmail: ${user.email}\nRole: ${user.role || "User"}\nUserID: ${
          user.id
        }\n\nUSER VEHICLES:\n${JSON.stringify(
          userVehicles,
          null,
          2
        )}\n\nREADING HISTORY:\n${JSON.stringify(
          readingHistory,
          null,
          2
        )}\n\nMAINTENANCE HISTORY:\n${JSON.stringify(
          maintenanceHistory,
          null,
          2
        )}\n\nRECOMMENDED SERVICES:\n${JSON.stringify(
          recommendedServices,
          null,
          2
        )}\n\nREMEMBER: Never mention the user's role, ID, or email in your responses. If personalizing, only use their first name. You can reference their vehicles by make/model, current odometer readings, and maintenance history when answering questions.`,
        timestamp: new Date(),
        isHidden: true,
      };

      setMessages((prev) => [...prev, systemContext]);
    }
  }, [
    open,
    isAuthenticated,
    user,
    userVehicles,
    readingHistory,
    maintenanceHistory,
    recommendedServices,
  ]);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!input.trim()) return;

    const userMessage = {
      id: Date.now(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const chatHistory = messages
        .filter((msg) => !msg.isHidden)
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

      let contextualizedInput = input;
      if (isAuthenticated && user) {
        // Add user context as a prefix to the API call
        chatHistory.unshift({
          role: "system",
          content: `PRIVATE USER CONTEXT (NEVER REVEAL THIS IN RESPONSES):\nName: ${
            user.username || user.email.split("@")[0]
          }\nEmail: ${user.email}\nRole: ${user.role || "User"}\nUserID: ${
            user.id
          }\n\nUSER VEHICLES:\n${JSON.stringify(
            userVehicles,
            null,
            2
          )}\n\nRECOMMENDED SERVICES:\n${JSON.stringify(
            recommendedServices,
            null,
            2
          )}\n\nNEVER mention the user's role, ID, or email in responses. Use only their first name if personalizing. You can reference their vehicles by make/model and current odometer readings when answering questions.`,
        });
      }

      const response = await aiService.callGeminiApi(
        contextualizedInput,
        chatHistory
      );

      const aiResponse = {
        id: Date.now() + 1,
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      console.error("Error getting AI response:", error);

      const errorResponse = {
        id: Date.now() + 1,
        role: "assistant",
        content:
          "I'm sorry, I'm having trouble processing your request right now. Please try again later.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorResponse]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const toggleFullExpansion = () => {
    if (expandedHorizontal && expandedVertical) {
      setExpandedHorizontal(false);
      setExpandedVertical(false);
    } else {
      setExpandedHorizontal(true);
      setExpandedVertical(true);
    }
  };

  return (
    <>
      {/* Floating button */}
      <Sheet open={open} onOpenChange={setOpen} className="z-50">
        <SheetTrigger asChild>
          <Button
            size="lg"
            className="fixed bottom-6 right-6 z-50 rounded-full h-14 w-14 p-0 shadow-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white transition-all duration-300 border border-primary/20"
          >
            <Bot className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="right"
          className={cn(
            "p-0 border border-border/50 overflow-hidden flex flex-col shadow-2xl bg-gradient-to-b from-background to-background/95 transition-all duration-300 sheet-content",
            expandedHorizontal && expandedVertical
              ? "fullscreen-sheet"
              : expandedHorizontal && !expandedVertical
              ? "width-expanded-sheet"
              : !expandedHorizontal && expandedVertical
              ? "height-expanded-sheet"
              : "default-sheet"
          )}
        >
          <SheetHeader className="px-5 py-4 border-b bg-gradient-to-r from-primary/5 to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-primary/20 to-primary/10 p-1.5 rounded-lg">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <SheetTitle className="text-xl font-semibold text-foreground/90">
                  Maintenance Assistant
                  {isAuthenticated && user && (
                    <div className="text-sm font-normal text-muted-foreground">
                      Hello, {user.username || user.email.split("@")[0]}
                    </div>
                  )}
                </SheetTitle>
              </div>
              <div className="flex items-center gap-2 mt-10">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-primary/10 relative group"
                  onClick={() => setExpandedHorizontal(!expandedHorizontal)}
                  title="Expand horizontally"
                >
                  <HorizontalExpandIcon className="h-4 w-4" />
                  <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs bg-black/75 text-white px-2 py-1 rounded hidden group-hover:block whitespace-nowrap">
                    {expandedHorizontal ? "Collapse width" : "Expand width"}
                  </span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-primary/10 relative group"
                  onClick={() => setExpandedVertical(!expandedVertical)}
                  title="Expand vertically"
                >
                  <VerticalExpandIcon className="h-4 w-4" />
                  <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs bg-black/75 text-white px-2 py-1 rounded hidden group-hover:block whitespace-nowrap">
                    {expandedVertical ? "Collapse height" : "Expand height"}
                  </span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-primary/10 relative group"
                  onClick={toggleFullExpansion}
                  title="Toggle fullscreen"
                >
                  {expandedHorizontal && expandedVertical ? (
                    <Minimize className="h-4 w-4" />
                  ) : (
                    <Maximize className="h-4 w-4" />
                  )}
                  <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs bg-black/75 text-white px-2 py-1 rounded hidden group-hover:block whitespace-nowrap">
                    {expandedHorizontal && expandedVertical
                      ? "Exit fullscreen"
                      : "Fullscreen"}
                  </span>
                </Button>
                {/* <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-primary/10"
                  onClick={() => setOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button> */}
              </div>
            </div>
          </SheetHeader>

          {/* Messages container */}
          <div
            ref={messagesContainerRef}
            className="flex-1 p-5 overflow-y-auto custom-scrollbar bg-gradient-to-b from-transparent to-background/40"
          >
            <div className="space-y-6">
              {messages
                .filter((msg) => !msg.isHidden)
                .map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3 max-w-[92%]",
                      message.role === "assistant"
                        ? ""
                        : "ml-auto flex-row-reverse"
                    )}
                  >
                    {message.role === "assistant" ? (
                      <div className="flex-shrink-0 h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center mt-1">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    ) : (
                      <div className="flex-shrink-0 h-8 w-8 bg-muted rounded-full flex items-center justify-center mt-1">
                        <User className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <div
                        className={cn(
                          "px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed rounded-xl shadow-sm",
                          message.role === "assistant"
                            ? "bg-card text-card-foreground border border-border/40"
                            : "bg-primary/90 text-primary-foreground"
                        )}
                        dangerouslySetInnerHTML={{
                          __html: formatMessageText(message.content),
                        }}
                      />
                      <div className="mt-1.5 text-xs text-muted-foreground pl-1">
                        {formatTime(message.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
              {loading && (
                <div className="flex gap-3 max-w-[92%]">
                  <div className="flex-shrink-0 h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center mt-1">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="bg-card text-card-foreground px-4 py-3 text-sm rounded-xl border border-border/40 shadow-sm">
                      <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-primary/40 animate-pulse"></div>
                        <div className="h-2 w-2 rounded-full bg-primary/60 animate-pulse delay-150"></div>
                        <div className="h-2 w-2 rounded-full bg-primary/80 animate-pulse delay-300"></div>
                        <span className="ml-1 text-muted-foreground">
                          Thinking...
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} className="h-1" />
            </div>
          </div>

          <div className="p-4 border-t bg-gradient-to-r from-background to-background/95">
            <form
              onSubmit={handleSendMessage}
              className="flex gap-2 items-center"
            >
              <Input
                placeholder="Ask about vehicle maintenance..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 border-primary/20 focus-visible:ring-primary/30 bg-card/80 placeholder:text-muted-foreground/70"
                disabled={loading}
              />
              <Button
                type="submit"
                size="icon"
                className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground h-10 w-10 flex-shrink-0"
                disabled={!input.trim() || loading}
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </SheetContent>
      </Sheet>

      <style jsx global>{`
        /* Custom scrollbar styles */
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.03);
          border-radius: 100px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.25);
          border-radius: 100px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.4);
        }

        /* Firefox */
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(0, 0, 0, 0.25) rgba(0, 0, 0, 0.03);
        }

        /* Hide default close button */
        [data-radix-sheet-content] [data-radix-sheet-close] {
          display: none !important;
        }

        /* Sheet expansion styles */
        .sheet-content {
          right: 0 !important;
          left: auto !important;
          transform: none !important;
          position: fixed !important;
        }

        .fullscreen-sheet {
          width: 100vw !important;
          height: 100vh !important;
          max-height: 100vh !important;
          max-width: 100vw !important;
          border-radius: 0 !important;
        }

        .width-expanded-sheet {
          width: 100vw !important;
          max-width: 100vw !important;
          height: 650px !important;
          max-height: 85vh !important;
          border-radius: 0 !important;
        }

        .height-expanded-sheet {
          width: 450px !important;
          max-width: 90vw !important;
          height: 100vh !important;
          max-height: 100vh !important;
          border-radius: 0 !important;
        }

        .default-sheet {
          width: 450px !important;
          max-width: 90vw !important;
          height: 650px !important;
          max-height: 85vh !important;
          border-radius: 12px !important;
        }

        @media (max-width: 640px) {
          .default-sheet,
          .height-expanded-sheet {
            width: 90vw !important;
          }
        }
      `}</style>
    </>
  );
};

export default AiAssistant;
