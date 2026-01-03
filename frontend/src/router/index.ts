import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import ModelDetailView from '../views/ModelDetailView.vue';
import SettingsDimensions from '../views/SettingsDimensions.vue';
import SettingsDocTypes from '../views/SettingsDocTypes.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: HomeView
  },
  {
    path: '/model/:id',
    name: 'ModelDetail',
    component: ModelDetailView,
    props: true
  },
  {
    path: '/settings/dimensions',
    name: 'SettingsDimensions',
    component: SettingsDimensions
  },
  {
    path: '/settings/doc-types',
    name: 'SettingsDocTypes',
    component: SettingsDocTypes
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
