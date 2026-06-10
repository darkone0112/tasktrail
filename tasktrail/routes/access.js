const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function getSessionUserId(req) {
	return req.session?.userid ?? req.session?.passport?.user?.userid ?? null;
}

async function getCurrentUser(req) {
	const userId = getSessionUserId(req);
	if (!userId) return null;

	return prisma.users.findUnique({
		where: { id: userId }
	});
}

async function requireUser(req, res, next) {
	try {
		const user = await getCurrentUser(req);
		if (!user || user.disabled) {
			req.session = null;
			return res.status(401).json({ error: "Authentication required" });
		}

		req.currentUser = user;
		req.session.userid = user.id;
		req.session.username = user.username;
		req.session.email = user.email;
		req.session.verified = user.verified;
		req.session.img = user.img;
		req.session.role = user.role;
		req.session.locale = user.locale;
		return next();
	} catch (error) {
		return next(error);
	}
}

function requireAdmin(req, res, next) {
	if (req.currentUser?.role !== "ADMIN") {
		return res.status(403).json({ error: "Administrator permission required" });
	}

	return next();
}

async function getAccessibleBoard(user, boardId, requireEdit = false) {
	const board = await prisma.kanbanBoards.findUnique({
		where: { id: Number(boardId) },
		include: {
			Access: {
				where: { user_id: user.id }
			}
		}
	});

	if (!board) return null;
	if (board.visibility === "TEAM") return board;
	if (board.visibility === "PERSONAL") return board.owner_id === user.id ? board : null;
	if (user.role === "ADMIN") return board;

	const access = board.Access[0];
	if (!access) return null;
	if (requireEdit && access.permission !== "EDIT") return null;
	return board;
}

module.exports = {
	prisma,
	getSessionUserId,
	getCurrentUser,
	requireUser,
	requireAdmin,
	getAccessibleBoard
};
