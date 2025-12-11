---
title: 浅谈换根 dp
date: 2025-12-11 08:07:28
updated: 2025-12-11 12:07:21
tags:
    - XCPC
    - dp
---

*今日一言 : **Now or Never.***

## 前言
换根 dp，用于解决根不固定的问题。所谓换根 dp，就是先求出一个根的答案，然后让子为根，将贡献由父转移到子，这样就能快速计算 $n$ 个点分别为根时的答案

换根 dp 分为三步 :

1. 先把树拎(lin~~g~~)起来，找一点为根
2. 计算每个子树的贡献
3. 从根开始，由父节点向子节点传递贡献

## [洛谷 P3478](https://www.luogu.com.cn/problem/P3478)
#### **题意**
找一个点，使其到所有节点的距离之和最大

#### **解析**
若选定一根，我们能 $O(n)$ 求出距离之和，但每个节点都要算一次，那岂不是要 $O(n^2)$

换根 dp 的思想可以轻松解决这个问题

先固定一个点为根，令 :

- $siz[u]$ 为子树的大小
- $ans[u]$ 为所有点到 $u$ 的距离之和

我们可以先计算出根节点的答案，然后换根，若 $u \to v$ 进行转移，则转移方程为：

$$
\begin{align*}
ans[v] = ans[u] + (n - siz[v]) - siz[v]
\end{align*}
$$

每次转移的时间复杂度 $O(1)$，从根开始，向子转移，$O(n)$ 即可计算出所有点为根时的 ans，最后求 $max$ 即可

#### **MYCODE**
```cpp
#include <bits/stdc++.h>
using namespace std;

void solve(){
    int n;
    cin >> n;
    vector<vector<int>> gra(n + 1);
    for(int i=1; i<n; i++){
        int u, v;
        cin >> u >> v;
        gra[u].push_back(v);
        gra[v].push_back(u);
    }
    
    vector<ll> dp(n + 1), siz(n + 1), dep(n + 1);
    auto dfs1 = [&](auto&& self, int fa, int u) ->void {
        siz[u] = 1;
        for(int v : gra[u]) if(v != fa){
            dep[v] = dep[u] + 1;
            self(self, u, v);
            siz[u] += siz[v];
        }
    };
    dfs1(dfs1, 0, 1);
    for(int i=1; i<=n; i++) dp[1] += dep[i];

    auto dfs2 = [&](auto&& self, int fa, int u) ->void { 
        for(int v : gra[u]) if(v != fa){
            dp[v] = dp[u] + (n-siz[v]) - siz[v];
            self(self, u, v);
        }
    };
    dfs2(dfs2, 0, 1);

    ll mx = -1, idx = 0;
    for(int i=1; i<=n; i++){
        if(dp[i] > mx){
            mx = dp[i];
            idx = i;
        }
    }
    cout << idx << '\n';
}

int main(){
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int t = 1; //cin >> t;
    while(t--) solve();
    
    return 0;
}
```

## [G - 2022 Guilin CCPC](https://codeforces.com/gym/104008/problem/G)
#### **题意**
给定一棵树，点权为 $a_i$。要选择两条链，可以交叉重叠，但公共部分对答案贡献为 0。求最大的 $ans$

$$
\begin{align*}
ans = \sum_{u \in 链1 \cup 链2, u\notin 链1 \cap 链2}a_u
\end{align*}
$$

#### **解析**

手玩可以发现，仅有两种情况，要么有 1 个交点，要么没有交点。

**第一种情况**

对于点 $u$，其儿子 $v$，找最大的 4 条链即可，链以 $v$ 为端点，且在 $v$ 的子树内

先固定一根，令 :

- $dp1[u]$ $\to$ 在 $u$ 的子树内，以 $u$ 为根对应的最大 4 链之和
- $p1[u][i](i=0,1,2,3)$ $\to$ $u$ 的儿子中，$dp1$ 第 $i$ 大的那个儿子 $v$

先进行树上 dp 求出 $dp1$ 和 $p1$。观察某一个非根节点 $u$，可以发现 $dp1[u]$ 的情况中少考虑了一条来自父亲的最长链，我们可以从上往下走时维护这条链，然后从这 5 条链里找最大的 4 条即可

**第二种情况**

可以将树拆成两个，分别维护最长链

同样固定一根，令 :

- $dp[u]$ $\to$ $u$ 的子树中的最长链
- $p2[u][i](i=0,1)$ $\to$ $u$ 的儿子中，$dp2$ 第 $i$ 的那个儿子 $v$

对于某一个非根节点 $v$，我们有了 $dp2[v]$，还需要在 $v$ 的子树外再找一条最长链。可能是一条链来自父亲，然后和别的链拼接。或者是链不经过点 $u$，在 $u$ 的其他儿子的子树内。几种情况取 $max$ 即可，具体实现参考代码

#### **MYCODE**
```cpp
#include <bits/stdc++.h>
using namespace std;
using ll = long long;

void solve(){
    int n;
    cin >> n;
    vector<int> a(n + 1);
    for(int i=1; i<=n; i++){
        cin >> a[i];
    }
    vector<vector<int>> gra(n + 1);
    for(int i=1; i<n; i++){
        int u, v;
        cin >> u >> v;
        gra[u].push_back(v);
        gra[v].push_back(u);
    }
 
    vector<ll> dp1(n + 1), dp2 = dp1;
    vector<vector<int>> p1(n + 1, vector<int>(4)), p2(n + 1, vector<int>(2));
    // 求出 dp1, dp2, p1, p2
    auto dfs1 = [&](auto&& self, int fa, int u) ->void {
        dp1[u] = dp2[u] = a[u];
        for(int v : gra[u]) if(v != fa){
            self(self, u, v);
            dp1[u] = max(dp1[u], dp1[v] + a[u]);
            dp2[u] = max(dp2[u], dp2[v]);
            int x = v;
            for(int i=0; i<4; i++){
                if(dp1[x] > dp1[p1[u][i]]){
                    swap(x, p1[u][i]);
                }
            }
 
            x = v;
            for(int i=0; i<2; i++){
                if(dp2[x] > dp2[p2[u][i]]){
                    swap(x, p2[u][i]);
                }
            }
        }
        dp2[u] = max(dp2[u], dp1[p1[u][0]] + dp1[p1[u][1]] + a[u]);
    };
    dfs1(dfs1, 0, 1);
 
    ll ans = dp1[p1[1][0]] + dp1[p1[1][1]] + dp1[p1[1][2]] + dp1[p1[1][3]];
    // 换根 dp // d1 为 u 为端点，父方向最长链 // d2 为 u 的父方向的最长链
    auto dfs2 = [&](auto&& self, int fa, int u, ll d1, ll d2) ->void {
        for(int v : gra[u]) if(v != fa){
            ll nd1 = 0, nd2 = 0;
            // 第一种情况
            if(v == p1[u][0]){
                nd1 = max(d1, dp1[p1[u][1]]) + a[u];
            }
            else{
                nd1 = max(d1, dp1[p1[u][0]]) + a[u];
            }
            
            ans = max(ans, dp1[p1[v][0]] + dp1[p1[v][1]] + dp1[p1[v][2]] + max(nd1, dp1[p1[v][3]]));
 
            // 第二种情况
            if(v == p1[u][0]){
                nd2 = max(d1 + dp1[p1[u][1]], dp1[p1[u][1]] + dp1[p1[u][2]]) + a[u];
            }
            else if(v == p1[u][1]){
                nd2 = max(d1 + dp1[p1[u][0]], dp1[p1[u][0]] + dp1[p1[u][2]]) + a[u];
            }
            else{
                nd2 = max(d1 + dp1[p1[u][0]], dp1[p1[u][0]] + dp1[p1[u][1]]) + a[u];
            }
            if(v == p2[u][0]) nd2 = max(nd2, dp2[p2[u][1]]);
            else nd2 = max(nd2, dp2[p2[u][0]]);
            nd2 = max(nd2, d2);
            
            ans = max(ans, dp2[v] + nd2);

            self(self, u, v, nd1, nd2);
        }
    };
    dfs2(dfs2, 0, 1, 0, 0);
 
    cout << ans << '\n';
}
 
int main(){
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
 
    int t = 1; //cin >> t;
    while(t--) solve();
    
    return 0;
}
```