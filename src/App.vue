<template>
  <div id="app" class="d-flex min-vh-100" :class="{ 'flex-row': isDesktop, 'flex-column': !isDesktop }">
    <Masthead :class="{ 'w-25': isDesktop }"></Masthead>
    <div :class="{ 'w-75': isDesktop }">
      <b-navbar
        v-if="isDesktop"
        :sticky="true"
        :class="`desktop-nav alert-secondary d-flex justify-content-between
          border-medium border-bottom border-left-0 border-right-0 py-0`">
        <div class="app-breadcrumb d-flex align-items-center">
          <b-button variant="link" class="back-button button p-0" @click="goBack" v-show="showLeftNav">
            <font-awesome-icon icon="chevron-left"></font-awesome-icon>
            <span v-if="canWrite">{{backLabel}}</span>
          </b-button>
          <span v-if="!!backLabel && canWrite" class="px-1">/</span>
          <span v-if="canWrite">{{routeLabel}}</span>
        </div>
        <b-nav-text v-if="isCampaignMode"><font-awesome-icon icon="bolt" /> CAMPAIGN MODE</b-nav-text>
        <b-nav-text></b-nav-text>
      </b-navbar>
      <router-view class="view" :key="key"></router-view>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import get from 'lodash/get';
import Masthead from './components/Masthead';

export default {
  name: 'app',
  components: {
    Masthead,
  },
  data() {
    return {
      backLabel: '',
    };
  },
  async mounted() {
    await this.refresh();
  },
  computed: {
    ...mapGetters({
      isForcedOut: 'auth/isForcedOut',
      isDesktop: 'auth/isDesktop',
      user: 'auth/user',
      canWrite: 'auth/canWrite',
    }),
    isCampaignMode() {
      return !!get(this.user, 'congregation.campaign') || false;
    },
    key() {
      return `${this.$route.name}-${JSON.stringify(this.$route.params)}`;
    },
    showLeftNav() {
      return this.$route.name !== 'home';
    },
    routeLabel() {
      return get(this.$route, 'meta.label');
    },
  },
  methods: {
    ...mapActions({
      back: 'auth/back',
      authorize: 'auth/authorize',
    }),
    goBack() {
      this.back({ vm: this });
    },
    async refresh() {
      if (this.user) await this.authorize(get(this.user, 'username'));
      const back = get(this.$route, 'meta.back');
      const backRoute = this.$router.resolve({ name: back });
      this.backLabel = back ? get(backRoute, 'route.meta.label') : '';
    },
  },
  watch: {
    async $route() {
      try {
        await this.refresh();
      } catch (e) {
        if (e === 'Unauthorized') {
          this.$router.replace({ name: 'unauthorized' });
        } else {
          this.$router.replace({ name: 'error' });
        }
      }
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

  .desktop-nav {
    min-height: 52px;
    padding-top: 14px;
    border-bottom: solid 6px;
  }
  .app-breadcrumb {
    font-size: 20px;
    .back-button {
      font-size: 20px;
      &:focus {
        box-shadow: 0 0 0 rgb(255, 255, 255);
      }
    }
  }
}
.view {
  height: calc(100% - 52px);
}
</style>
