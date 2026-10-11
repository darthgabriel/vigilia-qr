export function shuffle<T>(items: readonly T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export interface Assignment {
  name: string;
  topicId: string | null;
}

export function assign(names: readonly string[], topicIds: readonly string[]): Assignment[] {
  const pool = shuffle(names);
  if (topicIds.length === 0) {
    return pool.map((name) => ({ name, topicId: null }));
  }
  return pool.map((name, i) => ({ name, topicId: topicIds[i % topicIds.length] }));
}

export function groupSizes(count: number, groups: number): number[] {
  if (groups <= 0) return [];
  const sizes = new Array(groups).fill(Math.floor(count / groups));
  for (let i = 0; i < count % groups; i++) sizes[i]++;
  return sizes;
}

export function pickSmallest(
  topicIds: readonly string[],
  counts: ReadonlyMap<string, number>,
): string | null {
  if (topicIds.length === 0) return null;
  let min = Number.POSITIVE_INFINITY;
  let candidates: string[] = [];
  for (const id of topicIds) {
    const c = counts.get(id) ?? 0;
    if (c < min) {
      min = c;
      candidates = [id];
    } else if (c === min) {
      candidates.push(id);
    }
  }
  return candidates[Math.floor(Math.random() * candidates.length)] ?? null;
}
