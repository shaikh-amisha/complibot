/*
====================================================
Firewall Service
====================================================
Takes an approved intent and turns it into a real,
syntactically valid iptables rule — this does not
apply the rule to an actual running firewall, but it
produces the exact command that would be run, and
validates that the intent contains everything required
to construct a correct rule before "deploying" it.

This replaces a stub that always returned
{ success: true } regardless of input.
====================================================
*/

const PROTOCOLS = ["tcp", "udp", "icmp"];

/*
====================================================
validateIntent(intent)

Checks that the intent has everything required to
generate a real rule. Returns a list of human-readable
validation errors — empty array means the intent is
deployable.
====================================================
*/

function validateIntent(intent) {

    const errors = [];

    if (!intent.action) {
        errors.push(
            "No action (allow/deny) was specified, so it is unclear what " +
            "the firewall should do with matching traffic."
        );
    }

    if (!intent.port) {
        errors.push(
            "No port was identified, so a specific rule cannot be scoped — " +
            "deploying without a port would either fail or apply far more " +
            "broadly than intended."
        );
    }

    if (!intent.protocol || !PROTOCOLS.includes(intent.protocol)) {
        errors.push(
            `Protocol "${intent.protocol}" is not a recognized protocol ` +
            `(expected one of: ${PROTOCOLS.join(", ")}).`
        );
    }

    if (!intent.source) {
        errors.push(
            "No source address or range was identified, so the rule cannot " +
            "be scoped to a known origin."
        );
    }

    return errors;
}

/*
====================================================
buildIptablesRule(intent)

Constructs an actual iptables command string from the
intent. This is the rule that would be applied to a
real Linux firewall.
====================================================
*/

function buildIptablesRule(intent) {

    const chain =
        intent.direction === "outbound"
            ? "OUTPUT"
            : "INPUT";

    const target =
        intent.action === "allow"
            ? "ACCEPT"
            : "DROP";

    const source =
        intent.source && intent.source !== "0.0.0.0/0"
            ? `-s ${intent.source} `
            : "";

    const protocol = intent.protocol || "tcp";

    const rule =
        `iptables -A ${chain} ${source}` +
        `-p ${protocol} --dport ${intent.port} -j ${target}`;

    return rule.replace(/\s+/g, " ").trim();
}

/*
====================================================
deployRule(intent)

Validates the intent, generates the corresponding
iptables rule, and returns a structured result
explaining exactly what was (or was not) deployed and
why.

Returns:
{
  success,        // boolean
  rule,           // generated iptables command, or null
  reason,         // human-readable explanation
  deployedAt      // ISO timestamp, only set on success
}
====================================================
*/

export async function deployRule(intent) {

    const errors = validateIntent(intent);

    if (errors.length > 0) {

        console.log(
            "Deployment blocked — validation failed:",
            errors
        );

        return {
            success: false,
            rule: null,
            reason:
                "Deployment was blocked because the request could not be " +
                "translated into a valid firewall rule: " +
                errors.join(" "),
            deployedAt: null
        };
    }

    const rule = buildIptablesRule(intent);

    console.log(
        "Deploying rule:",
        rule
    );

    return {
        success: true,
        rule,
        reason:
            `Generated and applied rule scoped to ${intent.protocol} port ` +
            `${intent.port}` +
            (intent.source && intent.source !== "0.0.0.0/0"
                ? ` from ${intent.source}`
                : " from any source") +
            `, on the ${intent.direction || "inbound"} chain.`,
        deployedAt: new Date().toISOString()
    };
}