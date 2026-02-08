"use client";
import { useMemo, useState, useEffect, useRef } from "react";
import { fetchRecentByMeal, addToTracking, fetchTracking, removeFromTracking, searchFood } from "@/lib/api/food/food";
import { Food, FoodTracked, NewFood } from "@/lib/dataTypes";
import { todayLocalISO, formatShortDate } from "@/lib/utils/date";
import { Meal, mealForNow } from "@/lib/utils/meal";
import AddFoodForm from "@/app/components/AddFood";

// ---------- Types ----------
type Mode = "recent" | "all";

// ---------- Dummy Data (for "All") ----------
const MEALS: Meal[] = ["breakfast","lunch","dinner","snack"];

// ---------- Meal Colors (chips & headers only) ----------
const mealColors: Record<Meal, { bg: string; text: string; ring: string; hover: string; border: string; muted: string }> = {
  breakfast: { bg: "bg-sky-100 dark:bg-sky-900/30", text: "text-sky-800 dark:text-sky-100", ring: "ring-sky-300/60 dark:ring-sky-500/40", hover: "hover:bg-sky-200 dark:hover:bg-sky-900/50", border: "border-sky-300/70 dark:border-sky-700/70", muted: "text-sky-700 dark:text-sky-200" },
  lunch:     { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-800 dark:text-emerald-100", ring: "ring-emerald-300/60 dark:ring-emerald-500/40", hover: "hover:bg-emerald-200 dark:hover:bg-emerald-900/50", border: "border-emerald-300/70 dark:border-emerald-700/70", muted: "text-emerald-700 dark:text-emerald-200" },
  dinner:    { bg: "bg-indigo-100 dark:bg-indigo-900/30", text: "text-indigo-800 dark:text-indigo-100", ring: "ring-indigo-300/60 dark:ring-indigo-500/40", hover: "hover:bg-indigo-200 dark:hover:bg-indigo-900/50", border: "border-indigo-300/70 dark:border-indigo-700/70", muted: "text-indigo-700 dark:text-indigo-200" },
  snack:     { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-800 dark:text-amber-100", ring: "ring-amber-300/60 dark:ring-amber-500/40", hover: "hover:bg-amber-200 dark:hover:bg-amber-900/50", border: "border-amber-300/70 dark:border-amber-700/70", muted: "text-amber-700 dark:text-amber-200" },
};

// helper to aid server record search. rather than every key triggering a search, wait for a pause.
function useDebouncedValue<T>(value: T, delay = 450) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function nameIncludes(f: Food, q: string) {
  return f.name.toLowerCase().includes(q) || (f.brand?.toLowerCase().includes(q) ?? false);
}

// ---------- Component ----------
export default function FoodPicker() {
  const [mode, setMode] = useState<Mode>("recent");
  const [query, setQuery] = useState("");
  const [recentMealFilter, setRecentMealFilter] = useState<Meal>(mealForNow());
  const debouncedQuery = useDebouncedValue(query, 450);
  const requestSeq = useRef(0);

  // Logged foods per meal
  const [log, setLog] = useState<Record<Meal, { food: FoodTracked; servings: number }[]>>({
    breakfast: [], lunch: [], dinner: [], snack: []
  });

  // Bottom sheet
  const [sheet, setSheet] = useState<{ open: boolean; food?: Food }>({ open: false });

  // Recents fetched from backend
  const [recentsByMeal, setRecentsByMeal] = useState<Partial<Record<Meal, Food[]>>>({});
  const [loadingRecents, setLoadingRecents] = useState<Partial<Record<Meal, boolean>>>({});
  const [errorRecents, setErrorRecents] = useState<Partial<Record<Meal, string>>>({});
  const [date, setDate] = useState<string>(todayLocalISO());
  const [foods, setFoods] = useState<Food[]>();
  const [loadingAll, setLoadingAll] = useState(false);
  const [showNewFood, setShowNewFood] = useState(false);

  // fetch recents when the meal filter changes
  useEffect(() => {
    void ensureRecents(recentMealFilter);
  }, [recentMealFilter]);

  // fetch tracked foods for date
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchTracking(date);
        const rows = (data?.data?.data ?? data ?? []) as FoodTracked[];
        const toEntry = (f: any) => ({ food: f, servings: Number(f?.servings ?? 1) });
        const breakfastOnly = rows.filter(r => r.meal === 0);
        const lunchOnly     = rows.filter(r => r.meal === 1);
        const dinnerOnly    = rows.filter(r => r.meal === 2);
        const snackOnly     = rows.filter(r => r.meal === 3);

        if (mounted) {
          setLog({
            breakfast: breakfastOnly.map(toEntry),
            lunch:     lunchOnly.map(toEntry),
            dinner:    dinnerOnly.map(toEntry),
            snack:     snackOnly.map(toEntry),
          });
        }
      } catch (err) {
        console.error(err);
      }
    })();
    return () => { mounted = false; };
  }, [date]);

    // fetch foods from search when mode is changed and query changes
    useEffect(() => {

        if (mode !== "all") return;

        const q = debouncedQuery.trim();

        if (q.length < 2) {
            setFoods([]);
            setLoadingAll(false);
            return;
        }

        const mySeq = ++requestSeq.current;

        setLoadingAll(true);

        (async () => {

            try {

                const data = await searchFood(q); // no AbortController
                
                if (requestSeq.current === mySeq) setFoods(data);

            } catch (err) {

                if (requestSeq.current === mySeq) {
                    console.error(err);
                    setFoods([]);
                }

            } finally {

                if (requestSeq.current === mySeq) setLoadingAll(false);

            }

        })();
        
    }, [mode, debouncedQuery]);

  // results for recent tab
  const recentFoods = useMemo(() => {
    const list = recentsByMeal[recentMealFilter] ?? [];
    const q = query.toLowerCase().trim();
    return q ? list.filter(f => nameIncludes(f, q)) : list;
  }, [recentsByMeal, recentMealFilter, query]);

    // results for all tab
    const allFoods = useMemo(() => {
        const listAll = foods ?? [];
        const q = query.toLowerCase().trim();
        return q ? listAll.filter(f => nameIncludes(f, q)) : listAll;
    }, [query, foods]);

  async function ensureRecents(meal: Meal) {
    if (recentsByMeal[meal]?.length) return;
    setLoadingRecents(p => ({ ...p, [meal]: true }));
    setErrorRecents(p => ({ ...p, [meal]: undefined }));
    try {
      const items = await fetchRecentByMeal(meal);
      setRecentsByMeal(p => ({ ...p, [meal]: items }));
    } catch (e: any) {
      setErrorRecents(p => ({ ...p, [meal]: e?.message ?? "Failed to load recents" }));
    } finally {
      setLoadingRecents(p => ({ ...p, [meal]: false }));
    }
  }

  // add a food to the log
  async function addFood(food: Food, meal: Meal, servings = 1) {
    try {
      await addToTracking(food, MEALS.indexOf(meal), date);
    } catch (err) {
      console.log("An error has occurred", err);
    }
    setLog(prev => ({ ...prev, [meal]: [...prev[meal], { food, servings }] }));
  }

  // remove a food from the log
  async function removeLogItem(meal: Meal, idx: number) {
    const data = getTrackedItem(meal, idx);
    if (!data) {
      alert("There was an error processing your request, please try again.");
      return;
    }
    try {
      await removeFromTracking(data.food.id);
    } catch {}
    setLog(prev => ({ ...prev, [meal]: prev[meal].filter((_, i) => i !== idx) }));
  }

  // Get the tracked meal record
  function getTrackedItem(meal: Meal, idx: number) {
    switch(meal){
      case 'breakfast': return log.breakfast[idx];
      case 'lunch':     return log.lunch[idx];
      case 'dinner':    return log.dinner[idx];
      case 'snack':     return log.snack[idx];
      default:          return null;
    }
  }

  // Layout chrome adjustment if you have a fixed top bar
  const CHROME = 0;

  return (
    <div className="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 md:overflow-hidden"
        style={{ height: `calc(100vh - ${CHROME}px)` }}
      >
        {/* LEFT: tabbed source list (independent scroll) */}
        <div className="md:h-full md:overflow-y-auto md:pr-1">
          <div className="sticky top-0 z-10 pb-2 bg-gray-100 dark:bg-gray-900">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl font-bold">Foods</h1>
              <button
                onClick={() => setShowNewFood(true)}
                className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                + New Food
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-2">
              {(["recent","all"] as Mode[]).map(t => (
                <button
                  key={t}
                  onClick={() => { setMode(t); setQuery(""); }}
                  className={[
                    "px-3 py-1.5 rounded border text-sm capitalize",
                    mode === t
                      ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
                      : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
                  ].join(" ")}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Search + contextual controls */}
            {mode === "recent" && (
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-sm opacity-80">Showing recent for:</div>
                <div className="flex gap-2">
                  {MEALS.map(m => {
                    const c = mealColors[m];
                    const active = recentMealFilter === m;
                    return (
                      <button
                        key={m}
                        onClick={() => setRecentMealFilter(m)}
                        className={[
                          "px-2 py-1 rounded text-xs capitalize border",
                          active ? `${c.bg} ${c.text} ${c.border} ring-2 ${c.ring}`
                                 : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
                        ].join(" ")}
                      >
                        {m}
                      </button>
                    );
                  })}
                </div>
                <div className="flex-1" />
                <input
                  className="w-full md:w-1/2 p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                  placeholder={`Search recent ${recentMealFilter}…`}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            )}

            {mode === "all" && (
              <input
                className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                placeholder="Search all foods…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            )}
          </div>

          {/* LISTS */}
          <div className="mt-2 space-y-2">
            {mode === "recent" && (
              <>
                {loadingRecents[recentMealFilter] && (
                  <div className="text-sm text-gray-500">Loading…</div>
                )}
                {errorRecents[recentMealFilter] && (
                  <div className="text-sm text-red-500">{errorRecents[recentMealFilter]}</div>
                )}
                {!loadingRecents[recentMealFilter] && recentFoods.length === 0 && (
                  <Empty label="No recent foods found." />
                )}
                {!loadingRecents[recentMealFilter] &&
                  recentFoods.map(f => (
                    <FoodCard
                      key={f.id}
                      food={f}
                      onClick={() => setSheet({ open: true, food: f })}
                      onQuickAdd={(meal) => addFood(f, meal, 1)}
                    />
                ))}
              </>
            )}

            {mode === "all" && allFoods.map(f => (
              <FoodCard
                key={f.id}
                food={f}
                onClick={() => setSheet({ open: true, food: f })}
                onQuickAdd={(meal) => addFood(f, meal, 1)}
              />
            ))}
            {mode === "all" && allFoods.length === 0 && !loadingAll && <Empty label="No foods match your search." />}

            <div className="h-8" />
          </div>
        </div>

        {/* RIGHT: meals log (independent scroll) */}
        <div className="md:h-full md:overflow-y-auto md:pl-1">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {/* Native calendar */}
            <input
              type="date"
              className="px-2 py-1.5 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
              placeholder="YYYY-MM-DD"
              onChange={(e) => { setDate(e.target.value); }}
            />
            {/* Readable label */}
            <span className="text-sm opacity-70">
              {formatShortDate(date)}
            </span>
          </div>

          <div className="space-y-4">
            {MEALS.map(m => {
              const c = mealColors[m];
              const totalKcal = log[m].reduce((s, x) => s + x.food.calories * x.servings, 0);

              return (
                <div
                  key={m}
                  className="rounded-xl overflow-hidden bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700"
                >
                  {/* Colored header */}
                  <div className={["px-4 py-2 border-b", c.bg, c.border].join(" ")}>
                    <div className="flex items-center justify-between">
                      <h2 className={["font-semibold capitalize", c.text].join(" ")}>{m}</h2>
                      <span className={["text-xs", c.muted].join(" ")}>{totalKcal} kcal</span>
                    </div>
                  </div>

                  {/* Tag list */}
                  <div className="p-4">
                    {log[m].length === 0 ? (
                      <div className="text-xs text-gray-500 italic">
                        Tap a “+ {m}” chip on a food to add it here.
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {log[m].map((x, i) => (
                          <Tag
                            key={`${x.food.id}-${i}`}
                            label={`${x.food.name} × ${x.servings}`}
                            sub={`${x.food.calories * x.servings} kcal`}
                            colorClasses={`${c.border} ${c.text}`}
                            onRemove={() => removeLogItem(m, i)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div className="h-8" />
          </div>
        </div>
      </div>

      {/* Bottom sheet: add food */}
      {sheet.open && sheet.food && (
        <AddSheet
          title={`Add ${sheet.food.name}`}
          onClose={() => setSheet({ open: false })}
          onAdd={(meal, servings) => {
            addFood(sheet.food!, meal, servings);
            setSheet({ open: false });
          }}
        />
      )}

      {showNewFood && (
        <NewFoodModal
          onClose={() => setShowNewFood(false)}
          onCreated={(newFood) => {
            setMode("all");
            setQuery("");
            setFoods(prev => [newFood as Food, ...(prev ?? [])]);
            setShowNewFood(false);
          }}
        />
      )}
    </div>
  );
}

// ---------- UI Bits ----------
function FoodCard({
  food, onClick, onQuickAdd
}: {
  food: Food;
  onClick: () => void;
  onQuickAdd: (meal: Meal) => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3 rounded-xl shadow transition border hover:-translate-y-0.5 hover:shadow-md bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="font-semibold truncate">{food.name}</div>
          <div className="mt-1 inline-flex items-center gap-2">
            {food.brand && (
              <span className="px-2 py-0.5 text-[11px] rounded bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100">
                {food.brand}
              </span>
            )}
            <span className="px-2 py-0.5 text-[11px] rounded bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100">
              {food.calories} kcal
            </span>
            <span className="px-2 py-0.5 text-[11px] rounded bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100">
              P:{food.protein} C:{food.carbs} F:{food.fat}
            </span>
          </div>
        </div>
      </div>

      {/* Quick add chips */}
      <div className="mt-3 flex flex-wrap gap-2">
        {MEALS.map(m => {
          const c = mealColors[m];
          return (
            <span
              key={m}
              onClick={(e) => { e.stopPropagation(); onQuickAdd(m); }}
              className={[
                "px-2 py-1 text-xs rounded border cursor-pointer capitalize transition",
                c.bg, c.text, c.border, c.hover
              ].join(" ")}
            >
              + {m}
            </span>
          );
        })}
      </div>
    </button>
  );
}

function Tag({
  label, sub, onRemove, colorClasses
}: {
  label: string;
  sub?: string;
  onRemove: () => void;
  colorClasses?: string; // allows meal color tinting
}) {
  return (
    <span
      className={[
        "inline-flex items-center gap-2 max-w-full",
        "px-2 py-1 rounded-full text-xs border",
        "bg-gray-50 text-gray-800 dark:bg-gray-700 dark:text-gray-100",
        colorClasses ?? ""
      ].join(" ")}
      title={sub ? `${label} — ${sub}` : label}
    >
      <span className="truncate">{label}</span>
      {sub && <span className="opacity-70">· {sub}</span>}
      <button
        type="button"
        aria-label={`Remove ${label}`}
        onClick={onRemove}
        className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full hover:bg-black/10 dark:hover:bg-white/10"
      >
        ×
      </button>
    </span>
  );
}

function Empty({ label }: { label: string }) {
  return <div className="text-sm text-gray-500 italic">{label}</div>;
}

/* ========= Scroll/lock-fixed AddSheet ========= */
function AddSheet({
  title, onClose, onAdd
}: {
  title: string;
  onClose: () => void;
  onAdd: (meal: Meal, servings: number) => void;
}) {
  const [meal, setMeal] = useState<Meal>(mealForNow());
  const [servings, setServings] = useState(1);

  // 🔒 Lock background scroll (iOS-safe)
  useEffect(() => {
    const y = window.scrollY || document.documentElement.scrollTop;
    const prev = {
      position: document.body.style.position,
      top: document.body.style.top,
      left: document.body.style.left,
      width: document.body.style.width,
      overflowY: document.body.style.overflowY,
    };
    document.body.style.position = "fixed";
    document.body.style.top = `-${y}px`;
    document.body.style.left = "0";
    document.body.style.width = "100%";
    document.body.style.overflowY = "hidden";
    return () => {
      document.body.style.position = prev.position;
      document.body.style.top = prev.top;
      document.body.style.left = prev.left;
      document.body.style.width = prev.width;
      document.body.style.overflowY = prev.overflowY;
      window.scrollTo(0, y);
    };
  }, []);

  return (
    <div
      className="
        fixed inset-0 z-50
        flex items-end md:items-center justify-center
        bg-black/40
        overflow-y-auto overscroll-contain
        p-4
      "
      role="dialog"
      aria-modal="true"
    >
      <div
        className="
          w-full md:max-w-md
          bg-white dark:bg-gray-800 rounded-t-2xl md:rounded-2xl
          p-4
          max-h-[85vh] overflow-y-auto
          border border-gray-200 dark:border-gray-700
        "
      >
        <div className="flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 pb-2">
          <h3 className="font-semibold">{title}</h3>
          <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            Close
          </button>
        </div>

        <div className="mt-3">
          <label className="block text-sm mb-1">Meal</label>
          <div className="grid grid-cols-4 gap-2">
            {MEALS.map(m => {
              const c = mealColors[m];
              const active = meal === m;
              return (
                <button
                  key={m}
                  onClick={() => setMeal(m)}
                  className={[
                    "px-2 py-2 rounded text-sm capitalize border transition",
                    active ? `${c.bg} ${c.text} ${c.border} ring-2 ${c.ring}`
                           : "bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                  ].join(" ")}
                >
                  {m}
                </button>
              );
            })}
          </div>

          <label className="block text-sm mt-4 mb-1">Servings</label>
          <div className="inline-flex items-center gap-2">
            <button onClick={() => setServings(s => Math.max(0.5, +(s - 0.5).toFixed(1)))} className="px-3 py-2 rounded bg-gray-100 dark:bg-gray-700">-</button>
            <span className="w-12 text-center">{servings}</span>
            <button onClick={() => setServings(s => +(s + 0.5).toFixed(1))} className="px-3 py-2 rounded bg-gray-100 dark:bg-gray-700">+</button>
          </div>

          <button
            onClick={() => onAdd(meal, servings)}
            className="mt-4 w-full py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

/* ========= Scroll/lock-fixed NewFoodModal ========= */
function NewFoodModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (food: NewFood) => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 🔒 Body lock (iOS & desktop)
  useEffect(() => {
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    const prev = {
      position: document.body.style.position,
      top: document.body.style.top,
      left: document.body.style.left,
      width: document.body.style.width,
      overflowY: document.body.style.overflowY,
    };
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.width = "100%";
    document.body.style.overflowY = "hidden";
    return () => {
      document.body.style.position = prev.position;
      document.body.style.top = prev.top;
      document.body.style.left = prev.left;
      document.body.style.width = prev.width;
      document.body.style.overflowY = prev.overflowY;
      window.scrollTo(0, scrollY);
    };
  }, []);

  async function handleSubmit(input: {
    name: string;
    brand?: string;
    calories: number;
    fat: number;
    carbs: number;
    protein: number;
    servingSize: number;
    servingUnit: string;
  }) {
    try {
      setSubmitting(true);
      setError(null);

      // Fake an ID for now — no API
      const newFood: NewFood = {
        name: input.name.trim(),
        brand: input.brand?.trim() || "Generic",
        calories: input.calories,
        fat: input.fat,
        carbs: input.carbs,
        protein: input.protein,
        serving_size: input.servingSize,
        serving_unit: input.servingUnit
      };

      onCreated(newFood);
    } catch (e: any) {
      setError(e?.message ?? "Failed to create food.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="
        fixed inset-0 z-50
        flex items-end md:items-center justify-center
        bg-black/40
        overflow-y-auto overscroll-contain
        p-4
      "
      role="dialog"
      aria-modal="true"
    >
      <div
        className="
          w-full max-w-md
          bg-white dark:bg-gray-800 rounded-t-2xl md:rounded-2xl
          border border-gray-200 dark:border-gray-700
          max-h-[85vh] overflow-y-auto
        "
      >
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Add New Food</h3>
            <button
              onClick={onClose}
              className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Close
            </button>
          </div>
        </div>

        <div className="p-4">
          {/* Ensure this import path matches your file, e.g. "@/components/AddFoodForm" */}
          <AddFoodForm onSubmit={handleSubmit} submitting={submitting} error={error} />
        </div>
      </div>
    </div>
  );
}
