<template>
  <div class="phone-address-card-container p-2 d-flex align-items-center">
    <div class="w-100">
      <div class="phone-address-card row justify-content-between align-items-start pr-2 text-black-50">
        <div class="address col-9 flex-column pt-2 pb-4">
          <div>
            <div class="mb-1">
              <span>{{address.addr1}} {{address.addr2}}&nbsp;</span>
              <span>{{address.city}} {{address.state_province}} {{address.postal_code}}</span>
            </div>
            <b-button variant="success" :to="`/phones/phone-add`">
              <font-awesome-icon icon="plus"></font-awesome-icon> New Phone
            </b-button>
            <PhoneCard :phoneRecord="address" :addressId="address.id"></PhoneCard>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import PhoneCard from './PhoneCard';

export default {
  name: 'PhoneAddressCard',
  props: ['address', 'territoryId', 'group'],
  components: {
    PhoneCard,
  },
};
</script>
<style scoped>
.v-touch-address-card {
  touch-action: pan-y;
  height: 100%;
}
.address-card {
  display: flex;
  flex-direction: row;
  overflow: hidden;
  position: relative;
  transition: ease-in-out 0.3s  ;
  min-height: 60px;
}
.address {
  display: flex;
  text-align: left;
}
.nh-text {
  font-size: 0.5em;
}
.ellipsis-v, .ellipsis-v-static {
  cursor: pointer;
}
.static-buttons {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.selected-response {
  width: 60px;
  height: 40px;
  border-radius: 50%;
}
.selected-response.faded {
  opacity: 0.6;
}
.last-activity {
  font-size: small;
  position: relative;
  bottom: 2px;
}
.logging-spinner {
  font-size: 30px;
  position: absolute;
  right: 21px;
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
