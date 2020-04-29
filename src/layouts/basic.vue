<template>
  <q-layout view="lHh lpR fFf">

    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn flat round icon="home"
          v-go-back=" '/' "
        />
        <q-toolbar-title>
          Virtual Tabletop
        </q-toolbar-title>
        <q-tabs align="right">
          <q-route-tab to="/select" label="Select A Workspace" />
          <q-route-tab to="/about" label="About" />
        </q-tabs>
      </q-toolbar>

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
