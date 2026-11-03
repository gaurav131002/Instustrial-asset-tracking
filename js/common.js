const $ = id => document.getElementById(id);
const STORAGE_KEY = "indusTrackPblAssetsV2";
const zones = ["Receiving", "Warehouse", "Assembly", "Workshop", "Utilities", "Dispatch"];
const edges = [
  ["Receiving", "Warehouse", 4], ["Receiving", "Assembly", 7],
  ["Warehouse", "Assembly", 2], ["Warehouse", "Workshop", 6],
  ["Assembly", "Workshop", 3], ["Assembly", "Utilities", 8],
  ["Workshop", "Utilities", 2], ["Workshop", "Dispatch", 7],
  ["Utilities", "Dispatch", 3], ["Warehouse", "Dispatch", 10]
];
const spareParts = [
  { id: "SP-1001", name: "Bearing replacement kit", category: "Mechanical", assetId: "AST-1001", zone: "Assembly", quantity: 8, minimum: 3, unit: "kits", cost: 35, supplier: "Motion Supply Co.", contact: "Not Available", lastRestock: offsetDate(-18), value: 60 },
  { id: "SP-1002", name: "Hydraulic seal set", category: "Hydraulics", assetId: "AST-1001", zone: "Assembly", quantity: 2, minimum: 4, unit: "sets", cost: 25, supplier: "FluidTech", contact: "Not Available", lastRestock: offsetDate(-32), value: 45 },
  { id: "SP-1003", name: "Conveyor belt section", category: "Conveyor", assetId: "AST-1002", zone: "Warehouse", quantity: 0, minimum: 2, unit: "sections", cost: 55, supplier: "LineWorks", contact: "Not Available", lastRestock: offsetDate(-60), value: 85 },
  { id: "SP-1004", name: "Sensor calibration kit", category: "Electrical", assetId: "AST-1006", zone: "Receiving", quantity: 5, minimum: 2, unit: "kits", cost: 20, supplier: "SensorLab", contact: "Not Available", lastRestock: offsetDate(-10), value: 35 },
  { id: "SP-1005", name: "Motor service kit", category: "Mechanical", assetId: "AST-1003", zone: "Utilities", quantity: 3, minimum: 2, unit: "kits", cost: 45, supplier: "PowerParts", contact: "Not Available", lastRestock: offsetDate(-25), value: 75 }
];
function esc(value) { return String(value ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c])); }
function offsetDate(days) { const date = new Date(); date.setDate(date.getDate() + days); return date.toISOString().slice(0, 10); }
function fmtDate(value) { return value ? new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }) : "—"; }
function seedAssets() {
  return [
    { key: "a1", id: "AST-1001", name: "Hydraulic Press", category: "Press", location: "Assembly", status: "Operational", purchaseDate: "2023-02-10", lastService: offsetDate(-20), nextService: offsetDate(25) },
    { key: "a2", id: "AST-1002", name: "Conveyor Belt 02", category: "Conveyor", location: "Warehouse", status: "Maintenance", purchaseDate: "2022-05-04", lastService: offsetDate(-90), nextService: offsetDate(0) },
    { key: "a3", id: "AST-1003", name: "Industrial Pump", category: "Pump", location: "Utilities", status: "Repair", purchaseDate: "2021-08-19", lastService: offsetDate(-75), nextService: offsetDate(-3) },
    { key: "a4", id: "AST-1004", name: "CNC Machine", category: "CNC", location: "Workshop", status: "Operational", purchaseDate: "2023-01-15", lastService: offsetDate(-14), nextService: offsetDate(40) },
    { key: "a5", id: "AST-1005", name: "Packing Unit", category: "Packaging", location: "Dispatch", status: "Operational", purchaseDate: "2022-11-02", lastService: offsetDate(-35), nextService: offsetDate(12) },
    { key: "a6", id: "AST-1006", name: "Incoming Scanner", category: "Scanner", location: "Receiving", status: "Maintenance", purchaseDate: "2024-01-20", lastService: offsetDate(-100), nextService: offsetDate(2) }
  ];
}
function loadAssets() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || seedAssets(); } catch { return seedAssets(); } }
function saveAssets(assets) { localStorage.setItem(STORAGE_KEY, JSON.stringify(assets)); }
const PARTS_KEY = "indusTrackSparePartsV1";
const TRANSACTIONS_KEY = "indusTrackSpareTransactionsV1";
function loadSpareParts() { try { return JSON.parse(localStorage.getItem(PARTS_KEY)) || spareParts.map(part => ({ ...part })); } catch { return spareParts.map(part => ({ ...part })); } }
function saveSpareParts(parts) { localStorage.setItem(PARTS_KEY, JSON.stringify(parts)); }
function loadTransactions() { try { return JSON.parse(localStorage.getItem(TRANSACTIONS_KEY)) || []; } catch { return []; } }
function saveTransactions(items) { localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(items)); }
function stockStatus(part) { return part.quantity === 0 ? "Out of Stock" : part.quantity <= part.minimum ? "Low Stock" : "In Stock"; }
class BSTNode { constructor(asset) { this.asset = asset; this.left = null; this.right = null; } }
class AssetBST {
  constructor(items = []) { this.root = null; items.forEach(item => this.insert(item)); }
  insert(asset) { if (!this.root) { this.root = new BSTNode(asset); return; } let node = this.root; while (true) { const cmp = asset.id.localeCompare(node.asset.id); if (!cmp) { node.asset = asset; return; } if (cmp < 0) { if (!node.left) { node.left = new BSTNode(asset); return; } node = node.left; } else { if (!node.right) { node.right = new BSTNode(asset); return; } node = node.right; } } }
  search(id) { let node = this.root; while (node) { const cmp = id.localeCompare(node.asset.id); if (!cmp) return node.asset; node = cmp < 0 ? node.left : node.right; } return null; }
  inOrder(node = this.root, result = []) { if (!node) return result; this.inOrder(node.left, result); result.push(node.asset); return this.inOrder(node.right, result); }
  delete(id) { const remove = node => { if (!node) return null; const cmp = id.localeCompare(node.asset.id); if (cmp < 0) node.left = remove(node.left); else if (cmp > 0) node.right = remove(node.right); else { if (!node.left) return node.right; if (!node.right) return node.left; let successor = node.right; while (successor.left) successor = successor.left; node.asset = successor.asset; node.right = remove(node.right); } return node; }; this.root = remove(this.root); }
}
function adjacencyList() { const graph = new Map(zones.map(zone => [zone, []])); edges.forEach(([a, b, weight]) => { graph.get(a).push({ to: b, weight }); graph.get(b).push({ to: a, weight }); }); graph.forEach(list => list.sort((a, b) => a.to.localeCompare(b.to))); return graph; }
const graph = adjacencyList();
function bfs(start) { if (!graph.has(start)) return []; const seen = new Set([start]), queue = [start], order = []; while (queue.length) { const zone = queue.shift(); order.push(zone); graph.get(zone).forEach(({ to }) => { if (!seen.has(to)) { seen.add(to); queue.push(to); } }); } return order; }
function dfs(start) { if (!graph.has(start)) return []; const seen = new Set(), order = []; const visit = zone => { seen.add(zone); order.push(zone); graph.get(zone).forEach(({ to }) => { if (!seen.has(to)) visit(to); }); }; visit(start); return order; }
class MinHeap {
  constructor() { this.data = []; }
  push(item) { this.data.push(item); let i = this.data.length - 1; while (i > 0) { const parent = Math.floor((i - 1) / 2); if (this.data[parent].priority <= item.priority) break; this.data[i] = this.data[parent]; i = parent; } this.data[i] = item; }
  pop() { if (!this.data.length) return null; const result = this.data[0], last = this.data.pop(); if (this.data.length) { let i = 0; while (true) { const left = i * 2 + 1, right = left + 1; let smallest = i; if (left < this.data.length && this.data[left].priority < this.data[smallest].priority) smallest = left; if (right < this.data.length && this.data[right].priority < this.data[smallest].priority) smallest = right; if (smallest === i) break; this.data[i] = this.data[smallest]; i = smallest; } this.data[i] = last; } return result; }
  get size() { return this.data.length; }
}
function dijkstra(start, end) { if (!graph.has(start) || !graph.has(end)) return { path: [], distance: Infinity }; const distance = new Map(zones.map(zone => [zone, Infinity])), previous = new Map(), queue = new MinHeap(); distance.set(start, 0); queue.push({ zone: start, priority: 0 }); while (queue.size) { const current = queue.pop(); if (current.priority !== distance.get(current.zone)) continue; if (current.zone === end) break; graph.get(current.zone).forEach(({ to, weight }) => { const candidate = current.priority + weight; if (candidate < distance.get(to)) { distance.set(to, candidate); previous.set(to, current.zone); queue.push({ zone: to, priority: candidate }); } }); } if (!Number.isFinite(distance.get(end))) return { path: [], distance: Infinity }; const path = []; for (let zone = end; zone !== undefined; zone = previous.get(zone)) { path.unshift(zone); if (zone === start) break; } return { path, distance: distance.get(end) }; }
function prim(start) { const visited = new Set([start]), chosen = []; while (visited.size < zones.length) { let best = null; edges.forEach(edge => { const [a, b, weight] = edge; if (visited.has(a) !== visited.has(b) && (!best || weight < best[2])) best = edge; }); if (!best) break; chosen.push(best); visited.add(visited.has(best[0]) ? best[1] : best[0]); } return { chosen, total: chosen.reduce((sum, edge) => sum + edge[2], 0) }; }
function kruskal() { const parent = new Map(zones.map(zone => [zone, zone])), chosen = []; const find = zone => { while (parent.get(zone) !== zone) { parent.set(zone, parent.get(parent.get(zone))); zone = parent.get(zone); } return zone; }; edges.slice().sort((a, b) => a[2] - b[2]).forEach(edge => { const a = find(edge[0]), b = find(edge[1]); if (a !== b && chosen.length < zones.length - 1) { parent.set(a, b); chosen.push(edge); } }); return { chosen, total: chosen.reduce((sum, edge) => sum + edge[2], 0) }; }
function knapsack(capacity, items = spareParts) { const limit = Math.max(0, Math.floor(Number(capacity) || 0)), dp = Array.from({ length: items.length + 1 }, () => Array(limit + 1).fill(0)); for (let i = 1; i <= items.length; i++) for (let weight = 0; weight <= limit; weight++) dp[i][weight] = items[i - 1].cost <= weight ? Math.max(dp[i - 1][weight], items[i - 1].value + dp[i - 1][weight - items[i - 1].cost]) : dp[i - 1][weight]; const chosen = []; let weight = limit; for (let i = items.length; i > 0; i--) if (dp[i][weight] !== dp[i - 1][weight]) { chosen.unshift(items[i - 1]); weight -= items[i - 1].cost; } return { chosen, value: dp[items.length][limit], cost: chosen.reduce((sum, item) => sum + item.cost, 0), dp }; }
function renderShell(active, title, description) { document.body.innerHTML = `<aside class="sidebar"><a class="brand" href="index.html"><span class="brand-mark">IT</span><span><strong>IndusTrack</strong><small>INDUSTRIAL OPERATIONS</small></span></a><p class="nav-label">WORKSPACE</p><nav>${[["index.html","▦","Dashboard","index"],["assets.html","▣","Asset Management","assets"],["maintenance.html","◷","Maintenance","maintenance"],["factory-network.html","⌘","Factory Network","factory"],["spare-parts.html","⌁","Spare Parts","spare"],["reports.html","▤","Reports","reports"]].map(([href, icon, label, key]) => `<a class="nav-link ${key === active ? "active" : ""}" href="${href}">${icon}<span>${label}</span></a>`).join("")}</nav><div class="sidebar-bottom"><span class="live-dot"></span><strong>Prototype running</strong><small>Local browser storage · Demo data</small></div></aside><main class="main"><header class="topbar"><div><p class="eyebrow">INDUSTRIAL ASSET TRACKING & MANAGEMENT PLATFORM</p><h1>${esc(title)}</h1><p class="muted">${esc(description)}</p></div><a class="secondary back-link" href="index.html">Dashboard</a></header><div id="pageContent"></div><footer>Industrial Asset Tracking & Management Platform · DSA-II PBL · <span>${new Date().getFullYear()}</span><br><span class="footer-note">Vanilla HTML, CSS, JavaScript and localStorage · Educational prototype.</span></footer></main>`; }
function card(title, body, className = "panel") { return `<section class="${className}"><div class="panel-head"><div><h2>${title}</h2></div></div>${body}</section>`; }
