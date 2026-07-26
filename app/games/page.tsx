"use client";
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchGames, deleteGame, indexGame, indexBulkGames } from "@/store/slices/gameSlice";
import Link from "next/link";
import toast from "react-hot-toast";
import api from "@/lib/api";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Zap,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";

const CATEGORIES = ["Rummy", "Slots", "Casino", "Sports", "Arcade", "Other"];
const PAGE_SIZE = 10;

export default function GamesPage() {
  const dispatch = useAppDispatch();
  const { games, loading, indexingPending } = useAppSelector((s) => s.game);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [deleteModal, setDeleteModal] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [reorderPending, setReorderPending] = useState<{ id: string; direction: "up" | "down" } | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [indexingId, setIndexingId] = useState<string | null>(null);

  const handleReorder = async (gameId: string, direction: "up" | "down") => {
    if (reorderPending) return;
    setReorderPending({ id: gameId, direction });

    try {
      const res = await api.patch("/reorder/swap", { id: gameId, direction });
      if (res.data.success) {
        toast.success(res.data.message || `Moved game ${direction} successfully`);
        await dispatch(fetchGames());
      } else {
        toast.error(res.data.message || `Failed to move game ${direction}`);
      }
    } catch (err: any) {
      console.error("Reorder error:", err);
      const errMsg = err.response?.data?.message || err.message || `Failed to move game ${direction}`;
      toast.error(errMsg);
    } finally {
      setReorderPending(null);
    }
  };

  const handleSingleIndex = async (gameId: string, gameName: string) => {
    if (indexingPending || indexingId) return;
    setIndexingId(gameId);
    toast.loading(`Submitting "${gameName}" to Google Indexing API...`, { id: `indexing-${gameId}` });
    const res = await dispatch(indexGame(gameId));
    setIndexingId(null);
    if (indexGame.fulfilled.match(res)) {
      toast.success(res.payload.message || `"${gameName}" submitted for indexing! 🚀`, { id: `indexing-${gameId}` });
    } else {
      toast.error((res.payload as string) || `Failed to index "${gameName}"`, { id: `indexing-${gameId}` });
    }
  };

  const handleBulkIndex = async () => {
    if (selectedIds.length === 0 || indexingPending) return;
    toast.loading(`Submitting ${selectedIds.length} games to Google Indexing API...`, { id: "bulk-indexing" });
    const res = await dispatch(indexBulkGames(selectedIds));
    if (indexBulkGames.fulfilled.match(res)) {
      toast.success(res.payload.message || `Bulk indexing completed successfully! 🚀`, { id: "bulk-indexing" });
      setSelectedIds([]);
    } else {
      toast.error((res.payload as string) || "Failed to complete bulk indexing", { id: "bulk-indexing" });
    }
  };

  const toggleSelectAll = (paginatedGames: typeof games) => {
    const paginatedIds = paginatedGames.map((g) => g._id);
    const allSelected = paginatedIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !paginatedIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...paginatedIds])));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    dispatch(fetchGames());
  }, [dispatch]);

  const sortedGames = [...games].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

  const filtered = sortedGames.filter((g) => {
    const matchSearch =
      !search || g.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "all" || g.category === category;
    return matchSearch && matchCat;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const isAllPaginatedSelected = paginated.length > 0 && paginated.every((g) => selectedIds.includes(g._id));

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
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {selectedIds.length > 0 && (
            <button
              type="button"
              className="btn-primary"
              onClick={handleBulkIndex}
              disabled={indexingPending}
              style={{
                background: "linear-gradient(135deg, #a6e3a1 0%, #89dceb 100%)",
                color: "#11111b",
                fontWeight: 600
              }}
            >
              {indexingPending ? <span className="spinner" style={{ borderColor: "#11111b" }} /> : <Zap size={15} fill="#11111b" />}
              Index Selected ({selectedIds.length})
            </button>
          )}
          <Link href="/games/create" className="btn-primary" id="create-game-btn">
            <Plus size={16} />
            Create Game
          </Link>
        </div>
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
                  <th style={{ width: 36, textAlign: "center" }}>
                    <input
                      type="checkbox"
                      checked={isAllPaginatedSelected}
                      onChange={() => toggleSelectAll(paginated)}
                      style={{ accentColor: "var(--accent-purple)", cursor: "pointer" }}
                    />
                  </th>
                  <th>#</th>
                  <th style={{ width: 100, textAlign: "center" }}>Order</th>
                  <th>Game</th>
                  <th>Category</th>
                  <th>Rating</th>
                  <th>SEO Status</th>
                  <th>Indexing</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((game, i) => {
                  const isFirst = sortedGames[0]?._id === game._id;
                  const isLast = sortedGames[sortedGames.length - 1]?._id === game._id;
                  const isSelected = selectedIds.includes(game._id);
                  const isIndexingThis = indexingId === game._id;
                  const idxStatus = game.indexingStatus?.status || "not_indexed";

                  return (
                    <tr key={game._id} style={{ background: isSelected ? "rgba(203,166,247,0.05)" : undefined }}>
                      <td style={{ textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(game._id)}
                          style={{ accentColor: "var(--accent-purple)", cursor: "pointer" }}
                        />
                      </td>
                      <td style={{ color: "var(--text-overlay)", fontSize: 12 }}>
                        {(page - 1) * PAGE_SIZE + i + 1}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                          <button
                            title="Move Up"
                            disabled={isFirst || reorderPending !== null}
                            onClick={() => handleReorder(game._id, "up")}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: 28,
                              height: 28,
                              borderRadius: 6,
                              background: isFirst ? "rgba(255,255,255,0.02)" : "rgba(203,166,247,0.12)",
                              color: isFirst ? "var(--bg-surface2)" : "var(--accent-purple)",
                              border: `1px solid ${isFirst ? "rgba(255,255,255,0.05)" : "rgba(203,166,247,0.2)"}`,
                              cursor: isFirst || reorderPending !== null ? "not-allowed" : "pointer",
                              transition: "all 0.2s",
                              opacity: isFirst ? 0.3 : 1,
                            }}
                          >
                            {reorderPending?.id === game._id && reorderPending?.direction === "up" ? (
                              <span className="spinner" style={{ width: 12, height: 12, borderWidth: 1.5 }} />
                            ) : (
                              <ArrowUp size={14} />
                            )}
                          </button>
                          <button
                            title="Move Down"
                            disabled={isLast || reorderPending !== null}
                            onClick={() => handleReorder(game._id, "down")}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: 28,
                              height: 28,
                              borderRadius: 6,
                              background: isLast ? "rgba(255,255,255,0.02)" : "rgba(203,166,247,0.12)",
                              color: isLast ? "var(--bg-surface2)" : "var(--accent-purple)",
                              border: `1px solid ${isLast ? "rgba(255,255,255,0.05)" : "rgba(203,166,247,0.2)"}`,
                              cursor: isLast || reorderPending !== null ? "not-allowed" : "pointer",
                              transition: "all 0.2s",
                              opacity: isLast ? 0.3 : 1,
                            }}
                          >
                            {reorderPending?.id === game._id && reorderPending?.direction === "down" ? (
                              <span className="spinner" style={{ width: 12, height: 12, borderWidth: 1.5 }} />
                            ) : (
                              <ArrowDown size={14} />
                            )}
                          </button>
                        </div>
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
                      <td>
                        {game.seoTitle ? (
                          <span className="badge badge-purple" title={`SEO Title: ${game.seoTitle}`}>Custom SEO</span>
                        ) : (
                          <span className="badge" style={{ background: "var(--bg-surface1)", color: "var(--text-overlay)" }}>Auto (Fallback)</span>
                        )}
                      </td>
                      <td>
                        {idxStatus === "success" && (
                          <span className="badge badge-green" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <CheckCircle2 size={12} /> Indexed
                          </span>
                        )}
                        {idxStatus === "failed" && (
                          <span className="badge" style={{ background: "rgba(243,139,168,0.15)", color: "var(--accent-red)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <AlertCircle size={12} /> Failed
                          </span>
                        )}
                        {idxStatus === "not_indexed" && (
                          <span className="badge" style={{ background: "var(--bg-surface1)", color: "var(--text-overlay)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <Clock size={12} /> Pending
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            type="button"
                            title="Instant Index with Google"
                            disabled={isIndexingThis || indexingPending}
                            onClick={() => handleSingleIndex(game._id, game.name)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              padding: "6px 10px",
                              borderRadius: 7,
                              background: "rgba(166,227,161,0.15)",
                              color: "var(--accent-green)",
                              fontSize: 12,
                              fontWeight: 500,
                              border: "1px solid rgba(166,227,161,0.25)",
                              cursor: isIndexingThis || indexingPending ? "not-allowed" : "pointer"
                            }}
                          >
                            {isIndexingThis ? <span className="spinner" style={{ width: 12, height: 12 }} /> : <Zap size={12} fill="var(--accent-green)" />}
                            Index
                          </button>
                          <Link
                            href={`/games/${game._id}/edit`}
                            id={`edit-game-${game._id}`}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              padding: "6px 10px",
                              borderRadius: 7,
                              background: "rgba(137,180,250,0.12)",
                              color: "var(--accent-blue)",
                              fontSize: 12,
                              textDecoration: "none",
                              border: "1px solid rgba(137,180,250,0.2)",
                            }}
                          >
                            <Pencil size={12} /> Edit
                          </Link>
                          <button
                            id={`delete-game-${game._id}`}
                            className="btn-danger"
                            style={{ padding: "6px 8px" }}
                            onClick={() => setDeleteModal({ id: game._id, name: game.name })}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
