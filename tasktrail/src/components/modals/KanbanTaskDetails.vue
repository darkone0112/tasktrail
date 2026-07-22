<template lang="pug">
.modal.is-active.kanban-task-details(@keyup.esc="$emit('close')")
    .modal-background(@click="$emit('close')")
    .modal-card.kanban-task-details-modal
        header.modal-card-head
            .modal-card-title {{ task.name || $t('kanban.card.untitled') }}
            button.delete(type="button" :aria-label="$t('kanban.card.closeDetails')" @click="$emit('close')")

        section.modal-card-body
            .kanban-detail-loading(v-if="loading")
                span.icon
                    i.fas.fa-spinner.fa-spin

            template(v-else-if="details")
                .kanban-detail-meta
                    .kanban-detail-meta-item
                        span.kanban-detail-label {{ $t('kanban.card.column') }}
                        span.tag.is-light {{ details.column.title }}
                    .kanban-detail-meta-item
                        span.kanban-detail-label {{ $t('kanban.card.priority') }}
                        span.tag(:style="{ backgroundColor: priorityColor }") {{ priorityName }}
                    .kanban-detail-meta-item
                        span.kanban-detail-label {{ $t('kanban.card.deadline') }}
                        span {{ formattedDeadline }}
                    .kanban-detail-meta-item
                        span.kanban-detail-label {{ $t('kanban.card.assignee') }}
                        span {{ details.assignee ? details.assignee.username : $t('kanban.assignment.unassigned') }}

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
import { getTaskPriorityColor } from '../../utils/helpers'

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
        }
    },
    emits: ['close', 'add-activity'],
    data() {
        return {
            activityBody: ''
        }
    },
    computed: {
        priorityColor() {
            return getTaskPriorityColor(this.details?.priority)
        },
        priorityName() {
            const priorities = ['low', 'normal', 'high']
            return this.$t(`kanban.taskPriority.${priorities[this.details?.priority] || priorities[0]}`)
        },
        formattedDeadline() {
            if (!this.details.due_date) return this.$t('kanban.card.noDeadline')
            return new Intl.DateTimeFormat(this.$i18n.locale, { dateStyle: 'medium' }).format(new Date(this.details.due_date))
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
