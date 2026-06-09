import { createApp } from "vue";
import App from "./App.vue";
import router, { initializeUser } from "./router";
import { i18n } from "./utils/helpers";
import "./styles/index.sass";

async function bootstrap() {
	try {
		await initializeUser();
		createApp(App).use(router).use(i18n).mount("#app");
	} catch (error) {
		console.error("TaskTrail failed to initialize:", error);
		window.location.replace("/login");
	}
}

bootstrap();
