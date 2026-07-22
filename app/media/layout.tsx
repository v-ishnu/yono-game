"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout } from "@/store/slices/authSlice";
import {
  LayoutDashboard,
  Gamepad2,
  Users,
  MessageSquare,
  LogOut,
  ChevronRight,
  Image as ImageIcon,
} from "lucide-react";

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/games", label: "Games", icon: Gamepad2 },
  { href: "/media", label: "Media", icon: ImageIcon },
  { href: "/admins", label: "Admins", icon: Users },
  { href: "/contacts", label: "Contacts", icon: MessageSquare },
];

export default function MediaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { admin, isInitialized } = useAppSelector((s) => s.auth);

  useEffect(() => {
    if (isInitialized && !admin) {
      router.replace("/login");
    }
  }, [admin, router, isInitialized]);

  if (!isInitialized || !admin) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="spinner" />
      </div>
    );
  }

  const handleLogout = () => {
    dispatch(logout());
    router.push("/login");
  };

  const activePage = navLinks.find((n) => pathname === n.href || pathname.startsWith(n.href + "/"));

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, background: "linear-gradient(135deg, #cba6f7, #89b4fa)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Gamepad2 size={18} color="#11111b" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-text)", lineHeight: 1.2 }}>Yono Games</div>
              <div style={{ fontSize: 11, color: "var(--text-overlay)" }}>Admin Panel</div>
            </div>
          </div>
        </div>
        <nav className="sidebar-nav">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link key={href} href={href} className={`nav-item ${isActive ? "active" : ""}`}>
                <Icon size={18} />
                <span style={{ flex: 1 }}>{label}</span>
                {isActive && <ChevronRight size={14} />}
              </Link>
            );
          })}
        </nav>
        <div style={{ padding: "16px 10px", borderTop: "1px solid var(--bg-surface0)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, background: "var(--bg-surface0)", marginBottom: 8 }}>
            <div style={{ width: 34, height: 34, borderRadius: 99, background: "linear-gradient(135deg, #cba6f7, #89b4fa)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#11111b", flexShrink: 0 }}>
              {admin.name?.[0]?.toUpperCase() || "A"}
            </div>
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{admin.name}</div>
              <div style={{ fontSize: 11, color: "var(--accent-purple)", textTransform: "capitalize" }}>{admin.role?.replace("_", " ")}</div>
            </div>
          </div>
          <button id="media-sidebar-logout" onClick={handleLogout} className="nav-item" style={{ width: "100%", background: "none", border: "none", color: "var(--accent-red)" }}>
            <LogOut size={16} />Logout
          </button>
        </div>
      </aside>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <header className="topbar">
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-text)" }}>
              {activePage?.label || "Media"}
            </h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 13, color: "var(--text-overlay)" }}>
              {isInitialized ? new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""}
            </span>
            <div style={{ width: 32, height: 32, borderRadius: 99, background: "linear-gradient(135deg, #cba6f7, #89b4fa)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#11111b" }}>
              {admin.name?.[0]?.toUpperCase() || "A"}
            </div>
          </div>
        </header>
        <main style={{ flex: 1, overflow: "auto", padding: "28px", background: "var(--bg-base)" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
