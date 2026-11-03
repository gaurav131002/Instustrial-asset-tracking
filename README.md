# Industrial Asset Tracking and Management Platform

**Course:** Data Structures and Algorithms II (CCSE0301)  
**Project:** Industrial Asset Tracking and Management Platform  
**SDG:** SDG 9 — Industry, Innovation and Infrastructure  
**Type:** Individual college PBL prototype

## Why this project?

Manual tracking with spreadsheets and clipboards can make it difficult to find equipment, monitor maintenance schedules, and plan movement through factory zones. This prototype demonstrates how DSA concepts can support inventory lookup, maintenance prioritisation, factory-zone exploration, route planning, and constrained resource selection.

## Implemented features

- Asset registration, edit and delete with unique asset IDs
- Asset search and status filtering
- BST-backed asset ID indexing and in-order inventory display
- Maintenance priority queue implemented with a binary max-heap
- Factory network represented as a weighted adjacency-list graph
- BFS and DFS for zone exploration
- Dijkstra shortest path for selected start/destination zones
- Prim's and Kruskal's minimum spanning tree demonstrations
- 0/1 Knapsack dynamic programming for selecting spare-part/maintenance items within a budget
- Priority-based illustrative technician allocation
- CSV export
- Responsive multi-page dashboard UI with dedicated module pages
- Practical spare-parts inventory, procurement and consumption tracking
- Factory reports, filters, CSV exports and printable analytics

## Technology used

- HTML5
- CSS3
- Vanilla JavaScript
- Browser localStorage for prototype persistence

## Run locally

1. Open this folder in VS Code.
2. Right-click `index.html` and choose **Open with Live Server**.
3. Use the sidebar to open Assets, Maintenance, Factory Network, Spare Parts, Scheduling, Optimization, Advanced Structures and Reports.
4. The Dijkstra validation case is calculated by the algorithm: Receiving → Warehouse → Dispatch, cost 14. The Knapsack validation case calculates value 195 and cost 120 at capacity 120.

No Node.js or database is required for this frontend prototype.

## Data and model assumptions

- Seed asset records are sample/demo records.
- Factory zone edges and weights are illustrative values, not measured factory data.
- Browser `localStorage` is local to the browser profile. Data is not shared across devices/users.
- The prototype does not read real RFID, GPS, sensor or IoT feeds.
- The inventory is indexed with an ordinary BST. A self-balancing AVL tree is **not yet implemented**; a plain BST can degrade to O(n) in the worst case.
- Dijkstra uses a binary min-heap and skips stale queue entries.
- Scheduling uses a greedy graph-coloring algorithm; it is deterministic and prevents adjacent zones from sharing a slot.
- Branch and Bound uses fractional value-density upper bounds and reports explored/pruned states.
- Graph MST edges use demo costs and do not represent real construction costs.

## DSA mapping

| Concept | Feature | Complexity in this implementation |
|---|---|---|
| BST | ID index and in-order traversal | Average O(log n); worst O(n) |
| Binary max-heap | Maintenance urgency queue | Push/pop O(log n) |
| Adjacency list | Weighted factory graph | O(V + E) storage |
| BFS / DFS | Factory-zone exploration | O(V + E) |
| Dijkstra | Shortest route using min-priority queue | O((V + E) log V) |
| Prim | Minimum spanning tree | O(VE) in current simple implementation |
| Kruskal | Minimum spanning tree with sorting / disjoint sets | O(E log E) plus near-constant amortised DSU operations |
| 0/1 Knapsack DP | Select items under budget | O(nW) time and O(nW) space |
| Greedy priority allocation | Illustrative technician-task assignment | Sorting/heap dependent |

## Project pages

| Page | Responsibility |
|---|---|
| `index.html` | Dashboard and module navigation |
| `assets.html` | BST inventory with add, search, edit and delete |
| `maintenance.html` | Binary Max-Heap maintenance queue |
| `factory-network.html` | Adjacency list, BFS, DFS, Dijkstra, Prim and Kruskal |
| `spare-parts.html` | 0/1 Knapsack and DP table |
| `reports.html` | Factory inventory, maintenance, stock and cost reports |

## GitHub workflow

1. Review the Changes tab in GitHub Desktop or run `git status`.
2. Commit with a message such as `Create modular DSA dashboard`.
3. Push the branch to GitHub.
4. For GitHub Pages, publish the repository root as the site source; all pages use relative links and require no server.
