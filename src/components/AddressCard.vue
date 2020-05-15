<template>
<<<<<<< HEAD
  <div>
    <b-row class="justify-content-between align-items-center pl-2 pr-2">
      <div class="address col-8 pl-0">
=======
  <v-touch class="v-touch-address-card" @pan="slide" :pan-options="{ direction: 'horizontal'}">
    <div class="address-card row justify-content-between align-items-center pr-2" ref="addressCard">
      <div class="address col-9">
>>>>>>> d4f8863ae161918d8b43f890a8641294c87cb081
        <h5>
          <a :href="mapsUrl" target="_blank">{{address.addr1}}</a>&nbsp;
          <em>{{address.addr2}}</em>
        </h5>
        <div>
          {{address.city}} {{address.state}} {{address.postalCode}}<br/>
          {{address.notes}}
        </div>
      </div>
<<<<<<< HEAD
        <!-- TODO: historical activity (show the last two) -->
        <!-- <div v-for="log in recentLogs" :key="log.id">
          <div>
            <font-awesome-layers v-if="log.value==='HOME'" class="text-success fa-3x">
              <font-awesome-icon icon="check-circle"></font-awesome-icon>
            </font-awesome-layers>
          </div>
          <div>
            <font-awesome-layers v-if="log.value==='NH'" class="text-warning fa-3x">
              <font-awesome-icon icon="circle"></font-awesome-icon>
              <font-awesome-layers-text value="NH" class="nh-text text-white font-weight-bold"></font-awesome-layers-text>
            </font-awesome-layers>
          </div>
        </div> -->

      <!-- the modal for tags -->
      <b-modal
      ok-variant="outline-info"
      @submit="handleSubmit"
      ref="modal-note"
      footer-class="border-top-0"
      header-class="border-bottom-0"
      hide-header
      hide-footer
      centered>
      <div class="row align-items-center">
        <b-col cols="8">
          <form @submit.stop.prevent='handleSubmit'>
            <b-form-input v-model="formText" maxlength="25" placeholder="Add a tag..."/>
          </form>
        </b-col>
        <b-col cols="2">
          <span class="tag-counter">{{ formText.length }}/25</span>
        </b-col>
        <b-col cols="2" class="pl-0">
          <b-button variant="info" @click="handleSubmit">+</b-button>
        </b-col>
      </div>
      </b-modal>

      <div class="interaction pr-0">
        <b-button
          class="pr-0"
          variant="link"
          v-if="selectedResponse==='START'"
          @click="nextResponse('HOME')"
          :disabled="loading">
          {{selectedResponse}}
        </b-button>
        <font-awesome-layers v-if="selectedResponse==='HOME'" class="text-success fa-3x" @click="nextResponse('NH')">
          <font-awesome-icon icon="check-circle"></font-awesome-icon>
        </font-awesome-layers>
        <font-awesome-layers v-if="selectedResponse==='NH'" class="text-warning fa-3x" @click="nextResponse('NF')">
          <font-awesome-icon icon="circle"></font-awesome-icon>
          <font-awesome-layers-text value="NH" class="nh-text text-white font-weight-bold"></font-awesome-layers-text>
        </font-awesome-layers>
        <font-awesome-layers v-if="selectedResponse==='NF'" class="fa-3x" @click="nextResponse('START')">
          <font-awesome-icon icon="circle"></font-awesome-icon>
          <font-awesome-layers-text value="NF" class="nh-text text-white font-weight-bold"></font-awesome-layers-text>
        </font-awesome-layers>
      </div>
    </b-row>
    <b-row class="pl-2 pr-2 pt-2 bottom-tags align-items-center">
      <b-col cols="3" class="pl-0 pr-0">
        <span @click="showModal">add a tag...</span>
      </b-col>
      <b-col cols="7" class="pl-0 pr-0">
        <div class="tag-container">
          <div class="tag-container-blur"></div>
          <ul class="pl-0 mb-0">
            <li v-for='t in tags' :key="t.id" class="tag-names-list">
              <b-badge variant="info" class="ml-1 mr-1">
                {{ t }}
              </b-badge>
            </li>
          </ul>
        </div>
      </b-col>
      <b-col cols="2" class="pl-2 pr-0" id="expand-view">
        <a @click="addressExtended">More</a>
      </b-col>
    </b-row>
  </div>
=======
      <div class="static-buttons col-3 pl-0 pr-2" v-show="!isContainerVisible">
        <ActivityButton
          class="fa-2x pr-2"
          :value="selectedResponse"
          :next="'START'"
          @button-click="updateResponse">
        </ActivityButton>
        <font-awesome-layers class="ellipsis-v-static text-muted fa-2x">
          <font-awesome-icon icon="ellipsis-v" class="ml-0">
          </font-awesome-icon>
        </font-awesome-layers>
      </div>
      <div
        class="activity-container pl-0 pr-2"
        ref="activityContainer"
        :style="{ '--x': transform, right: `${containerRight}px` }">
        <font-awesome-layers class="ellipsis-v text-muted fa-2x mr-8">
          <font-awesome-icon icon="ellipsis-v" class="ml-0">
          </font-awesome-icon>
        </font-awesome-layers>
        <ActivityButton
          class="fa-2x"
          :class="{ 'fa-3x': clickedResponse === 'NH' }"
          :value="'NH'"
          v-if="isTerritoryCheckedOut"
          @button-click="updateResponse">
        </ActivityButton>
        <ActivityButton
          class="fa-2x"
          :class="{ 'fa-3x': clickedResponse === 'HOME' }"
          :value="'HOME'"
          v-if="isTerritoryCheckedOut"
          @button-click="updateResponse">
        </ActivityButton>
        <ActivityButton
          class="fa-2x"
          :class="{ 'fa-3x': clickedResponse === 'PH' }"
          :value="'PH'"
          v-if="isTerritoryCheckedOut"
          @button-click="updateResponse">
        </ActivityButton>
        <ActivityButton
          class="fa-2x"
          :class="{ 'fa-3x': clickedResponse === 'LW' }"
          :value="'LW'"
          v-if="isTerritoryCheckedOut"
          @button-click="updateResponse">
        </ActivityButton>
        <ActivityButton
          class="fa-2x"
          :class="{ 'fa-3x': clickedResponse === 'NF' }"
          :value="'NF'"
          v-if="isTerritoryCheckedOut"
          @button-click="updateResponse">
        </ActivityButton>
        <b-link
          class="text-info"
          :to="`/addresses/${address.id}/history`"
          @click="setAddress(address)">
          <font-awesome-layers class="text-info fa-2x">
            <font-awesome-icon icon="history"></font-awesome-icon>
          </font-awesome-layers>
        </b-link>
      </div>
    </div>
  </v-touch>
>>>>>>> d4f8863ae161918d8b43f890a8641294c87cb081
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import gsap, { Elastic } from 'gsap';
import get from 'lodash/get';
import ActivityButton from './ActivityButton';

const DIRECTION_LEFT = 2;
const DIRECTION_RIGHT = 4;
const NUM_ALWAYS_VISIBLE_BUTTONS = 2;

export default {
  name: 'AddressCard',
  props: ['address', 'territoryId'],
  components: {
    ActivityButton,
  },
  data() {
    return {
      storageId: `foreignfield-${this.address.id}`,
      selectedResponse: '',
      responseText: '',
      animate: false,
<<<<<<< HEAD
      hideResponseText: false,
      formText: '',
      tags: [],
=======
      currentOffset: 0,
      containerRight: 0,
      isContainerVisible: false,
      transform: '',
      clickedResponse: '',
>>>>>>> d4f8863ae161918d8b43f890a8641294c87cb081
    };
  },
  methods: {
    ...mapActions({
      addLog: 'address/addLog',
      setAddress: 'address/setAddress',
      fetchAddress: 'address/fetchAddress',
    }),
<<<<<<< HEAD
    /* eslint-disable */
    nextResponse: debounce(function (value) {
      this.selectedResponse = value;
      this.addLog({ addressId: this.address.id, value });
    }, 500, { leading: true, trailing: false }),
    /* eslint-enable */
    // Added methods for note submission
    showModal() {
      this.$refs['modal-note'].show();
    },
    handleSubmit() {
      // The replace method gets rid of the spaces in the text field
      if (this.formText) {
        if (this.formText) {
          if (!this.tags.includes(this.formText)) {
            this.tags.unshift(this.formText.replace(/\s/g, '-'));
            this.formText = '';
            this.$nextTick(() => {
              this.$refs['modal-note'].hide();
            });
          }
        }
      }
    },
    addressExtended() {
      this.$router.push({
        path: `/territories/${this.$route.params.group}/${this.$route.params.id}/address/${this.address.id}`,
      });
=======
    resetContainerPosition() {
      const pos = -this.containerWidth;
      this.containerRight = pos;
      this.isContainerVisible = false;
    },
    async updateResponse(value) {
      if (this.selectedResponse === 'START' && value === 'START') return;

      this.clickedResponse = value;

      try {
        await this.addLog({ addressId: this.address.id, value });
        await this.fetchAddress(this.address.id);
        this.selectedResponse = this.lastActivity;
        this.clickedResponse = '';
        this.resetContainerPosition();
      } catch (e) {
        console.error('Unable to save activity log', e);
      }
    },
    slide(e) {
      if (Number.isNaN(this.transform)) this.transform = 0;
      const dragOffset = 100 / this.itemWidth * e.deltaX / this.count * this.overflowRatio;
      if (Math.abs(e.velocityX) > 0.2) {
        this.transform = this.currentOffset + dragOffset;
      }

      if (e.isFinal) {
        this.currentOffset = this.transform;
        const maxScroll = 100 - this.overflowRatio * 100;
        let finalOffset = this.currentOffset;

        if (this.currentOffset <= maxScroll) {
          finalOffset = maxScroll;
        } else if (this.currentOffset >= 0) {
          finalOffset = 0;
        } else {
          const index = this.currentOffset / this.overflowRatio / 100 * this.count;
          const nextIndex = e.deltaX <= 0 ? Math.floor(index) : Math.ceil(index);
          finalOffset = 100 * this.overflowRatio / this.count * nextIndex;
        }

        gsap.fromTo(
          this.$refs.activityContainer,
          0.4,
          { '--x': this.currentOffset },
          {
            '--x': finalOffset,
            ease: Elastic.easeOut.config(1, 0.8),
            onUpdate: () => {
              if (e.direction === DIRECTION_LEFT && Math.abs(e.velocityX) > 0.2) {
                this.containerRight = finalOffset;
                this.isContainerVisible = true;
              } else if (e.direction === DIRECTION_RIGHT) {
                this.resetContainerPosition();
              }
            },
            onComplete: () => {
              if (Math.abs(e.velocityX) > 0.2) {
                this.currentOffset = finalOffset;
              } else {
                this.currentOffset = 0;
              }
            },
          },
        );
      }
    },

    getPxValue(styleValue) {
      return Number(styleValue.substring(0, styleValue.indexOf('px')));
>>>>>>> d4f8863ae161918d8b43f890a8641294c87cb081
    },
  },
  mounted() {
    this.resetContainerPosition();
    this.setAddress(this.address);
    this.selectedResponse = this.lastActivity || this.START;
  },
  computed: {
    ...mapGetters({
      lastActivity: 'address/lastActivity',
      loading: 'auth/loading',
      territory: 'territory/territory',
    }),

    mapsUrl() {
      const addr1 = this.address.addr1 || '';
      const city = this.address.city || '';
      const state = this.address.state_province || '';
      return `https://www.google.com/maps/dir/?api=1&destination=${addr1} ${city} ${state}`;
    },

    isTerritoryCheckedOut() {
      return get(this.territory, 'status.status') === 'Checked Out';
    },

    overflowRatio() {
      return this.$refs.activityContainer.scrollWidth / this.$refs.activityContainer.offsetWidth;
    },

    itemWidth() {
      return this.$refs.activityContainer.scrollWidth / this.count;
    },

    count() {
      return this.$refs.activityContainer.children.length;
    },

    containerWidth() {
      const styles = window.getComputedStyle(this.$refs.activityContainer);
      const width = styles.getPropertyValue('width');
      // eslint-disable-next-line
      console.log(width);
      return this.getPxValue(width);
    },

    containerLeftButtonsWidth() {
      const buttons = Array.from(this.$refs.activityContainer.children);

      // we're only interested in buttons that are always visible, so reduce to the first n
      buttons.length = NUM_ALWAYS_VISIBLE_BUTTONS;

      let width = 0;
      buttons.forEach((b) => {
        const styles = window.getComputedStyle(b);
        const buttonWidth = styles.getPropertyValue('width');
        const paddingLeft = styles.getPropertyValue('padding-left');
        const paddingRight = styles.getPropertyValue('padding-right');

        width += this.getPxValue(buttonWidth) + this.getPxValue(paddingLeft) + this.getPxValue(paddingRight);
        // width += b.clientWidth;
      });

      // eslint-disable-next-line
      console.log('left buttons width', width);
      return width;
    },
  },
};
</script>
<style scoped>
<<<<<<< HEAD
.modal-dialog {
    width: 300px; /* Bootstrap default - 600px */
  }

=======
.v-touch-address-card {
  touch-action: pan-y;
}
.address-card {
  display: flex;
  flex-direction: row;
  overflow: hidden;
  position: relative;
}
>>>>>>> d4f8863ae161918d8b43f890a8641294c87cb081
.address {
  text-align: left;
}
.nh-text {
  font-size: 0.5em;
}
.interaction {
  cursor: pointer;
  overflow: hidden;
}
<<<<<<< HEAD
.bottom-tags {
  white-space: nowrap;
  text-align: left;
  color: #17a2b8;
}
#expand-view {
  text-align: center;
}

.tag-container {
  overflow: hidden;
}
.tag-container-blur {
  box-shadow: inset -5px -10px 10px hsl(0, 0%, 100%);
  width: 100%;
  height: 200%;
  position: absolute;
}

.tag-names-list {
  display: inline;
  overflow: hidden;
}
.tag-counter {
  color: lightgray;
}

input {
  padding: 0;
  border: none;
  border-radius: 0;
  box-shadow: none !important;
}


.extended-title {
  font-size: 1.5em;
  font-weight: 700;
  padding: 25px 0;
=======
.activity-container {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  overflow: hidden;
  position: absolute;
  transform: translateX(calc(var(--x, 0) * 1%));
  background-color: #fff;
  border-width: 4px 0;
  border-color: #fff;
  border-style: solid;
  width: 100%;
}

.activity-container * {
  display: block;
}
.static-buttons {
  display: flex;
  align-items: center;
  justify-content: space-between;
>>>>>>> d4f8863ae161918d8b43f890a8641294c87cb081
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
