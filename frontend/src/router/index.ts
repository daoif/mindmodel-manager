import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import ModelDetailView from '../views/ModelDetailView.vue';
import ModelEditView from '../views/ModelEditView.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: HomeView
  },
  {
    path: '/model/new',
    name: 'ModelCreate',
    component: ModelEditView
  },
  {
    path: '/model/:id',
    name: 'ModelDetail',
    component: ModelDetailView,
    props: true
  },
  {
    path: '/model/:id/edit',
    name: 'ModelEdit',
    component: ModelEditView,
    props: true
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
