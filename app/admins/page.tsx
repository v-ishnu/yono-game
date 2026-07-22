"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout } from "@/store/slices/authSlice";
import { fetchAdmins, removeAdmin } from "@/store/slices/adminSlice";
import { signupAdmin } from "@/store/slices/authSlice";
import toast from "react-hot-toast";
import {
  LayoutDashboard,
  Gamepad2,
  Users,
  MessageSquare,
  LogOut,
  ChevronRight,
  Plus,
  Trash2,
  Shield,
  UserCheck,
  Image as ImageIcon,
} from "lucide-react";

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/games", label: "Games", icon: Gamepad2 },
  { href: "/media", label: "Media", icon: ImageIcon },
  { href: "/admins", label: "Admins", icon: Users },
  { href: "/contacts", label: "Contacts", icon: MessageSquare },
];

export default function AdminsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { admin: currentAdmin, isInitialized, loading: authLoading } = useAppSelector((s) => s.auth);
  const { admins, loading: adminsLoading } = useAppSelector((s) => s.admins);

  const [showModal, setShowModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ id: string; name: string } | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "admin" });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isInitialized && !currentAdmin) { router.replace("/login"); return; }
    if (currentAdmin) {
      dispatch(fetchAdmins());
    }
  }, [currentAdmin, dispatch, router, isInitialized]);

  if (!isInitialized || !currentAdmin) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><div className="spinner" /></div>;

  const handleLogout = () => { dispatch(logout()); router.push("/login"); };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) { toast.error("Fill all fields"); return; }
    const res = await dispatch(signupAdmin(form));
    if (signupAdmin.fulfilled.match(res)) {
      toast.success("Admin created!");
      setShowModal(false);
      setForm({ name: "", email: "", password: "", role: "admin" });
      dispatch(fetchAdmins());
    } else {
      toast.error("Failed to create admin");
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    setDeleting(true);
    const res = await dispatch(removeAdmin(deleteModal.id));
    setDeleting(false);
    setDeleteModal(null);
    if (removeAdmin.fulfilled.match(res)) {
      toast.success("Admin removed");
    } else {
      toast.error("Failed to remove admin");
    }
  };

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
                <Icon size={18} /><span style={{ flex: 1 }}>{label}</span>{isActive && <ChevronRight size={14} />}
              </Link>
            );
          })}
        </nav>
        <div style={{ padding: "16px 10px", borderTop: "1px solid var(--bg-surface0)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, background: "var(--bg-surface0)", marginBottom: 8 }}>
            <div style={{ width: 34, height: 34, borderRadius: 99, background: "linear-gradient(135deg, #cba6f7, #89b4fa)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#11111b", flexShrink: 0 }}>
              {currentAdmin.name?.[0]?.toUpperCase() || "A"}
            </div>
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{currentAdmin.name}</div>
              <div style={{ fontSize: 11, color: "var(--accent-purple)", textTransform: "capitalize" }}>{currentAdmin.role?.replace("_", " ")}</div>
            </div>
          </div>
          <button id="admins-logout" onClick={handleLogout} className="nav-item" style={{ width: "100%", background: "none", border: "none", color: "var(--accent-red)" }}>
            <LogOut size={16} />Logout
          </button>
        </div>
      </aside>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <header className="topbar">
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-text)" }}>Admins</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 13, color: "var(--text-overlay)" }}>
              {isInitialized ? new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""}
            </span>
            <div style={{ width: 32, height: 32, borderRadius: 99, background: "linear-gradient(135deg, #cba6f7, #89b4fa)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#11111b" }}>
              {currentAdmin.name?.[0]?.toUpperCase() || "A"}
            </div>
          </div>
        </header>

        <main style={{ flex: 1, overflow: "auto", padding: "28px", background: "var(--bg-base)" }}>
          <div className="page-header">
            <div>
              <h1 className="page-title">Admin Management</h1>
              <p className="page-subtitle">{admins.length} admin{admins.length !== 1 ? "s" : ""} registered</p>
            </div>
            <button id="add-admin-btn" className="btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={16} />Add Admin
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: "rgba(203,166,247,0.12)" }}><Shield size={22} color="var(--accent-purple)" /></div>
              <div><div className="stat-value" style={{ color: "var(--accent-purple)" }}>{admins.filter(a => a.role === "super_admin").length}</div><div className="stat-label">Super Admins</div></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: "rgba(137,180,250,0.12)" }}><UserCheck size={22} color="var(--accent-blue)" /></div>
              <div><div className="stat-value" style={{ color: "var(--accent-blue)" }}>{admins.filter(a => a.role === "admin").length}</div><div className="stat-label">Admins</div></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: "rgba(166,227,161,0.12)" }}><Users size={22} color="var(--accent-green)" /></div>
              <div><div className="stat-value" style={{ color: "var(--accent-green)" }}>{admins.filter(a => a.isActive).length}</div><div className="stat-label">Active</div></div>
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {adminsLoading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: 60 }}><div className="spinner" /></div>
            ) : admins.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-overlay)" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>👥</div>
                <p>No admins found.</p>
              </div>
            ) : (
              <div className="table-wrapper" style={{ border: "none", borderRadius: 0 }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Admin</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map((admin, i) => (
                      <tr key={admin._id}>
                        <td style={{ color: "var(--text-overlay)", fontSize: 12 }}>{i + 1}</td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 99, background: "linear-gradient(135deg, #cba6f7, #89b4fa)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, color: "#11111b", flexShrink: 0 }}>
                              {admin.name?.[0]?.toUpperCase()}
                            </div>
                            <span style={{ fontWeight: 500 }}>{admin.name}</span>
                          </div>
                        </td>
                        <td style={{ color: "var(--text-overlay)", fontSize: 13 }}>{admin.email}</td>
                        <td>
                          <span className={`badge ${admin.role === "super_admin" ? "badge-purple" : "badge-blue"}`} style={{ textTransform: "capitalize" }}>
                            {admin.role?.replace("_", " ")}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${admin.isActive ? "badge-green" : "badge-red"}`}>
                            {admin.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td style={{ color: "var(--text-overlay)", fontSize: 13 }}>
                          {new Date(admin.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td>
                          {admin._id !== currentAdmin._id ? (
                            <button id={`delete-admin-${admin._id}`} className="btn-danger" onClick={() => setDeleteModal({ id: admin._id, name: admin.name })}>
                              <Trash2 size={13} />Remove
                            </button>
                          ) : (
                            <span style={{ fontSize: 12, color: "var(--text-overlay)" }}>You</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add Admin Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Add New Admin</h2>
            <p style={{ color: "var(--text-overlay)", fontSize: 13, marginBottom: 24 }}>
              Create a new admin account for the panel.
            </p>
            <form onSubmit={handleCreateAdmin} className="form-grid">
              <div>
                <label className="label">Full Name</label>
                <input id="new-admin-name" className="input" placeholder="John Doe" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <label className="label">Email</label>
                <input id="new-admin-email" className="input" type="email" placeholder="admin@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div>
                <label className="label">Password</label>
                <input id="new-admin-password" className="input" type="password" placeholder="••••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
              </div>
              <div>
                <label className="label">Role</label>
                <select id="new-admin-role" className="select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <button type="button" className="btn-secondary" style={{ flex: 1, justifyContent: "center" }} onClick={() => setShowModal(false)}>Cancel</button>
                <button id="create-admin-submit" type="submit" className="btn-primary" style={{ flex: 1, justifyContent: "center" }} disabled={authLoading}>
                  {authLoading ? <span className="spinner" /> : <Plus size={15} />}
                  {authLoading ? "Creating..." : "Create Admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteModal && (
        <div className="modal-overlay" onClick={() => setDeleteModal(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Remove Admin?</h2>
              <p style={{ color: "var(--text-overlay)", fontSize: 14 }}>
                Remove <strong style={{ color: "var(--text-text)" }}>{deleteModal.name}</strong> from admin panel? This cannot be undone.
              </p>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button id="cancel-admin-delete" className="btn-secondary" style={{ flex: 1, justifyContent: "center" }} onClick={() => setDeleteModal(null)}>Cancel</button>
              <button id="confirm-admin-delete" className="btn-danger" style={{ flex: 1, justifyContent: "center", padding: "10px 16px" }} onClick={handleDelete} disabled={deleting}>
                {deleting ? <span className="spinner" /> : <Trash2 size={14} />}
                {deleting ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
