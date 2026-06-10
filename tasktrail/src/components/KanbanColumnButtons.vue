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
            span.icon.is-clickable
                i.fas.fa-add.has-text-success(@click="addTask(column)")
            span.icon.is-clickable
                i.fas.fa-edit.has-text-info(@click="editColumn(column)")
            span.icon.is-clickable
                i.fas.fa-trash.has-text-danger(@click="$emit('delete')")
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
            editable: false
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
            await insertKanbanTask(this.boardId, column, { id: null, name: "", priority: 0 })
            this.$emit('updateColumn')
        },
        printRemainingTasks(numberOfTasks) {
            const TASK_STRING = "tarea"
            const PLURALIZED_STRING = this.pluralizeString(numberOfTasks, TASK_STRING)

            return `${PLURALIZED_STRING}`
        },
        pluralizeString(count, string, suffix = "s") {
            return `${count} ${string}${count !== 1 ? suffix : ''}`
        }
    }
}
</script>
