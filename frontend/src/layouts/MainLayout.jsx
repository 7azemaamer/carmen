import { Outlet, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  CarFront,
  ClipboardList,
  GaugeCircle,
  LogOut,
  Menu,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import AiAssistant from "@/components/AiAssistant";

const MainLayout = () => {
  const { isAuthenticated, logout, isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const NavLinks = () => (
    <>
      <Link
        to="/"
        className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-2"
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <GaugeCircle className="h-4 w-4" />
        Home
      </Link>
      <Link
        to="/vehicles"
        className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-2"
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <CarFront className="h-4 w-4" />
        My Vehicles
      </Link>
      <Link
        to="/readings"
        className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-2"
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <ClipboardList className="h-4 w-4" />
        Reading History
      </Link>

      {isAdmin && (
        <>
          <Link
            to="/admin/vehicles"
            className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-2"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <CarFront className="h-4 w-4" />
            All Vehicles
          </Link>
          <Link
            to="/admin/services"
            className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-2"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <Wrench className="h-4 w-4" />
            Services
          </Link>
          <Link
            to="/admin/requests"
            className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-2"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <ClipboardList className="h-4 w-4" />
            Maintenance Requests
          </Link>
        </>
      )}
    </>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-background/80">
      <div className="fixed inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/95 backdrop-blur-xl shadow-lg">
        <div className="container mx-auto py-4 px-6 flex justify-between items-center">
          <Link
            to="/"
            className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/50 flex items-center gap-2"
          >
            <CarFront className="h-6 w-6 text-primary" />
            <span className="hidden sm:inline">
              Vehicle Maintenance Tracker
            </span>
            <span className="sm:hidden">VMT</span>
          </Link>

          <nav className="flex items-center gap-6">
            {isAuthenticated ? (
              <>
                <div className="hidden md:flex items-center gap-6">
                  <NavLinks />
                </div>

                <Sheet
                  open={isMobileMenuOpen}
                  onOpenChange={setIsMobileMenuOpen}
                >
                  <SheetTrigger asChild className="md:hidden">
                    <Button variant="ghost" size="icon">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-80">
                    <div className="flex flex-col gap-6 mt-8">
                      <NavLinks />
                      <Button
                        variant="destructive"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          handleLogout();
                        }}
                        className="w-full"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Log out
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="hidden md:flex items-center gap-2 px-2 hover:bg-primary/10"
                    >
                      <Avatar className="h-8 w-8 ring-2 ring-border ring-offset-2 ring-offset-background transition-all duration-200 hover:ring-primary">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {user?.name?.[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden lg:block font-medium">
                        {user?.name || "User"}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-56 bg-background/95 backdrop-blur-xl border-border/50"
                  >
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <Button asChild variant="ghost" className="hover:bg-primary/10">
                  <Link to="/login">Login</Link>
                </Button>
                <Button asChild>
                  <Link to="/register">Register</Link>
                </Button>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-6 py-8 relative z-10">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-background/95 backdrop-blur-xl border-t border-border/50 py-6 relative z-10">
        <div className="container mx-auto px-6 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Vehicle Maintenance Tracker. All rights
            reserved.
          </p>
        </div>
      </footer>

      {/* AI Assistant */}
      <AiAssistant />
    </div>
  );
};

export default MainLayout;
