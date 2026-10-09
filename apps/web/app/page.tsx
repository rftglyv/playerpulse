import { BrandMark } from "@/components/brand-mark";
import Link from "next/link";
import { LandingMotion } from "@/components/landing/landing-motion";
import "./landing.css";

export default function Home() {
  return (
    <div className="lp">
      <header className="hdr" id="hdr">
        <div className="hdr-in">
          <a className="logo" href="#top">
            <BrandMark />
            PlayerPulse
          </a>
          <nav className="nav" aria-label="Main">
            <a href="#how">How it works</a>
            <a href="#results">Results</a>
            <a href="/api/docs">Docs</a>
          </nav>
          <Link className="btn btn-p" href="/dashboard">
            Open live demo
          </Link>
        </div>
      </header>

      <div className="hero-shell">
        <div className="hero-band" aria-hidden="true">
          <canvas className="dither" data-dither="horizon" />
        </div>
        <main id="top" className="wrap">
          {/* HERO */}
          <section className="hero" data-anim="hero">
            {/* sprinkled hand-drawn game doodles */}
            <div className="sprinkles" aria-hidden="true">
              <svg className="doodle ink sprinkle s-pad" viewBox="0 0 84 52">
                <path pathLength={1} strokeWidth="2" d="M22 8 C 10 8, 4 22, 4 34 C 4 46, 14 50, 20 42 C 24 36, 28 34, 42 34 C 56 34, 60 36, 64 42 C 70 50, 80 46, 80 34 C 80 22, 74 8, 62 8 C 52 8, 50 12, 42 12 C 34 12, 32 8, 22 8" />
                <path pathLength={1} strokeWidth="2" d="M20 18 L 20 30 M14 24 L 26 24" />
                <path pathLength={1} strokeWidth="2" d="M60 19 C 62 19, 62 22, 60 22 C 58 22, 58 19, 60 19 M66 25 C 68 25, 68 28, 66 28 C 64 28, 64 25, 66 25" />
              </svg>
              <svg className="doodle blu sprinkle s-star" viewBox="0 0 40 40">
                <path pathLength={1} strokeWidth="2" d="M20 4 L 24 15 L 36 16 L 27 24 L 30 36 L 20 29 L 10 36 L 13 24 L 4 16 L 16 15 Z" />
              </svg>
              <svg className="doodle ink sprinkle s-splash" viewBox="0 0 40 40">
                <path pathLength={1} strokeWidth="2" d="M20 4 L 20 12 M20 28 L 20 36 M4 20 L 12 20 M28 20 L 36 20 M8 8 L 13 13 M27 27 L 32 32 M32 8 L 27 13 M8 32 L 13 27" />
              </svg>
              <svg className="doodle blu sprinkle s-heart" viewBox="0 0 36 32">
                <path pathLength={1} strokeWidth="2" d="M6 4 L 12 4 L 12 8 L 16 8 L 16 4 L 22 4 M22 4 L 28 4 L 28 8 L 32 8 L 32 16 L 28 16 L 28 20 L 24 20 L 24 24 L 20 24 L 20 28 L 16 28 L 16 24 L 12 24 L 12 20 L 8 20 L 8 16 L 4 16 L 4 8 L 6 8 L 6 4" />
              </svg>
              <svg className="doodle ink sprinkle s-bubble" viewBox="0 0 52 44">
                <path pathLength={1} strokeWidth="2" d="M8 6 C 22 3, 38 3, 46 7 C 50 12, 50 24, 46 28 C 38 31, 26 31, 18 30 L 9 38 L 11 29 C 5 27, 3 20, 4 13 C 4 9, 5 7, 8 6" />
                <path pathLength={1} strokeWidth="2.4" d="M27 11 L 27 19 M27 23 L 27 24" />
              </svg>
              <svg className="doodle blu sprinkle s-coin" viewBox="0 0 36 36">
                <path pathLength={1} strokeWidth="2" d="M18 4 C 27 4, 32 10, 32 18 C 32 27, 26 32, 18 32 C 9 32, 4 26, 4 18 C 4 10, 10 4, 19 4" />
                <path pathLength={1} strokeWidth="2" d="M18 11 L 18 25" />
              </svg>
            </div>
            <div>
              <p className="eyebrow a-fade">
                Player-feedback triage for game teams
              </p>
              <h1 className="lines">
                <span className="ln">Player complaints in.</span>
                <span className="ln l3">
                  <span className="ul">
                    <em>Real bugs</em> out.
                    <svg className="doodle blu" viewBox="0 0 200 18" aria-hidden="true">
                      <path pathLength={1} strokeWidth="3" d="M3 10 C 38 5, 86 3, 128 6 C 160 8, 184 9, 197 5" />
                      <path pathLength={1} strokeWidth="2.2" d="M22 15 C 66 11, 118 11, 176 12" />
                    </svg>
                  </span>
                </span>
              </h1>
              <p className="sub a-fade">
                It reads Discord, Steam and in-game feedback, in any mix of languages, and checks it
                against your telemetry. <b>You get the real bugs, ranked, with evidence and repro steps.</b>
              </p>
              <div className="ctas a-fade">
                <Link className="btn btn-p" href="/dashboard">
                  Open live demo
                </Link>
                <a className="btn btn-g" href="#results">
                  See the results
                </a>
              </div>
            </div>

            <div className="console a-card" role="figure" aria-label="Sample of PlayerPulse tagging messages">
              <div className="console-h mono">
                <span>incoming · Ember Trail</span>
                <span className="tag">sample messages</span>
              </div>
              <ul className="feed">
                <li className="a-msg">
                  <span className="lang">AZ</span>
                  <span className="msg">ikinci körpüdən sonra daşın içindən düşürəm</span>
                  <span className="chip bug">bug · L4</span>
                </li>
                <li className="a-msg">
                  <span className="lang">RU</span>
                  <span className="msg">после второго моста проваливаюсь сквозь камень</span>
                  <span className="chip bug">bug · L4</span>
                </li>
                <li className="a-msg">
                  <span className="lang">MIX</span>
                  <span className="msg">Twin Bridges-da yenə düşdüm, текстура дырявая</span>
                  <span className="chip bug">bug · L4</span>
                </li>
                <li className="a-msg">
                  <span className="lang">EN</span>
                  <span className="msg">Thorn Canyon is impossible, fix it</span>
                  <span className="chip dif">too hard · L3</span>
                </li>
              </ul>
              <div className="resolve a-resolve">
                <span className="stamp v mini">VERIFIED · #1</span>
                <div className="t">
                  <b>Twin Bridges · level 4</b>
                  <br />
                  falls through the ledge after bridge 2
                </div>
                <div className="num">
                  <span className="circ">
                    <span data-count="2946">2,946</span>
                    <svg className="doodle ink" viewBox="0 0 220 90" preserveAspectRatio="none" aria-hidden="true">
                      <path
                        pathLength={1}
                        strokeWidth="2.4"
                        d="M156 9 C 96 1, 22 12, 10 42 C 0 72, 64 88, 128 84 C 192 80, 216 58, 208 34 C 200 13, 158 4, 104 8"
                      />
                    </svg>
                  </span>
                  <small>players lost</small>
                </div>
                <div className="trace">
                  <canvas className="dither" data-dither="cliff" aria-hidden="true" />
                  <svg
                    viewBox="0 0 320 64"
                    role="img"
                    aria-label="Completion dropped from 80% to 43% while deaths stayed flat"
                  >
                    <path className="draw" d="M4 14 L150 14 L170 46 L316 46" stroke="#B91C1C" strokeWidth="2" fill="none" />
                    <path
                      className="draw"
                      d="M4 58 L316 58"
                      stroke="rgba(0,0,0,.35)"
                      strokeWidth="1.5"
                      strokeDasharray="2 3"
                      fill="none"
                    />
                    <text x="4" y="9" fontSize="9" style={{ fontFamily: "var(--mono)" }} fill="rgba(0,0,0,.6)">
                      completion 80%
                    </text>
                    <text x="316" y="40" fontSize="9" style={{ fontFamily: "var(--mono)" }} fill="#B91C1C" textAnchor="end">
                      43%
                    </text>
                    <text x="316" y="54" fontSize="9" style={{ fontFamily: "var(--mono)" }} fill="rgba(0,0,0,.6)" textAnchor="end">
                      deaths 2.1 → 2.2
                    </text>
                  </svg>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* HOW IT WORKS */}
      <section className="sec" id="how" data-anim="how">
        <div className="wrap">
          <div className="sec-h a-fade">
            <h2>How it works</h2>
            <span>~30 s per run</span>
          </div>
          <ol className="steps">
            <li className="a-step">
              <span className="n">01 · Listen</span>
              <h3>Read every channel</h3>
              <p>Discord, Steam reviews and in-game reports, in Azerbaijani, Russian, English or a mix of them.</p>
            </li>
            <li className="a-step">
              <span className="n">02 · Verify</span>
              <h3>Check the telemetry</h3>
              <p>
                Each complaint is checked against that level&apos;s completion, deaths and crash data. “Too hard”
                needs the numbers to back it up.
              </p>
            </li>
            <li className="a-step">
              <span className="n">03 · Prioritise</span>
              <h3>Ship a ticket</h3>
              <p>Real bugs come out ranked by players lost, with evidence and repro steps inferred from the reports.</p>
            </li>
          </ol>
        </div>
      </section>

      {/* CASE FILES */}
      <section className="sec warm" id="verdicts" data-anim="files">
        <div className="wrap">
          <div className="sec-h a-fade">
            <h2>
              Two complaints, <em>two verdicts</em>
            </h2>
            <span>Ember Trail · scenario A</span>
          </div>
          <div className="files">
            <article className="file a-file">
              <span className="stamp v">VERIFIED · #1</span>
              <div className="lvl">Twin Bridges · level 4</div>
              <h3>Players fall through the stone ledge after the second bridge</h3>
              <div className="big-row">
                <div className="big">
                  <span data-count="2946">2,946</span>
                  <small>players lost at this point</small>
                </div>
                <svg className="doodle ink bridge" viewBox="0 0 140 92" aria-hidden="true">
                  <path pathLength={1} strokeWidth="2" d="M4 40 C 34 39, 66 41, 96 40" />
                  <path pathLength={1} strokeWidth="1.8" d="M6 40 Q 27 22 50 40 Q 72 23 94 40" />
                  <path pathLength={1} strokeWidth="1.6" d="M17 32 L 18 40 M38 32 L 37 40 M62 32 L 61 40 M83 32 L 84 40" />
                  <path pathLength={1} strokeWidth="2" d="M96 40 L 104 41 M120 40 L 136 39 L 133 50 L 121 48" />
                  <path pathLength={1} strokeWidth="1.8" d="M112 56 C 108 56, 107 62, 112 62 C 117 62, 116 56, 112 56" />
                  <path
                    pathLength={1}
                    strokeWidth="1.8"
                    d="M112 63 L 114 76 M104 64 C 108 67, 116 68, 121 66 M114 76 L 108 86 M114 76 L 121 84"
                  />
                  <path pathLength={1} strokeWidth="1.4" d="M101 50 L 102 58 M125 54 L 126 61" />
                </svg>
              </div>
              <dl className="ledger">
                <div>
                  <dt>Completion</dt>
                  <dd className="hot">80% → 43%</dd>
                </div>
                <div>
                  <dt>Deaths per player</dt>
                  <dd>2.1 → 2.2</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>ready to fix, repro attached</dd>
                </div>
              </dl>
            </article>
            <article className="file a-file">
              <span className="stamp d">DISMISSED</span>
              <svg className="doodle blu arrow" viewBox="0 0 58 40" aria-hidden="true">
                <path pathLength={1} strokeWidth="2" d="M4 36 C 18 36, 36 30, 47 9" />
                <path pathLength={1} strokeWidth="2" d="M38 11 L 48 7 L 51 18" />
              </svg>
              <div className="lvl">Thorn Canyon · level 3</div>
              <h3>
                “This level is{" "}
                <span className="x">
                  impossible
                  <svg className="doodle blu" viewBox="0 0 120 20" preserveAspectRatio="none" aria-hidden="true">
                    <path pathLength={1} strokeWidth="2.4" d="M2 12 C 30 8, 66 13, 118 6" />
                    <path pathLength={1} strokeWidth="2" d="M6 16 C 44 11, 82 14, 114 10" />
                  </svg>
                </span>
                ”
              </h3>
              <blockquote>A loud crowd in the threads. The telemetry shows nothing changed.</blockquote>
              <dl className="ledger">
                <div>
                  <dt>Completion</dt>
                  <dd>85% → 84%</dd>
                </div>
                <div>
                  <dt>Deaths per player</dt>
                  <dd>3.2 → 3.3</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>closed, evidence attached</dd>
                </div>
              </dl>
              <p className="verdict">Nothing changed. No ticket filed.</p>
            </article>
          </div>
          <p className="rule-note a-fade">
            Difficulty complaints are dismissed only with proof. <b>A technical bug is never dismissed.</b>
          </p>
        </div>
      </section>

      {/* RESULTS */}
      <section className="sec" id="results" data-anim="results">
        <div className="res-band" aria-hidden="true">
          <canvas className="dither" data-dither="fade" />
        </div>
        <div className="wrap">
          <div className="sec-h a-fade">
            <h2>
              Measured against the <em>obvious</em> alternatives
            </h2>
            <span>synthetic test pack · vs keyword &amp; mention counting</span>
          </div>
          <div className="score">
            <div className="a-score">
              <b>5 / 5</b>
              <span>planted issues found, 0 false alarms</span>
            </div>
            <div className="a-score">
              <b>100%</b>
              <span>message accuracy</span>
            </div>
            <div className="a-score">
              <b>4 / 4</b>
              <span>held-out scenario B, 0 false alarms, 98% accuracy</span>
            </div>
            <div className="a-score">
              <b>$0.21</b>
              <span>per 100 messages, ~30 s per run</span>
            </div>
          </div>
          <div className="cmp-wrap">
            <ComparePanel
              cap="Scenario A · higher is better"
              title="Message accuracy"
              rows={[
                { label: "PlayerPulse", value: "100%", width: "100%", us: true },
                { label: "Keyword baseline", value: "59%", width: "59%" },
                { label: "Mention baseline", value: "55%", width: "55%" },
              ]}
            />
            <ComparePanel
              cap="Scenario A · lower is better"
              title="“Too hard” complaints wrongly flagged"
              rows={[
                { label: "PlayerPulse", value: "0 / 23", width: "0%", us: true },
                { label: "Keyword baseline", value: "16 / 23", width: "69.6%" },
                { label: "Mention baseline", value: "13 / 23", width: "56.5%" },
              ]}
            />
          </div>
          <p className="extra a-fade">Top-3 priority order correct.</p>
        </div>
      </section>

      {/* FOOTER CTA */}
      <footer className="foot" data-anim="foot">
        <div className="wrap">
          <h2 className="a-fade">
            Stop guessing which complaints <em>are real.</em>
          </h2>
          <div className="ctas a-fade">
            <Link className="btn btn-p" href="/dashboard">
              Open live demo
            </Link>
            <a className="btn btn-g" href="/api/docs">
              Read the docs
            </a>
          </div>
          <div className="honest">
            <span>PlayerPulse</span>
            <span>Built by team EnthuZone</span>
          </div>
        </div>
      </footer>

      <LandingMotion />
    </div>
  );
}

type Row = { label: string; value: string; width: string; us?: boolean };

function ComparePanel({ cap, title, rows }: { cap: string; title: string; rows: Row[] }) {
  return (
    <div className="panel a-panel">
      <div className="cap">{cap}</div>
      <h3>{title}</h3>
      <div className="cmp">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="lbl">
              <span>{r.label}</span>
              {r.us ? <b>{r.value}</b> : <span className="v">{r.value}</span>}
            </div>
            <div className="tr">
              <div className={r.us ? "fl us" : "fl"} style={{ width: r.width }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
