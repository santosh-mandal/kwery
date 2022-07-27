const jwt = require("jsonwebtoken");

const config = process.env;
var ObjectId = require('mongodb').ObjectId;

const verifyToken = (req, res, next) => {
    const token =
        req.body.token || req.query.token || req.headers["x-access-token"];
    if (!token) {
        return res.status(403).send("A token is required for authentication");
    }
    try {
        const decoded = jwt.verify(token, config.JWT_SECRET);
        req.user = decoded;
        req.user._id = ObjectId(req.user._id);;
    } catch (err) {
        let responce = {
            "message": "Invalid Token.",
        };
        return res.status(401).send(responce);
    }
    return next();
};

module.exports = verifyToken;