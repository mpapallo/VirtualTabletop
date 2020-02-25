<template>
  <q-page padding>
    <div>
      <q-btn
        :label='id'
        @click='getWorkspace'
      />
    </div>

    <div id='mymap'></div>

    <div v-if='groups.length'>
      <q-list bordered separated>
        <q-item v-for='group in groups' v-bind:key='group.num'>
          {{ group.num }}
          <q-list dense>
            <q-item v-for='frag in group.fragments' v-bind:key='frag.num'>
              {{ frag.id }} : translation [{{ frag.translx }}, {{ frag.transly }}]
            </q-item>
          </q-list>
        </q-item>
      </q-list>
    </div>

  </q-page>
</template>

<script>
// leaflet components
import L from 'leaflet'
// import 'leaflet-distortableimage/src/DistortableImageOverlay.js'
// leaflet style
import 'leaflet/dist/leaflet.css'
import 'leaflet-distortableimage/dist/leaflet.distortableimage.css'

export default {
  name: 'Workspace',
  components: {
  },
  data () {
    return {
      id: 'WDC17',
      groups: [],
      map: null,
      bg: null,
      img: null
    }
  },
  mounted () {
    this.initMap()
  },
  methods: {
    initMap () {
      let url = 'https://cdn.hipwallpaper.com/i/72/7/pPns49.png'
      this.map = L.map('mymap', {
        crs: L.CRS.Simple,
        minZoom: -1,
        maxZoom: 0
      })
      let bounds = [[0, 0], [1200, 1920]]
      L.imageOverlay(url, bounds).addTo(this.map)
      this.map.fitBounds(bounds)
    },
    async getWorkspace () {
      let url = new URL('http://localhost:8080/workspace')
      url.searchParams.append('id', this.id)
      let response = await this.fetchAsync(url)
      this.groups = response.groups
      let frag = this.groups[0].fragments[0]
      // console.log(frag.translx, frag.transly)
      // need height and width of image to get proper bounds?
      let w = 580 + frag.translx,
        h = 670 + frag.transly
      let bounds = [[frag.transly, frag.translx], [h, w]]
      L.imageOverlay(frag.url, bounds).addTo(this.map)
      // L.distortableImageOverlay(frag.url).addTo(this.map)
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
  height: 600px;
  width: 90%;
  border: 1px solid;
  margin-top: 50px;
  margin-bottom: 50px;
}
</style>
