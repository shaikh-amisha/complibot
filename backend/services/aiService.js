import axios from "axios";

/*
===================================
Module-level config
===================================
Hoisted out of callOllama() so isAIOnline() can also
reference them — previously these were declared as
`const` only inside callOllama()'s function body, so
isAIOnline() threw a ReferenceError whenever it was
called, since OLLAMA_URL/MODEL didn't exist in its
scope.
===================================
*/

const OLLAMA_URL =
    process.env.OLLAMA_URL ||
    "http://localhost:11434/api/generate";

const MODEL =
    process.env.OLLAMA_MODEL ||
    "phi3.5:latest";

/*
===================================
Helper Function
===================================
*/

async function callOllama(prompt) {

    try {

        const response =
            await axios.post(
                OLLAMA_URL,
                {
                    model: MODEL,
                    prompt,
                    stream: false
                },
                {
                    timeout: 120000
                }
            );

        return response.data.response.trim();

    }
    catch (err) {

        console.log(
            "Ollama Error:",
            err.message
        );

        return null;
    }
}

/*
===================================
Extract Intent
===================================
*/

export async function
extractIntentWithAI(message) {

    const prompt = `
You are a firewall automation assistant.

Extract the firewall rule from the user's request.

Return ONLY VALID JSON.

Schema:

{
  "action": "",
  "source": "",
  "destination": "",
  "port": null,
  "protocol": "",
  "direction": "",
  "zone": ""
}

Examples:

User:
Allow HTTPS traffic from HR subnet to Web Server.

Output:
{
  "action":"allow",
  "source":"HR subnet",
  "destination":"Web Server",
  "port":443,
  "protocol":"tcp",
  "direction":"inbound",
  "zone":"internal"
}

User:
Open RDP access from anywhere to Payroll Server.

Output:
{
  "action":"allow",
  "source":"0.0.0.0/0",
  "destination":"Payroll Server",
  "port":3389,
  "protocol":"tcp",
  "direction":"inbound",
  "zone":"external"
}

Request:
${message}
`;

    try {

        const text =
            await callOllama(prompt);

        if (!text) {
            return null;
        }

        const start =
            text.indexOf("{");

        const end =
            text.lastIndexOf("}");

        if (
            start === -1 ||
            end === -1
        ) {
            return null;
        }

        const json =
            text.substring(
                start,
                end + 1
            );

        return JSON.parse(json);

    }
    catch (err) {

        console.log(
            "AI Parsing Error:",
            err.message
        );

        return null;
    }
}

/*
===================================
Generate Explanation
===================================
*/

export async function
generateExplanation(
    intent,
    decision,
    violations,
    risk
) {

    const prompt = `
You are a cybersecurity analyst.

Intent:
${JSON.stringify(intent)}

Decision:
${decision}

Risk Score:
${risk}

Violations:
${violations.join(", ")}

Generate JSON only.

{
  "explanation":"",
  "recommendation":""
}
`;

    try {

        const text =
            await callOllama(prompt);

        if (!text) {
            return {
                explanation:
                    "No explanation available.",
                recommendation:
                    "No recommendation available."
            };
        }

        const start =
            text.indexOf("{");

        const end =
            text.lastIndexOf("}");

        if (
            start === -1 ||
            end === -1
        ) {
            return {
                explanation:
                    "No explanation available.",
                recommendation:
                    "No recommendation available."
            };
        }

        const json =
            text.substring(
                start,
                end + 1
            );

        return JSON.parse(json);

    }
    catch (err) {

        console.log(
            "AI Explanation Error:",
            err.message
        );

        return {
            explanation:
                "No explanation available.",

            recommendation:
                "No recommendation available."
        };
    }
}

/*
===================================
Health Check
===================================
*/

export async function
isAIOnline() {

    try {

        const response =
            await axios.post(
                OLLAMA_URL,
                {
                    model: MODEL,
                    prompt: "Hello",
                    stream: false
                },
                {
                    timeout: 5000
                }
            );

        return !!response.data;
    }
    catch {

        return false;
    }
}