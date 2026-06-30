/*
====================================================
Decision Engine
====================================================
Takes the structured risk assessment (from riskEngine)
and structured policy findings (from policyEngine) and
produces a final decision with a justification —
rather than a blind "any violation = reject" rule, it
reasons about severity: a single LOW-severity advisory
finding shouldn't block a request the way a CRITICAL
finding should.
====================================================
*/

const DECISION = {
    APPROVED: "APPROVED",
    REJECTED: "REJECTED"
};

function hasSeverity(violations, severity) {
    return violations.some(
        (v) => v.severity === severity
    );
}

function countSeverity(violations, severity) {
    return violations.filter(
        (v) => v.severity === severity
    ).length;
}

function summarizeViolations(violations) {

    if (violations.length === 0) {
        return "no policy violations were found";
    }

    return violations
        .map((v) => `${v.rule} (${v.severity})`)
        .join(", ");
}

/*
====================================================
makeDecision(risk, violations)

risk        — the object returned by assessRisk():
              { score, level, factors, summary }
violations  — the array returned by checkPolicies():
              [{ rule, severity, reason, recommendation }]

Returns:
{
  decision,       // APPROVED | REJECTED
  justification   // human-readable explanation of why
}
====================================================
*/

export function makeDecision(risk, violations) {

    // Any CRITICAL finding is an automatic, non-negotiable reject —
    // these represent exposures severe enough that no other factor
    // should be able to outweigh them.
    if (hasSeverity(violations, "CRITICAL")) {

        const critical = violations.filter(
            (v) => v.severity === "CRITICAL"
        );

        return {
            decision: DECISION.REJECTED,
            justification:
                `Rejected due to ${critical.length} critical policy violation` +
                `${critical.length > 1 ? "s" : ""}: ` +
                critical.map((v) => v.rule).join(", ") +
                ". Critical findings represent exposures severe enough to be " +
                "rejected regardless of other factors."
        };
    }

    // Two or more HIGH severity findings compound into reject-worthy —
    // a single HIGH finding alone is serious but may still be a judgment
    // call, while multiple HIGH findings together indicate a pattern of
    // risky decisions in the same request.
    const highCount = countSeverity(violations, "HIGH");

    if (highCount >= 2) {
        return {
            decision: DECISION.REJECTED,
            justification:
                `Rejected because ${highCount} high-severity issues were found ` +
                `together: ${summarizeViolations(
                    violations.filter((v) => v.severity === "HIGH")
                )}. Multiple high-severity findings on the same request ` +
                "compound the overall exposure even though no single finding " +
                "was critical."
        };
    }

    // Overall risk score crossing into HIGH/CRITICAL territory rejects
    // even without a named policy violation, since the risk engine may
    // pick up on factor combinations the policy engine doesn't explicitly
    // name.
    if (risk.score >= 80) {
        return {
            decision: DECISION.REJECTED,
            justification:
                `Rejected because the overall risk score (${risk.score}/100) ` +
                `falls in the ${risk.level} range. ${risk.summary}`
        };
    }

    // A single HIGH finding combined with elevated (but not critical) risk
    // is rejected — on its own the HIGH finding might be approvable with
    // review, but paired with an already-elevated risk score it tips over.
    if (highCount === 1 && risk.score >= 55) {
        const highFinding = violations.find(
            (v) => v.severity === "HIGH"
        );

        return {
            decision: DECISION.REJECTED,
            justification:
                `Rejected because a high-severity finding (${highFinding.rule}) ` +
                `coincides with an elevated risk score (${risk.score}/100). ` +
                `${highFinding.reason}`
        };
    }

    // Anything left — LOW/MEDIUM findings only, or no findings at all,
    // with a risk score below the HIGH threshold — is approved, but the
    // justification still surfaces what was reviewed and waived.
    const advisoryNote =
        violations.length > 0
            ? ` Note: this request was approved with ${violations.length} ` +
              `lower-severity advisory finding${violations.length > 1 ? "s" : ""} ` +
              `(${summarizeViolations(violations)}) that did not meet the ` +
              "threshold for rejection but are worth reviewing."
            : "";

    return {
        decision: DECISION.APPROVED,
        justification:
            `Approved. Risk score is ${risk.score}/100 (${risk.level}), and ` +
            `${summarizeViolations(violations)} reached a rejection ` +
            `threshold.${advisoryNote}`
    };
}

export { DECISION };