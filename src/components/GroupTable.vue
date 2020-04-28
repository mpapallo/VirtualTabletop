<template>
  <q-markup-table flat bordered separator='vertical'>
    <thead>
      <tr>
        <th class='text-left'>Group</th>
        <th class='text-left'>Fragments</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for='group in groups' v-bind:key='group.num'>
        <td>Group {{ group.num }}</td>
        <td>
          <q-list dense>
            <q-item v-for='frag in group.fragments' v-bind:key='frag.num'>
              {{ frag.id }}
            </q-item>
          </q-list>
        </td>
      </tr>
      <tr v-if='ungrouped.length'>
        <td>Ungrouped</td>
        <td>
          <q-list dense>
            <q-item v-for='frag in ungrouped' v-bind:key='frag.num'>
              {{ frag.id }}
            </q-item>
          </q-list>
        </td>
      </tr>
    </tbody>
  </q-markup-table>
</template>

<script>
export default {
  name: 'GroupTable',
  props: {
    groups: {
      type: Array,
      required: true
    },
    ungrouped: {
      type: Array,
      required: true
    }
  }
}
</script>
