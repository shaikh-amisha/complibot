/*
====================================================
Risk Engine
====================================================
Produces a risk assessment for a parsed firewall
intent. Rather than silently adding magic numbers
together, every contributing factor is captured as a
named finding with its own weight and a human-readable
reason — the final score is just the sum of those
named, explainable weights, and the engine returns the
full breakdown alongside the score so a human (or the
decision engine) can see exactly why the number is
what it is.
====================================================
*/

const BASE_RISK = 10;

const RISK_LEVEL = {
    LOW: "LOW",
    MEDIUM: "MEDIUM",
    HIGH: "HIGH",
    CRITICAL: "CRITICAL"
};

function factor(name, weight, reason) {
    return {
        name,
        weight,
        reason
    };
}

/*
Each function below inspects the intent and returns a
factor (or null if it doesn't apply). Weight is the
number of risk points this factor contributes.
*/

function evaluateOpenSource(intent) {

    if (intent.source === "0.0.0.0/0") {
        return factor(
            "Unrestricted source",
            40,
            "The rule accepts traffic from any IP address on the internet, " +
            "removing any network-level restriction on who can reach the " +
            "destination."
        );
    }

    return null;
}

function evaluateRDPExposure(intent) {

    if (intent.port === 3389) {
        return factor(
            "RDP service",
            50,
            "Remote Desktop Protocol is a high-value target for attackers and " +
            "ransomware operators; rules touching this port carry elevated risk " +
            "regardless of source."
        );
    }

    return null;
}

function evaluateTelnetExposure(intent) {

    if (intent.port === 23) {
        return factor(
            "Telnet service",
            50,
            "Telnet carries credentials and session data in plaintext, so any " +
            "rule allowing it is inherently high risk."
        );
    }

    return null;
}

function evaluateFTPExposure(intent) {

    if (intent.port === 21) {
        return factor(
            "Unencrypted FTP",
            35,
            "FTP transmits data without encryption, increasing the impact if " +
            "traffic is intercepted."
        );
    }

    return null;
}

function evaluateDatabaseExposure(intent) {

    const databasePorts = [3306, 5432];

    if (databasePorts.includes(intent.port)) {

        const externallyFacing =
            intent.zone === "external" ||
            intent.source === "0.0.0.0/0";

        return factor(
            "Database service",
            externallyFacing ? 55 : 20,
            externallyFacing
                ? "A database port is being opened to an external or " +
                  "unrestricted source — this is one of the highest-impact " +
                  "exposures possible, since it risks direct access to stored data."
                : "Database services carry elevated baseline risk even when " +
                  "restricted to internal traffic, since a compromised internal " +
                  "host could still reach it directly."
        );
    }

    return null;
}

function evaluateDirection(intent) {

    if (intent.direction === "inbound") {
        return factor(
            "Inbound traffic",
            5,
            "Inbound rules introduce new reachability into the network and " +
            "carry slightly more inherent risk than outbound rules."
        );
    }

    return null;
}

function evaluateMissingFields(intent) {

    if (!intent.destination || !intent.port) {
        return factor(
            "Incomplete request",
            30,
            "Key details of the request (destination and/or port) could not " +
            "be determined. Beyond making the true scope harder to assess, an " +
            "incomplete request cannot be translated into an actual firewall " +
            "rule, which is itself a significant gap."
        );
    }

    return null;
}

const FACTORS = [
    evaluateOpenSource,
    evaluateRDPExposure,
    evaluateTelnetExposure,
    evaluateFTPExposure,
    evaluateDatabaseExposure,
    evaluateDirection,
    evaluateMissingFields
];

function levelForScore(score) {

    if (score >= 80) {
        return RISK_LEVEL.CRITICAL;
    }

    if (score >= 55) {
        return RISK_LEVEL.HIGH;
    }

    if (score >= 30) {
        return RISK_LEVEL.MEDIUM;
    }

    return RISK_LEVEL.LOW;
}

function buildSummary(factors, level) {

    if (factors.length === 0) {
        return "No elevated risk factors were identified. This request follows " +
            "a low-risk pattern based on the source, destination, and service " +
            "involved.";
    }

    const factorNames = factors
        .map((f) => f.name)
        .join(", ");

    return `Risk level is ${level} primarily due to: ${factorNames}. ` +
        "See the individual factor breakdown for the full reasoning behind " +
        "each contribution.";
}

/*
====================================================
assessRisk(intent)

Returns a structured risk assessment:
{
  score,        // 0-100
  level,        // LOW | MEDIUM | HIGH | CRITICAL
  factors,      // [{ name, weight, reason }, ...]
  summary       // human-readable explanation
}
====================================================
*/

export function assessRisk(intent) {

    const factors = [];

    for (const evaluate of FACTORS) {

        const result = evaluate(intent);

        if (result) {
            factors.push(result);
        }
    }

    const rawScore =
        BASE_RISK +
        factors.reduce(
            (total, f) => total + f.weight,
            0
        );

    const score = Math.min(rawScore, 100);

    const level = levelForScore(score);

    const summary = buildSummary(factors, level);

    return {
        score,
        level,
        factors,
        summary
    };
}

export { RISK_LEVEL };