const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const fileguard = require("@thesameeric/fileguard");
const path = require("path");
const { Token } = require("./enums");
const validator = require("validator");

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const hbs = require("nodemailer-express-handlebars");
const crypto = require("crypto");

const { SMTP_PORT, MAIL_HOST, MAIL_USER, MAIL_PASSWD, APP_NAME, APP_DOMAIN } = process.env;
const { setMailTransport, setHandlebar, setMailData, setTokenExpiracy } = require("./helpers");
const { error, log } = require("console");

const transporter = setMailTransport(SMTP_PORT, MAIL_HOST, MAIL_USER, MAIL_PASSWD);
const handlebarOptions = setHandlebar(".handlebars", path.join(__dirname, "../views/email"));

transporter.use("compile", hbs(handlebarOptions));

router.get("/get/session", async function (req, res, next) {
	try {
		if (req.session.passport?.user) {
			return res.json(req.session.passport.user);
		}

		if (!req.session.userid) {
			return res.status(401).json({ error: "Authentication required" });
		}

		const user = await prisma.users.findUnique({
			where: {
				id: req.session.userid
			}
		});

		if (!user || user.disabled) {
			req.session = null;
			return res.status(401).json({ error: "Session user is unavailable" });
		}

		req.session.username = user.username;
		req.session.verified = user.verified;
		req.session.email = user.email;
		req.session.img = user.img;

		return res.json(req.session);
	} catch (error) {
		return next(error);
	}
});

//#region tasks
router.get("/get/tasks", async function (req, res, next) {
	let errors = {};
	errors.session = false;

	if (JSON.stringify(req.session) !== "{}") {
		errors.query = false;

		const userid = req.session.userid;

		let tasks;
		try {
			tasks = await prisma.tasks.findMany({
				where: {
					user_id: userid
				},
				orderBy: { order: "asc" }
			});
		} catch (e) {
			errors.query = true;
		}

		res.json(tasks);
	}
});

router.get("/get/tasks/:number", async function (req, res, next) {
	const number = Number(req.params.number);
	let errors = {};
	errors.session = false;

	if (number === 0) return;

	if (JSON.stringify(req.session) !== "{}") {
		errors.query = false;

		const userid = req.session.userid;

		let tasks;
		try {
			tasks = await prisma.tasks.findMany({
				where: {
					user_id: userid,
					date: { gte: new Date() },
					done: false
				},
				orderBy: { date: "asc" },
				take: number
			});
		} catch (e) {
			errors.query = true;
		}

		res.json(tasks);
	}
});

router.get("/get/tasks/:skip/:take/:filter", async function (req, res, next) {
	const skip = Number(req.params.skip);
	const take = Number(req.params.take);
	let errors = {};
	errors.session = false;

	if (take === 0) return;

	if (JSON.stringify(req.session) !== "{}") {
		errors.query = false;

		const userid = req.session.userid;

		const filter = Token.FILTERS[req.params.filter];

		let whereQuery = { user_id: userid };
		if (filter !== undefined) whereQuery.done = filter;

		let tasks;
		try {
			tasks = await prisma.tasks.findMany({
				where: whereQuery,
				skip: skip,
				take: take,
				orderBy: { order: "asc" }
			});
		} catch (e) {
			errors.query = true;
		}

		res.json(tasks);
	}
});

router.post("/insert/task", async function (req, res, next) {
	let errors = {};
	errors.session = false;

	if (JSON.stringify(req.session) !== "{}") {
		errors.query = false;
		const userid = req.session.userid ?? req.session.passport.user.userid;

		let task = JSON.parse(req.body.task);

		try {
			await prisma.tasks.create({
				data: {
					order: 0,
					name: task.name,
					done: false,
					edit: false,
					date: task.date,
					Users: {
						connect: {
							id: userid
						}
					}
				}
			});
		} catch (e) {
			errors.query = true;
			// console.log(e);
		}
	}

	res.json(errors);
});

router.post("/upsert/tasks", async function (req, res, next) {
	let errors = {};
	errors.session = false;

	if (JSON.stringify(req.session) !== "{}") {
		errors.query = false;

		let userid = req.session.userid ?? req.session.passport.user.userid;
		let tasks = JSON.parse(req.body.tasks);

		let values;

		let index = 1;
		for (const task of tasks) {
			values = {
				id: task.id,
				user_id: userid,
				order: index,
				name: task.name,
				done: task.done,
				edit: false,
				date: task.date
			};

			try {
				await prisma.tasks.upsert({
					where: { id: values.id },
					update: values,
					create: values
				});
			} catch (e) {
				errors.query = true;
				// console.log(`ERROR----------\n${e}`);
				return next();
			}

			index++;
		}
	}

	res.json(errors);
});

router.post("/delete/task", async function (req, res, next) {
	let errors = {};
	errors.session = false;

	if (JSON.stringify(req.session) !== "{}") {
		errors.query = false;

		let task = JSON.parse(req.body.task);

		try {
			await prisma.tasks.delete({
				where: {
					id: task.id
				}
			});
		} catch (e) {
			errors.query = true;
		}
	}

	res.json(errors);
});
//#endregion

router.post("/verify/mail/", async function (req, res, next) {
	let errors = {};
	errors.session = false;

	if (JSON.stringify(req.session) !== "{}" && !req.session.verified) {
		errors.query = false;

		try {
			const token = crypto.randomBytes(16).toString("hex");

			const emailContext = {
				linkUrl: `${APP_DOMAIN}/verify/${token}`,
				linkText: req.__("email.verify.link"),
				isVerify: true,
				isEnglish: req.getLocale() === "en",
				isSpanish: req.getLocale() === "es"
			};

			const mailData = setMailData(`"${APP_NAME} 📝📌" <${MAIL_USER}>`, req.session.email, req.__("email.verify.subject"), emailContext);

			transporter.sendMail(mailData, async (error, info) => {
				if (error) console.error(error);
				else {
					const TOKEN_MINUTES = 5;

					await prisma.tokens.create({
						data: {
							user_id: req.session.userid,
							type_id: Token.TOKEN_TYPES.VERIFY,
							value: token,
							expiracy: setTokenExpiracy(new Date(), TOKEN_MINUTES)
						}
					});
				}
			});
		} catch (e) {
			// console.log(e);
			errors.query = true;
		}
	}
});

//#region kanban
router.post("/save/kanban", async function (req, res, next) {
	let errors = {};
	errors.session = false;

	if (JSON.stringify(req.session) !== "{}") {
		errors.query = false;

		let userid = req.session.userid ?? req.session.passport.user.userid;

		let kanban = JSON.parse(req.body.kanban);

		kanban.forEach(async (column, index) => {
			try {
				let columnData = await prisma.kanbanColumns.upsert({
					where: {
						id: column.id == null ? -1 : column.id
					},
					create: {
						order: index,
						title: column.title,
						color: column.color,
						userid: userid
					},
					update: {
						order: index,
						title: column.title,
						color: column.color,
						userid: userid
					}
				});

				if (column.tasks.length !== 0) {
					column.tasks.forEach(async (task, index) => {
						await prisma.kanbanTasks.update({
							where: {
								id_userid: {
									id: task.id,
									userid: userid
								}
							},
							data: {
								id: task.id,
								order: index,
								name: task.name,
								priority: task.priority,
								kanbanColumnsId: columnData.id,
								userid: userid
							}
						});
					});
				}
			} catch (e) {
				errors.query = true;
			}
		});
	}

	res.json(errors);
});

router.get("/get/kanban", async function (req, res, next) {
	let errors = {};
	errors.session = false;

	if (JSON.stringify(req.session) !== "{}") {
		errors.query = false;

		let userid = req.session.userid ?? req.session.passport.user.userid;
		let kanban = [];

		try {
			let columns = await prisma.kanbanColumns.findMany({
				where: {
					userid: userid
				},
				orderBy: {
					order: "asc"
				}
			});

			if (columns.length == 0) return res.json([]);

			for (let column of columns) {
				let tasks = await prisma.kanbanTasks.findMany({
					where: {
						kanbanColumnsId: column.id
					},
					orderBy: {
						order: "asc"
					}
				});

				column.tasks = tasks;

				kanban.push(column);
			}

			return res.json(kanban);
		} catch (e) {
			errors.query = true;
			// console.log(e);
		}
	}

	res.json(errors);
});

router.post("/insert/kanban-task", async function (req, res, next) {
	let errors = {};
	errors.session = false;

	let column = JSON.parse(req.body.column);
	let task = JSON.parse(req.body.task);

	if (JSON.stringify(req.session) !== "{}") {
		let userid = req.session.userid ?? req.session.passport.user.userid;

		try {
			maxid = await prisma.kanbanTasks.findFirst({
				where: {
					userid: userid
				},
				select: {
					id: true
				},
				orderBy: {
					id: "desc"
				}
			});

			await prisma.kanbanTasks.create({
				data: {
					id: maxid == null ? 0 : ++maxid.id,
					order: 0,
					name: task.name,
					priority: task.priority,
					kanbanColumnsId: column.id,
					userid: userid
				}
			});
		} catch (e) {
			errors.query = true;
			// console.log(e);
		}
	}

	res.json(errors);
});

router.post("/delete/kanban-column", async function (req, res, next) {
	let errors = {};
	errors.session = false;

	let column = JSON.parse(req.body.column);

	if (JSON.stringify(req.session) !== "{}") {
		// console.log(JSON.stringify(column));

		try {
			await prisma.kanbanColumns.delete({
				where: {
					id: column.id
				}
			});
		} catch (e) {
			errors.query = true;
			// console.log(e);
		}
	}

	res.json(errors);
});

router.post("/delete/kanban-column", async function (req, res, next) {
	let errors = {};
	errors.session = false;

	let column = JSON.parse(req.body.column);

	if (JSON.stringify(req.session) !== "{}") {
		// console.log(JSON.stringify(column));

		try {
			await prisma.kanbanColumns.delete({
				where: {
					id: column.id
				}
			});
		} catch (e) {
			errors.query = true;
			// console.log(e);
		}
	}

	res.json(errors);
});

router.post("/delete/kanban-task", async function (req, res, next) {
	let errors = {};
	errors.session = false;

	let task = JSON.parse(req.body.task);

	if (JSON.stringify(req.session) !== "{}") {
		let userid = req.session.userid ?? req.session.passport.user.userid;
		// console.log(JSON.stringify(task));

		try {
			await prisma.kanbanTasks.delete({
				where: {
					id_userid: {
						id: task.id,
						userid: userid
					}
				}
			});
		} catch (e) {
			errors.query = true;
			// console.log(e);
		}
	}

	res.json(errors);
});
//#endregion

//#region user profile
router.post("/delete/account", async function (req, res, next) {
	let errors = {};
	errors.session = false;

	if (JSON.stringify(req.session) !== "{}") {
		errors.query = false;

		const userId = req.session.userid || req.session.passport.user.userid;

		try {
			await prisma.Users.update({
				where: { id: userId },
				data: { disabled: true }
			});
			req.session = null;
		} catch (e) {
			// console.log(e);
			errors.query = true;
		}
	} else {
		errors.session = true;
	}

	const hasErrors = Object.values(errors).some(value => value === true) ? true : false;

	if (!hasErrors) {
		return res.redirect("/login");
	} else {
		return res.redirect("/u/profile/?error=true");
	}
});

// Multer configuration
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, "./public/media/images/uploads/");
	},
	filename: function (req, file, cb) {
		const date = new Date().toISOString().replace(/:/g, "-");
		const extension = file.mimetype.substring(file.mimetype.indexOf("/") + 1);
		const filename = `${date}-${req.session.userid || req.session.passport.user.userid}.${extension}`;
		cb(null, filename);
	}
});

// File validation
const upload = multer({
	storage: storage,
	fileFilter: function (req, file, cb) {
		const validatedFile = fileguard.default.file(file).size(8).type(["png", "jpg", "jpeg"]);
		if (!validatedFile.error) {
			cb(null, true);
		} else {
			cb(null, false);
		}
	}
});

router.post("/update/profile", upload.single("pfp"), async function (req, res, next) {
	let errors = {};
	errors.session = false;
	errors.query = false;

	if (req.session) {
		const userId = req.session.userid || req.session.passport.user.userid;
		const user = req.session.username;

		// Username validation
		const MAX_LENGTH = 24;
		const MIN_LENGTH = 3;

		// Assign username from input. If not then from session.
		const usernameInput = req.body.usernameInput != "" || req.body.usernameInput != undefined ? req.body.usernameInput.trim() : user;

		if (!usernameInput || !validator.isLength(usernameInput, { min: MIN_LENGTH, max: MAX_LENGTH })) {
			errors.username = true;
			return;
		} else {
			// Update username in the session
			req.session.username = user != usernameInput ? usernameInput : user;
		}

		// Get current profile picture from database
		const currentPfp = await prisma.Users.findFirst({
			where: { id: userId },
			select: {
				img: true
			}
		}).then(result => result.img);
		let newPfp = currentPfp;

		// Check if the file is not undefined
		const file = req.file;
		if (file !== undefined) {
			newPfp = file.path.replace("public", "");

			// Update image path in the session
			req.session.img = newPfp;

			// Delete the old profile picture if exists and it's not the default picture
			if (currentPfp && !currentPfp.endsWith("userpic.png")) {
				try {
					fs.unlinkSync("./public" + currentPfp);
				} catch (error) {
					return;
				}
			}
		}

		// Check if there are any errors
		const hasErrors = Object.values(errors).some(value => value === true) ? true : false;

		if (!hasErrors) {
			// Update username and profile picture in the database
			try {
				await prisma.Users.update({
					where: { id: userId },
					data: {
						username: usernameInput,
						img: newPfp
					}
				});

				req.session.img = newPfp;

				return res.redirect("/u/profile");
			} catch (e) {
				// console.log(`ERROR----------\n${e}`);
			}
		} else {
			return res.redirect("/u/profile/?error=true");
		}
	} else {
		errors.session = true;
	}

	return res.redirect("/u/profile");
});
//#endregion

router.post("/recover/mail/", async function (req, res, next) {
	// console.log("HA ENTRADO A recover/mail");
	let errors = {};
	errors.session = false;

	errors.query = false;

	try {
		const token = crypto.randomBytes(16).toString("hex");

		const emailContext = {
			linkUrl: `${APP_DOMAIN}/recover/${token}`,
			linkText: "Cambiar contraseña",
			isRecover: true,
			isEnglish: req.getLocale() === "en",
			isSpanish: req.getLocale() === "es"
		};

		const mailData = setMailData(`"${APP_NAME} 📝📌" <${MAIL_USER}>`, req.session.email, "Cambio de contraseña", emailContext);
		// console.log(mailData);
		transporter.sendMail(mailData, async (error, info) => {
			if (error) console.error(error);
			else {
				const TOKEN_MINUTES = 5;

				await prisma.tokens.create({
					data: {
						user_id: req.session.userid,
						type_id: Token.TOKEN_TYPES.RECOVER,
						value: token,
						expiracy: setTokenExpiracy(new Date(), TOKEN_MINUTES)
					}
				});
			}
		});
	} catch (e) {
		// console.log(e);
		errors.query = true;
	}
});

module.exports = router;
