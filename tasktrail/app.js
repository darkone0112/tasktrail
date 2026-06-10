var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var cookieSession = require("cookie-session");
var i18n = require("i18n");

require("dotenv").config();

// const https = require("https");
const passport = require("passport");

var app = express();

const cookieKeys = (process.env.COOKIE_KEYS || "p9qMAnmUc8g8c1teljsW,OMV16kITrlbKpCQJn4h4")
	.split(",")
	.map(key => key.trim())
	.filter(Boolean);

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var apiRouter = require("./routes/api");
var tokensRouter = require("./routes/tokens");

// use session with cookie-session
app.use(
	cookieSession({
		name: "session",
		keys: cookieKeys
	})
);

function addCookieSessionMethods(req) {
	Object.defineProperties(req.session, {
		regenerate: {
			value: callback => {
				req.session = {};
				addCookieSessionMethods(req);
				callback();
			}
		},
		save: {
			value: callback => callback()
		}
	});
}

// Passport 0.6+ requires the session store to regenerate and save sessions.
// cookie-session stores all state client-side, so provide equivalent hooks.
app.use((req, res, next) => {
	addCookieSessionMethods(req);
	next();
});

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

i18n.configure({
	locales: ["es", "en"],
	directory: path.join(__dirname, "/public/i18n"),
	cookie: "lang",
	defaultLocale: "en",
	objectNotation: true
});

app.use(i18n.init);

app.use((req, res, next) => {
	res.setLocale(req.cookies.lang || i18n.getLocale());
	next();
});

const googleAuthEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_CALLBACK_URL);
app.set("googleAuthEnabled", googleAuthEnabled);

if (googleAuthEnabled) {
	require("./middleware/google");
}

app.use(passport.initialize());
app.use(passport.session());

app.use("/", indexRouter, tokensRouter);
app.use("/u", usersRouter);
app.use("/api", apiRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
	next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get("env") === "development" ? err : {};

	// render the error page
	res.status(err.status || 500);
	res.render("error");
});

module.exports = app;
