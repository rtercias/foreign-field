<template>
  <div class="row justify-content-between align-items-center pl-2 pr-2">
    <div class="address col-9 pl-0">
      <h5>
        <a :href="mapsUrl" target="_blank">{{address.addr1}}</a>&nbsp;
        <em>{{address.addr2}}</em>
      </h5>
      <div>
        {{address.city}} {{address.state}} {{address.postalCode}}<br/>
        {{address.notes}}
      </div>
    </div>
    <!-- TODO: historical activity (show the last two) -->
    <!-- <div v-for="log in recentLogs" :key="log.id">
      <div>
        <font-awesome-layers v-if="log.value==='HOME'" class="text-success fa-3x">
          <font-awesome-icon icon="check-circle"></font-awesome-icon>
        </font-awesome-layers>
      </div>
      <div>
        <font-awesome-layers v-if="log.value==='NH'" class="text-warning fa-3x">
          <font-awesome-icon icon="circle"></font-awesome-icon>
          <font-awesome-layers-text value="NH" class="nh-text text-white font-weight-bold"></font-awesome-layers-text>
        </font-awesome-layers>
      </div>
    </div> -->
    <div class="interaction pr-0">
      <b-button
        class="pr-0"
        variant="link"
        v-if="selectedResponse==='START'"
        @click="nextResponse('HOME')"
        :disabled="loading">
        {{selectedResponse}}
      </b-button>
      <font-awesome-layers v-if="selectedResponse==='HOME'" class="text-success fa-3x" @click="nextResponse('NH')">
        <font-awesome-icon icon="check-circle"></font-awesome-icon>
      </font-awesome-layers>
      <font-awesome-layers v-if="selectedResponse==='NH'" class="text-warning fa-3x" @click="nextResponse('NF')">
        <font-awesome-icon icon="circle"></font-awesome-icon>
        <font-awesome-layers-text value="NH" class="nh-text text-white font-weight-bold"></font-awesome-layers-text>
      </font-awesome-layers>
      <font-awesome-layers v-if="selectedResponse==='NF'" class="fa-3x" @click="nextResponse('START')">
        <font-awesome-icon icon="circle"></font-awesome-icon>
        <font-awesome-layers-text value="NF" class="nh-text text-white font-weight-bold"></font-awesome-layers-text>
      </font-awesome-layers>
    </div>
  </div>
</template>
<script>
import { mapGetters, mapActions } from 'vuex';
import debounce from 'lodash/debounce';

const responses = ['START', 'HOME', 'NH', 'NF'];

export default {
  name: 'AddressCard',
  props: ['address'],
  data() {
    return {
      storageId: `foreignfield-${this.address.id}`,
      selectedResponse: '',
      responseText: '',
      animate: false,
      hideResponseText: false,
    };
  },
  methods: {
    ...mapActions({
      setAddress: 'address/setAddress',
      addLog: 'address/addLog',
      updateLog: 'address/updateLog',
      removeLog: 'address/removeLog',
    }),
    nextResponse: debounce((value) => {
      this.selectedResponse = value;
      this.addLog({ addressId: this.address.id, value });
    }, 500, { leading: true, trailing: false }),
  },
  mounted() {
    this.setAddress(this.address);
    this.selectedResponse = this.lastActivity || responses[0];
  },
  computed: {
    ...mapGetters({
      isOwnedByUser: 'territory/isOwnedByUser',
      lastActivity: 'address/lastActivity',
      loading: 'auth/loading',
    }),

    mapsUrl() {
      const addr1 = this.address.addr1 || '';
      const city = this.address.city || '';
      const state = this.address.state_province || '';
      return `https://www.google.com/maps/dir/?api=1&destination=${addr1} ${city} ${state}`;
    },

    recentLogs() {
      const lastActivityId = this.lastActivity && this.lastActivity.id;
      return [...this.address.activityLogs.filter(l => l.id !== lastActivityId)];
    },
  },
  watch: {
    address() {
      this.selectedResponse = this.lastActivity || responses[0];
    },
  },
};
</script>
<style scoped>
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

@media print {
  .interaction {
    display: none;
  }

  .address a {
    text-decoration: none;
  }
}
</style>
