<template>
  <div class="m-0 phone-address-card d-flex align-items-center justify-content-center">
    <div class="w-100">
      <div class="text-left bg-light py-2 px-4 w-100 h-100 d-flex align-items-center overflow-hidden">
        <b-link
          class="w-100"
          :to="`/territories/${territory.group_code}/${territory.id}/addresses/${address.id}/detail?origin=phone`">
          <span class="address d-block w-100">{{address.addr1}} {{address.addr2}}&nbsp;
          {{address.city}} {{address.state_province}} {{address.postal_code}}</span>
        </b-link>
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
              v-if="!item.editMode"
              class="h-100"
              :class="isActiveAddress(item.id) ? ['bg-white border-warning border-medium', 'active'] : []"
              :index="index"
              :phoneRecord="item"
              :address="address"
              :revealed="revealed"
              :incomingResponse="item.lastActivity"
              @update-response="updateResponse"
              @toggle-right-panel="toggleRightPanel"
              @toggle-left-panel="toggleLeftPanel">
            </PhoneCard>
            <b-list-group-item v-else class="d-flex py-4 border-0">
              <the-mask
                class="form-control mr-2"
                type="tel"
                :mask="'###-###-####'"
                :masked="false"
                v-model="item.phone"
                @mousedown.native="onActive">
              </the-mask>
              <b-button variant="white" class="cancel text-danger position-absolute" @click="() => cancel(item)">
                <font-awesome-icon icon="times"></font-awesome-icon>
              </b-button>
              <b-button class="ml-1 text-primary" variant="light" @click="() => update(item)">
                <font-awesome-icon v-if="item.isBusy" icon="circle-notch" spin></font-awesome-icon>
                <font-awesome-icon v-else icon="save"></font-awesome-icon>
              </b-button>
            </b-list-group-item>
          </template>
          <template v-slot:right="{ item, close }">
            <font-awesome-icon v-if="item.isBusy" icon="circle-notch" spin></font-awesome-icon>
            <ActivityButton
              v-for="(button, index) in rightButtonList"
              :key="index"
              class="fa-2x"
              :value="button.value"
              :is-busy="item.isBusy"
              :actionButtonList="actionButtonList"
              @button-click="() => updateResponse(item, button.value, close)">
            </ActivityButton>
          </template>
          <template v-slot:left="{ item, close }">
            <font-awesome-icon v-show="item.isBusy" icon="circle-notch" spin></font-awesome-icon>
            <div
              v-show="!item.isBusy"
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
              v-show="!item.isBusy"
              v-for="(button, index) in leftButtonList"
              :key="index"
              class="fa-2x"
              :value="button.value"
              :actionButtonList="actionButtonList"
              :is-busy="item.isBusy"
              @button-click="(value, button) => applyTag(item, button, close)">
            </ActivityButton>
          </template>
        </swipe-list>
        <b-list-group-item class="d-flex mx-1 p-2 border-0">
          <the-mask
            class="form-control mr-2 phone-input w-100"
            type="tel"
            :mask="'###-###-####'"
            :masked="false"
            v-model="newPhone"
            @mousedown.native="onActive">
          </the-mask>
          <b-button class="text-primary" variant="light" @click="addNewPhone">
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
import { REJECT_TAGS } from '../store/modules/phone';

const RIGHT_BUTTON_LIST = ['NA', 'CT', 'VM', 'LW'];
const LEFT_BUTTON_LIST = ['do not call', 'invalid', 'confirmed'];

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
      phone: 'phone/phone',
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
      updateAddress: 'address/updateAddress',
    }),
    onActive() {
      const phoneEditing = this.address.phones.find(p => p.editMode);
      if (phoneEditing) this.$set(phoneEditing, 'editMode', false);
      this.$refs.list.closeActions();
    },
    isActiveAddress(id) {
      return this.territory.lastActivity ? id === this.territory.lastActivity.address_id : false;
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
      this.address.phones.push(this.phone);
      this.newPhone = '';
      this.isAddressBusy = false;
    },
    cancel(phone) {
      this.$set(phone, 'editMode', false);
    },
    async update(phone) {
      this.$set(phone, 'isBusy', true);
      await this.updatePhone(phone);
      this.$set(phone, 'editMode', false);
      this.$set(phone, 'isBusy', false);
    },
    async removePhone(phone) {
      this.$set(phone, 'isBusy', true);
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
      this.$set(phone, 'isBusy', false);
    },
    formatPhone(phone) {
      return phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
    },
    getRejectTag(phone) {
      return phone.notes.split(',').find(n => REJECT_TAGS.includes(n));
    },
    async updateResponse(phone, _value, close) {
      let value = _value;
      this.setPhone(phone);
      if (phone.selectedResponse === 'START' && value === 'START') {
        this.$set(phone, 'isBusy', false);
        if (typeof close === 'function') close();
        return;
      }
      if (!this.rightButtonList.some(b => b.value === value)) {
        value = 'START';
      }

      try {
        this.$set(phone, 'isBusy', true);
        await this.addLog({ entityId: phone.id, value });
        await this.fetchPhone(phone.id);
        const timestamp = Date.now();

        this.$set(phone, 'selectedResponse', value);
        this.$set(phone, 'selectedResponseTS', timestamp);
        this.$set(phone, 'lastActivity', {
          publisher_id: this.user.id,
          address_id: phone.id,
          timestamp,
          value,
        });

        this.$set(this.territory, 'lastActivity', phone.lastActivity);
        this.$set(phone, 'isBusy', false);
        if (typeof close === 'function') close();
      } catch (e) {
        console.error('Unable to save activity log', e);
      }
    },
    async applyTag(phone, item, close) {
      const newTag = item.description.toLowerCase();
      this.$set(phone, 'isBusy', true);
      try {
        const exclusiveTags = [...REJECT_TAGS, 'confirmed'];
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

        let confirm = true;
        if (newTag === 'confirmed') {
          confirm = await this.$bvModal.msgBoxConfirm(
            'Add "confirmed" tag? This will also update the address phone number.', {
              title: 'Confirm Phone Number',
              centered: true,
            }
          );
        }

        if (!confirm) {
          this.$set(phone, 'isBusy', false);
          return;
        }

        // add new tag
        await this.addTag({ phoneId: phone.id, userid: this.user.id, tag: newTag });
        newArray.push(newTag);

        // update address
        if (newTag === 'confirmed') {
          await this.updateAddressPhone(phone.phone);
        }

        // update UI model
        const updatedNotes = newArray.join(',');
        this.$set(model, 'notes', `${updatedNotes}`);
        this.$set(phone, 'isBusy', false);
        if (typeof close === 'function') close();
      } catch (e) {
        console.error('Unable to apply tag', e);
      }
    },
    async updateAddressPhone(phoneNumber) {
      this.$set(this.address, 'phone', phoneNumber);
      await this.updateAddress(this.address);
    },
  },
};
</script>
<style lang="scss" scoped>
@import "../assets/foreign-field-theme.scss";
.phone-address-card {
  .list-group {
    .swipeout.swipeout-list-item {
      width: 100%;
    }
  }
}
.address {
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow-x: hidden;
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
.cancel {
  right: 0;
  margin-right: 74px;
}
.list-group {
  display: block;
  width: 100%;
  .swipeout-list-item {
    border-top: 1px solid $secondary;
    border-bottom: 1px solid $secondary;
    min-height: 80px;
  }
}
@media (max-width: 768px) {
  .phone-address-card-container {
    width: 100%;
  }
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
