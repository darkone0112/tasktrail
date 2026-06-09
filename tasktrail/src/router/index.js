import { createRouter, createWebHistory } from "vue-router";

import Home from "../views/HomeView.vue";
import Error from "../views/ErrorView.vue";

import alertify from "alertifyjs";
import { logout } from "../utils/helpers";

import { FETCH_OPTIONS, FETCH_METHODS, CONTENT_TYPES, i18n } from "../utils/helpers";

export async function getUser() {
	try {
		const context = await fetch("/api/get/session", FETCH_OPTIONS(FETCH_METHODS.GET, CONTENT_TYPES.JSON));

		const user = await context.json();
		return user;
	} catch (e) {
		console.error(e);
	}
}

export const user = await getUser();

export const routes = [
	// Profile
	{
		path: "/u/profile",
		component: () => import("../views/ProfileView.vue"),
		name: "Profile",
		meta: {
			name: user.username,
			title: i18n.t("profile.title"),
			desc: i18n.t("profile.desc"),
			group: i18n.t("profile.group"),
			classname: ["fa-regular", "fa-user"],
			routerview: true,
		},
	},
	// General
	{
		path: "/u/home",
		component: Home,
		name: "Home",
		meta: {
			name: i18n.t("home.menuTitle"),
			title: i18n.t("home.title"),
			desc: i18n.t("home.desc"),
			group: i18n.t("home.group"),
			classname: ["fa-solid", "fa-house"],
			routerview: true
		}
	},
	{
		path: "/u/tasks",
		component: () => import("../views/TasksView.vue"),
		name: "Tasks",
		meta: {
			name: i18n.t("tasks.menuTitle"),
			title: i18n.t("tasks.title"),
			desc: i18n.t("tasks.desc"),
			group: i18n.t("tasks.group"),
			classname: ["fa-sharp", "fa-solid", "fa-list-check"],
			routerview: true
		}
	},
	{
		path: "/u/kanban",
		component: () => import("../views/KanbanView.vue"),
		name: "Kanban",
		meta: {
			name: i18n.t("kanban.menuTitle"),
			title: i18n.t("kanban.title"),
			desc: i18n.t("kanban.desc"),
			group: i18n.t("kanban.group"),
			classname: ["fa-sharp", "fa-solid", "fa-thumbtack"],
			routerview: true
		}
	},
	{
		path: "/u/calendar",
		component: () => import("../views/CalendarView.vue"),
		name: "Calendar",
		meta: {
			name: i18n.t("calendar.menuTitle"),
			title: i18n.t("calendar.title"),
			desc: i18n.t("calendar.desc"),
			group: i18n.t("calendar.group"),
			classname: ["fa-sharp", "fa-solid", "fa-calendar-days"],
			routerview: true
		}
	},
	// Settings
	{
		path: "/u/settings",
		component: () => import("../views/SettingsView.vue"),
		name: "Settings",
		meta: {
			name: i18n.t("settings.menuTitle"),
			title: i18n.t("settings.title"),
			desc: i18n.t("settings.desc"),
			group: i18n.t("settings.group"),
			classname: ["fa-regular", "fa-gear"],
			routerview: true
		}
	},
	{
		path: "/logout",
		name: "Logout",
		meta: {
			name: i18n.t("logout.menuTitle"),
			desc: i18n.t("logout.desc"),
			func: function btnLogout() {
				alertify.confirm(
					i18n.t("logout.confirm.title"),
					i18n.t("logout.confirm.question"),
					async () => {
						await logout();
					},
					() => { }
				);
			},
			group: i18n.t("logout.group"),
			classname: ["fa-light", "fa-arrow-right-from-bracket"],
			routerview: false
		}
	},
	// Error
	{
		path: "/:pathMatch(.*)*",
		component: Error
	}
];

const router = createRouter({
	history: createWebHistory(),
	routes
});

// Dynamic title
router.beforeEach((to, from, next) => {
	const title = `TaskTrail - ${to.meta.title}`;

	document.title = title;

	next();
});

export default router;
