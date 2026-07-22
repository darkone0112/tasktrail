import { createI18n } from "vue-i18n";
import messages from "../locales/locales";
export const i18n = createI18n({
	legacy: true,
	locale: localStorage.getItem("locale") || "en",
	fallbackLocale: "en",
	messages
});

//#region api
export const FETCH_OPTIONS = (method, contentType, body = null) => {
	return {
		method: method,
		mode: "cors",
		cache: "no-cache",
		credentials: "same-origin",
		headers: {
			"Content-Type": contentType
		},
		body: body
	};
};

export const FETCH_METHODS = Object.freeze({
	GET: "GET",
	POST: "POST",
	PUT: "PUT",
	DELETE: "DELETE"
});

export const CONTENT_TYPES = Object.freeze({
	JSON: "application/json",
	XML: "text/xml"
});

export const TASK_PRIORITY_COLORS = Object.freeze([
	"#48c78e",
	"#ffe08a",
	"#f14668"
]);

export function getTaskPriorityColor(priority = 0) {
	const priorityIndex = Number(priority);
	return TASK_PRIORITY_COLORS[priorityIndex] || TASK_PRIORITY_COLORS[0];
}

export async function addTask(name, date) {
	try {
		await fetch(
			"/api/insert/task",
			FETCH_OPTIONS(
				FETCH_METHODS.POST,
				CONTENT_TYPES.JSON,
				JSON.stringify({
					task: JSON.stringify({
						order: 0,
						name: name,
						done: false,
						edit: false,
						date: date
					})
				})
			)
		);
	} catch (e) {
		//
	}
}

export async function deleteTask(task) {
	try {
		await fetch("/api/delete/task", FETCH_OPTIONS(FETCH_METHODS.POST, CONTENT_TYPES.JSON, JSON.stringify({ task: JSON.stringify(task) })));
	} catch (e) {
		//
	}
}

export async function getTasks(number = "") {
	const tasks = await fetch(`/api/get/tasks/${number}`, FETCH_OPTIONS(FETCH_METHODS.GET, CONTENT_TYPES.JSON)).then(res => res.json());

	return tasks;
}

export const FILTERS = {
	done: true,
	undone: false,
	all: undefined
};

export async function getPaginatedTasks(skip, take, filter) {
	const tasks = await fetch(`/api/get/tasks/${skip}/${take}/${filter}`, FETCH_OPTIONS(FETCH_METHODS.GET, CONTENT_TYPES.JSON)).then(res => res.json());

	return tasks;
}

export async function saveTasks(tasks) {
	await fetch("/api/upsert/tasks", FETCH_OPTIONS(FETCH_METHODS.POST, CONTENT_TYPES.JSON, JSON.stringify({ tasks: JSON.stringify(tasks) })));
}

export async function getUser() {
	try {
		const context = await fetch("/api/get/session", FETCH_OPTIONS(FETCH_METHODS.GET, CONTENT_TYPES.JSON));

		const user = await context.json();
		return user;
	} catch (e) {
		console.error(e);
	}
}

export async function logout() {
	await fetch("/logout", FETCH_OPTIONS(FETCH_METHODS.GET, CONTENT_TYPES.JSON)).then(() => (window.location.href = "/"));
}

export async function sendVerificationMail() {
	await fetch("/api/verify/mail/", FETCH_OPTIONS(FETCH_METHODS.POST, CONTENT_TYPES.JSON));
}

export async function sendChangePasswordMail() {
	await fetch("/api/recover/mail", FETCH_OPTIONS(FETCH_METHODS.POST, CONTENT_TYPES.JSON));
}

export async function deleteAccount() {
	await fetch("/api/delete/account", FETCH_OPTIONS(FETCH_METHODS.POST, CONTENT_TYPES.JSON));
	window.location.href = "/";
}
//#endregion

//#region kanban
async function apiRequest(url, options) {
	const response = await fetch(url, options);
	if (!response.ok) {
		const body = await response.json().catch(() => ({}));
		throw new Error(body.error || `Request failed (${response.status})`);
	}
	if (response.status === 204) return null;
	return response.json();
}

export async function getKanbanBoards() {
	return apiRequest("/api/kanban/boards", FETCH_OPTIONS(FETCH_METHODS.GET, CONTENT_TYPES.JSON));
}

export async function createKanbanBoard(name, visibility) {
	return apiRequest(
		"/api/kanban/boards",
		FETCH_OPTIONS(FETCH_METHODS.POST, CONTENT_TYPES.JSON, JSON.stringify({ name, visibility }))
	);
}

export async function deleteKanbanBoard(boardId) {
	return apiRequest(`/api/kanban/boards/${boardId}`, FETCH_OPTIONS(FETCH_METHODS.DELETE, CONTENT_TYPES.JSON));
}

export async function createKanbanColumn(boardId, title) {
	return apiRequest(
		"/api/kanban/columns",
		FETCH_OPTIONS(FETCH_METHODS.POST, CONTENT_TYPES.JSON, JSON.stringify({ boardId, title }))
	);
}

export async function saveBoardKanban(boardId, kanban) {
	return apiRequest(
		"/api/save/kanban",
		FETCH_OPTIONS(FETCH_METHODS.POST, CONTENT_TYPES.JSON, JSON.stringify({ boardId, kanban }))
	);
}

export async function getKanban(boardId) {
	return apiRequest(`/api/get/kanban?boardId=${encodeURIComponent(boardId)}`, FETCH_OPTIONS(FETCH_METHODS.GET, CONTENT_TYPES.JSON));
}

export async function insertKanbanTask(boardId, column, task) {
	return apiRequest(
		"/api/insert/kanban-task",
		FETCH_OPTIONS(FETCH_METHODS.POST, CONTENT_TYPES.JSON, JSON.stringify({ boardId, column, task }))
	);
}

export async function deleteKanbanColumn(boardId, column) {
	return apiRequest(
		"/api/delete/kanban-column",
		FETCH_OPTIONS(FETCH_METHODS.POST, CONTENT_TYPES.JSON, JSON.stringify({ boardId, column }))
	);
}

export async function deleteKanbanTask(boardId, task) {
	return apiRequest(
		"/api/delete/kanban-task",
		FETCH_OPTIONS(FETCH_METHODS.POST, CONTENT_TYPES.JSON, JSON.stringify({ boardId, task }))
	);
}

export async function assignKanbanTask(task, assignedUserId) {
	return apiRequest(
		`/api/kanban/tasks/${task.userid}/${task.id}/assignee`,
		FETCH_OPTIONS(
			FETCH_METHODS.PUT,
			CONTENT_TYPES.JSON,
			JSON.stringify({ assignedUserId: assignedUserId || null })
		)
	);
}

export async function getKanbanTaskDetails(task) {
	return apiRequest(
		`/api/kanban/tasks/${task.userid}/${task.id}`,
		FETCH_OPTIONS(FETCH_METHODS.GET, CONTENT_TYPES.JSON)
	);
}

export async function createKanbanTaskActivity(task, body) {
	return apiRequest(
		`/api/kanban/tasks/${task.userid}/${task.id}/activities`,
		FETCH_OPTIONS(FETCH_METHODS.POST, CONTENT_TYPES.JSON, JSON.stringify({ body }))
	);
}

export async function getKanbanTaskOverview() {
	return apiRequest("/api/tasks/kanban-overview", FETCH_OPTIONS(FETCH_METHODS.GET, CONTENT_TYPES.JSON));
}

export async function createPersonalKanbanTask(name, dueDate = null) {
	return apiRequest(
		"/api/tasks/personal",
		FETCH_OPTIONS(FETCH_METHODS.POST, CONTENT_TYPES.JSON, JSON.stringify({ name, dueDate }))
	);
}

export async function updateKanbanTaskStatus(task, done) {
	return apiRequest(
		`/api/tasks/kanban/${task.userid}/${task.id}`,
		FETCH_OPTIONS(FETCH_METHODS.PUT, CONTENT_TYPES.JSON, JSON.stringify({ done }))
	);
}

export async function updateKanbanTaskDueDate(task, dueDate) {
	return apiRequest(
		`/api/tasks/kanban/${task.userid}/${task.id}`,
		FETCH_OPTIONS(FETCH_METHODS.PUT, CONTENT_TYPES.JSON, JSON.stringify({ dueDate }))
	);
}

export async function saveLocale(locale) {
	return apiRequest(
		"/api/settings/locale",
		FETCH_OPTIONS(FETCH_METHODS.PUT, CONTENT_TYPES.JSON, JSON.stringify({ locale }))
	);
}

export async function getUsers() {
	return apiRequest("/api/admin/users", FETCH_OPTIONS(FETCH_METHODS.GET, CONTENT_TYPES.JSON));
}

export async function updateUserRole(userId, role) {
	return apiRequest(
		`/api/admin/users/${userId}/role`,
		FETCH_OPTIONS(FETCH_METHODS.PUT, CONTENT_TYPES.JSON, JSON.stringify({ role }))
	);
}
//#endregion

//#region alertify
export const alertifysettings = {
	// dialogs defaults
	autoReset: true,
	basic: false,
	closable: true,
	closableByDimmer: true,
	invokeOnCloseOff: false,
	frameless: false,
	defaultFocusOff: false,
	maintainFocus: true, // <== global default not per instance, applies to all dialogs
	maximizable: true,
	modal: true,
	movable: false,
	moveBounded: false,
	overflow: true,
	padding: true,
	pinnable: true,
	pinned: true,
	preventBodyShift: false, // <== global default not per instance, applies to all dialogs
	resizable: true,
	startMaximized: false,
	transition: "fade",
	transitionOff: false,
	tabbable:
		'button:not(:disabled):not(.ajs-reset),[href]:not(:disabled):not(.ajs-reset),input:not(:disabled):not(.ajs-reset),select:not(:disabled):not(.ajs-reset),textarea:not(:disabled):not(.ajs-reset),[tabindex]:not([tabindex^="-"]):not(:disabled):not(.ajs-reset)', // <== global default not per instance, applies to all dialogs

	// notifier defaults
	notifier: {
		// auto-dismiss wait time (in seconds)
		delay: 5,
		// default position
		position: "top-right",
		// adds a close button to notifier messages
		closeButton: false,
		// provides the ability to rename notifier classes
		classes: {
			base: "alertify-notifier",
			// prefix: "ajs-",
			message: "ajs-message",
			top: "ajs-top",
			right: "ajs-right",
			bottom: "ajs-bottom",
			left: "ajs-left",
			center: "ajs-center",
			visible: "ajs-visible",
			hidden: "ajs-hidden",
			close: "ajs-close"
		}
	},

	// language resources
	glossary: {
		// dialogs default title
		title: "AlertifyJS",
		// ok button text
		ok: i18n.global.t("logout.confirm.confirm"),
		// cancel button text
		cancel: i18n.global.t("logout.confirm.cancel")
	},

	// theme settings
	theme: {
		// class name attached to prompt dialog input textbox.
		input: "button",
		// class name attached to ok button
		ok: "button is-primary",
		// class name attached to cancel button
		cancel: "button is-danger"
	},
	// global hooks
	hooks: {
		// invoked before initializing any dialog
		preinit: function (instance) {},
		// invoked after initializing any dialog
		postinit: function (instance) {}
	}
};
//#endregion
//     console.log("helper")

//     await fetch("/api/upsert/tasks", FETCH_OPTIONS(
//         FETCH_METHODS.POST,
//         CONTENT_TYPES.JSON,
//         JSON.stringify({ "tasks": JSON.stringify(tasks) })
//     ))
// }
//#endregion

//#region applyTheme
export function applyTheme(theme = null) {
	const defaultTheme = { styleName: "" };
	const localStorageTheme = localStorage.getItem("theme");
	const themeClasses = ["dark-theme", "high-contrast-theme"];

	if (theme != null) {
		theme = Array.isArray(theme) ? theme[0] : theme;
	} else if (localStorageTheme) {
		try {
			const savedTheme = JSON.parse(localStorageTheme);
			theme = Array.isArray(savedTheme) ? savedTheme[0] : savedTheme;
		} catch (error) {
			localStorage.removeItem("theme");
			theme = defaultTheme;
		}
	} else {
		theme = defaultTheme;
	}

	const htmlElement = document.documentElement;
	const bodyElement = document.body;
	const styleName = themeClasses.includes(theme?.styleName) ? theme.styleName : "";

	htmlElement.classList.remove(...themeClasses);
	bodyElement?.classList.remove(...themeClasses);

	if (styleName) {
		htmlElement.classList.add(styleName);
		bodyElement?.classList.add(styleName);
	}
}
//#endregion
