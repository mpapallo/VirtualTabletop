<template>
  <q-layout view="lHh lpR fFf">

    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn flat round icon="palette"
          v-go-back=" '/' "
        />
        <q-toolbar-title>
          Virtual Tabletop
        </q-toolbar-title>
      </q-toolbar>

      <q-tabs align="left">
        <q-route-tab to="/image" label="Select A Workspace" />
        <q-route-tab to="/page2" label="Page Two" />
        <q-route-tab to="/about" label="About" />
      </q-tabs>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>

  </q-layout>
</template>

<script>
export default {
  data () {
    return {
    }
  }
}
</script>
