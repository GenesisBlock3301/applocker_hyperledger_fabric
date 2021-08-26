const jwt = require('jsonwebtoken')

module.exports = function (req, res, next) {
    const token = req.cookies.token
    console.log(token)
    if (!token) return res.status(401).json({ error: "Access Denied..." })
    try {

        const verified = jwt.verify(token, process.env.TOKEN_SECRET)
        req.user = verified;
        next();
    } catch (err) {
        return res.status(401).json({ error: "Invalid token..." })
    }
}