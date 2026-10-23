// Industrial Asset Tracking & Management Platform
// DSA-II PBL prototype: BST inventory, heap-based maintenance queue,
// adjacency-list graph, BFS, DFS, Dijkstra, Prim, Kruskal, and 0/1 Knapsack.
const $ = id => document.getElementById(id);
const STORAGE_KEY = "indusTrackPblAssetsV2";
const zones = ["Receiving", "Warehouse", "Assembly", "Workshop", "Utilities", "Dispatch"];
// Undirected weighted graph: [zone A, zone B, travel/connection cost].
const edges = [
  ["Receiving", "Warehouse", 4], ["Receiving", "Assembly", 7],
  ["Warehouse", "Assembly", 2], ["Warehouse", "Workshop", 6],
  ["Assembly", "Workshop", 3], ["Assembly", "Utilities", 8],
  ["Workshop", "Utilities", 2], ["Workshop", "Dispatch", 7],
  ["Utilities", "Dispatch", 3], ["Warehouse", "Dispatch", 10]
];
const spareParts = [
  { name: "Bearing replacement kit", cost: 35, value: 60 },
  { name: "Hydraulic seal set", cost: 25, value: 45 },
  { name: "Conveyor belt section", cost: 55, value: 85 },
  { name: "Sensor calibration kit", cost: 20, value: 35 },
  { name: "Motor service kit", cost: 45, value: 75 }
];
const today = new Date();
function offsetDate(days) { const d = new Date(); d.setDate(d.getDate() + days); return d.toISOString().slice(0, 10); }
function seedAssets() {
  return [
    { key: "a1", id: "AST-1001", name: "Hydraulic Press", location: "Assembly", status: "Operational", lastService: offsetDate(-20), nextService: offsetDate(25) },
    { key: "a2", id: "AST-1002", name: "Conveyor Belt 02", location: "Warehouse", status: "Maintenance", lastService: offsetDate(-90), nextService: offsetDate(0) },
    { key: "a3", id: "AST-1003", name: "Industrial Pump", location: "Utilities", status: "Repair", lastService: offsetDate(-75), nextService: offsetDate(-3) },
    { key: "a4", id: "AST-1004", name: "CNC Machine", location: "Workshop", status: "Operational", lastService: offsetDate(-14), nextService: offsetDate(40) },
    { key: "a5", id: "AST-1005", name: "Packing Unit", location: "Dispatch", status: "Operational", lastService: offsetDate(-35), nextService: offsetDate(12) },
    { key: "a6", id: "AST-1006", name: "Incoming Scanner", location: "Receiving", status: "Maintenance", lastService: offsetDate(-100), nextService: offsetDate(2) }
  ];
}
function loadAssets() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === null ? seedAssets() : JSON.parse(saved);
  } catch { return seedAssets(); }
}
let assets = loadAssets();
function persist() { localStorage.setItem(STORAGE_KEY, JSON.stringify(assets)); }
function esc(s) { return String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c])); }
function fmtDate(s) { return s ? new Date(`${s}T00:00:00`).toLocaleDateString(undefined, { day:"2-digit", month:"short", year:"numeric" }) : "—"; }
function dayDelta(s) { if (!s) return Infinity; return Math.round((new Date(`${s}T00:00:00`) - new Date(`${offsetDate(0)}T00:00:00`)) / 86400000); }

// A BST indexes asset records by unique asset ID. Average lookup/insert O(log n),
// worst case O(n); AVL balancing is a planned enhancement, not claimed as implemented.
class BSTNode {
  constructor(asset) { this.asset = asset; this.left = null; this.right = null; }
}
class AssetBST {
  constructor(items = []) { this.root = null; items.forEach(item => this.insert(item)); }
  insert(asset) {
    const node = new BSTNode(asset);
    if (!this.root) { this.root = node; return; }
    let cur = this.root;
    while (true) {
      if (asset.id.localeCompare(cur.asset.id) < 0) {
        if (!cur.left) { cur.left = node; return; } cur = cur.left;
      } else if (asset.id.localeCompare(cur.asset.id) > 0) {
        if (!cur.right) { cur.right = node; return; } cur = cur.right;
      } else { cur.asset = asset; return; }
    }
  }
  search(id) {
    let cur = this.root;
    while (cur) {
      const cmp = id.localeCompare(cur.asset.id);
      if (cmp === 0) return cur.asset;
      cur = cmp < 0 ? cur.left : cur.right;
    }
    return null;
  }
  inOrder() {
    const out = [];
    function walk(node) { if (!node) return; walk(node.left); out.push(node.asset); walk(node.right); }
    walk(this.root); return out;
  }
}
function adjacencyList() {
  const graph = new Map(zones.map(z => [z, []]));
  edges.forEach(([a,b,w]) => { graph.get(a).push({ to:b, weight:w }); graph.get(b).push({ to:a, weight:w }); });
  graph.forEach(list => list.sort((a,b) => a.to.localeCompare(b.to)));
  return graph;
}
const graph = adjacencyList();
function bfs(start) {
  const visited = new Set([start]), queue = [start], order = [];
  while (queue.length) {
    const u = queue.shift(); order.push(u);
    for (const {to} of graph.get(u)) if (!visited.has(to)) { visited.add(to); queue.push(to); }
  }
  return order;
}
function dfs(start) {
  const visited = new Set(), order = [];
  function visit(u) { visited.add(u); order.push(u); for (const {to} of graph.get(u)) if (!visited.has(to)) visit(to); }
  visit(start); return order;
}
// Min-priority queue used by Dijkstra. Lower distance values are popped first.
class MinPriorityQueue {
  constructor() { this.data = []; }
  push(item) {
    this.data.push(item);
    let i = this.data.length - 1;
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (this.data[parent].priority <= item.priority) break;
      this.data[i] = this.data[parent];
      i = parent;
    }
    this.data[i] = item;
  }
  pop() {
    if (!this.data.length) return null;
    const min = this.data[0];
    const last = this.data.pop();
    if (this.data.length) {
      let i = 0;
      while (true) {
        const left = 2 * i + 1, right = left + 1;
        let smallest = i;
        if (left < this.data.length && this.data[left].priority < this.data[smallest].priority) smallest = left;
        if (right < this.data.length && this.data[right].priority < this.data[smallest].priority) smallest = right;
        if (smallest === i) break;
        this.data[i] = this.data[smallest];
        i = smallest;
      }
      this.data[i] = last;
    }
    return min;
  }
  get size() { return this.data.length; }
}

// Dijkstra with an adjacency list and min-priority queue.
// For non-negative edge weights: O((V + E) log V) with a binary heap.
function dijkstra(start, end) {
  const dist = new Map(zones.map(z => [z, Infinity]));
  const prev = new Map();
  const pq = new MinPriorityQueue();
  dist.set(start, 0);
  pq.push({ zone: start, priority: 0 });

  while (pq.size) {
    const current = pq.pop();
    const u = current.zone;

    // Ignore stale queue entries after a better distance was discovered.
    if (current.priority !== dist.get(u)) continue;
    if (u === end) break;

    for (const { to, weight } of graph.get(u)) {
      const candidate = dist.get(u) + weight;
      if (candidate < dist.get(to)) {
        dist.set(to, candidate);
        prev.set(to, u);
        pq.push({ zone: to, priority: candidate });
      }
    }
  }

  if (dist.get(end) === Infinity) return { path: [], distance: Infinity };
  const path = [];
  let cur = end;
  while (cur !== undefined) {
    path.unshift(cur);
    if (cur === start) break;
    cur = prev.get(cur);
  }
  return { path, distance: dist.get(end) };
}
function kruskal() {
  const sorted = edges.slice().sort((a,b) => a[2]-b[2]);
  const parent = new Map(zones.map(z => [z,z]));
  function find(x) { while (parent.get(x) !== x) { parent.set(x,parent.get(parent.get(x))); x=parent.get(x); } return x; }
  const chosen = [];
  for (const edge of sorted) {
    const ra=find(edge[0]), rb=find(edge[1]);
    if (ra !== rb) { parent.set(ra,rb); chosen.push(edge); }
    if (chosen.length === zones.length - 1) break;
  }
  return { chosen, total: chosen.reduce((s,e)=>s+e[2],0) };
}
function prim(start) {
  const visited = new Set([start]), chosen = [];
  while (visited.size < zones.length) {
    let best = null;
    for (const edge of edges) {
      const [a,b,w] = edge;
      if (visited.has(a) !== visited.has(b) && (!best || w < best[2])) best = edge;
    }
    if (!best) break;
    chosen.push(best); visited.add(visited.has(best[0]) ? best[1] : best[0]);
  }
  return { chosen, total: chosen.reduce((s,e)=>s+e[2],0) };
}
// Max-heap: larger priority is popped first.
class MaxHeap {
  constructor(items = []) { this.data = []; items.forEach(x => this.push(x)); }
  push(item) { this.data.push(item); let i=this.data.length-1; while(i>0){const p=Math.floor((i-1)/2);if(this.data[p].priority>=item.priority)break;this.data[i]=this.data[p];i=p;}this.data[i]=item; }
  pop() { if(!this.data.length)return null; const top=this.data[0], last=this.data.pop(); if(this.data.length){let i=0;while(true){let l=i*2+1,r=l+1,b=i;if(l<this.data.length&&this.data[l].priority>this.data[b].priority)b=l;if(r<this.data.length&&this.data[r].priority>this.data[b].priority)b=r;if(b===i)break;this.data[i]=this.data[b];i=b;}this.data[i]=last;}return top; }
}
function urgency(asset) {
  const due = dayDelta(asset.nextService);
  const statusScore = asset.status === "Repair" ? 100 : asset.status === "Maintenance" ? 70 : asset.status === "Operational" ? 10 : 0;
  const dateScore = due < 0 ? 40 : due <= 2 ? 30 : due <= 7 ? 20 : due <= 30 ? 10 : 0;
  return asset.status === "Retired" ? 0 : statusScore + dateScore;
}
function maintenanceQueue() {
  const heap = new MaxHeap(assets.filter(a=>a.status!=="Retired").map(asset=>({asset,priority:urgency(asset)})));
  const out=[]; let item; while((item=heap.pop())) out.push(item); return out;
}
function knapsack(budget) {
  const items = spareParts, n = items.length, W = Math.max(0, Math.floor(budget));
  // Costs are integers in demo units. DP time O(nW), space O(nW).
  const dp = Array.from({length:n+1},()=>Array(W+1).fill(0));
  for(let i=1;i<=n;i++) for(let w=0;w<=W;w++) {
    dp[i][w]=dp[i-1][w];
    if(items[i-1].cost<=w) dp[i][w]=Math.max(dp[i][w],items[i-1].value+dp[i-1][w-items[i-1].cost]);
  }
  const chosen=[];let w=W;
  for(let i=n;i>0;i--) if(dp[i][w]!==dp[i-1][w]){chosen.push(items[i-1]);w-=items[i-1].cost;}
  chosen.reverse();
  return {chosen, value:dp[n][W], cost:chosen.reduce((s,x)=>s+x.cost,0)};
}
function allocateResources(count) {
  return maintenanceQueue().filter(x=>x.priority>0).slice(0,Math.max(1,Math.min(10,count)));
}

function renderStats() {
  $("totalAssets").textContent=assets.length;
  $("zoneCount").textContent=new Set([...zones,...assets.map(a=>a.location)]).size;
  $("attentionAssets").textContent=assets.filter(a=>["Maintenance","Repair"].includes(a.status)).length;
  $("operationalAssets").textContent=assets.filter(a=>a.status==="Operational").length;
}
function renderAssets() {
  const q=$("searchInput").value.trim().toLowerCase(), status=$("statusFilter").value, order=$("treeOrder").value;
  const bst=new AssetBST(assets);
  let list=order==="id"?bst.inOrder():assets.slice().sort((a,b)=>(order==="name"?a.name.localeCompare(b.name):a.location.localeCompare(b.location)));
  list=list.filter(a=>[a.id,a.name,a.location].some(v=>v.toLowerCase().includes(q))&&(status==="All"||a.status===status));
  $("assetTable").innerHTML=list.map(a=>`<tr><td><span class="asset-name">${esc(a.name)}</span><span class="asset-id">${esc(a.id)}</span></td><td>${esc(a.location)}</td><td><span class="status status-${esc(a.status)}">${esc(a.status)}</span></td><td>${fmtDate(a.lastService)}</td><td>${fmtDate(a.nextService)}</td><td><div class="actions"><button class="small-btn" data-edit="${esc(a.key)}">Edit</button><button class="small-btn delete" data-delete="${esc(a.key)}">Delete</button></div></td></tr>`).join("");
  $("emptyState").hidden=list.length>0;
}
function renderMaintenance() {
  const items=maintenanceQueue().filter(x=>x.priority>0).slice(0,5);
  $("maintenanceList").innerHTML=items.length?items.map((x,i)=>`<div class="queue-item"><span class="queue-rank">${i+1}</span><div><strong>${esc(x.asset.name)}</strong><small>${esc(x.asset.id)} · ${esc(x.asset.location)} · ${x.asset.nextService?`Service ${fmtDate(x.asset.nextService)}`:"No service date"}</small></div><span class="priority ${x.priority>=100?"high":""}">P${x.priority}</span></div>`).join(""):'<p class="muted">No maintenance tasks are currently flagged.</p>';
}
const coords={"Receiving":[12,38],"Warehouse":[35,18],"Assembly":[53,46],"Workshop":[72,24],"Utilities":[79,66],"Dispatch":[40,78]};
function renderGraph(highlight=[]) {
  const highlighted=new Set(highlight);
  const lines=edges.map(([a,b,w])=>{const [x1,y1]=coords[a],[x2,y2]=coords[b];const active=highlighted.has(a)&&highlighted.has(b);return `<line x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%" stroke="${active?"#16764b":"#b7c5ba"}" stroke-width="${active?3:1.7}"/><text x="${(x1+x2)/2}%" y="${(y1+y2)/2}%" class="edge-label">${w}</text>`;}).join("");
  const nodes=zones.map(z=>{const [x,y]=coords[z];return `<g><circle cx="${x}%" cy="${y}%" r="15" fill="${highlighted.has(z)?"#16764b":"#fff"}" stroke="#16764b" stroke-width="2"/><text x="${x}%" y="${y}%" class="node-letter" fill="${highlighted.has(z)?"#fff":"#16764b"}">${z.slice(0,1)}</text><text x="${x}%" y="${y+7}%" class="node-label">${z}</text></g>`;}).join("");
  $("graphView").innerHTML=`<svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Weighted factory graph">${lines}${nodes}</svg>`;
}
function fillZoneSelects() {
  for(const id of ["startZone","endZone"]) $(id).innerHTML=zones.map(z=>`<option>${z}</option>`).join("");
  $("startZone").value="Receiving";$("endZone").value="Dispatch";
}
function setGraphResult(html){$("graphResult").innerHTML=html;}
function renderAll(){renderStats();renderAssets();renderMaintenance();renderGraph();}

const dialog=$("assetDialog");
function openAdd(){ $("assetForm").reset();$("assetKey").value="";$("assetId").disabled=false;$("dialogTitle").textContent="Register asset";$("formError").textContent="";$("nextService").value=offsetDate(30);dialog.showModal(); }
function openEdit(key){const a=assets.find(x=>x.key===key);if(!a)return;$("assetForm").reset();$("assetKey").value=a.key;$("assetName").value=a.name;$("assetId").value=a.id;$("assetId").disabled=true;$("assetLocation").value=a.location;$("assetStatus").value=a.status;$("lastService").value=a.lastService||"";$("nextService").value=a.nextService||"";$("dialogTitle").textContent="Edit asset";$("formError").textContent="";dialog.showModal();}
$("addAssetTop").addEventListener("click",openAdd);$("addAssetEmpty").addEventListener("click",openAdd);
$("closeDialog").addEventListener("click",()=>dialog.close());$("cancelDialog").addEventListener("click",()=>dialog.close());
$("searchInput").addEventListener("input",renderAssets);$("statusFilter").addEventListener("change",renderAssets);$("treeOrder").addEventListener("change",renderAssets);
$("assetTable").addEventListener("click",e=>{
  const edit=e.target.closest("[data-edit]"), del=e.target.closest("[data-delete]");
  if(edit)openEdit(edit.dataset.edit);
  if(del){const a=assets.find(x=>x.key===del.dataset.delete);if(a&&confirm(`Delete ${a.name} (${a.id})?`)){assets=assets.filter(x=>x.key!==a.key);persist();renderAll();}}
});
$("assetForm").addEventListener("submit",e=>{
  e.preventDefault();const key=$("assetKey").value,id=$("assetId").value.trim();
  if(assets.some(a=>a.id.toLowerCase()===id.toLowerCase()&&a.key!==key)){$("formError").textContent="Asset ID must be unique.";return;}
  const location=$("assetLocation").value.trim();
  if(!zones.includes(location)){if(!confirm(`"${location}" is not one of the demo graph zones. Save it as a new asset location anyway? It will not automatically be connected to the factory graph.`))return;}
  const record={key:key||crypto.randomUUID(),id,name:$("assetName").value.trim(),location,status:$("assetStatus").value,lastService:$("lastService").value,nextService:$("nextService").value};
  assets=key?assets.map(a=>a.key===key?record:a):[record,...assets];persist();renderAll();dialog.close();
});
$("exportBtn").addEventListener("click",()=>{
  const rows=[["Asset ID","Asset Name","Zone","Status","Last Service","Next Service"],...assets.map(a=>[a.id,a.name,a.location,a.status,a.lastService,a.nextService])];
  const csv=rows.map(row=>row.map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(",")).join("\r\n");
  const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));const a=document.createElement("a");a.href=url;a.download="industrial-assets.csv";a.click();URL.revokeObjectURL(url);
});
$("bfsBtn").addEventListener("click",()=>{const start=$("startZone").value,order=bfs(start);renderGraph(order);setGraphResult(`<strong>BFS order from ${esc(start)}:</strong><br>${order.map(esc).join(" → ")}<br><small>Visits adjacent zones level by level. Complexity: O(V + E).</small>`);});
$("dfsBtn").addEventListener("click",()=>{const start=$("startZone").value,order=dfs(start);renderGraph(order);setGraphResult(`<strong>DFS order from ${esc(start)}:</strong><br>${order.map(esc).join(" → ")}<br><small>Explores a branch deeply before backtracking. Complexity: O(V + E).</small>`);});
$("dijkstraBtn").addEventListener("click",()=>{const start=$("startZone").value,end=$("endZone").value,result=dijkstra(start,end);renderGraph(result.path);setGraphResult(`<strong>Shortest route:</strong> ${result.path.map(esc).join(" → ")}<br><strong>Total demo cost:</strong> ${result.distance}<br><small>Dijkstra’s algorithm; edge weights are illustrative travel/connection costs.</small>`);});
$("primBtn").addEventListener("click",()=>{const r=prim("Receiving");renderGraph(r.chosen.flatMap(e=>[e[0],e[1]]));$("mstResult").innerHTML=`<strong>Prim’s MST cost: ${r.total}</strong><br>${r.chosen.map(e=>`${esc(e[0])} — ${esc(e[1])} (${e[2]})`).join("<br>")}<br><small>Complexity for this implementation: O(VE).</small>`;});
$("kruskalBtn").addEventListener("click",()=>{const r=kruskal();renderGraph(r.chosen.flatMap(e=>[e[0],e[1]]));$("mstResult").innerHTML=`<strong>Kruskal’s MST cost: ${r.total}</strong><br>${r.chosen.map(e=>`${esc(e[0])} — ${esc(e[1])} (${e[2]})`).join("<br>")}<br><small>Sort edges, then use disjoint sets to avoid cycles.</small>`;});
$("knapsackBtn").addEventListener("click",()=>{const budget=Number($("budgetInput").value);if(!Number.isFinite(budget)||budget<0){$("knapsackResult").textContent="Enter a valid non-negative budget.";return;}const r=knapsack(budget);$("knapsackResult").innerHTML=`<strong>Selected value: ${r.value}</strong><br>Budget used: ${r.cost} / ${Math.floor(budget)}<br>${r.chosen.length?r.chosen.map(x=>`${esc(x.name)} — cost ${x.cost}, value ${x.value}`).join("<br>"):"No item fits this budget."}<br><small>0/1 Knapsack DP: O(nW).</small>`;});
$("allocateBtn").addEventListener("click",()=>{const n=Number($("technicianInput").value);if(!Number.isInteger(n)||n<1||n>10){$("allocationResult").textContent="Choose 1–10 technicians.";return;}const tasks=allocateResources(n);$("allocationResult").innerHTML=tasks.length?`<strong>Illustrative allocation (${Math.min(n,tasks.length)} technicians)</strong><br>${tasks.map((x,i)=>`Technician ${i+1} → ${esc(x.asset.name)} (priority ${x.priority})`).join("<br>")}<br><small>Greedy priority-based example, not a full optimal scheduling solver.</small>`:"No active maintenance tasks to allocate.";});
$("year").textContent=new Date().getFullYear();
fillZoneSelects();renderAll();
