const requestList = document.getElementById("requestList");
const filterInput = document.getElementById("filterInput");
const detailsPanel = document.getElementById("detailsPanel");
const noRequestSelected = document.getElementById("noRequestSelected");
const requestDetailsContent = document.getElementById("requestDetailsContent");
const detailUrl = document.getElementById("detailUrl");
const detailMethod = document.getElementById("detailMethod");
const requestHeadersPre = document.getElementById("requestHeaders");
const requestPayloadPre = document.getElementById("requestPayload");
const copyButtons = document.querySelectorAll(".copy-btn");

let allRequests = [];
let filteredRequests = [];
let selectedRequest = null;

async function loadRequests() {
    const data = await chrome.storage.local.get("requests");
    allRequests = data.requests || [];
    filterRequests();
}

function filterRequests() {
    const filterText = filterInput.value.toLowerCase();
    filteredRequests = allRequests.filter(req => req.url.toLowerCase().includes(filterText));
    renderRequests();
}

function renderRequests() {
    requestList.innerHTML = "";
    filteredRequests.reverse().forEach(req => {
        const listItem = document.createElement("li");
        listItem.className = "request-item";
        if (selectedRequest && selectedRequest.id === req.id) {
            listItem.classList.add("selected");
        }
        listItem.innerHTML = `
            <div class="request-url">${req.url}</div>
            <div class="request-method-time">${req.method} - ${req.time}</div>
        `;
        listItem.addEventListener("click", () => selectRequest(req));
        requestList.appendChild(listItem);
    });
}

function selectRequest(req) {
    selectedRequest = req;
    renderRequests(); // Re-render to highlight selected
    showDetails(req);
}

function showDetails(req) {
    noRequestSelected.style.display = "none";
    requestDetailsContent.style.display = "block";

    detailUrl.textContent = req.url;
    detailMethod.textContent = req.method;

    requestHeadersPre.textContent = req.requestHeaders ? JSON.stringify(req.requestHeaders, null, 2) : "N/A";

    let payloadContent = "N/A";
    if (req.requestBody) {
        if (req.requestBody.formData) {
            payloadContent = JSON.stringify(req.requestBody.formData, null, 2);
        } else if (req.requestBody.raw) {
            try {
                // Attempt to decode as text
                const decodedString = new TextDecoder("utf-8").decode(new Uint8Array(req.requestBody.raw[0].bytes));
                payloadContent = JSON.stringify(JSON.parse(decodedString), null, 2);
            } catch (e) {
                payloadContent = "Raw data (não JSON)";
            }
        }
    }
    requestPayloadPre.textContent = payloadContent;
}

copyButtons.forEach(button => {
    button.addEventListener("click", async () => {
        const targetId = button.dataset.target;
        const contentToCopy = document.getElementById(targetId).textContent;
        try {
            await navigator.clipboard.writeText(contentToCopy);
            alert("Copiado para a área de transferência!");
        } catch (err) {
            console.error("Falha ao copiar: ", err);
        }
    });
});

filterInput.addEventListener("input", filterRequests);

loadRequests();
setInterval(loadRequests, 1000);
