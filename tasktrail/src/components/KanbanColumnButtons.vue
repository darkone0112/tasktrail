<template lang="pug">

div
    .columns
        .column
            input.kanban-column-title.column-title.title.is-4(
                v-model="column.title"
                :disabled="editable ? false : true"
                @blur="editColumn(column)"
                @keyup.enter="editColumn(column)"
                type="text"
                ref="title"
            )
        .column.kanban-column-buttons 
            //-.is-flex.is-justify-content-flex-end.is-align-items-center
            span.icon.is-clickable(@click="addTask(column)")
                i.fas.fa-add.has-text-success(:class="{ 'fa-spin': addingTask }")
            span.icon.is-clickable(@click="editColumn(column)")
                i.fas.fa-edit.has-text-info
            span.icon.is-clickable(@click="$emit('delete')")
                i.fas.fa-trash.has-text-danger
    .columns 
        .column 
            small.kanban__quantity {{ printRemainingTasks(column.tasks.length) }}

</template>

<script>
import { insertKanbanTask } from '../utils/helpers'

export default {
    name: 'KanbanColumnButtons',
    props: {
        column: {
            type: Object,
            required: true
        },
        boardId: {
            type: Number,
            required: true
        }
    },
    data() {
        return {
            editable: false,
            addingTask: false
        }
    },
    methods: {
        focus() {
            this.editable = !this.editable;
            this.$nextTick(() => {
                this.$refs.title.focus()
            })
        },
        editColumn() {
            this.editable = !this.editable;
            this.$nextTick(() => {
                this.$refs.title.focus()
            })
            this.$emit('updateColumn')
        },
        async addTask(column) {
            if (this.addingTask) return
            this.addingTask = true
            try {
                await insertKanbanTask(this.boardId, column, { id: null, name: "", priority: 0 })
                this.$emit('refresh')
            } catch (error) {
                this.$emit('error', error)
            } finally {
                this.addingTask = false
            }
        },
        printRemainingTasks(numberOfTasks) {
            if (numberOfTasks === 0) return this.$t("kanban.taskCount.zero")
            const key = numberOfTasks === 1 ? "one" : "many"
            return this.$t(`kanban.taskCount.${key}`, { count: numberOfTasks })
        }
    }
}
</script>
