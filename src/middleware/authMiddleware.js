const jwt = require('jsonwebtoken');

//      - 401 : Missing or malformed Authorization header or Invalid or expired token
//      - req.user, next() :  decoded claims are attached to req.user, then next()
function authenticate(req, res, next) {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
        return res.status(401).json({
            error: "Missing token"
        });
    }

    const token = header.slice(7);

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        // if invalid user_id
        if (!Number.isInteger(payload.user_id)) {
            return res.status(401).json({
                error: "Invalid token payload"
            });
        }

        req.user = {
            user_id: payload.user_id
        };

        return next();
    } catch (err) {
        return res.status(401).json({
            error: "Invalid or expired token"
        });
    }
}

module.exports = { authenticate };