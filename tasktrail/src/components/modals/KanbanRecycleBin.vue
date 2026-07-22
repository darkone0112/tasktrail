<template lang="pug">
.modal.is-active.kanban-recycle-bin(@keyup.esc="$emit('close')")
    .modal-background(@click="$emit('close')")
    .modal-card.kanban-recycle-bin-modal
        header.modal-card-head
            .modal-card-title {{ $t('kanban.recycleBin.title') }}
            button.delete(type="button" :aria-label="$t('kanban.recycleBin.close')" @click="$emit('close')")

        section.modal-card-body
            .kanban-detail-loading(v-if="loading")
                span.icon
                    i.fas.fa-spinner.fa-spin
            .notification.is-light(v-else-if="!tasks.length") {{ $t('kanban.recycleBin.empty') }}
            .kanban-recycle-list(v-else)
                article.kanban-recycle-entry(v-for="task in tasks" :key="`${task.userid}-${task.id}`")
                    .kanban-recycle-entry-main
                        strong {{ task.name || $t('kanban.card.untitled') }}
                        span.tag.is-light {{ task.column.title }}
                        small {{ expiresAt(task.deleted_at) }}
                    button.button.is-primary.is-light(type="button" @click="$emit('restore', task)")
                        span.icon
                            i.fas.fa-rotate-left
                        span {{ $t('kanban.recycleBin.restore') }}
</template>

<script>
export default {
    name: 'KanbanRecycleBin',
    props: {
        tasks: {
            type: Array,
            default: () => []
        },
        loading: {
            type: Boolean,
            default: false
        }
    },
    emits: ['close', 'restore'],
    methods: {
        expiresAt(deletedAt) {
            const expiresAt = new Date(deletedAt)
            expiresAt.setDate(expiresAt.getDate() + 15)
            return this.$t('kanban.recycleBin.expires', {
                date: new Intl.DateTimeFormat(this.$i18n.locale, { dateStyle: 'medium' }).format(expiresAt)
            })
        }
    }
}
</script>
