---
title: dp优化(1) - 预处理
date: 2025-10-02 16:24:52
updated: 2025-10-06
tags:
  - XCPC
  - dp
categories: XCPC
---



### [HDU 25春季联赛 - 0 - 1007](https://acm.hdu.edu.cn/contest/problem?cid=1171&pid=1007)

**题意: **

给定长度 ${n}$ 的数组 ${a}$, 

定义 ${[l,\;r]}$ 价值为 ${\bigoplus_{i=l}^{r} a_i} \cdot (r-l+1)$,

定义 ${f(a)\;}$为数组 ${a}$ 划分后的最大价值和,

求 ${\sum_{k=1}^{k=n}f(\{a_1,a_2\cdots a_k\})}$

${(n \le 2e5,\; 0 \le a_i < 1024)}$

&nbsp;

**解析:**

很容易想到 ${n^2}$ dp

${pre}$ 为前缀异或数组

定义 ${dp_i}$ ${\to}$ 用前 ${i}$ 个元素能得到的最大价值

转移方程:
$$
\begin{align*}
dp_i \gets max\{dp_j+ (pre_i \oplus pre_j)(i-j)\} \quad (j < i)
\end{align*}
$$
&nbsp;

复杂度不可接受, 尝试优化

我们拆开式子:
$$
\begin{align*}
dp_j - (pre_i \oplus pre_j) \cdot j + (pre_i \oplus pre_j) \cdot i
\end{align*}
$$
&nbsp;

1.先考虑一个更简单的式子:
$$
\begin{align*}
dp_j - (pre_i \oplus pre_j) \cdot j + pre_i \cdot i
\end{align*}
$$
观察左侧部分: $dp_j - (pre_i \oplus pre_j) \cdot j$

当我们在 ${j}$ 时, 未知量只有 ${pre_i}$

定义 ${g(x) \to max\{ dp_j-(x \oplus pre_j)\cdot j\} }$
我们遍历到 ${j}$ 时, 对所有可能的 ${x}$ 的值进行预处理

转移方程:
$$
\begin{align*}
g(pre_i) + pre_i \cdot i
\end{align*}
$$

由 ${a_i < 1024 }$ 可知 ${x < 1024}$

预处理时间复杂度 ${O(1024)}$


转移复杂度 ${O(1)}$

总时间复杂度 ${O(1024\cdot n)}$

&nbsp;

2.让我们回到原式
$$
\begin{align*}
dp_j - (pre_i \oplus pre_j) \cdot j + (pre_i \oplus pre_j) \cdot i
\end{align*}
$$
类似地

定义 ${g(x,\;y) \to max\{ dp_j-(x \oplus y) \cdot j \}}$ 

进行同样的预处理操作即可

因为 ${pre_j}$ 未知, 我们还需要枚举一下

转移方程:
$$
\begin{align*}
dp_i \gets max_{y=0}^{1023}\{ g(pre_i,\;y) + (pre_i \oplus y) \}
\end{align*}
$$
预处理操作 ${O(1024)}$

转移 ${O(1024)}$

总时间复杂度 ${O(1024 \cdot n)}$

&nbsp;

**MYCODE**

```cpp
#include <bits/stdc++.h>
using namespace std;
using ll = long long;

const ll inf = 1e18;

void solve(){
    int n;
    cin >> n;
    vector<int> a(n + 1), pre = a;
    vector<ll> dp(n + 1, -inf);
    dp[0] = 0;

    for(int i=1; i<=n; i++){
        cin >> a[i];
        pre[i] = pre[i-1] ^ a[i];
    }
    
    // f(pre[j], pre[i]) ,  max( dp[j]-j*(pre[j]*pre[i]) )
    vector<vector<ll>> f(1024, vector<ll>(1024, -inf)); // 记得初始化, ( dp[j]-j*(pre[j]*pre[i]) ) 可能为负
    ll ans = 0;
    for(int i=0; i<=n; i++){ // pre[0] 也要处理
        for(int j=0; j<1024; j++){
            dp[i] = max(dp[i], 1ll * f[j][pre[i]] + i*(j^pre[i]));
        }
        for(int k=0; k<1024; k++){ // 对于 pre[i] 预处理出所有 f[pre[i]][0...1023]
            f[pre[i]][k] = max(f[pre[i]][k], dp[i]-i*(pre[i]^k));
        }
        ans += dp[i];
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

