<template lang="pug">

.item.kanban-task(:style="{ borderLeft: `5px solid ${priorityColor}` }")
    .kanban-card
        span.card
            .kanban-action
                .kanban-drag-handle
                    span.icon
                        i.fas.fa-grip-lines
                .kanban-card-actions
                    input.input.is-small.kanban-deadline-input(
                        type="date"
                        :title="$t('tasks.modal.deadline')"
                        :aria-label="$t('tasks.modal.deadline')"
                        :value="deadlineValue"
                        @change="$emit('deadline', $event.target.value)"
                    )
                    button.kanban-card-icon.kanban-detail-button(
                        type="button"
                        :title="$t('kanban.card.openDetails')"
                        :aria-label="$t('kanban.card.openDetails')"
                        @click="$emit('details')"
                    )
                        span.icon
                            i.fas.fa-up-right-and-down-left-from-center
                    button.kanban-card-icon.kanban-delete-button(
                        type="button"
                        :title="$t('tasks.overview.delete')"
                        :aria-label="$t('tasks.overview.delete')"
                        @click="$emit('delete', task)"
                    )
                        span.icon.has-text-danger
                            i.fas.fa-xmark

            label.label(@dblclick="focus")
                textarea.textarea.kanban-text(
                    v-if="edit"
                    v-model="task.name"
                    @blur="saveTask"
                    @keyup.enter="saveTask"
                    ref="input"
                    :placeholder="$t('kanban.placeholder')"
                    rows="3"
                )
                p.kanban-card-title(v-else)
                    template(v-for="(part, index) in titleParts" :key="index")
                        span.kanban-inline-tag(v-if="part.tag") {{ part.value }}
                        span(v-else) {{ part.value }}

            .kanban-card-footer
                .kanban-button
                    .dropdown(:class="{ 'is-active': isOpen }")
                        .dropdown-trigger
                            button.button(aria-haspopup='true' aria-controls='dropdown-menu' @click='toggleDropdown' :style="{ backgroundColor: priorityColor }")
                                span {{ (this.task.priority !== null) ? this.getPriorityName(task.priority) : "" }}
                                span.icon.is-small
                                    i.fas.fa-angle-down(aria-hidden='true')
                        #dropdown-menu.dropdown-menu(role='menu')
                            .dropdown-content
                                a(v-for='priority, index in priorities' :key='index' :class="{ 'dropdown-item': true, 'is-active': task.priority === index }" @click='selectOption(index)')
                                    | {{ priority.name }}
                .kanban-assignee
                    .select.is-small(v-if="canAssign")
                        select(:value="task.assigned_user_id || ''" @change="$emit('assign', $event.target.value)")
                            option(value="") {{ $t('kanban.assignment.unassigned') }}
                            option(v-for="member in users" :key="member.id" :value="member.id") {{ member.username }}
                    span.tag.is-light(v-else-if="task.assignee")
                        span.icon
                            i.fas.fa-user
                        span {{ task.assignee.username }}
</template>
<script>
import { getTaskPriorityColor } from '../utils/helpers'

export default {
    name: "KanbanTask",
    props: {
        task: {
            type: Object,
            required: true,
        },
        column: {
            type: Object,
            required: true,
        },
        editable: {
            type: Boolean,
            required: false,
            default: false,
        },
        canAssign: {
            type: Boolean,
            default: false,
        },
        users: {
            type: Array,
            default: () => [],
        },
    },
    data() {
        return {
            edit: this.editable,

            isOpen: false,
            priorities: [
                {
                    name: this.$t("kanban.taskPriority.low"),
                },
                {
                    name: this.$t("kanban.taskPriority.normal"),
                },
                {
                    name: this.$t("kanban.taskPriority.high"),
                },
            ],
            selectedOption: "",
        };
    },
    emits: ['deadline', 'delete', 'details', 'blurTask', 'selectPriority', 'assign'],
    computed: {
        priorityColor() {
            return getTaskPriorityColor(this.task.priority);
        },
        deadlineValue() {
            return this.task.due_date ? String(this.task.due_date).slice(0, 10) : "";
        },
        titleParts() {
            const parts = [];
            const matcher = /#[\p{L}\p{N}_-]+/gu;
            let lastIndex = 0;
            let match;

            while ((match = matcher.exec(this.task.name)) !== null) {
                if (match.index > lastIndex) parts.push({ value: this.task.name.slice(lastIndex, match.index), tag: false });
                parts.push({ value: match[0], tag: true });
                lastIndex = matcher.lastIndex;
            }

            if (lastIndex < this.task.name.length || parts.length === 0) {
                parts.push({ value: this.task.name.slice(lastIndex), tag: false });
            }

            return parts;
        }
    },
    created() {
        this.selectedOption = (this.task.priority !== null) ? this.getPriorityName(this.task.priority) : ""; 

        document.addEventListener("click", this.handleOutsideClick);
        document.addEventListener("mousedown", this.handleOutsideClick);
    },
    beforeUnmount() {
        document.removeEventListener("click", this.handleOutsideClick);
        document.removeEventListener("mousedown", this.handleOutsideClick);
    },
    methods: {
        focus() {
            // console.log("edit")
            this.edit = !this.edit
            this.$nextTick(() => {
                this.$refs.input.focus();
            });
        },
        toggleDropdown() {
            this.isOpen = !this.isOpen;
        },
        saveTask() {
            this.edit = !this.edit
            this.$emit('blurTask')
        },
        selectOption(option) {
            this.task.priority = option;
            this.isOpen = false;
            this.$emit('selectPriority');
        },
        getPriorityName(id = 0) {
            return this.priorities[id].name;
        },
        handleOutsideClick(event) {
            const target = event.target;
            const dropdownElement = this.$el.querySelector(".dropdown");

            if (!dropdownElement.contains(target)) {
                this.isOpen = false;
            }
        },
    },
};
</script>
