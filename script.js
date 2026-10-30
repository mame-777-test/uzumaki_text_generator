const $ = id => document.getElementById(id);
let lastGrid = null, lastText = "";

function spiralCoordinates(n, direction, corner) {
  // 右上スタートの時計回りは「下→左→上→右」。
  // 他の開始位置・方向も、同じルールを回転して作る。
  const clockwise = [
    [1,0], [0,-1], [-1,0], [0,1]
  ];
  const counter = [
    [0,-1], [1,0], [0,1], [-1,0]
  ];
  const dirs = direction === "clockwise" ? clockwise : counter;
  const starts = {
    "top-right": [0,n-1],
    "bottom-right": [n-1,n-1],
    "bottom-left": [n-1,0],
    "top-left": [0,0]
  };
  // 開始角に応じた外周の進行方向
  const directionIndex = {
    "clockwise": {"top-right":0,"bottom-right":1,"bottom-left":2,"top-left":3},
    "counterclockwise": {"top-right":0,"top-left":1,"bottom-left":2,"bottom-right":3}
  };
  let [r,c] = starts[corner], d = directionIndex[direction][corner];
  const coords = [], used = new Set();
  for (let k=0; k<n*n; k++) {
    coords.push([r,c]); used.add(r*n+c);
    let nr=r+dirs[d][0], nc=c+dirs[d][1];
    if (nr<0 || nr>=n || nc<0 || nc>=n || used.has(nr*n+nc)) {
      d=(d+1)%4;
      nr=r+dirs[d][0]; nc=c+dirs[d][1];
    }
    r=nr; c=nc;
  }
  return coords;
}

function cleanChars(text) {
  return Array.from($("removeSpaces").checked ? text.replace(/\\s/gu,"") : text);
}
function gridText(grid) {
  return grid.map(row => row.map(ch => ch || "　").join(" ")).join("\\n");
}
function render(grid, message) {
  lastGrid=grid; lastText=gridText(grid);
  $("resultText").textContent=lastText;
  $("resultText").style.fontSize=`${Number($("cellSize").value)*.42}px`;
  $("status").textContent=message;
}
function encode() {
  const chars=cleanChars($("sourceText").value);
  if (!chars.length) { $("status").textContent="文章を入力してください。"; return; }
  const n=Math.ceil(Math.sqrt(chars.length));
  const grid=Array.from({length:n},()=>Array(n).fill(""));
  const coords=spiralCoordinates(n,$("direction").value,$("startCorner").value);
  chars.forEach((ch,i)=>{const [r,c]=coords[i];grid[r][c]=ch;});
  render(grid,`${chars.length}文字を ${n}×${n} マスに配置しました。`);
}
function decode() {
  const lines=$("sourceText").value.split(/\\r?\\n/).filter(x=>x.length);
  if (!lines.length) { $("status").textContent="渦巻き文字を入力してください。"; return; }
  const rows=lines.map(line=>line.includes(" ") ? line.split(" ").map(x=>x==="　"?"":x) : Array.from(line));
  const n=rows.length;
  if (rows.some(row=>row.length!==n)) {
    $("status").textContent="逆変換には、同じ行数・列数の正方形のマス目を貼り付けてください。";return;
  }
  const coords=spiralCoordinates(n,$("direction").value,$("startCorner").value);
  const decoded=coords.map(([r,c])=>rows[r][c]||"").join("");
  lastGrid=null;lastText=decoded;$("resultText").textContent=decoded;
  $("status").textContent=`${Array.from(decoded).length}文字に復元しました。`;
}
function clearAll() {
  $("sourceText").value="";$("resultText").textContent="ここに結果が表示されます。";
  $("status").textContent="クリアしました。";lastGrid=null;lastText="";
}
async function copyResult() {
  if (!lastText) return;
  try { await navigator.clipboard.writeText(lastText);$("status").textContent="結果をコピーしました。"; }
  catch { $("status").textContent="コピーできませんでした。ブラウザの権限を確認してください。"; }
}
function savePng() {
  if (!lastGrid) { $("status").textContent="先に渦巻きに変換してください。";return; }
  const cell=Number($("cellSize").value),pad=24,n=lastGrid.length;
  const canvas=document.createElement("canvas");canvas.width=canvas.height=pad*2+n*cell;
  const ctx=canvas.getContext("2d");ctx.fillStyle="#fff";ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.textAlign="center";ctx.textBaseline="middle";ctx.font=`${Math.floor(cell*.55)}px "Yu Gothic",Meiryo,sans-serif`;
  for(let r=0;r<n;r++)for(let c=0;c<n;c++){
    const x=pad+c*cell,y=pad+r*cell;
    if($("showGrid").checked){ctx.strokeStyle="#cbd2e3";ctx.strokeRect(x,y,cell,cell);}
    if(lastGrid[r][c]){ctx.fillStyle="#202536";ctx.fillText(lastGrid[r][c],x+cell/2,y+cell/2);}
  }
  const a=document.createElement("a");a.download="uzumaki-text.png";a.href=canvas.toDataURL("image/png");a.click();
  $("status").textContent="PNG画像を保存しました。";
}
$("encodeButton").addEventListener("click",encode);
$("decodeButton").addEventListener("click",decode);
$("clearButton").addEventListener("click",clearAll);
$("copyButton").addEventListener("click",copyResult);
$("pngButton").addEventListener("click",savePng);
$("cellSize").addEventListener("change",()=>{if(lastGrid)render(lastGrid,$("status").textContent);});
encode();