// =======================
// Chart Instances
// =======================

let ruleChart = null;
let riskChart = null;

// =======================
// Load Dashboard
// =======================

async function loadDashboard() {
    try {
        const response = await fetch(
            "http://localhost:5000/api/dashboard"
        );

        if (!response.ok) {
            throw new Error(
                "Failed to fetch dashboard data"
            );
        }

        const data = await response.json();

        // =======================
        // KPI Cards
        // =======================

        document.getElementById(
            "totalRules"
        ).textContent =
            data.totalRequests || 0;

        document.getElementById(
            "approvedRules"
        ).textContent =
            data.approved || 0;

        document.getElementById(
            "rejectedRules"
        ).textContent =
            data.rejected || 0;

        document.getElementById(
            "highRiskRules"
        ).textContent =
            data.riskHigh || 0;

        // =======================
        // Table
        // =======================

        renderRecentRequests(
            data.recentRequests || []
        );

        // =======================
        // Charts
        // =======================

        renderRuleChart(data);
        renderRiskChart(data);

    } catch (err) {
        console.error(
            "Dashboard Error:",
            err
        );
    }
}

// =======================
// Recent Requests Table
// =======================

function renderRecentRequests(
    requests
) {
    const tbody =
        document.getElementById(
            "recentRequests"
        );

    if (!tbody) return;

    tbody.innerHTML = "";

    if (
        requests.length === 0
    ) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4">
                    No requests found.
                </td>
            </tr>
        `;

        return;
    }

    requests.forEach(req => {

        const decisionClass =
            req.decision ===
            "APPROVED"
                ? "success"
                : "danger";

        tbody.innerHTML += `
            <tr>
                <td>${req.message}</td>

                <td class="${decisionClass}">
                    ${req.decision}
                </td>

                <td>${req.riskScore}</td>

                <td>
                    ${new Date(
                        req.createdAt
                    ).toLocaleString()}
                </td>
            </tr>
        `;
    });
}

// =======================
// Approved vs Rejected
// =======================

function renderRuleChart(data) {

    const canvas =
        document.getElementById("ruleChart");

    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    if (ruleChart) {
        ruleChart.destroy();
    }

   ruleChart = new Chart(ctx, {
    type: "bar",

    data: {
        labels: ["Approved", "Rejected"],

        datasets: [{
            data: [
                data.approved || 0,
                data.rejected || 0
            ],

            backgroundColor: [
                "#ffbb00",
                "#ff4d6eb9"
            ],

            borderRadius: 10,
            maxBarThickness: 70,
            categoryPercentage: 0.9,
            barPercentage: 0.55
        }]
    },

    options: {
        responsive: true,
        maintainAspectRatio: false,

        layout: {
            padding: {
                top: 8,
                bottom: 4
            }
        },

        plugins: {
            legend: {
                display: false
            }
        },

        scales: {
            x: {
                ticks: {
                    color: "#ffffff",
                    font: {
                        size: 12
                    }
                },

                grid: {
                    display: false
                }
            },

            y: {
                beginAtZero: true,

                ticks: {
                    color: "#ffffff",
                    precision: 0,
                    font: {
                        size: 11
                    }
                },

                grid: {
                    color:
                        "rgba(255,255,255,0.05)"
                }
            }
        }
    }
});

}

// =======================
// Risk Distribution
// =======================

function renderRiskChart(
    data
) {
    const canvas =
        document.getElementById(
            "riskChart"
        );

    if (!canvas) return;

    const ctx =
        canvas.getContext("2d");

    if (riskChart) {
        riskChart.destroy();
    }

    riskChart =
        new Chart(ctx, {
            type: "pie",

            data: {
                labels: [
                    "Low",
                    "Medium",
                    "High"
                ],

                datasets: [
                    {
                        data: [
                            data.riskLow || 0,
                            data.riskMedium || 0,
                            data.riskHigh || 0
                        ],

                        backgroundColor: [
                            "#ffe100ef",
                            "#ff7700",
                            "#ff4d4d"
                        ],

                        borderWidth: 1
                    }
                ]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,

                plugins: {
                    legend: {
                        labels: {
                            color: "#ffffff"
                        }
                    }
                }
            }
        });
}

// =======================
// Auto Refresh
// =======================

loadDashboard();

// Refresh every 30 seconds
setInterval(
    loadDashboard,
    30000
);