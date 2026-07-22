"use client";
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchGames, deleteGame } from "@/store/slices/gameSlice";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const CATEGORIES = ["Rummy", "Slots", "Casino", "Sports", "Arcade", "Other"];
const PAGE_SIZE = 10;

export default function GamesPage() {
  const dispatch = useAppDispatch();
  const { games, loading } = useAppSelector((s) => s.game);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [deleteModal, setDeleteModal] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    dispatch(fetchGames());
  }, [dispatch]);

  const filtered = games.filter((g) => {
    const matchSearch =
      !search || g.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "all" || g.category === category;
    return matchSearch && matchCat;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleDelete = async () => {
    if (!deleteModal) return;
    setDeleting(true);
    const res = await dispatch(deleteGame(deleteModal.id));
    setDeleting(false);
    setDeleteModal(null);
    if (deleteGame.fulfilled.match(res)) {
      toast.success("Game deleted successfully");
    } else {
      toast.error("Failed to delete game");
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Games</h1>
          <p className="page-subtitle">{games.length} games in total</p>
        </div>
        <Link href="/games/create" className="btn-primary" id="create-game-btn">
          <Plus size={16} />
          Create Game
        </Link>
      </div>

      {/* Filters */}
      <div
        className="card"
        style={{
          marginBottom: 20,
          display: "flex",
          gap: 12,
          alignItems: "center",
          padding: "16px 20px",
          flexWrap: "wrap",
        }}
      >
        <div className="search-box" style={{ flex: 1, minWidth: 200 }}>
          <Search size={16} color="var(--text-overlay)" />
          <input
            id="games-search"
            placeholder="Search games..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-overlay)", display: "flex" }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Filter size={16} color="var(--text-overlay)" />
          <select
            id="games-category-filter"
            className="select"
            style={{ width: "auto", minWidth: 140 }}
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
            <div className="spinner" />
          </div>
        ) : paginated.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-overlay)" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎮</div>
            <p style={{ fontSize: 15, marginBottom: 8 }}>No games found</p>
            <p style={{ fontSize: 13 }}>
              {search || category !== "all" ? "Try clearing filters" : (
                <Link href="/games/create" style={{ color: "var(--accent-purple)" }}>Create your first game →</Link>
              )}
            </p>
          </div>
        ) : (
          <div className="table-wrapper" style={{ border: "none", borderRadius: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Game</th>
                  <th>Category</th>
                  <th>Rating</th>
                  <th>Bonus</th>
                  <th>Min. Withdraw</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((game, i) => (
                  <tr key={game._id}>
                    <td style={{ color: "var(--text-overlay)", fontSize: 12 }}>
                      {(page - 1) * PAGE_SIZE + i + 1}
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {game.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={game.logoUrl}
                            alt={game.name}
                            style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover", flexShrink: 0 }}
                          />
                        ) : (
                          <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--bg-surface0)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                            {game.icon || "🎮"}
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 500 }}>{game.name}</div>
                          <div style={{ fontSize: 12, color: "var(--text-overlay)" }}>{game.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-blue">{game.category || "—"}</span>
                    </td>
                    <td style={{ color: "var(--accent-yellow)" }}>⭐ {game.rating || 0}</td>
                    <td style={{ color: "var(--accent-green)" }}>
                      {game.signupBonus ? `₹${game.signupBonus}` : "—"}
                    </td>
                    <td style={{ color: "var(--accent-peach)" }}>
                      {game.minWithdraw ? `₹${game.minWithdraw}` : "—"}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {game.isNewGame && <span className="badge badge-green">New</span>}
                        {game.isFree && <span className="badge badge-purple">Free</span>}
                        {!game.isNewGame && !game.isFree && <span className="badge badge-blue">Listed</span>}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 8 }}>
                        <Link
                          href={`/games/${game._id}/edit`}
                          id={`edit-game-${game._id}`}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "6px 12px",
                            borderRadius: 7,
                            background: "rgba(137,180,250,0.12)",
                            color: "var(--accent-blue)",
                            fontSize: 13,
                            textDecoration: "none",
                            border: "1px solid rgba(137,180,250,0.2)",
                          }}
                        >
                          <Pencil size={13} /> Edit
                        </Link>
                        <button
                          id={`delete-game-${game._id}`}
                          className="btn-danger"
                          onClick={() => setDeleteModal({ id: game._id, name: game.name })}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "14px 20px",
              borderTop: "1px solid var(--bg-surface0)",
              fontSize: 14,
              color: "var(--text-overlay)",
            }}
          >
            <span>
              Page {page} of {totalPages} ({filtered.length} results)
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                id="prev-page"
                className="btn-secondary"
                style={{ padding: "6px 12px", fontSize: 13 }}
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <button
                id="next-page"
                className="btn-secondary"
                style={{ padding: "6px 12px", fontSize: 13 }}
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirm Modal */}
      {deleteModal && (
        <div className="modal-overlay" onClick={() => setDeleteModal(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🗑️</div>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Delete Game?</h2>
              <p style={{ color: "var(--text-overlay)", fontSize: 14, lineHeight: 1.5 }}>
                Are you sure you want to delete{" "}
                <strong style={{ color: "var(--text-text)" }}>{deleteModal.name}</strong>?
                This action cannot be undone.
              </p>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                id="cancel-delete"
                className="btn-secondary"
                style={{ flex: 1, justifyContent: "center" }}
                onClick={() => setDeleteModal(null)}
              >
                Cancel
              </button>
              <button
                id="confirm-delete"
                className="btn-danger"
                style={{ flex: 1, justifyContent: "center", padding: "10px 16px" }}
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? <span className="spinner" /> : <Trash2 size={14} />}
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
