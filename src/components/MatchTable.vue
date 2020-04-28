<template>
  <div v-if='matches.length'>
    <q-markup-table flat bordered separator='vertical'>
      <thead>
        <tr>
          <th class='text-left'>Match Num</th>
          <th class='text-left'>Src Fragment</th>
          <th class='text-left'>Tgt Fragment</th>
          <th class='text-left'>Status</th>
          <th class='text-left'>Comment</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for='match in matches' v-bind:key='match.num'>
          <td>{{ match.num }}</td>
          <td>{{ match.src }}</td>
          <td>{{ match.tgt }}</td>
          <td>{{ match.status }}</td>
          <td>{{ match.comment }}</td>
        </tr>
      </tbody>
    </q-markup-table>
  </div>
  <div v-else>
    <p>There are no match annotations for this workspace.</p>
  </div>
</template>

<script>
export default {
  name: 'MatchTable',
  props: {
    matches: {
      type: Array,
      required: true
    }
  }
}
</script>

<style>
tr:nth-child(even) { background-color: #f2f2f2; }
</style>
