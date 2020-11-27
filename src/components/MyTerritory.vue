<template>
  <div>
    <b-link :to="url(territory)">
      {{territory.name}} ({{firstCity}})
    </b-link>
    <span v-if="territory.status">
      on {{territory.status && checkoutDate(territory.status.date)}}
    </span>
    <div v-if="territory.lastVisited">
      {{formattedLastVisited}}
    </div>
    <div class="last-activity font-weight-normal" v-if="territory.status">
      Last activity: {{this.lastTimestamp}}
    </div>
  </div>
</template>
<script>
import { mapActions } from 'vuex';
import get from 'lodash/get';
import format from 'date-fns/format';
import formatDistance from 'date-fns/formatDistance';

export default {
  name: 'MyTerritory',
  props: ['territory'],
  methods: {
    ...mapActions({
    }),
    checkoutDate(date) {
      return format(new Date(date), 'MM/dd/yyyy');
    },
    url(terr) {
      return `/territories/${terr.id}`;
    },
  },
  computed: {
    lastActivity() {
      return this.territory.lastActivity;
    },
    lastTimestamp() {
      if (this.lastActivity) {
        const timestamp = Number(this.lastActivity.timestamp);
        if (!Number.isNaN(timestamp)) {
          return format(new Date(timestamp), 'E M/d p');
        }
      }
      return null;
    },
    formattedLastVisited() {
      return formatDistance(new Date(this.territory.lastVisited), new Date(), { addSuffix: true });
    },
    firstCity() {
      const cityArray = (get(this.territory, 'city') || '').split(',');
      return cityArray.length && cityArray[0];
    },
  },
};
</script>
<style scoped>
  .last-activity {
    font-size: 16px;
  }
</style>
