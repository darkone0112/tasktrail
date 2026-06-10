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
        .column
            KanbanModal(@add="addColumn")

    .kanban-wrapper
        .kanban-board(v-if='!loading && selectedBoard')
            .kanban-column(
                v-for="column in columns" :key="column.id"
            )

                KanbanColumnButtons(:column="column" :board-id="selectedBoard.id" @delete="deleteColumn(column)" @updateColumn="save()")

                draggable.kanban-cards(
                    :list="column.tasks"
                    :item-key="taskKey"
                    group="tasks"
                    :animation="200"
                    :delay="150"
                    chosen-class="kanban__drop-preview"
                    ghost-class="hide"
                    :empty-insert-threshhold="100"
                    handle=".card .label"
                    @end="save()"
                )
                    template(v-slot:item="{ element: task }")
                        KanbanTask(
                            :task="task"
                            :column="column"
                            @delete="deleteTask(task)"
                            @blurTask="save()"
                            @selectPriority="save()"
                        )

        KanbanColumnSkeleton(v-else-if="loading")
        .notification(v-else) {{ $t('kanban.boards.empty') }}

</template>

<script>
import alertify from 'alertifyjs'
import draggable from 'vuedraggable'
import {
    alertifysettings,
    applyTheme,
    createKanbanBoard,
    deleteKanbanBoard,
    deleteKanbanColumn,
    deleteKanbanTask,
    getKanban,
    getKanbanBoards,
    saveBoardKanban
} from '../utils/helpers'

import KanbanTask from '../components/KanbanTask.vue'
import KanbanColumnSkeleton from '../components/skeletons/KanbanColumnSkeleton.vue'
import KanbanModal from '../components/modals/KanbanModal.vue'
import KanbanColumnButtons from '../components/KanbanColumnButtons.vue'

export default {
    name: 'Kanban',
    components: {
        KanbanTask,
        KanbanColumnButtons,
        KanbanColumnSkeleton,
        KanbanModal,
        draggable
    },
    data() {
        return {
            loading: true,
            columns: [],
            boards: [],
            selectedBoardId: null,
            newBoardName: "",
            newBoardVisibility: "TEAM"
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
        async addColumn(title, color) {
            if (title) {
                this.columns.push({
                    id: null,
                    title: title,
                    color: color,
                    tasks: [],
                })
                await this.save()
            }
        },
        async deleteColumn(column) {
            await deleteKanbanColumn(this.selectedBoard.id, column);
            await this.getKanban()
        },
        async deleteTask(task) {
            await deleteKanbanTask(this.selectedBoard.id, task);
            await this.getKanban()
        },
        async getKanban() {
            this.columns = this.selectedBoard ? await getKanban(this.selectedBoard.id) : []
        },
        async save() {
            await saveBoardKanban(this.selectedBoard.id, this.columns)
            await this.getKanban()
        }
    },
    created() {
        alertify.defaults = alertifysettings
        applyTheme()
    }, 
    async mounted() {
        await this.loadBoards()
        await this.getKanban().then(() => {
            this.loading = false
        })
    }
}
</script>
