const jwt = require("jsonwebtoken");
const jwtSecret = process.env.JWT_SECRET;

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.status(401).json({ message: "Unauthorized" });
    jwt.verify(token, jwtSecret, (err, user) => {
        if (err) return res.status(403).json({ message: "Unauthorized" });
        req.user = user;
        next();
    });
}

module.exports = authenticateToken;
