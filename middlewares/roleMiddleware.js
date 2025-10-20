const authorizeRoles = (...roles) => {
    return (req, res, next) => {

        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).render("auth/login", { error: "Access DEnied", layout: false},)
        }

        next()
    };
};

module.exports = authorizeRoles;