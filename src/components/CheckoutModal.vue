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
      <b-dropdown-item v-for="pub in activePublishers" v-bind:key="pub.id" @click="selectPublisher(pub)">
        {{pub.lastname}}, {{pub.firstname}}
      </b-dropdown-item>
    </b-dropdown>
    <b-checkbox class="pt-4 text-right" v-model="goToTerritory" @change="remember">
      Go to territory after checkout
    </b-checkbox>
    <template #modal-footer="{ ok, cancel }">
    <!-- Button with custom close trigger value -->
    <b-button variant="light" @click="unassign(cancel)" v-if="status === 'Checked Out'">
        Unassign
      </b-button>
      <b-button variant="secondary" @click="cancel">
        Cancel
      </b-button>
      <b-button variant="primary" @click="ok">
        OK
      </b-button>
    </template>
  </b-modal>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import get from 'lodash/get';

export default {
  name: 'CheckoutModal',
  props: ['territory', 'isReassign'],
  data() {
    return {
      selectedPublisher: { name: 'me' },
      goToTerritory: true,
    };
  },

  updated() {
    const redirect = sessionStorage.getItem('goToTerritory');
    if (redirect === 'true' || redirect === 'false') {
      this.goToTerritory = redirect === 'true';
    } else {
      this.goToTerritory = get(this.congregation, 'options.territory.redirectAfterCheckout');
    }
  },

  methods: {
    ...mapActions({
      checkoutTerritory: 'territory/checkoutTerritory',
      reassignCheckout: 'territory/reassignCheckout',
      unassignCheckout: 'territory/unassignCheckout',
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
      try {
        await this.checkoutTerritory({
          territoryId: this.territory.id,
          publisher: this.selectedPublisher,
          username: this.user.username,
          date: Date.now(),
        });

        if (this.goToTerritory) {
          this.$router.push(`/territories/${this.territory.id}`);
        }
      } catch (e) {
        await this.$bvModal.msgBoxOk(this.checkoutError, {
          title: 'Unable to checkout',
          centered: true,
          okTitle: 'Refresh',
        });
        this.$router.go();
      }
    },

    async reassign() {
      await this.reassignCheckout({
        checkoutId: this.territory.status.checkout_id,
        territoryId: this.territory.id,
        publisher: this.selectedPublisher,
        username: this.user.username,
        date: this.territory.status.date,
      });
    },

    async checkoutOrReassign() {
      if (this.isReassign) {
        await this.reassign();
      } else {
        await this.checkout();
      }
    },

    async unassign(cancel) {
      this.unassignCheckout({ checkoutId: this.territory.status.checkout_id, territoryId: this.territory.id });
      cancel();
    },

    remember(val) {
      sessionStorage.setItem('goToTerritory', val);
    },
  },

  computed: {
    ...mapGetters({
      congId: 'auth/congId',
      congregation: 'congregation/congregation',
      user: 'auth/user',
      publishers: 'publishers/publishers',
      checkoutError: 'territory/error',
    }),
    status() {
      return this.territory && this.territory.status ? this.territory.status.status : '';
    },
    task() {
      return this.status === 'Checked Out' ? 'Re-assign' : 'Check Out';
    },
    activePublishers() {
      return this.publishers.filter(p => !!p.status);
    },
  },
};
</script>

<style lang="scss">
  .publishers-list {
    .dropdown-menu {
      height: 31rem;
      overflow-y: auto;
    }
    li {
      display: block;
    }
  }
</style>
