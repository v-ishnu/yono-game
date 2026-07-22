"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout } from "@/store/slices/authSlice";
import api from "@/lib/api";
import toast from "react-hot-toast";
import {
  LayoutDashboard,
  Gamepad2,
  Users,
  MessageSquare,
  LogOut,
  ChevronRight,
  Mail,
  Phone,
  CheckCheck,
  Image as ImageIcon,
} from "lucide-react";

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/games", label: "Games", icon: Gamepad2 },
  { href: "/media", label: "Media", icon: ImageIcon },
  { href: "/admins", label: "Admins", icon: Users },
  { href: "/contacts", label: "Contacts", icon: MessageSquare },
];

interface Contact {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  message?: string;
  subject?: string;
  isRead?: boolean;
  createdAt: string;
}

export default function ContactsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { admin, isInitialized } = useAppSelector((s) => s.auth);

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isInitialized && !admin) { router.replace("/login"); return; }
    if (admin) {
      loadContacts();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin, isInitialized]);

  const loadContacts = async () => {
    setLoading(true);
    try {
      const res = await api.get("/contact");
      setContacts(res.data?.data || []);
    } catch {
      // API might not have GET /contact yet — show empty state gracefully
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await api.patch("/update-contact", { id, isRead: true });
      setContacts((prev) =>
        prev.map((c) => (c._id === id ? { ...c, isRead: true } : c))
      );
      toast.success("Marked as read");
    } catch {
      toast.error("Failed to update");
    }
  };

  if (!isInitialized || !admin) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><div className="spinner" /></div>;

  const handleLogout = () => { dispatch(logout()); router.push("/login"); };
  const unread = contacts.filter((c) => !c.isRead).length;

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
                <Icon size={18} /><span style={{ flex: 1 }}>{label}</span>
                {label === "Contacts" && unread > 0 && (
                  <span style={{ background: "var(--accent-red)", color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 99, padding: "1px 6px" }}>{unread}</span>
                )}
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
          <button id="contacts-logout" onClick={handleLogout} className="nav-item" style={{ width: "100%", background: "none", border: "none", color: "var(--accent-red)" }}>
            <LogOut size={16} />Logout
          </button>
        </div>
      </aside>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <header className="topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-text)" }}>Contacts</h2>
            {unread > 0 && (
              <span className="badge badge-red">{unread} Unread</span>
            )}
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
          <div className="page-header">
            <div>
              <h1 className="page-title">Contact Submissions</h1>
              <p className="page-subtitle">{contacts.length} submissions • {unread} unread</p>
            </div>
          </div>

          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 80 }}><div className="spinner" /></div>
          ) : contacts.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "60px" }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>📬</div>
              <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No contact submissions yet</p>
              <p style={{ color: "var(--text-overlay)", fontSize: 14 }}>When users contact you, their messages will appear here.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {contacts.map((contact) => (
                <div
                  key={contact._id}
                  className="card"
                  style={{
                    border: `1px solid ${contact.isRead ? "var(--bg-surface0)" : "rgba(203,166,247,0.3)"}`,
                    background: contact.isRead ? "var(--bg-crust)" : "rgba(203,166,247,0.04)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 99, background: "linear-gradient(135deg, #cba6f7, #89b4fa)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#11111b", fontSize: 15, flexShrink: 0 }}>
                          {contact.name?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 15 }}>{contact.name}</div>
                          <div style={{ fontSize: 12, color: "var(--text-overlay)" }}>
                            {new Date(contact.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                        {!contact.isRead && <span className="badge badge-purple" style={{ marginLeft: 4 }}>New</span>}
                      </div>
                      {contact.subject && (
                        <div style={{ fontWeight: 500, marginBottom: 6, color: "var(--accent-blue)" }}>{contact.subject}</div>
                      )}
                      {contact.message && (
                        <p style={{ fontSize: 14, color: "var(--text-subtext)", lineHeight: 1.6 }}>{contact.message}</p>
                      )}
                      <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
                        {contact.email && (
                          <a href={`mailto:${contact.email}`} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--accent-blue)", textDecoration: "none" }}>
                            <Mail size={13} />{contact.email}
                          </a>
                        )}
                        {contact.phone && (
                          <a href={`tel:${contact.phone}`} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--accent-green)", textDecoration: "none" }}>
                            <Phone size={13} />{contact.phone}
                          </a>
                        )}
                      </div>
                    </div>
                    {!contact.isRead && (
                      <button
                        id={`mark-read-${contact._id}`}
                        className="btn-secondary"
                        style={{ fontSize: 12, padding: "6px 12px", flexShrink: 0 }}
                        onClick={() => handleMarkRead(contact._id)}
                      >
                        <CheckCheck size={13} />Mark Read
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
