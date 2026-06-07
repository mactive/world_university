import { useCallback, useEffect, useState } from "react";
import { api } from "./api";
import { AdminSite } from "./components/AdminSite";
import { PublicSite } from "./components/PublicSite";
import { seedUniversities } from "./data/universities";
import type { University } from "./types";

export default function App() {
  const [universities, setUniversities] = useState<University[]>(seedUniversities);
  const [source, setSource] = useState("seed");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const result = await api.universities();
      setUniversities(result.universities);
      setSource(result.source);
    } catch {
      setUniversities(seedUniversities);
      setSource("seed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (window.location.pathname.startsWith("/admin")) {
    return <AdminSite universities={universities} source={source} onRefresh={load} />;
  }

  return <PublicSite universities={universities} loading={loading} />;
}
