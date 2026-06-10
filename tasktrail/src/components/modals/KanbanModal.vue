<template lang="pug">
div(@keyup.esc="isActive = false")
    button.button.is-primary(@click="toggleCreateModal") {{ $t('kanban.buttons.newColumn') }}

    .modal(:class="{'is-active': isActive }" @keyup.esc="isActive = false")
        .modal-background
        .modal-card
            .modal-card-head
                .modal-card-title {{ $t('kanban.modal.createColumn') }}
            .modal-card-body
                .field
                    .label {{ $t('kanban.modal.name') }}:
                    input.input(type="text" :placeholder="$t('kanban.modal.placeholder')" required v-model="columnName")

            .modal-card-foot.is-flex.is-justify-content-flex-end
                button.button(@click="toggleCreateModal()") {{ $t('kanban.modal.cancel') }}

                button.button.is-success(@click="saveColumn(columnName)") {{ $t('kanban.modal.create') }}
</template>

<script>
import { Helper } from '../../utils/helperClass.js'

export default {
    data() {
        return {
            columnName: "",
            isActive: false,
        }
    },
    methods: {
        toggleCreateModal() {
            this.resetDefaults()
            this.isActive = !this.isActive;
            // Helper.enableScroll()
            Helper.toggleScroll(this.isActive)
        },
        saveColumn(name) {
            this.resetDefaults()
            this.$emit('add', name)
            this.toggleCreateModal()
        },
        resetDefaults() {
            this.columnName = ""
        }
    }
}
</script>
