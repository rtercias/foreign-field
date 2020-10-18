<template>
  <div class="mt-2 phone-address-card-container d-flex align-items-center justify-content-center">
    <div class="w-100">
      <div class="small text-left bg-light py-2 px-4 w-100 h-100">
        <span>{{address.addr1}} {{address.addr2}}&nbsp;</span>
        <span>{{address.city}} {{address.state_province}} {{address.postal_code}}</span>
      </div>
      <b-list-group>
        <swipe-list
          ref="list"
          :items="address.phones || []"
          item-key="id"
          :revealed.sync="revealed"
          @active="onActive">
          <template v-slot="{ item, index, revealed }">
            <PhoneCard
              :class="'h-100'"
              :index="index"
              :phoneRecord="item"
              :addressId="item.id"
              :revealed="revealed"
              @toggle-right-panel="toggleRightPanel"
              @toggle-left-panel="toggleLeftPanel">
            </PhoneCard>
          </template>
          <template v-slot:right="{ }">
            <ActivityButton
              v-for="(button, index) in rightButtonList"
              :key="index"
              class="fa-2x"
              :value="button.value"
              :actionButtonList="actionButtonList"
              >
            </ActivityButton>
          </template>
          <template v-slot:left="{ }">
            <ActivityButton
              v-for="(button, index) in leftButtonList"
              :key="index"
              class="fa-2x"
              :value="button.value"
              :actionButtonList="actionButtonList"
              >
            </ActivityButton>
          </template>
        </swipe-list>
        <b-list-group-item class="d-flex py-3">
          <the-mask
            class="form-control mr-2"
            type="tel"
            :mask="'###-###-####'"
            :masked="false"
            v-model="newPhone">
          </the-mask>
          <b-button variant="success text-white" @click="addNewPhone">
            <font-awesome-icon icon="plus"></font-awesome-icon>
          </b-button>
        </b-list-group-item>
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

const RIGHT_BUTTON_LIST = ['NA', 'CONFIRMED', 'VM', 'LW'];
const LEFT_BUTTON_LIST = ['REMOVE', 'DNC', 'INVALID'];

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
    rightButtonList() {
      return this.actionButtonList.filter(b => RIGHT_BUTTON_LIST.includes(b.value));
    },
    leftButtonList() {
      return this.actionButtonList.filter(b => LEFT_BUTTON_LIST.includes(b.value));
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
    onActive() {
      this.$refs.list.closeActions();
    },
    toggleRightPanel(index, revealed) {
      if (revealed) {
        this.$refs.list.closeActions(index);
      } else {
        this.$refs.list.closeActions();
        this.$refs.list.revealRight(index);
      }
    },
    toggleLeftPanel(index, revealed) {
      if (revealed) {
        this.$refs.list.closeActions(index);
      } else {
        this.$refs.list.closeActions();
        this.$refs.list.revealLeft(index);
      }
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
.nh-text {
  font-size: 0.5em;
}
.swipeout-left, .swipeout-right {
  .interaction:nth-child(even) {
    opacity: 0.9;
  }
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
