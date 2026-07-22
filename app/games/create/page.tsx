"use client";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { createGame } from "@/store/slices/gameSlice";
import GameForm, { type GameFormData } from "@/components/GameForm";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function CreateGamePage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { loading } = useAppSelector((s) => s.game);

  const handleSubmit = async (data: GameFormData) => {
    if (!data.name) {
      toast.error("Game name is required");
      return;
    }
    const formData = new FormData();
    Object.entries(data).forEach(([key, val]) => {
      if (key === "logo" && val instanceof File) {
        formData.append("logo", val);
      } else if (val !== null && val !== undefined && key !== "logo") {
        formData.append(key, String(val));
      }
    });

    const res = await dispatch(createGame(formData));
    if (createGame.fulfilled.match(res)) {
      toast.success("Game created successfully! 🎮");
      router.push("/games");
    } else {
      toast.error((res.payload as string) || "Failed to create game");
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <Link href="/games" style={{ color: "var(--text-overlay)", display: "flex" }}>
              <ArrowLeft size={18} />
            </Link>
            <h1 className="page-title">Create New Game</h1>
          </div>
          <p className="page-subtitle">Fill in the details to add a new game to the directory</p>
        </div>
      </div>
      <GameForm onSubmit={handleSubmit} loading={loading} submitLabel="Create Game" />
    </div>
  );
}
