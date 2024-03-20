<template>
  <div :key="key">
    <b-link :to="url(territory)">
      {{territory.name}} ({{territory.description}})
    </b-link>
    <span v-if="territory.status">
      on {{territory.status && checkoutDate(territory.status.date)}}
    </span>
    <div v-if="territory.lastVisited" class="small">
      {{formattedLastVisited}}
    </div>
    <div class="small font-weight-normal" v-if="territory.lastActivity">
      {{lastTimestamp}}
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
    }),
    checkoutDate(date) {
      return format(new Date(date), 'MM/dd/yyyy');
    },
    url(terr) {
      return `/territories/${terr.id}?back=home`;
    },
  },
  computed: {
    key() {
      return `${this.territory.id}`;
    },
    lastActivity() {
      return this.territory.lastActivity;
    },
    lastTimestamp() {
      if (this.lastActivity && this.lastActivity.timestamp) {
        const timestamp = Number(this.lastActivity.timestamp);
        if (!Number.isNaN(timestamp)) {
          return `Last Activity: ${formatDistance(new Date(timestamp), new Date(), { addSuffix: true })}`;
        }
      }
      return 'Not started';
    },
    formattedLastVisited() {
      return formatDistance(new Date(this.territory.lastVisited), new Date(), { addSuffix: true });
    },
  },
};
</script>
<style scoped>
</style>
