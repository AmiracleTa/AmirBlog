(function() {
    const STATUS_CACHE_KEY = "statusTagsData";
    const STATUS_JSON_URL = "https://raw.githubusercontent.com/AmiracleTa/check-flink/refs/heads/page/result.json";

    let latestData = [];

    function normalizeName(name) {
        return name.trim().toLowerCase();
    }

    function addStatusTags(data, root = document) {
        if (!Array.isArray(data)) return;

        root.querySelectorAll(".flink-list-item").forEach(item => {
            if (item.querySelector(".status-tag")) item.querySelector(".status-tag").remove();

            const nameEl = item.querySelector(".flink-item-name, .cf-friends-name");
            if (!nameEl) return;

            const nameText = normalizeName(nameEl.textContent);

            const status = data.find(s => normalizeName(s.name) === nameText);
            if (!status) return;

            const tag = document.createElement("div");
            tag.classList.add("status-tag");

            let text = "神秘";
            let colorClass = "status-tag-red";

            if (typeof status.latency === "number" && status.latency >= 0) {
                text = status.latency.toFixed(2) + " s";
                colorClass = status.latency <= 2 ? "status-tag-green"
                           : status.latency <= 5 ? "status-tag-light-yellow"
                           : status.latency <= 10 ? "status-tag-dark-yellow"
                           : "status-tag-red";
            }

            tag.textContent = text;
            tag.classList.add(colorClass);

            item.style.position = "relative";
            item.appendChild(tag);
        });
    }

    function fetchStatusData() {
        try {
            const cache = localStorage.getItem(STATUS_CACHE_KEY);
            if (cache) {
                const parsed = JSON.parse(cache);
                const cachedData = Array.isArray(parsed.data) ? parsed.data : (parsed.data?.link_status || []);
                if (Date.now() - new Date(parsed.timestamp).getTime() < 30 * 60 * 1000) {
                    latestData = cachedData;
                    addStatusTags(latestData);
                }
            }
        } catch(e) {
            console.warn("❌ 解析缓存失败", e);
        }

        fetch(`${STATUS_JSON_URL}?t=${Date.now()}`)
            .then(r => r.json())
            .then(json => {
                latestData = Array.isArray(json) ? json : (json.link_status || []);
                addStatusTags(latestData);
                localStorage.setItem(STATUS_CACHE_KEY, JSON.stringify({
                    data: latestData,
                    timestamp: new Date().toISOString()
                }));
            })
            .catch(err => console.error("❌ 获取 result.json 出错:", err));
    }

    function observeNewItems() {
        const observer = new MutationObserver(mutations => {
            mutations.forEach(m => {
                m.addedNodes.forEach(node => {
                    if (!(node instanceof HTMLElement)) return;
                    if (node.matches(".flink-list-item") || node.querySelector(".flink-list-item")) {
                        addStatusTags(latestData, node);
                    }
                });
            });
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    document.addEventListener("DOMContentLoaded", () => {
        fetchStatusData();
        observeNewItems();
    });

    document.addEventListener("pjax:complete", () => {
        fetchStatusData();
    });
})();
