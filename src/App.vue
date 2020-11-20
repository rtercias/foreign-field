<template>
  <div id="app" class="d-flex min-vh-100" :class="{ 'flex-row': isDesktop, 'flex-column': !isDesktop }">
    <Masthead :class="{ 'w-25': isDesktop }"></Masthead>
    <div :class="{ 'w-75': isDesktop }">
      <b-alert variant="success" :show="isCampaignMode">
        <font-awesome-icon icon="bolt" /> CAMPAIGN MODE
      </b-alert>
      <router-view class="view"></router-view>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import get from 'lodash/get';
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
      user: 'auth/user',
    }),
    isCampaignMode() {
      return !!get(this.user, 'congregation.campaign') || false;
    },
  },
};

</script>

<style lang="scss">
@import 'assets/foreign-field-theme.scss';
@import '~bootstrap/scss/bootstrap.scss';
@import '~bootstrap-vue/src/index.scss';

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
