// components/SavedSearchEvents.jsx
import React, { useEffect, useRef } from "react";
import { toast } from "react-toastify";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function SavedSearchEvents() {
  const esRef = useRef(null);

  // dedupe + small aggregator: show ONE toast per listing even if
  // multiple saved searches match; combine their names if you want.
  const pendingMapRef = useRef(new Map()); // listingId -> { firstPayload, searchNames:Set, timer }

  useEffect(() => {
    const log = (...a) => console.log("[SavedSearchEvents]", ...a);

    const open = () => {
      const token = localStorage.getItem("token");
      if (!token) {
        log("no token in localStorage; not opening SSE");
        return;
      }
      if (esRef.current) esRef.current.close();

      const url = `${API}/saved-searches/stream?token=${encodeURIComponent(token)}`;
      log("opening (#1):", url);
      const es = new EventSource(url);
      esRef.current = es;

      es.onopen = () => log("SSE connection: open");
      es.addEventListener("ready", () => log("event: ready (SSE stream is live)"));

      es.addEventListener("saved_search_match", (e) => {
        let p;
        try {
          p = JSON.parse(e.data);
        } catch {
          return log("bad payload", e.data);
        }

        // tolerant parsing across payload shapes
        const listing = p.listing ?? {};
        const listingId = listing._id ?? listing.id ?? p.listingId;
        const title = listing.title ?? p.title ?? "New listing";
        const category = listing.category ?? p.category ?? "General";
        const authorName = listing.authorName ?? p.authorName ?? "someone";
        const searchName = p.searchName ?? p.search?.name ?? "Saved search";

        if (!listingId) {
          // if no id, just toast once and bail
          log("event: saved_search_match", { title, category, authorName, raw: p });
          toast.info(`New ${category} listing by ${authorName}: “${title}”`);
          return;
        }

        // aggregate by listingId for a brief window (e.g., 300ms)
        const map = pendingMapRef.current;
        const existing = map.get(listingId);
        if (existing) {
          existing.searchNames.add(searchName);
          // timer already scheduled; just update set
          return;
        }

        // create new bucket and schedule a single toast
        const bucket = {
          firstPayload: { title, category, authorName },
          searchNames: new Set([searchName]),
          timer: setTimeout(() => {
            const { firstPayload, searchNames } = map.get(listingId) || bucket;
            map.delete(listingId);

            const names = Array.from(searchNames);
            log("event: saved_search_match", {
              listingId,
              category: firstPayload.category,
              authorName: firstPayload.authorName,
              title: firstPayload.title,
              searches: names,
            });

            // one toast only
            toast.info(
              `New ${firstPayload.category} listing by ${firstPayload.authorName}: “${firstPayload.title}”`
              // if you want to display matching search names, append:
              // + (names.length ? ` (matches: ${names.join(", ")})` : "")
            );
          }, 300),
        };

        map.set(listingId, bucket);
      });

      es.onerror = (err) => {
        console.warn("[SavedSearchEvents] SSE error", err);
        // optional: auto-retry logic
      };
    };

    open();

    const handle = () => {
      log("loginStateChange → reopening SSE");
      open();
    };
    window.addEventListener("loginStateChange", handle);

    return () => {
      window.removeEventListener("loginStateChange", handle);
      if (esRef.current) esRef.current.close();
      // cleanup timers
      for (const { timer } of pendingMapRef.current.values()) clearTimeout(timer);
      pendingMapRef.current.clear();
    };
  }, []);

  return null;
}
