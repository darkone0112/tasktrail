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

    .save-settings
        button.button.is-success.my-5(@click="saveSettings()") {{ $t('settings.buttons.save') }}

</template>
<script>
import alertify from 'alertifyjs';
import messages from '../locales/locales.json'
import { applyTheme, alertifysettings } from '../utils/helpers';

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
        async saveSettings() {
            // console.log("Saving settings...");
            // Save currently selected theme
            let selectedTheme = document.querySelector('.theme-click');
            localStorage.setItem('selectedTheme', selectedTheme.id);
            // Save theme info
            localStorage.setItem('theme', "[" + JSON.stringify(this.themes.find((theme) => theme.id == localStorage.getItem('selectedTheme'))) + "]");
            // Save locale
            localStorage.setItem('locale', this.selectedLocale);

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
