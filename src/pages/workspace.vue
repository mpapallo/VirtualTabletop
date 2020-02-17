<template>
  <q-page padding>
    <!-- content -->
    <h4>{{ request }}</h4>
    <q-btn label='WDC17'
        @click='getWorkspace'
    />
    <q-img
      :src='url'
      spinner_color='primary'
    />
  </q-page>
</template>

<script>
export default {
  name: 'Workspace',
  data () {
    return {
      request: 'nothin',
      url: ''
    }
  },
  methods: {
    async getWorkspace () {
      this.request = 'workspace'
      let url = new URL('http://localhost:8080/workspace')
      url.searchParams.append('id', 'WDC17')
      let response = await this.fetchAsync(url)
      this.url = response.image_url
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
