"use client";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchGameBySlug, updateGame, indexGame } from "@/store/slices/gameSlice";
import GameForm, { type GameFormData } from "@/components/GameForm";
import toast from "react-hot-toast";
import { ArrowLeft, Zap, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import Link from "next/link";

export default function EditGamePage() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { games, selectedGame, loading, indexingPending } = useAppSelector((s) => s.game);

  // Find game in store or fetch it
  const game = games.find((g) => g._id === id) || selectedGame;

  useEffect(() => {
    if (!game || game._id !== id) {
      dispatch(fetchGameBySlug(id));
    }
  }, [id, game, dispatch]);

  const handleSubmit = async (data: GameFormData) => {
    const formData = new FormData();
    formData.append("id", id);

    Object.entries(data).forEach(([key, val]) => {
      if (key === "logo" && val instanceof File) {
        formData.append("logo", val);
      } else if (val !== null && val !== undefined && key !== "logo") {
        formData.append(key, String(val));
      }
    });

    const res = await dispatch(updateGame(formData));
    if (updateGame.fulfilled.match(res)) {
      toast.success("Game updated successfully! ✅");
      router.push("/games");
    } else {
      toast.error((res.payload as string) || "Failed to update game");
    }
  };

  const handleInstantIndex = async () => {
    if (indexingPending) return;
    toast.loading("Submitting to Google Indexing API...", { id: "indexing" });
    const res = await dispatch(indexGame(id));
    if (indexGame.fulfilled.match(res)) {
      toast.success(res.payload.message || "Game URL submitted for indexing! 🚀", { id: "indexing" });
    } else {
      toast.error((res.payload as string) || "Failed to submit for indexing", { id: "indexing" });
    }
  };

  if (!game && loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!game) {
    return (
      <div style={{ textAlign: "center", padding: 80 }}>
        <p style={{ color: "var(--text-overlay)" }}>Game not found.</p>
        <Link href="/games" style={{ color: "var(--accent-purple)" }}>← Back to Games</Link>
      </div>
    );
  }

  const indexingStatus = game.indexingStatus?.status || "not_indexed";
  const lastIndexedAt = game.indexingStatus?.lastIndexedAt
    ? new Date(game.indexingStatus.lastIndexedAt).toLocaleString()
    : null;

  return (
    <div>
      <div className="page-header" style={{ alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <Link href="/games" style={{ color: "var(--text-overlay)", display: "flex" }}>
              <ArrowLeft size={18} />
            </Link>
            <h1 className="page-title">Edit Game</h1>
          </div>
          <p className="page-subtitle">Editing: {game.name}</p>
        </div>

        {/* Instant Indexing Button & Status Badge */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
          <button
            type="button"
            className="btn-primary"
            onClick={handleInstantIndex}
            disabled={indexingPending}
            style={{
              background: indexingPending ? "var(--bg-surface2)" : "linear-gradient(135deg, #a6e3a1 0%, #89dceb 100%)",
              color: "#11111b",
              fontWeight: 600,
              padding: "8px 16px",
              boxShadow: "0 4px 12px rgba(166,227,161,0.2)"
            }}
          >
            {indexingPending ? (
              <span className="spinner" style={{ borderColor: "#11111b", borderTopColor: "transparent" }} />
            ) : (
              <Zap size={16} fill="#11111b" />
            )}
            {indexingPending ? "Indexing..." : "Index Now"}
          </button>

          {/* Indexing status badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
            {indexingStatus === "success" && (
              <span style={{ color: "var(--accent-green)", display: "flex", alignItems: "center", gap: 4 }}>
                <CheckCircle2 size={13} /> Indexed
              </span>
            )}
            {indexingStatus === "failed" && (
              <span style={{ color: "var(--accent-red)", display: "flex", alignItems: "center", gap: 4 }}>
                <AlertCircle size={13} /> Indexing Failed
              </span>
            )}
            {indexingStatus === "not_indexed" && (
              <span style={{ color: "var(--text-overlay)", display: "flex", alignItems: "center", gap: 4 }}>
                <Clock size={13} /> Not Indexed
              </span>
            )}
            {lastIndexedAt && (
              <span style={{ color: "var(--text-overlay)", fontSize: 11 }}>
                ({lastIndexedAt})
              </span>
            )}
          </div>
        </div>
      </div>

      <GameForm
        initialData={{
          id: game._id,
          name: game.name || "",
          seoTitle: game.seoTitle || "",
          seoDescription: game.seoDescription || "",
          slug: game.slug || "",
          icon: game.icon || "",
          category: game.category || "",
          rating: game.rating?.toString() || "",
          size: game.size || "",
          signupBonus: game.signupBonus?.toString() || "",
          minWithdraw: game.minWithdraw?.toString() || "",
          downloadUrl: game.downloadUrl || "",
          description: game.description || "",
          longDescription: game.longDescription || "",
          tags: game.tags?.join(", ") || "",
          faqs: game.faqs || [],
          isNewGame: game.isNewGame || false,
          isFree: game.isFree !== false,
          logoAlt: game.logoAlt || "",
          logoTitle: game.logoTitle || "",
          logoUrl: game.logoUrl || "",
        }}
        existingLogoUrl={game.logoUrl}
        onSubmit={handleSubmit}
        loading={loading}
        submitLabel="Update Game"
      />
    </div>
  );
}
