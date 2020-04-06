<template>
  <q-page padding>

    <div class='row'>
      <q-btn color='primary' label='Undo Changes' @click=restoreOriginalPositions />
      <q-btn color='primary' label='Update Labels' @click=repopulateAllLabels />
      Degrees:
      <q-input
        v-model.number="degrees"
        type="number"
        filled
        style="max-width: 200px"
      />
      <q-btn color='primary' label='Rotate Selected' @click=rotateSelectedImages />
    </div>

    <div v-if='!matches.length'>
      <p>There are no match annotations for this workspace.</p>
    </div>

    <div id='mymap'></div>

    <div v-if='matches.length'>
      <q-list bordered separated>
        <q-item v-for='match in matches' v-bind:key='match.num'>
          Match {{ match.num }}: {{ match.src }} - {{ match.tgt }} ({{ match.status }})
        </q-item>
      </q-list>
    </div>

    <div v-if='groups.length'>
      <q-list bordered separated>
        <q-item v-for='group in groups' v-bind:key='group.num'>
           Group {{ group.num }}:
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
      WORKSPACE_SERVER: 'http://localhost:8080/workspace',
      id: 'WDC18',
      width: 3840, // 1920,
      height: 2400, // 1200,
      degrees: 0,
      // store fetched workspace info
      groups: [],
      matches: [],
      // store map info
      map: null,
      imageGroup: null,  // L.distortableCollection
      fragments: {},     // { fragID: { url, origPosition } }
      corners: {},       // { fragID: [] }
      labels: null,      // L.layerGroup
      annotations: null, // L.layerGroup
      control: null      // L.control.layers
    }
  },
  async mounted () {
    this.initMap()
    await this.fetchWorkspace(this.id)
    this.createTabletop()
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
      this.control = L.control.layers().addTo(this.map)
    },
    async fetchWorkspace (id) {
      const url = new URL(this.WORKSPACE_SERVER)
      url.searchParams.append('id', id)
      const response = await this.fetchAsync(url)
      this.groups = response.groups
      this.matches = response.matches
    },
    createTabletop () {
      this.groups.forEach(group => {
        group.fragments.forEach(frag => {
          // apply given transformation (from original xml file) to img corners
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
          this.fragments[frag.id] = {
            url: frag.url,
            origPosition: corners
          }
        })
      })
      this.repopulateImages()
      this.createLabels()
      this.createAnnotations()
    },
    copyCorners () {
      // need to make a copy of original image coords so we can undo changes later
      for (const frag in this.fragments) {
        const coords = this.fragments[frag].origPosition
        let t = []
        coords.forEach(p => {
          t.push(L.latLng(p[0], p[1]))
        })
        this.corners[frag] = t
      }
    },
    repopulateImages () {
      this.images = []
      this.copyCorners()
      this.imageGroup = L.distortableCollection({
        suppressToolbar: true
      }).addTo(this.map)
      for (const frag in this.fragments) {
        const corners = this.corners[frag]
        const img = L.distortableImageOverlay(this.fragments[frag].url, {
          corners: corners,
          actions: [L.RotateAction],
          mode: 'rotate',
          suppressToolbar: true
        })
        this.imageGroup.addLayer(img)
      }
    },
    createLabels () {
      this.labels = L.layerGroup().addTo(this.map)
      for (const frag in this.fragments) {
        const midpoint = this.getAveragePoint(this.corners[frag])
        // create fragment ID label as permanent tooltip
        const marker = L.marker(midpoint, { icon: L.divIcon(), opacity: 0.01 })
        marker.bindTooltip(frag, { permanent: true, className: 'my-label', direction: 'top' })
        this.labels.addLayer(marker)
      }
      this.control.addOverlay(this.labels, "Labels")
    },
    repopulateLabels () {
      this.labels.clearLayers()
      this.control.removeLayer(this.labels)
      this.createLabels()
    },
    createAnnotations () {
      this.annotations = L.layerGroup().addTo(this.map)
      this.matches.forEach(point => {
        // create match annotation label as permanent tooltip
        const targetCorners = this.corners[point.tgt]
        const mid1 = this.getAveragePoint(targetCorners)
        const sourceCorners = this.corners[point.src]
        const mid2 = this.getAveragePoint(sourceCorners)
        // const midpoint = this.getAveragePoint(targetCorners.concat(sourceCorners))
        // const marker = L.marker(midpoint, { icon: L.divIcon(), opacity: 0.01 })
        const line = L.polyline([mid1, mid2])
        line.bindTooltip(point.comment, { permanent: true, className: 'match-' + point.status, direction: 'top' })
        this.annotations.addLayer(line)
      })
      this.control.addOverlay(this.annotations, "Match Info")
    },
    repopulateAllLabels () {
      this.labels.clearLayers()
      this.annotations.clearLayers()
      this.control.removeLayer(this.labels)
      this.control.removeLayer(this.annotations)
      this.createLabels()
      this.createAnnotations()
    },
    restoreOriginalPositions () {
      this.imageGroup.clearLayers()
      this.repopulateImages()
      this.repopulateAllLabels()
    },
    rotateSelectedImages () {
      this.imageGroup.eachLayer(image => {
        if (this.imageGroup.isCollected(image)) {
          image.rotateBy(this.degrees, 'deg')
        }
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
    getAveragePoint (coords) {
      let sumLat = 0,
        sumLng = 0
      coords.forEach(point => {
        sumLat += point.lat
        sumLng += point.lng
      })
      return [sumLat / coords.length, sumLng / coords.length]
    },
    // https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Matrix_math_for_the_web
    multiplyMatrixAndPoint (matrixObj, point) {
      const m = matrixObj._data
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

.match-Yes {
  background: green;
  border: 1px solid green;
}
.match-Maybe {
  background: yellow;
  border: 1px solid yellow;
}
.match-No {
  background: red;
  border: 1px solid red;
}
</style>
