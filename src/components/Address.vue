<template>
  <div>
    <div class="row address-info m-0 p-4 align-items-center justify-content-center">
      <div class="address-title">
        <h3>{{ address.addr1 }}</h3>
        <h5>{{ address.city }}</h5>
      </div>
    </div>
      <!-- <h4>Notes</h4> -->
    <div class="row textfield pl-0 pr-0 pt-10 pb-10 m-0">
      <b-col cols="10">
        <b-form-input placeholder="add a tag..."
        maxlength="25" v-model="formText"
        v-on:keyup.enter="submitForm()">
        </b-form-input>
      </b-col>
      <b-col cols="2">
        <p class="counter">{{formText.length}}/25</p>
      </b-col>
      <b-alert fade v-model="showAlert" variant="danger">
        That note already exists!
      </b-alert>
    </div>
    <div class="notes-container">
      <transition-group name="list">
        <li v-for="(note, index) in notes" :key="note" class="notes-list">
          <div class="row align-items-center">
            <b-col cols='10'>
              {{ note }}
            </b-col>
            <b-col>
              <font-awesome-icon class="delete-button" icon="times" @click="deleteTag(index)"></font-awesome-icon>
            </b-col>
          </div>
        </li>
      </transition-group>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';

export default {
  name: 'Address',

  data() {
    return {
      addressId: this.$route.params.addressId,
      formText: '',
      notes: [],
      showAlert: false,
    };
  },

  async mounted() {
    await this.fetchAddress(this.addressId);
  },

  computed: {
    ...mapGetters({
      address: 'address/address',
    }),
  },
  methods: {
    ...mapActions({
      fetchAddress: 'address/fetchAddress',
    }),
    deleteTag(index) {
      this.notes.splice(index, 1);
    },
    submitForm() {
      if (this.formText) {
        if (!this.notes.includes(this.formText)) {
          this.notes.unshift(this.formText);
          this.formText = '';
        } else {
          this.showAlert = 2;
        }
      }
    },
  },
};

</script>

<style scoped>
.address-info {
  color: white;
  background-color: #007bff;
}
h3 {
  font-weight: 700;
}
h4 {
  color: #42b983;
  font-weight: 700;
}
.textfield {
  box-shadow: 0 0 6px 0 hsla(0, 0%, 0%, 0.2);
  padding: 20px 20px 0 20px;
}
input {
  padding: 0;
  margin-bottom: 10px;
  border: none;
  /* border-bottom: 1px solid lightgray; */
  border-radius: 0;
  box-shadow: none !important;
}
.counter {
  color: lightgray;
  margin-left: auto;
  padding-top: 10px;
}
.notes-container {
  overflow-x: hidden;
  overflow-y: scroll;
  height: 55%;
}
.notes-list {
  text-align: left;
  padding: 20px;
  overflow-wrap: break-word;
}
li {
  list-style: none;
}
.delete-button {
  float: right;
  color: rgb(201, 201, 201);
}

/* List item animation */
.list-enter-active, .list-leave-active {
  transition: all .3s;
}
.list-enter, .list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
