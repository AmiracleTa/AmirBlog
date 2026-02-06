async function fetchIP() {
    try {
        const res = await fetch('/api/get-ip.php');
        const data = await res.json();
        const ip = data.ip;
        // if(!ip) throw new Error("ip 值为空");
        return ip;
    } catch (e) {
        console.error(e);
        return "遗失在黑洞了owo";
    }
}
function distanceKm(lat1, lng1, lat2, lng2) {
    const R = 6371; // 地球半径 km
    const toRad = x => x * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.floor(R * c);
}

const card = (() => {
    // 注入 card styles
    function injectStyles() {
        if (document.getElementById('visitor-card-style')) return;

        const style = document.createElement('style');
        style.id = 'visitor-card-style';
        style.textContent = `
            .card-widget.card-visitor {
                padding-left: 1.2rem !important;
                padding-right: 1.2rem !important;
            }
            .card-visitor .item-title {
                color: rgba(31, 126, 209, 1);
                font-size: 1.2rem;
                font-weight: bold;  
                font-family: MV Boli, Comic Sans MS;
            }
            .card-visitor .item-content {
                // margin-top: 60px;
                // color: rgba(255, 187, 0, 0.73);
                font-size: 1rem;
                font-family: 楷体;
                font-weight: 600;
                line-height: 1.3;
            }
            .card-visitor .highlight {
                color: rgba(31, 126, 209, 1);
            }
            .card-visitor .address {
            }
            .card-visitor .ip {
                display: inline-block;
                padding-left: 3px;
                padding-right: 3px;
                border-radius: 5px;

                font-size: 0.8rem;
                filter: blur(5px);
                transition: all 0.3s ease;
            }
            .card-visitor .ip:hover {
                filter: blur(0px);
            }
            .card-visitor .name {
                font-family: MV Boli, Comic Sans MS;
            }
        `;
        document.head.appendChild(style);
    }

    // 插入 card 元素
    function injectCard() {
        if (document.querySelector('.card-visitor')) return;

        const precard = document.querySelector('.card-widget.card-info');
        console.log(precard);
        const newcard = document.createElement('div');
        newcard.className = 'card-widget card-visitor';

        (async () => {
            const ip = await fetchIP();
            const Alat = 30.31974, Alng = 120.1421; // Amir's location
            const key = '2V6BZ-7QW6W-S32RZ-YTTFW-3LLKF-K3BVC'
            const url = `https://apis.map.qq.com/ws/location/v1/ip?ip=${ip}&key=${key}&output=jsonp&callback=fetchData`;
            // JSONP
            window.fetchData = function (data) {
                const { nation, province, city, district } = data.result.ad_info;
                const { lat, lng } = data.result.location;
                let site = `${nation} ${province} ${city}`;
                if (district) {
                    site += ` ${district}`;
                    console.error("进入");
                }
                newcard.innerHTML = `
                    <div class="item-title">Hello There!</div>
                    <div class="item-content">
                        欢迎来自<span class="address highlight">${site}</span>的小伙伴，ip已捕获喵~<br>
                        你的ip是:
                        <span class="ip highlight">
                            ${ip}
                        </span><br>
                        你现在距离 <span class="name highlight">Amir</span> 约有 <span class="highlight">${distanceKm(Alat, Alng, lat, lng)}</span> 公里，<span class="highlight">新年快乐，奇迹将至喵~</span>
                    </div
                `;
                // newcard.innerHTML = `
                //     <div class="item-title">Hello There!</div>
                //     <div class="item-content">
                //         欢迎来自<span class="address highlight">${site}</span>的小伙伴，ip已捕获喵~<br>
                //         你的ip是:
                //         <span class="ip highlight">
                //             ${ip}
                //         </span><br>
                //         距离 <span class="name highlight">Amir</span> 约有 <span class="highlight">${distanceKm(Alat, Alng, lat, lng).toPrecision(1)}</span> 公里，点击拉进和 miracle 的距离<br>
                //         新年快乐，奇迹将至喵~<br>
                //         没有更多祝福语了喵喵喵~
                //     </div>
                // `;
                precard.insertAdjacentElement('afterend', newcard);
            };
            (function () {
                const script = document.createElement('script');
                script.src = url;
                document.body.appendChild(script);
            })();
        })();
    }

    function init() {
        injectStyles();
        injectCard();
    }

    // 暴露 init
    return { init };
})();

document.addEventListener('DOMContentLoaded', () => card.init());
document.addEventListener('pjax:complete', () => card.init());