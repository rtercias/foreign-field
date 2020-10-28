<template>
  <div>
    <b-link :to="url(territory)" @click="() => setTerr(territory)">
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
import format from 'date-fns/format';
import formatDistance from 'date-fns/formatDistance';

export default {
  name: 'MyTerritory',
  props: ['territory'],
  methods: {
    ...mapActions({
      setTerritory: 'territory/setTerritory',
    }),
    checkoutDate(date) {
      return format(new Date(date), 'MM/dd/yyyy');
    },
    url(terr) {
      return `/territories/${terr.group_code}/${terr.id}`;
    },
    setTerr(terr) {
      this.setTerritory(terr);
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
      const cityArray = this.territory.city.split(',');
      return cityArray.length && cityArray[0];
    },
  },
  mounted() {
    this.setTerritory(this.territory);
  },
};
</script>
<style scoped>
  .last-activity {
    font-size: 16px;
  }
</style>
