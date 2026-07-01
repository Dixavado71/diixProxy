const list = document.getElementById("list");

async function render() {

    const data = await chrome.storage.local.get("requests");

    const requests = data.requests || [];

    list.innerHTML = "";

    requests.reverse().forEach(req => {

        const div = document.createElement("div");

        div.className = "item";

        div.innerHTML = `
            <div>${req.time}</div>
            <div>${req.method}</div>
            <div class="url">${req.url}</div>
        `;

        list.appendChild(div);

    });

}

render();

setInterval(render, 1000);