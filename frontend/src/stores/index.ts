import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { MindModel, NavigationNode, TagDimension, DocType } from '../types';
import { modelApi, navigationApi, configApi } from '../api';

export const useMainStore = defineStore('main', () => {
  const models = ref<MindModel[]>([]);
  const navigationTree = ref<NavigationNode[]>([]);
  const dimensions = ref<TagDimension[]>([]);
  const docTypes = ref<DocType[]>([]);
  const loading = ref(false);

  // 当前选中的导航节点过滤规则
  const currentFilter = ref<{ dimension: string; value: string } | null>(null);

  const fetchNavigation = async () => {
    try {
      navigationTree.value = await navigationApi.getTree();
    } catch (error) {
      console.error('获取导航失败', error);
    }
  };

  const fetchModels = async () => {
    loading.value = true;
    try {
      models.value = await modelApi.list();
    } catch (error) {
      console.error('获取模型列表失败', error);
    } finally {
      loading.value = false;
    }
  };

  const fetchConfig = async () => {
    try {
      dimensions.value = await configApi.getDimensions();
      docTypes.value = await configApi.getDocTypes();
    } catch (error) {
      console.error('获取配置失败', error);
    }
  };

  const init = async () => {
    await Promise.all([fetchConfig(), fetchNavigation(), fetchModels()]);
  };

  const setFilter = (rule: { dimension: string; value: string } | null) => {
    currentFilter.value = rule;
  };

  return {
    models,
    navigationTree,
    dimensions,
    docTypes,
    loading,
    currentFilter,
    fetchNavigation,
    fetchModels,
    fetchConfig,
    init,
    setFilter
  };
});
