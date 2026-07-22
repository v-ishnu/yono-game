"use client";
import { useState, useRef, useEffect } from "react";
import { Upload, X, Plus, Image as ImageIcon } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchMedia } from "@/store/slices/mediaSlice";

const CATEGORIES = ["Rummy", "Slots", "Casino", "Sports", "Arcade", "Other"];

export interface GameFormData {
  id?: string;
  name: string;
  slug: string;
  icon: string;
  category: string;
  rating: string;
  size: string;
  signupBonus: string;
  minWithdraw: string;
  downloadUrl: string;
  description: string;
  longDescription: string;
  tags: string;
  isNewGame: boolean;
  isFree: boolean;
  faqs?: unknown;
  logo?: File | null;
  logoUrl?: string;
  logoAlt?: string;
  logoTitle?: string;
}

interface GameFormProps {
  initialData?: Partial<GameFormData>;
  existingLogoUrl?: string;
  onSubmit: (data: GameFormData) => void;
  loading: boolean;
  submitLabel?: string;
}

export default function GameForm({
  initialData,
  existingLogoUrl,
  onSubmit,
  loading,
  submitLabel = "Save Game",
}: GameFormProps) {
  const dispatch = useAppDispatch();
  const { mediaList } = useAppSelector((s) => s.media);

  const [form, setForm] = useState<GameFormData>({
    name: "",
    slug: "",
    icon: "",
    category: "",
    rating: "",
    size: "",
    signupBonus: "",
    minWithdraw: "",
    downloadUrl: "",
    description: "",
    longDescription: "",
    tags: "",
    isNewGame: false,
    isFree: true,
    logo: null,
    logoUrl: "",
    logoAlt: "",
    logoTitle: "",
    ...initialData,
  });

  const [preview, setPreview] = useState<string | null>(existingLogoUrl || null);
  const [logoMode, setLogoMode] = useState<"upload" | "media">("upload");
  const [tagInput, setTagInput] = useState("");
  const [tagList, setTagList] = useState<string[]>(
    initialData?.tags
      ? typeof initialData.tags === "string"
        ? initialData.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : []
      : []
  );
  const [faqsList, setFaqsList] = useState<{ question: string; answer: string }[]>(
    Array.isArray(initialData?.faqs) ? initialData.faqs : []
  );
  const [descriptionTab, setDescriptionTab] = useState<"write" | "preview">("write");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    dispatch(fetchMedia());
  }, [dispatch]);

  // If there's an existing logo URL but no new file logo, we can start in "media" tab if it matches a media library item
  useEffect(() => {
    if (existingLogoUrl && !form.logo) {
      setLogoMode("media");
    }
  }, [existingLogoUrl, form.logo]);

  const set = (field: keyof GameFormData, value: string | boolean | File | null) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    set("logo", file);
    set("logoUrl", "");
    const url = URL.createObjectURL(file);
    setPreview(url);
  };

  const removeTag = (tag: string) => {
    setTagList((prev) => prev.filter((t) => t !== tag));
  };

  const addTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tagList.includes(trimmed)) {
      setTagList((prev) => [...prev, trimmed]);
    }
    setTagInput("");
  };

  const addFaq = () => {
    setFaqsList((prev) => [...prev, { question: "", answer: "" }]);
  };

  const removeFaq = (index: number) => {
    setFaqsList((prev) => prev.filter((_, i) => i !== index));
  };

  const updateFaq = (index: number, field: "question" | "answer", value: string) => {
    setFaqsList((prev) => {
      const next = [...prev];
      next[index][field] = value;
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: GameFormData = {
      ...form,
      tags: tagList.join(","),
      faqs: JSON.stringify(faqsList),
    };
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="form-grid">
      {/* Basic Info */}
      <div className="card">
        <h3 style={{ fontWeight: 600, marginBottom: 20, color: "var(--accent-purple)" }}>
          Basic Information
        </h3>
        <div className="form-row-2">
          <div>
            <label className="label">Game Name *</label>
            <input
              id="game-name"
              className="input"
              placeholder="e.g. Yono Rummy"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Slug (auto-generated if empty)</label>
            <input
              id="game-slug"
              className="input"
              placeholder="yono-rummy"
              value={form.slug}
              onChange={(e) => set("slug", e.target.value)}
            />
          </div>
        </div>

        <div className="form-row-2" style={{ marginTop: 16 }}>
          <div>
            <label className="label">Icon Emoji / Character</label>
            <input
              id="game-icon"
              className="input"
              placeholder="🎮"
              value={form.icon}
              onChange={(e) => set("icon", e.target.value)}
            />
          </div>
          <div>
            <label className="label">Category</label>
            <select
              id="game-category"
              className="select"
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
            >
              <option value="">Select category</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <label className="label">Short Description</label>
          <textarea
            id="game-description"
            className="textarea"
            placeholder="Brief description of the game..."
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            style={{ minHeight: 70 }}
          />
        </div>

        <div style={{ marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <label className="label" style={{ margin: 0 }}>Long Description (HTML allowed)</label>
            <div style={{ display: "flex", gap: 4, background: "var(--bg-mantle)", padding: 3, borderRadius: 8, border: "1px solid var(--bg-surface0)" }}>
              <button
                type="button"
                onClick={() => setDescriptionTab("write")}
                style={{
                  padding: "4px 12px",
                  fontSize: 12,
                  fontWeight: 500,
                  borderRadius: 6,
                  border: "none",
                  cursor: "pointer",
                  background: descriptionTab === "write" ? "var(--bg-surface0)" : "transparent",
                  color: descriptionTab === "write" ? "var(--text-text)" : "var(--text-overlay)",
                  transition: "all 0.15s ease"
                }}
              >
                Write
              </button>
              <button
                type="button"
                onClick={() => setDescriptionTab("preview")}
                style={{
                  padding: "4px 12px",
                  fontSize: 12,
                  fontWeight: 500,
                  borderRadius: 6,
                  border: "none",
                  cursor: "pointer",
                  background: descriptionTab === "preview" ? "var(--bg-surface0)" : "transparent",
                  color: descriptionTab === "preview" ? "var(--text-text)" : "var(--text-overlay)",
                  transition: "all 0.15s ease"
                }}
              >
                Preview
              </button>
            </div>
          </div>
          {descriptionTab === "write" ? (
            <textarea
              id="game-long-description"
              className="textarea"
              placeholder="Detailed description, features, how to play... (supports HTML tags like <p>, <strong>, <ul>, etc.)"
              value={form.longDescription}
              onChange={(e) => set("longDescription", e.target.value)}
              style={{ minHeight: 150 }}
            />
          ) : (
            <div>
              <div className="html-preview-container">
                <div
                  className="html-preview"
                  contentEditable={true}
                  suppressContentEditableWarning={true}
                  onBlur={(e) => {
                    const html = e.currentTarget.innerHTML;
                    // Normalize empty state (browsers sometimes leave a <br> when deleting all text)
                    if (html === "<br>" || html.trim() === "") {
                      set("longDescription", "");
                    } else {
                      set("longDescription", html);
                    }
                  }}
                  dangerouslySetInnerHTML={{ __html: form.longDescription }}
                />
              </div>
              <div className="preview-helper">
                <span>✏️ Click inside the preview area to edit the rendered HTML directly. Edits will sync back to the editor.</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="card">
        <h3 style={{ fontWeight: 600, marginBottom: 20, color: "var(--accent-blue)" }}>
          Game Stats
        </h3>
        <div className="form-row-2">
          <div>
            <label className="label">Rating (0–5)</label>
            <input
              id="game-rating"
              className="input"
              type="number"
              min="0"
              max="5"
              step="0.1"
              placeholder="4.5"
              value={form.rating}
              onChange={(e) => set("rating", e.target.value)}
            />
          </div>
          <div>
            <label className="label">App Size</label>
            <input
              id="game-size"
              className="input"
              placeholder="e.g. 45 MB"
              value={form.size}
              onChange={(e) => set("size", e.target.value)}
            />
          </div>
          <div>
            <label className="label">Signup Bonus (₹)</label>
            <input
              id="game-signup-bonus"
              className="input"
              type="number"
              min="0"
              placeholder="500"
              value={form.signupBonus}
              onChange={(e) => set("signupBonus", e.target.value)}
            />
          </div>
          <div>
            <label className="label">Min. Withdraw (₹)</label>
            <input
              id="game-min-withdraw"
              className="input"
              type="number"
              min="0"
              placeholder="100"
              value={form.minWithdraw}
              onChange={(e) => set("minWithdraw", e.target.value)}
            />
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <label className="label">Download URL</label>
          <input
            id="game-download-url"
            className="input"
            type="url"
            placeholder="https://play.google.com/..."
            value={form.downloadUrl}
            onChange={(e) => set("downloadUrl", e.target.value)}
          />
        </div>

        {/* Flags */}
        <div style={{ display: "flex", gap: 24, marginTop: 20 }}>
          <label
            style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 14, color: "var(--text-subtext)" }}
          >
            <input
              id="game-is-new"
              type="checkbox"
              checked={form.isNewGame}
              onChange={(e) => set("isNewGame", e.target.checked)}
              style={{ width: 16, height: 16, accentColor: "var(--accent-green)" }}
            />
            Mark as New Game
          </label>
          <label
            style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 14, color: "var(--text-subtext)" }}
          >
            <input
              id="game-is-free"
              type="checkbox"
              checked={form.isFree}
              onChange={(e) => set("isFree", e.target.checked)}
              style={{ width: 16, height: 16, accentColor: "var(--accent-purple)" }}
            />
            Free to Download
          </label>
        </div>
      </div>

      {/* FAQs */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ fontWeight: 600, color: "var(--accent-green)" }}>FAQs</h3>
          <button type="button" className="btn-secondary" onClick={addFaq}>
            <Plus size={16} /> Add FAQ
          </button>
        </div>
        {faqsList.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--text-overlay)" }}>No FAQs added. Click &quot;Add FAQ&quot; to create one.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {faqsList.map((faq, index) => (
              <div key={index} style={{ background: "var(--bg-surface0)", padding: 16, borderRadius: 8, position: "relative" }}>
                <button
                  type="button"
                  onClick={() => removeFaq(index)}
                  style={{ position: "absolute", top: 12, right: 12, background: "rgba(255,0,0,0.1)", color: "red", border: "none", borderRadius: "50%", padding: 4, cursor: "pointer" }}
                >
                  <X size={14} />
                </button>
                <div style={{ marginBottom: 12 }}>
                  <label className="label">Question {index + 1}</label>
                  <input
                    className="input"
                    placeholder="e.g. How do I sign up?"
                    value={faq.question}
                    onChange={(e) => updateFaq(index, "question", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="label">Answer</label>
                  <textarea
                    className="textarea"
                    placeholder="Provide the answer..."
                    value={faq.answer}
                    onChange={(e) => updateFaq(index, "answer", e.target.value)}
                    style={{ minHeight: 60 }}
                    required
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tags */}
      <div className="card">
        <h3 style={{ fontWeight: 600, marginBottom: 16, color: "var(--accent-yellow)" }}>
          Tags
        </h3>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input
            id="game-tag-input"
            className="input"
            placeholder="Add a tag and press Enter"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); addTag(); }
            }}
          />
          <button type="button" className="btn-secondary" onClick={addTag} style={{ flexShrink: 0 }}>
            <Plus size={16} />
          </button>
        </div>
        {tagList.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {tagList.map((tag) => (
              <span
                key={tag}
                className="badge badge-yellow"
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", display: "flex", padding: 0 }}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Logo Upload */}
      <div className="card">
        <h3 style={{ fontWeight: 600, marginBottom: 16, color: "var(--accent-peach)", display: "flex", alignItems: "center", gap: 8 }}>
          <ImageIcon size={18} /> Game Logo
        </h3>

        {/* Mode Selector Tab */}
        <div style={{ display: "flex", gap: 4, background: "var(--bg-mantle)", padding: 3, borderRadius: 8, border: "1px solid var(--bg-surface0)", marginBottom: 16 }}>
          <button
            type="button"
            onClick={() => setLogoMode("upload")}
            style={{
              flex: 1,
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: 500,
              borderRadius: 6,
              border: "none",
              cursor: "pointer",
              background: logoMode === "upload" ? "var(--bg-surface0)" : "transparent",
              color: logoMode === "upload" ? "var(--text-text)" : "var(--text-overlay)",
              transition: "all 0.15s ease"
            }}
          >
            Upload New Image
          </button>
          <button
            type="button"
            onClick={() => setLogoMode("media")}
            style={{
              flex: 1,
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: 500,
              borderRadius: 6,
              border: "none",
              cursor: "pointer",
              background: logoMode === "media" ? "var(--bg-surface0)" : "transparent",
              color: logoMode === "media" ? "var(--text-text)" : "var(--text-overlay)",
              transition: "all 0.15s ease"
            }}
          >
            Choose from Media Library ({mediaList.length})
          </button>
        </div>

        {logoMode === "upload" ? (
          <div>
            <div
              id="logo-upload-box"
              className="upload-box"
              onClick={() => fileRef.current?.click()}
            >
              {preview && form.logo ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview}
                    alt="Preview"
                    style={{ width: 80, height: 80, borderRadius: 12, objectFit: "cover" }}
                  />
                  <p style={{ fontSize: 13, color: "var(--text-overlay)" }}>
                    Click to change logo
                  </p>
                </div>
              ) : (
                <div>
                  <Upload size={32} color="var(--text-overlay)" style={{ margin: "0 auto 12px" }} />
                  <p style={{ fontSize: 14, color: "var(--text-overlay)" }}>
                    Click to upload game logo
                  </p>
                  <p style={{ fontSize: 12, color: "var(--bg-surface2)", marginTop: 4 }}>
                    PNG, JPG, WEBP up to 5MB
                  </p>
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              id="game-logo-input"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleLogoChange}
            />
          </div>
        ) : (
          <div style={{ marginBottom: 16 }}>
            {mediaList.length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--text-overlay)", textAlign: "center", padding: "20px 0" }}>
                No media assets uploaded yet.
              </p>
            ) : (
              <div>
                <p style={{ fontSize: 12, color: "var(--text-overlay)", marginBottom: 8 }}>
                  Select an image from library:
                </p>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(64px, 1fr))",
                  gap: 8,
                  maxHeight: 180,
                  overflowY: "auto",
                  padding: 4,
                  border: "1px solid var(--bg-surface0)",
                  borderRadius: 8,
                  background: "var(--bg-mantle)"
                }}>
                  {mediaList.map((media) => {
                    const isSelected = form.logoUrl === media.url || (preview === media.url && !form.logo);
                    return (
                      <div
                        key={media._id}
                        onClick={() => {
                          set("logo", null);
                          set("logoUrl", media.url);
                          set("logoAlt", media.alt);
                          set("logoTitle", media.title);
                          setPreview(media.url);
                        }}
                        style={{
                          aspectRatio: "1/1",
                          borderRadius: 8,
                          overflow: "hidden",
                          cursor: "pointer",
                          position: "relative",
                          border: isSelected ? "2px solid var(--accent-purple)" : "2px solid transparent",
                          transform: isSelected ? "scale(0.95)" : "none",
                          transition: "all 0.15s ease",
                          background: "var(--bg-crust)"
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={media.url}
                          alt={media.alt}
                          title={media.title}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {preview && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16, background: "var(--bg-mantle)", padding: 10, borderRadius: 8, border: "1px solid var(--bg-surface0)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Selected Logo" style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover" }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12, fontWeight: 500, color: "var(--text-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                Active Selection
              </p>
              <p style={{ fontSize: 11, color: "var(--text-overlay)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {form.logo ? `Local File: ${form.logo.name}` : `Media URL: ${form.logoUrl}`}
              </p>
            </div>
            {(form.logo || form.logoUrl) && (
              <button
                type="button"
                onClick={() => {
                  set("logo", null);
                  set("logoUrl", "");
                  setPreview(null);
                }}
                style={{ background: "none", border: "none", color: "var(--accent-red)", cursor: "pointer", display: "flex", padding: 4 }}
              >
                <X size={16} />
              </button>
            )}
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          <label className="label">Logo Alt Text (for SEO)</label>
          <input
            id="game-logo-alt"
            className="input"
            placeholder="e.g. Play Ok Rummy and win cash rewards"
            value={form.logoAlt || ""}
            onChange={(e) => set("logoAlt", e.target.value)}
          />
        </div>
        <div style={{ marginTop: 12 }}>
          <label className="label">Logo Title (hover tooltip)</label>
          <input
            id="game-logo-title"
            className="input"
            placeholder="e.g. Ok Rummy Download"
            value={form.logoTitle || ""}
            onChange={(e) => set("logoTitle", e.target.value)}
          />
        </div>
      </div>

      {/* Submit */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
        <button type="submit" className="btn-primary" disabled={loading} id="game-form-submit">
          {loading ? <span className="spinner" /> : null}
          {loading ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
