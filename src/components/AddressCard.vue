<template>
  <div class="address-card row justify-content-between align-items-center pl-2 pr-2">
    <div class="address col-8 pl-0 pr-0">
      <h5>
        <a :href="mapsUrl" target="_blank">{{address.addr1}}</a>&nbsp;
        <em>{{address.addr2}}</em>
      </h5>
      <div>
        {{address.city}} {{address.state}} {{address.postalCode}}<br/>
        {{address.notes}}
      </div>
    </div>
    <div class="activity-container col-4 pl-0 pr-0">
      <!--
      <ActivityLog v-bind="{ address, selectedResponse, territoryId }" v-on:response-update="updateResponse"></ActivityLog>
      <ActivityLog v-bind="{ address, selectedResponse, territoryId }" v-on:response-update="updateResponse"></ActivityLog>
      -->
      <ActivityLog v-bind="{ address, selectedResponse, territoryId }" v-on:response-update="updateResponse"></ActivityLog>
    </div>
  </div>
</template>
<script>
import { mapGetters, mapActions } from 'vuex';
import get from 'lodash/get';
import ActivityLog from './ActivityLog';

export default {
  name: 'AddressCard',
  props: ['address', 'territoryId'],
  components: {
    ActivityLog,
  },
  data() {
    return {
      storageId: `foreignfield-${this.address.id}`,
      selectedResponse: '',
      responseText: '',
      animate: false,
    };
  },
  methods: {
    ...mapActions({
      setAddress: 'address/setAddress',
    }),
    updateResponse(value) {
      this.selectedResponse = value;
    },
  },
  mounted() {
    this.setAddress(this.address);
    this.selectedResponse = this.lastActivity || this.START;
  },
  computed: {
    ...mapGetters({
      lastActivity: 'address/lastActivity',
      loading: 'auth/loading',
      territory: 'territory/territory',
    }),

    mapsUrl() {
      const addr1 = this.address.addr1 || '';
      const city = this.address.city || '';
      const state = this.address.state_province || '';
      return `https://www.google.com/maps/dir/?api=1&destination=${addr1} ${city} ${state}`;
    },

    isTerritoryCheckedOut() {
      return get(this.territory, 'status.status') === 'Checked Out';
    },
  },
};
</script>
<style scoped>
.address-card {
  display: flex;
  flex-direction: row;
}
.address {
  text-align: left;
}
.nh-text {
  font-size: 0.5em;
}
.interaction {
  cursor: pointer;
  overflow: hidden;
}
.activity-container {
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
}

@media print {
  .interaction {
    display: none;
  }

  .address a {
    text-decoration: none;
  }
}
</style>
