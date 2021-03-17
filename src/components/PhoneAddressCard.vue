<template>
  <div
    class="phone-address-card d-flex align-items-baseline"
    :class="{ 'm-0 p-2 pb-3': !disabled && mode === 'phone-list' }">
    <div
      :class="isLastRecordAndOdd && isDesktop ? 'w-50 border-right border' : 'w-100'">
      <b-list-group>
        <swipe-list
          ref="list"
          :items="combinedAddressAndPhones || []"
          item-key="id"
          :revealed.sync="revealed"
          @active="onActive">
          <template v-slot="{ item, index, revealed }">
            <AddressCard
              v-if="item.type === 'Regular'"
              mode="phoneAddress"
              :index="index"
              :class="{
                'border-warning active': isActiveAddress(item.id),
                'bg-light border-right-0 border-left-0': mode === 'phone-list',
              }"
              :address="item"
              :territoryId="territory.id"
              :incomingResponse="item.lastActivity"
              :revealed="revealed"
              @update-response="updateResponse"
              @toggle-right-panel="toggleRightPanel"
              @toggle-left-panel="toggleLeftPanel">
            </AddressCard>
            <PhoneCard
              v-else-if="!item.editMode && item.type === 'Phone'"
              class="h-100 border"
              :class="isActiveAddress(item.id) ? ['bg-white border-warning border-medium', 'active'] : []"
              :index="index"
              :phoneRecord="item"
              :address="address"
              :revealed="revealed"
              :incomingResponse="item.lastActivity"
              :disabled="disabled"
              @update-response="updateResponse"
              @toggle-right-panel="toggleRightPanel"
              @toggle-left-panel="toggleLeftPanel"
              @edit-phone="editPhone">
            </PhoneCard>
            <b-list-group-item v-else class="d-flex py-4 border-0">
              <the-mask
                class="form-control mr-2"
                type="tel"
                :mask="'###-###-####'"
                :masked="false"
                v-model="item.phone">
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
          <template v-slot:right="{ item, close }" :disabled="true">
            <font-awesome-icon v-if="item.isBusy" icon="circle-notch" spin></font-awesome-icon>
            <ActivityButton
              v-for="(button, index) in rightButtonList(item)"
              :key="index"
              :value="button.value"
              :actionButtonList="actionButtonList(item.type)"
              :slashed="button.slashed"
              :disabled="disabled"
              @button-click="() => updateResponse(item, button.value, close)">
            </ActivityButton>
            <b-button
              v-if="item.type === 'Regular' && $route.name === 'phone-list'"
              v-show="!item.isBusy"
              variant="link"
              class="interaction bg-success px-2 py-3"
              @click="close"
              :href="lookupFastPeopleSearch()" target="_blank">
              <span class="w-100 d-block pt-1">
                <font-awesome-layers
                  class="text-white fa-fw fa-stack mx-2">
                  <font-awesome-icon icon="user" class="fa-2x"></font-awesome-icon>
                  <font-awesome-icon icon="search" class="mr-0 mt-0"></font-awesome-icon>
                  <font-awesome-icon icon="search" class="mr-0 mt-0 search-shadow text-success"></font-awesome-icon>
                </font-awesome-layers>
              </span>
              <span class="people-search-text description text-white pt-1">People Search</span>
            </b-button>
            <b-button
              v-show="!item.isBusy"
              variant="link"
              class="interaction bg-success"
              :class="{ 'py-3': item.type === 'Regular' }"
              :to="{
                name: 'activity-history-checkout',
                params: {
                  territoryId: territory.id,
                  addressId: item.type === 'Phone' ? item.id : address.id,
                  checkoutId: territory.status && territory.status.checkout_id || '',
                }
              }">
              <span class="w-100 d-block pt-1">
                <font-awesome-layers class="text-white fa-2x mx-2">
                  <font-awesome-icon icon="history"></font-awesome-icon>
                </font-awesome-layers>
              </span>
              <span class="description text-white pt-1">History</span>
            </b-button>
          </template>
          <template v-slot:left="{ item, close }">
            <font-awesome-icon v-show="item.isBusy" icon="circle-notch" spin></font-awesome-icon>
            <b-button
              variant="link"
              v-show="!item.isBusy"
              class="interaction bg-danger">
              <span class="w-100 d-block">
                <font-awesome-layers class="remove-number text-white fa-2x" @click="() => removePhone(item)">
                  <font-awesome-icon icon="trash-alt"></font-awesome-icon>
                </font-awesome-layers>
              </span>
              <span class="description text-white">Remove</span>
            </b-button>
            <ActivityButton
              v-for="(button) in leftButtonList(item.type)"
              v-show="!item.isBusy"
              :key="button.value"
              class="fa-2x"
              :value="button.value"
              :actionButtonList="actionButtonList(item.type)"
              :slashed="button.slashed"
              @button-click="(value, button) => applyTag(item, button, close)">
            </ActivityButton>
          </template>
        </swipe-list>
        <b-list-group-item
          v-if="mode === 'phone-list'"
          class="d-flex pb-2 px-2 border-0"
          :class="{ 'pt-0': isDesktop }">
          <b-input-group size="lg">
            <b-input-group-prepend>
              <b-input-group-text class="text-gray bg-white">
                <font-awesome-icon icon="phone-alt"></font-awesome-icon>
              </b-input-group-text>
            </b-input-group-prepend>
            <the-mask
              class="form-control phone-input"
              type="tel"
              :mask="'###-###-####'"
              :masked="false"
              v-model="newPhone"
              @mousedown.native="onActive">
            </the-mask>
            <b-input-group-append>
              <b-button class="text-white" variant="success" @click="addNewPhone" :disabled="isAdding">
                <font-awesome-icon v-if="isAdding" icon="circle-notch" spin></font-awesome-icon>
                <font-awesome-icon v-else icon="plus"></font-awesome-icon>
              </b-button>
            </b-input-group-append>
          </b-input-group>
        </b-list-group-item>
      </b-list-group>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import PhoneCard from './PhoneCard';
import AddressCard from './AddressCard';
import { SwipeList } from 'vue-swipe-actions';
import ActivityButton from './ActivityButton';
import { TheMask } from 'vue-the-mask';
import { AddressType, AddressStatus } from '../store';
import get from 'lodash/get';
import intersection from 'lodash/intersection';
import { REJECT_TAGS } from '../store/modules/phone';
import { unmask } from '../utils/phone';
import {
  LEFT_BUTTON_LIST,
  RIGHT_BUTTON_LIST,
  NOT_ALLOWED as PHONE_NOT_ALLOWED,
} from '../store/modules/models/PhoneModel';
import {
  ADDRESS_RIGHT_BUTTON_LIST,
  PHONE_ADDRESS_LEFT_BUTTON_LIST,
  PHONE_ADDRESS_RIGHT_BUTTON_LIST,
  NOT_ALLOWED as ADDRESS_NOT_ALLOWED,
} from '../store/modules/models/AddressModel';

const NO_NUMBER = 'no number';
const DO_NOT_MAIL = 'do not mail';
const LETTER_WRITING = 'mail sent';

export default {
  name: 'PhoneAddressCard',
  props: ['address', 'territory', 'index', 'disabled'],
  components: {
    PhoneCard,
    AddressCard,
    SwipeList,
    ActivityButton,
    TheMask,
  },
  data() {
    return {
      enabled: true,
      revealed: {},
      newPhone: '',
      oldPhone: '',
      isAddressBusy: false,
      addressLeftButtonList: PHONE_ADDRESS_LEFT_BUTTON_LIST,
      isAdding: false,
    };
  },
  computed: {
    ...mapGetters({
      phoneButtonList: 'phone/actionButtonList',
      addressButtonList: 'address/actionButtonList',
      user: 'auth/user',
      congId: 'auth/congId',
      phone: 'phone/phone',
      search: 'phone/search',
      isDesktop: 'auth/isDesktop',
    }),
    mode() {
      return this.$route.name;
    },
    isEmpty() {
      return !this.address.phones || this.address.phones.length === 0;
    },
    phoneAddressTags() {
      const notes = this.address.notes ? this.address.notes.split(',') : [];
      return intersection(notes, PHONE_ADDRESS_LEFT_BUTTON_LIST);
    },
    doNotMail() {
      return this.phoneAddressTags.includes(DO_NOT_MAIL);
    },
    isLastRecordAndOdd() {
      return this.index === this.territory.addresses.length - 1 && this.index % 2 === 0;
    },
    combinedAddressAndPhones() {
      if (this.mode === 'phone-list' && this.address && this.address.phones) {
        return [this.address, ...this.address.phones];
      }
      return this.address ? [this.address] : [];
    },
  },
  methods: {
    ...mapActions({
      addPhone: 'phone/addPhone',
      updatePhone: 'phone/updatePhone',
      addPhoneTag: 'phone/addTag',
      addAddressTag: 'address/addTag',
      removePhoneTag: 'phone/removeTag',
      removeAddressTag: 'phone/removeTag',
      addLog: 'address/addLog',
      removeLog: 'address/removeLog',
      updateAddress: 'address/updateAddress',
      phoneSearch: 'phone/phoneSearch',
    }),
    actionButtonList(type) {
      if (type === 'Regular') {
        return this.addressButtonList;
      }
      return this.phoneButtonList;
    },
    rightButtonList(item) {
      const rightButtons = item.type === 'Regular' ? PHONE_ADDRESS_RIGHT_BUTTON_LIST : RIGHT_BUTTON_LIST;
      const list = this.$route.name === 'address-list' ? ADDRESS_RIGHT_BUTTON_LIST : rightButtons;

      if (!this.allowedToCall(item)) return [];
      return this.actionButtonList(item.type)
        .filter(b => list.includes(b.value));
    },
    leftButtonList(type) {
      const leftButtons = type === 'Regular' ? PHONE_ADDRESS_LEFT_BUTTON_LIST : LEFT_BUTTON_LIST;
      const list = this.$route.name === 'address-list' ? [] : leftButtons;
      return this.actionButtonList(type).filter(b => list.includes(b.value));
    },
    onActive() {
      const phoneEditing = this.address.phones && this.address.phones.find(p => p.editMode);
      if (phoneEditing) this.$set(phoneEditing, 'editMode', false);
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
    editPhone(oldPhone) {
      this.oldPhone = oldPhone;
    },
    async addNewPhone() {
      if (!this.newPhone) return;

      this.isAdding = true;
      const rawPhone = unmask(this.newPhone);

      const isDuplicate = await this.checkDuplicates(rawPhone);
      if (isDuplicate) {
        this.isAdding = false;
        return;
      }
      const sort = get(this.storeAddress, 'phones.length') || 0;
      const phone = {
        congregationId: this.congId,
        parent_id: this.address.id,
        territory_id: this.territory.id,
        type: AddressType.Phone,
        status: AddressStatus.Active,
        phone: rawPhone,
        notes: '',
        sort,
      };

      await this.addPhone(phone);
      this.newPhone = '';
      this.toggleNoNumberTag({ forceRemove: true });
      this.isAdding = false;
    },
    cancel(phone) {
      if (this.oldPhone) this.$set(phone, 'phone', this.formatPhone(this.oldPhone));
      this.$set(phone, 'editMode', false);
    },
    async checkDuplicates(phone, id) {
      const title = this.formatPhone(phone);
      await this.phoneSearch({ congId: this.congId, searchTerm: phone });
      if (this.search && this.search.length) {
        // same record is ok
        if (id && this.search.some(s => s.id === id)) return false;

        if (this.search.some(s => s.parent_id === this.address.id)) {
          this.$bvModal.msgBoxOk('This number already exists.', { title, centered: true });
        } else {
          const terr = this.search[0].territory;
          const h = this.$createElement;
          const message = h('p', {
            domProps: {
              innerHTML:
              `This number already exists in territory
              <b-link :to="/territories/${terr.id}">
                ${terr.name}
              </b-link>`,
            },
          });
          this.$bvModal.msgBoxOk(message, { title, centered: true });
        }
        return true;
      }

      return false;
    },
    async update(phone) {
      this.$set(phone, 'isBusy', true);
      const duplicates = await this.checkDuplicates(phone.phone, phone.id);
      if (duplicates) {
        this.$set(phone, 'isBusy', false);
        return;
      }
      phone.phone = unmask(phone.phone);
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
        phone.phone = unmask(phone.phone);
        await this.updatePhone({ ...phone, status: AddressStatus.Inactive });
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

    // update NH status for address or phone
    async updateResponse(entity, _value, close) {
      if (typeof close === 'function') close();
      let value = _value;
      if (entity.selectedResponse === 'START' && value === 'START') {
        this.$set(entity, 'isBusy', false);
        return;
      }
      if (!this.actionButtonList(entity.type).some(b => b.value === value)) {
        value = 'START';
      }

      try {
        this.$set(entity, 'isBusy', true);
        await this.addLog({ entityId: entity.id, value });
        const timestamp = Date.now();

        this.$set(entity, 'selectedResponse', value);
        this.$set(entity, 'selectedResponseTS', timestamp);
        this.$set(entity, 'lastActivity', {
          publisher_id: this.user.id,
          address_id: entity.id,
          timestamp,
          value,
        });

        this.$set(this.territory, 'lastActivity', entity.lastActivity);
        this.$set(entity, 'isBusy', false);
        if (typeof close === 'function') close();
      } catch (e) {
        console.error('Unable to save activity log', e);
      }
    },

    // apply tag to address or phone
    async applyTag(entity, item, close) {
      if (typeof close === 'function') close();
      const newTag = item.description.toLowerCase();
      this.isAddressBusy = true;
      this.$set(entity, 'isBusy', true);
      try {
        const notesArray = entity.notes ? entity.notes.split(',') : [];
        // check if new tag already exists
        if (notesArray.includes(newTag)) {
          this.isAddressBusy = false;
          this.$set(entity, 'isBusy', false);
          return;
        }

        const newArray = entity.type === 'Phone' ? await this.tagAndExclude(entity, newTag) : notesArray;

        // add new tag
        if (entity.type === 'Phone') {
          await this.addPhoneTag({ phoneId: entity.id, userid: this.user.id, tag: newTag });
        } else {
          await this.addAddressTag({ addressId: entity.id, userid: this.user.id, tag: newTag });
        }
        newArray.push(newTag);

        // update UI phone
        const updatedNotes = newArray.join(',');
        this.$set(entity, 'notes', `${updatedNotes}`);
        this.$set(entity, 'isBusy', false);
        this.isAddressBusy = false;
        if (typeof close === 'function') close();
      } catch (e) {
        console.error('Unable to apply tag', e);
      }
    },

    async tagAndExclude(phone, newTag) {
      // if new tag is exclusive, then remove all other exclusive tags
      const exclusiveTags = [...REJECT_TAGS, 'confirmed'];
      const oldArray = phone.notes ? phone.notes.split(',') : [];
      let newArray = [...oldArray];

      if (exclusiveTags.includes(newTag)) {
        for (const tag of exclusiveTags) {
          await this.removePhoneTag({ phoneId: phone.id, userid: this.user.id, tag });
        }
        newArray = oldArray.filter(a => !exclusiveTags.includes(a));
      }

      return newArray;
    },
    async toggleNoNumberTag({ forceRemove = false }) {
      let notesArray = this.address.notes ? this.address.notes.split(',') : [];
      if (forceRemove || notesArray.includes(NO_NUMBER)) {
        notesArray = notesArray.filter(n => n !== NO_NUMBER);
      } else {
        notesArray.push(NO_NUMBER);
      }

      this.$set(this.address, 'notes', notesArray.join(','));
      await this.updateAddress(this.address);
    },
    async toggleLetterWriting() {
      if (this.address.lastActivity.value === 'LW') {
        await this.removeLog({ id: this.address.lastActivity.id, entityId: this.address.id });
      } else {
        await this.addLog({ entityId: this.address.id, value: LETTER_WRITING });
      }
    },
    lookupFastPeopleSearch() {
      const addr1 = `${(get(this.address, 'addr1') || '').trim().replace(/\s+/g, '-')}`;
      const city = `${(get(this.address, 'city') || '').trim().replace(/\s+/g, '-')}`;
      const state = `${(get(this.address, 'state_province') || '').trim().replace(/\s+/g, '-')}`;
      return `https://www.fastpeoplesearch.com/address/${addr1}_${city}-${state}`;
    },

    selectedNotAllowed(item) {
      const notes = get(item, 'notes', '') || '';
      const tags = notes ? notes.split(',') : [];
      const notAllowed = item.type === 'Regular' ? ADDRESS_NOT_ALLOWED : PHONE_NOT_ALLOWED;
      return intersection(notAllowed, tags) || [];
    },

    allowedToCall(item) {
      return this.selectedNotAllowed(item).length === 0;
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
  .last-record {
    border-right: solid;
  }
  .search-shadow {
    top: 1px;
    right: 1px;
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
    margin-top: 0.5rem !important;
    margin-bottom: 0.5rem !important;
  }
}
.no-phone {
  cursor: pointer;
}
.people-search-text {
  position: relative;
  top: -2px;
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
