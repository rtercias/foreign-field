<template>
  <div class="interaction pr-0" v-if="isTerritoryCheckedOut">
    <b-button
      class="pr-0 pl-0"
      variant="link"
      v-if="selectedResponse === START || selectedResponse === undefined"
      @click="nextResponse(HOME)"
      :disabled="loading">
      {{ selectedResponse || START }}
    </b-button>
    <font-awesome-layers
      v-if="selectedResponse === HOME"
      class="text-success fa-3x"
      @click="nextResponse(NH)">
      <font-awesome-icon icon="check-circle"></font-awesome-icon>
    </font-awesome-layers>
    <font-awesome-layers
      v-if="selectedResponse === NH"
      class="text-warning fa-3x"
      @click="nextResponse(NF)">
      <font-awesome-icon icon="circle"></font-awesome-icon>
      <font-awesome-layers-text
        :value="NH"
        class="nh-text text-white font-weight-bold">
      </font-awesome-layers-text>
    </font-awesome-layers>
    <font-awesome-layers
      v-if="selectedResponse === NF"
      class="fa-3x"
      @click="nextResponse(START)">
      <font-awesome-icon icon="circle"></font-awesome-icon>
      <font-awesome-layers-text
        :value="NF"
        class="nh-text text-white font-weight-bold">
      </font-awesome-layers-text>
    </font-awesome-layers>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import debounce from 'lodash/debounce';
import get from 'lodash/get';

import { ActivityResponse } from '../store/modules/address';

export default {
  name: 'ActivityLog',
  props: ['address', 'selectedResponse', 'territoryId'],
  data() {
    return {
      ...ActivityResponse,
    };
  },
  methods: {
    ...mapActions({
      addLog: 'address/addLog',
      getTerritory: 'territory/getTerritory',
    }),
    nextResponse: debounce(async function (value) {
      try {
        this.$emit('response-update', value);
        await this.addLog({ addressId: this.address.id, value });
        await this.getTerritory(this.territoryId);
      } catch (e) {
        console.error('Unable to save activity log', e);
      }
    }, 500, { leading: true, trailing: false }),
    getLastActivity() {
      return this.lastActivity;
    },
  },
  computed: {
    ...mapGetters({
      loading: 'auth/loading',
      territory: 'territory/territory',
      lastActivity: 'address/lastActivity',
    }),

    // recentLogs() {
    //   const lastActivityId = this.lastActivity && this.lastActivity.id;
    //   return [...this.address.activityLogs.filter(l => l.id !== lastActivityId)];
    // },

    isTerritoryCheckedOut() {
      return get(this.territory, 'status.status') === 'Checked Out';
    },
  },
};
</script>
<style scoped>
.nh-text {
  font-size: 0.5em;
}

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
