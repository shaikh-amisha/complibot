const tbody =
    document.getElementById(
        "rulesTableBody"
    );

let rules = [];

async function loadRules() {

    try {

        const response =
            await fetch(
                "http://localhost:5000/api/rules"
            );

        rules =
            await response.json();

        renderStats();

        renderRules(rules);

    }
    catch (err) {
        console.log(err);
    }
}

function renderStats() {

    document.getElementById(
        "totalRules"
    ).textContent =
        rules.length;

    document.getElementById(
        "activeRules"
    ).textContent =
        rules.filter(
            r => r.enabled
        ).length;

    document.getElementById(
        "disabledRules"
    ).textContent =
        rules.filter(
            r => !r.enabled
        ).length;

    document.getElementById(
        "highRiskRules"
    ).textContent =
        rules.filter(
            r => r.riskScore >= 80
        ).length;
}

function renderRules(
    data
) {

    tbody.innerHTML = "";

    if (
        data.length === 0
    ) {

        tbody.innerHTML = `
            <tr>
                <td colspan="10">
                    No rules found.
                </td>
            </tr>
        `;

        return;
    }

    data.forEach(rule => {

        tbody.innerHTML += `
            <tr>

                <td>
                    ${rule._id.slice(-6)}
                </td>

                <td>
                    ${rule.source}
                </td>

                <td>
                    ${rule.destination}
                </td>

                <td>
                    ${rule.port}
                </td>

                <td>
                    ${rule.protocol}
                </td>

                <td class="
                    ${
                        rule.action ===
                        "allow"
                        ? "success"
                        : "danger"
                    }
                ">
                    ${rule.action.toUpperCase()}
                </td>

                <td>
                    ${rule.riskScore}
                </td>

                <td class="
                    ${
                        rule.enabled
                        ? "success"
                        : "danger"
                    }
                ">
                    ${
                        rule.enabled
                        ? "ACTIVE"
                        : "DISABLED"
                    }
                </td>

                <td>
                    ${rule.firewallStatus}
                </td>

                <td>

                    <button
                        onclick="
                            toggleRule(
                                '${rule._id}'
                            )
                        "
                    >
                        ⚡
                    </button>

                    <button
                        onclick="
                            deleteRule(
                                '${rule._id}'
                            )
                        "
                    >
                        🗑
                    </button>

                </td>

            </tr>
        `;
    });
}

async function deleteRule(
    id
){

    if (
        !confirm(
            "Delete this rule?"
        )
    ) {
        return;
    }

    await fetch(
        `http://localhost:5000/api/rules/${id}`,
        {
            method: "DELETE"
        }
    );

    loadRules();
}

async function toggleRule(
    id
){

    await fetch(
        `http://localhost:5000/api/rules/${id}/toggle`,
        {
            method: "PATCH"
        }
    );

    loadRules();
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
            rules.filter(rule =>

                rule.source
                    ?.toLowerCase()
                    .includes(value)

                ||

                rule.destination
                    ?.toLowerCase()
                    .includes(value)

                ||

                String(rule.port)
                    .includes(value)
            );

        renderRules(
            filtered
        );
    }
);

loadRules();