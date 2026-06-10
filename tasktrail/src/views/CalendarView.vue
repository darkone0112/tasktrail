<template lang="pug">

div
    FullCalendar.calendar(:options="calendarOptions")
    FullCalendar.list(:options="listOptions")

</template>

<script>
import alertify from 'alertifyjs'
import { getTasks, saveTasks, alertifysettings, applyTheme } from '../utils/helpers'

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
    async mounted() {
        this.calendarOptions.events = await this.populateCalendar()
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
            }
        }
    },
    methods: {
        async save(info) {
            const tasks = []
            for (const task of this.calendarOptions.events) {
                if (info.oldEvent.id == task.id)
                    task.start = task.extendedProps.date = info.event.start

                tasks.push(task.extendedProps)
            }

            await saveTasks(tasks)
        },
        async populateCalendar() {
            const calendar = []

            let tasks = await getTasks()

            tasks = tasks.filter(task => { return !task.done })

            tasks.forEach(task => {
                calendar.push({
                    // Calendar properties
                    id: task.id,
                    title: task.name,
                    start: task.date,
                    allDay: true,
                    extendedProps: {
                        // Task properties
                        id: task.id,
                        name: task.name,
                        done: task.done,
                        edit: false,
                        date: task.date
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
