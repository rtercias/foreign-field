import Pusher from 'pusher-js';
import { store } from '../store';
import { mutationMapper } from './mutationMapper';

export class Subscription {
  constructor() {
    this.init();

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
    } else {
      store.subscribe((mutation) => {
        if (mutation.type === mutationMapper(eventName)) {
          callback(mutation.payload);
        }
      });
    }
  }
}
