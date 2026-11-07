// 旧国名あて：昔の国の名前（令制国の68か国）と、読み・今の都道府県・五畿七道を結ぶ。国は data.js（tools/kuni.tsv から作る）。
(function (root) {
  "use strict";
  const RAW = root.KYUKOKU_KUNI || (typeof require === "function" ? require("./data.js") : null);
  const LV = ["やさしい", "ふつう", "むずかしい"];
  // 五畿七道（練習の組・国の帳の分け方）
  const AREAS = ["畿内", "東海道", "東山道", "北陸道", "山陰道", "山陽道", "南海道", "西海道"];
  const FU = { 東京: "東京都", 京都: "京都府", 大阪: "大阪府", 北海道: "北海道" };
  const prefName = (p) => FU[p] || p + "県";

  const KUNI = RAW.map((r, i) => ({ no: i + 1, nm: r[0], yomi: r[1][0], yomis: r[1], mi: r[2], ar: AREAS.indexOf(r[2]), prefs: r[3] }));
  const BY = {}; for (const k of KUNI) BY[k.no] = k;
  const IDS = KUNI.map((k) => k.no);
  const PREFS = [...new Set(KUNI.flatMap((k) => k.prefs))];

  // ---- 種から決まる乱数（だれでも同じ問題）----
  function seedOf(str) { let h = 2166136261; for (const ch of str) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function shuffled(arr, R) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  // ---- 問題：1か国ずつ、5つの形 ----
  // やさしい：p＝国 → 今の都道府県を4つから／d＝国 → 五畿七道を4つから
  // ふつう：k＝今の都道府県 → そこにあった国を4つから／w＝読み → 国の字を4つから
  // むずかしい：y＝国の字 → 読みを入力する
  const KIND = { p: 0, d: 0, k: 1, w: 1, y: 2 };
  const ORDER = ["p", "d", "k", "w", "y"];
  const QS = [], QBY = {}, POOL = [[], [], []];
  for (const kd of ORDER) for (const k of KUNI) { const id = kd + k.no, q = { id, lv: KIND[kd], kd, no: k.no }; QS.push(q); QBY[id] = q; POOL[q.lv].push(id); }

  // 同じ道のものを先に（近くの国でまよう）、足りなければほかから
  const nearFirst = (list, k, R) => { const s = shuffled(list, R); return [...s.filter((x) => x.ar === k.ar), ...s.filter((x) => x.ar !== k.ar)]; };
  // 選び肢（4つ）：問題の id から決まる（だれでも同じ）。文字の並び
  function optsOf(id) {
    const q = QBY[id]; if (q.kd === "y") return [];
    const k = BY[q.no], R = rng(seedOf("opt:" + id));
    let ans, pick;
    if (q.kd === "p") {
      // 正しいのはおもな所（はじめの都道府県）。この国にかかるほかの都道府県は選び肢に入れない
      ans = prefName(k.prefs[0]);
      const near = [...new Set(KUNI.filter((x) => x.ar === k.ar).flatMap((x) => x.prefs))].filter((p) => !k.prefs.includes(p));
      const far = PREFS.filter((p) => !k.prefs.includes(p) && !near.includes(p));
      pick = [...shuffled(near, R), ...shuffled(far, R)].slice(0, 3).map(prefName);
    } else if (q.kd === "d") {
      ans = k.mi; pick = shuffled(AREAS.filter((a) => a !== k.mi), R).slice(0, 3);
    } else if (q.kd === "k") {
      // 今のその都道府県にかからない国だけをまちがいにする
      ans = k.nm; pick = nearFirst(KUNI.filter((x) => !x.prefs.includes(k.prefs[0])), k, R).slice(0, 3).map((x) => x.nm);
    } else {
      // 同じ読みの国（安房と阿波は どちらも「あわ」）はまちがいに入れない
      ans = k.nm; pick = nearFirst(KUNI.filter((x) => x !== k && !x.yomis.some((y) => k.yomis.includes(y))), k, R).slice(0, 3).map((x) => x.nm);
    }
    return shuffled([ans, ...pick], R);
  }
  // 問いの文（画面の大きな字と、その上の小さな字）
  function ask(q) {
    const k = BY[q.no];
    if (q.kd === "p") return { big: k.nm, sub: "この国は、今のどこ？" };
    if (q.kd === "d") return { big: k.nm, sub: "五畿七道の、どこの国？" };
    if (q.kd === "k") return { big: prefName(k.prefs[0]), sub: "ここにあった国は？" };
    if (q.kd === "w") return { big: k.yomi, sub: "と読む国は？" };
    return { big: k.nm, sub: "この国の読みは？（ひらがなで入力）" };
  }
  // 1問：tag は「難しさ:問題の id|モードと日付…」
  function make(tag) {
    const m = String(tag).match(/^([012]):([a-z]\d+)\|/); if (!m || !QBY[m[2]] || QBY[m[2]].lv !== +m[1]) throw new Error("知らない問題 " + tag);
    const q = QBY[m[2]], k = BY[q.no], opts = optsOf(q.id), A = ask(q);
    const ans = q.kd === "y" ? -1 : opts.indexOf(q.kd === "p" ? prefName(k.prefs[0]) : q.kd === "d" ? k.mi : k.nm);
    return { tag, lv: q.lv, id: q.id, kd: q.kd, input: q.kd === "y", p: k, opts, ans, big: A.big, sub: A.sub };
  }
  // 入力の答え：全角・半角・カタカナ・空白をそろえて読みと比べる
  const norm = (s) => String(s || "").normalize("NFKC").replace(/[\s　・]/g, "").replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
  const okInput = (P, s) => P.p.yomis.includes(norm(s));
  // 入力のヒント（2回まで）：1回目は字数とはじめの字、2回目は半分の字
  function inputHint(P, n) {
    const y = [...P.p.yomi];
    if (n <= 1) return y.map((c, i) => (i === 0 ? c : "○")).join("");
    return y.map((c, i) => (i % 2 === 0 ? c : "○")).join("");
  }
  // 答えのあとに出す説明
  function facts(P) {
    const k = P.p, ps = k.prefs.map(prefName);
    const out = [`${k.nm}（${k.yomi}）　${k.mi}`];
    out.push(ps.length === 1 ? `今の${ps[0]}のあたり。` : `おもに今の${ps[0]}。${ps.slice(1).join("・")}にもかかる。`);
    const same = KUNI.filter((x) => x !== k && x.prefs[0] === k.prefs[0]);
    if (same.length) out.push(`${prefName(k.prefs[0])}には ほかに${same.map((x) => x.nm).join("・")}もあった。`);
    const sy = KUNI.filter((x) => x !== k && x.yomis.some((y) => k.yomis.includes(y)));
    if (sy.length) out.push(`${sy.map((x) => x.nm).join("・")}も「${k.yomi}」と読む。`);
    return out;
  }

  // ---- 今日の5問・上級（日本時間の日付から。だれでも同じ）----
  const DAY = 864e5, EPOCH = "2026-11-07";
  const dayMs = (k) => Date.parse(k + "T00:00:00Z");
  const keyOf = (ms) => new Date(ms).toISOString().slice(0, 10);
  const dayIdx = (k) => Math.max(0, Math.round((dayMs(k) - dayMs(EPOCH)) / DAY));
  const CYC = {};
  function cycle(name, lv, c) {
    const key = name + lv + ":" + c; if (CYC[key]) return CYC[key];
    let a = shuffled(POOL[lv], rng(seedOf(name + ":" + lv + ":" + c)));
    // 前の周の後ろ半分は、次の周の後ろ半分へ回す（周のつなぎ目で同じ問題がすぐ戻らない）
    if (c > 0) { const prev = cycle(name, lv, c - 1), tail = new Set(prev.slice(-Math.floor(prev.length / 2))); a = [...a.filter((id) => !tail.has(id)), ...a.filter((id) => tail.has(id))]; }
    return (CYC[key] = a);
  }
  const nth = (name, lv, idx) => cycle(name, lv, Math.floor(idx / POOL[lv].length))[idx % POOL[lv].length];
  const LVS = [0, 0, 1, 1, 2];
  // その日のほかの問題と、国が重ならない問題を選ぶ（重なる問題は次の日へ回す）。並びの問題は一度ずつ使う
  const evOf = (id) => [QBY[id].no];
  const SIM = {};
  function simDay(name, lvs, i, avoidOf) {
    const S = SIM[name] || (SIM[name] = { days: [], ptr: [0, 0, 0], wait: [[], [], []] });
    while (S.days.length <= i) {
      const d = S.days.length, used = new Set(avoidOf ? avoidOf(d).flatMap(evOf) : []), out = [];
      const free = (id) => evOf(id).every((e) => !used.has(e));
      for (const lv of lvs) {
        const w = S.wait[lv], wi = w.findIndex(free);
        let id = wi >= 0 ? w.splice(wi, 1)[0] : null;
        for (let g = 0; id == null; g++) { if (g > 4 * POOL[lv].length) throw new Error("問題を選べない"); const x = nth(name, lv, S.ptr[lv]++); if (free(x)) id = x; else w.push(x); }
        for (const e of evOf(id)) used.add(e); out.push([lv, id]);
      }
      S.days.push(out);
    }
    return S.days[i];
  }
  const dayPick = (i) => simDay("day", LVS, i);
  const hardPick = (i) => simDay("hard", [2, 2, 2], i, (d) => dayPick(d).map((o) => o[1]));
  const dailyTags = (k) => dayPick(dayIdx(k)).map(([lv, id]) => `${lv}:${id}|d${k}`);
  const hardTags = (k) => hardPick(dayIdx(k)).map(([lv, id]) => `${lv}:${id}|h${k}`);

  const API = { LV, AREAS, KUNI, BY, IDS, PREFS, QS, QBY, POOL, KIND, prefName, optsOf, ask, make, norm, okInput, inputHint, facts, seedOf, rng, shuffled, dailyTags, hardTags, dayIdx, EPOCH, dayMs, keyOf, evOf };
  if (typeof module === "object" && module.exports) module.exports = API;
  root.KYUKOKU = API;
})(typeof window !== "undefined" ? window : globalThis);
