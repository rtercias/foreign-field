<template>
  <div class="interaction pr-4" v-if="displayOnly || isTerritoryCheckedOut">
    <span v-for="(item, index) in list" :key="index">
      <span class="pl-0" v-if="item.type === 'button'">
        <b-button
          class="p-0"
          variant="link"
          v-if="value === item.value || value === undefined"
          @click="click(item.next)"
          :disabled="loading">
          {{ item.text || START }}
        </b-button>
      </span>
      <span class="pl-0" v-else-if="item.type === 'fa-icon'">
        <font-awesome-layers
          v-if="value === item.value"
          class="fa-3x"
          :class="item.class"
          @click="click(item.next)">
          <font-awesome-icon :icon="item.icon"></font-awesome-icon>
          <font-awesome-layers-text
            :value="item.text"
            class="nh-text text-white font-weight-bold">
          </font-awesome-layers-text>
        </font-awesome-layers>
      </span>
    </span>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import get from 'lodash/get';
import debounce from 'lodash/debounce';

export default {
  name: 'ActivityButton',
  props: [
    'value',
    'territory',
    'displayOnly',
  ],
  data() {
    return {
      list: [
        {
          type: 'fa-icon', value: 'START', text: '', icon: 'play-circle', class: 'text-success', next: 'NH',
        },
        {
          type: 'fa-icon', value: 'NH', text: 'NH', icon: 'circle', class: 'text-warning', next: 'HOME',
        },
        {
          type: 'fa-icon', value: 'HOME', text: '', icon: 'house-user', class: 'text-info', next: 'PH',
        },
        {
          type: 'fa-icon', value: 'PH', text: '', icon: 'phone', class: 'text-info', next: 'LW',
        },
        {
          type: 'fa-icon', value: 'LW', text: '', icon: 'envelope', class: 'text-info', next: 'NF',
        },
        {
          type: 'fa-icon', value: 'NF', text: 'NF', icon: 'circle', class: 'text-danger', next: 'START',
        },
      ],
    };
  },
  methods: {
    ...mapActions({
      addLog: 'address/addLog',
    }),

    click: debounce(async function (value) {
      if (!this.displayOnly) {
        this.$emit('button-click', value);
      }
    }, 500, { leading: true, trailing: false }),
  },
  computed: {
    ...mapGetters({
      loading: 'auth/loading',
    }),
    isTerritoryCheckedOut() {
      return get(this.territory, 'status.status') === 'Checked Out';
    },
  },
};
</script>
<style>
.nh-text {
  font-size: 0.5em;
}

.interaction {
  cursor: pointer;
  overflow: hidden;
}

@media print {
  .interaction {
    display: none;
  }
}
</style>
