const PORTS = {
    http: 80,
    https: 443,
    ssh: 22,
    ftp: 21,
    telnet: 23,
    smtp: 25,
    dns: 53,
    rdp: 3389,
    mysql: 3306,
    postgresql: 5432
};

export function parseIntent(message) {

    const text =
        message.toLowerCase();

    const intent = {
        action: null,
        source: null,
        destination: null,
        port: null,
        protocol: "tcp",
        direction: "inbound",
        zone: "internal"
    };

    // ====================
    // ACTION
    // ====================

    if (
        text.includes("allow") ||
        text.includes("permit") ||
        text.includes("open")
    ) {
        intent.action = "allow";
    }

    if (
        text.includes("block") ||
        text.includes("deny") ||
        text.includes("reject")
    ) {
        intent.action = "deny";
    }

    // ====================
    // PORT
    // ====================

    const portMatch =
        text.match(/port\s+(\d+)/);

    if (portMatch) {
        intent.port =
            Number(portMatch[1]);
    }

    for (const service in PORTS) {

        if (
            text.includes(service)
        ) {
            intent.port =
                PORTS[service];
        }
    }

    // ====================
    // PROTOCOL
    // ====================

    if (text.includes("udp")) {
        intent.protocol =
            "udp";
    }

    if (text.includes("icmp")) {
        intent.protocol =
            "icmp";
    }

    // ====================
    // SOURCE
    // ====================

    const cidr =
        text.match(
            /\b\d+\.\d+\.\d+\.\d+\/\d+\b/
        );

    if (cidr) {
        intent.source =
            cidr[0];
    }

    if (
        text.includes("any") ||
        text.includes("everyone") ||
        text.includes("public")
    ) {
        intent.source =
            "0.0.0.0/0";
    }

    // ====================
    // DESTINATION
    // ====================

    const toMatch =
        message.match(
            /to\s+([a-zA-Z0-9-_ ]+)/i
        );

    if (toMatch) {
        intent.destination =
            toMatch[1].trim();
    }

    // ====================
    // ZONE
    // ====================

    if (
        intent.source ===
        "0.0.0.0/0"
    ) {
        intent.zone =
            "external";
    }

    return intent;
}