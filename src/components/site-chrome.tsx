import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  ShieldCheck,
  User as UserIcon,
  Home,
  Package,
  LayoutDashboard,
  LogIn,
  UserPlus,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5" aria-label="TryoutKopdes.com">
          <img
            src="/tryoutkopdes-icon.png"
            alt=""
            className="h-9 w-9 sm:h-10 sm:w-10 object-contain"
          />
          <span className="text-lg sm:text-xl font-extrabold tracking-tight leading-none">
            <span className="text-foreground">TRYOUT</span>
            <span className="text-primary">KOPDES</span>
            <span className="text-foreground">.COM</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link
            to="/"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            activeProps={{ className: "text-primary" }}
          >
            Beranda
          </Link>
          <Link
            to="/paket"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            activeProps={{ className: "text-primary" }}
          >
            Paket Tryout
          </Link>
          {user && (
            <Link
              to="/dashboard"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              activeProps={{ className: "text-primary" }}
            >
              Dashboard
            </Link>
          )}
          {role === "admin" && (
            <Link
              to="/admin"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              activeProps={{ className: "text-primary" }}
            >
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {!user ? (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/auth">Masuk</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/auth" search={{ mode: "signup" }}>
                  Daftar
                </Link>
              </Button>
            </>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <UserIcon className="size-4" />
                  <span className="hidden sm:inline">{user.email?.split("@")[0]}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Masuk sebagai</span>
                    <span className="truncate text-sm">{user.email}</span>
                    {role === "admin" && (
                      <span className="mt-1 inline-flex items-center gap-1 text-xs text-primary">
                        <ShieldCheck className="size-3" /> Administrator
                      </span>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/dashboard">Dashboard</Link>
                </DropdownMenuItem>
                {role === "admin" && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin">Panel Admin</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="mr-2 size-4" />
                  Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}

type BottomNavItem = {
  to: string;
  label: string;
  icon: typeof Home;
  search?: Record<string, string>;
};

function BottomNavLink({ item }: { item: BottomNavItem }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      search={item.search as never}
      className="group relative flex flex-1 flex-col items-center justify-center gap-1 py-2 text-muted-foreground transition-colors active:scale-95"
      activeProps={{ "data-active": "true" } as never}
      activeOptions={{ exact: item.to === "/" }}
    >
      {({ isActive }: { isActive: boolean }) => (
        <>
          <span
            className={cn(
              "flex h-9 w-14 items-center justify-center rounded-full transition-all",
              isActive ? "bg-primary/12 text-primary" : "text-muted-foreground",
            )}
          >
            <Icon className={cn("size-5 transition-transform", isActive && "scale-110")} />
          </span>
          <span
            className={cn(
              "text-[10.5px] font-medium leading-none tracking-tight transition-colors",
              isActive ? "text-primary" : "text-muted-foreground",
            )}
          >
            {item.label}
          </span>
        </>
      )}
    </Link>
  );
}

export function SiteBottomNav() {
  const { user, role } = useAuth();

  const items: BottomNavItem[] = [
    { to: "/", label: "Beranda", icon: Home },
    { to: "/paket", label: "Paket", icon: Package },
  ];

  if (user) {
    items.push({ to: "/dashboard", label: "Dashboard", icon: LayoutDashboard });
    if (role === "admin") {
      items.push({ to: "/admin", label: "Admin", icon: ShieldCheck });
    }
  } else {
    items.push({ to: "/auth", label: "Masuk", icon: LogIn });
    items.push({ to: "/auth", label: "Daftar", icon: UserPlus, search: { mode: "signup" } });
  }

  return (
    <>
      {/* Spacer so page content isn't hidden behind the fixed nav on mobile */}
      <div aria-hidden className="h-16 md:hidden" />

      <nav
        aria-label="Navigasi utama"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto flex max-w-md items-stretch justify-around px-1">
          {items.map((item) => (
            <BottomNavLink key={`${item.to}-${item.label}`} item={item} />
          ))}
        </div>
      </nav>
    </>
  );
}

export function SiteFooter() {
  return (
    <>
      <footer className="border-t border-border/60 bg-card mt-16">
        <div className="container mx-auto px-4 py-10 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-4 text-center md:flex-row md:text-left">
            <div className="flex items-center gap-2.5">
              <img
                src="/tryoutkopdes-icon.png"
                alt=""
                className="h-10 w-10 object-contain"
              />
              <div className="leading-tight">
                <div className="text-base font-extrabold tracking-tight">
                  <span className="text-foreground">TRYOUT</span>
                  <span className="text-primary">KOPDES</span>
                  <span className="text-foreground">.COM</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Platform Tryout CBT Koperasi Desa Merah Putih
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Koperasi Desa Merah Putih. Semua hak dilindungi.
            </p>
          </div>
        </div>
      </footer>
      <SiteBottomNav />
    </>
  );
}
