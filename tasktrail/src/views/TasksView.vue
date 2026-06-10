<template lang="pug">
.task-overview
    form.task-create.box(@submit.prevent="createTask")
        h2.title.is-5 {{ $t('tasks.overview.createPersonal') }}
        .field.is-grouped.is-grouped-multiline
            .control.is-expanded
                input.input(
                    v-model.trim="newTaskName"
                    :placeholder="$t('tasks.modal.placeholder')"
                    maxlength="191"
                    required
                )
            .control
                input.input(type="date" v-model="newTaskDate")
            .control
                button.button.is-success(type="submit" :disabled="!newTaskName || saving")
                    | {{ $t('tasks.modal.create') }}

    .task-section
        h2.title.is-5
            span.icon.mr-2
                i.fas.fa-user
            | {{ $t('tasks.overview.personal') }}
        p.mb-4 {{ $t('tasks.overview.personalDescription') }}
        .task-overview-list(v-if="personalTasks.length")
            article.card.task-overview-card(
                v-for="task in personalTasks"
                :key="taskKey(task)"
                :style="{ borderLeft: `5px solid ${task.columnColor}` }"
            )
                .card-content
                    .task-overview-main
                        label.checkbox
                            input(
                                type="checkbox"
                                :checked="task.done"
                                @change="setDone(task, $event.target.checked)"
                            )
                        strong(:class="{ strikethrough: task.done }") {{ task.name }}
                    .task-overview-meta
                        span.tag.is-light {{ task.boardName }}
                        span.tag(:style="{ backgroundColor: task.columnColor }") {{ task.columnTitle }}
                        span.tag.is-light(v-if="task.dueDate") {{ formatDate(task.dueDate) }}
                        button.delete(
                            type="button"
                            :aria-label="$t('tasks.overview.delete')"
                            @click="removePersonalTask(task)"
                        )
        .notification.is-light(v-else) {{ $t('tasks.overview.noPersonal') }}

    .task-section
        h2.title.is-5
            span.icon.mr-2
                i.fas.fa-user-check
            | {{ $t('tasks.overview.assigned') }}
        p.mb-4 {{ $t('tasks.overview.assignedDescription') }}
        .task-overview-list(v-if="assignedTasks.length")
            article.card.task-overview-card(
                v-for="task in assignedTasks"
                :key="taskKey(task)"
                :style="{ borderLeft: `5px solid ${task.columnColor}` }"
            )
                .card-content
                    .task-overview-main
                        label.checkbox
                            input(
                                type="checkbox"
                                :checked="task.done"
                                @change="setDone(task, $event.target.checked)"
                            )
                        strong(:class="{ strikethrough: task.done }") {{ task.name }}
                    .task-overview-meta
                        span.tag.is-primary.is-light {{ task.boardName }}
                        span.tag(:style="{ backgroundColor: task.columnColor }") {{ task.columnTitle }}
                        span.tag.is-light(v-if="task.dueDate") {{ formatDate(task.dueDate) }}
        .notification.is-light(v-else) {{ $t('tasks.overview.noAssigned') }}
</template>

<script>
import alertify from 'alertifyjs'
import {
    alertifysettings,
    applyTheme,
    createPersonalKanbanTask,
    deleteKanbanTask,
    getKanbanTaskOverview,
    updateKanbanTaskStatus
} from '../utils/helpers'

export default {
    name: 'Tasks',
    data() {
        return {
            personalTasks: [],
            assignedTasks: [],
            newTaskName: '',
            newTaskDate: '',
            saving: false,
        }
    },
    methods: {
        taskKey(task) {
            return `${task.userid}-${task.id}`
        },
        async loadTasks() {
            try {
                const overview = await getKanbanTaskOverview()
                this.personalTasks = overview.personal
                this.assignedTasks = overview.assigned
            } catch (error) {
                alertify.error(error.message)
            }
        },
        async createTask() {
            if (!this.newTaskName) return
            this.saving = true
            try {
                await createPersonalKanbanTask(this.newTaskName, this.newTaskDate || null)
                this.newTaskName = ''
                this.newTaskDate = ''
                await this.loadTasks()
            } catch (error) {
                alertify.error(error.message)
            } finally {
                this.saving = false
            }
        },
        async setDone(task, done) {
            try {
                await updateKanbanTaskStatus(task, done)
                task.done = done
            } catch (error) {
                alertify.error(error.message)
                await this.loadTasks()
            }
        },
        async removePersonalTask(task) {
            try {
                await deleteKanbanTask(task.boardId, task)
                await this.loadTasks()
            } catch (error) {
                alertify.error(error.message)
            }
        },
        formatDate(date) {
            return new Date(date).toLocaleDateString(this.$i18n.locale)
        },
    },
    created() {
        alertify.defaults = alertifysettings
        applyTheme()
    },
    mounted() {
        this.loadTasks()
    },
}
</script>
