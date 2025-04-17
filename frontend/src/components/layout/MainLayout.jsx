import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CarFront,
  ChevronDown,
  ClipboardList,
  GaugeCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Users,
  Wrench,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import AiAssistant from "@/components/AiAssistant";

const adminNavItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Maintenance Requests",
    href: "/admin/requests",
    icon: ClipboardList,
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Services",
    href: "/admin/services",
    icon: Wrench,
  },
];

const userNavItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: GaugeCircle,
  },
  {
    title: "My Vehicles",
    href: "/vehicles",
    icon: CarFront,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

const MainLayout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isAdmin = user?.role === "admin";
  const navItems = isAdmin ? adminNavItems : userNavItems;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/80">
      <div className="fixed inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

      {/* Mobile Navigation */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            className="lg:hidden fixed top-4 left-4 z-50 bg-background/80 backdrop-blur-sm border border-border/50"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-80 bg-background/95 backdrop-blur-xl border-r border-border/50"
        >
          <SheetHeader className="mb-6">
            <SheetTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/50">
              Vehicle Maintenance
            </SheetTitle>
          </SheetHeader>
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 group relative overflow-hidden",
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "hover:bg-muted/80"
                  )}
                >
                  {isActive && (
                    <span className="absolute inset-y-0 left-0 w-1 bg-primary rounded-full" />
                  )}
                  <Icon
                    className={cn(
                      "h-4 w-4 transition-transform duration-200",
                      isActive ? "text-primary" : "group-hover:scale-110"
                    )}
                  />
                  {item.title}
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-80 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-background/95 backdrop-blur-xl border-r border-border/50 px-6 pb-4">
          <div className="flex h-16 items-center">
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/50">
              Vehicle Maintenance
            </h2>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="space-y-2">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.href;
                    return (
                      <li key={item.href}>
                        <Link
                          to={item.href}
                          className={cn(
                            "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 relative overflow-hidden",
                            isActive
                              ? "bg-primary/10 text-primary font-medium"
                              : "hover:bg-muted/80"
                          )}
                        >
                          {isActive && (
                            <span className="absolute inset-y-0 left-0 w-1 bg-primary rounded-full" />
                          )}
                          <Icon
                            className={cn(
                              "h-4 w-4 transition-transform duration-200",
                              isActive
                                ? "text-primary"
                                : "group-hover:scale-110"
                            )}
                          />
                          {item.title}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-80">
        <div
          className={cn(
            "sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-border/50 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8 backdrop-blur-xl transition-all duration-200",
            scrolled ? "bg-background/95" : "bg-transparent"
          )}
        >
          <div className="flex flex-1 justify-end gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 px-2 hover:bg-primary/10"
                  >
                    <Avatar className="h-8 w-8 ring-2 ring-border ring-offset-2 ring-offset-background transition-all duration-200 hover:ring-primary">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {user?.name?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden lg:block font-medium">
                      {user?.name || "User"}
                    </span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 bg-background/95 backdrop-blur-xl border-border/50"
                >
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>

      {/* AI Assistant */}
      <AiAssistant />
    </div>
  );
};

export default MainLayout;
