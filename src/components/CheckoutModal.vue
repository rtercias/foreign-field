<template>
  <b-modal
    :id="`checkoutModal-${territory.id}`"
    :title="`Territory ${task}: ${territory.name}`"
    @shown="clearName"
    @ok="checkoutOrReassign">
    <b-alert class="text-left" show variant="danger" v-show="status === 'Recently Worked'">
      This was just done. Check out again?
    </b-alert>
    <label class="pr-2">To:</label>
    <b-dropdown class="publishers-list" right variant="outline-primary">
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
  props: ['territory', 'isReassign'],
  data() {
    return {
      selectedPublisher: { name: 'me' },
    };
  },

  methods: {
    ...mapActions({
      checkoutTerritory: 'territory/checkoutTerritory',
      reassignCheckout: 'territory/reassignCheckout',
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
        publisher: this.selectedPublisher,
        username: this.user.username,
      });

      this.$router.push(`/territories/${this.territory.id}`);
    },

    async reassign() {
      await this.reassignCheckout({
        checkoutId: this.territory.status.checkout_id,
        publisher: this.selectedPublisher,
        username: this.user.username,
      });

      this.$router.push(`/territories/${this.territory.id}`);
    },

    async checkoutOrReassign() {
      if (this.isReassign) {
        await this.reassign();
      } else {
        await this.checkout();
      }
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
    task() {
      return this.status === 'Checked Out' ? 'Re-assign' : 'Check Out';
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
