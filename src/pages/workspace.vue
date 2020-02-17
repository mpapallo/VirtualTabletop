<template>
  <q-page padding>
    <!-- content -->
    <h4>{{ request }}</h4>
    <q-btn label='WDC17'
        @click='getWorkspace'
    />
    <div v-if='groups'>
      <q-list bordered separated>
        <q-item v-for='group in groups' v-bind:key='group.num'>
          {{ group.num }}
          <q-list dense>
            <q-item v-for='frag in group.fragments' v-bind:key='frag.num'>
              {{ frag.id }}
            </q-item>
          </q-list>
        </q-item>
      </q-list>
    </div>
  </q-page>
</template>

<script>
export default {
  name: 'Workspace',
  data () {
    return {
      request: 'nothin',
      groups: []
    }
  },
  methods: {
    async getWorkspace () {
      this.request = 'workspace'
      let url = new URL('http://localhost:8080/workspace')
      url.searchParams.append('id', 'WDC17')
      let response = await this.fetchAsync(url)
      this.groups = response.groups
    },
    async fetchAsync (url) {
      try {
        let response = await fetch(url)
        let data = await response.json()
        return data
      } catch (e) {
        console.error(e)
      }
    }
  }
}
</script>
