<template>
  <div class="interaction pr-2" v-if="isTerritoryCheckedOut">
    <ActivityButton :value="selectedResponse" v-on:button-click="nextResponse" />
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import get from 'lodash/get';
import ActivityButton from './ActivityButton';
import { ActivityResponse } from '../store/modules/address';

export default {
  name: 'ActivityLog',
  props: ['address', 'selectedResponse', 'territoryId'],
  components: {
    ActivityButton,
  },
  data() {
    return {
      ...ActivityResponse,
    };
  },
  methods: {
    nextResponse(value) {
      this.$emit('button-click', value);
    },
    getLastActivity() {
      return this.lastActivity;
    },
  },
  computed: {
    ...mapGetters({
      territory: 'territory/territory',
      lastActivity: 'address/lastActivity',
    }),

    isTerritoryCheckedOut() {
      return get(this.territory, 'status.status') === 'Checked Out';
    },
  },
};
</script>
<style scoped>
.interaction {
  cursor: pointer;
  overflow: hidden;
}

@media print {
  .interaction {
    display: none;
  }
}
</style>
