import express from "express";

import {
    getRules,
    getRule,
    deleteRule,
    toggleRule
}
from "../controllers/ruleController.js";

const router =
    express.Router();

router.get(
    "/",
    getRules
);

router.get(
    "/:id",
    getRule
);

router.delete(
    "/:id",
    deleteRule
);

router.patch(
    "/:id/toggle",
    toggleRule
);

export default router;