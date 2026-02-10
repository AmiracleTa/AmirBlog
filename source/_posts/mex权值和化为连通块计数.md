---
title: mex 权值和化为连通块计数
date: 2026-02-10 10:35:02
tags:
  - XCPC
cover: https://cdn.amiracle.site/ATRI2.jpg
categories: XCPC
---

### [牛客寒假集训营 4](https://ac.nowcoder.com/acm/contest/120562/D) D-数字积木 题解

#### 题意

给定 n 个节点的树，权值构成一个 [0, n) 的排列，求所有连通块的 mex 权值和

#### 思路

将 mex 权值和 转化为 连通块计数。具体来说，分别统计包括 {0}，{0, 1} ... {0,...,n-1} 的连通块个数，求这些个数之和就等价于求所有连通块的 mex 权值和。

举个例子，若我们有一个 mex=4 的连通块 S，包括 {0, 1, 2, 3, (mex=4), ...} 这些数字。当我们统计包括 {0} 的连通块的个数时，S 会贡献 1，然后是统计 {0, 1}，{0, 1, 2}，{0, 1, 2, 3}，S 也都会贡献 1，一共贡献了 4，正好和其 mex 权值相同

{% p bold, dp 进行连通块计数 %}

令 dp[i] 为 i 必选，i 的子树的连通块个数，每个子节点可选可不选，转移方程为

$$
\begin{align*}
dp[i] = \prod (dp[v]+1)
\end{align*}
$$

{% p bold, 更新集合贡献 %}

若上一次的必选集合是 {0, 1, 2 ... x}，贡献是 lst

现在我们要将 x+1 加入集合，我们从 x+1 开始，不断的向上直到遇到已经必选的点，更新贡献

$$
\begin{align*}
lst \gets lst \times \prod_{u\in path} inv(dp[u]+1) dp[u]
\end{align*}
$$

将经过的点都变成必选点，更新 ans，`ans += lst`

时间复杂度 ${O(nlog(mod))}$

{% note info simple %} 注意：*要特别处理 (dp[u]+1) % mo = 0 的情况* {% endnote %}

#### MYCODE

```cpp
#include <bits/stdc++.h>
using namespace std;
using ll = long long;
using pii = pair<int, int>;

constexpr int inf = 0x3f3f3f3f;
constexpr int mo = 1e9 + 7;

ll qpow(ll a, ll x){
    ll ans = 1;
    while(x){
        if(x & 1) ans *= a;
        a *= a;
        x >>= 1;
        ans %= mo;
        a %= mo;
    }
    return ans;
}

ll inv(int x){
    return qpow(x, mo-2);
}

// 支持除 0，处理 inv(0) 的情况
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

void solve(){
    int n;
    cin >> n;
    vector<int> a(n + 1), id(n);
    for(int i=1; i<=n; i++){
        cin >> a[i];
        id[a[i]] = i;
    }

    ll ans = 0;
    vector<vector<int>> gra(n + 1);
    for(int i=0; i<n-1; i++){
        int u, v;
        cin >> u >> v;
        gra[u].push_back(v);
        gra[v].push_back(u);
    }

    vector<ll> dp(n + 1), p(n + 1);
    auto dfs = [&](auto&& self, int fa, int u) -> void {
        dp[u] = 1;
        p[u] = fa;
        for(int v : gra[u]) if(v != fa){
            self(self, u, v);
            dp[u] *= dp[v] + 1;
            dp[u] %= mo;
        }
    };
    dfs(dfs, 0, id[0]);
    
    ZInt lst;
    lst *= dp[id[0]] + 1;
    vector<bool> vis(n + 1);
    for(int i=0; i<n; i++){
        int x = id[i];
        while(!vis[a[x]]){
            vis[a[x]] = true;
            lst /= dp[x]+1;
            lst *= dp[x];
            // lst *= inv(dp[x]+1) * dp[x] % mo; // dp[x]+1 = 1e9+7 !
            // lst %= mo;
            x = p[x];
        }
        ans += lst.get();
        ans %= mo;
    }
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
