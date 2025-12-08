---
title: XCPC 模板
date: 2025-10-21 15:12:43
updated: 2025-12-08 13:59:55
tags:
  - XCPC
  - ACM整理总结
categories: XCPC
cover: https://cdn.amiracle.site/Nekoha%20Shizuku.png
---

*基于 [WIDA XCPC 模板](https://github.com/hh2048/XCPC), 对其补充和优化*

<!--

1. 清空
2. 边界条件
3. 读题
4. 先独立思考

-->

&nbsp;

# 数论

## 反演

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

####   莫比乌斯反演

  两个函数满足这样的整除 Σ 关系 $f(x) = \sum_{d|x}g(d)$
$$
f(x) = \sum_{d \mid x} g(d) \xrightarrow{\text{反演}} g(x) = \sum_{d \mid x} \mu\!\left(\frac{x}{d}\right) f(d)
$$

#### 二项反演(un)

> 加一个 ${(-1)^{n-i}}$ | ${(-1)^{i-k}}$ 系数

<img src="https://cdn.jsdelivr.net/gh/AmiracleTa/pic-bed/img/%E4%BA%8C%E9%A1%B9%E5%8F%8D%E6%BC%94.png" style="zoom: 67%;" />

<div style="page-break-after:always"></div>

## 卷积

### FFT 快速傅里叶变换

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

### NTT 快速数论变换

> 取模版 FFT

```cpp
#include <bits/stdc++.h>
using namespace std;
using ll = int64_t;
using ull = uint64_t
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

### FWT 快速沃尔什变换

> ${O(nlog)}$ 或者说 ${O(n2^n)}$ 计算 and | or | xor 卷积   (位运算卷积)

$$
\begin{align*}
C_k = \sum_{i \oplus j = k} f[i] \cdot g[i]  
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

### FMT 快速莫比乌斯变换

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

## 预处理 - 逆元 - 组合数

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

## 线筛

```c++
vector<int> pri, mi_fct;
vector<bool> prime;
void sieve(){
    int n = 1e8;
    mi_fct.resize(n + 1);
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


## 极角排序(整数运算，无精度问题)

```cpp
ll cross(int x1, int y1, int x2, int y2){ // 两向量叉积
    return 1ll * x1 * y2 - 1ll * y1 * x2;
}

    // sort(a.begin(), a.end(), rad); // 精度可能不够高
    auto quad = [](int x, int y){ // 第几象限 , 逆时针左闭右开
        if(x > 0 && y >= 0) return 0;
        if(x <= 0 && y > 0) return 1;
        if(x < 0 && y >= 0) return 2;
        return 3;
    };
    // 整数极角排序 , 完全无精度问题
    sort(a.begin(), a.end(), [&](auto x, auto y){
        auto [x1, y1] = x;
        auto [x2, y2] = y;
        int qdx = quad(x1, y1), qdy = quad(x2, y2);
        if(qdx == qdy) return cross(x1, y1, x2, y2)>0; // 期待是逆时针
        return qdx < qdy;
    });
```

## OTHER

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
\sum i^2=\frac{n(n+1)(2n+1)}{2}
$$

#### 组合数常用公式

- $k \cdot C_n^k = n \cdot C_{n-1}^{\,k-1}$
- $C_n^k + C_n^{k+1} = C_{n+1}^{k+1}$ （递推公式, 直接划分成两类）
- $\sum_{i=0}^n C_n^i = 2^n$ （按选几个划分）
- $\sum_{x=m}^{n} {x \choose m} = {n+1 \choose m+1}$ （按最大值划分）
- $\sum_{i=0}^{n} {n \choose i}^2 = {2n \choose n}$

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


<div style="page-break-after:always"></div>

# 数据结构

## 树状数组

```cpp
struct BIT{
    int n;
    vector<ll> tree;
    BIT(int _n) : n(_n){
        tree.resize(n + 1);
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

};
```

## DSU

```cpp
struct DSU{
    vector<int> f, sz;
    void init(int n){
        sz.resize(n + 1, 1);
        f.resize(n + 1);
        iota(f.begin(), f.end(), 0);
    }
    int find(int x){ // 判相同要用 find (same)
        while(x != f[x]) x = f[x] = f[f[x]];
        return x;
    }
    bool merge(int x, int y){ // 左 <- 右
        x = find(x), y = find(y);
        if(x == y) return false;
        f[y] = x;
        sz[x] += sz[y];
        return true;
    }
    bool same(int x, int y){
        return find(x) == find(y);
    }
};
```

## ST表

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

## SegTree

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
    void init(int n_, auto& a_){
        n = n_; a = a_;
        // init tags, info
        tag = vector<ll>(n+1 << 2);
        info = vector<ll>(n+1 << 2);
        // init a
        build(1, 0, n);
    }

    // lazy 区间信息
    void lazy(int p, int k, ll v){ // lazy(int p, ...)
        // tag[p] = ..
        // info[p] = ..
    }
    // merge 区间信息
    void pull(int p){
        // info[p] <- merge(info[lp], info[rp])
    }
    // push 区间标记
    void push(int p, int l, int r){
        // if( no tag ) return;
        int mid = l + r >> 1;
        lazy(lp, lk, info[p]);
        lazy(rp, rk, info[p]);
        // 删除标记
        // init tag[p]
    }

    void build(int p, int l, int r){
        if(l == r){
            info[p] = a[l];
            return;
        }
        int mid = (l + r) >> 1;
        build(lp, l, mid);
        build(rp, mid+1, r);
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
    void update(int p, int l, int r, int x, ll v){ // 单点修改
        if(l == r){
            info[p] += v; // +, *, 赋值
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
        // init ans 为 单位元
        ll ans = 0; 
        int mid = (l + r) >> 1;
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
        sum = add = vector<ll>(n+1 << 2);
    }
    void init(int n_, auto& a_){
        n = n_; a = a_;
        sum = add = vector<ll>(n+1 << 2);
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
    void init(int n_, auto& a_){
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
    void init(int n_, auto& a_){
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
    void init(int n_, auto& a_){
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

    void update(int x, ll v){ update(1, 0, n, x, v); } // 单点修改
    void update(int L, int R, ll v){ update(1, 0, n, L, R, v); } // 区间更新
    ll query(int L, int R){ return query(1, 0, n, L, R); } // 区间查询
};
```


> 区间最值更新 ( ai=max(ai, v) ) | 区间最值

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
    void init(int n_, auto& a_){
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
    void init(int n_, auto& a_){
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
    void init(int n_, auto& a_){
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

## 可持久化线段树

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

## 矩阵

**来自 Masttf XCPC 模板**
{% link XCPC 模板, Masttf, https://epiphyllum.masttf.fun/, https://cdn.amiracle.site/masttf_avatar.jpg %}

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

# 图论

### Tarjan 点双连通分量

> 点双个数 & 每个点双的节点

```cpp
struct V_DCC {
    int n;
    vector<vector<int>> ver, col; // 颜色 i 的点集 col[i]
    vector<int> dfn, low, S;
    int now, cnt;
    vector<bool> point; // 记录是否为割点

    V_DCC(int n) : n(n) {
        ver.resize(n + 1);
        dfn.resize(n + 1);
        low.resize(n + 1);
        col.resize(2 * n + 1);
        point.resize(n + 1);
        S.clear();
        cnt = now = 0;
    }
    void add(int x, int y) {
        if (x == y) return; // 手动去除重边
        ver[x].push_back(y);
        ver[y].push_back(x);
    }
    void tarjan(int x, int root) {
        low[x] = dfn[x] = ++now;
        S.push_back(x);
        if (x == root && !ver[x].size()) { // 特判孤立点
            ++cnt;
            col[cnt].push_back(x);
            return;
        }

        int flag = 0;
        for (auto y : ver[x]) {
            if (!dfn[y]) {
                tarjan(y, root);
                low[x] = min(low[x], low[y]);
                if (dfn[x] <= low[y]) {
                    flag++;
                    if (x != root || flag > 1) {
                        point[x] = true; // 标记为割点
                    }
                    int pre = 0;
                    cnt++;
                    do {
                        pre = S.back();
                        col[cnt].push_back(pre);
                        S.pop_back();
                    } while (pre != y);
                    col[cnt].push_back(x);
                }
            } else {
                low[x] = min(low[x], dfn[y]);
            }
        }
    }
    pair<int, vector<vector<int>>> rebuild() { // [新图的顶点数量, 新图]
        work();
        vector<vector<int>> adj(cnt + 1);
        for (int i = 1; i <= cnt; i++) {
            if (!col[i].size()) { // 注意，孤立点也是 V-DCC
                continue;
            }
            for (auto j : col[i]) {
                if (point[j]) { // 如果 j 是割点
                    adj[i].push_back(point[j]);
                    adj[point[j]].push_back(i);
                }
            }
        }
        return {cnt, adj};
    }
    void work() {
        for (int i = 1; i <= n; ++i) { // 避免图不连通
            if (!dfn[i]) {
                tarjan(i, i);
            }
        }
    }
};

void solve(){
    int n, m;
    cin >> n >> m;
    
    V_DCC vdcc(n);
    for(int i=0; i<m; i++){
        int u, v;
        cin >> u >> v;
        vdcc.add(u, v);
        vdcc.add(v, u);
    }

    vdcc.work();
    cout << vdcc.cnt << '\n';
    for(int i=1; i<=vdcc.cnt; i++){
        cout << vdcc.col[i].size();
        for(int x : vdcc.col[i]){
            cout << " " << x;
        }
        cout << '\n';
    }
}
```

### Tarjan 边双连通分量

> 边双个数 & 每个边双的节点

```cpp
struct EDCC {
    int n, m, now, cnt;
    vector<vector<array<int, 2>>> ver;
    vector<int> dfn, low, col, S;
    set<array<int, 2>> bridge, direct; // 如果不需要，删除这一部分可以得到一些时间上的优化

    EDCC(int n) : n(n), low(n + 1), ver(n + 1), dfn(n + 1), col(n + 1) {
        m = now = cnt = 0;
    }
    void add(int x, int y) { // 和 scc 相比多了一条连边
        ver[x].push_back({y, m});
        ver[y].push_back({x, m++});
    }
    void tarjan(int x, int fa) {
        dfn[x] = low[x] = ++now;
        S.push_back(x);
        for (auto &[y, id] : ver[x]) {
            if (!dfn[y]) {
                direct.insert({x, y});
                tarjan(y, id);
                low[x] = min(low[x], low[y]);
                if (dfn[x] < low[y]) {
                    bridge.insert({x, y});
                }
            } else if (id != fa && dfn[y] < dfn[x]) {
                direct.insert({x, y});
                low[x] = min(low[x], dfn[y]);
            }
        }
        if (dfn[x] == low[x]) {
            int pre;
            cnt++;
            do {
                pre = S.back();
                col[pre] = cnt;
                S.pop_back();
            } while (pre != x);
        }
    }
    auto work() {
        for (int i = 1; i <= n; i++) { // 避免图不连通
            if (!dfn[i]) {
                tarjan(i, 0);
            }
        }
        /**
         * @param cnt 新图的顶点数量, adj 新图, col 旧图节点对应的新图节点
         * @param siz 旧图每一个边双中点的数量
         * @param bridge 全部割边, direct 非割边定向
         */
        vector<int> siz(cnt + 1);
        vector<vector<int>> adj(cnt + 1); // 压缩图
        for (int i = 1; i <= n; i++) {
            siz[col[i]]++;
            for (auto &[j, id] : ver[i]) {
                int x = col[i], y = col[j];
                if (x != y) {
                    adj[x].push_back(y);
                }
            }
        }
        return tuple{cnt, adj, col, siz};
    }

};

void solve() {
    int n, m;
    cin >> n >> m;
    EDCC edcc(n);
    for (int i = 0; i < m; i++) {
        int u, v;
        cin >> u >> v;
        edcc.add(u, v); // 只加一次
    }

    edcc.work();
    vector<vector<int>> col(edcc.cnt+1);
    for(int i=1; i<=n; i++){
        col[edcc.col[i]].push_back(i);
    }
    cout << edcc.cnt << '\n';
    for(int i=1; i<=edcc.cnt; i++){
        cout << col[i].size();
        for(int x : col[i]){
            cout << " " << x;
        }
        cout << '\n';
    }
}
```

<div style="page-break-after:always"></div>

# 杂项

### 随机数生成

>  直接生成 64 位随机数

```cpp
ull seed = chrono::steady_clock::now().time_since_epoch().count();
mt19937_64 rng(seed);
ull x = rng()
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

[^随意套或构造]: 
