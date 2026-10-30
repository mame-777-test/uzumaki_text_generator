
const $ = id => document.getElementById(id);

let lastGrid = null;
let lastText = "";

// 入力文章を文字配列に変換
function cleanChars(text) {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  if ($("removeSpaces").checked) {
    return Array.from(normalized.replace(/[^\S\n]/gu, ""));
  }

  return Array.from(normalized);
}

// 改行を表示用の記号に変換
function displayChar(ch) {
  return ch === "\n" ? "↵" : ch;
}

// 渦巻きの座標を作成
function spiralCoordinates(n, direction, corner) {
  const clockwise = [
    [1, 0], [0, -1], [-1, 0], [0, 1]
  ];

  const counter = [
    [0, -1], [1, 0], [0, 1], [-1, 0]
  ];

  const dirs = direction === "clockwise"
    ? clockwise
    : counter;

  const starts = {
    "top-right": [0, n - 1],
    "bottom-right": [n - 1, n - 1],
    "bottom-left": [n - 1, 0],
    "top-left": [0, 0]
  };

  const directionIndex = {
    clockwise: {
      "top-right": 0,
      "bottom-right": 1,
      "bottom-left": 2,
      "top-left": 3
    },
    counterclockwise: {
      "top-right": 0,
      "top-left": 1,
      "bottom-left": 2,
      "bottom-right": 3
    }
  };

  let [r, c] = starts[corner];
  let d = directionIndex[direction][corner];

  const coords = [];
  const used = new Set();

  for (let k = 0; k < n * n; k++) {
    coords.push([r, c]);
    used.add(r * n + c);

    let nr = r + dirs[d][0];
    let nc = c + dirs[d][1];

    if (
      nr < 0 || nr >= n ||
      nc < 0 || nc >= n ||
      used.has(nr * n + nc)
    ) {
      d = (d + 1) % 4;
      nr = r + dirs[d][0];
      nc = c + dirs[d][1];
    }

    r = nr;
    c = nc;
  }

  return coords;
}

// グリッドを文字列に変換
function gridText(grid) {
  return grid
    .map(row =>
      row.map(ch => ch || "　").join(" ")
    )
    .join("\n");
}

// 結果を表示
function render(grid, message) {
  lastGrid = grid;
  lastText = gridText(grid);

  $("resultText").textContent = lastText;

  $("resultText").style.fontSize =
    `${Number($("cellSize").value) * 0.42}px`;

  $("status").textContent = message;
}

// 渦巻き変換
function encode() {
  const chars = cleanChars($("sourceText").value);

  if (!chars.length) {
    $("status").textContent = "文章を入力してください。";
    return;
  }

  const n = Math.ceil(Math.sqrt(chars.length));

  const grid = Array.from(
    { length: n },
    () => Array(n).fill("")
  );

  const coords = spiralCoordinates(
    n,
    $("direction").value,
    $("startCorner").value
  );

  chars.forEach((ch, i) => {
    const [r, c] = coords[i];
    grid[r][c] = ch;
  });

  render(
    grid,
    `${chars.length}文字を ${n}×${n} マスに配置しました。`
  );
}

// 渦巻き文字を元に戻す
function decode() {
  const lines = $("sourceText").value.split(/\r?\n/);

  if (!lines.length) {
    $("status").textContent = "渦巻き文字を入力してください。";
    return;
  }

  const rows = lines.map(line =>
    line.includes(" ")
      ? line.split(" ").map(ch => ch === "↵" ? "\n" : ch)
      : Array.from(line).map(ch => ch === "↵" ? "\n" : ch)
  );

  const n = rows.length;

  if (rows.some(row => row.length !== n)) {
    $("status").textContent =
      "正方形のマス目を入力してください。";
    return;
  }

  const coords = spiralCoordinates(
    n,
    $("direction").value,
    $("startCorner").value
  );

  const decoded = coords
    .map(([r, c]) => rows[r][c] || "")
    .join("");

  lastGrid = null;
  lastText = decoded;

  $("resultText").textContent = decoded;
  $("status").textContent =
    `${Array.from(decoded).length}文字に復元しました。`;
}

// クリア
function clearAll() {
  $("sourceText").value = "";
  $("resultText").textContent =
    "ここに結果が表示されます。";

  $("status").textContent = "クリアしました。";

  lastGrid = null;
  lastText = "";
}

// コピー
async function copyResult() {
  if (!lastText) return;

  try {
    await navigator.clipboard.writeText(lastText);
    $("status").textContent = "結果をコピーしました。";
  } catch {
    $("status").textContent =
      "コピーできませんでした。";
  }
}

// PNG保存
function savePng() {
  if (!lastGrid) {
    $("status").textContent =
      "先に渦巻きに変換してください。";
    return;
  }

  const cell = Number($("cellSize").value);
  const pad = 24;
  const n = lastGrid.length;

  const canvas = document.createElement("canvas");

  canvas.width = canvas.height = pad * 2 + n * cell;

  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.font =
    `${Math.floor(cell * 0.55)}px "Yu Gothic", Meiryo, sans-serif`;

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const x = pad + c * cell;
      const y = pad + r * cell;

      if ($("showGrid").checked) {
        ctx.strokeStyle = "#cbd2e3";
        ctx.strokeRect(x, y, cell, cell);
      }

      if (lastGrid[r][c]) {
        ctx.fillStyle = "#202536";

        ctx.fillText(
          displayChar(lastGrid[r][c]),
          x + cell / 2,
          y + cell / 2
        );
      }
    }
  }

  const a = document.createElement("a");

  a.download = "uzumaki-text.png";
  a.href = canvas.toDataURL("image/png");
  a.click();

  $("status").textContent = "PNG画像を保存しました。";
}

// ボタンのイベント
$("encodeButton").addEventListener("click", encode);
$("decodeButton").addEventListener("click", decode);
$("clearButton").addEventListener("click", clearAll);
$("copyButton").addEventListener("click", copyResult);
$("pngButton").addEventListener("click", savePng);

$("cellSize").addEventListener("change", () => {
  if (lastGrid) {
    render(lastGrid, $("status").textContent);
  }
});

// 初期表示
encode();
