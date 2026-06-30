const tbody =
    document.getElementById(
        "logsTableBody"
    );

let logs = [];

async function loadLogs() {

    try {

        const response =
            await fetch(
                "http://localhost:5000/api/logs"
            );

        logs =
            await response.json();

        renderStats();
        renderLogs(logs);

    }
    catch (err) {

        console.log(
            "Logs Error:",
            err
        );
    }
}

function renderStats() {

    document.getElementById(
        "totalLogs"
    ).textContent =
        logs.length;

    document.getElementById(
        "approvedLogs"
    ).textContent =
        logs.filter(
            l =>
                l.decision ===
                "APPROVED"
        ).length;

    document.getElementById(
        "rejectedLogs"
    ).textContent =
        logs.filter(
            l =>
                l.decision ===
                "REJECTED"
        ).length;

    document.getElementById(
        "highRiskLogs"
    ).textContent =
        logs.filter(
            l =>
                l.riskScore >= 80
        ).length;
}

// violations are now structured objects:
// { rule, severity, reason, recommendation }
// instead of plain strings — build a readable label
// for each instead of letting them stringify to
// "[object Object]" via .join().
function formatViolations(violations) {

    if (
        !violations ||
        violations.length === 0
    ) {
        return "None";
    }

    return violations
        .map(v => `${v.rule} (${v.severity})`)
        .join("<br>");
}

function renderLogs(data) {

    tbody.innerHTML = "";

    if (data.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    No logs found.
                </td>
            </tr>
        `;

        return;
    }

    data.forEach(log => {

        tbody.innerHTML += `
            <tr>

                <td>
                    ${new Date(
                        log.createdAt
                    ).toLocaleString()}
                </td>

                <td>
                    ${log.message}
                </td>

                <td class="
                    ${
                        log.decision ===
                        "APPROVED"
                        ? "success"
                        : "danger"
                    }
                ">
                    ${log.decision}
                </td>

                <td>
                    ${log.riskScore}
                    ${
                        log.riskLevel
                        ? ` (${log.riskLevel})`
                        : ""
                    }
                </td>

                <td>
                    ${log.firewallStatus}
                </td>

                <td>
                    ${formatViolations(
                        log.violations
                    )}
                </td>

            </tr>
        `;
    });
}

document
.getElementById(
    "searchInput"
)
.addEventListener(
    "input",
    e => {

        const value =
            e.target.value
            .toLowerCase();

        const filtered =
            logs.filter(log =>

                log.message
                    ?.toLowerCase()
                    .includes(value)

                ||

                log.decision
                    ?.toLowerCase()
                    .includes(value)
            );

        renderLogs(
            filtered
        );
    }
);

document
.getElementById(
    "decisionFilter"
)
.addEventListener(
    "change",
    e => {

        const value =
            e.target.value;

        if (!value) {
            renderLogs(logs);
            return;
        }

        const filtered =
            logs.filter(
                l =>
                    l.decision ===
                    value
            );

        renderLogs(
            filtered
        );
    }
);

document
.getElementById(
    "severityFilter"
)
.addEventListener(
    "change",
    e => {

        const value =
            e.target.value;

        let filtered =
            logs;

        if (
            value === "low"
        ) {

            filtered =
                logs.filter(
                    l =>
                        l.riskScore < 40
                );
        }

        if (
            value === "medium"
        ) {

            filtered =
                logs.filter(
                    l =>
                        l.riskScore >= 40 &&
                        l.riskScore < 80
                );
        }

        if (
            value === "high"
        ) {

            filtered =
                logs.filter(
                    l =>
                        l.riskScore >= 80
                );
        }

        renderLogs(
            filtered
        );
    }
);

document
.getElementById(
    "refreshBtn"
)
.addEventListener(
    "click",
    loadLogs
);

loadLogs();