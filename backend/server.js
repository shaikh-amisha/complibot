import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import express from "express";

import { connectDB }
from "./config/db.js";

import botRoutes
from "./routes/botRoutes.js";

import ruleRoutes
from "./routes/ruleRoutes.js";


import dashboardRoutes 
from "./routes/dashboardRoutes.js";

 
import logRoutes
from "./routes/logRoutes.js";




const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/bot", botRoutes);
app.use("/api/rules", ruleRoutes);
app.use( "/api/dashboard",dashboardRoutes);
app.use("/api/logs", logRoutes);

connectDB();

const PORT =
process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(
        `Server running on ${PORT}`
    );
});