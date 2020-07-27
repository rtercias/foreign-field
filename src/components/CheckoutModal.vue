<template>
  <b-modal id="checkoutModal" :title="`Territory Checkout ${territory.id}`" @shown="clearName" @ok="checkout">
    <b-alert class="text-left" show variant="danger" v-show="status === 'Recently Worked'">
      This was just done. Check out again?
    </b-alert>
    <label>To:&nbsp;</label>
    <b-dropdown class="publishers-list" right variant="outline-secondary">
        <span slot="button-content">{{selectedPublisher.name || 'Select Publisher'}}</span>
        <b-dropdown-item v-for="pub in publishers" v-bind:key="pub.id" @click="selectPublisher(pub)">
          {{pub.lastname}}, {{pub.firstname}}
        </b-dropdown-item>
      </b-dropdown>
  </b-modal>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';

export default {
  name: 'CheckoutModal',
  props: ['territory', 'fetch'],
  data() {
    return {
      selectedPublisher: { name: 'me' },
      group: this.$route.params.group,
    };
  },

  methods: {
    ...mapActions({
      fetchPublishers: 'publishers/fetchPublishers',
      checkoutTerritory: 'territory/checkoutTerritory',
    }),

    selectPublisher(publisher) {
      this.selectedPublisher = {
        ...publisher,
        name: `${publisher.firstname} ${publisher.lastname}`,
      };
    },

    clearName() {
      this.selectedPublisher = {};
    },

    async checkout() {
      await this.checkoutTerritory({
        territoryId: this.territory.id,
        userId: this.selectedPublisher.id,
        username: this.user.username,
      });

      this.$router.push(`/territories/${this.group}/${this.territory.id}`);
    },
  },

  computed: {
    ...mapGetters({
      congId: 'auth/congId',
      user: 'auth/user',
      publishers: 'publishers/publishers',
    }),
    status() {
      return this.territory && this.territory.status ? this.territory.status.status : '';
    },
  },
};
</script>

<style>
  .publishers-list .dropdown-menu {
    height: 31rem;
    overflow-y: auto;
  }
</style>
