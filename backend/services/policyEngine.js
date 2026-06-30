/*
====================================================
Policy Engine
====================================================
Evaluates a parsed firewall intent against a set of
security policies. Each policy that fires returns a
structured finding explaining WHAT was violated, WHY
it matters, and WHAT should be done about it — not
just a flat string label.

A "violation" here means: this request should not be
auto-approved as-is. Severity controls how strongly it
weighs into the final decision.
====================================================
*/

const SEVERITY = {
    CRITICAL: "CRITICAL",
    HIGH: "HIGH",
    MEDIUM: "MEDIUM",
    LOW: "LOW"
};

function finding(rule, severity, reason, recommendation) {
    return {
        rule,
        severity,
        reason,
        recommendation
    };
}

/*
Each check below is a pure function: (intent) -> finding | null
This keeps the rule set easy to extend — add a function,
register it in CHECKS, done.
*/

function checkPublicRDP(intent) {

    if (
        intent.port === 3389 &&
        (intent.zone === "external" ||
            intent.source === "0.0.0.0/0")
    ) {
        return finding(
            "Public RDP Exposure",
            SEVERITY.CRITICAL,
            "RDP (port 3389) is being exposed to a public or unrestricted source. " +
            "RDP is one of the most commonly brute-forced and exploited services on " +
            "the internet, and is a frequent entry point for ransomware operators.",
            "Restrict RDP access to a specific management IP range or require a VPN / " +
            "bastion host instead of exposing it directly."
        );
    }

    return null;
}

function checkTelnet(intent) {

    if (intent.port === 23) {
        return finding(
            "Telnet Usage",
            SEVERITY.HIGH,
            "Telnet transmits all traffic, including credentials, in plaintext. " +
            "Anyone able to observe network traffic between the source and " +
            "destination can capture login credentials.",
            "Replace this rule with SSH (port 22), which provides the same remote " +
            "access capability over an encrypted channel."
        );
    }

    return null;
}

function checkUnencryptedFTP(intent) {

    if (intent.port === 21) {
        return finding(
            "Unencrypted FTP",
            SEVERITY.MEDIUM,
            "FTP transmits file contents and credentials without encryption, " +
            "making it vulnerable to interception on untrusted networks.",
            "Use SFTP (port 22) or FTPS instead, both of which encrypt the session."
        );
    }

    return null;
}

function checkOverlyPermissiveSource(intent) {

    if (
        intent.action === "allow" &&
        intent.source === "0.0.0.0/0"
    ) {
        return finding(
            "Overly Permissive Rule",
            SEVERITY.HIGH,
            "This rule allows traffic from any source address (0.0.0.0/0). " +
            "Even if the destination service itself is secure, an unrestricted " +
            "source expands the attack surface to the entire internet and removes " +
            "any meaningful network-level access control.",
            "Scope the source to a known network range (office IP, VPN range, or " +
            "a specific partner network) rather than allowing all traffic."
        );
    }

    return null;
}

function checkDatabasePortExternal(intent) {

    const databasePorts = [3306, 5432];

    if (
        databasePorts.includes(intent.port) &&
        (intent.zone === "external" ||
            intent.source === "0.0.0.0/0")
    ) {
        return finding(
            "Database Port Exposed Externally",
            SEVERITY.CRITICAL,
            "This rule exposes a database port directly to an external or " +
            "unrestricted source. Databases should never be reachable from " +
            "outside the internal network — direct exposure is one of the most " +
            "common causes of large-scale data breaches.",
            "Keep database access internal-only. If external access is genuinely " +
            "required, route it through an application layer or a VPN, never " +
            "expose the database port directly."
        );
    }

    return null;
}

function checkUnspecifiedDestination(intent) {

    if (!intent.destination) {
        return finding(
            "Unspecified Destination",
            SEVERITY.CRITICAL,
            "No destination system could be identified from this request. " +
            "This is not just an audit concern — without a destination, the " +
            "system cannot generate a valid firewall rule at all, so approving " +
            "it would produce a decision that can never actually be deployed.",
            "Clarify which specific system, zone, or IP address this rule " +
            "should apply to, then resubmit the request."
        );
    }

    return null;
}

function checkUnspecifiedSource(intent) {

    if (!intent.source) {
        return finding(
            "Unspecified Source",
            SEVERITY.CRITICAL,
            "No source address, range, or zone could be identified from this " +
            "request. Without a source, the system cannot generate a valid " +
            "firewall rule, so approving it would produce a decision that can " +
            "never actually be deployed.",
            "Specify where this traffic originates from — a named network " +
            "(e.g. \"HR Network\"), an IP range, or \"any\" if intentionally " +
            "unrestricted — then resubmit the request."
        );
    }

    return null;
}

function checkMissingAction(intent) {

    if (!intent.action) {
        return finding(
            "Unrecognized Action",
            SEVERITY.MEDIUM,
            "The request did not clearly specify whether traffic should be " +
            "allowed or denied. Proceeding without a clear action risks " +
            "misinterpreting intent.",
            "Rephrase the request using an explicit action such as \"allow\" or " +
            "\"block\"."
        );
    }

    return null;
}

const CHECKS = [
    checkPublicRDP,
    checkTelnet,
    checkUnencryptedFTP,
    checkOverlyPermissiveSource,
    checkDatabasePortExternal,
    checkUnspecifiedDestination,
    checkUnspecifiedSource,
    checkMissingAction
];

/*
====================================================
checkPolicies(intent)

Runs every registered check against the intent and
returns the list of findings that fired. Each finding
is a structured object — never a bare string — so the
decision engine and the frontend can reason about
severity and surface the justification directly.
====================================================
*/

export function checkPolicies(intent) {

    const violations = [];

    for (const check of CHECKS) {

        const result = check(intent);

        if (result) {
            violations.push(result);
        }
    }

    return violations;
}

export { SEVERITY };