import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { LogOut, ShieldCheck, User as UserIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
        <Link to="/" className="flex items-center gap-2" aria-label="TryoutKopdes.com">
          <img
            src="/tryoutkopdes-logo.png"
            alt="TryoutKopdes.com"
            className="h-9 w-auto sm:h-10 object-contain"
          />
          <span className="sr-only">TryoutKopdes.com</span>
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

        <div className="flex items-center gap-3">
          {!user ? (
            <>
              <Button asChild variant="ghost" size="sm">
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

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-card mt-16">
      <div className="container mx-auto px-4 py-10 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-4 text-center md:flex-row md:text-left">
          <div className="flex items-center gap-3">
            <img
              src="/tryoutkopdes-logo.png"
              alt="TryoutKopdes.com"
              className="h-10 w-auto object-contain"
            />
            <div className="text-xs text-muted-foreground">
              Platform Tryout CBT Koperasi Desa Merah Putih
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Koperasi Desa Merah Putih. Semua hak dilindungi.
          </p>
        </div>
      </div>
    </footer>
  );
}
