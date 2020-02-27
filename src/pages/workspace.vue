<template>
  <q-page padding>

    <div id='mymap'></div>

    <div v-if='groups.length'>
      <q-list bordered separated>
        <q-item v-for='group in groups' v-bind:key='group.num'>
          {{ group.num }}
          <q-list dense>
            <q-item v-for='frag in group.fragments' v-bind:key='frag.num'>
              {{ frag.id }} translate {{ frag.xf[3] }} {{ frag.xf[7] }}
            </q-item>
          </q-list>
        </q-item>
      </q-list>
    </div>

  </q-page>
</template>

<script>
// leaflet
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
// leaflet add-ons
import 'leaflet-tilelayer-mask/leaflet-tilelayer-mask.js'
import 'leaflet-toolbar/dist/leaflet.toolbar.js'
import 'leaflet-distortableimage/dist/leaflet.distortableimage.js'
import 'leaflet-toolbar/dist/leaflet.toolbar.css'
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
      width: 1920,
      height: 1200
    }
  },
  async mounted () {
    this.initMap()
    this.getWorkspace(this.id)
  },
  methods: {
    initMap () {
      let url = 'https://cdn.hipwallpaper.com/i/72/7/pPns49.png'
      let bounds = [[0, 0], [this.height, this.width]]
      this.map = L.map('mymap', {
        crs: L.CRS.Simple,
        minZoom: -1,
        maxZoom: 0
      })
      L.imageOverlay(url, bounds).addTo(this.map)
      this.map.fitBounds(bounds)
    },
    async getWorkspace (id) {
      let url = new URL('http://localhost:8080/workspace')
      url.searchParams.append('id', id)
      let response = await this.fetchAsync(url)
      this.groups = response.groups

      this.groups.forEach(group => {
        group.fragments.forEach(frag => {
          // let starty = this.height / 2 + group.xf[7] + frag.xf[7],
          //   startx = this.width / 2 + group.xf[3] + frag.xf[3]
          // let bounds = [[starty, startx], [starty + frag.h / 2, startx + frag.w / 2]]
          // L.imageOverlay(frag.url, bounds).addTo(this.map)
          // let corners = [
          //   L.LatLng(starty + frag.h / 2, startx),
          //   L.LatLng(starty + frag.h / 2, startx + frag.w / 2),
          //   L.LatLng(starty, startx),
          //   L.LatLng(starty, startx + frag.w / 2)
          // ]
          L.distortableImageOverlay(frag.url, {
            // corners: corners,
            actions: [L.RotateAction],
            mode: 'rotate'
          }).addTo(this.map)
        })
      })
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
