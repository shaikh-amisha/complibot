import Log from "../models/Log.js";
import Rule from "../models/Rule.js";

export const getDashboard =
async (req, res) => {

    try {

        const totalRequests =
            await Log.countDocuments();

        const approved =
            await Log.countDocuments({
                decision: "APPROVED"
            });

        const rejected =
            await Log.countDocuments({
                decision: "REJECTED"
            });

        // Rule schema uses `enabled: Boolean`, not a `status`
        // string field — the previous query
        // (Rule.countDocuments({ status: "ACTIVE" })) always
        // matched 0 documents since that field never existed.
        const activeRules =
            await Rule.countDocuments({
                enabled: true
            });

        const recentRequests =
            await Log.find()
            .sort({
                createdAt: -1
            })
            .limit(5);

            const riskLow = await Log.countDocuments({
                riskScore: { $lt: 40 }
            });

            const riskMedium = await Log.countDocuments({
                riskScore: {
                    $gte: 40,
                    $lt: 80
                }
            });

            const riskHigh = await Log.countDocuments({
                riskScore: { $gte: 80 }
            });

        res.json({
            totalRequests,
            approved,
            rejected,
            activeRules,
            recentRequests,
            riskLow,
            riskMedium,
            riskHigh
        });

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }
};