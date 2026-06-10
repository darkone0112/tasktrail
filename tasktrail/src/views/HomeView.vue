<template lang="pug">
.home-dashboard
    .home-dashboard-header
        div
            h1.title.is-size-3-mobile.is-size-2-desktop {{ welcomeMessage }}, {{ username }}
            p.subtitle.is-size-5 {{ $t('home.dashboard.now') }}
                span.time {{ time }}
        .home-dashboard-actions
            router-link.button.is-primary(to="/u/kanban")
                span.icon
                    i.fas.fa-thumbtack
                span {{ $t('home.dashboard.openKanban') }}
            router-link.button.is-light(to="/u/tasks")
                span.icon
                    i.fas.fa-list-check
                span {{ $t('home.dashboard.openTasks') }}

    .home-stats
        article.home-stat
            span.icon.has-text-primary
                i.fas.fa-table-columns
            div
                strong {{ boards.length }}
                span {{ $t('home.dashboard.boards') }}
        article.home-stat
            span.icon.has-text-success
                i.fas.fa-user
            div
                strong {{ personalTasks.length }}
                span {{ $t('home.dashboard.personalTasks') }}
        article.home-stat
            span.icon.has-text-info
                i.fas.fa-user-check
            div
                strong {{ assignedTasks.length }}
                span {{ $t('home.dashboard.assignedTasks') }}
        article.home-stat
            span.icon.has-text-danger
                i.fas.fa-calendar-day
            div
                strong {{ upcomingDeadlines.length }}
                span {{ $t('home.dashboard.upcoming') }}

    .home-panels
        section.home-panel
            .home-panel-heading
                h2.title.is-5 {{ $t('home.dashboard.pendingTasks') }}
                router-link(to="/u/calendar") {{ $t('home.dashboard.calendarLink') }}
            .home-deadline-list(v-if="upcomingDeadlines.length")
                article.home-deadline(v-for="deadline in upcomingDeadlines" :key="taskKey(deadline)")
                    div
                        strong {{ deadline.name }}
                        p {{ deadline.boardName }} · {{ deadline.columnTitle }}
                    time {{ formatDeadline(deadline.dueDate) }}
            .notification.is-light(v-else) {{ $t('home.dashboard.noTasks') }}

        section.home-panel
            .home-panel-heading
                h2.title.is-5 {{ $t('home.dashboard.quickAccess') }}
            .home-board-list(v-if="boards.length")
                router-link.home-board(v-for="board in boards.slice(0, 6)" :key="board.id" to="/u/kanban")
                    span.icon
                        i.fas(:class="board.visibility === 'PERSONAL' ? 'fa-user-lock' : 'fa-users'")
                    div
                        strong {{ board.name }}
                        small {{ $t(`kanban.boards.visibility.${board.visibility.toLowerCase()}`) }}
</template>

<script>
import alertify from 'alertifyjs'
import { user } from '../router/index'
import { getKanbanBoards, getKanbanTaskOverview, alertifysettings, applyTheme } from '../utils/helpers'

export default {
    name: 'Home',
    data() {
        return {
            welcomeMessage: '',
            username: user.username,
            time: '',
            boards: [],
            personalTasks: [],
            assignedTasks: [],
            interval: null,
        }
    },
    computed: {
        upcomingDeadlines() {
            return [...this.personalTasks, ...this.assignedTasks]
                .filter(task => !task.done && task.dueDate)
                .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
                .slice(0, 6)
        },
    },
    methods: {
        taskKey(task) {
            return `${task.userid}-${task.id}`
        },
        formatDeadline(date) {
            return new Date(date).toLocaleDateString(this.$i18n.locale, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            })
        },
        updateTime() {
            this.time = Intl.DateTimeFormat(this.$i18n.locale, {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
            }).format()

            const hour = new Date().getHours()
            if (hour >= 21 || hour < 6) this.welcomeMessage = this.$t('home.dashboard.welcomeNight')
            else if (hour >= 13) this.welcomeMessage = this.$t('home.dashboard.welcomeEvening')
            else this.welcomeMessage = this.$t('home.dashboard.welcomeDay')
        },
    },
    async mounted() {
        const [boards, overview] = await Promise.all([getKanbanBoards(), getKanbanTaskOverview()])
        this.boards = boards
        this.personalTasks = overview.personal
        this.assignedTasks = overview.assigned
        this.updateTime()
        this.interval = setInterval(this.updateTime, 1000)
    },
    beforeUnmount() {
        clearInterval(this.interval)
    },
    created() {
        alertify.defaults = alertifysettings
        applyTheme()
    },
}
</script>
