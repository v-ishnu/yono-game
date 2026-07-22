"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { loginAdmin, clearError } from "@/store/slices/authSlice";
import { Eye, EyeOff, Gamepad2, LogIn } from "lucide-react";

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { loading, error, admin } = useAppSelector((s) => s.auth);

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    if (admin) router.replace("/dashboard");
  }, [admin, router]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error("Please fill all fields");
      return;
    }
    const res = await dispatch(loginAdmin(form));
    if (loginAdmin.fulfilled.match(res)) {
      toast.success("Welcome back!");
      router.push("/dashboard");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div
            style={{
              width: 60,
              height: 60,
              background: "linear-gradient(135deg, #cba6f7, #89b4fa)",
              borderRadius: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <Gamepad2 size={28} color="#11111b" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-text)" }}>
            Yono Games Admin
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-overlay)", marginTop: 6 }}>
            Sign in to your admin account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="form-grid">
          <div>
            <label className="label">Email Address</label>
            <input
              id="login-email"
              className="input"
              type="email"
              placeholder="admin@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              autoComplete="email"
            />
          </div>

          <div>
            <label className="label">Password</label>
            <div style={{ position: "relative" }}>
              <input
                id="login-password"
                className="input"
                type={showPass ? "text" : "password"}
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                autoComplete="current-password"
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-overlay)",
                  display: "flex",
                }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            id="login-submit"
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: "100%", justifyContent: "center", padding: "13px" }}
          >
            {loading ? <span className="spinner" /> : <LogIn size={16} />}
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
