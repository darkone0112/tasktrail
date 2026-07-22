<template lang="pug">

.kanban-container
    .kanban-toolbar
        .field
            label.label {{ $t('kanban.boards.current') }}
            .select
                select(v-model="selectedBoardId" @change="loadSelectedBoard")
                    option(v-for="board in boards" :key="board.id" :value="board.id")
                        | {{ board.name }} · {{ $t(`kanban.boards.visibility.${board.visibility.toLowerCase()}`) }}
        .field
            label.label {{ $t('kanban.boards.create') }}
            .field.has-addons
                .control
                    input.input(v-model.trim="newBoardName" :placeholder="$t('kanban.boards.name')" maxlength="100" @keyup.enter="createBoard")
                .control
                    .select
                        select(v-model="newBoardVisibility")
                            option(value="TEAM") {{ $t('kanban.boards.visibility.team') }}
                            option(value="PERSONAL") {{ $t('kanban.boards.visibility.personal') }}
                .control
                    button.button.is-success(@click="createBoard" :disabled="!newBoardName") {{ $t('kanban.boards.add') }}
        button.button.is-danger(
            v-if="selectedBoard && selectedBoard.canDelete"
            @click="confirmDeleteBoard"
        ) {{ $t('kanban.boards.delete') }}

    .buttons.columns(v-if="selectedBoard")
        .column.is-flex.is-align-items-center.is-flex-wrap-wrap
            KanbanModal(@add="addColumn")
            button.button.is-light.kanban-recycle-button(type="button" @click="openRecycleBin")
                span.icon
                    i.fas.fa-trash-arrow-up
                span {{ $t('kanban.recycleBin.button') }}

    .kanban-wrapper
        .kanban-loading(v-if="loading" role="status" :aria-label="$t('kanban.loading')")
            span.icon
                i.fas.fa-spinner.fa-spin

        .kanban-board(v-else-if="selectedBoard")
            .kanban-column(
                v-for="column in columns" :key="column.id"
            )

                KanbanColumnButtons(
                    :column="column"
                    :board-id="selectedBoard.id"
                    @delete="deleteColumn(column)"
                    @updateColumn="save()"
                    @refresh="getKanban()"
                    @error="showError"
                )

                draggable.kanban-cards(
                    :list="column.tasks"
                    :item-key="taskKey"
                    group="tasks"
                    :animation="200"
                    :delay="150"
                    :delay-on-touch-only="true"
                    chosen-class="kanban__chosen"
                    ghost-class="kanban__ghost"
                    :fallback-tolerance="4"
                    :empty-insert-threshhold="100"
                    filter="input:not(:disabled), textarea:not(:disabled), button, select, option, a, .is-clickable"
                    :prevent-on-filter="false"
                    @end="save()"
                )
                    template(v-slot:item="{ element: task }")
                        KanbanTask(
                            :task="task"
                            :column="column"
                            :can-assign="isAdmin && selectedBoard.visibility !== 'PERSONAL'"
                            :users="assignmentUsers"
                            @delete="deleteTask(task)"
                            @blurTask="save()"
                            @selectPriority="save()"
                            @deadline="setDeadline(task, $event)"
                            @assign="assignTask(task, $event)"
                            @details="openTaskDetails(task)"
                        )

        .notification(v-else) {{ $t('kanban.boards.empty') }}

    KanbanTaskDetails(
        v-if="activeTask"
        :task="activeTask"
        :details="taskDetails"
        :loading="taskDetailsLoading"
        :submitting="taskActivitySaving"
        :can-assign="isAdmin && selectedBoard && selectedBoard.visibility !== 'PERSONAL'"
        :users="assignmentUsers"
        @close="closeTaskDetails"
        @add-activity="addTaskActivity"
        @update-title="updateTaskDetails({ name: $event })"
        @update-priority="updateTaskDetails({ priority: $event })"
        @update-deadline="updateTaskDeadline($event)"
        @update-assignee="updateTaskAssignee($event)"
    )

    KanbanRecycleBin(
        v-if="recycleBinOpen"
        :tasks="deletedTasks"
        :loading="recycleBinLoading"
        @close="closeRecycleBin"
        @restore="restoreDeletedTask"
    )

</template>

<script>
import alertify from 'alertifyjs'
import draggable from 'vuedraggable'
import {
    alertifysettings,
    applyTheme,
    assignKanbanTask,
    createKanbanBoard,
    createKanbanColumn,
    deleteKanbanBoard,
    deleteKanbanColumn,
    deleteKanbanTask,
    getDeletedKanbanTasks,
    getKanban,
    getKanbanBoards,
    getUsers,
    getKanbanTaskDetails,
    createKanbanTaskActivity,
    restoreKanbanTask,
    saveBoardKanban
} from '../utils/helpers'
import { user } from '../router'

import KanbanTask from '../components/KanbanTask.vue'
import KanbanModal from '../components/modals/KanbanModal.vue'
import KanbanColumnButtons from '../components/KanbanColumnButtons.vue'
import KanbanTaskDetails from '../components/modals/KanbanTaskDetails.vue'
import KanbanRecycleBin from '../components/modals/KanbanRecycleBin.vue'

export default {
    name: 'Kanban',
    components: {
        KanbanTask,
        KanbanColumnButtons,
        KanbanModal,
        KanbanTaskDetails,
        KanbanRecycleBin,
        draggable
    },
    data() {
        return {
            loading: true,
            columns: [],
            boards: [],
            selectedBoardId: null,
            newBoardName: "",
            newBoardVisibility: "TEAM",
            assignmentUsers: [],
            isAdmin: user?.role === "ADMIN",
            savePromise: Promise.resolve(),
            kanbanLoadVersion: 0,
            activeTask: null,
            taskDetails: null,
            taskDetailsLoading: false,
            taskActivitySaving: false,
            recycleBinOpen: false,
            recycleBinLoading: false,
            deletedTasks: []
        }
    },
    computed: {
        selectedBoard() {
            return this.boards.find(board => board.id === Number(this.selectedBoardId)) || null
        }
    },
    methods: {
        taskKey(task) {
            return `${task.userid}-${task.id}`
        },
        findTask(task) {
            return this.columns.flatMap(column => column.tasks).find(candidate => this.taskKey(candidate) === this.taskKey(task)) || null
        },
        showError(error) {
            alertify.error(error.message || String(error))
        },
        async loadBoards(preferredBoardId = null) {
            this.boards = await getKanbanBoards()
            const preferredBoard = this.boards.find(board => board.id === Number(preferredBoardId))
            const teamBoard = this.boards.find(board => board.visibility === "TEAM")
            this.selectedBoardId = (preferredBoard || teamBoard || this.boards[0])?.id || null
        },
        async loadSelectedBoard() {
            this.loading = true
            try {
                await this.getKanban()
            } finally {
                this.loading = false
            }
        },
        async createBoard() {
            if (!this.newBoardName) return
            try {
                const board = await createKanbanBoard(this.newBoardName, this.newBoardVisibility)
                this.newBoardName = ""
                await this.loadBoards(board.id)
                await this.loadSelectedBoard()
            } catch (error) {
                alertify.error(error.message)
            }
        },
        async loadAssignmentUsers() {
            if (!this.isAdmin) return
            this.assignmentUsers = await getUsers()
        },
        async assignTask(task, assignedUserId) {
            try {
                await assignKanbanTask(task, assignedUserId)
                await this.getKanban()
            } catch (error) {
                alertify.error(error.message)
            }
        },
        async setDeadline(task, deadline) {
            task.due_date = deadline ? `${deadline}T12:00:00.000Z` : null
            await this.save()
        },
        confirmDeleteBoard() {
            alertify.confirm(
                this.$t('kanban.boards.delete'),
                this.$t('kanban.boards.deleteConfirm', { name: this.selectedBoard.name }),
                async () => {
                    try {
                        await deleteKanbanBoard(this.selectedBoard.id)
                        await this.loadBoards()
                        await this.loadSelectedBoard()
                    } catch (error) {
                        alertify.error(error.message)
                    }
                },
                () => {}
            )
        },
        async addColumn(title) {
            if (!title || !this.selectedBoard) return
            try {
                await createKanbanColumn(this.selectedBoard.id, title)
                await this.getKanban()
            } catch (error) {
                alertify.error(error.message)
            }
        },
        async deleteColumn(column) {
            await deleteKanbanColumn(this.selectedBoard.id, column);
            await this.getKanban()
        },
        async deleteTask(task) {
            await deleteKanbanTask(this.selectedBoard.id, task);
            if (this.activeTask === task) this.closeTaskDetails()
            await this.getKanban()
        },
        async openRecycleBin() {
            this.recycleBinOpen = true
            this.recycleBinLoading = true
            try {
                this.deletedTasks = await getDeletedKanbanTasks(this.selectedBoard.id)
            } catch (error) {
                alertify.error(error.message)
                this.closeRecycleBin()
            } finally {
                this.recycleBinLoading = false
            }
        },
        closeRecycleBin() {
            this.recycleBinOpen = false
            this.recycleBinLoading = false
            this.deletedTasks = []
        },
        async restoreDeletedTask(task) {
            try {
                await restoreKanbanTask(task)
                this.deletedTasks = this.deletedTasks.filter(deletedTask => this.taskKey(deletedTask) !== this.taskKey(task))
                await this.getKanban()
            } catch (error) {
                alertify.error(error.message)
            }
        },
        async openTaskDetails(task) {
            this.activeTask = task
            this.taskDetails = null
            this.taskDetailsLoading = true
            try {
                const details = await getKanbanTaskDetails(task)
                if (this.activeTask === task) this.taskDetails = details
            } catch (error) {
                alertify.error(error.message)
                this.closeTaskDetails()
            } finally {
                if (this.activeTask === task) this.taskDetailsLoading = false
            }
        },
        async refreshTaskDetails() {
            if (!this.activeTask) return
            const task = this.activeTask
            const details = await getKanbanTaskDetails(task)
            if (this.activeTask && this.taskKey(this.activeTask) === this.taskKey(task)) this.taskDetails = details
        },
        async updateTaskDetails(changes) {
            if (!this.activeTask) return
            Object.assign(this.activeTask, changes)
            try {
                await this.save()
                await this.refreshTaskDetails()
            } catch (error) {
                alertify.error(error.message)
            }
        },
        async updateTaskDeadline(deadline) {
            return this.updateTaskDetails({ due_date: deadline ? `${deadline}T12:00:00.000Z` : null })
        },
        async updateTaskAssignee(assignedUserId) {
            if (!this.activeTask) return
            try {
                await assignKanbanTask(this.activeTask, assignedUserId)
                await this.getKanban()
                await this.refreshTaskDetails()
            } catch (error) {
                alertify.error(error.message)
            }
        },
        closeTaskDetails() {
            this.activeTask = null
            this.taskDetails = null
            this.taskDetailsLoading = false
            this.taskActivitySaving = false
        },
        async addTaskActivity(body) {
            if (!this.activeTask || this.taskActivitySaving) return
            this.taskActivitySaving = true
            try {
                const activity = await createKanbanTaskActivity(this.activeTask, body)
                if (this.taskDetails) this.taskDetails.activities.push(activity)
            } catch (error) {
                alertify.error(error.message)
            } finally {
                this.taskActivitySaving = false
            }
        },
        async getKanban() {
            if (!this.selectedBoard) {
                this.columns = []
                return
            }

            const boardId = this.selectedBoard.id
            const loadVersion = ++this.kanbanLoadVersion
            const columns = await getKanban(boardId)
            if (loadVersion === this.kanbanLoadVersion && this.selectedBoard?.id === boardId) {
                this.columns = columns
                if (this.activeTask) this.activeTask = this.findTask(this.activeTask) || this.activeTask
            }
        },
        async save() {
            const boardId = this.selectedBoard.id
            const snapshot = JSON.parse(JSON.stringify(this.columns))
            this.savePromise = this.savePromise
                .catch(() => {})
                .then(() => saveBoardKanban(boardId, snapshot))
                .then(() => this.selectedBoard?.id === boardId ? this.getKanban() : null)
                .catch(error => alertify.error(error.message))
            return this.savePromise
        }
    },
    created() {
        alertify.defaults = alertifysettings
        applyTheme()
    }, 
    async mounted() {
        await Promise.all([this.loadBoards(), this.loadAssignmentUsers()])
        await this.getKanban().then(() => {
            this.loading = false
        })
    }
}
</script>
