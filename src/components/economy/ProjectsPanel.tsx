"use client";

import { useState } from "react";
import { Archive, Boxes, CheckCircle2, Loader2, Plus, ShoppingBasket, Trash2 } from "lucide-react";
import { EconomySettings, Project } from "@/types/economy";
import { addProjectItem, completeProject, createProject, recordRawMaterialPurchase, removeProjectItem } from "@/lib/economyOps";
import { formatMoney } from "@/lib/money";
import { RAW_MATERIAL_CATEGORY } from "@/lib/economy";
import { useEconomyAction, useProjectItems } from "@/hooks/useEconomy";

interface Props {
  userId: string;
  settings: EconomySettings;
  dayKey: string;
  projects: Project[];
  onAddCategory?: (name: string) => Promise<void> | void;
  hasRawMaterialCategory: boolean;
}

export default function ProjectsPanel({
  userId,
  settings,
  dayKey,
  projects,
  onAddCategory,
  hasRawMaterialCategory,
}: Props) {
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState("🧺");
  const [budget, setBudget] = useState("50000");
  const [outputName, setOutputName] = useState("");
  const [outputQty, setOutputQty] = useState("1");
  const [outputUnit, setOutputUnit] = useState("pcs");
  const { busy, error, message, run } = useEconomyAction();

  const active = projects.filter((project) => project.status === "active");
  const finished = projects.filter((project) => project.status !== "active");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await run("Project", async () => {
      await createProject(userId, {
        title,
        emoji,
        budget: Number(budget) || 0,
        outputName: outputName || title,
        outputQuantity: Number(outputQty) || 1,
        outputUnit,
      });
    });
    if (ok) {
      setTitle("");
      setOutputName("");
      setBudget("50000");
      setCreating(false);
    }
  };

  return (
    <section className="card-glass">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white">
          <Boxes className="h-5 w-5 text-violet-500" /> Raw materials → product
        </h2>
        <button
          type="button"
          onClick={() => setCreating((value) => !value)}
          className="glass-button flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold"
        >
          <Plus className="h-3.5 w-3.5" /> New project
        </button>
      </div>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        Log raw-material purchases per project, then mark it done once the product is ready. Each
        purchase is split over the number of days you choose, and every daily share is counted inside
        that day&apos;s limit, because eating from your own ingredients is still food money.
      </p>

      {!hasRawMaterialCategory && onAddCategory && (
        <button
          type="button"
          onClick={() => onAddCategory("Raw Materials")}
          className="mt-2 text-[11px] font-bold text-blue-600 underline dark:text-blue-400"
        >
          Add &quot;Raw Materials&quot; to your category list
        </button>
      )}

      {creating && (
        <form onSubmit={handleCreate} className="mt-4 grid grid-cols-1 gap-2 rounded-xl border border-slate-200 p-3 dark:border-slate-700 sm:grid-cols-6">
          <input
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-center text-sm dark:border-slate-700 dark:bg-slate-900"
            placeholder="🧺"
          />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 sm:col-span-2"
            placeholder="Project name (e.g. Cookies)"
          />
          <input
            value={outputName}
            onChange={(e) => setOutputName(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 sm:col-span-2"
            placeholder="Finished product (e.g. Pineapple tarts)"
          />
          <input
            type="number"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            placeholder="Budget"
          />
          <input
            type="number"
            value={outputQty}
            onChange={(e) => setOutputQty(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            placeholder="Qty"
          />
          <input
            value={outputUnit}
            onChange={(e) => setOutputUnit(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            placeholder="unit (jar)"
          />
          <button
            type="submit"
            disabled={busy !== null}
            className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-bold text-white hover:bg-violet-500 disabled:opacity-50 sm:col-span-2"
          >
            {busy === "Project" ? "Saving…" : "Create project"}
          </button>
        </form>
      )}

      <div className="mt-4 space-y-3">
        {active.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            No active projects yet. Create one, add its raw-material list, then log the purchases.
          </p>
        )}
        {active.map((project) => (
          <ProjectCard
            key={project.id}
            userId={userId}
            settings={settings}
            dayKey={dayKey}
            project={project}
          />
        ))}

        {finished.length > 0 && (
          <div className="pt-2">
            <p className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <Archive className="h-3.5 w-3.5" /> Completed
            </p>
            <div className="mt-2 space-y-1">
              {finished.map((project) => (
                <div
                  key={project.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200/70 px-3 py-2 text-xs text-slate-600 dark:border-slate-700/70 dark:text-slate-300"
                >
                  <span className="font-semibold">
                    {project.emoji} {project.title} · {project.outputQuantity} {project.outputUnit}{" "}
                    {project.outputName}
                  </span>
                  <span>
                    spent {formatMoney(project.spent, settings)}
                    {project.budget > 0 && ` / ${formatMoney(project.budget, settings)}`}
                    {project.spent > 0 && project.outputQuantity > 0
                      ? ` · ${formatMoney(project.spent / project.outputQuantity, settings)} per ${project.outputUnit}`
                      : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && <p className="mt-3 text-sm font-medium text-red-500">{error}</p>}
      {message && <p className="mt-3 text-sm font-medium text-emerald-600 dark:text-emerald-400">{message}</p>}
    </section>
  );
}

function ProjectCard({
  userId,
  settings,
  dayKey,
  project,
}: {
  userId: string;
  settings: EconomySettings;
  dayKey: string;
  project: Project;
}) {
  const { items } = useProjectItems(userId, project.id);
  const { busy, error, run } = useEconomyAction();
  const [newName, setNewName] = useState("");
  const [newQty, setNewQty] = useState("1");
  const [newUnit, setNewUnit] = useState("pcs");
  const [newCost, setNewCost] = useState("");
  const [buyingItemId, setBuyingItemId] = useState<string | null>(null);
  const [buyAmount, setBuyAmount] = useState("");
  const [allowOver, setAllowOver] = useState(false);
  const [spreadDays, setSpreadDays] = useState(String(settings.defaultSpreadDays || 1));

  const spent = project.spent ?? 0;
  const budget = project.budget ?? 0;
  const pct = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;
  const allBought = items.length > 0 && items.every((item) => item.purchased);
  const remaining = Math.max(0, budget - spent);

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await run("Item", async () => {
      await addProjectItem({
        userId,
        projectId: project.id,
        name: newName,
        quantity: Number(newQty) || 1,
        unit: newUnit,
        estimatedCost: Number(newCost) || 0,
      });
    });
    if (ok) {
      setNewName("");
      setNewQty("1");
      setNewCost("");
    }
  };

  const buy = async (itemId: string) => {
    const amount = Number(buyAmount) || 0;
    if (amount <= 0) return;
    const ok = await run("Buy", async () => {
      await recordRawMaterialPurchase({
        userId,
        settings,
        projectId: project.id,
        projectItemId: itemId,
        amount,
        notes: "",
        category: RAW_MATERIAL_CATEGORY,
        deductFromWallet: true,
        allowOverBudget: allowOver,
        spreadDays: Number(spreadDays) || 1,
      });
    });
    if (ok) {
      setBuyingItemId(null);
      setBuyAmount("");
      setAllowOver(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white/70 p-3 dark:border-slate-700/70 dark:bg-slate-900/60">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-slate-900 dark:text-white">
            {project.emoji} {project.title}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Target: {project.outputQuantity} {project.outputUnit} {project.outputName || "product"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-slate-900 dark:text-white">
            {formatMoney(spent, settings)}
            {budget > 0 && (
              <span className="font-medium text-slate-500 dark:text-slate-400">
                {" "}
                / {formatMoney(budget, settings)}
              </span>
            )}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {budget > 0 ? `${formatMoney(remaining, settings)} left` : "no budget"}
          </p>
        </div>
      </div>

      {budget > 0 && (
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div
            className={`h-full rounded-full ${pct >= 100 ? "bg-red-500" : "bg-violet-500"}`}
            style={{ width: `${Math.max(pct, spent > 0 ? 4 : 0)}%` }}
          />
        </div>
      )}

      <div className="mt-3 space-y-1.5">
        {items.map((item) => (
          <div key={item.id} className="rounded-lg border border-slate-200/70 px-2 py-1.5 dark:border-slate-700/70">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    run("Delete item", async () => {
                      await removeProjectItem({ userId, projectId: project.id, itemId: item.id });
                    })
                  }
                  className="text-slate-400 hover:text-red-500"
                  title="Delete item"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100">
                  {item.name}{" "}
                  <span className="font-normal text-slate-500 dark:text-slate-400">
                    {item.quantity} {item.unit}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {item.purchased
                    ? `bought ${formatMoney(item.actualCost, settings)}`
                    : item.estimatedCost > 0
                      ? `est. ${formatMoney(item.estimatedCost, settings)}`
                      : ""}
                </span>
                {item.purchased ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setBuyingItemId(buyingItemId === item.id ? null : item.id);
                      setBuyAmount(String(item.estimatedCost || ""));
                    }}
                    className="flex items-center gap-1 rounded-md bg-violet-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-violet-500"
                  >
                    <ShoppingBasket className="h-3 w-3" /> Buy
                  </button>
                )}
              </div>
            </div>

            {buyingItemId === item.id && !item.purchased && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <input
                  type="number"
                  value={buyAmount}
                  onChange={(e) => setBuyAmount(e.target.value)}
                  placeholder="Actual price"
                  className="w-28 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold dark:border-slate-700 dark:bg-slate-900"
                />
                {settings.spreadRawMaterials && (
                  <label className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                    spread
                    <input
                      type="number"
                      min={1}
                      max={90}
                      value={spreadDays}
                      onChange={(e) => setSpreadDays(e.target.value)}
                      className="w-14 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold dark:border-slate-700 dark:bg-slate-900"
                    />
                    days
                  </label>
                )}
                <label className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={allowOver}
                    onChange={(e) => setAllowOver(e.target.checked)}
                    className="accent-violet-600"
                  />
                  over budget
                </label>
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => buy(item.id)}
                  className="rounded-lg bg-violet-600 px-2 py-1.5 text-[10px] font-bold text-white hover:bg-violet-500 disabled:opacity-50"
                >
                  {busy === "Buy" ? <Loader2 className="h-3 w-3 animate-spin" /> : "Log purchase"}
                </button>
                {settings.spreadRawMaterials && Number(buyAmount) > 0 && (
                  <p className="w-full text-[10px] text-slate-500 dark:text-slate-400">
                    {formatMoney(
                      Number(buyAmount) / Math.max(1, Number(spreadDays) || 1),
                      settings
                    )}{" "}
                    per day for {Math.max(1, Number(spreadDays) || 1)} days, counted inside the daily
                    limit.
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={addItem} className="mt-2 flex flex-wrap items-center gap-1.5">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Ingredient (e.g. flour)"
          className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] dark:border-slate-700 dark:bg-slate-900"
        />
        <input
          type="number"
          value={newQty}
          onChange={(e) => setNewQty(e.target.value)}
          className="w-14 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] dark:border-slate-700 dark:bg-slate-900"
        />
        <input
          value={newUnit}
          onChange={(e) => setNewUnit(e.target.value)}
          className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] dark:border-slate-700 dark:bg-slate-900"
        />
        <input
          type="number"
          value={newCost}
          onChange={(e) => setNewCost(e.target.value)}
          placeholder="est."
          className="w-20 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] dark:border-slate-700 dark:bg-slate-900"
        />
        <button
          type="submit"
          className="rounded-lg border border-violet-500 px-2 py-1.5 text-[10px] font-bold text-violet-600 hover:bg-violet-50 dark:text-violet-300 dark:hover:bg-violet-500/10"
        >
          + Item
        </button>
      </form>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] text-slate-400">
          {allBought
            ? "All ingredients bought — ready to mark as done."
            : `${items.filter((item) => item.purchased).length}/${items.length} ingredients bought`}
        </p>
        <button
          type="button"
          disabled={!allBought || busy !== null}
          onClick={() =>
            run("Complete project", async () => {
              await completeProject({ userId, settings, dayKey, project });
            })
          }
          className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[10px] font-bold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy === "Complete project"
            ? "Saving…"
            : `Complete (+${settings.projectBonusPoints} pts)`}
        </button>
      </div>

      {error && <p className="mt-2 text-[11px] font-medium text-red-500">{error}</p>}
    </div>
  );
}
