<template>
  <div>
    <div class="lead pt-3">Do Not Call Report</div>
    <div class="w-100 justify-content-center pb-3">
      <font-awesome-icon icon="spinner" v-if="loading"></font-awesome-icon>
    </div>
    <b-list-group class="d-flex flex-row flex-wrap">
      <b-list-group-item class="col-md-6 col-sm-12" v-for="address in addresses" :key="address.id">
        <div class="text-left d-flex justify-content-between align-items-center">
          <b-link :to="link(address)">
            <div>{{address.addr1}} {{address.addr2}}</div>
            <div>{{address.city}}, {{address.state_province}} {{address.postal_code}}</div>
            <b-badge variant="danger" class="text-lowercase">
              {{dncTag(address.notes)}}
            </b-badge>
          </b-link>
        </div>
      </b-list-group-item>
    </b-list-group>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import get from 'lodash/get';
import toLower from 'lodash/toLower';
import orderBy from 'lodash/orderBy';
import { DNC_TAG } from '../utils/tags';

export default {
  name: 'DNCReport',
  props: ['congregationId'],
  data() {
    return {
      loading: false,
    };
  },
  computed: {
    ...mapGetters({
      user: 'auth/user',
      dnc: 'addresses/dnc',
      congregation: 'congregation/congregation',
    }),
    addresses() {
      const list = this.dnc
        .filter(addr => !get(addr, 'territory.name', '').includes('TEST'))
        .map(addr => ({ ...addr, dueDate: this.dueDate(this.dncTag(addr.notes)) }));

      return orderBy(list, addr => addr.dueDate);
    },
  },
  methods: {
    ...mapActions({
      getDnc: 'addresses/getDnc',
    }),
    link(address) {
      return `/territories/${address.territory_id}/addresses/${address.id}/edit`;
    },
    dncTag(notes = '') {
      const tags = notes.split(',') || [];
      return tags.find(t => toLower(t).includes(toLower(DNC_TAG))) || '';
    },
    dueDate(tag) {
      const arr = toLower(tag).split(' until ') || [];
      const hasDate = arr.length;
      return hasDate ? Date.parse(arr[1]) : 0;
    },
  },
  async mounted() {
    await this.getDnc({ id: this.congregationId });
  },
  watch: {
    user() {
      if (this.user && this.user.congregation.id !== this.congregationId) {
        this.$router.replace('/unauthorized');
      }
    },
  },
};
</script>

<style scoped>
  .search {
    font-size: 23px;
  }
</style>
