
const routes = [
  {
    path: '/',
    component: () => import('layouts/basic.vue'),
    children: [
      { path: '', component: () => import('pages/Index.vue') },
      { path: '/about', component: () => import('pages/about.vue') },
      { path: '/workspace', name: 'Workspace', component: () => import('pages/workspace.vue'), props: true },
      { path: '/select', component: () => import('pages/selection.vue') }
    ]
  }
]

// Always leave this as last one
if (process.env.MODE !== 'ssr') {
  routes.push({
    path: '*',
    component: () => import('pages/Error404.vue')
  })
}

export default routes
