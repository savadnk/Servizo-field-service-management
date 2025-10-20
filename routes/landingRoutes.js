const express = require("express")
const router = express.Router();

router.get("/", (req, res) => {
  res.render("landing", { layout: false }); // render landing.ejs
});

module.exports = router;