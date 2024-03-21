<template>
  <div
    class="phone-address-card"
    :class="{ 'm-0': !disabled, 'm-0 pb-3': mode === 'phone-list', 'p-2': isDesktop && mode === 'phone-list' }">
    <AddressCard
      :mode="mode"
      :index="index"
      :class="{
        'border-warning border-medium active': isActiveAddress(address.id),
        'bg-secondary border-right-0 border-left-0': mode === 'phone-list',
        'bg-white': mode === 'address-list',
      }"
      :address="address"
      :territoryId="territory.id"
    >
    </AddressCard>
    <div v-if="mode === 'phone-list'">
      <div v-for="(phone, index) in phones" :key="index">
        <PhoneCard
          class="bg-white"
          :class="{
            'border-warning border-medium active': isActiveAddress(phone.id),
          }"
          :index="index"
          :phoneRecord="phone"
          :address="address"
          :incomingResponse="phone.lastActivity"
          :disabled="disabled"
        >
        </PhoneCard>
      </div>
      <b-list-group>
        <b-list-group-item
          v-if="mode === 'phone-list'"
          class="new-phone d-flex p-0 border-0"
          :class="{ 'pt-0': isDesktop, 'mt-2': !isDesktop }">
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
import { TheMask } from 'vue-the-mask';
import { AddressType, AddressStatus } from '../store';
import get from 'lodash/get';
import intersection from 'lodash/intersection';
import format from 'date-fns/format';
import addYears from 'date-fns/addYears';
import { REJECT_TAGS } from '../store/modules/phone';
import { format as formatPhone, unmask } from '../utils/phone';
import {
  LEFT_BUTTON_LIST,
  RIGHT_BUTTON_LIST,
} from '../store/modules/models/PhoneModel';
import {
  ADDRESS_RIGHT_BUTTON_LIST,
  PHONE_ADDRESS_LEFT_BUTTON_LIST,
  PHONE_ADDRESS_RIGHT_BUTTON_LIST,
  DO_NOT_CALL,
  DO_NOT_MAIL,
  ADDRESS_STATUS,
} from '../store/modules/models/AddressModel';


export default {
  name: 'PhoneAddressCard',
  props: ['address', 'territory', 'index', 'disabled'],
  components: {
    PhoneCard,
    AddressCard,
    TheMask,
  },
  data() {
    return {
      enabled: true,
      revealed: {},
      newPhone: '',
      isAddressBusy: false,
      addressLeftButtonList: PHONE_ADDRESS_LEFT_BUTTON_LIST,
      isAdding: false,
    };
  },
  computed: {
    ...mapGetters({
      canWrite: 'auth/canWrite',
      phoneButtonList: 'phone/actionButtonList',
      addressButtonList: 'address/actionButtonList',
      user: 'auth/user',
      congId: 'auth/congId',
      phone: 'phone/phone',
      isDesktop: 'auth/isDesktop',
      search: 'phone/search',
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
    phones() {
      return this.address.phones;
    },
  },
  methods: {
    ...mapActions({
      addPhone: 'phone/addPhone',
      updatePhone: 'phone/updatePhone',
      addPhoneTag: 'phone/addTag',
      addAddressTag: 'address/addTag',
      removePhoneTag: 'phone/removeTag',
      addLog: 'address/addLog',
      removeLog: 'address/removeLog',
      markAsDoNotCall: 'address/markAsDoNotCall',
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
      return this.actionButtonList(item.type).filter(b => list.includes(b.value));
    },
    leftButtonList(type) {
      const leftButtons = type === 'Regular' ? PHONE_ADDRESS_LEFT_BUTTON_LIST : LEFT_BUTTON_LIST;
      return this.actionButtonList(type).filter(b => leftButtons.includes(b.value));
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
      this.isAdding = false;
    },
    async checkDuplicates(phone, id) {
      const title = formatPhone(phone);
      await this.phoneSearch({ congId: this.congId, searchTerm: phone });
      const searchResults = this.search.filter(s => s.address.status === ADDRESS_STATUS.Active.value);
      if (searchResults && searchResults.length) {
        // same record is ok
        if (id && searchResults.some(s => s.id === id)) return false;

        if (searchResults.some(s => s.parent_id === this.address.id)) {
          this.$bvModal.msgBoxOk('This number already exists.', { title, centered: true });
        } else {
          const terr = searchResults[0].territory;
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
    getRejectTag(phone) {
      return phone.notes.split(',').find(n => REJECT_TAGS.includes(n));
    },

    // update NH status for address or phone
    // async updateResponse(entity, _value, close) {
    //   if (typeof close === 'function') close();
    //   let value = _value;
    //   if (entity.selectedResponse === 'START' && value === 'START') {
    //     this.$set(entity, 'isBusy', false);
    //     return;
    //   }
    //   if (!this.actionButtonList(entity.type).some(b => b.value === value)) {
    //     value = 'START';
    //   }

    //   try {
    //     this.$set(entity, 'isBusy', true);
    //     await this.addLog({ entityId: entity.id, value, checkoutId: get(this.territory, 'status.checkout_id') });
    //     this.$set(entity, 'isBusy', false);
    //     if (typeof close === 'function') close();
    //   } catch (e) {
    //     console.error('Unable to save activity log', e);
    //   }
    // },

    // apply tag to address or phone
    // async applyTag(entity, item, close) {
    //   if (typeof close === 'function') close();

    //   if (item.value === DO_NOT_CALL) {
    //     await this.doNotCall();
    //     return;
    //   }

    //   const newTag = item.description.toLowerCase();
    //   this.isAddressBusy = true;
    //   this.$set(entity, 'isBusy', true);
    //   try {
    //     const notesArray = entity.notes ? entity.notes.split(',') : [];
    //     // check if new tag already exists
    //     if (notesArray.includes(newTag)) {
    //       this.isAddressBusy = false;
    //       this.$set(entity, 'isBusy', false);
    //       return;
    //     }

    //     const newArray = entity.type === 'Phone' ? await this.tagAndExclude(entity, newTag) : notesArray;

    //     // add new tag
    //     if (entity.type === 'Phone') {
    //       await this.addPhoneTag({ phone: entity, userid: this.user.id, tag: newTag });
    //     } else {
    //       await this.addAddressTag({ address: entity, userid: this.user.id, tag: newTag });
    //     }
    //     newArray.push(newTag);

    //     // update UI phone
    //     const updatedNotes = newArray.join(',');
    //     this.$set(entity, 'notes', `${updatedNotes}`);
    //     this.$set(entity, 'isBusy', false);
    //     this.isAddressBusy = false;
    //     if (typeof close === 'function') close();
    //   } catch (e) {
    //     console.error('Unable to apply tag', e);
    //   }
    // },

    // async tagAndExclude(phone, newTag) {
    //   // if new tag is exclusive, then remove all other exclusive tags
    //   const exclusiveTags = [...REJECT_TAGS, 'confirmed'];
    //   const oldArray = phone.notes ? phone.notes.split(',') : [];
    //   let newArray = [...oldArray];

    //   if (exclusiveTags.includes(newTag)) {
    //     for (const tag of exclusiveTags) {
    //       await this.removePhoneTag({ phoneId: phone.id, userid: this.user.id, tag });
    //     }
    //     newArray = oldArray.filter(a => !exclusiveTags.includes(a));
    //   }

    //   return newArray;
    // },
    // async toggleLetterWriting() {
    //   if (this.address.lastActivity.value === 'LW') {
    //     await this.removeLog({ id: this.address.lastActivity.id, entityId: this.address.id });
    //   } else {
    //     await this.addLog({
    //       entityId: this.address.id,
    //       value: LETTER_WRITING,
    //       checkoutId: get(this.territory, 'status.checkout_id'),
    //     });
    //   }
    // },
    // lookupFastPeopleSearch() {
    //   const addr1 = `${(get(this.address, 'addr1') || '').trim().replace(/\s+/g, '-')}`;
    //   const addr2 = `${(get(this.address, 'addr2') || '').trim().replace(/\s+/g, '-')}`;
    //   const city = `${(get(this.address, 'city') || '').trim().replace(/\s+/g, '-')}`;
    //   const state = `${(get(this.address, 'state_province') || '').trim().replace(/\s+/g, '-')}`;
    //   window.open(`https://www.fastpeoplesearch.com/address/${addr1}-${addr2}_${city}-${state}`, '_blank');
    //   this.$refs.list.closeActions();
    // },

    // selectedNotAllowed(item) {
    //   const notes = get(item, 'notes', '') || '';
    //   const tags = notes ? notes.split(',') : [];
    //   const notAllowed = item.type === 'Regular' ? ADDRESS_NOT_ALLOWED : PHONE_NOT_ALLOWED;
    //   return intersection(notAllowed, tags) || [];
    // },

    // allowedToCall(item) {
    //   return this.selectedNotAllowed(item).length === 0;
    // },

    // goToActivityHistory(item) {
    //   this.$router.push({
    //     name: 'activity-history-checkout',
    //     params: {
    //       territoryId: this.territory.id,
    //       addressId: item.type === 'Phone' ? item.id : this.address.id,
    //       checkoutId: this.territory.status && this.territory.status.checkout_id || '',
    //     },
    //   });
    // },

    async doNotCall() {
      const response = await this.$bvModal.msgBoxConfirm('Press OK to mark this address as "Do Not Call".', {
        title: `${this.address.addr1} ${this.address.addr2} - Do Not Call`,
        centered: true,
      });

      if (response) {
        const datestamped = `${DO_NOT_CALL} until ${format(addYears(new Date(), 1), 'P')}`;
        await this.markAsDoNotCall({ addr: this.address, userid: this.user.id, tag: datestamped });
      }
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
  .new-phone {
    display: none !important;
  }
  .border-warning {
    border: initial !important;
  }
}

</style>
