"use client";
import { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Plus,
  KeyRound,
  Lightbulb,
  Target,
  Receipt,
  Check,
} from "lucide-react";
import { useStore } from "./Store";
import { Heading, useMoney } from "./UI";
import { budget, addChallenge } from "@/lib/model";
import { askAI } from "@/lib/integrations";
export default function Insights() {
  const { s, today, mutate, notify, apiKey, setApiKey } = useStore(),
    [question, setQuestion] = useState(
      "Review my spending and how consistently I complete challenges. Suggest three realistic challenges for today.",
    ),
    [busy, setBusy] = useState(false),
    [result, setResult] = useState<{
      summary: string;
      suggestions: { title: string; time: string; reason: string }[];
    } | null>(null),
    [added, setAdded] = useState<string[]>([]);
  const money = useMoney(),
    month = today.slice(0, 7),
    budgets = s.categories.map((c) => ({ ...c, ...budget(s, month, c.id) })),
    highest = [...budgets].sort(
      (a, b) =>
        (b.total ? b.spent / b.total : 0) - (a.total ? a.spent / a.total : 0),
    )[0],
    recent = Object.entries(s.days)
      .filter(([d]) => d <= today)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7),
    count = recent.reduce((a, [, d]) => a + d.items.length, 0),
    done = recent.reduce(
      (a, [, d]) => a + d.items.filter((c) => c.status === "done").length,
      0,
    ),
    unpaid = s.bills.filter((b) => !b.paid);
  const suggestions = [
    {
      title: "Review expenses for 5 minutes",
      time: "20:00",
      reason: "Keep your spending records up to date.",
    },
    {
      title: "Make one meal at home",
      time: "18:00",
      reason: "Stay within your food budget.",
    },
    {
      title: "Check bills and due dates",
      time: "09:00",
      reason: `Unpaid bills: ${unpaid.length}.`,
    },
  ];
  return (
    <>
      <Heading
        eyebrow="A THOUGHTFUL LITTLE COMPANION"
        title="A clearer picture."
        description="Review your spending and challenge habits, and find your next step."
        actions={
          <span className="pill green">
            <Sparkles size={14} /> Your everyday companion
          </span>
        }
      />
      <section className="insight-intro">
        <div>
          <span className="eyebrow">INSIGHTS FROM YOUR RECORDS</span>
          <h2>
            See your spending.
            <br />
            <em>Plan your next step.</em>
          </h2>
          <p>Review summaries from your records or ask AI for suggestions.</p>
        </div>
        <div className="insight-art">
          <div className="art-circle">
            <Sparkles size={42} />
          </div>
          <span className="floating-tag first">small wins ✳</span>
          <span className="floating-tag second">better habits ↗</span>
        </div>
      </section>
      <div className="three-grid insights-stat">
        <section className="card">
          <span className="stat-icon green">
            <Lightbulb size={19} />
          </span>
          <h3>Budget to watch: {highest.name}</h3>
          <p>
            {money(highest.spent)} of {money(highest.total)} spent.{" "}
            {money(highest.remaining)} remaining this month.
          </p>
        </section>
        <section className="card">
          <span className="stat-icon sand">
            <Target size={19} />
          </span>
          <h3>
            {count ? Math.round((done / count) * 100) : 0}% of challenges
            completed
          </h3>
          <p>
            {done} of {count} challenges over the last {recent.length} days with
            recorded challenges.
          </p>
        </section>
        <section className="card">
          <span className="stat-icon purple">
            <Receipt size={19} />
          </span>
          <h3>{money(unpaid.reduce((a, b) => a + b.amount, 0))} unpaid</h3>
          <p>
            {unpaid.length} unpaid bills. Set aside enough for upcoming
            payments.
          </p>
        </section>
      </div>
      <p className="fine-print section-note">
        These summaries are calculated from the records on this device.
      </p>
      <div className="two-grid align-start">
        <section className="card ai-panel">
          <div className="section-head">
            <div className="inline-heading">
              <Sparkles size={20} />
              <h2>Ask the AI companion</h2>
            </div>
            <span className="pill neutral">Gemini</span>
          </div>
          <p className="muted">
            Selecting Analyze with AI sends your budget summary, balances,
            bills, and challenge names and statuses to Google Gemini. You choose
            whether to add any suggestions.
          </p>
          <form
            className="form-stack"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              try {
                setResult(await askAI(s, today, apiKey, question));
                setAdded([]);
              } catch (e) {
                notify((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <label>
              <span className="inline-heading">
                <KeyRound size={14} /> Gemini API key
              </span>
              <input
                type="password"
                autoComplete="off"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your API key for this session"
                required
              />
            </label>
            <span className="fine-print">
              Your key stays in memory for this session. Model:{" "}
              {s.settings.aiModel} · <Link href="/settings/">Change model</Link>
            </span>
            <label>
              What would you like to understand?
              <textarea
                rows={4}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                required
                maxLength={1500}
              />
            </label>
            <button className="btn primary" disabled={busy}>
              <Sparkles size={16} />
              {busy ? "Analyzing…" : "Analyze with AI"}
            </button>
          </form>
          {result && (
            <div className="ai-result">
              <span className="eyebrow">AI RESPONSE</span>
              <p>{result.summary}</p>
              <span className="fine-print">
                Review AI suggestions before using them.
              </span>
            </div>
          )}
        </section>
        <section className="card">
          <div className="section-head">
            <div>
              <h2>
                {result ? "AI challenge suggestions" : "Suggested challenges"}
              </h2>
              <p>
                {result
                  ? "Add suggestions that fit your day."
                  : "These suggestions are available without connecting to Gemini."}
              </p>
            </div>
          </div>
          <div className="suggestions">
            {(result?.suggestions ?? suggestions).map((x, i) => (
              <div className="suggestion" key={i}>
                <span className="suggestion-no">0{i + 1}</span>
                <div>
                  <h3>{x.title}</h3>
                  <p>{x.reason}</p>
                  <span className="fine-print">Today · {x.time} · 15 min</span>
                </div>
                <button
                  className="icon-button"
                  disabled={added.includes(x.title)}
                  aria-label={"Add " + x.title}
                  onClick={async () => {
                    if (
                      await mutate(
                        (st) =>
                          addChallenge(st, today, x.title, x.time, 15, today),
                        "Suggestion added to today's challenges.",
                      )
                    )
                      setAdded((a) => [...a, x.title]);
                  }}
                >
                  {added.includes(x.title) ? (
                    <Check size={17} />
                  ) : (
                    <Plus size={18} />
                  )}
                </button>
              </div>
            ))}
          </div>
          <div className="subtle-note">
            <Target size={16} /> Choose a challenge that fits your schedule.
          </div>
        </section>
      </div>
    </>
  );
}
