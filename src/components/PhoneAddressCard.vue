<template>
  <div class="mt-2 phone-address-card-container d-flex align-items-center justify-content-center">
    <div class="w-100">
      <div class="d-flex bg-light justify-content-between align-items-center pc-header-font border px-4 py-2 w-100">
        <div class="mb-1">
          <span>{{address.addr1}} {{address.addr2}}&nbsp;</span>
          <span>{{address.city}} {{address.state_province}} {{address.postal_code}}</span>
        </div>
      </div>
      <b-list-group>
        <b-list-group-item class="d-flex">
          <the-mask
            class="form-control mr-2 py-3"
            type="tel"
            :mask="'###-###-####'"
            :masked="false"
            v-model="newPhone">
          </the-mask>
          <b-button variant="success text-white" @click="addNewPhone">
            <font-awesome-icon icon="plus"></font-awesome-icon>
          </b-button>
        </b-list-group-item>
        <swipe-list
          ref="list"
          class="py-2"
          :items="address.phones || []"
          item-key="id"
          @swipeout:click="itemClick"
          @active="closeSwipes">
          <template v-slot="{ item }">
            <PhoneCard :phoneRecord="item" :addressId="item.id"></PhoneCard>
          </template>
          <template v-slot:right="{ }">
            <ActivityButton
              v-for="(button, index) in buttonList"
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
import { TheMask } from 'vue-the-mask';
import { AddressType, AddressStatus } from '../store';
import get from 'lodash/get';

const BUTTON_LIST = ['NA', 'CONFIRMED', 'VM', 'DNC', 'LW'];

export default {
  name: 'PhoneAddressCard',
  props: ['address', 'territoryId', 'group'],
  components: {
    PhoneCard,
    SwipeList,
    ActivityButton,
    TheMask,
  },
  computed: {
    ...mapGetters({
      actionButtonList: 'phone/actionButtonList',
      user: 'auth/user',
      congId: 'auth/congId',
    }),
    buttonList() {
      return this.actionButtonList.filter(b => BUTTON_LIST.includes(b.value));
    },
  },
  data() {
    return {
      enabled: true,
      revealed: {},
      newPhone: '',
    };
  },
  methods: {
    ...mapActions({
      fetchAddress: 'address/fetchAddress',
      addPhone: 'phone/addPhone',
    }),
    closeSwipes() {
      this.$refs.list.closeActions();
    },
    itemClick() {
      this.$refs.list.closeActions();
    },
    async addNewPhone() {
      const sort = get(this.storeAddress, 'phones.length', 0);
      const phone = {
        congregationId: this.congId,
        parent_id: this.address.id,
        territory_id: this.territoryId,
        type: AddressType.Phone,
        status: AddressStatus.Active,
        phone: this.newPhone,
        notes: '',
        sort,
      };

      await this.addPhone(phone);
      this.$emit('new-phone-added', phone);
    },
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
    min-height: 80px;

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
