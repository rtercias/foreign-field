<template>
  <div class="change-log-address-card d-flex flex-column justify-content-between">
    <div class="d-flex justify-content-between">
      <div>
        <div>{{log.address.addr1}} {{log.address.addr2}}</div>
        <div>{{log.address.city}} {{log.address.state_province}} {{log.address.postal_code}}</div>
      </div>
      <div>
        <div>{{log.address.territory.name}}</div>
      </div>
    </div>
    <div>
      <b-list-group>
        <b-list-group-item v-for="(change, key, index) in changes" :key="index">
          <span>{{key}} - {{change}}</span><b-button variant="link">Undo</b-button>
        </b-list-group-item>
      </b-list-group>
    </div>
  </div>
</template>
<script>
import { mapGetters } from 'vuex';

export default {
  name: 'ChangeLogAddressCard',
  props: ['log'],
  computed: {
    ...mapGetters({
      congId: 'auth/congId',
    }),
    changes() {
      return JSON.parse(this.log.changes);
    },
  },
};
</script>
<style scoped>

</style>
