import React, { useState } from "react";
import { toast } from "react-toastify";
const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function SaveSearchButton({ currentFilters }) {
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const token = localStorage.getItem("token");
    console.log("[SaveSearch] click", { tokenPresent: !!token, currentFilters });
    if (!token) {
      alert("Please log in to save searches.");
      return;
    }

    const payload = {
      name:
        currentFilters?.label || `Saved search ${new Date().toLocaleString()}`,
      category: currentFilters?.category || "",
      text: currentFilters?.text || "",
      isService:
        typeof currentFilters?.isService === "boolean"
          ? currentFilters.isService
          : null,
      minBudget:
        currentFilters?.minBudget != null ? currentFilters.minBudget : null,
      maxBudget:
        currentFilters?.maxBudget != null ? currentFilters.maxBudget : null,
      tags: currentFilters?.tags || [],
      status: "active",
      enabled: true,
    };

    console.log("[SaveSearch] payload", payload);
    setSaving(true);
    try {
      const res = await fetch(`${API}/saved-searches`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      console.log("[SaveSearch] response", { ok: res.ok, status: res.status, data });

      if (!res.ok || !data?.success) {
        toast.error(data?.error || "Failed to save search");
      } else {
        toast.success("Saved search created!");
        console.log("[SaveSearch] saved ✅", {
          id: data.search?._id,
          name: data.search?.name,
        });
      }
    } catch (err) {
      console.error("[SaveSearch] error", err);
      toast.error("Save failed. Check console.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
      {saving ? "Saving…" : "Save this search"}
    </button>
  );
}
