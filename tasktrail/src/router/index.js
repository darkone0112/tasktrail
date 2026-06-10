import { createRouter, createWebHistory } from "vue-router";

import Home from "../views/HomeView.vue";
import Error from "../views/ErrorView.vue";

import alertify from "alertifyjs";
import { logout } from "../utils/helpers";

import { FETCH_OPTIONS, FETCH_METHODS, CONTENT_TYPES, i18n } from "../utils/helpers";

export async function getUser() {
	const response = await fetch("/api/get/session", FETCH_OPTIONS(FETCH_METHODS.GET, CONTENT_TYPES.JSON));

	if (!response.ok) {
		throw new Error(`Unable to load the current user (${response.status})`);
	}

	return response.json();
}

export let user = null;

export const routes = [
	// Profile
	{
		path: "/u/profile",
		component: () => import("../views/ProfileView.vue"),
		name: "Profile",
		meta: {
			name: i18n.global.t("profile.title"),
			title: i18n.global.t("profile.title"),
			desc: i18n.global.t("profile.desc"),
			group: i18n.global.t("profile.group"),
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
			name: i18n.global.t("home.menuTitle"),
			title: i18n.global.t("home.title"),
			desc: i18n.global.t("home.desc"),
			group: i18n.global.t("home.group"),
			classname: ["fa-solid", "fa-house"],
			routerview: true
		}
	},
	{
		path: "/u/tasks",
		component: () => import("../views/TasksView.vue"),
		name: "Tasks",
		meta: {
			name: i18n.global.t("tasks.menuTitle"),
			title: i18n.global.t("tasks.title"),
			desc: i18n.global.t("tasks.desc"),
			group: i18n.global.t("tasks.group"),
			classname: ["fa-sharp", "fa-solid", "fa-list-check"],
			routerview: true
		}
	},
	{
		path: "/u/kanban",
		component: () => import("../views/KanbanView.vue"),
		name: "Kanban",
		meta: {
			name: i18n.global.t("kanban.menuTitle"),
			title: i18n.global.t("kanban.title"),
			desc: i18n.global.t("kanban.desc"),
			group: i18n.global.t("kanban.group"),
			classname: ["fa-sharp", "fa-solid", "fa-thumbtack"],
			routerview: true
		}
	},
	{
		path: "/u/calendar",
		component: () => import("../views/CalendarView.vue"),
		name: "Calendar",
		meta: {
			name: i18n.global.t("calendar.menuTitle"),
			title: i18n.global.t("calendar.title"),
			desc: i18n.global.t("calendar.desc"),
			group: i18n.global.t("calendar.group"),
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
			name: i18n.global.t("settings.menuTitle"),
			title: i18n.global.t("settings.title"),
			desc: i18n.global.t("settings.desc"),
			group: i18n.global.t("settings.group"),
			classname: ["fa-regular", "fa-gear"],
			routerview: true
		}
	},
	{
		path: "/logout",
		name: "Logout",
		meta: {
			name: i18n.global.t("logout.menuTitle"),
			desc: i18n.global.t("logout.desc"),
			func: function btnLogout() {
				alertify.confirm(
					i18n.global.t("logout.confirm.title"),
					i18n.global.t("logout.confirm.question"),
					async () => {
						await logout();
					},
					() => { }
				);
			},
			group: i18n.global.t("logout.group"),
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

export async function initializeUser() {
	user = await getUser();
	const locale = user.locale === "es" ? "es" : "en";
	localStorage.setItem("locale", locale);
	i18n.global.locale = locale;

	for (const route of routes) {
		if (!route.meta || route.name === "Logout") continue;
		const key = String(route.name).toLowerCase();
		route.meta.name = route.name === "Profile" ? user.username : i18n.global.t(`${key}.menuTitle`);
		route.meta.title = i18n.global.t(`${key}.title`);
		route.meta.desc = i18n.global.t(`${key}.desc`);
		route.meta.group = i18n.global.t(`${key}.group`);
	}

	const logoutRoute = routes.find(route => route.name === "Logout");
	logoutRoute.meta.name = i18n.global.t("logout.menuTitle");
	logoutRoute.meta.desc = i18n.global.t("logout.desc");
	logoutRoute.meta.group = i18n.global.t("logout.group");
	routes.find(route => route.name === "Profile").meta.name = user.username;
	return user;
}

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
