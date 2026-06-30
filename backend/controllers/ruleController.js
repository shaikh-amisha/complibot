import Rule from "../models/Rule.js";

export const getRules =
async (req, res) => {

    try {

        const rules =
            await Rule.find()
                .sort({
                    createdAt: -1
                });

        res.json(rules);
    }
    catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};

export const getRule =
async (req, res) => {

    try {

        const rule =
            await Rule.findById(
                req.params.id
            );

        res.json(rule);
    }
    catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};

export const deleteRule =
async (req, res) => {

    try {

        await Rule.findByIdAndDelete(
            req.params.id
        );

        res.json({
            message:
                "Rule deleted."
        });
    }
    catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};

export const toggleRule =
async (req, res) => {

    try {

        const rule =
            await Rule.findById(
                req.params.id
            );

        rule.enabled =
            !rule.enabled;

        await rule.save();

        res.json(rule);
    }
    catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};