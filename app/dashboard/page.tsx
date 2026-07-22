"use client";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchGames } from "@/store/slices/gameSlice";
import { fetchAdmins } from "@/store/slices/adminSlice";
import {
  Gamepad2,
  Users,
  Star,
  Zap,
  TrendingUp,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const { games, loading: gamesLoading } = useAppSelector((s) => s.game);
  const { admins } = useAppSelector((s) => s.admins);

  useEffect(() => {
    dispatch(fetchGames());
    dispatch(fetchAdmins());
  }, [dispatch]);

  const categories = [...new Set(games.map((g) => g.category).filter(Boolean))];
  const newGames = games.filter((g) => g.isNewGame);
  const freeGames = games.filter((g) => g.isFree);
  const avgRating =
    games.length > 0
      ? (
          games.reduce((sum, g) => sum + (g.rating || 0), 0) / games.length
        ).toFixed(1)
      : "0";

  const stats = [
    {
      id: "stat-total-games",
      label: "Total Games",
      value: gamesLoading ? "..." : games.length,
      icon: Gamepad2,
      color: "#cba6f7",
      bg: "rgba(203,166,247,0.12)",
    },
    {
      id: "stat-categories",
      label: "Categories",
      value: categories.length,
      icon: TrendingUp,
      color: "#89b4fa",
      bg: "rgba(137,180,250,0.12)",
    },
    {
      id: "stat-new-games",
      label: "New Games",
      value: newGames.length,
      icon: Zap,
      color: "#f9e2af",
      bg: "rgba(249,226,175,0.12)",
    },
    {
      id: "stat-admins",
      label: "Admins",
      value: admins.length,
      icon: Users,
      color: "#a6e3a1",
      bg: "rgba(166,227,161,0.12)",
    },
    {
      id: "stat-avg-rating",
      label: "Avg. Rating",
      value: avgRating,
      icon: Star,
      color: "#fab387",
      bg: "rgba(250,179,135,0.12)",
    },
    {
      id: "stat-free-games",
      label: "Free Games",
      value: freeGames.length,
      icon: CheckCircle,
      color: "#94e2d5",
      bg: "rgba(148,226,213,0.12)",
    },
  ];

  const recentGames = [...games]
    .sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime()
    )
    .slice(0, 6);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard Overview</h1>
          <p className="page-subtitle">Welcome back! Here&apos;s what&apos;s happening.</p>
        </div>
        <Link href="/games/create" className="btn-primary">
          <Gamepad2 size={16} />
          Add New Game
        </Link>
      </div>

      {/* Stats Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 16,
          marginBottom: 32,
        }}
      >
        {stats.map((s) => (
          <div key={s.id} id={s.id} className="stat-card">
            <div className="stat-icon" style={{ background: s.bg }}>
              <s.icon size={22} color={s.color} />
            </div>
            <div>
              <div className="stat-value" style={{ color: s.color }}>
                {s.value}
              </div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Games */}
      <div className="card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>Recent Games</h2>
          <Link
            href="/games"
            style={{
              fontSize: 13,
              color: "var(--accent-purple)",
              textDecoration: "none",
            }}
          >
            View all →
          </Link>
        </div>

        {gamesLoading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: 40,
            }}
          >
            <div className="spinner" />
          </div>
        ) : recentGames.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 0",
              color: "var(--text-overlay)",
              fontSize: 14,
            }}
          >
            No games yet.{" "}
            <Link
              href="/games/create"
              style={{ color: "var(--accent-purple)" }}
            >
              Create your first game
            </Link>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Game</th>
                  <th>Category</th>
                  <th>Rating</th>
                  <th>Status</th>
                  <th>Bonus</th>
                </tr>
              </thead>
              <tbody>
                {recentGames.map((game) => (
                  <tr key={game._id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {game.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={game.logoUrl}
                            alt={game.name}
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              background: "var(--bg-surface0)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 12,
                            }}
                          >
                            {game.icon || "🎮"}
                          </div>
                        )}
                        <span style={{ fontWeight: 500 }}>{game.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-blue">
                        {game.category || "—"}
                      </span>
                    </td>
                    <td style={{ color: "var(--accent-yellow)" }}>
                      ⭐ {game.rating || 0}
                    </td>
                    <td>
                      {game.isNewGame ? (
                        <span className="badge badge-green">New</span>
                      ) : (
                        <span className="badge badge-purple">Listed</span>
                      )}
                    </td>
                    <td style={{ color: "var(--accent-green)" }}>
                      {game.signupBonus ? `₹${game.signupBonus}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
