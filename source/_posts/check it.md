---
title: check it!
date: 2025-08-16 22:42:42
updated: 2025-10-08
tags: TEST
cover: https://cdn.amiracle.site/DreamBlue.jpg
---

**HELLO AMIR ! ! !**

![](https://cdn.jsdelivr.net/gh/AmiracleTa/pic-bed/img/DreamBlue.jpg)

[pixiv - Ashima](https://www.pixiv.net/artworks/129563571)

## 路径不统一导致的图片引用问题

### 问题来源

hexo 部署网页是以 public 为根目录的, 图片文件在 public/images 里, 也就是引用图片要用 /images/... 路径

而本地写文章在 _post 文件夹, images 和 _post 同级, 在本地引用要用 ../images/... 路径

这就导致的路径冲突, 本地和网站无法同时看到图片

### 解决办法

- 简单粗暴的方法，直接将图片托管在图床，用网链解决一切问题

- 官方方法，建一个文章同名资源文件夹，用 `!()[post/xx.png]` 引用
