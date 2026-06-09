<template lang="pug">

div
    .app.is-flex
        aside.menu(:class="menuActive ? 'menu-active' : ''")
            span.icon.menu-toggle.is-clickable(@click="toggleMenu()")
                i.fa-solid(:class="menuActive ? 'fa-xmark' : 'fa-bars'")
            ul
                li(v-for="route, i in routes")
                    p.menu-label(v-if="i == 0 || route.meta.group != routes[i - 1].meta.group")
                        | {{ route.meta.group }}
                    .menu-list
                        router-link(:to="route.path" v-if="route.meta.routerview")
                            span.icon-text
                                span.icon
                                    i.fas(:class="route.meta.classname")
                                span.i-text {{ route.meta.name }}

                        //- Logout
                        a(v-else="!route.meta.routerview" @click="route.meta.func")
                            span.icon-text
                                span.icon
                                    i.fas(:class="route.meta.classname")
                                span.i-text {{ route.meta.name }}

        .content.container
            h1.view-title {{ this.$route.meta.title }}
            p.view-desc {{ this.$route.meta.desc }}

            router-view(v-slot="{ Component }")
                transition(name="fade" mode="out-in")
                    component(:is="Component")

    .navbar.notification.is-warning.is-fixed-bottom(v-if="!user.verified")
        | {{ this.$t('notifications.emailVerification1') }}&nbsp;
        a(@click="sendVerifyMail()") {{ this.$t('notifications.emailVerification2') }}
        | &nbsp;{{ this.$t('notifications.emailVerification3') }}

</template>

<script>
import alertify from 'alertifyjs';
import { alertifysettings, sendVerificationMail } from './utils/helpers';
import { getUser, routes } from './router/index'

export default {
    name: 'App',
    data() {
        return {
            // Return the routes that contain metadata to display the navbar
            routes: routes.filter(route => { return route.meta }),
            user: {
                verified: true
            },
            menuActive: true,
        }
    },
    methods: {
        toggleMenu() {
            this.menuActive = !this.menuActive
        },
        async sendVerifyMail() {
            alertify
                .notify(this.$t('alertify.sentEmail'), 'success')
                .dismissOthers()

            await sendVerificationMail()
        }
    },
    async created() {
        alertify.defaults = alertifysettings;
    },
    async mounted() {
        this.user = await getUser();
    }
};
</script>
