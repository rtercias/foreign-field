<template>
  <div id="app" class="d-flex min-vh-100" :class="{ 'flex-row': isDesktop, 'flex-column': !isDesktop }">
    <Masthead :class="{ 'w-25': isDesktop }"></Masthead>
    <router-view class="view" :class="{ 'w-75': isDesktop }"></router-view>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import Masthead from './components/Masthead';

export default {
  name: 'app',
  components: {
    Masthead,
  },
  computed: {
    ...mapGetters({
      isForcedOut: 'auth/isForcedOut',
      isDesktop: 'auth/isDesktop',
    }),
  },
};

</script>

<style lang="scss">
@import 'assets/foreign-field-theme.scss';
@import '~bootstrap/scss/bootstrap.scss';
@import '~bootstrap-vue/src/index.scss';

html, body {
  height: 100%;
}

h3 {
  margin: 40px 0 0;
}

router-link {
  cursor: pointer;
}

#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: $dark;
}
.view {
  height: calc(100% - 1.5em);
}
</style>
