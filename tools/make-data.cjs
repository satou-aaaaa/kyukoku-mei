// tools/kuni.tsv（令制国の68か国）から data.js を作る。data.js は手で直さない。
// kuni.tsv の列：国名・読み（ほかの読みは / で続ける。はじめが主な読み）・五畿七道・今の都道府県（おもな所から・で並べる。都府県の字は付けない）
// 出典は Wikipedia「令制国一覧」「五畿七道」ほか（AGENTS.md・README.md）。
const fs = require("fs"), path = require("path");
const MICHI = ["畿内", "東海道", "東山道", "北陸道", "山陰道", "山陽道", "南海道", "西海道"];
const PREFS = ["北海道", "青森", "岩手", "宮城", "秋田", "山形", "福島", "茨城", "栃木", "群馬", "埼玉", "千葉", "東京", "神奈川", "新潟", "富山", "石川", "福井", "山梨", "長野", "岐阜", "静岡", "愛知", "三重", "滋賀", "京都", "大阪", "兵庫", "奈良", "和歌山", "鳥取", "島根", "岡山", "広島", "山口", "徳島", "香川", "愛媛", "高知", "福岡", "佐賀", "長崎", "熊本", "大分", "宮崎", "鹿児島", "沖縄"];
const rows = fs.readFileSync(path.join(__dirname, "kuni.tsv"), "utf8").replace(/\r/g, "").trim().split("\n").map((l) => l.split("\t"));
if (rows.length !== 68) throw new Error("68か国ではない：" + rows.length);
const seen = new Set();
const out = rows.map((r, i) => {
  if (r.length !== 4) throw new Error("形がちがう行 " + (i + 1));
  const [nm, yomi, mi, pf] = r, ys = yomi.split("/"), ps = pf.split("・");
  if (seen.has(nm)) throw new Error("同じ国が2つ " + nm); seen.add(nm);
  if (!ys.every((y) => /^[ぁ-ゖー]+$/.test(y))) throw new Error("読みがひらがなでない " + nm);
  if (!MICHI.includes(mi)) throw new Error("知らない道 " + nm + " " + mi);
  if (!ps.every((p) => PREFS.includes(p)) || new Set(ps).size !== ps.length) throw new Error("知らない都道府県 " + nm + " " + pf);
  return [nm, ys, mi, ps];
});
const js = "// tools/make-data.cjs で作る（手で直さない）。令制国の68か国：[国名, [読み…], 五畿七道, [今の都道府県…（おもな所から）]]\n" +
  "(function (root) {\n  const KUNI = [\n" + out.map((r) => "    " + JSON.stringify(r) + ",").join("\n") + "\n  ];\n" +
  "  if (typeof module === \"object\" && module.exports) module.exports = KUNI;\n  root.KYUKOKU_KUNI = KUNI;\n})(typeof window !== \"undefined\" ? window : globalThis);\n";
fs.writeFileSync(path.join(__dirname, "..", "data.js"), js);
console.log("data.js：" + out.length + "か国");
