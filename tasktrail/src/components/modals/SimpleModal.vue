<template lang="pug">
.container
    button.button.is-primary.my-0(v-if="isCreate()" @click="toggleCreateModal()") {{ $t('tasks.buttons.newTask') }}

    .modal(
        @keyup.esc="isCreate() ? toggleCreateModal() : revertChanges()"
        :class="{'is-active': isCreate() ? isActive : task.edit }"
    )
        .modal-background
        .modal-card
            .modal-card-head 
                .modal-card-title {{ isCreate() ? $t('tasks.modal.createTask') : $t('tasks.modal.editTask') }}

            .modal-card-body 
                .notification.is-danger(v-if="this.error") {{ this.error }}
                .field 
                    .label {{ $t('tasks.modal.name') }}:
                    input.input(
                        v-if="isCreate()"
                        type="text"
                        :placeholder="$t('tasks.modal.placeholder')"
                        required
                        v-model="newName"
                        ref="input"
                        @keydown.enter="saveTask(getName(), getDate())"
                    )
                    input.input(
                        v-else
                        type="text"
                        :placeholder="$t('tasks.modal.placeholder')"
                        required
                        v-model="task.name"
                        ref="input"
                        @keydown.enter="toggleEditModal()"
                    )

                .field
                    .label {{ $t('tasks.modal.deadline') }}:
                    DatePicker(v-if="isCreate()" is-expanded v-model="newDate")
                    DatePicker(v-else is-expanded v-model="task.date")

            .modal-card-foot.is-flex.is-justify-content-flex-end
                button.button(@click="isCreate() ? toggleCreateModal() : revertChanges()") {{ $t('tasks.modal.cancel') }}

                button.button.is-success(v-if="isCreate()" @click="saveTask(getName(), getDate())") {{ $t('tasks.modal.create') }}
                button.button.is-success(v-else @click="toggleEditModal()") {{ $t('tasks.modal.saveChanges') }}
</template>

<script>
import { DatePicker } from 'v-calendar'
import 'v-calendar/style.css'
import { Helper } from '../../utils/helperClass.js'

export default {
    components: {
        DatePicker
    },
    props: {
        task: {
            type: Object,
            required: false,
            default: null
        },
        mode: {
            type: String,
            required: true,
            validator: (value) => ['edit', 'create'].includes(value)
        }
    },
    data() {
        return {
            error: "",
            oldName: "",
            newName: "",
            newDate: new Date(),

            isActive: false,
        }
    },
    methods: {
        toggleCreateModal() {
            this.newName = ""
            this.newDate = new Date()
            this.isActive = !this.isActive
            Helper.toggleScroll(this.isActive)
        },
        toggleEditModal() {
            if (this.isEdit() && this.task === undefined) return

            this.isNameValid(this.task.name) ? this.$emit('edit', this.task) : ''
        },
        revertChanges() {
            this.task.name = this.oldName

            this.toggleEditModal()
        },
        isEdit() {
            return this.mode === 'edit'
        },
        isCreate() {
            return this.mode === 'create'
        },
        saveTask(name, date) {
            if (this.isNameValid(name)) {
                this.newName = this.error = ""

                this.$emit('add', name, date)

                this.toggleCreateModal()
            }
        },

        getName() {
            return this.isCreate() ? this.newName : this.task.name
        },
        getDate() {
            return this.isCreate() ? this.newDate : new Date(this.task.date)
        },

        dateToYYYYMMDD(d) {
            return d && new Date(d.getTime() - (d.getTimezoneOffset()*60*1000)).toISOString().split('T')[0]
        },

        isNameValid(name) {
            this.error = ""

            const MIN_CHARACTERS = 3
            const MAX_CHARACTERS = 50

            if (name.length > MAX_CHARACTERS) {
                this.error = this.$t('tasks.modal.errors.maxLength')

                return false
            } else if (name.length < MIN_CHARACTERS) {
                this.error = this.$t('tasks.modal.errors.minLength')

                return false
            }

            return true
        }
    },
    created() {
        if (this.isEdit()) {
            this.oldName = this.task.name
        }
    }
}
</script>
