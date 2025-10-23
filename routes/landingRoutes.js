const express = require("express")
const router = express.Router();

router.get("/", (req, res) => {
  res.render("landing", { layout: false }); // render landing.ejs
});

router.get("/error", (req, res) => {
  res.render("error", { layout: false }); // render about.ejs
});

router.get("/blocked", (req, res) => {
  res.render("blocked", { layout: false }); // render about.ejs
});
module.exports = router;