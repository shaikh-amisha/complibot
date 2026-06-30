import express
from "express";

import {
    processRequest
}
from "../controllers/botController.js";

const router =
express.Router();

router.post(
    "/chat",
    processRequest
);

export default router;