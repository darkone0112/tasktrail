<template lang="pug">
div
    h1.is-title.is-size-4 
        span.fa-solid.fa-paint-roller.mr-2
        | {{ $t('settings.presets.title') }}
    .presets-container
        .palette(
            v-for="(theme, index) in themes" 
            :key="index" :id="theme.id" 
            :class="theme.id == selectedTheme ? 'theme-click' : ''"
            @click="applyColorTheme(theme)" 
        )
            .colors
                .color-block(v-for="color in theme.colors" :style="{ backgroundColor: color.value }")
            .desc
                p.title {{ $t('settings.presets.themes['+theme.id+'].name') }}
                p {{ $t('settings.presets.themes['+theme.id+'].desc') }}

    h1.is-title.is-size-4 
        span.fa-solid.fa-globe.mr-2
        | {{ $t('settings.language.title') }}
    .select.language-container 
        select(v-model='selectedLocale')
            option(v-for='locale in locales' :key='locale.code' :value='locale.code') {{ $t(locale.name) }}

    template(v-if="isAdmin")
        h1.is-title.is-size-4.mt-6
            span.fa-solid.fa-user-shield.mr-2
            | {{ $t('settings.permissions.title') }}
        p.mb-4 {{ $t('settings.permissions.description') }}
        .table-container
            table.table.is-fullwidth
                thead
                    tr
                        th {{ $t('settings.permissions.user') }}
                        th {{ $t('settings.permissions.email') }}
                        th {{ $t('settings.permissions.role') }}
                tbody
                    tr(v-for="member in users" :key="member.id")
                        td {{ member.username }}
                        td {{ member.email }}
                        td
                            .select
                                select(v-model="member.role" @change="changeRole(member)")
                                    option(value="MEMBER") {{ $t('settings.permissions.roles.member') }}
                                    option(value="ADMIN") {{ $t('settings.permissions.roles.admin') }}

    .save-settings
        button.button.is-success.my-5(@click="saveSettings()") {{ $t('settings.buttons.save') }}

</template>
<script>
import alertify from 'alertifyjs';
import messages from '../locales/locales.json'
import { applyTheme, alertifysettings, getUsers, saveLocale, updateUserRole } from '../utils/helpers';
import { user } from '../router';

export default {
    name: 'Settings',
    data() {
        return {
            themes: [
                {
                    id: "0",
                    styleName: "",
                    colors: [
                        { value: '#ffffff' }, // BG
                        { value: '#363636' }, // Font color
                        { value: '#e7e7e7' }, // Theme presets body
                        { value: '#185a9d' }, // Main buttons
                        { value: '#48c78e' }, // Add element
                        { value: '#227fdd' }, // Edit element
                        { value: '#f14668' }, // Remove element
                    ],
                },
                {
                    id: "1",
                    styleName: 'dark-theme',
                    colors: [
                        { value: '#0f0f0f' }, // BG
                        { value: '#ffffff' }, // Font color
                        { value: '#212121' }, // Theme presets body
                        { value: '#185a9d' }, // Main buttons
                        { value: '#2f815c' }, // Add element
                        { value: '#227fdd' }, // Edit element
                        { value: '#c11033' }, // Remove element
                    ],
                },
                {
                    id: "2",
                    styleName: 'high-contrast-theme',
                    colors: [
                        { value: '#000000' }, // BG
                        { value: '#ffffff' }, // Font color
                        { value: '#FFFF00' }, // Theme presets body
                        { value: '#0000FF' }, // Main buttons
                        { value: '#00FF00' }, // Add element
                        { value: '#00FFFF' }, // Edit element
                        { value: '#FF0000' }, // Remove element
                    ],
                },
            ],
            selectedLocale: this.$i18n.locale,
            selectedTheme: localStorage.getItem('selectedTheme') || "0",
            users: [],
            isAdmin: user?.role === "ADMIN",
            applyColorTheme(theme) {
                applyTheme(theme);

                const palettes = document.querySelectorAll('.palette');
                let selectedPalette = Array.from(palettes).find(palette => palette.id == theme.id);

                palettes.forEach(palette => {
                    if (palette.classList.contains('theme-click'))
                        palette.classList.remove('theme-click');
                });
                selectedPalette.classList.add('theme-click');
            }
        };
    },
    methods: {
        updateLocale() {
            this.$i18n.locale = this.selectedLocale

            this.$router.getRoutes().forEach((route) => {
                if (route.path != "/:pathMatch(.*)*") {
                    if (route.name.toLowerCase() != "profile") {
                        route.meta.name = this.$t(`${route.name.toLowerCase()}.menuTitle`);
                    }
                    route.meta.title = this.$t(`${route.name.toLowerCase()}.title`);
                    route.meta.desc = this.$t(`${route.name.toLowerCase()}.desc`);
                    route.meta.group = this.$t(`${route.name.toLowerCase()}.group`);
                }
            });
        },
        async loadUsers() {
            if (!this.isAdmin) return
            try {
                this.users = await getUsers()
            } catch (error) {
                alertify.error(error.message)
            }
        },
        async changeRole(member) {
            try {
                await updateUserRole(member.id, member.role)
                alertify.success(this.$t('settings.permissions.saved'))
            } catch (error) {
                alertify.error(error.message)
                await this.loadUsers()
            }
        },
        async saveSettings() {
            // console.log("Saving settings...");
            // Save currently selected theme
            let selectedTheme = document.querySelector('.theme-click');
            localStorage.setItem('selectedTheme', selectedTheme.id);
            // Save theme info
            localStorage.setItem('theme', "[" + JSON.stringify(this.themes.find((theme) => theme.id == localStorage.getItem('selectedTheme'))) + "]");
            // Save locale
            localStorage.setItem('locale', this.selectedLocale);
            await saveLocale(this.selectedLocale);

            // console.log("Settings saved.");
            location.reload(); // Workaround para que los locales de los popups de delete account y logout cambien
        },
    },
    computed: {
        locales() {
            return Object.keys(messages).map(locale => ({
                code: locale,
                name: messages[locale].lang
            }))
        }
    },
    watch: {
        selectedLocale(newLocale) {
            this.updateLocale()
        }
    },
    created() {
        alertify.defaults = alertifysettings;
        applyTheme();
        this.loadUsers();
    },
};
</script>
<style lang="scss" scoped>
.theme-click {
    box-shadow: 0px 0px 0px 0px rgba(0, 0, 0, 0);
    transform: translateY(4px);
}

// Check mark
.theme-click::after {
    content: '';
    position: absolute;
    right: -2px;
    top: -7px;
    display: block;
    width: 13px;
    height: 20px;
    border: solid #ffffff;
    border-width: 0 4px 4px 0;
    transform: rotate(45deg);
    z-index: 1;
}

// Green circle
.theme-click::before {
    content: '';
    position: absolute;
    right: -10px;
    top: -10px;
    display: block;
    width: 30px;
    height: 30px;
    border: solid #00000000;
    border-radius: 100%;
    background-color: green;
    z-index: 1;
}
</style>
