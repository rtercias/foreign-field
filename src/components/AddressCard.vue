<template>
  <div class="row justify-content-between">
    <p class="address">
      {{address.addr1}} {{address.addr2}}<br/>
      {{address.city}} {{address.state}} {{address.postalCode}}<br/>
      {{address.notes}}
    </p>
    <div class="interaction">
      <font-awesome-icon class="text-primary response pr-2" v-if="selectedResponse==='home'" icon="home" @click="nextResponse(1)"></font-awesome-icon>
      <font-awesome-icon class="text-primary response pr-2" v-if="selectedResponse==='minus-circle'" icon="minus-circle" @click="nextResponse(2)"></font-awesome-icon>
      <font-awesome-icon class="text-success response pr-2" v-if="selectedResponse==='smile'" icon="smile" @click="nextResponse(3)"></font-awesome-icon>
      <font-awesome-icon class="text-warning response pr-2" v-if="selectedResponse==='frown'" icon="frown" @click="nextResponse(4)"></font-awesome-icon>
      <font-awesome-icon class="text-danger response pr-2" v-if="selectedResponse==='angry'" icon="angry" @click="nextResponse(0)"></font-awesome-icon>
      <span :class="{animate: animate}" class="response-text">{{responseText}}</span>
    </div>
  </div>
</template>
<script>
const responses = ['home', 'minus-circle', 'smile', 'frown', 'angry'];
const responseTexts = ['start', 'not home', 'interested', 'not interested', 'angry'];

export default {
  name: 'AddressCard',
  props: ['address'],
  data() {
    return {
      storageId: `address-response-${this.address.id}`,
      selectedResponse: '',
      responseText: '',
      animate: false,
    }
  },
  methods: {
    nextResponse(index) {
      this.selectedResponse = responses[index];
      this.responseText = responseTexts[index];
      window.localStorage.setItem(this.storageId, this.selectedResponse);

      this.animate = true;
      setTimeout(() => {
        this.animate = false;
      }, 3000);
    }
  },
  mounted() {
    this.selectedResponse = window.localStorage.getItem(this.storageId) || 'home';
    const index = responses.findIndex(t => t === this.selectedResponse);
    this.responseText = responseTexts[index];
  }
}
</script>
<style scoped>
.address {
  text-align: left;
}
.response {
  cursor: pointer;
  font-size: 4em;
  z-index: 1;
  opacity: 0.8;
}

@keyframes bottomFadeOut {
  0% {
    position: absolute;
    bottom: 0;
    opacity: 0;
    z-index: 2;
  }
  75% {
    position: absolute;
    bottom: 50%;
    opacity: 0.8;
    z-index: 2;
  }
  100% {
    position: absolute;
    top: 0;
    opacity: 0;
    z-index: 2;
  }
}

.response-text {
  font-weight: bold;
  font-size: 1rem;
  position: absolute;
  right: 0;
  bottom: 0;
  opacity: 0;
  width: 5.2rem;
  text-align: center;
  z-index: 0;
  color: black;
}
.animate {
  animation-name: bottomFadeOut;
  animation-duration: 5s;
  animation-delay: 0s;
  text-align: center;
}
.fa-home {
  margin-right: -3px;
}

@media print {
  .interaction {
    display: none;
  }
}

</style>

