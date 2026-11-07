// SNS で貼られたときの絵（og.png 1200×630）を作る。今日の問題（答え）は入れず、題と見本（武蔵→東京都）だけ。
// 使い方: node tools/make-og.cjs（qa/ の playwright を使う。ブラウザの場所は CHROMIUM_PATH で変えられる）
const path = require("path");
const { chromium } = require(path.join(__dirname, "..", "qa", "node_modules", "playwright"));
(async () => {
  const b = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  const card = (c, lines) => `<div style="background:#fff;border:8px solid ${c};border-radius:12px;min-width:200px;padding:0 24px;height:170px;box-sizing:border-box;display:flex;align-items:center;justify-content:center;font-family:'Noto Serif CJK JP','IPAPMincho',serif;font-size:40px;font-weight:900;line-height:1.4;letter-spacing:.08em;box-shadow:0 8px 0 #211c1626">${lines.join("<br>")}</div>`;
  await p.setContent(`<body style="margin:0;font-family:'Noto Sans CJK JP','IPAPGothic',sans-serif">
  <div style="position:relative;width:1200px;height:630px;background-color:#f2ecdf;background-image:repeating-linear-gradient(90deg,transparent 0 58px,#8a7d6822 58px 60px);color:#211c16;overflow:hidden">
    <div style="position:absolute;left:70px;top:70px">
      <div style="font-size:32px;color:#4f4639;letter-spacing:.06em">昔の国は今のどこ？ 1日5問</div>
      <div style="font-family:'Noto Serif CJK JP','IPAPMincho',serif;font-size:104px;font-weight:900;letter-spacing:.08em;line-height:1.25">旧国名<br><span style="color:#a83a1c">あて</span></div>
    </div>
    <div style="position:absolute;left:70px;bottom:62px;font-size:30px;color:#4f4639">68か国の読み・今の都道府県・五畿七道</div>
    <div style="position:absolute;right:80px;top:150px;display:flex;gap:40px;align-items:center">
      ${card("#a83a1c", ["武蔵"])}
      <div style="font-size:56px;color:#4f4639">→</div>
      ${card("#285d3c", ["東京都"])}
    </div>
  </div></body>`);
  await p.screenshot({ path: path.join(__dirname, "..", "og.png") });
  await b.close();
})();
