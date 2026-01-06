<template>
  <div class="bg-white shadow rounded-lg p-6">
    <div class="mb-6">
      <SettingsNav />
      <h2 class="text-2xl font-bold text-gray-900">关于</h2>
    </div>
    <div class="prose prose-indigo prose-lg max-w-none" v-html="renderedContent"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import SettingsNav from '../components/SettingsNav.vue';
import MarkdownIt from 'markdown-it';
// Import the markdown file as raw text
import aboutRaw from '../../../docs/ABOUT.md?raw';
// Import version from package.json
import pkg from '../../package.json';

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
});

const contentWithVersion = aboutRaw.replace('{{VERSION}}', pkg.version);

const renderedContent = computed(() => {
  return md.render(contentWithVersion);
});
</script>
