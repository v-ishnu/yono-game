"use client";
import { useEffect, useState, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchMedia,
  uploadMedia,
  updateMediaSeo,
  deleteMedia,
  type MediaItem,
} from "@/store/slices/mediaSlice";
import { Upload, Copy, Trash2, Edit, Check, X, ExternalLink, FileText } from "lucide-react";
import toast from "react-hot-toast";

export default function MediaPage() {
  const dispatch = useAppDispatch();
  const { mediaList, loading } = useAppSelector((s) => s.media);

  // Form states for uploading
  const [file, setFile] = useState<File | null>(null);
  const [alt, setAlt] = useState("");
  const [title, setTitle] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States for editing SEO
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAlt, setEditAlt] = useState("");
  const [editTitle, setEditTitle] = useState("");

  useEffect(() => {
    dispatch(fetchMedia());
  }, [dispatch]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error("Please select a file to upload");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("alt", alt);
    formData.append("title", title);

    const res = await dispatch(uploadMedia(formData));
    if (uploadMedia.fulfilled.match(res)) {
      toast.success("Image uploaded successfully! 🚀");
      setFile(null);
      setAlt("");
      setTitle("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } else {
      toast.error((res.payload as string) || "Failed to upload image");
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Image URL copied to clipboard! 📋");
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this media file? This will remove the file permanently from the server.")) {
      const res = await dispatch(deleteMedia(id));
      if (deleteMedia.fulfilled.match(res)) {
        toast.success("Media deleted successfully!");
      } else {
        toast.error((res.payload as string) || "Failed to delete media");
      }
    }
  };

  const startEditing = (item: MediaItem) => {
    setEditingId(item._id);
    setEditAlt(item.alt);
    setEditTitle(item.title);
  };

  const handleSaveSeo = async (id: string) => {
    const res = await dispatch(updateMediaSeo({ id, alt: editAlt, title: editTitle }));
    if (updateMediaSeo.fulfilled.match(res)) {
      toast.success("SEO tags updated successfully! 🏷️");
      setEditingId(null);
    } else {
      toast.error((res.payload as string) || "Failed to update SEO tags");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Media Library</h1>
          <p className="page-subtitle">Upload assets, manage Alt/Title SEO attributes, and get URLs for game logos</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 28, alignItems: "start" }}>
        {/* Upload Card */}
        <div className="card" style={{ maxWidth: 600 }}>
          <h3 style={{ fontWeight: 600, marginBottom: 20, color: "var(--accent-purple)" }}>
            Upload New Media
          </h3>
          <form onSubmit={handleUploadSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                border: "2px dashed var(--bg-surface2)",
                borderRadius: 12,
                padding: "24px 16px",
                textAlign: "center",
                cursor: "pointer",
                background: "var(--bg-surface0)",
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              {file ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <FileText size={32} color="var(--accent-purple)" />
                  <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-text)" }}>{file.name}</p>
                  <p style={{ fontSize: 12, color: "var(--text-overlay)" }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <Upload size={32} color="var(--text-overlay)" />
                  <p style={{ fontSize: 14, color: "var(--text-text)" }}>Click to browse image file</p>
                  <p style={{ fontSize: 11, color: "var(--text-overlay)" }}>Supports PNG, JPG, JPEG, WEBP, GIF, SVG</p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />

            <div>
              <label className="label">SEO Alt Text</label>
              <input
                className="input"
                placeholder="Alternative description for accessibility and search engines..."
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
              />
            </div>

            <div>
              <label className="label">Image Title</label>
              <input
                className="input"
                placeholder="Tooltip title text..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <button type="submit" className="btn-primary" disabled={loading} style={{ alignSelf: "flex-end", marginTop: 8 }}>
              {loading ? "Uploading..." : "Upload File"}
            </button>
          </form>
        </div>

        {/* Media List / Grid */}
        <div className="card">
          <h3 style={{ fontWeight: 600, marginBottom: 20, color: "var(--accent-blue)" }}>
            Uploaded Assets ({mediaList.length})
          </h3>
          {mediaList.length === 0 ? (
            <p style={{ color: "var(--text-overlay)", fontSize: 14, textAlign: "center", padding: "40px 0" }}>
              No assets in your library. Upload some images to get started!
            </p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 20 }}>
              {mediaList.map((item) => (
                <div
                  key={item._id}
                  style={{
                    background: "var(--bg-surface0)",
                    borderRadius: 12,
                    border: "1px solid var(--bg-surface1)",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {/* Preview container */}
                  <div
                    style={{
                      height: 160,
                      background: "var(--bg-base)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                      borderBottom: "1px solid var(--bg-surface1)",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.url}
                      alt={item.alt}
                      style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", padding: 8 }}
                    />
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        background: "rgba(0,0,0,0.5)",
                        color: "white",
                        padding: 6,
                        borderRadius: "50%",
                        display: "flex",
                      }}
                      title="Open full size"
                    >
                      <ExternalLink size={12} />
                    </a>
                  </div>

                  {/* Details section */}
                  <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
                    <div style={{ overflow: "hidden" }}>
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "var(--text-text)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                        title={item.filename}
                      >
                        {item.filename}
                      </p>
                    </div>

                    {editingId === item._id ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, background: "var(--bg-base)", padding: 8, borderRadius: 8 }}>
                        <div>
                          <label style={{ fontSize: 10, fontWeight: 700, color: "var(--accent-purple)" }}>Edit Alt</label>
                          <input
                            className="input"
                            style={{ padding: "4px 8px", fontSize: 12 }}
                            value={editAlt}
                            onChange={(e) => setEditAlt(e.target.value)}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: 10, fontWeight: 700, color: "var(--accent-purple)" }}>Edit Title</label>
                          <input
                            className="input"
                            style={{ padding: "4px 8px", fontSize: 12 }}
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                          />
                        </div>
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", marginTop: 4 }}>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            style={{ padding: "4px 8px", background: "none", border: "1px solid var(--accent-red)", color: "var(--accent-red)", borderRadius: 6, cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center" }}
                          >
                            <X size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveSeo(item._id)}
                            style={{ padding: "4px 8px", background: "var(--accent-green)", color: "#11111b", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", fontWeight: 600 }}
                          >
                            <Check size={12} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 11, color: "var(--text-overlay)" }}>
                        <p style={{ display: "flex", gap: 4 }}><strong style={{ color: "var(--text-subtext)" }}>Alt:</strong> <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.alt || "(none)"}</span></p>
                        <p style={{ display: "flex", gap: 4 }}><strong style={{ color: "var(--text-subtext)" }}>Title:</strong> <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title || "(none)"}</span></p>
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 8, marginTop: "auto", borderTop: "1px solid var(--bg-surface1)", paddingTop: 10 }}>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => handleCopyUrl(item.url)}
                        style={{ flex: 1, padding: "6px 0", fontSize: 11, display: "flex", justifyContent: "center", alignItems: "center", gap: 4 }}
                      >
                        <Copy size={12} /> Copy URL
                      </button>

                      {editingId !== item._id && (
                        <button
                          type="button"
                          onClick={() => startEditing(item)}
                          style={{ padding: "6px 8px", background: "none", border: "1px solid var(--bg-surface2)", borderRadius: 8, cursor: "pointer", color: "var(--text-text)" }}
                          title="Edit SEO tags"
                        >
                          <Edit size={12} />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDelete(item._id)}
                        style={{ padding: "6px 8px", background: "none", border: "1px solid var(--accent-red)", borderRadius: 8, cursor: "pointer", color: "var(--accent-red)" }}
                        title="Delete asset"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
