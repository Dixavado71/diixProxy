let requests = [];

async function saveRequests() {
    await chrome.storage.local.set({
        requests
    });
}

chrome.webRequest.onBeforeRequest.addListener(
    async (details) => {

        requests.push({
            url: details.url,
            method: details.method,
            time: new Date().toLocaleTimeString()
        });

        if (requests.length > 500) {
            requests.shift();
        }

        await saveRequests();

    },
    {
        urls: ["<all_urls>"]
    }
);