<template lang="pug">

div
    .buttons
        SimpleModal(mode="create" @add="add")

        .select(v-if="tasks.length > 0")
            select(v-model='taskFilter' @change="setFilter(taskFilter)")
                option(v-for='filter in ["all", "undone", "done"]' :value='filter' :key="filter") {{ $t(`tasks.buttons.${filter}`) }}

    draggable.tasks(
        :list="tasksPerPage"
        item-key="id"
        group="tasks"
        :animation="200"
        handle=".card-header-icon"
        :empty-insert-threshhold="100"
        @end="save()"
    )
        template(v-slot:item="{ element: task }")
            div
                SimpleTask(
                    v-if="!loading"
                    :task="task"
                    @check="checkTask(task)"
                    @edit="editTask(task)"
                    @delete="del(task)"
                )
                SimpleTaskSkeleton(v-else)

    Pagination(
        v-if="getTotalPages() > 1"
        :total="tasks.length"
        :total-pages="getTotalPages()"
        :per-page="resultsPerPage"
        :current-page="currentPage"
        :max-visible-buttons="getTotalPages() > 2 ? maxPaginationButtons : minPaginationButtons"
        @pagechanged="onPageChange"
    )

</template>

<script>
import alertify from 'alertifyjs'
import draggable from 'vuedraggable'
import { getTasks, addTask, deleteTask, saveTasks, getPaginatedTasks, alertifysettings, applyTheme, FILTERS } from '../utils/helpers'

import SimpleTask from '../components/SimpleTask.vue'
import SimpleModal from '../components/modals/SimpleModal.vue'
import SimpleTaskSkeleton from '../components/skeletons/SimpleTaskSkeleton.vue'
import Pagination from '../components/Pagination.vue'

export default {
    name: 'Tasks',
    components: {
        SimpleTask,
        SimpleModal,
        SimpleTaskSkeleton,
        Pagination,
        draggable,
    },
    data() {
        return {
            loading: true,

            tasks: [],
            tasksPerPage: [],
            taskFilter: localStorage.taskFilter || 'all',

            minPaginationButtons: 2,
            maxPaginationButtons: 3,

            currentPage: Number(localStorage.currentPage) || 1,
            resultsPerPage: 5,
        }
    },
    methods: {
        async add(name, date) {
            await addTask(name, date)
            this.tasks = await getTasks()

            if (this.currentPage !== 1)
                this.currentPage = 1

            this.tasksPerPage = await this.getTasksPerPage()

            await this.save()
        },
        async del(task) {
            await deleteTask(task)
            this.tasks = await getTasks()

            // Update tasks to remove the one we just deleted
            this.tasksPerPage = await this.getTasksPerPage()

            // In case there aren't any more tasks remaining in the page
            if (this.tasksPerPage.length === 0 && this.currentPage > 1) {
                // Go to previous page and retrieve the tasks from that page
                this.currentPage--
                this.tasksPerPage = await this.getTasksPerPage()
            }

        },
        async save() {
            this.tasks.splice(this.tasksToSkip, this.resultsPerPage, ...this.tasksPerPage)
            await saveTasks(this.tasks)
            this.tasks = await getTasks()
        },
        async editTask(task) {
            const i = this.tasks.findIndex(t => t.id === task.id)

            this.tasks[i] = task
            this.tasks[i].edit = !this.tasks[i].edit

            await this.save()
        },
        async checkTask(task) {
            const i = this.tasksPerPage.findIndex(t => t.id === task.id)

            this.tasksPerPage[i].done = !this.tasksPerPage[i].done

            await this.save()
        },
        async setFilter(filter) {
            if (!FILTERS.hasOwnProperty(filter)) return

            this.taskFilter = filter
            localStorage.taskFilter = filter

            this.skeletonSpawner()
            this.tasksPerPage = await this.getTasksPerPage()

            if (this.tasksPerPage.length === 0) {
                await this.onPageChange(1)
            }
        },
        async onPageChange(page) {
            this.currentPage = page
            localStorage.currentPage = Number(page)

            this.skeletonSpawner()
            this.tasksPerPage = await this.getTasksPerPage()
        },
        getTotalPages() {
            return Math.ceil(this.getFilteredTasks().length / this.resultsPerPage)
        },
        async getTasksPerPage(skip = this.tasksToSkip) {
            return await getPaginatedTasks(skip, this.resultsPerPage, this.taskFilter)
                .then(result => {
                    this.loading = false

                    return result
                })
        },
        getFilteredTasks() {
            const filter = FILTERS[this.taskFilter]

            if (filter === undefined)
                return this.tasks

            return this.tasks.filter(task => task.done === filter)
        },
        skeletonSpawner() {
            /**
             * Always generate resultsPerPage number of skeleton cards
             * so when you navigate between pages you don't get less
             */
            this.loading = true

            for (let i = 0; i < this.resultsPerPage; i++) {
                this.tasksPerPage[i] = {}
            }
        }
    },
    async mounted() {
        await getTasks().then(async (tasks) => {
            this.tasks = tasks

            this.skeletonSpawner()
            this.tasksPerPage = await this.getTasksPerPage()
        })
    },
    computed: {
        tasksToSkip() {
            return (this.currentPage - 1) * this.resultsPerPage
        }
    },
    created() {
        alertify.defaults = alertifysettings;
        applyTheme();
    }
}
</script>
