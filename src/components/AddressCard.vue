<template>
  <div class="row justify-content-between align-items-center pl-2 pr-2">
    <div class="address col-9 pl-0">
      <h5>
        <a :href="mapsUrl" target="_blank" v-if="isOwnedByUser">{{address.addr1}}</a>
        <span v-else>{{address.addr1}}</span>&nbsp;
        <em>{{address.addr2}}</em>
      </h5>
      <div>
        {{address.city}} {{address.state}} {{address.postalCode}}<br/>
        {{address.notes}}
      </div>
    </div>
    <div class="interaction pr-0" v-if="isOwnedByUser">
      <b-button
        class="pr-0"
        variant="link"
        v-if="selectedResponse==='START'"
        @click="nextResponse('HOME')"
        :disabled="isBusy">
        {{selectedResponse}}
      </b-button>
      <font-awesome-layers v-if="selectedResponse==='HOME'" class="text-success fa-3x" @click="nextResponse('NH')">
        <font-awesome-icon icon="check-circle"></font-awesome-icon>
      </font-awesome-layers>
      <font-awesome-layers v-if="selectedResponse==='NH'" class="text-warning fa-3x" @click="nextResponse('START')">
        <font-awesome-icon icon="circle"></font-awesome-icon>
        <font-awesome-layers-text value="NH" class="nh-text text-white font-weight-bold"></font-awesome-layers-text>
      </font-awesome-layers>
    </div>
  </div>
</template>
<script>
import { mapGetters, mapActions } from 'vuex';
import parse from 'date-fns/parse';
import orderBy from 'lodash/orderBy';
import isEqual from 'date-fns/is_equal';
import startOfDay from 'date-fns/start_of_day';

const responses = ['START', 'HOME', 'NH'];

export default {
  name: 'AddressCard',
  props: ['address', 'reset'],
  data() {
    return {
      storageId: `foreignfield-${this.address.id}`,
      selectedResponse: '',
      responseText: '',
      animate: false,
      hideResponseText: false,
    }
  },
  watch: {
    'reset' () {
      this.selectedResponse = responses[0];
    }
  },
  methods: {
    ...mapActions({
      setAddress: 'address/setAddress',
      addLog: 'address/addLog',
      updateLog: 'address/updateLog',
      removeLog: 'address/removeLog',
    }),
    async nextResponse(value) {
      
      this.selectedResponse = value;
      const orderedLogs = orderBy(this.updatedAddress.activityLogs, 'timestamp', 'desc');

      if (orderedLogs && orderedLogs.length) {
        const log = orderedLogs[0];
        const timestamp = parse(log.timestamp);
        const logIsFromToday = isEqual(startOfDay(timestamp), startOfDay(Date()));

        if (logIsFromToday) {
          if (value === 'START') {
            await this.removeLog({ id: log.id, addressId: this.address.id });
          } else {
            await this.updateLog({ id: log.id, addressId: this.address.id, value });
          }

        } else {
          await this.addLog({ addressId: this.address.id, value });
        }
      } else {
        await this.addLog({ addressId: this.address.id, value });
      }
      
    },
  },
  mounted() {
    this.setAddress(this.address);
    this.selectedResponse = this.lastActivity || responses[0];
  },
  computed: {
    ...mapGetters({
      isOwnedByUser: 'territory/isOwnedByUser',
      lastActivity: 'address/lastActivity',
      isBusy: 'address/isBusy',
      updatedAddress: 'address/address',
    }),

    mapsUrl() {
      const addr1 = this.address.addr1 || '';
      const city = this.address.city || '';
      const state = this.address.state_province || '';
      return `https://www.google.com/maps/dir/?api=1&destination=${addr1} ${city} ${state}`;
    }
  }
}
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

