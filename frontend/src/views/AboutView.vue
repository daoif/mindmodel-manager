<template>
  <div class="prose prose-indigo prose-lg max-w-none" v-html="renderedContent"></div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
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
