<template>
  <q-page padding>

    <div class="q-pa-md row items-start q-gutter-md" v-if='crates.length'>

      <q-card v-for='crate in crates' v-bind:key='crate'>
        <q-card-section class="bg-primary text-white">
          <div class="text-h6">{{ crate }}</div>
        </q-card-section>
        <q-separator />
        <q-card-actions align='right'>
          <router-link :to="{ name: 'Workspace', params: { id: crate} }">View</router-link>
        </q-card-actions>
      </q-card>

    </div>
  </q-page>
</template>

<script>
export default {
  name: 'Selection',
  components: {
  },
  data () {
    return {
      crates: []
    }
  },
  async mounted () {
    this.fetchWorkspaces()
  },
  methods: {
    async fetchWorkspaces () {
      try {
        let response = await fetch('http://localhost:3000/get-crates/')
        let data = await response.json()
        data.crates.forEach(crate => {
          this.crates.push(crate.substr(0, crate.length - 4))
        })
      } catch (e) {
        console.error(e)
      }
    }
  }
}
</script>

<style>
</style>
