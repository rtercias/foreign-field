<template>
  <div class="row justify-content-between align-items-center pl-2 pr-2">
    <div class="address col-10 pl-0">
      <h5><a :href="mapsUrl" target="_blank">{{address.addr1}}</a>&nbsp;<em>{{address.addr2}}</em></h5>
      <div>
        {{address.city}} {{address.state}} {{address.postalCode}}<br/>
        {{address.notes}}
      </div>
    </div>
    <div class="interaction pr-0">
      <b-button class="pr-0" variant="link" v-if="selectedResponse==='START'" @click="nextResponse('HOME')">{{selectedResponse}}</b-button>
      <!-- <b-button class="p-2" variant="link" v-if="selectedResponse==='HOME'" @click="nextResponse('NH')">{{selectedResponse}}</b-button>
      <b-button class="p-2" variant="link" v-if="selectedResponse==='NH'" @click="nextResponse('START')">{{selectedResponse}}</b-button> -->
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
import getTime from 'date-fns/get_time';

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
    nextResponse(value) {
      this.selectedResponse = value;
      localStorage.setItem(this.storageId, `${this.selectedResponse}-${getTime(new Date())}`);
    },
    getStoredItem() {
      const item = localStorage.getItem(this.storageId);
      if (item) {
        return item.split('-')[0];
      }

      return undefined;
    }
  },
  mounted() {
    this.selectedResponse = this.getStoredItem() || responses[0];
  },
  computed: {
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

