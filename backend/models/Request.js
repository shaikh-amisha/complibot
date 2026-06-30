import mongoose from mongoose;

const requestSchema =
new mongoose.Schema({

    message: String,

    parsedIntent: Object,

    decision: String,

    riskScore: Number,

    violations: [String],

    recommendation: String,

    firewallStatus: String

},{
    timestamps:true
});

module.exports =
mongoose.model(
    "Request",
    requestSchema
);