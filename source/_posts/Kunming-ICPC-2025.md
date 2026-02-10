---
title: Kunming ICPC 2025 B.Blocks
date: 2025-10-06 20:44:08
updated: 2025-10-08
tags:
  - XCPC
  - dp
  - 容斥
  - 期望
cover: https://cdn.amiracle.site/cutee.jpg
categories: XCPC
---



### [B.Blocks](https://qoj.ac/contest/1870/problem/9850)

**题意:**

平面上有 ${n}$ 个方块, 给出左上右下角坐标, ${(x_1,\;y_1),\;(x_2,\; y_2)}$

不断重复以下操作

- 随机选任意一个 (可能重复选同一个)
- 将该方块涂黑

一直操作直到 ${[0,\; 0] \times [W,\;H]}$ 的区域被完全涂黑

求操作期望次数

${(n \le 10,\;x,\;y,\;W,H\le1e9)}$

&nbsp;

**解析:**

${n}$ 很小, 容易想到状压 dp

定义 ${dp_S\;\to}$ 从状态 S 到完全染黑的期望次数，S 中的 1 代表该矩形选过

&nbsp;

**期望 dp 方程化简**

- 若染色已经完成, 则期望步数为 0, ${dp_S = 0}$

- 选到已选过的矩形, 概率 ${\frac{x}{n}}$, 形成环, 移项即可解决

- 令 S 为当前的状态, ${x}$ 为 S 中 1 的个数

  
$$
\begin{align*}
  dp_S = \frac{x}{n} dp_S + \frac{1}{n}\sum_{S \subseteq T,\;|T|=|S|+1}dp_T + 1
  \end{align*}
$$

$$
\begin{align*}
  (1-\frac{x}{n})dp_S = \frac{1}{n}\sum_{S \subseteq T,\;|T|=|S|+1}dp_T + 1
  \end{align*}
$$

$$
\begin{align*}
    dp_S = (\frac{1}{n}\sum_{S \subseteq T,\;|T|=|S|+1}dp_T + 1)(\frac{n}{n-x})
    \end{align*}
$$

&nbsp;

**判断已经全部染黑**

提供两种方法

**1. 二维离散+二维差分: **

不难发现大部分区域都是无用的, 对 x, y 轴分别离散即可

离散后大概只有 21 行/列

现在想要 ${[x_1, \;y_1]\times [x_2,\; y_2]}$ 的矩形区域 +1

离散后范围较小, 可以直接暴力对矩形区域 +1

之后暴力判断是否全 !0 即可

&nbsp;

这里用二维差分进行优化

*二维差分原理:*

首先我们知道对 ${diff(x,\;y)}$ +1 的效果是 ${(x,\;y)}$ 右下角区域都 +1

所有就有此方法:

1. ${(x_1,\; y_1)}$ +1 让右下角都 +1
2. $({x_2+1,\; y_1})$ -1, 这样就删掉了一部分多的
3. ${(x_1, y_2+1)}$ -1, 也删掉了一部分多的
4. ${(x_2+1,\; y_2+1)}$ +1 修正即可, 补上多减的 1

也就是对 4 个点进行修改

```cpp
diff[x1][y1]++, diff[x2+1][y2+1]++, diff[x2+1][y1]--, diff[x1][y2+1]--;
```

最后二维前缀和即可

总时间复杂度 ${O(sz_x \cdot sz_y + n)}$

&nbsp;

<!-- <u>*注意*</u> -->

{% note info simple %} 注意：*区域的完全覆盖，不等价于点完全覆盖* {% endnote %}

一个简单的反例是:

<img src="https://cdn.amiracle.site/%E7%82%B9%E8%A6%86%E7%9B%96.png" style="zoom:50%;" />

这种情况 ${[0,\;0] \times [5,\;5]}$ 所有整数点都覆盖了，但整个区域明显没有完全覆盖

&nbsp;

*解决办法:*

我们可以把 ${(x,\; y)}$ 当作格子的坐标

区域就变成了 ${[\;(x_1, y_1),\; (x_2,\;y_2)\;)}$  (也就是${\;(x_1,\;y_1)\text{到}\;(x_2-1,\;y_2-1)}$ 的所有格子)

即 ${(x_2,\;y_2)}$ 被当作一个开点

然后完全覆盖就等价于 mat 目标范围全 !0



&nbsp;

**2. 容斥算面积:**

<sub>(怎么还有这种方法)</sub>

容斥公式: 
$$
\begin{align*}
\bigcup_{i \in mask} A_i = \sum_{S\subseteq mask} (-1)^{|S|+1}|\bigcap_{i \in S} A_i|
\end{align*}
$$
```c++
// 计算交集
int full = (1 << n) - 1;
vector<ll> cap(1 << n);
for(int mask=1; mask<=full; mask++){
    int u = -inf, d = inf, l = -inf, r = inf;
    for(int p=0; p<n; p++){
        if(!(mask >> p & 1)) continue;
        auto [x1, y1, x2, y2] = pt[p];
        u = max(u, x1);
        d = min(d, x2);
        l = max(l, y1);
        r = min(r, y2);
    }
    cap[mask] = max(0ll, 1ll * (d - u + 1) * (r - l + 1));
}

// 计算面积并 // 可以用 SOS dp 优化成 O(n*2^n)
vector<ll> cup(1 << n);
for(int mask=1; mask<=full; mask++){
    for(int S=mask; S; S=mask&(S-1)){
        int x = __builtin_popcount(S);
        cup[mask] += 1ll * (x&1? 1:-1) * cap[S];
    }
}

```

&nbsp;

**MYCODE**

**离散 (181ms)**

```cpp
#include <bits/stdc++.h>
using namespace std;
using ll = long long;

const int mo = 998244353;
 
const int MX = 10;
vector<ll> inv(MX+1);
void init(){ // 预处理逆元
    inv[1] = 1;
    for(int i=2; i<=MX; i++){
        inv[i] = (mo - mo / i) * inv[mo % i] % mo;
    }
}

void solve(){
    int n, W, H;
    cin >> n >> W >> H;
    vector<tuple<int, int, int, int>> pt(n);
    vector<int> xs{0, W}, ys{0, H}; // 记得初始化 (0, 0) (W, H)
    for(auto& [x1, y1, x2, y2] : pt){
        cin >> x1 >> y1 >> x2 >> y2;
        xs.insert(xs.end(), {x1, x2});
        ys.insert(ys.end(), {y1, y2});
    }

    // 对 x轴, y轴 分别离散化
    sort(xs.begin(), xs.end());
    xs.erase(unique(xs.begin(), xs.end()), xs.end());
    sort(ys.begin(), ys.end());
    ys.erase(unique(ys.begin(), ys.end()), ys.end());
    
    for(auto& [x1, y1, x2, y2] : pt){
        x1 = lower_bound(xs.begin(), xs.end(), x1) - xs.begin();
        x2 = lower_bound(xs.begin(), xs.end(), x2) - xs.begin();
        y1 = lower_bound(ys.begin(), ys.end(), y1) - ys.begin();
        y2 = lower_bound(ys.begin(), ys.end(), y2) - ys.begin();
    }
    W = lower_bound(xs.begin(), xs.end(), W) - xs.begin();
    H = lower_bound(ys.begin(), ys.end(), H) - ys.begin();

    // 判断哪些情况可以完成覆盖
    int full = (1 << n) - 1;
    vector<bool> valid(1 << n);
    for(int mask=1; mask<=full; mask++){
        vector<vector<int>> mat(xs.size()+1, vector<int>(ys.size()+1));
        for(int p=0; p<n; p++){
            if(mask >> p & 1){ // 若该位为 1, 则选到此矩形
                auto [x1, y1, x2, y2] = pt[p];
                mat[x1][y1]++;
                mat[x2][y1]--;
                mat[x1][y2]--;
                mat[x2][y2]++;
            }
        }
        for(int i=0; i<=xs.size(); i++){ // 二维前缀和
            for(int j=0; j<=ys.size(); j++){
                if(i) mat[i][j] += mat[i-1][j];
                if(j) mat[i][j] += mat[i][j-1];
                if(i&&j) mat[i][j] -= mat[i-1][j-1];
            }
        }

        bool ok = true; // 判断选到的矩形能否完成覆盖
        for(int i=0; i<W; i++){
            for(int j=0; j<H; j++){
                ok &= (mat[i][j]!=0);
            }
        }
        if(ok) valid[mask] = true;
    }

    if(!valid[full]){
        cout << -1 << '\n';
        return;
    }

    // 期望 dp
    vector<ll> dp(1 << n);
    for(int mask=full; mask>=0; mask--){
        if(valid[mask]) continue; // 已经完成染色, 跳过转移
        for(int p=0; p<n; p++){
            int S = mask | (1 << p);
            if(!(mask >> p & 1)){
                dp[mask] += 1ll * dp[S] * inv[n] % mo;
                dp[mask] %= mo;
            }
        }
        int cnt = __builtin_popcount(mask);
        dp[mask] = 1ll * (dp[mask] + 1) * n * inv[n-cnt] % mo; 
        dp[mask] %= mo;
    }
 
    cout << dp[0] << '\n';
    
}

int main(){
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    init();

    int t = 1; cin >> t;
    while(t--) solve();

    return 0;
}
```

**容斥 (54ms)**

```cpp
#include <bits/stdc++.h>
using namespace std;
using ll = long long;

const int mo = 998244353;
const int inf = 0x3f3f3f3f; 

const int MX = 10;
vector<ll> inv(MX+1);
void init(){ // 预处理逆元
    inv[1] = 1;
    for(int i=2; i<=MX; i++){
        inv[i] = (mo - mo / i) * inv[mo % i] % mo;
    }
}

void solve(){
    int n, W, H;
    cin >> n >> W >> H;
    vector<tuple<int, int, int, int>> pt(n);
    for(auto& [x1, y1, x2, y2] : pt){
        cin >> x1 >> y1 >> x2 >> y2;
    }

    // 计算交集
    int full = (1 << n) - 1;
    vector<ll> cap(1 << n);
    for(int mask=1; mask<=full; mask++){
        int u = 0, d = W, l = 0, r = H; // 这里要限定范围, 不能设 inf
        for(int p=0; p<n; p++){
            if(!(mask >> p & 1)) continue;
            auto [x1, y1, x2, y2] = pt[p];
            u = max(u, x1); // 上界
            d = min(d, x2); // 下界
            l = max(l, y1); // 左界
            r = min(r, y2); // 右界
        }
        // cap[mask] = max(0ll, 1ll * (d - u) * (r - l)); xxx 
        cap[mask] = 1ll * max(0, d-u) * max(0, r-l);
    }

    // 计算面积并 // 可以用 SOS dp 优化成 O(n*2^n)
    vector<ll> cup(1 << n);
    for(int mask=1; mask<=full; mask++){
        for(int S=mask; S; S=mask&(S-1)){
            int x = __builtin_popcount(S);
            cup[mask] += 1ll * (x&1? 1:-1) * cap[S];
        }
    }

    // 判断哪些矩形可以完成覆盖
    vector<bool> valid(1 << n);
    for(int mask=1; mask<=full; mask++){
        valid[mask] = (cup[mask]==1ll*W*H);
    }

    if(!valid[full]){
        cout << -1 << '\n';
        return;
    }

    // 期望 dp
    vector<ll> dp(1 << n);
    for(int mask=full; mask>=0; mask--){
        if(valid[mask]) continue; // 已经完成染色, 跳过转移
        for(int p=0; p<n; p++){
            int S = mask | (1 << p);
            if(!(mask >> p & 1)){
                dp[mask] += 1ll * dp[S] * inv[n] % mo;
                dp[mask] %= mo;
            }
        }
        int cnt = __builtin_popcount(mask);
        dp[mask] = 1ll * (dp[mask] + 1) * n * inv[n-cnt] % mo; 
        dp[mask] %= mo;
    }
 
    cout << dp[0] << '\n';
}

int main(){
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    init();

    int t = 1; cin >> t;
    while(t--) solve();

    return 0;
}
```

vp 时思路假了, 以为只跟个数有关, 因此推了个假的状态转移式 QAQ

&nbsp;

©2025 By [AMIRACLE](http://localhost:4000/)
