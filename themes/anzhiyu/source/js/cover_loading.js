// 自定义事件 , 监测 url 改变 (pjax)
(function() {
    const _pushState = history.pushState;
    history.pushState = function(...args) {
        _pushState.apply(this, args);
        window.dispatchEvent(new Event('urlchange'));
    };
})();

const loadingImg = 'https://cdn.amiracle.site/loading.gif';
function setloadingImg() {
  const covers = document.querySelectorAll('.post_cover');
  // loadingImg
  covers.forEach(cover => {
    const img = cover.querySelector('img.post_bg');
    img.src = loadingImg;
  });
}

setloadingImg();
window.addEventListener('urlchange', () => {
  setloadingImg();
});
