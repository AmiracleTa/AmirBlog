---
title: XCPC 模板
date: 2025-10-21 15:12:43
# updated: 2025-12-08 13:59:55
# updated: 2025-12-13 23:34:09
# updated: 2025-12-16 00:00:00
# updated: 2025-12-18 00:00:00
# updated: 2026-02-09 00:00:00
# updated: 2026-02-10 00:00:00
# updated: 2026-03-03 10:25:00
# updated: 2026-04-21 17:31:26
# updated: 2026-07-11 21:02:05
# updated: 2026-07-20 22:27:21
updated: 2026-07-24 00:06:47

tags:
  - XCPC
  - ACM整理总结
categories: XCPC
cover: https://cdn.amiracle.site/Nekoha%20Shizuku.png
sticky: true
---

{% note info modern %}
*基于 [WIDA XCPC 模板](https://github.com/hh2048/XCPC)，在此基础上对其补充和优化*
{% endnote %}

<!--

1. 清空
2. 边界条件
3. 读题
4. 先独立思考

-->

## 图论

### LCA 最近公共祖先

#### 倍增 LCA

```cpp
    vector<int> dep(n + 1), p(n + 1);
    auto dfs1 = [&](auto&& self, int fa, int u) ->void {
        dep[u] = dep[fa] + 1;
        p[u] = fa;
        for(int v : gra[u]) if(v != fa) {
            self(self, u, v);
        }
    };
    dfs1(dfs1, 0, S);

    int MX = __lg(2*n - 1);
    vector<vector<int>> st(n + 1, vector<int>(MX + 1));
    for(int i=1; i<=n; i++) st[i][0] = p[i];
    for(int j=1; j<=MX; j++){
        for(int i=1; i<=n; i++){
            st[i][j] = st[st[i][j-1]][j-1];
        }
    }
    
    auto lca = [&](int x, int y){
        if(dep[x] > dep[y]) swap(x, y);
        for(int j=MX; j>=0; j--){
            if(dep[st[y][j]] < dep[x]) continue;
            y = st[y][j];
        }

        if(x == y) return x; // 特判 x, y 在 1 条链

        for(int j=MX; j>=0; j--){
            if(st[x][j] == st[y][j]) continue;
            x = st[x][j];
            y = st[y][j];
        }
        return p[x];
    };
```

#### HLD LCA

```cpp
    // top 链顶点 , p 直接父亲
    vector<int> siz(n + 1), dep(n + 1), top(n + 1), p(n + 1);
    auto dfs1 = [&](auto&& self, int fa, int u) ->void { 
        p[u] = fa;
        siz[u] = 1;
        for(int v : gra[u]) if(v != fa) {
            dep[v] = dep[u] + 1;
            self(self, u, v);
            siz[u] += siz[v];
        }
    };
    dfs1(dfs1, 0, S);

    // get top
    auto dfs2 = [&](auto&& self, int fa, int u, int t) ->void {
        top[u] = t;
        int son = 0;
        for(int v : gra[u]) if(v != fa) {
            if(siz[v] > siz[son]){
                son = v;
            }
        }

        if(!son) return;

        self(self, u, son, t);
        for(int v : gra[u]) if(v != fa && v != son){
            self(self, u, v, v);
        }
    };
    dfs2(dfs2, 0, S, S);

    auto lca = [&](int x, int y){
        while(top[x] != top[y]){
            if(dep[top[x]] > dep[top[y]]) swap(x, y);
            y = p[top[y]];
        }
        if(dep[x] > dep[y]) swap(x, y); 
        return x;
    };
```

#### Tarjan 离线 O(1)

```cpp
void solve(){
    vector<vector<pii>> query(n + 1);
    for(int i=1; i<=q; i++){
        int u, v;
        cin >> u >> v;
        query[u].push_back({v, i});
        query[v].push_back({u, i});
    }

    vector<int> ans(q + 1);
    vector<bool> vis(n + 1);
    auto tarjan = [&](auto&& self, int u) -> void {
        vis[u] = true;
        for(int v : gra[u]) if(!vis[v]) {
            self(self, v);
            dsu.merge(u, v);
        }
        for(auto [v, id] : query[u]) if(vis[v]) {
            ans[id] = dsu.find(v);
        }
    };
    tarjan(tarjan, r); // r 为根

    for(int i=1; i<=q; i++){
        cout << ans[i] << '\n';
    }
}
```

### 负权图最短路 (判负环)

#### Bellman-Ford **$O(n \cdot m)$**

```cpp
constexpr ll inf = 3e18;

void solve(){
    int n, m;
    cin >> n >> m;
    vector<vector<pii>> gra(n + 1);
    for(int i=1; i<=m; i++){
        int u, v, w;
        cin >> u >> v >> w;
        gra[u].push_back({v, w});
    }

    vector<ll> dis(n + 1); // 判全图负环
    for(int k=0; k<n-1; k++){ // 尝试 n - 1 轮松弛
        for(int i=1; i<=n; i++){
            for(auto [v, w] : gra[i]){
                dis[v] = min(dis[v], dis[i] + w);
            }
        }
    }

    bool neg = false; // 额外跑一轮 // neg 为 ture 则存在负环
    for(int i=1; i<=n; i++){
        for(auto [v, w] : gra[i]){
            neg |= dis[i]+w < dis[v];
        }
    }
}
```

#### SPFA **$O(k \cdot m)$**

```cpp
constexpr ll inf = 3e18;

void solve(){
    bool neg = false;
    int s = 1; // 判断是否存在从 s 出发能到达的负环, 将所有点入队可判断整图负环
    vector<bool> inq(n + 1);
    vector<int> cnt(n + 1);
    vector<ll> dis(n + 1, inf);
    dis[s] = 0, inq[s] = true;
    queue<int> q;
    q.push(s);
    while(!q.empty() && !neg){
        int u = q.front(); q.pop();
        inq[u] = false;
        for(auto [v, w] : gra[u]){
            if(dis[u] + w < dis[v]){
                dis[v] = dis[u] + w;
                cnt[v] = cnt[u] + 1;

                if(!inq[v]) q.push(v), inq[v]=true;

                if(cnt[v] >= n){
                    neg = true;
                    break;
                }
            }
        }
    }
}
```

### Tarjan 求连通分量

#### 强连通分量 SCC (有向图)

strongly connected component

缩点

```cpp
struct SCC {
    int n, ccol, cdfn;
    vector<vector<int>> gra;
    vector<int> dfn, low, col, stk;

    #define cmin(x, y) x = min(x, y)

    void init(int n_, auto& gr){
        n = n_; gra = gr;
        ccol = cdfn = 0;
        dfn = low = col = vector<int>(n + 1);
        stk.clear();
    }
    void tarjan(int u){
        dfn[u] = low[u] = ++cdfn;
        stk.push_back(u);
        for(int v : gra[u]){
            if(!dfn[v]){ // 树边
                tarjan(v);
                cmin(low[u], low[v]);
            }
            else if(!col[v]){ // 栈内横叉边 & 返祖边
                cmin(low[u], dfn[v]);
            }
        }
        if(dfn[u] == low[u]){ // root
            ccol++;
            while(true){
                int x = stk.back(); stk.pop_back();
                col[x] = ccol;
                if(x == u) break;
            }
        }
    }
    void work(){ // SCC 染色
        for(int i=1; i<=n; i++){
            if(!dfn[i]){
                tarjan(i);
            }
        }
    }
    auto rebuild(){ // 缩点
        work();
        vector<vector<int>> ngra(ccol + 1);
        for(int i=1; i<=n; i++){
            for(int v : gra[i]){
                if(col[i] != col[v]){
                    ngra[col[i]].push_back(col[v]);
                }
            }
        }
        return ngra;
    }
};
```

#### 点双连通分量 VDCC (无向图)

vetex double connected component

点双个数 & 每个点双的节点

```cpp
struct VDCC {
    int n, ccol, cdfn; // .. , VDCC 个数 , ..
    vector<vector<int>> gra, col; // 原图 , VDCC
    vector<int> dfn, low, stk;
    vector<bool> point; // 割点

    #define cmin(x, y) x = min(x, y)

    void init(int n_, auto& gr){ // gr 不能有自环
        n = n_; gra = gr;
        ccol = cdfn = 0;
        dfn = low = vector<int>(n + 1);
        col = vector<vector<int>>(n + 1);
        stk.clear();
        point = vector<bool>(n + 1);
    }
    void tarjan(int root, int u){
        dfn[u] = low[u] = ++cdfn;

        if(u == root && gra[u].empty()){ // 特判孤立点
            col[++ccol].push_back(u);
            return;
        }

        stk.push_back(u);
        int cnt = 0;
        for(int v : gra[u]){
            if(!dfn[v]){
                tarjan(root, v);
                cmin(low[u], low[v]);
                if(dfn[u] <= low[v]){
                    cnt++; ccol++;
                    if(u!=root || cnt>=2) point[u]=true; // 割点

                    col[ccol].push_back(u);
                    while(true){
                        int x = stk.back(); stk.pop_back();
                        col[ccol].push_back(x);
                        if(x == v) break;
                    }
                }
            }
            else cmin(low[u], dfn[v]);
        }
    }
    void work(){ // VDCC 染色
        for(int i=1; i<=n; i++){
            if(!dfn[i]){
                tarjan(i, i);
            }
        }
    }
    auto rebuild(){ // block cut tree
        work();
        vector<vector<int>> tree(n + ccol + 1);
        for(int i=1; i<=ccol; i++){
            for(int v : col[i]){
                tree[n+i].push_back(v);
                tree[v].push_back(n+i);
            }
        }
        return tree;
    }
};
```

#### 边双连通分量 EDCC (无向图)

> 边双个数 & 每个边双的节点

```cpp
struct EDCC {
    int n, ccol, cdfn; // .. , EDCC 个数 , ...
    vector<vector<int>> gra;
    vector<int> dfn, low, col, stk;
    set<pii> bridge;

    #define cmin(x, y) x = min(x, y)

    void init(int n_, auto& gr){
        n = n_; gra = gr;
        ccol = cdfn = 0;
        dfn = low = col = vector<int>(n + 1);
        stk.clear();
        bridge.clear();
    }
    void tarjan(int u, int fa){
        dfn[u] = low[u] = ++cdfn;
        stk.push_back(u);

        bool flg = false; // 处理重边
        for(int v : gra[u]){
            if(v == fa && !flg){
                flg = true;
                continue;
            }
            if(!dfn[v]){ // 树边
                tarjan(v, u);
                cmin(low[u], low[v]);
                if(low[v] > dfn[u]){ 
                    bridge.insert({min(u,v), max(u,v)});
                }
            }
            else{
                cmin(low[u], dfn[v]);
            }
        }
        
        if(dfn[u] == low[u]){
            ccol++;
            while(true){
                int x = stk.back(); stk.pop_back();
                col[x] = ccol;
                if(x == u) break;
            }
        }
    }
    void work(){ // EDCC 染色
        for(int i=1; i<=n; i++){
            if(!dfn[i]){
                tarjan(i, 0);
            }
        }
    }
    auto rebuild(){ // bridge tree
        work();
        vector<vector<int>> tree(ccol + 1);
        for(int i=1; i<=n; i++){
            for(int v : gra[i]){
                if(col[i] != col[v]){
                    tree[col[i]].push_back(col[v]); 
                }
            }
        }
        return tree;
    }
};
```

### 2-sat
```cpp
void twosat(){
    int n, m;
    cin >> n >> m;

    auto id = [&](int x, int v){
        return 2 * x - 1 + v;
    };

    // x==a || y==b
    // !x -> y && !y -> x
    vector<vector<int>> gra(2 * n + 1);
    for(int i=1; i<=m; i++){
        int x, a, y, b;
        cin >> x >> a >> y >> b;
        gra[id(x, a ^ 1)].push_back(id(y, b));
        gra[id(y, b ^ 1)].push_back(id(x, a));
    }

    SCC scc;
    scc.init(2 * n, gra);
    scc.work();

    // a -> !a , 则 a = false
    vector<int> ans(n + 1);
    for(int i=1; i<=n; i++){
        int f = id(i, 0), t = id(i, 1);
        if(scc.col[f] == scc.col[t]){
            cout << "IMPOSSIBLE\n";
            return;
        }
        ans[i] = scc.col[f] > scc.col[t];
    }

    cout << "POSSIBLE\n";
    for(int i=1; i<=n; i++){
        cout << ans[i] << " \n"[i==n];
    }
```

### 最大流-最小割-最小点覆盖

```cpp
template<typename T>
struct Flow_ {
    using pit = pair<int, T>; // pit = {v, capacity}
    const T inf = numeric_limits<T>::max();

    const int n;
    vector<pit> edges;
    vector<vector<int>> h;
    vector<int> cur, d;

    Flow_(int n) : n(n), h(n) {} // 0-based

    void add_edge(int u, int v, T c) {
        h[u].push_back(edges.size());
        edges.push_back({v, c});
        h[v].push_back(edges.size());
        edges.push_back({u, 0}); // 反向边
    }

    bool bfs(int s, int t) {
        d.assign(n, -1);
        d[s] = 0;
        queue<int> q;
        q.push(s);
        while (!q.empty()) {
            int x = q.front(); q.pop();
            for (int idx : h[x]) {
                auto &[v, w] = edges[idx];
                if (w && d[v] == -1) {
                    d[v] = d[x] + 1;
                    if (v == t) return true;
                    q.push(v);
                }
            }
        }
        return false;
    }

    T dfs(int u, int t, T f) {
        if (u == t) return f;
        T r = f;
        for (int &i = cur[u]; i < h[u].size(); i++) {
            int j = h[u][i];
            auto &[v, c] = edges[j];
            auto &[rv, rc] = edges[j ^ 1];
            if (c && d[v] == d[u] + 1) {
                T a = dfs(v, t, min(r, c));
                c -= a;
                rc += a;
                r -= a;
                if (!r) return f;
            }
        }
        return f - r;
    }

    T maxflow(int s, int t) {
        T ans = 0;
        while (bfs(s, t)) {
            cur.assign(n, 0);
            ans += dfs(s, t, inf);
        }
        return ans;
    }
};
using Flow = Flow_<int>;
```

### 最小费用最大流
```cpp
constexpr ll inf = 4e18;
struct MinCostFlow {
    using pli = pair<ll, int>;
    struct Edge {
        int v, c;
        ll cost;
    };

    int n;
    vector<Edge> e;
    vector<vector<int>> g;
    vector<ll> h, dis;
    vector<int> pre;
    void init(int n_){ // 0-based
        n = n_;
        e.clear();
        g.assign(n, {});
    }

    void add(int u, int v, int c, ll cost){
        g[u].push_back(e.size());
        e.push_back({v, c, cost});
        g[v].push_back(e.size());
        e.push_back({u, 0, -cost});
    }

    void spfa(int s){
        h.assign(n, inf);
        vector<int> inq(n);
        queue<int> que;
        h[s] = 0;
        que.push(s);
        inq[s] = 1;
        while(!que.empty()){
            int u = que.front();
            que.pop();
            inq[u] = 0;
            for(int i : g[u]){
                auto [v, c, cost] = e[i];
                if(c > 0 && h[v] > h[u] + cost){
                    h[v] = h[u] + cost;
                    if(!inq[v]){
                        que.push(v);
                        inq[v] = 1;
                    }
                }
            }
        }
        for(int i=0; i<n; i++){
            if(h[i] == inf) h[i] = 0;
        }
    }

    bool dijkstra(int s, int t){
        dis.assign(n, inf);
        pre.assign(n, -1);
        priority_queue<pli, vector<pli>, greater<pli>> que;
        dis[s] = 0;
        que.emplace(0, s);
        while(!que.empty()){
            auto [d, u] = que.top();
            que.pop();
            if(dis[u] < d) continue;

            for(int i : g[u]){
                auto [v, c, cost] = e[i];
                ll nd = d + h[u] - h[v] + cost;
                if(c > 0 && dis[v] > nd){
                    dis[v] = nd;
                    pre[v] = i;
                    que.emplace(dis[v], v);
                }
            }
        }

        return dis[t] != inf;
    }

    pair<int, ll> flow(int s, int t){
        int flow = 0;
        ll cost = 0;
        spfa(s);

        while(dijkstra(s, t)){
            for(int i=0; i<n; i++){
                if(dis[i] != inf) h[i] += dis[i];
            }
            int add = numeric_limits<int>::max();
            for(int i=t; i!=s; i=e[pre[i] ^ 1].v){
                add = min(add, e[pre[i]].c);
            }
            for(int i=t; i!=s; i=e[pre[i] ^ 1].v){
                e[pre[i]].c -= add;
                e[pre[i] ^ 1].c += add;
            }
            flow += add;
            cost += 1ll * add * h[t];
        }
        return {flow, cost};
    }
};
```

<div style="page-break-after:always"></div>

## 数论

### 扩展欧几里得 exgcd & 任意模数逆元

求 ax + by = gcd(a, b) 的一组特解

```cpp
void exgcd(ll a, ll b, ll& x, ll& y){
    if(b == 0){
        x = 1, y = 0;
        return;
    }
    ll x1, y1;
    exgcd(b, a % b, x1, y1);
    x = y1;
    y = x1 - (a / b) * y1;
}
// p任意 , gcd(a, p) != 1 则无解
ll inv(ll a, ll p){
    ll x, y;
    exgcd(a, p, x, y);
    ll g = a*x + p*y;
    return g == 1 ? (x % p + p) % p : -1;
}
```

### 反演

#### 子集反演

> 子集反演 莫比乌斯反演子集形式   加一个 ${(-1)}^{|T|-|S|}$ 的系数

**超集和形式**

${f(S) : 发生的事件恰好是S \quad g(T) : 至少覆盖T中的事件(超集)}$
$$
\begin{align*}
g(S) = \sum_{T \supseteq S} f(T)
\quad \Longleftrightarrow \quad
f(S) = \sum_{T \supseteq S} (-1)^{|T|-|S|} g(T)
\end{align*}
$$
**子集和形式:**

${f(S) : 发生的事件恰好是S \quad g(T) : 发生T以内的事件(子集)}$
$$
\begin{align*}
g(S) = \sum_{T \subseteq S} f(T)
\quad \Longleftrightarrow \quad
f(S) = \sum_{T \subseteq S} (-1)^{|S|-|T|} g(T)
\end{align*}
$$

#### 莫比乌斯反演

**高斯恒等式**

$$
\begin{align*}
\sum_{d\mid n}\varphi(d)=n
\end{align*}
$$

**基本恒等式**

$$
\begin{align*}
\sum_{d\mid n}\mu(d)=[n=1]
\end{align*}
$$

**互质指示函数**
$$
\begin{align*}
[\gcd(x,y)=1]
&=\sum_{d\mid\gcd(x,y)}\mu(d)
=\sum_{\substack{d\mid x\\d\mid y}}\mu(d)
\end{align*}
$$

**子集形式**

两个函数满足这样的整除 $\sum$ 关系 $f(x)=\sum_{d\mid x}g(d)$

$$
\begin{align*}
f(x)=\sum_{d\mid x}g(d)
\xrightarrow{\text{反演}}
g(x)=\sum_{d\mid x}\mu\left(\frac{x}{d}\right)f(d)
\end{align*}
$$

**超集形式**

$$
\begin{align*}
f(n)=\sum_{n\mid d}\mu\left(\frac{d}{n}\right)g(d)
\end{align*}
$$

$$
\begin{align*}
f(n)=\sum_{n\mid d}f(d)
=\sum_{k\ge 1}g(nk),
\end{align*}
$$

**C(l,r,n), 求 [l, r] 中和 n 互质的数量 $O(\sqrt(n))$**

$$
\begin{align*}
C(l,r,n)
&=\sum_{d\mid n}\mu(d)
\left(
\left\lfloor\frac{r}{d}\right\rfloor
-\left\lfloor\frac{l-1}{d}\right\rfloor
\right)
\end{align*}
$$

**$\gcd=g$ 的数对数量**

定义 $f(x)\to\gcd(a_i,a_j)=x$ 的数对数量

定义 $g(y)\to y\mid\gcd(a_i,a_j)$ 的数对数量

$$
\begin{align*}
g(y)=\sum_{y\mid x}f(x)
\xrightarrow{\text{反演}}
f(y)=\sum_{y\mid x}\mu\left(\frac{x}{y}\right)g(x)
\end{align*}
$$

{% note info simple %} **提示：** 若 $g=\gcd(x,y)$，则 $d\mid g\Longleftrightarrow d\mid x\land d\mid y$。 {% endnote %}

### 卷积

**标准卷积（和为定值）：**

$$
\begin{align*}
c_k = \sum_{i} f[k-i]g[i]
\end{align*}
$$

**差卷积（差为定值）：**

$$
\begin{align*}
c_k = \sum_{i} f[i+k]g[i] \quad \text{或} \quad c_k = \sum_{i} f[i-k]g[i]
\end{align*}
$$

**数组反转以转化成标准卷积：**

对于差卷积 $h_k = \sum_{i} f[i+k]g[i]$，将数组 $f$ 反转后：

$$
\begin{align*}
h_k = \sum_{i} f[n-(i+k)]g[i] = \sum_{i} f[n-i-k]g[i]
\end{align*}
$$

其中下标和 $(n-i-k) + i = n-k$ 为定值。将 $f * g$ 得到结果数组 $c$，则有：

$$
\begin{align*}
c[n-k] = \sum_{i} f[n-k-i]g[i] = h_k
\end{align*}
$$

#### FFT 快速傅里叶变换

```cpp
#include <bits/stdc++.h>
using namespace std;

struct Polynomial {
    constexpr static double PI = acos(-1);
    struct Complex {
        double x, y;
        Complex(double _x = 0.0, double _y = 0.0) {
            x = _x;
            y = _y;
        }
        Complex operator-(const Complex &rhs) const {
            return Complex(x - rhs.x, y - rhs.y);
        }
        Complex operator+(const Complex &rhs) const {
            return Complex(x + rhs.x, y + rhs.y);
        }
        Complex operator*(const Complex &rhs) const {
            return Complex(x * rhs.x - y * rhs.y, x * rhs.y + y * rhs.x);
        }
    };
    vector<Complex> c;
    Polynomial(vector<int> &a) {
        int n = a.size();
        c.resize(n);
        for (int i = 0; i < n; i++) {
            c[i] = Complex(a[i], 0);
        }
        fft(c, n, 1);
    }
    void change(vector<Complex> &a, int n) {
        for (int i = 1, j = n / 2; i < n - 1; i++) {
            if (i < j) swap(a[i], a[j]);
            int k = n / 2;
            while (j >= k) {
                j -= k;
                k /= 2;
            }
            if (j < k) j += k;
        }
    }
    void fft(vector<Complex> &a, int n, int opt) {
        change(a, n);
        for (int h = 2; h <= n; h *= 2) {
            Complex wn(cos(2 * PI / h), sin(opt * 2 * PI / h));
            for (int j = 0; j < n; j += h) {
                Complex w(1, 0);
                for (int k = j; k < j + h / 2; k++) {
                    Complex u = a[k];
                    Complex t = w * a[k + h / 2];
                    a[k] = u + t;
                    a[k + h / 2] = u - t;
                    w = w * wn;
                }
            }
        }
        if (opt == -1) {
            for (int i = 0; i < n; i++) {
                a[i].x /= n;
            }
        }
    }
};

// 多项式乘法 - fft
vector<long long> multiply(const vector<int>& A, const vector<int>& B) {
    int n1 = A.size(), n2 = B.size();
    if (n1 == 0 || n2 == 0) return {};
    int n = 1;
    while (n < n1 + n2) n <<= 1;

    vector<int> a(A.begin(), A.end()), b(B.begin(), B.end());
    a.resize(n); b.resize(n);

    Polynomial pa(a), pb(b); // pa.c 和 pb.c 已是正变换结果（点值表示）
    for (int i = 0; i < n; ++i) {
        pa.c[i] = pa.c[i] * pb.c[i]; // 点值相乘
    }
    pa.fft(pa.c, n, -1); // 逆变换，恢复系数（实部存放结果）

    vector<long long> res(n1 + n2 - 1);
    for (int i = 0; i < (int)res.size(); ++i) {
        res[i] = llround(pa.c[i].x); // 四舍五入到最近整数
    }
    return res;
}

void example() {
    // 多项式 A(x) = 3 + 2x + 5x^2  -> coef: [3,2,5]
    // 多项式 B(x) = 5 + 1x + 2x^2  -> coef: [5,1,2]
    vector<int> A = {3, 2, 5};
    vector<int> B = {5, 1, 2};

    auto C = multiply(A, B);
    cout << "Result coefficients (low->high):\n";
    for (size_t i = 0; i < C.size(); ++i) {
        if (i) cout << ' ';
        cout << C[i];
    }
    cout << '\n';

    // 预期输出：15 13 33 9 10
    // 对应多项式 15 + 13x + 33x^2 + 9x^3 + 10x^4
}

int main(){
    int n, m;
    cin >> n >> m;
    vector<int> a(n + 1), b(m + 1);
    for(int i=0; i<=n; i++) cin >> a[i];
    for(int i=0; i<=m; i++) cin >> b[i];

    auto ans = multiply(a, b);
    for(int i=0; i<n+m+1; i++){
        cout << ans[i] << " \n"[i == n+m];
    }

}
```

#### NTT 快速数论变换

> 取模版 FFT

```cpp
#include <bits/stdc++.h>
using namespace std;
using ll = int64_t;
using ull = uint64_t;
using u128 = __uint128_t;
/*
  大模数 9223372036737335297 ptr = 3
  Cmax = ai*bi*n < mod, 结果就不会被 mod 截断
  常数较大
  
  可换 998244353, ptr = 3, 常数较小
  将所有的 ull 换成 int 即可
*/

// 记得一定要写 'const' QAQ(1210ms -> 477ms)
const ll mo = 9223372036737335297;
const int prt = 3; // 原根

ull mul(ull a, ull b){
    return (u128)a * b % mo;
}
ull qpow(ull a, ull x){
    ull ans = 1;
    while(x){
        if(x & 1) ans = mul(ans, a);
        a = mul(a, a);
        x >>= 1;
    }
    return ans;
}

void ntt(vector<ull>& a, int mode){
    int n = a.size();
    int lo = __builtin_ctz(n);

    // 位反转
    vector<int> rev(n);
    for(int i = 1; i < n; i++){
        rev[i] = (rev[i >> 1] >> 1) | ((i & 1) << (lo - 1));
    }
    for(int i = 0; i < n; i++){
        if(i < rev[i]) swap(a[i], a[rev[i]]);
    }

    // 长度为 len 的合并
    for(int len = 2; len <= n; len <<= 1){
        ull wlen = qpow(prt, (mo - 1) / len);
        if(!mode){
            wlen = qpow(wlen, mo - 2);
        }
        int half = len >> 1;
        for(int i = 0; i < n; i += len){
            ull w = 1;
            for(int j = 0; j < half; j++){
                ull u = a[i + j];
                ull v = mul(a[i + j + half], w);
                ull x = u + v;
                if(x >= mo) x -= mo;
                ull y = (u >= v) ? (u - v) : (u + mo - v);
                a[i + j] = x;
                a[i + j + half] = y;
                w = mul(w, wlen);
            }
        }
    }

    if(!mode){
        ull inv = qpow(n, mo - 2);
        for(int i = 0; i < n; i++){
            a[i] = mul(a[i], inv);
        }
    }
}

// 卷积(A, B)
vector<ull> multiply(vector<int> &a, vector<int> &b){
    int n1 = a.size(), n2 = b.size();
    int N = n1 + n2 - 1;
    N = (1 << __lg(2 * N - 1)); // 上取 2 的整幂

    vector<ull> A(N), B(N);
    for(int i=0; i<n1; i++) A[i] = a[i];
    for(int i=0; i<n2; i++) B[i] = b[i];

    ntt(A, 1); // 正变换
    ntt(B, 1);
    vector<ull> C(N);
    for(int i=0; i<N; i++) C[i] = mul(A[i], B[i]);
    ntt(C, 0); // 逆变换

    C.resize(n1 + n2 - 1);
    return C;
}
```

${2^k}$ 阶原根, 一般不需要找, 防止某些题奇葩模数

```cpp
// NTT 模数的 2^k 阶原根
ll primitive_root(){
    ll phi = mo - 1, tmp = mo - 1;

    while(!(tmp & 1)) tmp >>= 1;
    for(ll g = 2; g < mo; ++g){
        if(qpow(g, phi / 2) == 1) continue; // 注意传入超 int, 需对 a, x 取模
        if(qpow(g, tmp) != 1) return g;
    }
    return -1;
}
```

#### FWT 快速沃尔什变换

> ${O(nlog)}$ 或者说 ${O(n2^n)}$ 计算 and | or | xor 卷积   (位运算卷积)

$$
\begin{align*}
C_k = \sum_{i \oplus j = k} f[i] \cdot g[j]
\end{align*}
$$

> 带模版

```cpp
// 1->正变换  0->逆变换
void fwt_and(vector<int> &f, int mode){
    int n = f.size();
    for(int p=2; p<=n; p<<=1){
        int len = p >> 1;
        for(int l=0; l<n; l+=p){
            for(int k=l; k<l+len; k++){
                if(mode){
                    f[k] += f[k+len];
                    f[k] %= mo;
                }
                else{
                    f[k] += -f[k+len] + mo;
                    f[k] %= mo;
                }
            }
        }
    }
}
void fwt_or(vector<int> &f, int mode){
    int n = f.size();
    for(int p=2; p<=n; p<<=1){
        int len = p >> 1;
        for(int l=0; l<n; l+=p){
            for(int k=l; k<l+len; k++){
                if(mode){
                    f[k+len] += f[k];
                    f[k+len] %= mo;
                }
                else{
                    f[k+len] += -f[k] + mo;
                    f[k+len] %= mo;
                }
            }
        }
    }
}
void fwt_xor(vector<int> &f, int mode){
    int n = f.size();
    for(int p=2; p<=n; p<<=1){
        int len = p >> 1;
        for(int l=0; l<n; l+=p){
            for(int k=l; k<l+len; k++){
                int x = f[k], y = f[k+len];
                f[k] = (x + y) % mo;
                f[k+len] = (x - y + mo) % mo;
            }
        }
    }
    if(!mode){
        ll inv = qpow(n, mo - 2);
        for(auto& x : f) x = x * inv % mo;
    }
}

template<typename F>
auto fwt(vector<int> A, vector<int> B, F FWT){
    FWT(A, 1);
    FWT(B, 1);

    int n = A.size();
    vector<int> C(n);
    for(int i=0; i<n; i++){
        C[i] = 1ll * A[i] * B[i] % mo;
    }
    FWT(C, 0);

    return C;
}

void solve(){
    int n;
    cin >> n;

    int full = (1 << n) - 1;

    vector<int> A(1<<n), B(1<<n);
    for(int i=0; i<=full; i++) cin >> A[i];
    for(int i=0; i<=full; i++) cin >> B[i];

    auto Cand = fwt(A, B, fwt_and);
    auto Cor = fwt(A, B, fwt_or);
    auto Cxor = fwt(A, B, fwt_xor);
    
    for(int i=0; i<=full; i++){
        cout << Cor[i] << " \n"[i == full];
    }
    for(int i=0; i<=full; i++){
        cout << Cand[i] << " \n"[i == full];
    }
    for(int i=0; i<=full; i++){
        cout << Cxor[i] << " \n"[i == full];
    }
}
```

> 不带模版

```cpp
// n * A <= ll  // 正变换后可能 int -> ll 
void fwt_xor(vector<ll>& f, int mode){
    int n = f.size();
    for(int p=2; p<=n; p<<=1){
        int len = p >> 1;
        for(int l=0; l<n; l+=p){
            for(int k=l; k<l+len; k++){
                ll x = f[k], y = f[k+len];
                f[k] = x + y;
                f[k+len] = x - y;
            }
        }
    }
    if(!mode){
        for(auto& x : f) x /= n;
    }
}

template<typename F>
auto fwt(vector<ll> A, vector<ll> B, F FWT){
    FWT(A, 1);
    FWT(B, 1);

    int n = A.size();
    vector<ll> C(n);
    for(int i=0; i<n; i++){
        C[i] = 1ll * A[i] * B[i];
    }
    FWT(C, 0);

    return C;
}
```

#### FMT 快速莫比乌斯变换

> ${O(n^2 \cdot 2^n)}$ 子集卷积, 对于

$$
\begin{align*}
\sum_{k = i\cup j,\;x\cap y=\phi} A_i \cdot B_j
\end{align*}
$$

```cpp
#include <bits/stdc++.h>
using namespace std;
using ll = long long;

const int mo = 1e9 + 9;
// ( 太难了 根本看不懂题解啊 )

// 1 的个数
int bitcnt(int x){ return __builtin_popcount(x); }

// fwt_or
void fwt(vector<int> &f, int mode){
    int n = f.size();
    for(int p=2; p<=n; p<<=1){
        int len = p >> 1;
        for(int l=0; l<n; l+=p){
            for(int k=l; k<l+len; k++){
                if(mode){
                    f[k+len] += f[k];
                    f[k+len] %= mo;
                }
                else{
                    f[k+len] += -f[k] + mo;
                    f[k+len] %= mo;
                }
            }
        }
    }
}

void solve(){
    int n; cin >> n;
    int full = (1 << n) - 1;

    vector<vector<int>> a(n+1, vector<int>(1<<n));
    vector<vector<int>> b(n+1, vector<int>(1<<n));
    vector<vector<int>> h(n+1, vector<int>(1<<n));

    for(int i=0; i<=full; i++){
        int x; cin >> x;
        a[bitcnt(i)][i] = (x % mo + mo) % mo;
    }
    for(int i=0; i<=full; i++){
        int x; cin >> x;
        b[bitcnt(i)][i] = (x % mo + mo) % mo;
    }

    for(int i=0; i<=n; i++){
        fwt(a[i], 1);
        fwt(b[i], 1);
    }

    for(int i=0; i<=n; i++)
        for(int j=0; j<=i; j++)
            for(int mask=0; mask<=full; mask++)
                h[i][mask] = (h[i][mask] + (ll)a[j][mask] * b[i-j][mask]) % mo;

    for(int i=0; i<=n; i++) fwt(h[i], 0);

    for(int mask=0; mask<=full; mask++){
        cout << h[bitcnt(mask)][mask] << " \n"[mask == full];
    }

}
```

### 预处理 - 逆元 - 组合数

> ${O(n)}$ 预处理 , ${O(1)}$ 查询

```cpp
const int mo = 1e9 + 7;
const int MX = 2e5;
vector<ll> fct(MX+1);
vector<ll> inv_fct(MX+1);
vector<ll> inv(MX+1);
 
void init(){ // 预处理
    fct[0] = inv_fct[0] = inv[1] = 1;
    for(int i=2; i<=MX; i++){
        inv[i] = (mo - mo / i) * inv[mo % i] % mo;
    }
    for(int i=1; i<=MX; i++){
        fct[i] = fct[i-1] * i % mo;
        inv_fct[i] =inv_fct[i-1] * inv[i] % mo; 
    }
}
ll comb(ll n, ll k){ // C(n, k) 组合数
    ll ans = 1ll * fct[n] * inv_fct[n-k] % mo * inv_fct[k] % mo;
    return ans;
}
```

### 线筛

```c++
vector<int> pri, mi_fct;
vector<bool> prime;
void sieve(){
    int n = 1e8;
    mi_fct = vector<int>(n + 1);
    prime = vector<bool>(n + 1, true);
    prime[0] = prime[1] = false;

    for(int i=2; i<=n; i++){
        if(prime[i]) pri.push_back(i), mi_fct[i]=i;
        for(int p : pri){
            if(p * i > n) break;
            prime[p * i] = false;
            mi_fct[p * i] = p;
            if(i % p == 0) break;
        }
    }
}
```

### Min25 筛
> 求 ${\pi(n)}$, 即 1...n 的质数个数 
```cpp
struct Min25 {
    ll n, sq;
    vector<ll> w, g;
    vector<int> id1, id2, prime, vis;

    int id(ll x){
        return x <= sq ? id1[x] : id2[n / x];
    }

    void init(ll n_){
        n = n_;
        sq = sqrtl(n);
        while((sq + 1) * (sq + 1) <= n) sq++;
        while(sq * sq > n) sq--;

        id1.assign(sq + 2, 0);
        id2.assign(sq + 2, 0);
        vis.assign(sq + 2, 0);
        prime.clear();
        w.clear();
        g.clear();

        for(int i=2; i<=sq; i++){
            if(!vis[i]) prime.push_back(i);
            for(int p : prime){
                if(1LL * i * p > sq) break;
                vis[i * p] = 1;
                if(i % p == 0) break;
            }
        }

        for(ll l=1, r; l<=n; l=r+1){
            ll v = n / l;
            r = n / v;
            int idx = w.size();
            w.push_back(v);
            g.push_back(v - 1);
            if(v <= sq) id1[v] = idx;
            else id2[n / v] = idx;
        }

        for(int i=0; i<(int)prime.size(); i++){
            ll p = prime[i];
            ll pp = p * p;
            for(int j=0; j<(int)w.size() && pp<=w[j]; j++){
                g[j] -= g[id(w[j] / p)] - i;
            }
        }
    }

    ll pi(ll x){
        if(x < 2) return 0;
        return g[id(x)];
    }
};
```

### OTHER

#### $min$, $max$ 绝对值的恒等式

$$
\begin{align*}
\min(A,B) &= \frac{A+B-\lvert A-B\rvert}{2} \\
\max(A,B) &= \frac{A+B+\lvert A-B\rvert}{2}
\end{align*}
$$

#### 曼哈顿转切比雪夫

$$
\begin{align*}
|a|+|b| = max({|a+b|, |a-b|})
\end{align*}
$$

#### 平方和公式

$$
\sum_{i=1}^{n} i^2=\frac{n(n+1)(2n+1)}{6}
$$

#### 组合数常用公式

**基础公式**

$k \cdot C_n^k = n \cdot C_{n-1}^{\,k-1}$

$C_n^k + C_n^{k+1} = C_{n+1}^{k+1}$ （递推公式, 直接划分成两类）

$\sum_{i=0}^n C_n^i = 2^n$ （按选几个划分）

$\sum_{i=0}^{n} {n \choose i}^2 = {2n \choose n}$

**曲棍球恒等式**

$$
\sum_{x=m}^{n} {x \choose m} = {n+1 \choose m+1}$ （按最大值划分）
$$

$$
\sum_{r=0}^{n-m}\binom{m+r}{m}
=
\sum_{r=0}^{n-m}\binom{m+r}{r}
=
\binom{n+1}{m+1}
$$

**多步选择恒等式**

$$\binom{n}{m} \binom{m}{k} = \binom{n}{k} \binom{n-k}{m-k}$$

$$\frac{\binom{n}{k}}{\binom{m}{k}} = \frac{\binom{n}{m}}{\binom{n-k}{m-k}}$$

#### 同余方程

$$
a x \equiv r \pmod p
\Longleftrightarrow
\frac{a}{g}x \equiv \frac{r}{g} \pmod{\frac{p}{g}},
\quad g = \gcd(a,p),\ g \mid r
$$


${ax \equiv r \pmod{p}}$ 有 ${\gcd{(a,\; p)}}$ 个解, 

${x = x_0 + k \frac{p}{g}} \quad k=0,1,2\cdots g-1$

也就是 a, p 互质时有唯一解, 可以直接 ${a^{p-2}}$ 求逆元

&nbsp;

n mod i = n - ${\lfloor{\frac{n}{i}}\rfloor i}$

&nbsp;

**同余方程组**

$x = y_i \mod p_i$

设特解 $x_0$，则 $p_i | x - x_0$

可以推出 $lcm(pi) | x-x_0$，解为 $x_0, x_0+L, x_0+2L...$

可知 $x_0=c \mod L$，也就是 mod L 情况下解唯一

<div style="page-break-after:always"></div>

## 寄算几何

### Point

```cpp
struct Point {
    ll x, y;
    Point operator + (const Point& p) const { return {x+p.x, y+p.y}; }
    Point operator - (const Point& p) const { return {x-p.x, y-p.y}; }
    bool operator < (const Point& p) const { return tie(x, y) < tie(p.x, p.y); }
    bool operator == (const Point& p) const { return tie(x, y) == tie(p.x, p.y); }
};

i128 cross(const Point& a, const Point& b){
    return (i128)a.x * b.y - (i128)a.y * b.x;
}
i128 dot(const Point& a, const Point& b){
    return (i128)a.x * b.x + (i128)a.y * b.y;
}
```

### ConvexHull
```cpp
vector<Point> convexHull(vector<Point> p){
    sort(p.begin(), p.end());
    p.erase(unique(p.begin(), p.end()), p.end());

    int n = p.size();
    if(n <= 1) return p;

    vector<Point> lo, hi;
    for(int i=0; i<n; i++){
        while(lo.size() >= 2 && cross(lo.back()-lo[lo.size()-2], p[i]-lo[lo.size()-2]) <= 0){
            lo.pop_back();
        }
        lo.push_back(p[i]);
    }
    for(int i=n-1; i>=0; i--){
        while(hi.size() >= 2 && cross(hi.back()-hi[hi.size()-2], p[i]-hi[hi.size()-2]) <= 0){
            hi.pop_back();
        }
        hi.push_back(p[i]);
    }
    // 上下凸包一定会有两点重合
    lo.pop_back();
    hi.pop_back();
    vector<Point> res = lo;
    res.insert(res.end(), hi.begin(), hi.end());
    return res;
}
```

### 极角排序(整数运算，无精度问题)

```cpp
    // sort(a.begin(), a.end(), rad); // 精度可能不够高
{
    auto quad = [](auto x, auto y){ // 第几象限 , 逆时针左闭右开
        if(x > 0 && y >= 0) return 0;
        if(x <= 0 && y > 0) return 1;
        if(x < 0 && y >= 0) return 2;
        return 3;
    };
    sort(a.begin(), a.end(), [&](Point& A, Point& B){
        auto [x1, y1] = A;
        auto [x2, y2] = B;
        int qdx = quad(x1, y1), qdy = quad(x2, y2);
        if(qdx == qdy) return cross(A, B)>0;
        return qdx < qdy;
    });
}
```

### 任意多边形面积 (高斯面积公式)

$$\text{Area} = \frac{1}{2} \left| \sum_{i=1}^{n} (x_i \cdot y_{i+1} - x_{i+1} \cdot y_i) \right|$$

### 闵可夫斯基和 (计算两个凸包合成的大凸包)

```cpp
int sign(i128 x){
    return (x > 0) - (x < 0);
}
// 调整 p[0] 为左下点
void rotate(vector<Point>& p){
    int idx = 0;
    for(int i=1; i<p.size(); i++){
        if(p[i].y < p[idx].y || (p[i].y == p[idx].y && p[i].x < p[idx].x)) idx = i;
    }
    rotate(p.begin(), p.begin() + idx, p.end());
}
vector<Point> mincowski(vector<Point> p1, vector<Point> p2) {
    rotate(p1), rotate(p2);
    int n = p1.size(), m = p2.size();
    vector<Point> v1(n), v2(m);
    for(int i=0; i<n; i++) v1[i] = p1[(i + 1) % n] - p1[i];
    for(int i=0; i<m; i++) v2[i] = p2[(i + 1) % m] - p2[i];
    vector<Point> ans = {p1.front() + p2.front()};
    int i = 0, j = 0;
    while(i < n && j < m){
        int s = sign(cross(v1[i], v2[j]));
        if(s > 0) ans.push_back(ans.back() + v1[i++]);
        else if(s < 0) ans.push_back(ans.back() + v2[j++]);
        else ans.push_back(ans.back() + v1[i++] + v2[j++]);
    }
    while(i < n) ans.push_back(ans.back() + v1[i++]);
    while(j < m) ans.push_back(ans.back() + v2[j++]);
    if(ans.size() > 1 && ans.back() == ans.front()) ans.pop_back();
    return ans;
}
```

### 凸多边形面积并集 O(E * E)

```cpp
// 边 A->B 在多边形 p 中被覆盖的比例
pdd coverOf(const vector<Point>& p, const Point& A, const Point& B){
    ld l = 0, r = 1;
    Point d = B - A;
    int n = p.size();
    for(int i=0; i<n; i++){
        Point e = p[(i + 1) % n] - p[i];
        i128 u = cross(e, A - p[i]);
        i128 v = cross(e, d);

        if(v == 0){
            if(u < 0) return {1, 0};
            continue;
        }

        ld t = -(ld)u / (ld)v;
        if(v > 0) l = max(l, t);
        else r = min(r, t);

        if(l > r) return {1, 0};
    }
    return {l, r};
}
bool existSameDir(const vector<Point>& p, const Point& A, const Point& B){
    Point d = B - A;
    int n = p.size();
    for(int i=0; i<n; i++){
        Point e = p[(i + 1) % n] - p[i];
        if(cross(e, d) == 0 && cross(e, A - p[i]) == 0 && dot(e, d) > 0) return true;
    }
    return false;
}

ld unionArea(const vector<vector<Point>>& ps){
    ld ans = 0;
    for(int i=0; i<ps.size(); i++){
        for(int j=0; j<ps[i].size(); j++){
            int n = ps.size(), m = ps[i].size();
            vector<pdd> seg;
            for(int k=0; k<n; k++){
                if(k == i) continue;
                if(existSameDir(ps[k], ps[i][j], ps[i][(j+1)%m]) && k > i) continue;                
                auto [l, r] = coverOf(ps[k], ps[i][j], ps[i][(j+1)%m]);
                if(l <= r) seg.push_back({l, r});
            }

            sort(seg.begin(), seg.end());
            ld cover = 0; // A->B 被其他凸多边形覆盖的比例
            if(!seg.empty()){
                ld l = seg[0].first, r = seg[0].second;
                for(int k=1; k<seg.size(); k++){
                    if(seg[k].first <= r){
                        r = max(r, seg[k].second);
                    }
                    else{
                        cover += r - l;
                        l = seg[k].first;
                        r = seg[k].second;
                    }
                }
                cover += r - l;
            }
            ans += (ld)cross(ps[i][j], ps[i][(j+1)%m]) * (1-cover);
        }
    }
    return ans / 2;
}
```

### 三角剖分 (ear clipping) O(n * n)

```cpp
bool inTriangle(const Point& p, const Point& a, const Point& b, const Point& c){
    return cross(b - a, p - a) >= 0 &&
           cross(c - b, p - b) >= 0 &&
           cross(a - c, p - c) >= 0;
}

// ear clipping , p->simple polygon
vector<vector<Point>> triangulate(const vector<Point>& p){
    int n = p.size();
    vector<int> pre(n), nxt(n);
    vector<bool> alive(n, true);
    for(int i=0; i<n; i++){
        pre[i] = (i - 1 + n) % n;
        nxt[i] = (i + 1) % n;
    }
    auto isEar = [&](int x){
        if(!alive[x]) return false;

        int a = pre[x], b = x, c = nxt[x];
        if(cross(p[b] - p[a], p[c] - p[b]) <= 0){
            return false;
        }

        for(int i=0; i<n; i++){
            if(!alive[i]) continue;
            if(i == a || i == b || i == c) continue;

            if(inTriangle(p[i], p[a], p[b], p[c])){
                return false;
            }
        }
        return true;
    };

    queue<int> q;
    for(int i=0; i<n; i++){
        if(isEar(i)) q.push(i);
    }

    vector<vector<Point>> res;
    int cnt = n;
    while(cnt > 3){
        while(q.size() && !isEar(q.front())) q.pop();
        int b = q.front(); q.pop();
        int a = pre[b], c = nxt[b];

        alive[b] = false;
        nxt[a] = c, pre[c] = a;
        cnt--;

        res.push_back({p[a], p[b], p[c]});
        if(isEar(a)) q.push(a);
        if(isEar(c)) q.push(c);
    }

    int a = 0;
    while(!alive[a]) a++;

    int b = nxt[a], c = nxt[b];
    res.push_back({p[a], p[b], p[c]});
    return res;
}
```

<div style="page-break-after:always"></div>

## 数据结构

### 树状数组

```cpp
struct BIT{
    int n;
    vector<ll> tree;
    void init(int n_){
        n = n_;
        tree = vector<ll>(n + 1);
    }
    void add(int x, ll v){
        for(int i=x; i<=n; i+=i&-i){
            tree[i] += v;
        }
    }
    ll query(int x){
        ll ans = 0;
        for(int i=x; i>=1; i-=i&-i){
            ans += tree[i];
        }
        return ans;
    }
    ll query(int x, int y){
        return query(y) - query(x - 1);
    }

    // 权值树状数组 第 k 大
    int kth(int k){
        int x = 0;
        for(int i=__lg(2*n-1); i>=0; i--){
            int tmp = x + (1 << i);
            if(tmp <= n && tree[tmp] < k){
                k -= tree[tmp];
                x = tmp;
            }
        }
        return x + 1;
    }
};
```

### DSU

```cpp
struct DSU{
    vector<int> f, sz;
    void init(int n){
        f = vector<int>(n + 1);
        sz = vector<int>(n + 1, 1);
        iota(f.begin(), f.end(), 0);
    }
    int find(int x){
        while(x != f[x]) x = f[x] = f[f[x]];
        return x;
    }
    bool merge(int x, int y){ // x <- y
        x = find(x), y = find(y);
        if(x == y) return false;
        f[y] = x;
        sz[x] += sz[y];
        return true;
    }
    bool same(int x, int y){ // 判同一连通块
        return find(x) == find(y);
    }
};
```

### ST表

```cpp
struct ST{
    int n, m;
    vector<int> plog;
    vector<vector<int>> f;

    ST(int n_, auto& a) : n(n_){
        m = log2(n);
        plog.resize(n + 1);
        f.assign(n + 1, vector<int>(m + 1, -inf));

        for(int i=1; i<=n; i++) f[i][0] = a[i];
        for(int j=1; j<=m; j++){ // 先枚举第二维len
            for(int i=1; i+(1<<(j-1))<=n; i++){
                f[i][j] = max(f[i][j-1], f[i+(1<<(j-1))][j-1]);
            }
        }
        for(int i=2; i<=n; i++){ // 从 2 开始
            plog[i] = (plog[i >> 1] + 1);
        }
    }
    int query(int l, int r){
        int x = plog[r - l + 1];
        int ans = max(f[l][x], f[r-(1<<x)+1][x]);
        return ans;
    }
};
```

### SegTree

> 区间修改|区间查询 通用结构

```cpp
struct SegTree{
    int n;
    vector<ll> a; 

    // tag , 区间修改
    vector<ll> tag;
    vector<ll> add; 
    vector<ll> mul; 
    // info , 区间查询
    vector<ll> info;
    vector<ll> sum;
    vector<ll> prod;
    vector<ll> mi, ma;
    vector<ll> cnt;

    #define lp (p << 1)
    #define rp (p << 1 | 1)
    #define lk (mid - l + 1)
    #define rk (r - mid)

    void init(int n_){ // init[0, n_]
        n = n_;
        // init tags, info
        tag = vector<ll>(n+1 << 2);
        info = vector<ll>(n+1 << 2);
    }
    void init(int n_, const vector<ll>& a_){
        n = n_; a = a_;
        // init tags, info
        tag = vector<ll>(n+1 << 2);
        info = vector<ll>(n+1 << 2);
        // init a
        build(1, 0, n);
    }

    // merge 区间信息
    void pull(int p){
        // info[p] <- merge(info[lp], info[rp])
    }
    // push 区间标记
    void push(int p, int l, int r){
        // if( no tag ) return
        int mid = l + r >> 1;
        // lazy(lp, tag[p])
        // lazy(rp, tag[p])
        // del tag[p]
    }

    void build(int p, int l, int r){
        if(l == r){
            info[p] = a[l];
            return;
        }
        int mid = l + r >> 1;
        build(lp, l, mid);
        build(rp, mid+1, r);
        pull(p);
    }

    void update(int p, int l, int r, int x, int y, ll v){ // 区间修改
        if(x <= l && r <= y){
            // lazy(p, tag[p])
            return;
        }
        int mid = l + r >> 1;
        push(p, l, r);
        if(x <= mid) update(lp, l, mid, x, y, v);
        if(y >= mid + 1) update(rp, mid + 1, r, x, y, v);
        pull(p);
    }
    void update(int p, int l, int r, int x, ll v){ // 单点修改
        if(l == r){
            // update info[p]
            return;
        }
        int mid = l + r >> 1;
        push(p, l, r);
        if(x <= mid) update(lp, l, mid, x, v);
        else update(rp, mid+1, r, x, v);
        pull(p);
    }
    ll query(int p, int l, int r, int x, int y){  // 区间查询
        if(x <= l && r <= y){
            return info[p];
        }
        // init ans -> 单位元
        int mid = l + r >> 1;
        push(p, l, r);

        // if(x <= mid) merge(ans, query(lp, l, mid, x, y));
        // if(y >= mid + 1) merge(ans, query(rp, mid + 1, r, x, y));

        return ans;
    }

    void update(int x, ll v){ update(1, 0, n, x, v); } // 单点修改
    void update(int L, int R, ll v){ update(1, 0, n, L, R, v); } // 区间更新
    ll query(int L, int R){ return query(1, 0, n, L, R); } // 区间查询
};
```

> 单点修改 | 区间和

```cpp
struct SegTree{
    int n;
    vector<ll> a;
    vector<ll> info; // 区间和

    #define lp (p << 1)
    #define rp (p << 1 | 1)
    #define lk (mid - l + 1)
    #define rk (r - mid)

    void init(int n_){
        n = n_;
        info = vector<ll>(n+1 << 2);
    }
    void init(int n_, const vector<ll>& a_){
        n = n_; a = a_;
        info = vector<ll>(n+1 << 2);
        build(1, 0, n);
    }

    void pull(int p){
        info[p] = info[lp] + info[rp];
    }
    void build(int p, int l, int r){
        if(l == r){
            info[p] = a[l];
            return;
        }
        int mid = l + r >> 1;
        build(lp, l, mid);
        build(rp, mid+1, r);
        pull(p);
    }

    void update(int p, int l, int r, int x, ll v){
        if(l == r){
            info[p] = v;
            return;
        }
        int mid = l + r >> 1;
        if(x <= mid) update(lp, l, mid, x, v);
        else update(rp, mid+1, r, x, v);
        pull(p);
    }
    ll query(int p, int l, int r, int x, int y){
        if(x <= l && r <= y) return info[p];

        ll ans = 0;
        int mid = l + r >> 1;
        if(x <= mid) ans += query(lp, l, mid, x, y);
        if(y >= mid + 1) ans += query(rp, mid+1, r, x, y);
        return ans;
    }

    void update(int x, ll v){ update(1, 0, n, x, v); } // 单点修改
    ll query(int L, int R){ return query(1, 0, n, L, R); } // 区间和
};
```

> 区间加 (ai+v) | 区间和

```cpp
struct SegTree{
    int n;
    vector<ll> a; 
    vector<ll> add; // tag
    vector<ll> sum; // info

    #define lp (p << 1)
    #define rp (p << 1 | 1)
    #define lk (mid - l + 1)
    #define rk (r - mid)
    
    void init(int n_){
        n = n_;
        sum = add = vector<ll>(n << 2);
    }
    void init(int n_, const vector<ll>& a_){
        n = n_; a = a_;
        sum = add = vector<ll>(n << 2);
        build(1, 0, n);
    }

    void lazy(int p, int k, ll v){
        sum[p] += 1ll * k * v;
        add[p] += v;
    }
    void pull(int p){
        sum[p] = sum[lp] + sum[rp];
    }
    void push(int p, int l, int r){
        if(add[p] == 0) return;
        int mid = l + r >> 1;
        lazy(lp, lk, add[p]);
        lazy(rp, rk, add[p]);
        add[p] = 0;
    }
    void build(int p, int l, int r){
        if(l == r){
            sum[p] = a[l]; // return
            return;
        }
        int mid = (l + r) >> 1;
        build(lp, l, mid);
        build(rp, mid+1, r);
        pull(p);
    }
        
    void update(int p, int l, int r, int x, ll v){ // 单点修改 (赋值)
        if(l == r){
            sum[p] = v;
            return;
        }
        push(p, l, r);
        int mid = (l + r) >> 1;
        if(x <= mid) update(lp, l, mid, x, v);
        else update(rp, mid+1, r, x, v);
        pull(p);
    }
    void update(int p, int l, int r, int x, int y, ll v){ // 区间修改
        if(x <= l && r <= y){
            lazy(p, r - l + 1, v);
            return;
        }

        int mid = l + r >> 1;
        push(p, l, r);
        if(x <= mid) update(lp, l, mid, x, y, v);
        if(y >= mid + 1) update(rp, mid + 1, r, x, y, v);
        pull(p);
    }
    ll query(int p, int l, int r, int x, int y){  // 区间查询
        if(x <= l && r <= y) return sum[p];

        ll ans = 0;
        int mid = (l + r) >> 1;
        push(p, l, r);

        if(x <= mid) ans += query(lp, l, mid, x, y);
        if(y >= mid + 1) ans += query(rp, mid + 1, r, x, y);

        return ans;
    }

    void update(int x, ll v){ update(1, 0, n, x, v); } // 单点修改
    void update(int L, int R, ll v){ update(1, 0, n, L, R, v); } // 区间更新
    ll query(int L, int R){ return query(1, 0, n, L, R); } // 区间查询
};
```

> 区间加 (ai+v) | 区间最值

```cpp
struct SegTree{
    int n;
    vector<ll> a;
    vector<ll> add;
    vector<ll> ma;

    #define lp (p << 1)
    #define rp (p << 1 | 1)
    #define lk (mid - l + 1)
    #define rk (r - mid)
    
    void init(int n_){
        n = n_;
        add = vector<ll>(n+1 << 2);
        ma = vector<ll>(n+1 << 2, -inf);
    }
    void init(int n_, const vector<ll>& a_){
        n = n_; a = a_;
        add = vector<ll>(n+1 << 2);
        ma = vector<ll>(n+1 << 2, -inf);
        build(1, 0, n);
    }

    void lazy(int p, int k, ll v){ // 区间全覆盖 -> lazy 信息
        ma[p] += v;
        add[p] += v;
    }
    void pull(int p){
        ma[p] = max(ma[lp], ma[rp]);
    }
    void push(int p, int l, int r){
        if(add[p] == 0) return;
        int mid = l + r >> 1;
        lazy(lp, lk, add[p]);
        lazy(rp, rk, add[p]);
        add[p] = 0;
    }
    void build(int p, int l, int r){
        if(l == r){
            ma[p] = a[l]; // return
            return;
        }

        int mid = (l + r) >> 1;
        build(lp, l, mid);
        build(rp, mid+1, r);
        pull(p);
    }

    void update(int p, int l, int r, int x, ll v){
        if(l == r){
            ma[p] = v;
            add[p] = 0;
            return;
        }
        int mid = (l + r) >> 1;
        push(p, l, r);
        if(x <= mid) update(lp, l, mid, x, v);
        else update(rp, mid + 1, r, x, v);
        pull(p);
    }
    void update(int p, int l, int r, int x, int y, ll v){
        if(x <= l && r <= y){
            lazy(p, r - l + 1, v);
            return;
        }

        int mid = l + r >> 1;
        push(p, l, r);
        if(x <= mid) update(lp, l, mid, x, y, v);
        if(y >= mid + 1) update(rp, mid + 1, r, x, y, v);
        pull(p);
    }
    ll query(int p, int l, int r, int x, int y){  // p - [l, r];
        if(x <= l && r <= y) return ma[p];

        ll ans = -inf;
        int mid = (l + r) >> 1;
        push(p, l, r);

        if(x <= mid) ans = max(ans, query(lp, l, mid, x, y));
        if(y >= mid + 1) ans = max(ans, query(rp, mid + 1, r, x, y));

        return ans;
    }

    void update(int X, ll V){ update(1, 0, n, X, V); }
    void update(int L, int R, ll V){ update(1, 0, n, L, R, V); }
    ll query(int L, int R){ return query(1, 0, n, L, R); }
};
```

> 区间加 | 区间最值&个数

```cpp
struct SegTree{ 
    int n;
    vector<ll> a; // 原始数组
    vector<ll> add, mi; // tag , info
    vector<int> cnt;

    #define lp (p << 1)
    #define rp (p << 1 | 1)
    #define lk (mid - l + 1)
    #define rk (r - mid)
    
    void init(int n_){
        n = n_;
        cnt = vector<int>(n+1 << 2, -1);
        a = add = vector<ll>(n+1 << 2);
        mi = vector<ll>(n+1 << 2, inf);
        build(1, 0, n);
    }
    void init(int n_, const vector<ll>& a_){
        n = n_; a = a_;
        cnt = vector<int>(n+1 << 2, -1);
        add = vector<ll>(n+1 << 2);
        mi = vector<ll>(n+1 << 2, inf);
        build(1, 0, n);
    }

    void lazy(int p, int k, ll v){ // 区间全覆盖 -> lazy 信息
        mi[p] += v;
        add[p] += v;
    }
    void pull(int p){
        mi[p] = min(mi[lp], mi[rp]);
        if(mi[lp] < mi[rp]) cnt[p] = cnt[lp];
        if(mi[lp] > mi[rp]) cnt[p] = cnt[rp];
        if(mi[lp] == mi[rp]) cnt[p] = cnt[lp] + cnt[rp];
    }
    void push(int p, int l, int r){
        if(add[p] == 0) return;
        int mid = l + r >> 1;
        lazy(lp, lk, add[p]);
        lazy(rp, rk, add[p]);
        add[p] = 0;
    }
    void build(int p, int l, int r){
        if(l == r){
            mi[p] = a[l]; // return
            cnt[p] = 1;
            return;
        }

        int mid = l + r >> 1;
        build(lp, l, mid);
        build(rp, mid+1, r);
        pull(p);
    }

    void update(int p, int l, int r, int x, ll v){
        if(l == r){
            mi[p] = v;
            return;
        }
        int mid = l + r >> 1;
        push(p, l, r);
        if(x <= mid) update(lp, l, mid, x, v);
        else update(rp, mid+1, r, x, v);
        pull(p);
    }
    void update(int p, int l, int r, int x, int y, ll v){
        if(x <= l && r <= y){
            lazy(p, r - l + 1, v);
            return;
        }

        int mid = l + r >> 1;
        push(p, l, r);
        if(x <= mid) update(lp, l, mid, x, y, v);
        if(y >= mid + 1) update(rp, mid + 1, r, x, y, v);
        pull(p);
    }
    pair<ll, int> query(int p, int l, int r, int x, int y){
        if(x <= l && r <= y) return {mi[p], cnt[p]};
        
        int mid = l + r >> 1;
        push(p, l, r);

        ll mil = inf, mir = inf;
        int cl = 0, cr = 0;
        if(x <= mid){
            auto [t1, t2] = query(lp, l, mid, x, y);
            mil = t1;
            cl = t2;
        }
        if(y >= mid + 1){
            auto[t1, t2] = query(rp, mid+1, r, x, y);
            mir = t1;
            cr = t2;
        }

        if(mil < mir) return {mil, cl};
        if(mil > mir) return {mir, cr};
        return {mil, cl + cr};
    }

    void update(int X, ll V){ update(1, 0, n, X, V); } // 单点更新
    void update(int L, int R, ll V){ update(1, 0, n, L, R, V); } // 区间加
    pair<ll, int> query(int L, int R){ return query(1, 0, n, L, R); } // 最小值&个数
};
```

> 区间乘 (ai*v) | 区间和

```c++
struct SegTree{ // 0-idx
    int n;
    vector<ll> a;
    vector<ll> mul; // tag
    vector<ll> sum; // info

    #define lp (p << 1)
    #define rp (p << 1 | 1)
    #define lk (mid - l + 1)
    #define rk (r - mid)
    
    void init(int n_){
        n = n_;
        sum = vector<ll>(n+1 << 2);
        mul = vector<ll>(n+1 << 2, 1);
    }
    void init(int n_, const vector<ll>& a_){
        n = n_; a = a_;
        sum = vector<ll>(n+1 << 2);
        mul = vector<ll>(n+1 << 2, 1);
        build(1, 0, n);
    }

    void lazy(int p, ll v){
        sum[p] = sum[p] * v;
        mul[p] = mul[p] * v;
    }
    void pull(int p){
        sum[p] = sum[lp] + sum[rp];
    }
    void push(int p, int l, int r){
        if(mul[p] == 1) return;
        int mid = l + r >> 1;
        lazy(lp, mul[p]);
        lazy(rp, mul[p]);
        mul[p] = 1;
    }
    void build(int p, int l, int r){
        mul[p] = 1;
        if(l == r){
            sum[p] = a[l];
            return;
        }

        int mid = l + r >> 1;
        build(lp, l, mid);
        build(rp, mid+1, r);
        pull(p);
    }
    
    void update(int p, int l, int r, int x, int y, ll v){ // 区间修改
        if(x <= l && r <= y){
            lazy(p, v);
            return;
        }

        int mid = l + r >> 1;
        push(p, l, r);
        if(x <= mid) update(lp, l, mid, x, y, v);
        if(y >= mid + 1) update(rp, mid + 1, r, x, y, v);
        pull(p);
    }
    ll query(int p, int l, int r, int x, int y){ // 区间查询
        if(x <= l && r <= y) return sum[p];
        
        ll ans = 0;
        int mid = l + r >> 1;
        push(p, l, r);
        if(x <= mid) ans += query(lp, l, mid, x, y);
        if(y >= mid+1) ans += query(rp, mid+1, r, x, y);        
        return ans;
    }

    void update(int L, int R, ll v){ update(1, 0, n, L, R, v); } // 区间更新
    ll query(int L, int R){ return query(1, 0, n, L, R); } // 区间查询
};
```

> 区间最值更新 ( ai=min(ai, v) ) | 区间最值

```cpp
struct SegTree{
    int n;
    vector<ll> a; // 原始数组
    vector<ll> info, mi; // tag , info

    #define lp (p << 1)
    #define rp (p << 1 | 1)
    #define lk (mid - l + 1)
    #define rk (r - mid)
    
    void init(int n_){
        n = n_;
        info = vector<ll>(n+1 << 2, inf);
        mi = vector<ll>(n+1 << 2, inf);
    }
    void init(int n_, const vector<ll>& a_){
        n = n_; a = a_;
        info = vector<ll>(n+1 << 2, inf);
        mi = vector<ll>(n+1 << 2, inf);
        build(1, 0, n);
    }

    void lazy(int p, int k, ll v){
        mi[p] = min(mi[p], v);
        info[p] = min(info[p], v);
    }
    void pull(int p){
        mi[p] = min(mi[lp], mi[rp]);
    }
    void push(int p, int l, int r){
        if(info[p] == inf) return;
        int mid = l + r >> 1;
        lazy(lp, lk, info[p]);
        lazy(rp, rk, info[p]);
        info[p] = inf;
    }
    void build(int p, int l, int r){
        if(l == r){
            mi[p] = a[l]; // return
            return;
        }
        int mid = (l + r) >> 1;
        build(lp, l, mid);
        build(rp, mid+1, r);
        pull(p);
    }

    void update(int p, int l, int r, int x, ll v){
        if(l == r){
            mi[p] = v;
            return;
        }
        int mid = l + r >> 1;
        push(p, l, r);
        if(x <= mid) update(lp, l, mid, x, v);
        else update(rp, mid+1, r, x, v);
        pull(p);
    }
    void update(int p, int l, int r, int x, int y, ll v){
        if(x <= l && r <= y){
            lazy(p, r - l + 1, v);
            return;
        }
        int mid = l + r >> 1;
        push(p, l, r);
        if(x <= mid) update(lp, l, mid, x, y, v);
        if(y >= mid + 1) update(rp, mid + 1, r, x, y, v);
        pull(p);
    }

    ll query(int p, int l, int r, int x, int y){  // p - [l, r];
        if(x <= l && r <= y) return mi[p];

        ll ans = inf;
        int mid = (l + r) >> 1;
        push(p, l, r);

        if(x <= mid) ans = min(ans, query(lp, l, mid, x, y));
        if(y >= mid + 1) ans = min(ans, query(rp, mid + 1, r, x, y));

        return ans;
    }

    void update(int X, ll V){ update(1, 0, n, X, V); } // 单点修改
    void update(int L, int R, ll V){ update(1, 0, n, L, R, V); } // 区间更新最值
    ll query(int L, int R){ return query(1, 0, n, L, R); } // 区间最值
};
```

> 无区间修改 | 区间乘积

```cpp
struct SegTree{
    int n;
    vector<ll> a;
    vector<ll> prod; // info

    #define lp (p << 1)
    #define rp (p << 1 | 1)
    #define lk (mid - l + 1)
    #define rk (r - mid)
    
    void init(int n_){ // init[0, n_];
        n = n_;
        prod = vector<ll>(n+1 << 2, 1);
    }
    void init(int n_, const vector<ll>& a_){
        n = n_; a = a_;
        prod = vector<ll>(n+1 << 2, 1);
        build(1, 0, n);
    }

    void pull(int p){
        prod[p] = prod[lp] * prod[rp];
    }
    void build(int p, int l, int r){
        if(l == r){
            prod[p] = a[l];
            return;
        }
        int mid = l + r >> 1;
        build(lp, l, mid);
        build(rp, mid+1, r);
        pull(p);
    }

    void update(int p, int l, int r, int x, ll v){
        if(l == r){
            prod[p] = v;
            return;
        }
        int mid = l + r >> 1;
        if(x <= mid) update(lp, l, mid, x, v);
        else update(rp, mid+1, r, x, v);
        pull(p);
    }

    ll query(int p, int l, int r, int x, int y){ // 区间查询
        if(x <= l && r <= y) return prod[p];
        
        ll ans = 1;
        int mid = l + r >> 1;
        if(x <= mid) ans *= query(lp, l, mid, x, y);
        if(y >= mid+1) ans *= query(rp, mid+1, r, x, y);        
        return ans;
    }

    void update(int x, ll v){ update(1, 0, n, x, v); } // 单点修改
    ll query(int L, int R){ return query(1, 0, n, L, R); } // 区间查询
};
```

> 矩阵 -> 单点修改 | 区间乘积

```cpp
template <const int M>
struct SegTree{
    int n;
    vector<matrix> a; // a[0] 必须初始化 !
    vector<matrix> prod; // info

    #define lp (p << 1)
    #define rp (p << 1 | 1)
    #define lk (mid - l + 1)
    #define rk (r - mid)
    
    void init(int n_){ // init[0, n_];
        n = n_;
        prod = vector<matrix>(n+1 << 2, matrix(M));
    }
    void init(int n_, const vector<matrix>& a_){
        n = n_; a = a_;
        prod = vector<matrix>(n+1 << 2, matrix(M));
        build(1, 0, n);
    }

    void pull(int p){
        prod[p] = prod[lp] * prod[rp];
    }
    void build(int p, int l, int r){
        if(l == r){
            prod[p] = a[l];
            return;
        }
        int mid = l + r >> 1;
        build(lp, l, mid);
        build(rp, mid+1, r);
        pull(p);
    }

    void update(int p, int l, int r, int x, matrix& mat){
        if(l == r){
            prod[p] = mat;
            return;
        }
        int mid = l + r >> 1;
        if(x <= mid) update(lp, l, mid, x, mat);
        else update(rp, mid+1, r, x, mat);
        pull(p);
    }

    matrix query(int p, int l, int r, int x, int y){ // 区间查询
        if(x <= l && r <= y) return prod[p];
        
        matrix ansl(M), ansr(M);
        int mid = l + r >> 1;
        if(x <= mid) ansl = query(lp, l, mid, x, y);
        if(y >= mid+1) ansr = query(rp, mid+1, r, x, y);        
        return ansl * ansr;
    }

    void update(int x, matrix v){ update(1, 0, n, x, v); } // 单点修改
    matrix query(int L, int R){ return query(1, 0, n, L, R); } // 区间查询
};
```

### 可持久化线段树

```cpp
struct PresidentTree{
    int n, tot;
    vector<int> root, lp, rp, cnt;

    void init(int n_){
        tot = 0;
        n = n_;
        root = vector<int>(n + 1);
        lp = rp = cnt = vector<int>(4*n + 17*n);
    }
    
    void insert(int fa, int &u, int l, int r, int x){ // 父版本指针&新版指针
        u = ++tot;
        lp[u] = lp[fa], rp[u] = rp[fa];
        cnt[u] = cnt[fa] + 1;
        
        if(l == r) return;

        int mid = l + r >> 1;
        if(x <= mid) insert(lp[fa], lp[u], l, mid, x);
        else insert(rp[fa], rp[u], mid + 1, r, x);
    }
    
    int kth(int u, int v,int l, int r, int k){
        if(l == r) return l;
        int x = cnt[lp[v]] - cnt[lp[u]]; // 左子数量
        int mid = l + r >> 1;
        if(k <= x) return kth(lp[u], lp[v], l, mid, k);
        else return kth(rp[u], rp[v], mid+1, r, k-x);
    }
};
```

### 矩阵

来自 **Masttf** XCPC 板子
{% link XCPC 板子, Masttf, https://epiphyllum.masttf.fun/post/XCPC, https://cdn.amiracle.site/masttf_avatar.jpg %}

> (+, x)

```cpp
constexpr int inf = 0x3f3f3f3f;
template <class T, const int M>
struct Matrix{
    T m[M][M];
    int row, col;
    Matrix(){};
    Matrix(int n){ // 单位矩阵
        row = col = n;
        for(int i = 0; i < n; i++){
            for(int j = 0; j < n; j++){
                if(i == j)m[i][j] = 1;
                else m[i][j] = 0;
            }
        }
    }
    Matrix(int r, int c){ // 全 0 矩阵
        row = r;
        col = c;
        for(int i = 0; i < row; i++){
            for(int j = 0; j < col; j++){
                m[i][j] = 0;
            }
        }
    }
    Matrix(vector<vector<T>> a){
        row = a.size();
        col = a[0].size();
        for(int i = 0; i < row; i++){
            for(int j = 0; j < col; j++){
                m[i][j] = a[i][j];
            }
        }
    }
    Matrix operator * (const Matrix &y) const { // (+, x)
        Matrix res(row, y.col);
        for(int i = 0; i < row; i++){
            for(int j = 0; j < y.col; j++){
                for(int k = 0; k < col; k++){
                    res.m[i][j] += m[i][k] * y.m[k][j];
                }
            }
        }
        return res;
    }
    Matrix qpow (long long b){
        Matrix res(row);
        Matrix a = *this;
        while(b){
            if(b & 1) res = res * a;
            b >>= 1;
            a = a * a;
        }
        return res;
    }
    friend ostream &operator<<(ostream &os, const Matrix &a) {
        for(int i = 0; i < a.row; i++){
            for(int j = 0; j < a.col; j++){
                os << a.m[i][j] << ' ';
            }
            os << '\n';
        }
        return os;
    }
};
using matrix = Matrix<type, size>;
```

> (max, +)

```cpp
constexpr int inf = 0x3f3f3f3f;
template <class T, const int M>
struct Matrix{
    T m[M][M];
    int row, col;
    Matrix(){};
    Matrix(int n){ // (max, +)单位矩阵
        row = col = n;
        for(int i = 0; i < n; i++){
            for(int j = 0; j < n; j++){
                if(i == j)m[i][j] = 0;
                else m[i][j] = -inf;
            }
        }
    }
    Matrix(int r, int c){
        row = r;
        col = c;
        for(int i = 0; i < row; i++){
            for(int j = 0; j < col; j++){
                m[i][j] = -inf;
            }
        }
    }
    Matrix(vector<vector<T>> a){
        row = a.size();
        col = a[0].size();
        for(int i = 0; i < row; i++){
            for(int j = 0; j < col; j++){
                m[i][j] = a[i][j];
            }
        }
    }
    Matrix operator * (const Matrix &y) const { // (max, +)
        Matrix res(row, y.col);
        for(int i = 0; i < row; i++){
            for(int j = 0; j < y.col; j++){
                for(int k = 0; k < col; k++){
                    res.m[i][j] = max(res.m[i][j], m[i][k] + y.m[k][j]);
                }
            }
        }
        return res;
    }
    Matrix qpow (long long b){
        Matrix res(row);
        Matrix a = *this;
        while(b){
            if(b & 1) res = res * a;
            b >>= 1;
            a = a * a;
        }
        return res;
    }
    friend ostream &operator<<(ostream &os, const Matrix &a) {
        for(int i = 0; i < a.row; i++){
            for(int j = 0; j < a.col; j++){
                os << a.m[i][j] << ' ';
            }
            os << '\n';
        }
        return os;
    }
};
using matrix = Matrix<type, size>;
```

<div style="page-break-after:always"></div>

## 杂项

### int128 运算符重载

```cpp
ostream& operator << (ostream& os, i128 x){
    if(x == 0) return os << '0';
    if(x < 0) os << '-';
    string s;
    while(x){
        s.push_back('0' + x%10 * (x<0?-1:1));
        x /= 10;
    }
    reverse(s.begin(), s.end());
    return os << s;
}
```

### ZInt 支持除 0

```cpp
// 可以处理 inv(0) 的情况
struct ZInt {
    ll prod = 1;
    int cnt = 0;
    void operator *= (ll x){
        x %= mo;
        if(x == 0) cnt++;
        else prod*=x, prod%=mo;
    }
    void operator /= (ll x){
        x %= mo;
        if(x == 0) cnt--;
        else prod*=inv(x), prod%=mo;
    }
    ll get(){ return (cnt? 0:prod); }
};
```

### 取模类(极简)

来自 **ysj**

```cpp
struct Z {
    ll x;
    Z(ll _x = 0) : x(_x % mo) { if(x < 0) x += mo; }
    Z operator + (Z o) { return x + o.x; }
    Z operator - (Z o) { return x - o.x; }
    Z operator * (Z o) { return x * o.x; }
    Z operator / (Z o) { return x * inv(o.x); }
};
```

### 取模类(常数优化版)

```cpp
struct Z {
    ll x;
    Z(ll _x = 0) : x(_x) {
        if(-mo<=x && x<2*mo){
            if(x < 0) x += mo;
            if(x >= mo) x -= mo;
        }
        else{
            x %= mo;
            if(x<0) x += mo;
        }
    }
    Z operator + (Z o) { return x + o.x; }
    Z operator - (Z o) { return x - o.x; }
    Z operator * (Z o) { return x * o.x; }
    Z operator / (Z o) { return x * inv(o.x); }
};
```

### 随机数生成

> 直接生成 64 位随机数

```cpp
ull seed = chrono::steady_clock::now().time_since_epoch().count();
mt19937_64 rng(seed);
ull x = rng();
```

> [lo, hi] 范围随机数

```cpp
ull seed = chrono::steady_clock::now().time_since_epoch().count();
mt19937 rng(seed);

// int 范围
uniform_int_distribution<int> dist_int(lo, hi);
int x = dist_int(rng);
// ll 范围
uniform_int_distribution<long long> dist_ll(lo, hi);
long long x = dist_ll(rng);
```

### 防卡hash

``` cpp
// 防卡 hash
// unordered_map<int, int, custom_hash> mp;
struct custom_hash {
    static ull splitmix64(ull x) {
        // http://xorshift.di.unimi.it/splitmix64.c
        x += 0x9e3779b97f4a7c15;
        x = (x ^ (x >> 30)) * 0xbf58476d1ce4e5b9;
        x = (x ^ (x >> 27)) * 0x94d049bb133111eb;
        return x ^ (x >> 31);
    }

    size_t operator()(ull x) const {
        static const ull seed = chrono::steady_clock::now().time_since_epoch().count();
        return splitmix64(x + seed);
    }
};
```
