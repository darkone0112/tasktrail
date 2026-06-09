const express = require("express");
const router = express.Router();

/* GET users listing. */
router.get("/*", function (req, res, next) {
	if (req.session.userid || req.session.passport?.user) {
		const session = {
			username: req.session.username,
			userid: req.session.userid
		};
		return res.render("home", { title: "Home", session: session });
	}

	return res.redirect("/login");
});

module.exports = router;
