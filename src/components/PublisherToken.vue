<template>
  <div class="p-5 text-left">
    <h4>Login Helper</h4>
    <div>Help another user log in to Foreign Field.</div>
    <div class="mt-3 mb-2">
      <div>
        <b-dropdown class="publishers-list mb-5" variant="outline-primary">
          <span slot="button-content" class="">{{publisherName || 'Select User'}}</span>
          <b-dropdown-item v-for="pub in basicPublishers" v-bind:key="pub.id" @click="selectPublisher(pub)">
            {{displayName(pub)}}
          </b-dropdown-item>
        </b-dropdown>
      </div>
      <div>Enter {{possessiveName}} phone number and send them a login link:</div>
      <the-mask
        class="w-auto mr-3"
        type="tel"
        :mask="'###-###-####'"
        :masked="false"
        placeholder="###-###-####"
        disabled
        v-model="phoneNumber">
      </the-mask>
      <div class="bg-warning small text-break p-2 my-2 rounded">
        *SMS Account is currently limited to verified phone numbers during trial period
      </div>
    </div>
    <b-button @click="sendLink" v-if="!isSMSSent" variant="primary">
      <font-awesome-icon class="d-xl-none" icon="sms" size="sm" />
      Send Link
    </b-button>
    <div v-else>SMS Sent!</div>
    <div class="mt-5 mb-2">
      Or copy the link below and send it to them some other way.
      <div class="font-weight-bold font-italic text-break">{{shortLink}}</div>
    </div>
    <b-button variant="outline-primary" @click="copyLink">
      <font-awesome-icon class="text-primary d-xl-none mr-1" icon="copy" size="sm" />
      <span v-if="isCopied">Copied!</span>
      <span v-else>Copy Link</span>
    </b-button>
  </div>
</template>
<script>
import { mapGetters, mapActions } from 'vuex';
import { TheMask } from 'vue-the-mask';
import { displayName } from '../utils/publisher';

export default {
  name: 'PublisherToken',
  components: {
    TheMask,
  },
  data() {
    return {
      isCopied: false,
      phoneNumber: '2037880993',
      isSMSSent: false,
      publisher: {},
    };
  },
  async mounted() {
    await this.fetch();
  },
  computed: {
    ...mapGetters({
      publisherToken: 'auth/publisherToken',
      shortLink: 'auth/shortLink',
      isDesktop: 'auth/isDesktop',
      congId: 'auth/congId',
      publishers: 'publishers/publishers',
    }),
    publisherName() {
      return displayName(this.publisher);
    },
    link() {
      return `${window.location.origin}?token=${this.publisherToken}`;
    },
    basicPublishers() {
      return this.publishers.filter(p => ['PUB', 'RP'].includes(p.role) && p.status);
    },
    possessiveName() {
      if (this.publisherName) {
        const lastS = this.publisherName.charAt(this.publisherName.length - 1) === 's';
        return `${this.publisherName}'${lastS ? '' : 's'}`;
      }
      return 'a';
    },
  },
  methods: {
    ...mapActions({
      generatePublisherToken: 'auth/generatePublisherToken',
      generateShortLink: 'auth/generateShortLink',
      sendSMS: 'auth/sendSMS',
      fetchPublishers: 'publishers/fetchPublishers',
    }),
    displayName,
    async selectPublisher(pub) {
      if (typeof pub === 'string') {
        this.publisher = this.publishers.find(p => p.username === pub);
      } else {
        this.publisher = pub;
      }
      await this.generateTokenAndLink();
    },
    async generateTokenAndLink(username) {
      await this.generatePublisherToken(username || this.publisher.username);
      await this.generateShortLink(this.link);
    },
    async copyLink() {
      try {
        await navigator.clipboard.writeText(this.shortLink);
        this.isCopied = true;
      } catch (error) {
        console.error(error);
      }
    },
    async sendLink() {
      await this.sendSMS({ text: this.shortLink, number: `+1${this.phoneNumber}` });
      this.isSMSSent = true;
    },
    async fetch() {
      const { username } = this.$route.query;
      await this.fetchPublishers(this.congId);
      if (username) {
        this.selectPublisher(username);
        await this.generateTokenAndLink(username);
      }
    },
  },
  watch: {
    async congId() {
      await this.fetch();
    },
  },
};
</script>
<style lang="sass" scoped>

</style>
