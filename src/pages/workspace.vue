<template>
  <div class='q-px-lg'>
    <h4>{{folder}}/{{ id }}</h4>

    <q-btn color='primary' style='margin-bottom: 10px'
      label='How To Use'
      @click='howto = true' />
    <q-dialog v-model='howto'>
      <q-card>
        <q-card-section>
          <div class='text-h5'>Tips for map interaction</div>
        </q-card-section>
        <q-card-section>
          <q-list separator>
            <q-item-label>Labels</q-item-label>
            <q-item-label caption>Use map layer control in top right corner to toggle labels on and off</q-item-label>
            <q-item-label>Actions</q-item-label>
            <q-item-label caption>Select an image, drag to move or use red handles to rotate</q-item-label>
            <q-item-label>Bulk Actions</q-item-label>
            <q-item-label caption>Hold shift and select multiple images, drag to move or use input box on right to rotate</q-item-label>
            <q-item-label>Undo</q-item-label>
            <q-item-label caption>Use undo button on right to restore original positions</q-item-label>
          </q-list>
        </q-card-section>
        <q-card-actions align='right'>
          <q-btn flat label='OK' color='primary' v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <div class='row justify-between'>

      <div class='col-10' id='mymap'></div>

      <div class='col-md-2'>
        <q-btn color='primary' size='lg' class='q-mx-sm q-mb-lg'
          label='Undo Changes'
          @click='restoreOriginalPositions' />
        <q-input filled type='number' class='q-ma-sm'
          label='Degrees'
          v-model.number='degrees' />
        <q-btn outline color='primary' class='q-ma-sm'
          label='Rotate Selected'
          @click='rotateSelectedImages' />
      </div>
    </div>

    <div class='row'>
    <div class='col-10'>
      <q-card>
        <q-tabs active-color='primary' indicator-color='primary' align='justify' v-model='tab' >
          <q-tab name='matches' label='Matches' />
          <q-tab name='groups' label='Groups' />
        </q-tabs>
        <q-separator />
        <q-tab-panels v-model='tab' animated>
          <q-tab-panel name='matches'>
            <MatchTable :matches='matches'></MatchTable>
          </q-tab-panel>
          <q-tab-panel name='groups'>
            <GroupTable :groups='groups' :ungrouped='ungrouped'></GroupTable>
          </q-tab-panel>
        </q-tab-panels>
      </q-card>
    </div>
    </div>
  </div>
</template>

<script>
import MatchTable from 'components/MatchTable.vue'
import GroupTable from 'components/GroupTable.vue'

import { matrix, multiply, sin, cos, unit } from 'mathjs'
// leaflet and plugins
// import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-toolbar/dist/leaflet.toolbar.css'
import 'leaflet-distortableimage/dist/leaflet.distortableimage.css'
const L = require('leaflet')
require('leaflet-toolbar')
require('leaflet-distortableimage')

export default {
  name: 'Workspace',
  components: {
    MatchTable,
    GroupTable
  },
  props: {
    id: {
      type: String,
      required: true
    },
    folder: {
      type: String,
      required: true
    }
  },
  data () {
    return {
      WORKSPACE_SERVER: 'http://localhost:8080/workspace',
      width: 7680,
      height: 4800,
      degrees: 0,
      tab: 'matches',
      howto: false,
      // store fetched workspace info
      groups: [],
      ungrouped: [],
      matches: [],
      // store map info
      map: null,
      imageGroup: null,  // L.distortableCollection
      fragments: {},     // { fragID: { url, origPosition } }
      corners: {},       // { fragID: [L.LatLng x 4] }
      labels: null,      // L.layerGroup
      annotations: null, // L.layerGroup
      control: null       // L.control.layers
    }
  },
  async mounted () {
    this.initMap()
    await this.fetchWorkspace()
    this.createTabletop()
  },
  methods: {
    initMap () {
      const url = 'https://cdn.hipwallpaper.com/i/72/7/pPns49.png'
      const bounds = [[0, 0], [this.height, this.width]]
      this.map = L.map('mymap', {
        crs: L.CRS.Simple,
        minZoom: -3,
        maxZoom: 0
      })
      L.imageOverlay(url, bounds).addTo(this.map)
      this.map.fitBounds(bounds)
      this.control = L.control.layers().addTo(this.map)
      this.map.on('overlayadd', this.repopulateAllLabels, this)
    },
    async fetchWorkspace () {
      const url = new URL(this.WORKSPACE_SERVER)
      url.searchParams.append('folder', this.folder)
      url.searchParams.append('id', this.id)
      const data = await this.fetchAsync(url)
      this.groups = data.groups
      this.ungrouped = data.fragments
      this.matches = data.matches
    },
    createTabletop () {
      this.groups.forEach(group => {
        group.fragments.forEach(frag => {
          const newxf = multiply(this.convertToMatrixObj(group.xf), this.convertToMatrixObj(frag.xf))
          this.extractFragmentInfo(frag, newxf)
        })
      })
      this.ungrouped.forEach(frag => {
          this.extractFragmentInfo(frag, this.convertToMatrixObj(frag.xf))
      })
      this.repopulateImages()
      this.createLabels()
      this.createAnnotations()
    },
    extractFragmentInfo (frag, xf) {
      // apply given transformation (from original xml file) to img corners
      const xcenter = this.width / 4
      const ycenter = this.height / 4
      const points = [
        [0 - frag.w / 4, 0 + frag.h / 4, 0, 1],
        [0 + frag.w / 4, 0 + frag.h / 4, 0, 1],
        [0 - frag.w / 4, 0 - frag.h / 4, 0, 1],
        [0 + frag.w / 4, 0 - frag.h / 4, 0, 1]
      ]
      const corners = []
      points.forEach(p => {
        const result = this.multiplyMatrixAndPoint(xf, p)
        // points in leaflet are (lat, lng) so basically (y, x)
        corners.push(L.latLng(result[1] + ycenter, result[0] + xcenter))
      })
      this.fragments[frag.id] = {
        url: frag.url,
        origPosition: corners
      }
    },
    copyCorners () {
      // need to make a copy of original image coords so we can undo changes later
      for (const frag in this.fragments) {
        const coords = this.fragments[frag].origPosition
        let t = []
        coords.forEach(p => {
          t.push(L.latLng(p.lat, p.lng))
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
        img.on('update', this.repopulateAllLabels, this)
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
      this.control.addOverlay(this.labels, 'Labels')
    },
    createAnnotations () {
      this.annotations = L.layerGroup().addTo(this.map)
      this.matches.forEach(point => {
        // create match annotation label as permanent tooltip
        const targetCorners = this.corners[point.tgt]
        const mid1 = this.getAveragePoint(targetCorners)
        const sourceCorners = this.corners[point.src]
        const mid2 = this.getAveragePoint(sourceCorners)
        const line = L.polyline([mid1, mid2])
        line.bindTooltip(point.comment, { permanent: true, className: 'match-' + point.status, direction: 'top' })
        this.annotations.addLayer(line)
      })
      this.control.addOverlay(this.annotations, 'Match Info')
    },
    repopulateAllLabels () {
      if (this.map.hasLayer(this.labels)) {
        this.labels.clearLayers()
        this.control.removeLayer(this.labels)
        this.createLabels()
      }
      if (this.map.hasLayer(this.annotations)) {
        this.annotations.clearLayers()
        this.control.removeLayer(this.annotations)
        this.createAnnotations()
      }
    },
    restoreOriginalPositions () {
      this.imageGroup.clearLayers()
      this.repopulateImages()
      this.repopulateAllLabels()
    },
    rotateSelectedImages () {
      const m = this.getRotationMatrix()
      let collected = []
      let midpoints = []
      this.imageGroup.eachLayer(image => {
        if (this.imageGroup.isCollected(image)) {
          collected.push(image)
          midpoints.push(this.getAveragePoint(image.getCorners()))
        }
      })
      const [rotLat, rotLng] = this.getAveragePointFromList(midpoints)
      collected.forEach(image => {
        const c = image.getCorners()
        let newCorners = []
        c.forEach(point => {
          const newLat = (point.lat - rotLat) * m[0] + (point.lng - rotLng) * m[1] + rotLat
          const newLng = (point.lat - rotLat) * m[2] + (point.lng - rotLng) * m[3] + rotLng
          newCorners.push(L.latLng(newLat, newLng))
        })
        image.setCorners(newCorners)
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
    getAveragePointFromList (coords) {
      let sumLat = 0,
        sumLng = 0
      coords.forEach(point => {
        sumLat += point[0]
        sumLng += point[1]
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
    getRotationMatrix () {
      const c = cos(unit(this.degrees, 'deg'))
      const s = sin(unit(this.degrees, 'deg'))
      return [c, s * -1, s, c]
    },
    convertToMatrixObj (m) {
      return matrix([
        [m[0], m[1], m[2], m[3]],
        [m[4], m[5], m[6], m[7]],
        [m[8], m[9], m[10], m[11]],
        [m[12], m[13], m[14], m[15]]
      ])
    }
  }
}
</script>

<style>
#mymap {
  height: 600px;
  border: 1px solid;
  margin-bottom: 30px;
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

tr:nth-child(even) { background-color: #f2f2f2; }
</style>
