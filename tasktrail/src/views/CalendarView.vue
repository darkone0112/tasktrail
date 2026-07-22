<template lang="pug">

div
    .calendar-toolbar
        .calendar-summary
            span.tag.is-primary.is-light
                | {{ $t('calendar.deadlines', { count: taskEvents.length }) }}
        button.button.is-small.is-primary(type="button" @click="showVacationCreator = true")
            i.fas.fa-plane-departure(aria-hidden="true")
            span {{ $t('calendar.vacations.create') }}
        button.button.is-small.is-light.calendar-vacation-overview-button(type="button" @click="showVacationOverview = true")
            i.fas.fa-users(aria-hidden="true")
            span {{ $t('calendar.vacations.team') }}
        button.button.is-small.is-light.calendar-vacation-overview-button(v-if="ownVacations.length" type="button" @click="showMyVacationOverview = true")
            i.fas.fa-trash-can(aria-hidden="true")
            span {{ $t('calendar.vacations.manage') }}
    FullCalendar.calendar(:options="calendarOptions")
    FullCalendar.list(:options="listOptions")

    .calendar-day-menu.box(v-if="dayMenu" :style="dayMenuStyle")
        p.calendar-day-menu-title {{ dayMenu.date }}
        button.button.is-small.is-light(type="button" @click="addSingleVacation") {{ $t('calendar.vacations.addSingle') }}
        button.button.is-small.is-light(type="button" @click="setVacationStart") {{ $t('calendar.vacations.addStart') }}
        button.button.is-small.is-light(type="button" :disabled="!pendingVacationStart" @click="setVacationEnd") {{ $t('calendar.vacations.addEnd') }}
        button.button.is-small.is-danger.is-light(
            v-for="vacation in vacationsOnSelectedDay"
            :key="vacation.id"
            type="button"
            @click="removeVacation(vacation)"
        ) {{ $t('calendar.vacations.removeRange') }}
        button.button.is-small.is-light(
            v-for="vacation in vacationsOnSelectedDay"
            :key="`edit-${vacation.id}`"
            type="button"
            @click="openVacationEditor(vacation)"
        ) {{ $t('calendar.vacations.editRange') }}

    .modal.is-active.calendar-vacation-modal(v-if="showVacationCreator" @keyup.esc="showVacationCreator = false")
        .modal-background(@click="showVacationCreator = false")
        .modal-card.calendar-vacation-modal-card
            header.modal-card-head
                p.modal-card-title {{ $t('calendar.vacations.createTitle') }}
                button.delete(type="button" :aria-label="$t('kanban.card.closeDetails')" @click="showVacationCreator = false")
            form.calendar-vacation-form.modal-card-body(@submit.prevent="addVacationRange")
                input.input(type="date" v-model="vacationStart" :aria-label="$t('calendar.vacations.start')" required)
                input.input(type="date" v-model="vacationEnd" :aria-label="$t('calendar.vacations.end')" required)
                button.button.is-primary(type="submit") {{ $t('calendar.vacations.addRange') }}

    .modal.is-active.calendar-vacation-modal(v-if="showVacationOverview" @keyup.esc="showVacationOverview = false")
        .modal-background(@click="showVacationOverview = false")
        .modal-card.calendar-vacation-modal-card
            header.modal-card-head
                p.modal-card-title {{ $t('calendar.vacations.teamTitle') }}
                button.delete(type="button" :aria-label="$t('kanban.card.closeDetails')" @click="showVacationOverview = false")
            section.modal-card-body
                p.calendar-vacation-empty(v-if="!vacations.length") {{ $t('calendar.vacations.none') }}
                ul.calendar-vacation-list(v-else)
                    li(v-for="vacation in vacations" :key="vacation.id")
                        strong {{ vacation.user.username }}
                        span {{ formatDate(vacation.startDate) }} - {{ formatDate(vacation.endDate) }}

    .modal.is-active.calendar-vacation-modal(v-if="showMyVacationOverview" @keyup.esc="showMyVacationOverview = false")
        .modal-background(@click="showMyVacationOverview = false")
        .modal-card.calendar-vacation-modal-card
            header.modal-card-head
                p.modal-card-title {{ $t('calendar.vacations.manageTitle') }}
                button.delete(type="button" :aria-label="$t('kanban.card.closeDetails')" @click="showMyVacationOverview = false")
            section.modal-card-body
                ul.calendar-vacation-list
                    li(v-for="vacation in ownVacations" :key="vacation.id")
                        span {{ formatDate(vacation.startDate) }} - {{ formatDate(vacation.endDate) }}
                        button.button.is-small.is-danger.is-light(type="button" :aria-label="$t('calendar.vacations.removeRange')" @click="removeVacation(vacation)")
                            i.fas.fa-trash-can(aria-hidden="true")

    .modal.is-active.calendar-vacation-modal(v-if="editingVacation" @keyup.esc="closeVacationEditor")
        .modal-background(@click="closeVacationEditor")
        .modal-card.calendar-vacation-modal-card
            header.modal-card-head
                p.modal-card-title {{ $t('calendar.vacations.editTitle') }}
                button.delete(type="button" :aria-label="$t('kanban.card.closeDetails')" @click="closeVacationEditor")
            form.calendar-vacation-form.modal-card-body(@submit.prevent="saveVacationEdit")
                input.input(type="date" v-model="editVacationStart" :aria-label="$t('calendar.vacations.start')" required)
                input.input(type="date" v-model="editVacationEnd" :aria-label="$t('calendar.vacations.end')" required)
                button.button.is-primary(type="submit") {{ $t('calendar.vacations.save') }}

</template>

<script>
import alertify from 'alertifyjs'
import { getKanbanTaskOverview, getTaskPriorityColor, updateKanbanTaskDueDate, getVacationPeriods, createVacationPeriod, deleteVacationPeriod, updateVacationPeriod, getUser, alertifysettings, applyTheme } from '../utils/helpers'

import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import allLocales from '@fullcalendar/core/locales-all';

export default {
    name: 'Calendar',
    components: {
        FullCalendar
    },
    data() {
        return {
            taskEvents: [],
            vacations: [],
            vacationStart: '',
            vacationEnd: '',
            pendingVacationStart: '',
            dayMenu: null,
            showVacationOverview: false,
            showMyVacationOverview: false,
            showVacationCreator: false,
            editingVacation: null,
            editVacationStart: '',
            editVacationEnd: '',
            currentUserId: null,
            calendarOptions: {
                events: [],
                locales: allLocales,
                locale: localStorage.getItem('locale') || 'en',
                plugins: [dayGridPlugin, interactionPlugin],
                headerToolbar: { left: 'prev', center: 'title', right: 'today,next' },
                initialView: 'dayGridMonth',
                dayMaxEvents: 3,
                buttonIcons: false,
                buttonText: { prev: '‹', next: '›' },
                editable: true,
                eventDrop: async (info) => { await this.save(info) },
                eventResize: async (info) => { await this.resizeVacation(info) },
                eventClick: (info) => this.openEventMenu(info),
                eventResizableFromStart: true,
                dateClick: (info) => this.openDayMenu(info),
                eventLongPressDelay: 100,
                showNonCurrentDates: false
            },
            listOptions: {
                events: [],
                locales: allLocales,
                locale: localStorage.getItem('locale') || 'en',
                plugins: [listPlugin, dayGridPlugin],
                headerToolbar: { left: 'prev', center: 'title', right: 'today,next' },
                initialView: 'listWeek',
                dayMaxEvents: 3,
                buttonIcons: false,
                buttonText: { prev: '‹', next: '›' }
            }
        }
    },
    computed: {
        dayMenuStyle() {
            return { left: `${this.dayMenu.x}px`, top: `${this.dayMenu.y}px` }
        },
        ownVacations() {
            return this.vacations.filter(vacation => vacation.userId === this.currentUserId)
        },
        vacationsOnSelectedDay() {
            if (!this.dayMenu) return []
            return this.ownVacations.filter(vacation => {
                const start = this.localDateValue(vacation.startDate)
                const end = this.localDateValue(vacation.endDate)
                return start <= this.dayMenu.date && end >= this.dayMenu.date
            })
        }
    },
    methods: {
        localDateValue(value) {
            if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
            const date = new Date(value)
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const day = String(date.getDate()).padStart(2, '0')
            return `${date.getFullYear()}-${month}-${day}`
        },
        nextDateValue(value) {
            const date = new Date(`${value}T12:00:00`)
            date.setDate(date.getDate() + 1)
            return this.localDateValue(date)
        },
        previousDateValue(value) {
            const date = new Date(`${this.localDateValue(value)}T12:00:00`)
            date.setDate(date.getDate() - 1)
            return this.localDateValue(date)
        },
        formatDate(value) {
            return new Intl.DateTimeFormat(this.calendarOptions.locale, { dateStyle: 'medium' }).format(new Date(value))
        },
        async save(info) {
            if (info.event.extendedProps.type !== 'task') {
                info.revert()
                return
            }
            await updateKanbanTaskDueDate(info.event.extendedProps.task, this.localDateValue(info.event.start))
            await this.refreshCalendar()
        },
        openDayMenu(info) {
            this.dayMenu = { date: info.dateStr, x: Math.min(info.jsEvent.clientX, window.innerWidth - 220), y: Math.min(info.jsEvent.clientY, window.innerHeight - 160) }
        },
        openEventMenu(info) {
            if (info.event.extendedProps.type !== 'vacation') return
            const day = info.jsEvent.target.closest('[data-date]')?.dataset.date || this.localDateValue(info.event.start)
            this.openDayMenu({ dateStr: day, jsEvent: info.jsEvent })
        },
        async createVacation(startDate, endDate) {
            try {
                await createVacationPeriod(startDate, endDate)
                this.pendingVacationStart = ''
                this.dayMenu = null
                await this.refreshCalendar()
            } catch (error) {
                alertify.error(error.message)
            }
        },
        async removeVacation(vacation) {
            try {
                await deleteVacationPeriod(vacation.id)
                this.dayMenu = null
                await this.refreshCalendar()
            } catch (error) {
                alertify.error(error.message)
            }
        },
        async addVacationRange() {
            await this.createVacation(this.vacationStart, this.vacationEnd)
            this.vacationStart = ''
            this.vacationEnd = ''
            this.showVacationCreator = false
        },
        async addSingleVacation() {
            await this.createVacation(this.dayMenu.date, this.dayMenu.date)
        },
        async setVacationStart() {
            this.pendingVacationStart = this.dayMenu.date
            this.dayMenu = null
            await this.refreshCalendar()
        },
        async setVacationEnd() {
            if (!this.pendingVacationStart) {
                alertify.error(this.$t('calendar.vacations.startFirst'))
                return
            }
            await this.createVacation(this.pendingVacationStart, this.dayMenu.date)
        },
        openVacationEditor(vacation) {
            this.editingVacation = vacation
            this.editVacationStart = this.localDateValue(vacation.startDate)
            this.editVacationEnd = this.localDateValue(vacation.endDate)
            this.dayMenu = null
        },
        closeVacationEditor() {
            this.editingVacation = null
            this.editVacationStart = ''
            this.editVacationEnd = ''
        },
        async saveVacationEdit() {
            try {
                await updateVacationPeriod(this.editingVacation.id, this.editVacationStart, this.editVacationEnd)
                this.closeVacationEditor()
                await this.refreshCalendar()
            } catch (error) {
                alertify.error(error.message)
            }
        },
        async resizeVacation(info) {
            if (info.event.extendedProps.type !== 'vacation' || !info.event.extendedProps.canEdit) {
                info.revert()
                return
            }
            try {
                await updateVacationPeriod(
                    info.event.extendedProps.vacationId,
                    this.localDateValue(info.event.start),
                    this.previousDateValue(info.event.end)
                )
                await this.refreshCalendar()
            } catch (error) {
                info.revert()
                alertify.error(error.message)
            }
        },
        async refreshCalendar() {
            const [taskEvents, vacations] = await Promise.all([this.populateTasks(), getVacationPeriods()])
            this.taskEvents = taskEvents
            this.vacations = vacations
            const events = [...taskEvents, ...this.populateVacationEvents(vacations), ...this.populatePendingVacationStart()]
            this.calendarOptions.events = events
            this.listOptions.events = events
        },
        async populateTasks() {
            const overview = await getKanbanTaskOverview()
            return [...overview.personal, ...overview.assigned]
                .filter(task => task.dueDate)
                .map(task => ({
                    id: `task-${task.userid}-${task.id}`,
                    title: `${task.name} · ${task.boardName}`,
                    start: task.dueDate,
                    allDay: true,
                    backgroundColor: task.done ? '#7a7a7a' : getTaskPriorityColor(task.priority),
                    borderColor: task.done ? '#7a7a7a' : getTaskPriorityColor(task.priority),
                    durationEditable: false,
                    classNames: task.done ? ['calendar-task-done'] : [],
                    extendedProps: { type: 'task', task }
                }))
        },
        populateVacationEvents(vacations) {
            return vacations.map(vacation => {
                const canEdit = vacation.userId === this.currentUserId
                return {
                    id: `vacation-${vacation.id}`,
                    title: this.$t('calendar.vacations.event', { name: vacation.user.username }),
                    start: this.localDateValue(vacation.startDate),
                    end: this.nextDateValue(this.localDateValue(vacation.endDate)),
                    allDay: true,
                    editable: canEdit,
                    startEditable: false,
                    durationEditable: canEdit,
                    classNames: ['calendar-vacation'],
                    extendedProps: { type: 'vacation', vacationId: vacation.id, canEdit }
                }
            })
        },
        populatePendingVacationStart() {
            if (!this.pendingVacationStart) return []
            return [{
                id: 'pending-vacation-start',
                title: this.$t('calendar.vacations.pendingStart'),
                start: this.pendingVacationStart,
                allDay: true,
                editable: false,
                classNames: ['calendar-vacation-pending'],
                extendedProps: { type: 'vacation-pending' }
            }]
        }
    },
    async created() {
        alertify.defaults = alertifysettings;
        applyTheme();
    },
    async mounted() {
        const user = await getUser()
        this.currentUserId = user?.userid || null
        await this.refreshCalendar()
    }
}
</script>
