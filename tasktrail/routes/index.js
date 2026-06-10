const express = require("express");
const router = express.Router();
const path = require("path");
const { Token } = require("./enums");

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const bcrypt = require("bcrypt");
const crypto = require("crypto");
const validator = require("validator");
const hbs = require("nodemailer-express-handlebars");

const passport = require("passport");

const { SMTP_PORT, MAIL_HOST, MAIL_USER, MAIL_PASSWD, APP_NAME, APP_DOMAIN } = process.env;
const { checkPasswords, setMailTransport, setHandlebar, setMailData, setTokenExpiracy } = require("./helpers");

const transporter = setMailTransport(SMTP_PORT, MAIL_HOST, MAIL_USER, MAIL_PASSWD);
const handlebarOptions = setHandlebar(".handlebars", path.join(__dirname, "../views/email"));

transporter.use("compile", hbs(handlebarOptions));

//#region index
router.get("/", function (req, res, next) {
	res.render("index", { title: APP_NAME, consent: req.cookies.consent, lang: req.cookies.lang });
});
//#endregion

//#region login
function login(req, res, next) {
	const message = req.query.passwordChangedSuccess;
	// compare if the session is an empty object
	// if is not empty means theres a cookie session stablished
	// so we redirect the user to the home page.
	if (JSON.stringify(req.session) !== "{}") {
		return res.redirect("/u/home");
	}

	let email = req.body.email;

	let error;
	if (req.error) {
		error = req.error.login;
	}

	res.render("login", { title: req.__("navigation.login"), error: error, email: email, passwordChangedSuccess: message, lang: req.cookies.lang });
}

function errorLogin(req, res, next) {
	req.error = {
		login: req.__("login.error.incorrectUser")
	};

	return next();
}

router.get("/login", login);

router.post(
	"/login",
	async function (req, res, next) {
		let error = false;
		let email = validator.isEmail(req.body.email) ? req.body.email : false;
		let password = req.body.password;

		if (!email) return next();

		const user = await prisma.users.findUnique({
			where: {
				email: email
			}
		});

		if (!user || user.disabled) return next();
		if (user.provider_id) return next();

		if (await bcrypt.compare(password, user.password)) {
			req.session.username = user.username;
			req.session.userid = user.id;
			req.session.verified = user.verified;
			req.session.email = user.email;
			req.session.img = user.img;
			req.session.role = user.role;
			req.session.locale = user.locale;

			return res.redirect("/u/home");
		}

		return next();
	},
	errorLogin,
	login
);
//#endregion

//#region login google oauth2
router.get("/login/google", function (req, res, next) {
	if (!req.app.get("googleAuthEnabled")) {
		return res.status(503).send("Google login is not configured.");
	}

	return passport.authenticate("google", { scope: ["email", "profile"] })(req, res, next);
});

router.get("/login/google/callback", function (req, res, next) {
	if (!req.app.get("googleAuthEnabled")) {
		return res.redirect("/login/google/failed");
	}

	return passport.authenticate("google", { failureRedirect: "/login/google/failed", successRedirect: "/u/home" })(req, res, next);
});

router.get("/login/google/failed", function (req, res, next) {
	res.send("error google");
});
//#endregion

//#region logout
router.get("/logout", function (req, res, next) {
	// as the user is loging out we destroy the cookie session
	req.session = null;

	res.redirect("/");
});
//#endregion

//#region signup
function signup(req, res, next) {
	let username = req.body.username;
	let email = req.body.email;

	res.render("signup", { title: req.__("navigation.signup"), username: username, email: email, lang: req.cookies.lang });
}

router.get("/signup", signup);

router.post(
	"/signup",
	async function (req, res, next) {
		let username = validator.isAlphanumeric(req.body.username, "es-ES") ? req.body.username : false;
		let email = validator.isEmail(req.body.email) ? req.body.email : false;
		let password = req.body.password;
		let password2 = req.body.password2;

		if (!(checkPasswords(password, password2) && username && email)) return next();

		try {
			const hashedPassword = await bcrypt.hash(password, 10);
			const user = await prisma.$transaction(async tx => {
				const userCount = await tx.users.count();
				return tx.users.create({
					data: {
						username: username,
						email: email,
						password: hashedPassword,
						role: userCount === 0 ? "ADMIN" : "MEMBER",
						locale: "en"
					}
				});
			});

			const token = crypto.randomBytes(16).toString("hex");

			const emailContext = {
				linkUrl: `${APP_DOMAIN}/verify/${token}`,
				linkText: req.__("email.verify.link"),
				isVerify: true,
				isEnglish: req.getLocale() === "en",
				isSpanish: req.getLocale() === "es"
			};

			const mailData = setMailData(`"${APP_NAME} 📝📌" <${MAIL_USER}>`, user.email, req.__("email.verify.subject"), emailContext);

			transporter.sendMail(mailData, async (error, info) => {
				if (error) console.error(error);
				else {
					const TOKEN_MINUTES = 5;

					await prisma.tokens.create({
						data: {
							user_id: user.id,
							type_id: Token.TOKEN_TYPES.VERIFY,
							value: token,
							expiracy: setTokenExpiracy(new Date(), TOKEN_MINUTES)
						}
					});
				}
			});

			res.redirect("/login");
		} catch (e) {
			// console.log(`ERROR----------\n${e}`);
			return next();
		}
	},
	signup
);
//#endregion

//#region about
router.get("/about", function (req, res, next) {
	res.render("about", { title: req.__("navigation.about"), consent: req.cookies.consent, lang: req.cookies.lang });
});
//#endregion

//#region downloads
router.get("/download", function (req, res, next) {
	let userAgent = req.get("User-Agent").split(/[()]/)[1];

	let systems = [
		{ agent: "Windows", name: "Windows", url: "/media/installers/tasktrail-1.0.0-setup.exe", desc: "x64 bits", icon: "fa-windows" },
		{ agent: "Macintosh", name: "Mac OS", url: "/media/installers/tasktrail-1.0.0.dmg", desc: "x64 bits", icon: "fa-apple" },
		{ agent: "Linux", name: "Ubuntu (.deb)", url: "/media/installers/tasktrail_1.0.0_amd64.deb", desc: "x64 bits", icon: "fa-ubuntu" },
		{ agent: "Linux", name: "Red Hat (.rpm)", url: "/media/installers/tasktrail-1.0.0.x86_64.rpm", desc: "x64 bits", icon: "fa-redhat" }
	];

	// console.log(userAgent);

	let system = systems.find(s => {
		return userAgent.toLowerCase().includes(s.agent.toLowerCase());
	});
	if (system !== undefined) systems.splice(systems.indexOf(system), 1);

	// console.log(systems);

	res.render("download", { title: req.__("navigation.download"), consent: req.cookies.consent, system: system, systems: systems, lang: req.cookies.lang });
});
//#endregion

//#region tos
router.get("/tos", function (req, res, next) {
	res.render("tos", { title: req.__("navigation.tos"), consent: req.cookies.consent, lang: req.cookies.lang });
});
//#endregion

module.exports = router;
