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
                .field
                    .label {{ $t('kanban.modal.color') }}:
                    .kanban-color-picker
                        input.input(type="color" v-model="columnColor")
                        .kanban-color-swatches
                            button.kanban-color-swatch(
                                v-for="color in defaultColors"
                                :key="color"
                                type="button"
                                :style="{ backgroundColor: color }"
                                :class="{ 'is-selected': columnColor === color }"
                                :aria-label="color"
                                @click="columnColor = color"
                            )

            .modal-card-foot.is-flex.is-justify-content-flex-end
                button.button(@click="toggleCreateModal()") {{ $t('kanban.modal.cancel') }}

                button.button.is-success(@click="saveColumn(columnName, columnColor)") {{ $t('kanban.modal.create') }}
</template>

<script>
import { Helper } from '../../utils/helperClass.js'

export default {
    data() {
        return {
            columnName: "",
            columnColor: "#bae1ff",
            isActive: false,

            defaultColors: [
                "#d5b6d5", // Purple
                "#ffb3ba", // Red
                "#ffdfba", // Orange
                "#ffe6a2", // Yellow
                "#baffc9", // Green
                "#bae1ff", // Blue
                "#bff1f2", // Teal
            ]
        }
    },
    methods: {
        toggleCreateModal() {
            this.resetDefaults()
            this.isActive = !this.isActive;
            // Helper.enableScroll()
            Helper.toggleScroll(this.isActive)
        },
        saveColumn(name, color) {
            this.resetDefaults()
            this.$emit('add', name, color)
            this.toggleCreateModal()
        },
        resetDefaults() {
            this.columnName = ""
            this.columnColor = "#bae1ff"
        }
    }
}
</script>
