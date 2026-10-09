import Link from "next/link";
import { LandingMotion } from "@/components/landing/landing-motion";
import "./landing.css";

export default function Home() {
  return (
    <div className="lp">
      <header className="hdr" id="hdr">
        <div className="hdr-in">
          <a className="logo" href="#top">
            <i />
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

      <main id="top" className="wrap">
        {/* HERO */}
        <section className="hero" data-anim="hero">
          <div>
            <p className="eyebrow a-fade">
              Player-feedback triage for game teams · <b>AZ · RU · EN</b>
            </p>
            <h1 className="lines">
              <span className="ln">
                Telemetry knows <em>where.</em>
              </span>
              <span className="ln">
                Players know <em>why.</em>
              </span>
              <span className="ln l3">PlayerPulse settles it.</span>
            </h1>
            <p className="sub a-fade">
              It reads Discord, Steam reviews and in-game feedback in Azerbaijani, Russian and
              English, then checks every complaint against your gameplay telemetry.{" "}
              <b>You get the real bugs, ranked, with evidence and repro steps.</b>
            </p>
            <div className="ctas a-fade">
              <Link className="btn btn-p" href="/dashboard">
                Open live demo <span className="arr">→</span>
              </Link>
              <a className="btn btn-g" href="#results">
                See the results
              </a>
            </div>
          </div>

          <div className="console a-card" aria-label="Sample of PlayerPulse tagging messages">
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
                <span data-count="2946">2,946</span>
                <small>players lost</small>
              </div>
              <div className="trace">
                <svg
                  viewBox="0 0 320 64"
                  role="img"
                  aria-label="Completion dropped from 80% to 43% while deaths stayed flat"
                >
                  <path className="draw" d="M4 14 L150 14 L170 46 L316 46" stroke="#FF6B5A" strokeWidth="2" fill="none" />
                  <path className="draw" d="M4 58 L316 58" stroke="#4A524B" strokeWidth="1.5" fill="none" />
                  <text x="4" y="9" fontSize="9" fill="#9BA39A">
                    completion 80%
                  </text>
                  <text x="316" y="40" fontSize="9" fill="#FF6B5A" textAnchor="end">
                    43%
                  </text>
                  <text x="316" y="54" fontSize="9" fill="#9BA39A" textAnchor="end">
                    deaths 2.1 → 2.2
                  </text>
                </svg>
              </div>
            </div>
          </div>
        </section>
      </main>

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
      <section className="sec" id="verdicts" data-anim="files">
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
              <div className="big">
                <span data-count="2946">2,946</span>
                <small>players lost at this point</small>
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
              <div className="lvl">Thorn Canyon · level 3</div>
              <h3>“This level is impossible”</h3>
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
        <div className="wrap">
          <div className="sec-h a-fade">
            <h2>
              Measured against the <em>obvious</em> alternatives
            </h2>
            <span>vs keyword &amp; mention counting</span>
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
              Open live demo <span className="arr">→</span>
            </Link>
            <a className="btn btn-g" href="/api/docs">
              Read the docs
            </a>
          </div>
          <div className="honest">
            <span>
              Results on a synthetic test pack with planted issues; see <code>TESTING.md</code>.
            </span>
            <span>PlayerPulse</span>
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
