<template>
  <table class="assignment-report">
    <thead>
      <tr><td>
        <h3 class="font-weight-bold">Territory Assignment Record (S-13)</h3>
      </td></tr>
    </thead>
    <tbody>
      <tr v-for="(group, groupIndex) in groupedRecords" :key="groupIndex">
        <td>
          <div class="flex justify-content-center">
            <div class="box-group">
              <div class="text-left font-weight-bold">Terr. No. {{ group[0].territory_name }}</div>
              <div class="" v-for="(record, recordIndex) in group" :key="recordIndex">
                <div class="box box-main flex">
                  <div class="box box-1">{{ record.publisher_name }}</div>
                  <div class="row-2">
                    <div class="box box-2">{{ record.out }}</div>
                    <div class="box box-3">{{ record.in }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </td>
      </tr>
    </tbody>
    <tfoot></tfoot>
  </table>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import groupBy from 'lodash/groupBy';
import format from 'date-fns/format';

export default {
  name: 'AssignmentReport',
  props: ['id'],
  async mounted() {
    await this.fetchAssignmentRecords(this.id);
  },
  methods: {
    ...mapActions({
      fetchAssignmentRecords: 'reports/fetchAssignmentRecords',
    }),
  },
  computed: {
    ...mapGetters({
      assignmentRecords: 'reports/assignmentRecords',
      loading: 'auth/loading',
    }),
    groupedRecords() {
      return groupBy(this.assignmentRecords, 'territory_name');
    },
    reportDate() {
      return format(new Date(), 'MM/dd/yyyy p');
    },
  },
};
</script>

<style scoped>
  thead { display: table-header-group; }
  tfoot { display: table-footer-group; }
  .assignment-report tr {
    display: inline-block;
    vertical-align: top;
  }
  .assignment-report td {
    padding: 0;
  }
  .flex {
    display: flex;
    flex-wrap: wrap;
  }
  .box-group {
    margin: 20px 0 70px 0;
    position: relative;
    top: 50px;
  }
  .page-break {
    display: none;
  }
  .box-main {
    flex-direction: column;
    border: 1px solid;
    margin: -1px 0 0 -1px;
    width: 195px;
    height: 60px;
  }
  .row-2 {
    display: flex;
  }
  .box-1 {
    border-bottom: 1px solid;
    min-height: 30px;
  }
  .box-2 {
    width: 95px;
    min-height: 28px;
    border-right: 1px solid;
  }
  .box-3 {
    width: 95px;
    min-height: 28px;
  }
</style>
