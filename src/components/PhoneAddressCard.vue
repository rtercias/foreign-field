<template>
  <div class="mt-2 phone-address-card-container d-flex align-items-center justify-content-center">
    <div class="w-100">
      <div class="small text-left bg-light py-2 px-4 w-100 h-100 d-flex align-items-center">
        <span class="address">{{address.addr1}} {{address.addr2}}&nbsp;
        {{address.city}} {{address.state_province}} {{address.postal_code}}</span>
        <font-awesome-icon class="text-info fa-2x" icon="circle-notch" spin v-if="isAddressBusy"></font-awesome-icon>
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
              :incomingResponse="item.incomingResponse"
              @update-response="updateResponse"
              @toggle-right-panel="toggleRightPanel"
              @toggle-left-panel="toggleLeftPanel">
            </PhoneCard>
          </template>
          <template v-slot:right="{ item, close }">
            <ActivityButton
              v-for="(button, index) in rightButtonList"
              :key="index"
              class="fa-2x"
              :value="button.value"
              :actionButtonList="actionButtonList"
              @button-click="() => updateResponse(item, button.value, close)">
            </ActivityButton>
          </template>
          <template v-slot:left="{ item, close }">
            <div
              class="interaction fa-2x d-flex flex-column justify-content-center align-items-center pl-3 pr-3 bg-danger">
              <span class="pl-0">
                <font-awesome-layers
                  class="remove-number text-white fa-fw"
                  @click="() => removePhone(item)">
                  <font-awesome-icon icon="trash-alt"></font-awesome-icon>
                </font-awesome-layers>
              </span>
              <span class="description text-white">Remove</span>
            </div>
            <ActivityButton
              v-for="(button, index) in leftButtonList"
              :key="index"
              class="fa-2x"
              :value="button.value"
              :actionButtonList="actionButtonList"
              @button-click="(value, button) => applyTag(item, button, close)"
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
            v-model="newPhone"
            @mousedown.native="onActive">
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

const RIGHT_BUTTON_LIST = ['NA', 'CNFRM', 'VM', 'LW'];
const LEFT_BUTTON_LIST = ['DNC', 'INVLD'];

export default {
  name: 'PhoneAddressCard',
  props: ['address', 'territory'],
  components: {
    PhoneCard,
    SwipeList,
    ActivityButton,
    TheMask,
  },
  data() {
    return {
      enabled: true,
      revealed: {},
      newPhone: '',
      isAddressBusy: false,
    };
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
  methods: {
    ...mapActions({
      fetchPhone: 'phone/fetchPhone',
      addPhone: 'phone/addPhone',
      updatePhone: 'phone/updatePhone',
      setPhone: 'phone/setPhone',
      addTag: 'phone/addTag',
      removeTag: 'phone/removeTag',
      addLog: 'address/addLog',
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
      if (!this.newPhone) return;

      this.isAddressBusy = true;
      const sort = get(this.storeAddress, 'phones.length', 0);
      const phone = {
        congregationId: this.congId,
        parent_id: this.address.id,
        territory_id: this.territory.id,
        type: AddressType.Phone,
        status: AddressStatus.Active,
        phone: this.newPhone,
        notes: '',
        sort,
      };

      await this.addPhone(phone);
      this.address.phones.push(phone);
      this.newPhone = '';
      this.isAddressBusy = false;
    },
    async removePhone(phone) {
      const response = await this.$bvModal.msgBoxConfirm(
        `Remove "${this.formatPhone(phone.phone)}" from the list?`, {
          title: 'Remove Phone',
          centered: true,
        }
      );

      if (response) {
        this.isAddressBusy = true;
        await this.updatePhone({ ...phone, status: AddressStatus.Inactive });
        const index = this.address.phones.findIndex(p => p.id === phone.id);
        this.address.phones.splice(index, 1);
        this.isAddressBusy = false;
      }
    },
    formatPhone(phone) {
      return phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
    },
    async updateResponse(phone, _value, close) {
      let value = _value;
      this.setPhone(phone);

      if (phone.selectedResponse === 'START' && value === 'START') return;

      if (!this.rightButtonList.some(b => b.value === value)) {
        value = 'START';
      }

      try {
        await this.addLog({ entityId: phone.id, value });
        await this.fetchPhone(phone.id);
        const updatedPhone = this.address.phones.find(p => p.id === phone.id);
        const timestamp = Date.now();

        this.$set(updatedPhone, 'selectedResponse', value);
        this.$set(updatedPhone, 'selectedResponseTS', timestamp);
        this.$set(updatedPhone, 'lastActivity', {
          publisher_id: this.user.id,
          address_id: this.address.id,
          timestamp,
          value,
        });

        this.$set(this.territory, 'lastActivity', updatedPhone.lastActivity);
        if (typeof close === 'function') close();
      } catch (e) {
        console.error('Unable to save activity log', e);
      }
    },
    async applyTag(phone, item, close) {
      const exclusiveTags = ['invalid', 'do not call'];
      const newTag = item.description.toLowerCase();

      try {
        const model = this.address.phones.find(p => p.id === phone.id);
        const oldArray = model.notes ? model.notes.split(',') : [];
        let newArray = [...oldArray];

        if (exclusiveTags.includes(newTag)) {
          // if new tag is exclusive, then remove all other exclusive tags
          for (const tag of exclusiveTags) {
            await this.removeTag({ phoneId: phone.id, userid: this.user.id, tag });
          }
          newArray = oldArray.filter(a => !exclusiveTags.includes(a));
        }

        // add new tag
        await this.addTag({ phoneId: phone.id, userid: this.user.id, tag: newTag });
        newArray.push(newTag);

        // update model
        const updatedNotes = newArray.join(',');
        this.$set(model, 'notes', `${updatedNotes}`);
        if (typeof close === 'function') close();
      } catch (e) {
        console.error('Unable to apply tag', e);
      }
    },
  },
};
</script>
<style scoped lang="scss">
@import "../assets/foreign-field-theme.scss";
.address {
  text-overflow: ellipsis;
  overflow-x: hidden;
  white-space: nowrap;
}
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
.pc-header-font {
    font-size:.8rem;
}
.description {
  font-size: 7pt;
  white-space: nowrap;
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
