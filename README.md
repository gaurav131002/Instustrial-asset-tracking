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
- Responsive dashboard UI

## Technology used

- HTML5
- CSS3
- Vanilla JavaScript
- Browser localStorage for prototype persistence

## Run locally

1. Open this folder in VS Code.
2. Open `index.html` in a modern browser, or use the VS Code Live Server extension.
3. Try registering assets and running the graph/algorithm controls.

No Node.js or database is required for this frontend prototype.

## Data and model assumptions

- Seed asset records are sample/demo records.
- Factory zone edges and weights are illustrative values, not measured factory data.
- Browser `localStorage` is local to the browser profile. Data is not shared across devices/users.
- The prototype does not read real RFID, GPS, sensor or IoT feeds.
- The inventory is indexed with an ordinary BST. A self-balancing AVL tree is **not yet implemented**; a plain BST can degrade to O(n) in the worst case.
- Dijkstra is implemented with a simple minimum-distance scan, O(V² + E), rather than a priority queue optimisation.
- Technician allocation is a simple greedy priority demonstration, not a globally optimal scheduling solver.
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

## Next development milestones

1. Verify algorithms against hand-calculated test cases.
2. Add a proper AVL tree and deletion/search complexity demonstration if required by the final rubric.
3. Add PHP API and MySQL persistence if the project requires multi-user data.
4. Add login and roles, input validation, error handling and audit history.
5. Replace sample graph/weights with a documented factory layout.
6. Add test cases, screenshots, architecture diagrams and final report.

## GitHub Desktop workflow

1. Copy the project files into the root of the cloned repository.
2. Open GitHub Desktop and inspect the Changes tab.
3. Commit with a clear message such as `Implement DSA-based asset tracking prototype`.
4. Click Push origin.
5. Refresh the GitHub repository page and verify the files are visible.
