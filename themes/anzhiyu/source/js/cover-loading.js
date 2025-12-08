document.addEventListener('DOMContentLoaded', () => {
  const firstSrc = 'https://cdn.amiracle.site/loading.gif'; // 所有封面共享的 first 图
  const covers = document.querySelectorAll('.post_cover');

  // 先把 first 图设置给所有封面
  covers.forEach(cover => {
    const img = cover.querySelector('img.post_bg');
    img.src = firstSrc;
  });

  // 对每个封面加载各自 second 图
  covers.forEach(cover => {
    const img = cover.querySelector('img.post_bg');
    const secondSrc = img.dataset.src; // 每个封面的 second 图

    if (!secondSrc) return;

    const newImg = new Image();
    newImg.src = secondSrc;

    newImg.onload = () => {
      img.style.opacity = 0; // 淡出

      setTimeout(() => {
        img.src = secondSrc; // 替换 second 图
        img.style.opacity = 1; // 淡入
      }, 600); // 与 CSS transition 时间一致
    };
  });
});
