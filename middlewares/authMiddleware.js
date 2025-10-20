const jwt = require("jsonwebtoken")

const authenticate = (req, res, next) => {
    const token = req.cookies.token;

    

    if (!token) {
        return res.status(401).redirect("/auth/login")
    }


    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();

    } catch (error) {
        console.log(error);
        return res.status(401).redirect("/auth/login")
    }
}

const alreadyLoggin = (req, res, next) => {
    const token = req.cookies.token;

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            switch (decoded.role) {
                case "superadmin":
                    return res.redirect("/superadmin/dashboard")
                case "admin":
                    return res.redirect("/admin/dashboard")
                case "worker":
                    return res.redirect("/worker/dashboard");
                case "customer":
                    return res.redirect("/customer/dashboard");
                default:
                    return res.redirect("/");
            }

        } catch (error) {
            console.log("Token verify error:", error.message);
            return next()
        }
    }

    next()

}

function checkBlocked(req, res, next) {
  if (req.user && req.user.status === "Blocked") {
    return res.status(403).render("blocked", { message: "You are blocked by SuperAdmin." , layout: false});
  }
  next();
}



module.exports = {
    authenticate,
    alreadyLoggin,
    checkBlocked,
  
};