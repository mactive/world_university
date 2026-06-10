import type { UniversityAlias } from "../types";

export type UniversityAliasMap = Record<string, string>;

export function buildUniversityAliasMap(aliases: UniversityAlias[] = []): UniversityAliasMap {
  return Object.fromEntries(aliases.map((item) => [item.alias, item.universityId]));
}

export function canonicalUniversityId(id: string, aliases: UniversityAliasMap = {}) {
  return aliases[id] ?? id;
}

export function universityIdCandidates(id: string, aliases: UniversityAliasMap = {}) {
  const canonicalId = canonicalUniversityId(id, aliases);
  const aliasIds = Object.entries(aliases)
    .filter(([, target]) => target === canonicalId)
    .map(([alias]) => alias);
  return [...new Set([canonicalId, id, ...aliasIds])];
}
