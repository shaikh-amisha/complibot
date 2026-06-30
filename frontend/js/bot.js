// =======================
// DOM Elements
// =======================

const chatMessages =
    document.getElementById("chatMessages");

const messageInput =
    document.getElementById("messageInput");

const sendBtn =
    document.getElementById("sendBtn");

const decisionStatus =
    document.getElementById("decisionStatus");

const riskScore =
    document.getElementById("riskScore");

const violationsList =
    document.getElementById("violationsList");

const recommendation =
    document.getElementById("recommendation");

const firewallStatus =
    document.getElementById("firewallStatus");

const parsedRule =
    document.getElementById("parsedRule");

// =======================
// Conversation History
// =======================

let conversation = [];

// =======================
// Scroll
// =======================

function scrollBottom() {
    chatMessages.scrollTop =
        chatMessages.scrollHeight;
}

// =======================
// User Message
// =======================

function addUserMessage(message) {

    const div =
        document.createElement("div");

    div.className =
        "user-message";

    const time =
        new Date()
        .toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });

    div.innerHTML = `
        <p>${message}</p>
        <small>${time}</small>
    `;

    chatMessages.appendChild(div);

    scrollBottom();
}

// =======================
// Bot Message
// =======================

function addBotMessage(html) {

    const div =
        document.createElement("div");

    div.className =
        "bot-message";

    const time =
        new Date()
        .toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });

    div.innerHTML = `
        ${html}
        <br>
        <small>${time}</small>
    `;

    chatMessages.appendChild(div);

    scrollBottom();

    return div;
}

// =======================
// Send Message
// =======================

async function sendMessage() {

    const message =
        messageInput.value.trim();

    if (!message) return;

    addUserMessage(message);

    conversation.push({
        role: "user",
        content: message
    });

    messageInput.value = "";

    // Loading Indicator

    const loading =
        addBotMessage(`
            🤖 Analyzing request...
        `);

    try {

        const response =
            await fetch(
                "http://localhost:5000/api/bot/chat",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        message,
                        history:
                            conversation
                    })
                }
            );

        if (!response.ok) {
            throw new Error(
                "Server Error"
            );
        }

        const data =
            await response.json();

        loading.remove();

        renderResponse(data);

        conversation.push({
            role: "assistant",
            content: data
        });

    }
    catch (err) {

        console.log(err);

        loading.remove();

        addBotMessage(`
            ❌ Unable to connect
            to CompliBot server.
        `);
    }
}

// =======================
// Helpers
// =======================

// violations is now an array of structured objects:
// { rule, severity, reason, recommendation }
// instead of plain strings — this renders each one as
// a labeled line instead of relying on toString().
function formatViolationsHtml(violations) {

    if (
        !violations ||
        violations.length === 0
    ) {
        return "<p>No policy violations.</p>";
    }

    const items = violations
        .map(v => `
            <li>
                <strong>${v.rule}</strong>
                (${v.severity})
                — ${v.reason}
            </li>
        `)
        .join("");

    return `<ul>${items}</ul>`;
}

// =======================
// Bot Response
// =======================

function renderResponse(data) {

    const icon =
        data.decision ===
        "APPROVED"
            ? "✅"
            : "❌";

    addBotMessage(`
        <h3>
            ${icon}
            ${data.decision}
        </h3>

        <p>
            <strong>Risk Score:</strong>
            ${data.riskScore}/100
            ${
                data.riskLevel
                ? `(${data.riskLevel})`
                : ""
            }
        </p>

        <p>
            <strong>Firewall:</strong>
            ${data.firewallStatus}
        </p>

        ${
            data.decisionJustification
            ? `
            <p>
                <strong>Why:</strong>
                ${data.decisionJustification}
            </p>
            `
            : ""
        }

        ${formatViolationsHtml(
            data.violations
        )}

        <p>
            <strong>Recommendation:</strong>
            ${data.recommendation ||
            "No recommendation."}
        </p>
    `);

    updateDecisionPanel(data);
}

// =======================
// Decision Panel
// =======================

function updateDecisionPanel(
    data
) {

    decisionStatus.textContent =
        data.decision;

    decisionStatus.classList.remove(
        "success",
        "danger"
    );

    if (
        data.decision ===
        "APPROVED"
    ) {
        decisionStatus.classList.add(
            "success"
        );
    }
    else {
        decisionStatus.classList.add(
            "danger"
        );
    }

    riskScore.textContent =
        data.riskLevel
            ? `${data.riskScore}/100 (${data.riskLevel})`
            : `${data.riskScore}/100`;

    firewallStatus.textContent =
        data.firewallStatus;

    recommendation.textContent =
        data.recommendation ||
        "No recommendation.";

    parsedRule.textContent =
        JSON.stringify(
            data.parsedIntent,
            null,
            2
        );

    violationsList.innerHTML = "";

    if (
        !data.violations ||
        data.violations.length === 0
    ) {

        violationsList.innerHTML =
            `
            <li>
                No policy violations.
            </li>
            `;

        return;
    }

    // Each violation is now { rule, severity, reason,
    // recommendation } — build a readable line instead
    // of assigning the object directly to textContent
    // (which previously rendered "[object Object]").
    data.violations.forEach(
        violation => {

            const li =
                document.createElement(
                    "li"
                );

            li.innerHTML = `
                <strong>${violation.rule}</strong>
                <span class="severity-${
                    violation.severity?.toLowerCase()
                }">
                    ${violation.severity}
                </span>
                <br>
                ${violation.reason}
            `;

            violationsList.appendChild(
                li
            );
        }
    );
}

// =======================
// Events
// =======================

sendBtn.addEventListener(
    "click",
    sendMessage
);

messageInput.addEventListener(
    "keydown",
    e => {

        if (
            e.key === "Enter"
        ) {
            sendMessage();
        }
    }
);

// =======================
// Suggestion Chips
// =======================

document
.querySelectorAll(".chip")
.forEach(chip => {

    chip.addEventListener(
        "click",
        () => {

            messageInput.value =
                chip.innerText;

            messageInput.focus();
        }
    );
});