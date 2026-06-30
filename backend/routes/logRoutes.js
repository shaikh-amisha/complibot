import express
from "express";

import Log
from "../models/Log.js";

const router =
    express.Router();

router.get(
    "/",
    async (req, res) => {

        try {

            const logs =
                await Log.find()
                .sort({
                    createdAt: -1
                });

            res.json(logs);
        }
        catch (err) {

            res.status(500)
            .json({
                message:
                    err.message
            });
        }
    }
);

export default router;