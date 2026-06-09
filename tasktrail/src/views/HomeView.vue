<template lang="pug">

.is-flex.is-justify-content-center.is-align-items-center.is-flex-direction-column
    h1.title.is-size-3-mobile.is-size-2-desktop {{ welcomeMessage }}, {{ user }}
    h2.subtitle.is-size-4-mobile.is-size-3-desktop {{ $t('home.dashboard.now') }} 
        span.time {{ time }}

    .columns.is-flex-mobile
        router-link.column(
            v-for="route, index in routes"
            v-if="index > 1 && route.meta.group === $t('home.group')"
            :key="route.name"
            :to="route.path"
        )
            span.icon.is-large
                span.fa-stack.fa-xl
                    i.fas.fa-circle.fa-stack-2x
                    i.fas.fa-stack-1x.fa-inverse(:class="route.meta.classname")

    h2.subtitle.is-size-4-mobile.is-size-3-desktop {{ deadlines.length > 0 ? $t('home.dashboard.pendingTasks') : $t('home.dashboard.noTasks') }}

    table.table
        tbody
            tr(v-for="deadline in deadlines")
                th {{ deadline.name }}
                td {{ new Date(deadline.date).toLocaleDateString($t('home.dashboard.dateLang'), { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }}
</template>

<script>
import alertify from 'alertifyjs'
import { routes, user } from '../router/index'
import { getTasks, alertifysettings, applyTheme } from '../utils/helpers'

export default {
    name: 'Home',
    data() {
        return {
            routes: routes.filter(route => { return route.meta }),

            welcomeMessage: "",
            user: "",

            time: "",
            deadlines: [],
        }
    },
    beforeUnmount() {
        clearInterval(this.interval)
    },
    created() {
        applyTheme();

        const language = navigator.language
        const TIME_OPTIONS = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }

        const formatTime = () => Intl.DateTimeFormat(language, TIME_OPTIONS).format()

        const interval = setInterval(() => {
            this.time = formatTime()
        }, 1000)

        this.time = formatTime()

        alertify.defaults = alertifysettings
    },
    async mounted() {
        this.deadlines = await this.getDeadlines()
        this.user = await user.username

        const hour = Number(this.time.split(":")[0]);
        const welcomeMessages = [
            { hourRange: [21, 23], message: this.$t('home.dashboard.welcomeNight') },
            { hourRange: [13, 20], message: this.$t('home.dashboard.welcomeEvening') },
            { hourRange: [0, 12], message: this.$t('home.dashboard.welcomeDay') }
        ];

        let welcomeMessage = '';

        for (const { hourRange, message } of welcomeMessages) {
            if (hour >= hourRange[0] && hour <= hourRange[1]) {
                welcomeMessage = message
                break
            }
        }

        this.welcomeMessage = welcomeMessage
    },
    methods: {
        async getDeadlines() {
            const MAX_TASKS = 5
            const tasks = await getTasks(MAX_TASKS)

            return tasks
        }
    },
};
</script>
