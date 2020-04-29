<template>
  <div class='q-px-md q-pb-xl'>

    <h4>crates/</h4>
    <div class="q-px-sm row items-start q-gutter-md" v-if='crates.length'>
      <q-card v-for='crate in crates' v-bind:key='crate'>
        <q-card-section class="bg-primary text-white">
          <div class="text-h6">{{ crate }}</div>
        </q-card-section>
        <q-separator />
        <q-card-actions align='right'>
          <router-link :to="{ name: 'Workspace', params: { id: crate, folder: 'crates' } }">View</router-link>
        </q-card-actions>
      </q-card>
    </div>

    <h4>matches/</h4>
    <div class="q-px-sm row items-start q-gutter-md" v-if='browseMatches.length'>
      <q-card v-for='bmatch in browseMatches' v-bind:key='bmatch'>
        <q-card-section class="bg-primary text-white">
          <div class="text-h6">{{ bmatch }}</div>
        </q-card-section>
        <q-separator />
        <q-card-actions align='right'>
          <router-link :to="{ name: 'Workspace', params: { id: bmatch, folder: 'matches' } }">View</router-link>
        </q-card-actions>
      </q-card>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Selection',
  components: {
  },
  data () {
    return {
      crates: [],
      browseMatches: []
    }
  },
  async mounted () {
    this.fetchWorkspaces(this.crates, 'crates')
    this.fetchWorkspaces(this.browseMatches, 'matches')
  },
  methods: {
    async fetchWorkspaces (list, folder) {
      try {
        const url = new URL('http://localhost:8080/get-workspaces/')
        url.searchParams.append('folder', folder)
        let response = await fetch(url)
        let data = await response.json()
        data.workspaces.forEach(w => {
          list.push(w.substr(0, w.length - 4))
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
