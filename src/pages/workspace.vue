<template>
  <q-page padding>
    <div>
      <q-btn
        :label='id'
        @click='getWorkspace'
      />
    </div>
    <div align='center' v-if='groups.length'>

      <l-map
        id='mymap'
        :crs='crs'
        :center='center'
      >
      <l-image-overlay
        :url='url'
        :bounds='bounds'
        :center='center'
      />
      </l-map>

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
// import L from 'leaflet'
import { CRS } from 'leaflet'
import { LMap, LImageOverlay } from 'vue2-leaflet'
import 'leaflet/dist/leaflet.css'

export default {
  name: 'Workspace',
  components: {
    LMap,
    LImageOverlay
  },
  data () {
    return {
      id: 'WDC17',
      groups: [],
      url: '',
      crs: CRS.Simple,
      bounds: null,
      center: [0, 0]
    }
  },
  methods: {
    async getWorkspace () {
      let url = new URL('http://localhost:8080/workspace')
      url.searchParams.append('id', this.id)
      let response = await this.fetchAsync(url)
      this.groups = response.groups
      this.url = this.groups[0].fragments[0].url
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

<style>
#mymap {
  height: 500px;
  width: 80%;
  border: 1px solid;
  margin-top: 50px;
  margin-bottom: 50px;
}
</style>
