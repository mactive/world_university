import { useCallback, useEffect, useState } from "react";
import { api } from "./api";
import { AdminSite } from "./components/AdminSite";
import { PublicSite } from "./components/PublicSite";
import { seedUniversities } from "./data/universities";
import { buildUniversityAliasMap } from "./data/universityAliases";
import type { University, UniversityAlias } from "./types";

export default function App() {
  const [universities, setUniversities] = useState<University[]>(seedUniversities);
  const [aliases, setAliases] = useState<UniversityAlias[]>([]);
  const [source, setSource] = useState("seed");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [universityResult, aliasResult] = await Promise.all([
        api.universities(),
        api.universityAliases(),
      ]);
      setUniversities(universityResult.universities);
      setAliases(aliasResult.aliases);
      setSource(universityResult.source);
    } catch {
      setUniversities(seedUniversities);
      setAliases([]);
      setSource("seed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (window.location.pathname.startsWith("/admin")) {
    return <AdminSite universities={universities} aliases={aliases} source={source} onRefresh={load} />;
  }

  return (
    <PublicSite
      universities={universities}
      aliases={buildUniversityAliasMap(aliases)}
      loading={loading}
    />
  );
}
