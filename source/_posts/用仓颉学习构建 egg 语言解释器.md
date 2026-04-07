---
title: 用仓颉学习构建 egg 语言解释器
date: 2026-04-06 14:58:51
updated: 2026-04-07 15:01:48
tags:
  - 仓颉
cover: https://cdn.amiracle.site/ATRI3.jpg
---

## 前言

仓颉是一个新兴的国产编程语言，由华为自主研发，集百家之长，目前虽是仓颉生态的早期阶段，但已有一批移动应用使用仓颉开发，感觉有不错的前景

一直以来，我都认为写一门编程语言的解释器是一个相当底层的事情，需要借助相当底层的编程语言和工具，实则不然，要知道，C++ 的编译器就是用 C++ 来实现的 (这称之为自举)。因而使用高级语言，完全可以实现一门简单编程语言的解释器。这个项目使用仓颉实现了 *Eloquent JavaScript* 中介绍的 egg 语言解释器

借助此项目，学习仓颉基础语法和解释器实现思路。将学习过程写成此笔记，梳理思路加深印象

## egg 编程语言

### 基本语法

> Egg 语法特征类似 lisp，都是 (xxx ... ) 的形式，无论是进行求值，还是定义或调用函数

**表达式求值** `(op arg1 arg2 ...)`

这类似前缀表达式的形式，但不同层需用括号区别，例如计算 `(2 * (1 + 3))` 应写为 `(* 2 (+ 1 3))`

---

**创建函数** `(fun (param1 param2 ...) body)`

创建函数，如实现 a + b 的函数 `(fun (a b) (+ a b))`

---

**调用函数** `(function arg1 arg2 ...)`

使用 printf 输出指定字符串，`(printf "hello AMIR")`

### 基本概念

#### SpecialForm

**fun** 创建函数

**define** 定义变量或者为函数绑定名称

> 定义变量 `(define x 10)`

> fun 本身返回的是函数对象，**define** 将函数和名字绑定，如 `(define add (fun (a b) (+ a b)))`，这样可在后面直接调用 `(add 1 2)`

**do** 顺序执行表达式

SpecialForm 还有 **if**，**while**

#### EggFunction

> egg 语言把操作符也视为一个函数，这样子使解释器实现统一且易写

**+**，**-**，**\***，**/**，**>**，**<**，**==** 运算符

**printf** 输出变量或返回值

> array 在语义上更像数组构造器，egg 中也统一当成函数处理

**array** 创建数组，如 `(array 1 2 3)`

**length** 获得数组或字符串长度

**element** 获得数组或字符串某位置的值

#### Environment

**Env** 类存储自定义函数对象或是变量名，顶层环境还存储内置函数对象。**Env** 类中还存在 **out** 属性, 它指向父环境，因此这些环境节点形成一条作用域链，变量查找从当前环境开始，若未找到，就沿着这条链向父环境寻找，直到顶级环境

#### Expression

无论是 `(+ 1 2)`，`(printf "hello")`，还是 `(if cond a b)`，解析器最终都会把它们组织成由 Expression 节点构成的 AST，即抽象语法树

Expression 有 3 种类型：ValueExpression / WordExpression / ApplyExpression

+ **ValueExpression**
  字面量，例如数字、字符串、布尔值

+ **WordExpression**
  标识符，例如变量名，函数名，`+`，`if`，`printf`

+ **ApplyExpression**
  应用表达式，例如 `(op arg1 arg2 ...)`，具体来说是有两个属性 **op** 和 **args**

### 核心原理

解释器一般由这些部分构成

+ lexer - 词法分析
+ parser - 语法分析
+ evaluator - 求值
+ environment - 作用域环境

因为比较简单，egg 没有独立 lexer，其将词法分析直接融入到 parser

此解释器核心流程可以概括为

**源码** -> Parser -> AST(Expression) -> evaluate -> SpecialForm / EggFunction -> result -> output

#### 实现计算 1 + 2

执行 `egg> (+ 1 2)` 后，结果是 3，这是十分流畅且理所当然的，而对于这个解释器内部，究竟发生了什么呢

{% p bold, 解析阶段 %}

首先，**Parser** 会解析 `+`，将其识别为 **WordExpression("+")**，之后解析参数 `1` 和 `2`，识别为 **ValueExpression**，最终，这一行源码被组织成一个 **ApplyExpression**，结构图像是这样

```yaml
ApplyExpression
├─ op: WordExpression("+")
└─ args:
   ├─ ValueExpression(1)
   └─ ValueExpression(2)
```

{% p bold, 计算阶段 %}

AST 构建完成，即得到这个 **ApplyExpression** 后，程序会调用 **ApplyExpression.evaluate**，该函数会执行 SpecialForm 或 EggFunction 的函数逻辑，这取决于 op 求值后是什么类型的对象 

对于这个例子，具体来说是，解释器先在顶层环境拿到 **add()** 函数对象，然后调用 **add.apply(argList)**，计算后返回结果，最终由程序输出到终端，就有了我们看到的 1 + 2 = 3

很重要的一点是，**+** 不是一个被硬编码处理的操作符，而是一个普通标识符，其在顶层环境被映射成一个函数对象的名字，我们在上面调用了这个对象 apply 方法

解释器把 `+`，`printf` 这类操作实现为函数对象，再通过统一的 apply(...) 接口分发具体行为，很有魅力的思想

<p class="p bold">
  这也是非常典型的面向对象编程 (oop) 思路：
  <span class="p blue">将行为封装在类里，通过类对象调用行为</span>
</p>


## 仓颉语法简记

*仓颉没有高亮, 借用下 java 的高亮, 逃()*

**func** 定义函数
```java
func add(a: Int64, b: Int64): Int64 {
    return a + b
}
```

**class** 定义类，**interface** 定义接口，**<:** 实现接口或继承
```java
interface Expression {
    func evaluate(env: Env): Object
}
class ValueExpression <: Expression {
    var value: Object
}
```

**let** 声明不可变变量，**var** 声明可变变量
```java
let name = "egg"
var pos = 0
```
**let** 和 **const** 的区别在于，**const** 修饰的变量的值在编译期确定

**is** 类型判断，**as** 类型转换
```java
if(value is EggFunction) {
    let fn = (value as EggFunction).getOrThrow()
}
```

**Option<T>** 表示可能有值，也可能没有值，用 **getOrThrow** 取值，无值则抛出异常
```java
let value = env.get(name)
return value.getOrThrow({=> Exception("变量不存在")})
```

**match** 模式匹配，类似 **switch**，但更灵活，不仅能匹配值，还能匹配类型或结构
```java
match (value) {
    case str: Value<String> => str.value
    case num: Value<Float64> => "${num.value}"
    case _ => "unknown"
}
```
