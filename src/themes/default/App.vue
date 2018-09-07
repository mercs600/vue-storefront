<template>
  <div id="app">
    <overlay v-if="overlayActive"/>
    <loader/>
    <div id="viewport" class="w-100 relative">
      <component :is="layout">
        <router-view/>
      </component>
    </div>
    <vue-progress-bar/>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import Head from 'theme/resource/head'
import baseLayout from './layouts/default'
import plainLayout from './layouts/plain'
import Overlay from 'theme/components/core/Overlay.vue'
import Loader from 'theme/components/core/Loader.vue'

export default {
  components: {
    baseLayout,
    plainLayout,
    Overlay,
    Loader
  },
  computed: {
    ...mapState({
      overlayActive: state => state.ui.overlay
    }),
    layout () {
      return `${(this.$route.meta.layout || 'base')}-layout`
    }
  },
  created () {
    // Progress bar on top of the page
    this.$router.beforeEach((to, from, next) => {
      this.$Progress.start()
      this.$Progress.increase(40)
      next()
    })
    this.$router.afterEach((to, from) => {
      this.$Progress.finish()
    })
  },
  metaInfo: Head
}
</script>

<style lang="scss" src="./css/main.scss">
</style>
