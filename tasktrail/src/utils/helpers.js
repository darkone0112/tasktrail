import { createI18n } from "vue-i18n";
import messages from "../locales/locales";
export const i18n = createI18n({
	legacy: true,
	locale: localStorage.getItem("locale") || "es", // idioma por defecto
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
export async function saveKanban(kanban) {
	// console.log("save kanban");

	await fetch("/api/save/kanban", FETCH_OPTIONS(FETCH_METHODS.POST, CONTENT_TYPES.JSON, JSON.stringify({ kanban: JSON.stringify(kanban) })));
}

export async function getKanban() {
	// console.log("update kanban");

	const kanban = await fetch("/api/get/kanban", FETCH_OPTIONS(FETCH_METHODS.GET, CONTENT_TYPES.JSON)).then(res => res.json());

	// console.log(kanban);

	return kanban;
}

export async function insertKanbanTask(column, task) {
	// console.log("insert kanban task");

	await fetch("/api/insert/kanban-task", FETCH_OPTIONS(FETCH_METHODS.POST, CONTENT_TYPES.JSON, JSON.stringify({ column: JSON.stringify(column), task: JSON.stringify(task) })));
}

export async function deleteKanbanColumn(column) {
	// console.log("delete kanban column");

	await fetch("/api/delete/kanban-column", FETCH_OPTIONS(FETCH_METHODS.POST, CONTENT_TYPES.JSON, JSON.stringify({ column: JSON.stringify(column) })));
}

export async function deleteKanbanTask(task) {
	// console.log("delete kanban task");

	await fetch("/api/delete/kanban-task", FETCH_OPTIONS(FETCH_METHODS.POST, CONTENT_TYPES.JSON, JSON.stringify({ task: JSON.stringify(task) })));
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

	if (theme != null) {
		theme = theme;
	} else if (localStorageTheme) {
		theme = JSON.parse(localStorageTheme)[0];
	} else {
		theme = defaultTheme;
	}

	const htmlElement = document.documentElement;
	const bodyElement = document.body;

	if (theme.hasOwnProperty("0")) {
		htmlElement.classList.forEach(className => {
			if (className !== theme[0].styleName) {
				htmlElement.classList.remove(className);
			}
		});
		bodyElement.classList.forEach(className => {
			if (className !== theme[0].styleName) {
				bodyElement.classList.remove(className);
			}
		});

		htmlElement.classList.add(theme[0].styleName);
		bodyElement.classList.add(theme[0].styleName);
	} else {
		htmlElement.classList.forEach(className => {
			if (className !== theme.styleName) {
				htmlElement.classList.remove(className);
			}
		});
		bodyElement.classList.forEach(className => {
			if (className !== theme.styleName) {
				bodyElement.classList.remove(className);
			}
		});

		if (theme.styleName != "") {
			htmlElement.classList.add(theme.styleName);
			bodyElement.classList.add(theme.styleName);
		}
	}
}
//#endregion
