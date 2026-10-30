/**
 * 年级切换的本机归档（docs/12 v1.2）：未登录家长账号时，切换年级走纯本机通道——
 * 旧年级学习切片封存到 localStorage，切回时原样恢复。登录家庭的封存走服务端
 * GradeArchive（server/src/services/gradeService.ts），两套互不影响。
 * storage 可注入，便于在 node 测试环境验证行为。
 */

export interface GradeArchiveSlice {
  lessons: unknown;
  pointers: unknown;
  mistakes: unknown;
  weakness: unknown;
  dictationQueue: unknown;
  archivedAt: string;
}

const KEY = 'xiaotao-grade-archives-v1';

type MinimalStorage = {
  getItem(name: string): string | null;
  setItem(name: string, value: string): void;
  removeItem(name: string): void;
};

function defaultStorage(): MinimalStorage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

function loadAll(store: MinimalStorage | null): Record<string, GradeArchiveSlice> {
  if (!store) return {};
  try {
    const raw = store.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {};
    const out: Record<string, GradeArchiveSlice> = {};
    for (const [gradeKey, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (!/^g[1-6]s[12]$/.test(gradeKey)) continue;
      if (typeof value !== 'object' || value === null) continue;
      const record = value as Record<string, unknown>;
      out[gradeKey] = {
        lessons: record['lessons'] ?? {},
        pointers: record['pointers'] ?? {},
        mistakes: record['mistakes'] ?? [],
        weakness: record['weakness'] ?? {},
        dictationQueue: record['dictationQueue'] ?? {},
        archivedAt: typeof record['archivedAt'] === 'string' ? record['archivedAt'] : '',
      };
    }
    return out;
  } catch {
    return {};
  }
}

function saveAll(store: MinimalStorage | null, all: Record<string, GradeArchiveSlice>): void {
  if (!store) return;
  try {
    store.setItem(KEY, JSON.stringify(all));
  } catch {
    // 本机存储不可用（隐私模式等）：归档静默降级，切换本身不受影响。
  }
}

/** 封存一个年级的学习切片（同键覆写）。 */
export function saveGradeArchive(
  gradeKey: string,
  slice: Omit<GradeArchiveSlice, 'archivedAt'>,
  store: MinimalStorage | null = defaultStorage(),
): void {
  const all = loadAll(store);
  all[gradeKey] = { ...slice, archivedAt: new Date().toISOString() };
  saveAll(store, all);
}

/** 取出并存档仍保留（只读查看用）。 */
export function getGradeArchive(
  gradeKey: string,
  store: MinimalStorage | null = defaultStorage(),
): GradeArchiveSlice | null {
  return loadAll(store)[gradeKey] ?? null;
}

/** 取走并存档删除（恢复接续语义：单副本回到活动态）。 */
export function takeGradeArchive(
  gradeKey: string,
  store: MinimalStorage | null = defaultStorage(),
): GradeArchiveSlice | null {
  const all = loadAll(store);
  const slice = all[gradeKey];
  if (!slice) return null;
  delete all[gradeKey];
  saveAll(store, all);
  return slice;
}

export function listGradeArchiveKeys(store: MinimalStorage | null = defaultStorage()): string[] {
  return Object.keys(loadAll(store));
}

/** 清空全部本机归档（退出换账号 wipe 用，docs/02 §5.2-7）：归档键不分家庭，
 * 不清的话下一账号在同机走本机切换通道会恢复上一家庭的进度（缺陷清单 H2）。 */
export function clearGradeArchives(store: MinimalStorage | null = defaultStorage()): void {
  try {
    store?.removeItem(KEY);
  } catch {
    // 本机存储不可用：本就没有可清的归档
  }
}

export function sliceIsNonEmpty(slice: Omit<GradeArchiveSlice, 'archivedAt'>): boolean {
  const lessons = slice.lessons;
  const mistakes = slice.mistakes;
  const weakness = slice.weakness;
  const dictationQueue = slice.dictationQueue;
  return (
    (typeof lessons === 'object' && lessons !== null && Object.keys(lessons).length > 0) ||
    (Array.isArray(mistakes) && mistakes.length > 0) ||
    (typeof weakness === 'object' && weakness !== null && Object.keys(weakness).length > 0) ||
    (typeof dictationQueue === 'object' && dictationQueue !== null && Object.keys(dictationQueue).length > 0)
  );
  // 口径对齐服务端 isNonEmptySlice：漏 dictationQueue 时纯听写进度在本机
  // 切换通道不封存，切回即丢（缺陷清单 值得考虑2）。
}
