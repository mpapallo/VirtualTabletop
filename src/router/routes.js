
const routes = [
  {
    path: '/',
    component: () => import('layouts/basic.vue'),
    children: [
      { path: '', component: () => import('pages/Index.vue') },
      { path: '/image', component: () => import('pages/image.vue') },
      { path: '/about', component: () => import('pages/about.vue') }
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
