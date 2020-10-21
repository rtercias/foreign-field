<template>
  <div class="phone-witnessing">
    <Loading v-if="isLoading"></Loading>
    <PhoneAddressCard
      v-else
      v-for="a in territory.addresses" :key="a.id"
      :class="isActiveAddress(a.id) ? ['bg-white border-warning border-medium', 'active'] : []"
      :address="a"
      :territory="territory">
    </PhoneAddressCard>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import differenceInDays from 'date-fns/differenceInDays';
import orderBy from 'lodash/orderBy';
import get from 'lodash/get';
import PhoneAddressCard from './PhoneAddressCard';
import Loading from './Loading.vue';
import { channel } from '../main';

const BUTTON_LIST = ['NH', 'HOME', 'PH', 'LW'];
export default {
  name: 'PhoneWitnessing',
  components: {
    PhoneAddressCard,
    Loading,
  },
  props: ['group', 'id'],
  async mounted() {
    channel.bind('add-log', async (log) => {
      if (this.territory && this.territory.addresses) {
        const address = this.territory.addresses.find(a => a.id === log.parent_id);
        if (address) {
          const id = log.address_id;
          const phone = address.phones.find(p => p.id === id);
          if (phone) {
            this.$set(phone, 'incomingResponse', log.value);
            this.$set(phone, 'lastActivity', log);
          }
        }
      }
    });
    if (this.canCheckout) {
      this.setLeftNavRoute(`/territories/${this.group}`);
    } else {
      this.setLeftNavRoute('/');
    }
    await this.loadTerritory();
  },
  data() {
    return {
      isLoading: true,
      reset: false,
      workInProgress: {},
    };
  },
  computed: {
    ...mapGetters({
      territory: 'territory/territory',
      user: 'auth/user',
      token: 'auth/token',
      authLoading: 'auth/loading',
      canCheckout: 'auth/canCheckout',
      phone: 'phone/phone',
    }),
    lastActivity() {
      return this.territory.lastActivity;
    },
    containerButtonList() {
      return this.actionButtonList.filter(b => BUTTON_LIST.includes(b.value));
    },
  },
  methods: {
    ...mapActions({
      getTerritory: 'territory/getTerritory',
      resetNHRecords: 'territory/resetNHRecords',
      setLeftNavRoute: 'auth/setLeftNavRoute',
      fetchPhone: 'phone/fetchPhone',
    }),
    isActiveAddress(addressId) {
      return this.lastActivity ? addressId === this.lastActivity.address_id : false;
    },
    seenTerritories() {
      let seenTerritories = [];
      if (localStorage.getItem('seenTerritories')) {
        try {
          seenTerritories = JSON.parse(localStorage.getItem('seenTerritories'));
        } catch (e) {
          localStorage.removeItem('seenTerritories');
        }
      }
      return seenTerritories;
    },
    saveSeenTerritory() {
      // create a basic territory and save it to localstorage
      const city = Array.isArray(this.territory.city) && this.territory.city.length ? this.territory.city.split(',')[0] : '';
      const basicTerritory = {
        name: this.territory.name,
        city,
        group_code: this.territory.group_code,
        id: this.territory.id,
        lastVisited: (new Date()).toISOString(),
      };
      let seenList = this.seenTerritories();
      const idx = seenList.findIndex(terr => terr.id === this.territory.id);
      if (idx >= 0) {
        seenList.splice(idx, 1, basicTerritory);
      } else {
        seenList.push(basicTerritory);
      }
      // filter out old ones
      seenList = seenList.filter(terr => differenceInDays(new Date(), new Date(terr.lastVisited)) < 60);
      seenList = orderBy(seenList, 'lastVisited', 'desc');
      seenList.length = seenList.length <= 5 ? seenList.length : 5;
      const parsed = JSON.stringify(seenList);
      localStorage.setItem('seenTerritories', parsed);
    },
    async loadTerritory() {
      if (this.token) {
        await this.getTerritory(this.id);
        this.saveSeenTerritory();
      }
      this.isLoading = false;
    },
    isTerritoryCheckedOut() {
      return get(this.territory, 'status.status') === 'Checked Out';
    },
  },
  watch: {
    async token() {
      this.isLoading = true;
      await this.loadTerritory();
    },
    immediate: true,
  },
};
</script>

<style lang="scss">
@import "../assets/foreign-field-theme.scss";
.columns {
  columns: 1;
}
.columns > [class*="col-"] {
    -webkit-column-break-inside: avoid;
    page-break-inside: avoid;
    break-inside: avoid;
    width: 100%;
    float: none;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
.add-new {
  font-size: 24px;
}
@media print {
  .columns {
    columns: 2;
  }
}
</style>
