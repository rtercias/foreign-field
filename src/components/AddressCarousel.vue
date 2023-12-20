<template>
  <div>
    <div class="d-flex justify-content-between bg-light">
      <b-button
        variant="link"
        class="previous d-flex align-items-center"
        :to="previousAddress"
        :disabled="previousAddress === $route.path"
      >
        <font-awesome-icon icon="chevron-left" />
        <span class="pl-2">Previous</span>
      </b-button>
      <b-button
        variant="link"
        class="next d-flex align-items-center"
        :to="nextAddress"
        :disabled="nextAddress === $route.path"
      >
        <span class="pr-2">Next</span>
        <font-awesome-icon icon="chevron-right" />
      </b-button>
    </div>
    <div @touchstart="touchStart">
      <AddressCard
        :addressId="addressId"
        :territoryId="territoryId"
        :address="address"
      />
    </div>
  </div>
</template>
<script>
import AddressCard from './AddressCard';
import { mapGetters } from 'vuex';
import get from 'lodash/get';

export default {
  props: ['addressId', 'territoryId'],
  components: {
    AddressCard,
  },
  data: () => ({
    swipeThreshold: 10,
  }),
  mounted() {
    // document.scrollTop = 0;
  },
  computed: {
    ...mapGetters({
      territory: 'territory/territory',
    }),
    address() {
      return this.territory.addresses.find(a => a.id === this.addressId);
    },
    previousAddress() {
      const addresses = get(this.territory, 'addresses');
      const index = addresses.findIndex(a => a.id === this.addressId);
      if (index <= 0) return this.$route.path;
      const prevIndex = addresses[index - 1].id;
      return `/territories/${this.territoryId}/addresses/${prevIndex}`;
    },
    nextAddress() {
      const addresses = get(this.territory, 'addresses');
      const index = addresses.findIndex(a => a.id === this.addressId);
      if (index + 1 >= addresses.length) return this.$route.path;
      const nextIndex = addresses[index + 1].id;
      return `/territories/${this.territoryId}/addresses/${nextIndex}`;
    },
  },
  methods: {
    touchStart(touchEvent) {
      if (touchEvent.changedTouches.length !== 1) { // We only care if one finger is used
        return;
      }
      const posXStart = touchEvent.changedTouches[0].screenX;
      window.addEventListener(
        'touchmove',
        e => this.touchMove(e), { once: true }
      );
      window.addEventListener(
        'touchend',
        e => this.touchEnd(e, posXStart), { once: true }
      );
    },
    touchMove(touchEvent) {
      this.posXEnd = touchEvent.changedTouches[0].screenX;
    },
    touchEnd(touchEvent, posXStart) {
      if (touchEvent.changedTouches.length !== 1) { // We only care if one finger is used
        return;
      }
      const distX = this.posXEnd - posXStart;
      const isSwipe = Math.abs(distX) >= this.swipeThreshold;
      const swipeDir = distX < 0 ? 'left' : 'right';
      if (isSwipe) {
        if (swipeDir === 'right' && this.previousAddress !== this.$route.path) {
          this.$router.push(this.previousAddress);
        } else if (swipeDir === 'left' && this.nextAddress !== this.$route.path) {
          this.$router.push(this.nextAddress);
        }
      }
      // document.scrollTop = 0;
    },
  },
};
</script>
<style scoped lang="scss">
</style>
