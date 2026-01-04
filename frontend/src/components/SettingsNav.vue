<template>
  <nav class="flex space-x-4 border-b border-gray-200 mb-6 pb-2 overflow-x-auto">
    <router-link 
      to="/settings/dimensions" 
      class="text-sm font-medium transition-colors duration-200"
      :class="[$route.path === '/settings/dimensions' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700']"
    >
      维度设置
    </router-link>
    <router-link 
      to="/settings/doc-types" 
      class="text-sm font-medium transition-colors duration-200"
      :class="[$route.path === '/settings/doc-types' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700']"
    >
      文档类型
    </router-link>
    <router-link 
      to="/settings/desktop" 
      class="text-sm font-medium transition-colors duration-200"
      :class="[$route.path === '/settings/desktop' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700']"
    >
      桌面设置
    </router-link>
    <router-link 
      to="/settings/about" 
      class="text-sm font-medium transition-colors duration-200"
      :class="[$route.path === '/settings/about' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700']"
    >
      关于
    </router-link>
  </nav>
</template>
