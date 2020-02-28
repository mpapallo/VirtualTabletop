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
import { matrix, multiply } from 'mathjs'
// leaflet
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
// leaflet add-ons
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
      const url = 'https://cdn.hipwallpaper.com/i/72/7/pPns49.png'
      const bounds = [[0, 0], [this.height, this.width]]
      this.map = L.map('mymap', {
        crs: L.CRS.Simple,
        minZoom: -1,
        maxZoom: 0
      })
      L.imageOverlay(url, bounds).addTo(this.map)
      this.map.fitBounds(bounds)
    },
    async getWorkspace (id) {
      const url = new URL('http://localhost:8080/workspace')
      url.searchParams.append('id', id)
      const response = await this.fetchAsync(url)
      this.groups = response.groups

      this.groups.forEach(group => {
        group.fragments.forEach(frag => {
          const xcenter = this.width / 2
          const ycenter = this.height / 2
          const points = [
            [0 - frag.w / 4, 0 + frag.h / 4, 0, 1],
            [0 + frag.w / 4, 0 + frag.h / 4, 0, 1],
            [0 - frag.w / 4, 0 - frag.h / 4, 0, 1],
            [0 + frag.w / 4, 0 - frag.h / 4, 0, 1]
          ]
          const newxf = this.multiplyMatrices(group.xf, frag.xf)
          const corners = []
          points.forEach(p => {
            const result = this.multiplyMatrixAndPoint(newxf, p)
            // points in leaflet are (lat, lng) so basically (y, x)
            corners.push([result[1] + ycenter, result[0] + xcenter])
          })
          // make sure whatever server is serving up these images can handle CORS stuff
          L.distortableImageOverlay(frag.url, {
            corners: corners,
            actions: [L.RotateAction], // does RevertAction work too?
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
    },
    // https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Matrix_math_for_the_web
    multiplyMatrixAndPoint (matrixObj, point) {
      const m = matrixObj._data
      // Now set some simple names for the point
      let x = point[0],
        y = point[1],
        z = point[2],
        w = point[3]
      let resultX = (x * m[0][0]) + (y * m[0][1]) + (z * m[0][2]) + (w * m[0][3])
      let resultY = (x * m[1][0]) + (y * m[1][1]) + (z * m[1][2]) + (w * m[1][3])
      let resultZ = (x * m[2][0]) + (y * m[2][1]) + (z * m[2][2]) + (w * m[2][3])
      let resultW = (x * m[3][0]) + (y * m[3][1]) + (z * m[3][2]) + (w * m[3][3])
      return [resultX, resultY, resultZ, resultW]
    },
    multiplyMatrices (matrixA, matrixB) {
      const A = matrix([
        [matrixA[0], matrixA[1], matrixA[2], matrixA[3]],
        [matrixA[4], matrixA[5], matrixA[6], matrixA[7]],
        [matrixA[8], matrixA[9], matrixA[10], matrixA[11]],
        [matrixA[12], matrixA[13], matrixA[14], matrixA[15]]
      ])
      const B = matrix([
        [matrixB[0], matrixB[1], matrixB[2], matrixB[3]],
        [matrixB[4], matrixB[5], matrixB[6], matrixB[7]],
        [matrixB[8], matrixB[9], matrixB[10], matrixB[11]],
        [matrixB[12], matrixB[13], matrixB[14], matrixB[15]]
      ])
      return multiply(A, B)
    }
  }
}
</script>

<style>
#mymap {
  height: 700px;
  width: 90%;
  border: 1px solid;
  margin-top: 50px;
  margin-bottom: 50px;
}
</style>
