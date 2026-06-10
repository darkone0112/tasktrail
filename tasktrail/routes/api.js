const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const fileguard = require("@thesameeric/fileguard");
const path = require("path");
const { Token } = require("./enums");
const validator = require("validator");

const { prisma, requireUser, requireAdmin, getAccessibleBoard } = require("./access");

const hbs = require("nodemailer-express-handlebars");
const crypto = require("crypto");

const { SMTP_PORT, MAIL_HOST, MAIL_USER, MAIL_PASSWD, APP_NAME, APP_DOMAIN } = process.env;
const { setMailTransport, setHandlebar, setMailData, setTokenExpiracy } = require("./helpers");

const transporter = setMailTransport(SMTP_PORT, MAIL_HOST, MAIL_USER, MAIL_PASSWD);
const handlebarOptions = setHandlebar(".handlebars", path.join(__dirname, "../views/email"));

transporter.use("compile", hbs(handlebarOptions));

router.use(requireUser);

router.get("/get/session", async function (req, res, next) {
	const user = req.currentUser;
	req.session.username = user.username;
	req.session.userid = user.id;
	req.session.verified = user.verified;
	req.session.email = user.email;
	req.session.img = user.img;
	req.session.role = user.role;
	req.session.locale = user.locale;

	return res.json({
		userid: user.id,
		username: user.username,
		email: user.email,
		img: user.img,
		verified: user.verified,
		role: user.role,
		locale: user.locale
	});
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
				const result = await prisma.tasks.updateMany({
					where: {
						id: values.id,
						user_id: userid
					},
					data: values
				});

				if (result.count === 0 && !values.id) {
					await prisma.tasks.create({
						data: {
							user_id: userid,
							order: values.order,
							name: values.name,
							done: values.done,
							edit: values.edit,
							date: values.date
						}
					});
				}
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
		const userid = req.currentUser.id;

		try {
			await prisma.tasks.deleteMany({
				where: {
					id: task.id,
					user_id: userid
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
async function ensureDefaultBoards(user) {
	let personalBoard = await prisma.kanbanBoards.findFirst({
		where: {
			owner_id: user.id,
			visibility: "PERSONAL"
		},
		orderBy: { id: "asc" }
	});

	if (!personalBoard) {
		personalBoard = await prisma.kanbanBoards.create({
			data: {
				name: "My board",
				visibility: "PERSONAL",
				owner_id: user.id
			}
		});
	}

	await prisma.kanbanColumns.updateMany({
		where: {
			userid: user.id,
			board_id: null
		},
		data: { board_id: personalBoard.id }
	});

	const teamBoardCount = await prisma.kanbanBoards.count({
		where: { visibility: "TEAM" }
	});

	if (teamBoardCount === 0) {
		await prisma.kanbanBoards.create({
			data: {
				name: "Team board",
				visibility: "TEAM",
				owner_id: user.id
			}
		});
	}
}

router.get("/kanban/boards", async function (req, res, next) {
	try {
		await ensureDefaultBoards(req.currentUser);

		const accessibleBoards = [
			{ visibility: "TEAM" },
			{ owner_id: req.currentUser.id },
			{ Access: { some: { user_id: req.currentUser.id } } }
		];
		if (req.currentUser.role === "ADMIN") {
			accessibleBoards.push({ visibility: "RESTRICTED" });
		}

		const boards = await prisma.kanbanBoards.findMany({
			where: { OR: accessibleBoards },
			orderBy: [{ visibility: "asc" }, { name: "asc" }],
			select: {
				id: true,
				name: true,
				visibility: true,
				owner_id: true,
				Owner: {
					select: { username: true }
				}
			}
		});

		return res.json(
			boards.map(board => ({
				id: board.id,
				name: board.name,
				visibility: board.visibility,
				ownerId: board.owner_id,
				ownerName: board.Owner.username,
				canDelete: board.visibility === "PERSONAL" ? board.owner_id === req.currentUser.id : req.currentUser.role === "ADMIN"
			}))
		);
	} catch (error) {
		return next(error);
	}
});

router.post("/kanban/boards", async function (req, res, next) {
	try {
		const name = String(req.body.name || "").trim();
		const visibility = req.body.visibility === "PERSONAL" ? "PERSONAL" : "TEAM";

		if (name.length < 1 || name.length > 100) {
			return res.status(400).json({ error: "Board name must be between 1 and 100 characters" });
		}

		const board = await prisma.kanbanBoards.create({
			data: {
				name,
				visibility,
				owner_id: req.currentUser.id
			}
		});

		return res.status(201).json(board);
	} catch (error) {
		return next(error);
	}
});

router.delete("/kanban/boards/:id", async function (req, res, next) {
	try {
		const board = await getAccessibleBoard(req.currentUser, req.params.id, true);
		if (!board) return res.status(404).json({ error: "Board not found" });

		const isCollaborative = board.visibility !== "PERSONAL";
		if (isCollaborative && req.currentUser.role !== "ADMIN") {
			return res.status(403).json({ error: "Only administrators can delete collaborative boards" });
		}
		if (!isCollaborative && board.owner_id !== req.currentUser.id) {
			return res.status(403).json({ error: "Only the owner can delete a personal board" });
		}

		await prisma.kanbanBoards.delete({
			where: { id: board.id }
		});
		return res.status(204).end();
	} catch (error) {
		return next(error);
	}
});

router.post("/save/kanban", async function (req, res, next) {
	try {
		const boardId = Number(req.body.boardId);
		const board = await getAccessibleBoard(req.currentUser, boardId, true);
		if (!board) return res.status(404).json({ error: "Board not found" });

		const kanban = Array.isArray(req.body.kanban) ? req.body.kanban : JSON.parse(req.body.kanban);

		await prisma.$transaction(async tx => {
			for (const [columnIndex, column] of kanban.entries()) {
				let columnData;
				if (column.id == null) {
					columnData = await tx.kanbanColumns.create({
						data: {
							order: columnIndex,
							title: String(column.title || "").slice(0, 191),
							color: column.color,
							userid: req.currentUser.id,
							board_id: board.id
						}
					});
				} else {
					const existingColumn = await tx.kanbanColumns.findFirst({
						where: {
							id: Number(column.id),
							board_id: board.id
						}
					});
					if (!existingColumn) throw new Error("Column does not belong to this board");

					columnData = await tx.kanbanColumns.update({
						where: { id: existingColumn.id },
						data: {
							order: columnIndex,
							title: String(column.title || "").slice(0, 191),
							color: column.color
						}
					});
				}

				for (const [taskIndex, task] of (column.tasks || []).entries()) {
					const existingTask = await tx.kanbanTasks.findUnique({
						where: {
							id_userid: {
								id: Number(task.id),
								userid: Number(task.userid)
							}
						},
						include: { KanbanColumns: true }
					});
					if (!existingTask || existingTask.KanbanColumns?.board_id !== board.id) {
						throw new Error("Task does not belong to this board");
					}

					await tx.kanbanTasks.update({
						where: {
							id_userid: {
								id: existingTask.id,
								userid: existingTask.userid
							}
						},
						data: {
							order: taskIndex,
							name: String(task.name || ""),
							priority: Number(task.priority) || 0,
							kanbanColumnsId: columnData.id
						}
					});
				}
			}
		});

		return res.json({ query: false });
	} catch (error) {
		return next(error);
	}
});

router.get("/get/kanban", async function (req, res, next) {
	try {
		const board = await getAccessibleBoard(req.currentUser, req.query.boardId, false);
		if (!board) return res.status(404).json({ error: "Board not found" });

		const columns = await prisma.kanbanColumns.findMany({
			where: { board_id: board.id },
			orderBy: { order: "asc" },
			include: {
				KanbanTasks: {
					orderBy: { order: "asc" }
				}
			}
		});

		return res.json(
			columns.map(column => ({
				...column,
				tasks: column.KanbanTasks,
				KanbanTasks: undefined
			}))
		);
	} catch (error) {
		return next(error);
	}
});

router.post("/insert/kanban-task", async function (req, res, next) {
	try {
		const column = req.body.column;
		const task = req.body.task;
		const board = await getAccessibleBoard(req.currentUser, req.body.boardId, true);
		if (!board) return res.status(404).json({ error: "Board not found" });

		const targetColumn = await prisma.kanbanColumns.findFirst({
			where: {
				id: Number(column.id),
				board_id: board.id
			}
		});
		if (!targetColumn) return res.status(404).json({ error: "Column not found" });

		const maxTask = await prisma.kanbanTasks.findFirst({
			where: { userid: req.currentUser.id },
			select: { id: true },
			orderBy: { id: "desc" }
		});

		await prisma.kanbanTasks.create({
			data: {
				id: maxTask == null ? 0 : maxTask.id + 1,
				order: 0,
				name: String(task.name || ""),
				priority: Number(task.priority) || 0,
				kanbanColumnsId: targetColumn.id,
				userid: req.currentUser.id
			}
		});

		return res.status(201).json({ query: false });
	} catch (error) {
		return next(error);
	}
});

router.post("/delete/kanban-column", async function (req, res, next) {
	try {
		const column = req.body.column;
		const board = await getAccessibleBoard(req.currentUser, req.body.boardId, true);
		if (!board) return res.status(404).json({ error: "Board not found" });

		const result = await prisma.kanbanColumns.deleteMany({
			where: {
				id: Number(column.id),
				board_id: board.id
			}
		});
		if (result.count === 0) return res.status(404).json({ error: "Column not found" });
		return res.json({ query: false });
	} catch (error) {
		return next(error);
	}
});

router.post("/delete/kanban-task", async function (req, res, next) {
	try {
		const task = req.body.task;
		const board = await getAccessibleBoard(req.currentUser, req.body.boardId, true);
		if (!board) return res.status(404).json({ error: "Board not found" });

		const existingTask = await prisma.kanbanTasks.findUnique({
			where: {
				id_userid: {
					id: Number(task.id),
					userid: Number(task.userid)
				}
			},
			include: { KanbanColumns: true }
		});
		if (!existingTask || existingTask.KanbanColumns?.board_id !== board.id) {
			return res.status(404).json({ error: "Task not found" });
		}

		await prisma.kanbanTasks.delete({
			where: {
				id_userid: {
					id: existingTask.id,
					userid: existingTask.userid
				}
			}
		});
		return res.json({ query: false });
	} catch (error) {
		return next(error);
	}
});
//#endregion

//#region settings and permissions
router.put("/settings/locale", async function (req, res, next) {
	try {
		const locale = req.body.locale === "es" ? "es" : "en";
		await prisma.users.update({
			where: { id: req.currentUser.id },
			data: { locale }
		});
		req.session.locale = locale;
		res.cookie("lang", locale, { sameSite: "lax" });
		return res.json({ locale });
	} catch (error) {
		return next(error);
	}
});

router.get("/admin/users", requireAdmin, async function (req, res, next) {
	try {
		const users = await prisma.users.findMany({
			where: { disabled: false },
			orderBy: { id: "asc" },
			select: {
				id: true,
				username: true,
				email: true,
				role: true
			}
		});
		return res.json(users);
	} catch (error) {
		return next(error);
	}
});

router.put("/admin/users/:id/role", requireAdmin, async function (req, res, next) {
	try {
		const userId = Number(req.params.id);
		const role = req.body.role;
		if (!["ADMIN", "MEMBER"].includes(role)) {
			return res.status(400).json({ error: "Invalid role" });
		}
		const targetUser = await prisma.users.findUnique({ where: { id: userId } });
		if (!targetUser || targetUser.disabled) {
			return res.status(404).json({ error: "User not found" });
		}

		if (targetUser.role === "ADMIN" && role === "MEMBER") {
			const adminCount = await prisma.users.count({
				where: {
					role: "ADMIN",
					disabled: false
				}
			});
			if (adminCount <= 1) {
				return res.status(400).json({ error: "At least one active administrator is required" });
			}
		}

		const user = await prisma.users.update({
			where: { id: userId },
			data: { role },
			select: {
				id: true,
				username: true,
				email: true,
				role: true
			}
		});
		return res.json(user);
	} catch (error) {
		return next(error);
	}
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
			await prisma.$transaction(async tx => {
				await tx.users.update({
					where: { id: userId },
					data: { disabled: true }
				});

				if (req.currentUser.role === "ADMIN") {
					const activeAdminCount = await tx.users.count({
						where: {
							role: "ADMIN",
							disabled: false
						}
					});
					if (activeAdminCount === 0) {
						const nextUser = await tx.users.findFirst({
							where: { disabled: false },
							orderBy: { id: "asc" }
						});
						if (nextUser) {
							await tx.users.update({
								where: { id: nextUser.id },
								data: { role: "ADMIN" }
							});
						}
					}
				}
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
