<template lang="pug">

.kanban-container
    .buttons.columns
        .column
            KanbanModal(@add="addColumn")

    .kanban-wrapper
        .kanban-board(v-if='!loading')
            .kanban-column(
                v-for="column in columns" :key="column.id"
            )

                KanbanColumnButtons(:column="column" @delete="deleteColumn(column)" @updateColumn="save()")

                draggable.kanban-cards(
                    :list="column.tasks"
                    item-key="id"
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

        KanbanColumnSkeleton(v-else)

</template>

<script>
import alertify from 'alertifyjs'
import draggable from 'vuedraggable'
import { alertifysettings, applyTheme, saveKanban, getKanban, deleteKanbanColumn, deleteKanbanTask } from '../utils/helpers'
import { Helper } from "../utils/helperClass.js"

import KanbanTask from '../components/KanbanTask.vue'
import KanbanColumnSkeleton from '../components/skeletons/KanbanColumnSkeleton.vue'
import KanbanModal from '../components/modals/KanbanModal.vue'
import KanbanColumnButtons from '../components/KanbanColumnButtons.vue'

export default {
    name: 'Tasks',
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

            columns: []
        }
    },
    methods: {
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
            await deleteKanbanColumn(column);
            await this.getKanban()
        },
        async deleteTask(task) {
            await deleteKanbanTask(task);
            await this.getKanban()
        },
        async getKanban() {
            this.columns = await getKanban()
        },
        async save() {
            await saveKanban(this.columns)
            await this.getKanban()
        }
    },
    created() {
        alertify.defaults = alertifysettings
        applyTheme()
    }, 
    async mounted() {
        await this.getKanban().then(() => {
            this.loading = false
        })
    }
}
</script>
