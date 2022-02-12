import Pusher from 'pusher-js';

export class Subscription {
  constructor() {
    this.init();
    this.subscriptions = [];

    const isCollaborate = sessionStorage.getItem('collaborate') === 'true';
    if (isCollaborate) {
      this.connect();
    } else {
      this.disconnect();
    }
  }

  init() {
    this.pusher = new Pusher(process.env.VUE_APP_PUSHER_KEY, {
      cluster: 'us2',
    });
  }

  connect() {
    this.channel = this.pusher.subscribe('foreign-field');
  }

  disconnect() {
    this.channel = null;
    this.pusher.disconnect();
  }

  bind(eventName, callback) {
    if (this.channel) {
      this.channel.bind(eventName, callback);
    }
    this.subscriptions.push({ eventName, callback });
    console.log('subscriptions', this.subscriptions);
  }
}
