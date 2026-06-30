import Rule from "../models/Rule.js";
import Log from "../models/Log.js";

import {
    parseIntent
} from "../services/parserService.js";

import {
    checkPolicies
} from "../services/policyEngine.js";

import {
    assessRisk
} from "../services/riskEngine.js";

import {
    makeDecision
} from "../services/decisionEngine.js";

import {
    deployRule
} from "../services/firewallService.js";

import {
    extractIntentWithAI,
    generateExplanation
} from "../services/aiService.js";

export const processRequest =
async (req, res) => {

    try {

        const { message } = req.body;

        // ======================
        // STEP 1
        // Parse Request
        // ======================

        let intent =
            parseIntent(message);

        console.log(
            "Regex Parser:",
            intent
        );

        // ======================
        // STEP 2
        // AI Fallback
        // ======================

        if (
            !intent.action ||
            !intent.port
        ) {

            const aiIntent =
                await extractIntentWithAI(
                    message
                );

            console.log(
                "AI Parser:",
                aiIntent
            );

            if (aiIntent) {
                intent = {
                    ...intent,
                    ...aiIntent
                };
            }
        }

        console.log(
            "Final Intent:",
            intent
        );

        // ======================
        // STEP 3
        // Policy Engine
        // Returns structured findings:
        // [{ rule, severity, reason, recommendation }]
        // ======================

        const violations =
            checkPolicies(
                intent
            );

        console.log(
            "Violations:",
            violations
        );

        // ======================
        // STEP 4
        // Risk Engine
        // Returns a structured assessment:
        // { score, level, factors, summary }
        // ======================

        const risk =
            assessRisk(
                intent
            );

        console.log(
            "Risk Assessment:",
            risk
        );

        // ======================
        // STEP 5
        // Decision Engine
        // Returns: { decision, justification }
        // ======================

        const decisionResult =
            makeDecision(
                risk,
                violations
            );

        const { decision, justification } =
            decisionResult;

        console.log(
            "Decision:",
            decision
        );

        console.log(
            "Justification:",
            justification
        );

        // ======================
        // STEP 6
        // AI Explanation
        // ======================

        const aiResponse =
            await generateExplanation(
                intent,
                decision,
                violations.map(
                    (v) => `${v.rule}: ${v.reason}`
                ),
                risk.score
            );

        console.log(
            "AI Response:",
            aiResponse
        );

        // ======================
        // STEP 7
        // Firewall Deployment
        // deployRule now returns:
        // { success, rule, reason, deployedAt }
        // ======================

        let firewallStatus =
            "NO ACTION";

        let deployment = null;

        if (
            decision ===
            "APPROVED"
        ) {

            deployment =
                await deployRule(
                    intent
                );

            firewallStatus =
                deployment.success
                    ? "DEPLOYED"
                    : "DEPLOYMENT FAILED";

            if (deployment.success) {

                await Rule.create({

                    ...intent,

                    riskScore:
                        risk.score,

                    riskLevel:
                        risk.level,

                    iptablesRule:
                        deployment.rule,

                    firewallStatus
                });
            }
        }

        // ======================
        // STEP 8
        // Save Log
        // ======================

        const log =
            await Log.create({

                message,

                parsedIntent:
                    intent,

                decision,

                decisionJustification:
                    justification,

                riskScore:
                    risk.score,

                riskLevel:
                    risk.level,

                riskFactors:
                    risk.factors,

                violations,

                explanation:
                    aiResponse.explanation,

                recommendation:
                    aiResponse.recommendation,

                firewallStatus,

                iptablesRule:
                    deployment?.rule || null,

                deploymentReason:
                    deployment?.reason || null
            });

        // ======================
        // STEP 9
        // Response
        // ======================

        res.status(200).json({
            success: true,
            message:
                "Request processed successfully",

            parsedIntent:
                intent,

            decision,

            decisionJustification:
                justification,

            riskScore:
                risk.score,

            riskLevel:
                risk.level,

            riskFactors:
                risk.factors,

            riskSummary:
                risk.summary,

            violations,

            explanation:
                aiResponse.explanation,

            recommendation:
                aiResponse.recommendation,

            firewallStatus,

            iptablesRule:
                deployment?.rule || null,

            deploymentReason:
                deployment?.reason || null,

            logId:
                log._id
        });

    }
    catch (err) {

        console.log(
            "Bot Controller Error:",
            err
        );

        res.status(500).json({
            success: false,
            message:
                "Server Error"
        });
    }
};