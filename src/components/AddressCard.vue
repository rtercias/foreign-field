<template>
  <div class="pl-0">
    <b-row class="justify-content-between align-items-center pl-2 pr-2">
      <div class="address col-6 pl-0">
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
        
        <!-- the modal -->
        <b-modal @ok="handleSubmit" hide-header-close ref="modal-note" title="Add a hashtag">
          <form @submit.stop.prevent='handleSubmit' rows="5">
            <b-form-input v-model="formText"></b-form-input>
          </form>
        </b-modal>
        <!-- End of Modal componenet -->  

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

      <!-- Modal interaction -->
      <font-awesome-icon @click="showModal" icon="pencil-alt" class="fa-2x"></font-awesome-icon>
    </b-row>
      

    <!-- Display Hashtags -->
    <b-row class="pl-2 pr-2 bottom-tags ">
      <div class="tag-display">
        <ul class="mt-2 mb-0 pl-0">Tags: 
          <li v-for='(t, index) in tags' :key="t.id" class="tag-names-list">
            <b-badge variant="secondary" class="ml-1 mr-1">
                <font-awesome-icon icon="times" @click="deleteTag(index)"></font-awesome-icon>
                {{ t + ' '}}
            </b-badge>
          </li>
        </ul>
      </div>
    </b-row>
    
    <!-- End of Display Hashtags -->
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import debounce from 'lodash/debounce';

const responses = ['START', 'HOME', 'NH', 'NF'];

export default {
  name: 'AddressCard',
  props: ['address'],
  components: {
  },
  data() {
    return {
      storageId: `foreignfield-${this.address.id}`,
      selectedResponse: '',
      responseText: '',
      animate: false,
      hideResponseText: false,
      formText: '',
      tags: [],
    }
  },
  methods: {
    ...mapActions({
      setAddress: 'address/setAddress',
      addLog: 'address/addLog',
      updateLog: 'address/updateLog',
      removeLog: 'address/removeLog',
    }),
    nextResponse: debounce(function(value) {
      this.selectedResponse = value;
      this.addLog({ addressId: this.address.id, value });
    }, 500, { leading: true, trailing: false }),

    // Added methods for note submission
    showModal() {
      this.$refs['modal-note'].show()
    },
    clearName(){
      this.formText = ''
    },
    handleSubmit(){
      // The replace method gets rid of the spaces in the text field
      this.tags.push(this.formText.replace(/\s/g, ''))
      this.clearName()
      this.$nextTick(() => {
        this.$refs['modal-note'].hide()
      })
    },
    deleteTag(index){
      this.tags.splice(index, 1)
    }
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
    }
  },
  watch: {
    address() {
      this.selectedResponse = this.lastActivity || responses[0];
    }
  }
}
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

.tag-display {
  text-align: left;
}

.bottom-tags {
  white-space: nowrap;
  overflow: scroll;
}

.tag-names-list {
  display: inline;
  overflow: hidden;
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
