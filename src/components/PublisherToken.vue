<template>
  <div class="p-5 text-left">
    <div v-if="publisherToken">
      <h4>Help {{publisherName || username}} log in to Foreign Field</h4>
      <div class="mt-5 mb-2">
        <div>Enter {{publisher.firstname}}'s phone number and send them a login link:</div>
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
      <b-button @click="sendLink">
          <font-awesome-icon class="text-primary d-xl-none" icon="sms" size="sm" />
          Send Link
        </b-button>
      <div class="mt-5 mb-2">
        Or copy the link below and send it to them some other way.
        <div class="font-weight-bold font-italic text-break">{{shortLink}}</div>
      </div>
      <b-button variant="light" @click="copyLink">
        <font-awesome-icon class="text-primary d-xl-none mr-1" icon="copy" size="sm" />
        <span v-if="isCopied">Copied!</span>
        <span v-else>Copy Link</span>
      </b-button>
    </div>
    <div v-else>Token not available.</div>
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
    };
  },
  async mounted() {
    if (this.username) {
      await this.generateTokenAndLink();
    }
  },
  computed: {
    ...mapGetters({
      publisherToken: 'auth/publisherToken',
      shortLink: 'auth/shortLink',
      isDesktop: 'auth/isDesktop',
      publisher: 'publisher/publisher',
    }),
    username() {
      return this.$route.query.username;
    },
    publisherName() {
      return displayName(this.publisher);
    },
    link() {
      return `${window.location.origin}?token=${this.publisherToken}`;
    },
  },
  methods: {
    ...mapActions({
      generatePublisherToken: 'auth/generatePublisherToken',
      generateShortLink: 'auth/generateShortLink',
      fetchPublisherByUsername: 'publisher/fetchPublisherByUsername',
      sendSMS: 'auth/sendSMS',
    }),
    async generateTokenAndLink() {
      await this.fetchPublisherByUsername(this.username);
      await this.generatePublisherToken(this.username);
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
    },
  },
};
</script>
<style lang="sass" scoped>

</style>
