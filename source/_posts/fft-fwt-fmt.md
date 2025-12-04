---
title: FFT-FWT-FMT 学习笔记
date: 2025-10-18 03:06:38
updated: 2025-10-21
tags: 
  - MATH
  - XCPC
  - 普通卷积
  - 子集卷积
  - 位运算卷积
categories: XCPC
---

**前言**：

FWT, FMT 金牌知识点, 现在没必要学来着, 但题看都看了, 就顺便学了吧, 反正是个板子类的东西

( 目前大概都是当板子用了, 只能写写应用, 具体原理是一点不懂得, 我太蒟蒻l )

&nbsp;

## **知识点**

### **FFT - 快速傅里叶变换**

&nbsp;

多项式 ${F(x) = a_0  + a_1x_1 + a_2x_2 \cdots}$，

令 ${f_i}$ 为 ${i}$ 次项系数, 也就是 ${a_i}$

多项式乘法：
$$
\begin{align*}
c_k = \sum_{\substack{k=i+j, 0 \le k \le n+m }}{f_i \cdot g_j}
\end{align*}
$$


&nbsp;

说白了 fft 就是优化普通卷积, 也就是优化多项式乘法的工具

时间复杂度 ${O(nm) \to O(nlog)}$

&nbsp;

[luogu - FFT 模板](https://www.luogu.com.cn/problem/P3803)

**MYCODE**

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

&nbsp;

---

### **FWT - 快速沃尔什变换**

> 位运算卷积

序列长度限定为 ${2^n}$，形式和普通卷积类似：
$$
\begin{align*}
C_k = \sum_{i \oplus j = k} f[i] \cdot g[j]  
\end{align*}
$$
${\oplus \; \text{是} \; and,\; or,\; xor}$ 中的一种

因此函数也有三种

时间复杂度 ${O(2^n \cdot 2^n) \to O(n2^n)}$



&nbsp;

[luogu - FWT 模板](https://www.luogu.com.cn/problem/P4717)

**MYCODE**

```cpp
// 带模版本
#include <bits/stdc++.h>
using namespace std;
using ll = long long;

const int mo = 998244353;

ll qpow(ll a, ll x){ // 注意传入的 a 不可超 int
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

    // A, B 卷积后结果
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

### **FMT - 快速莫比乌斯变换**

> 子集卷积 Fast Möbius Transform

对于两个长度为 ${2^n}$ 的序列
$$
\begin{align*}
c_k = \sum_{\substack{i|j = k \\ i\&k=0}} a_i \cdot b_j
\end{align*}
$$

枚举 ${mask}$, 然后枚举子集和补集, 时间复杂度 ${O(3^n)}$

${FMT}$ 可以优化至 ${O(n^2 2^n)}$

&nbsp;

**MYCODE**

```cpp
#include <bits/stdc++.h>
using namespace std;
using ll = long long;

const int mo = 1e9 + 9;

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
    
    // 卷积后结果 Ci = h[bitcnt(i)][i]

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

*只有板子没有题也是空无一物, 来点题*

### [**2020 ICPC Shenyang - M**](https://codeforces.com/gym/103202/problem/M)

**题意：**

有 ${m}$ 个问题, ${n}$ 份问卷, 每份问卷都包含这 ${m}$ 个问题的调查结果 0 或 1

定义好子集：选中一些问题, 仅关注选中的问题, 使得 ${n}$ 个结果中至少有 k 对是不同的

求好子集的数量

$(1 \le n \le 2 \times 10^5, 1 \le m \le 20, 1 \leq k \leq \frac{n(n-1)}{2})$

&nbsp;

**解析：**

${m}$ 很小, 且仅有 0/1, 考虑状压相关

${k}$ 对结果不同, 这个条件比较抽象, 暴力枚举子集&ij对 ${O(n^2 2^m)}$ 直接 t 飞

&nbsp;

神秘的问题自然有神秘的解决方法

我们不以 ${n}$ 为视角, 然后把视角放在 ${m}$ 上, 纯枚举状态

令差异恰好为 ${S}$

对数贡献式大概是这个样子：
$$
\begin{align*}
diff_{S} = \sum_{\substack{S=x \oplus y \\ S \neq 0}} cnt_x \cdot cnt_y  && (\oplus\text{为异或})
\end{align*}
$$
时间复杂度 ${O(2^m \cdot 2^m)}$, 复杂度也爆炸

&nbsp;

但仔细看这个式子, 不正是位运算卷积么,

我们将对数条件转化为了卷积乘法, 于是就可以愉快的用 FWT 优化了

由 ${O(4^m) \to O(m2^m)}$ 完全可接受



{% note info simple %}

***注意 :** 对于状态 ${(x,\;y)}$, 会在 ${(cnt_x \cdot cnt_y),\;(cnt_y \cdot cnt_x)}$ 分别计算一次, 需要去重*. *对于 ${(x, \; x)}$* 也需要特别处理

{% endnote %}

&nbsp;

令 ${f_S \to}$ 差异恰好为 S 的对数

对于某问题集合 ${S}$, 差异对数:
$$
\begin{align*}
diff_S = \sum_{\substack{S \& T \neq 0}} f_T
\end{align*}
$$
对每一个集合都跑一遍  ${O(3^n)}$, 显然是不行的

&nbsp;

用 ${SOS\; dp}$ 优化 

对于每个集合, 计算其所有子集对数贡献

令：
$$
\begin{align*}
dp_{mask} = \sum_{\substack{S \subseteq mask \\ S \neq 0}} f_S
\end{align*}
$$
<!-- /// 不写了 TAT 2:43:59 -->

然后从反向考虑即可

也就是:
$$
diff_S = \frac{n \cdot (n + 1)}{2} - dp_{full \oplus S}
$$
每个集合可以 ${O(1)}$ 判断

&nbsp;

**MYCODE**

```cpp
#include <bits/stdc++.h>
using namespace std;
using ll = long long;

const int inf = 0x3f3f3f3f;

/*
  不带模 fwt

*/

// 正变换后可能 int -> ll // 且需 n * A <= ll
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
 
void solve(){
    int n, m; ll k;
    cin >> n >> m >> k;
    
    int full = (1 << m) - 1;
    vector<ll> cnt(1 << m);
 
	// 状压 & 计数
    vector<int> a(n);
    for(auto& x : a){
        string s;
        cin >> s;
        for(int i=0; i<m; i++){
            x <<= 1;
            if(s[i] == 'A') x++;
        }
        cnt[x]++;
    }

	// 对 cnt 进行自卷积
    auto f = fwt(cnt, cnt, fwt_xor); // f[stt] -> 差异为 stt 的对数
    f[0] -= n; // 除去 x^x 的情况
    for(int mask=0; mask<=full; mask++) f[mask] /= 2; // 变为统计无序对

	// SOS dp
    auto dp = f;
    for(int p=0; p<m; p++){
        for(int mask=1; mask<=full; mask++){
            if(!(mask >> p & 1)) continue;
            dp[mask] += dp[mask ^ (1<<p)];
        }
    }

	// 枚举集合 S(也就是当前选择的问题集合) 和补集 T
	// 只要有 1 能覆盖到 S, 就有贡献, 所以集合 S 的对数不仅是 dp[S]
    int ans = 0;
    for(int mask=1; mask<=full; mask++){
        if(1ll * n * (n - 1) / 2 - dp[full ^ mask] >= k) ans++;
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

&nbsp;

**Q:** 没有 FMT 例题, 为何呢? **A:** 问就是还没遇到 ( , 莫得办法
