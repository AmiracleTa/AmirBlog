---
title: 状压dp整理
date: 2025-09-29 01:10:25
updated: 2025-09-29
tags: 
  - ACM整理总结
  - XCPC
  - dp
categories: XCPC
# cover: https://cdn.amiracle.site/voidRE%EF%BC%9Aera.jpg
cover: https://cdn.amiracle.site/%E4%BC%8A%E9%9B%B7%E5%A8%9C.jpg
---





### **前置知识 - 状压 dp：**

${(2^{20} \approx 1e6，3^{17}\approx 1e8)}$

&nbsp;

**1. SOS DP - 子集和 dp：**

${每个集合有一个权值 f(S)，我们想求集合 \;S\; 所有子集的权值和\;dp_S，即}$
$$
\begin{align*}
dp(S)=\sum_{sub \subseteq S}f(sub)
\end{align*}
$$
<sub>(注意：每个子集有且仅有一次贡献)</sub>

&nbsp;

${若暴力求解，枚举 S，然后枚举 sub，时间复杂度\;O(3^n)}$

${SOS\;dp：先枚举位，让所有集合逐位转移，时间复杂度\;O(n\cdot 2^n)}$

[[理解参考]](https://www.cnblogs.com/maple276/p/17975253)

**参考代码**

```cpp
// f(S) 权值数组已知
dp = f; // 赋初值
for(int p=0; p<20; p++){ // 先枚举位
    for(int S=1; S<=full; S++){ // 再枚举所有集合
        if(S >> p & 1){
            dp[S] += dp[S ^ (1 << p)];
        }
    }
}
```

&nbsp;

**2. 子集划分 dp**

${时间复杂度\;O(3^n)}$

大致操作是枚举 mask，然后枚举子集 S，和补集 T

然后 merge(S, T)

和区间 dp 一样，可以找出最优合并顺序

&nbsp;

---

### [HDU-Summer 2025 1-1003](https://acm.hdu.edu.cn/contest/problem?cid=1172&pid=1003)

**题意：**

${n\;个元素，元素状态\;stt，有一位 \;1\; 被满足则该元素满足，满足某位\;1\;花费\;w_i，满足所有元素的\;min\;cost}$

${(sz(stt) \le 17,\; \sum n\le3000,\; t\le100)}$

&nbsp;

**解析：**

我们反向考虑，考虑不合法，也就是存在某元素不满足

元素不满足，则其超集也不满足，dp 去标记

没被标记的都是满足的

从满足里找最优即可

&nbsp;

---

```cpp
#include <bits/stdc++.h>
using namespace std;

void solve(){
    int n; string s;
    cin >> n >> s;
    vector<int> a(17);
    for(int i=0; i<17; i++) cin >> a[i];
    int len = 0;
    cin >> len;

    int full = (1<<17) - 1;
    vector<int> w(1 << 17);
    for(int i=0; i<17; i++) w[1 << i] = a[i];

    auto lowbit = [](int x){
        return x & -x;
    };

    // 预处理普通子集和
    for(int i=0; i<=full; i++){
        w[i] = w[i ^ lowbit(i)] + w[lowbit(i)];
    }

    vector<int> err(1 << 17); // err[S] 表示 S 需要被满足
    len = (len + 1) / 2;
    for(int i=len-1; i+len<n; i++){
        int res = 0;
        bool flg = false;
        for(int j=1; j<=len; j++){
            flg |= (s[i-j+1] == s[i+j]);
            res |= (1 << (min(s[i-j+1], s[i+j]) - 'a'));
        }
        if(flg) continue;
        err[res] = true;        
    }

	// 标记超集
    for(int p=0; p<17; p++){
        for(int i=0; i<=full; i++){
            if(i >> p & 1){
                err[i] = err[i] | err[i ^ (1 << p)] | err[1 << p];
            }
        }
    }

	// 从合法找最优
    int ans = w[full];
    for(int i=0; i<=full; i++){
        if(err[i]) continue;
        int T = full - i;
        ans = min(ans, w[T]);
    }

    cout << ans << '\n';
}

int main(){
	ios::sync_with_stdio(false);
	cin.tie(nullptr);

	int t = 1; cin >> t;
	while(t--) solve();
	
	return 0;
}
```

&nbsp;

---

### [ZJU-Summer 2025 B](https://codeforces.com/group/MIyYz3rj9b/contest/621641)

**题意：**

${有 \;n\; 个人，无数关卡，每个人都要去一个关卡，一个关卡最多 \;l\; 人}$

${第\;i\;人去第\;t\;个关卡的战斗力为\;ai\cdot t+bi，一些人之间存在羁绊，同时在一关可以加战斗力\;d_x，求最大战斗力总和}$

${(n \le 17,\;l\le n,\; m\le 1e5,\;|d_x|\le 1e4)}$

&nbsp;

**解析：**

${对 \;a\;，b\; 算一下普通子集和，即 \;sum_a[S]，sum_b[S]}$

可用 SOS dp 预处理 S 的 攻击力加成

重点在于如何分配关卡

&nbsp;

可用子集划分 dp 枚举所有情况

${merge 时，直接每次都让\;S\;放到第一关，补集\;T\;加上\;sum_a[T]\;表示\;T\;的所有人都后移一关}$

&nbsp;

**MYCODE**

```cpp
#include <bits/stdc++.h>
using namespace std;
using ll = long long;

const ll inf = 1e18;

/*
trick:

  有效枚举 mask 子集
  ++ : (sub+1) | mask
  -- : (sub-1) & mask

  最低位
  __lg(mask & -mask)
  __builtin_ctz(mask); // 末尾 0 的个数 , 可以找最低位

*/

void solve(){
    int n, l, m;
    cin >> n >> l >> m;
    vector<int> a(n), b(n);
    for(int i=0; i<n; i++){
        cin >> a[i] >> b[i];
    }

    vector<ll> stt((1<<n) + 1); // 加成
    for(int i=0; i<m; i++){
        int k; cin >> k;
        int state = 0;
        for(int j=0; j<k; j++){
            int x; cin >> x; x--;
            state += (1 << x);
        }
        int d; cin >> d;
        stt[state] += d;
    }

    int full = (1 << n) - 1; // 全集

    // 预处理 mask 1 的个数
    vector<int> cnt(1<<n); 
    vector<ll> suma(1<<n), sumb(1<<n);
    for(int mask=1; mask<=full; mask++){ // 2^n
        int p = __builtin_ctz(mask);
        int x = mask ^ (1<<p);
        cnt[mask] = cnt[x] + 1;
        suma[mask] = suma[x] + a[p];
        sumb[mask] = sumb[x] + b[p];
    }

    // SOS dp，pre[S] 为 stt 的子集和
    auto pre = stt;
    for(int p=0; p<n; p++){ 
        for(int x=0; x<=full; x++){
            int y = x & (full ^ (1 << p));
            if(x == y) continue;
            pre[x] += pre[y];
        }
    }

    // lst 数组记录路径
    vector<ll> dp((1<<n), -inf), lst = dp;
    dp[0] = lst[0] = 0;
    for(int mask=0; mask<=full; mask++){ 
        for(int x=mask; x; x = (x-1)&mask){ // 枚举 mask 的子集 x，子集补集 y
            if(cnt[x] > l) continue;
            int y = mask ^ x;

            ll cur = dp[y]+suma[y] + suma[x]+sumb[x]+pre[x]; // 把 x 放到第一关，让 y 中所有人后移
            if(dp[mask] < cur){
                dp[mask] = cur;
                lst[mask] = x;
            }
        }
    }

    // 路径回溯
    vector<int> ass(n);
    int cur = 0;
    for(int mask=full; mask; mask^=lst[mask]){ // lst[mask] 就是放的最前的那一组
        ++cur;
        for(int p=0; p<n; p++){
            if(lst[mask] >> p & 1){
                ass[p] = cur;
            }
        }
    }

    cout << dp[full] << '\n';
    for(int i=0; i<n; i++){
        cout << ass[i] << " \n"[i == n-1];
    }

}

int main(){
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int t = 1; //cin >> t;
    while(t--) solve();

    return 0;
}
```

&nbsp;

---

### [ZJU-Summer 2025 F](https://codeforces.com/group/MIyYz3rj9b)

**题意：**

序列 A，B，长度 n, m，每个元素为 (type, v)

1.A 或 B，pop 2 个元素，花费 top.v

2.A 和 B，都 pop 1 个元素，免费

操作 2 最多执行 t 次，要清空 A，B，求 min cost

${(n,m \le 2e5,\;t \le 7,\;type \in \{0, 1\},\;v \le 1e9)}$

&nbsp;

**解析：**

关键的观察，有了操作 2 的 type 序列之后，对 A，B 的操作就可以分开了

&nbsp;

对 A, B 分别进行 dp，进行操作 1，2，同时记录每次操作 2 的 type

${dp[i][j][stt] \to 匹配了[1,\;i]，j\;次\;2\;操作，type\;序列是\;stt \;的\;min\;cost}$

&nbsp;

然后枚举所有 type 序列，把 A，B 的代价 merge 起来就好

&nbsp;

**MYCODE**

```cpp
#include <bits/stdc++.h>
using namespace std;
using ll = long long;

const ll inf = 1e18;

void solve(){
    int n, m, t;
    cin >> n >> m >> t;
    vector<int> a(n + 1), b(n + 1), c(m + 1), d(m + 1);
    for(int i=1; i<=n; i++) cin >> a[i];
    for(int i=1; i<=n; i++) cin >> b[i];
    for(int i=1; i<=m; i++) cin >> c[i];
    for(int i=1; i<=m; i++) cin >> d[i];

    int all = (1 << t) - 1;

    auto get = [&](auto type, auto val){
        vector<vector<ll>> dp0(t+1, vector<ll>(all+1, inf)), dp1 = dp0, dp2 = dp0; // 上一个 , 上上个
        dp1[0][0] = 0;
        int n = type.size()-1;
        // o(n * 2^7 * 7) // 暴力枚举
        for(int i=1; i<=n; i++){
            for(int k=0; k<=t; k++){ 
                for(int s=0; s<=all; s++){
                    // free!! 
                    int ps = (s >> 1);
                    if(k && (ps << 1 | type[i]) == s){ // 可以转移
                        dp0[k][s] = min(dp0[k][s], dp1[k-1][(s>>1) & ((1<<k-1)-1)]);
                    }
                    // cost
                    if(i>=2 && type[i-1]==type[i]){
                        dp0[k][s] = min(dp0[k][s], dp2[k][s] + val[i-1]);
                    }
                }
            }
            // 滚动数组
            dp2.swap(dp1);
            dp1.swap(dp0);

            for(int k=0; k<=t; k++){
                fill(dp0[k].begin(), dp0[k].end(), inf);
            }
        }

        return dp1;
    };

    ll ans = inf;
    auto dpA = get(a, b);
    auto dpB = get(c, d);
    for(int k=0; k<=t; k++){
        for(int s=0; s<=all; s++){
            if(dpA[k][s] == inf || dpB[k][s] == inf) continue;
            ans = min(ans, dpA[k][s] + dpB[k][s]);
        }
    }

    cout << (ans==inf? -1:ans) << '\n';
}

int main(){
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int t = 1; // cin >> t;
    while(t--) solve();

    return 0;
}
```

&nbsp;

---

### [HDU-Summer 2025 6-1008](https://acm.hdu.edu.cn/contest/problem?cid=1177&pid=1008)

**题意：**

${n \cdot m 矩阵，选出 \;k\; 行，p_1 \dots p_k，价值为\; \sum_{i=1}^{m}(max\{a_{p_1,i}\dots a_{p_k,i}\})}$

${k \le n \le 1000,\;m \le 13}$

&nbsp;

**解析：**

不是按 i 转移

按照子集的方向可以去转移 (这个思路完全不熟呐)

&nbsp;

是最大值则为 1，找出所有状态的最大后

子集划分 dp，merge 即可

${dp[stt] \gets merge(dp[S],\;dp[T])}$

${时间复杂度\;O(k \cdot 3^m)}$

&nbsp;

**MYCODE**

```cpp
#include <bits/stdc++.h>
using namespace std;
using ll = long long;

const int inf = 0x3f3f3f3f;

void solve(){
    int n, m, k;
    cin >> n >> m >> k;
    k = min(k, m);
    
    int full = (1 << m) - 1;
    vector<ll> ma(1 << m); // 每种子集的最大子集和
    for(int i=0; i<n; i++){
        vector<int> a(m);
        for(auto& x : a) cin >> x;
        vector<ll> dp(1 << m);
        for(int mask=1; mask<=full; mask++){
            int lo = __lg(mask);
            dp[mask] = dp[mask ^ (1<<lo)] + a[lo];
            ma[mask] = max(ma[mask], dp[mask]);
        }
    }

    vector<vector<ll>> dp(k + 1, vector<ll>(1 << m)); // 合并了 i 个子集 , stt : j
    for(int i=0; i<k; i++){
        for(int mask=1; mask<=full; mask++){
            for(int u=mask; ; u=(u-1)&mask){ // u=0 也需要跑
                int v = mask^u;
                dp[i+1][mask] = max(dp[i+1][mask], dp[i][u] + ma[v]);
                if(!u) break;
            }
        }
    }
    cout << dp[k][full] << '\n';

}

int main(){
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int t = 1; cin >> t;
    while(t--) solve();
    
    return 0;
}
```
