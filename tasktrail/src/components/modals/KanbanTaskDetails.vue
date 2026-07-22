<template lang="pug">
.modal.is-active.kanban-task-details(@keyup.esc="$emit('close')")
    .modal-background(@click="$emit('close')")
    .modal-card.kanban-task-details-modal
        header.modal-card-head
            .modal-card-title {{ details ? (details.name || $t('kanban.card.untitled')) : (task.name || $t('kanban.card.untitled')) }}
            button.delete(type="button" :aria-label="$t('kanban.card.closeDetails')" @click="$emit('close')")

        section.modal-card-body
            .kanban-detail-loading(v-if="loading")
                span.icon
                    i.fas.fa-spinner.fa-spin

            template(v-else-if="details")
                .kanban-detail-meta
                    .kanban-detail-meta-item.kanban-detail-title-field
                        label.kanban-detail-label(for="kanban-detail-title") {{ $t('kanban.card.title') }}
                        textarea#kanban-detail-title.textarea(
                            :value="details.name"
                            rows="2"
                            @change="$emit('update-title', $event.target.value)"
                        )
                    .kanban-detail-meta-item
                        label.kanban-detail-label {{ $t('kanban.card.column') }}
                        span.tag.is-light {{ details.column.title }}
                    .kanban-detail-meta-item
                        label.kanban-detail-label(for="kanban-detail-priority") {{ $t('kanban.card.priority') }}
                        .select.is-small
                            select#kanban-detail-priority(
                                :value="details.priority"
                                @change="$emit('update-priority', Number($event.target.value))"
                            )
                                option(v-for="priority in priorities" :key="priority.value" :value="priority.value") {{ priority.name }}
                    .kanban-detail-meta-item
                        label.kanban-detail-label(for="kanban-detail-deadline") {{ $t('kanban.card.deadline') }}
                        input#kanban-detail-deadline.input.is-small.kanban-deadline-input(
                            type="date"
                            :value="deadlineValue"
                            @change="$emit('update-deadline', $event.target.value)"
                        )
                    .kanban-detail-meta-item
                        label.kanban-detail-label(for="kanban-detail-assignee") {{ $t('kanban.card.assignee') }}
                        .select.is-small(v-if="canAssign")
                            select#kanban-detail-assignee(
                                :value="details.assigned_user_id || ''"
                                @change="$emit('update-assignee', $event.target.value)"
                            )
                                option(value="") {{ $t('kanban.assignment.unassigned') }}
                                option(v-for="member in users" :key="member.id" :value="member.id") {{ member.username }}
                        span(v-else) {{ details.assignee ? details.assignee.username : $t('kanban.assignment.unassigned') }}

                section.kanban-detail-timeline
                    h3.title.is-5 {{ $t('kanban.card.activity') }}
                    .kanban-timeline(v-if="details.activities.length")
                        article.kanban-timeline-entry(v-for="activity in details.activities" :key="activity.id")
                            span.kanban-timeline-marker
                            .kanban-timeline-content
                                .kanban-timeline-heading
                                    strong {{ activity.author.username }}
                                    time(:datetime="activity.created_at") {{ formatTimestamp(activity.created_at) }}
                                p {{ activity.body }}
                    p.has-text-grey(v-else) {{ $t('kanban.card.noActivity') }}

                form.kanban-activity-form(@submit.prevent="submitActivity")
                    label.label(for="kanban-activity") {{ $t('kanban.card.addActivity') }}
                    textarea#kanban-activity.textarea(
                        v-model.trim="activityBody"
                        :placeholder="$t('kanban.card.activityPlaceholder')"
                        maxlength="1000"
                        rows="3"
                        :disabled="submitting"
                    )
                    .kanban-activity-actions
                        button.button.is-primary(type="submit" :disabled="!activityBody || submitting")
                            span.icon(v-if="submitting")
                                i.fas.fa-spinner.fa-spin
                            span {{ $t('kanban.card.postActivity') }}
</template>

<script>
export default {
    name: 'KanbanTaskDetails',
    props: {
        task: {
            type: Object,
            required: true
        },
        details: {
            type: Object,
            default: null
        },
        loading: {
            type: Boolean,
            default: false
        },
        submitting: {
            type: Boolean,
            default: false
        },
        canAssign: {
            type: Boolean,
            default: false
        },
        users: {
            type: Array,
            default: () => []
        }
    },
    emits: ['close', 'add-activity', 'update-title', 'update-priority', 'update-deadline', 'update-assignee'],
    data() {
        return {
            activityBody: ''
        }
    },
    computed: {
        priorities() {
            return ['low', 'normal', 'high'].map((priority, value) => ({
                value,
                name: this.$t(`kanban.taskPriority.${priority}`)
            }))
        },
        deadlineValue() {
            return this.details?.due_date ? String(this.details.due_date).slice(0, 10) : ''
        }
    },
    methods: {
        submitActivity() {
            if (!this.activityBody || this.submitting) return
            this.$emit('add-activity', this.activityBody)
            this.activityBody = ''
        },
        formatTimestamp(timestamp) {
            return new Intl.DateTimeFormat(this.$i18n.locale, {
                dateStyle: 'medium',
                timeStyle: 'short'
            }).format(new Date(timestamp))
        }
    }
}
</script>
