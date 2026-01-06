import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import SettingsDimensions from '../views/SettingsDimensions.vue';
import SettingsDocTypes from '../views/SettingsDocTypes.vue';
import SettingsDesktop from '../views/SettingsDesktop.vue';
import SettingsTagValues from '../views/SettingsTagValues.vue';
import HelpView from '../views/HelpView.vue';
import AboutView from '../views/AboutView.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: HomeView
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
  },
  {
    path: '/settings/desktop',
    name: 'SettingsDesktop',
    component: SettingsDesktop
  },
  {
    path: '/settings/tag-values',
    name: 'SettingsTagValues',
    component: SettingsTagValues
  },
  {
    path: '/help',
    name: 'Help',
    component: HelpView
  },
  {
    path: '/settings/about',
    name: 'About',
    component: AboutView
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
