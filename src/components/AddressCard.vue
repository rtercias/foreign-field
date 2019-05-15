<template>
  <div>
    <b-row class="justify-content-between align-items-center pl-2 pr-2">
      <div class="address col-8 pl-0">
        <h5>
          <a :href="mapsUrl" target="_blank">{{address.addr1}}</a>&nbsp;
          <em>{{address.addr2}}</em>
        </h5>
        <div>
          {{address.city}} {{address.state}} {{address.postalCode}}<br/>
          {{address.notes}}
        </div>
      </div>
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
      ok-only
      ok-variant="outline-info"
      @ok="handleSubmit"
      ref="modal-note"
      footer-class="border-top-0"
      header-class="border-bottom-0"
      hide-header-close
      centered>
        <form @submit.stop.prevent='handleSubmit'>
          <b-form-textarea v-model="formText" rows="3" maxlength="25" no-resize/>
        </form>
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
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import debounce from 'lodash/debounce';

const responses = ['START', 'HOME', 'NH', 'NF'];

export default {
  name: 'AddressCard',
  props: ['address'],
  data() {
    return {
      storageId: `foreignfield-${this.address.id}`,
      selectedResponse: '',
      responseText: '',
      animate: false,
      hideResponseText: false,
      formText: '',
      tags: [],
    };
  },
  methods: {
    ...mapActions({
      setAddress: 'address/setAddress',
      addLog: 'address/addLog',
      updateLog: 'address/updateLog',
      removeLog: 'address/removeLog',
    }),
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
        if (!this.tags.includes(this.formText)) {
          this.tags.unshift(this.formText.replace(/\s/g, ''));
          this.formText = '';
          this.$nextTick(() => {
            this.$refs['modal-note'].hide();
          });
        }
      }
    },
    addressExtended() {
      this.$router.push({
        path: `/territories/${this.$route.params.group}/${this.$route.params.id}/address/${this.address.id}`,
      });
    },
  },
  mounted() {
    this.setAddress(this.address);
    this.selectedResponse = this.lastActivity || responses[0];
  },
  computed: {
    ...mapGetters({
      isOwnedByUser: 'territory/isOwnedByUser',
      lastActivity: 'address/lastActivity',
      loading: 'auth/loading',
    }),

    mapsUrl() {
      const addr1 = this.address.addr1 || '';
      const city = this.address.city || '';
      const state = this.address.state_province || '';
      return `https://www.google.com/maps/dir/?api=1&destination=${addr1} ${city} ${state}`;
    },

    recentLogs() {
      const lastActivityId = this.lastActivity && this.lastActivity.id;
      return [...this.address.activityLogs.filter(l => l.id !== lastActivityId)];
    },
  },
  watch: {
    address() {
      this.selectedResponse = this.lastActivity || responses[0];
    },
  },
};
</script>
<style scoped>
.modal-dialog {
    width: 300px; /* Bootstrap default - 600px */
  }

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

.tag-names-list {
  display: inline;
  overflow: hidden;
}

.extended-title {
  font-size: 1.5em;
  font-weight: 700;
  padding: 25px 0;
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
