import mongoose from "mongoose";

/*
====================================================
Risk Factor Subdocument
====================================================
Mirrors the shape returned by riskEngine.js's
assessRisk(): { name, weight, reason }
====================================================
*/

const riskFactorSchema =
new mongoose.Schema({

    name: String,

    weight: Number,

    reason: String

}, {
    _id: false
});

/*
====================================================
Violation Subdocument
====================================================
Mirrors the shape returned by policyEngine.js's
checkPolicies(): { rule, severity, reason, recommendation }
====================================================
*/

const violationSchema =
new mongoose.Schema({

    rule: String,

    severity: String,

    reason: String,

    recommendation: String

}, {
    _id: false
});

const logSchema =
new mongoose.Schema({

    message: String,

    parsedIntent: Object,

    decision: String,

    // Human-readable explanation from decisionEngine.js's
    // makeDecision() — why this decision was reached.
    decisionJustification: String,

    riskScore: Number,

    // LOW | MEDIUM | HIGH | CRITICAL, from riskEngine.js
    riskLevel: String,

    // Structured breakdown of what contributed to riskScore
    riskFactors: [riskFactorSchema],

    // Structured policy findings, replacing the old [String] shape
    violations: [violationSchema],

    explanation: String,

    recommendation: String,

    firewallStatus: String,

    // Generated iptables command from firewallService.js,
    // only populated when firewallStatus is "DEPLOYED"
    iptablesRule: String,

    // Why deployment succeeded or was blocked, from firewallService.js
    deploymentReason: String

}, {
    timestamps: true
});

export default
mongoose.model(
    "Log",
    logSchema
);