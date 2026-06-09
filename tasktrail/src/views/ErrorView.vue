<template lang="pug">

div
    .svg404
        img(src="/media/images/404-app.svg" alt="")

</template>

<script>
import alertify from 'alertifyjs'
import { alertifysettings } from '../utils/helpers'

export default {

    name: 'Tasks',
    data() {
        return {
        }
    },
    created() {
        alertify.defaults = alertifysettings;
    }
};
</script>
