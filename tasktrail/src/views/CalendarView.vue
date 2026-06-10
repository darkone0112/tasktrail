<template lang="pug">

div
    .calendar-summary
        span.tag.is-primary.is-light
            | {{ $t('calendar.deadlines', { count: calendarOptions.events.length }) }}
    FullCalendar.calendar(:options="calendarOptions")
    FullCalendar.list(:options="listOptions")

</template>

<script>
import alertify from 'alertifyjs'
import { getKanbanTaskOverview, getTaskPriorityColor, updateKanbanTaskDueDate, alertifysettings, applyTheme } from '../utils/helpers'

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
            calendarOptions: {
                events: [],
                locales: allLocales,
                locale: localStorage.getItem('locale') || 'en',
                plugins: [
                    dayGridPlugin,
                    interactionPlugin,
                ],
                headerToolbar: {
                    left: 'prev',
                    center: 'title',
                    right: 'today,next'
                },
                initialView: 'dayGridMonth',
                dayMaxEvents: 3,
                buttonIcons: false,
                buttonText: {
                    prev: '‹',
                    next: '›',
                },

                // Allow drag and drop
                editable: true,
                // eventStartEditable: true,
                eventDrop: async (info) => { await this.save(info) },

                // For mobile
                eventLongPressDelay: 100,
                showNonCurrentDates: false
            },

            listOptions: {
                events: [],
                locales: allLocales,
                locale: localStorage.getItem('locale') || 'en',
                plugins: [
                    listPlugin,
                    dayGridPlugin,
                ],
                headerToolbar: {
                    left: 'prev',
                    center: 'title',
                    right: 'today,next'
                },
                initialView: 'listWeek',
                dayMaxEvents: 3,
                buttonIcons: false,
                buttonText: {
                    prev: '‹',
                    next: '›',
                },
            }
        }
    },
    methods: {
        async save(info) {
            await updateKanbanTaskDueDate(info.event.extendedProps.task, info.event.start)
            this.calendarOptions.events = this.listOptions.events = await this.populateCalendar()
        },
        async populateCalendar() {
            const calendar = []

            const overview = await getKanbanTaskOverview()
            const tasks = [...overview.personal, ...overview.assigned]
                .filter(task => task.dueDate)

            tasks.forEach(task => {
                calendar.push({
                    // Calendar properties
                    id: `${task.userid}-${task.id}`,
                    title: `${task.name} · ${task.boardName}`,
                    start: task.dueDate,
                    allDay: true,
                    backgroundColor: task.done ? '#7a7a7a' : getTaskPriorityColor(task.priority),
                    borderColor: task.done ? '#7a7a7a' : getTaskPriorityColor(task.priority),
                    classNames: task.done ? ['calendar-task-done'] : [],
                    extendedProps: {
                        task
                    }
                })
            })

            return calendar
        },
    },
    async created() {
        alertify.defaults = alertifysettings;
        applyTheme();
    },
    async mounted() {
        this.calendarOptions.events = this.listOptions.events = await this.populateCalendar()
    },
}
</script>
