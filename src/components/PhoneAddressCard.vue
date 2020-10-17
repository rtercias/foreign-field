<template>
  <div class="mt-2 phone-address-card-container d-flex align-items-center justify-content-center">
    <div class="w-100">
      <div class="d-flex justify-content-between align-items-center pc-header-font border px-4 py-2 w-100">
        <div class="mb-1">
          <span>{{address.addr1}} {{address.addr2}}&nbsp;</span>
          <span>{{address.city}} {{address.state_province}} {{address.postal_code}}</span>
        </div>
        <b-button variant="success text-white pc-header-font"
          :to="`/territories/${group}/${territoryId}/addresses/${address.id}/phones/phone-add`">
          Add Number
        </b-button>
      </div>
      <b-list-group>
        <swipe-list
          ref="list"
          class=""
          :items="storeAddress.phones || []"
          item-key="id"
          @active="closeSwipes">
          <template v-slot="{ item }">
            <PhoneCard :phoneRecord="item" :addressId="item.id"></PhoneCard>
          </template>
          <template v-slot:right="{ }">
            <ActivityButton
              v-for="(button, index) in actionButtonList"
              :key="index"
              class="fa-2x"
              :value="button.value"
              :actionButtonList="actionButtonList"
              >
            </ActivityButton>
          </template>
        </swipe-list>
      </b-list-group>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import PhoneCard from './PhoneCard';
import { SwipeList } from 'vue-swipe-actions';
import ActivityButton from './ActivityButton';

export default {
  name: 'PhoneAddressCard',
  props: ['address', 'territoryId', 'group'],
  components: {
    PhoneCard,
    SwipeList,
    ActivityButton,
  },
  computed: {
    ...mapGetters({
      actionButtonList: 'phone/actionButtonList',
      phones: 'phones/phones',
      storeAddress: 'address/address',
    }) },
  data() {
    return {
      enabled: true,
      revealed: {},
    };
  },
  methods: {
    ...mapActions({
      fetchAddress: 'address/fetchAddress',
    }),
    closeSwipes() {
      this.$refs.list.closeActions();
    },
  },
  async mounted() {
    await this.fetchAddress(this.address.id);
  },
};
</script>
<style scoped lang="scss">
@import "../assets/foreign-field-theme.scss";
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
.pc-header-font {
    font-size:.8rem;
}
@media print {
  .interaction {
    display: none;
  }
  .address a {
    text-decoration: none;
  }
}
.list-group {
  display: block;
    width: 100%;
  .swipeout-list-item {
    border-top: 1px solid $secondary;
    border-bottom: 1px solid $secondary;

    .border-medium {
      border-style: solid;
      border-width: medium;
    }
  }
}
@media (min-width: 769px) {
  .list-group {
    .swipeout-list {
      display: flex;
      flex-wrap: wrap;
      flex-direction: row;
      padding: 5px;
      .swipeout-list-item {
        width: 49%;
        flex: auto;
        margin: 5px;
        border: 1px solid $secondary;
      }
    }
  }
}
</style>
