function CreateSnowflake() {
    // 先创建一个 snowflake 的容器
    const container = document.createElement('div');
    container.classList.add('snowflake-container');
    container.style.left = Math.random() * window.innerWidth + 'px';

    // 创建 snowflake 元素
    const snowflake = document.createElement('div');
    snowflake.classList.add('snowflake');

    // 绑定到容器 
    container.appendChild(snowflake);

    // 添加到 body
    document.body.appendChild(container);

    // 动画结束后删除元素
    container.addEventListener('animationend', () => {
        container.remove();
    });
}

// setInterval(() => {
//     CreateSnowflake();
// }, 300);

let intervaler = null;
function start() {
    intervaler  = setInterval(() => {
        CreateSnowflake();
    }, 300);
}

function clearAll() {
    const snowflakes = document.querySelectorAll('.snowflake-container');
    snowflakes.forEach(snowflake => {
        snowflake.remove();
    });
    clearInterval(intervaler); // 停止定时器
}

// init
start();

// 失焦/聚焦
document.addEventListener('visibilitychange', () => {
    clearAll();
    if(document.hidden === false) {
        start();
    }
});