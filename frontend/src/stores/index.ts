import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import type { MindModel, NavigationNode, TagDimension, DocType } from '../types';
import { modelApi, navigationApi, configApi } from '../api';

export const useMainStore = defineStore('main', () => {
  const models = ref<MindModel[]>([]);
  const navigationTree = ref<NavigationNode[]>([]);
  const dimensions = ref<TagDimension[]>([]);
  const docTypes = ref<DocType[]>([]);
  const loading = ref(false);
  const serverConnected = ref(true);
  const serverError = ref<string | null>(null);

  // 当前选中的导航节点过滤规则 (基础筛选)
  const currentFilter = ref<{ dimension: string; value: string }[] | null>(null);

  // 附加筛选（来自顶部筛选栏）
  const additionalFilters = ref<Record<string, string[]>>({});
  // 关键词
  const keyword = ref('');

  const fetchNavigation = async () => {
    try {
      navigationTree.value = await navigationApi.getTree();
    } catch (error) {
      console.error('获取导航失败', error);
      throw error;
    }
  };

  const fetchModels = async () => {
    loading.value = true;
    try {
      models.value = await modelApi.list();
    } catch (error) {
      console.error('获取模型列表失败', error);
      throw error;
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
      throw error;
    }
  };

  const init = async () => {
    try {
      await Promise.all([fetchConfig(), fetchNavigation(), fetchModels()]);
      serverConnected.value = true;
      serverError.value = null;
    } catch (error: any) {
      serverConnected.value = false;
      serverError.value = error?.message || '无法连接到服务器';
      console.error('服务器连接失败', error);
    }
  };

  const setFilter = (rule: { dimension: string; value: string }[] | null) => {
    currentFilter.value = rule;
    // 重置附加筛选和关键词? 根据需求，可能需要保留或重置。
    // "展开状态在当前会话内保持，刷新后恢复默认" implies some state persistence, but usually changing base filter clears others or refines them.
    // 简单起见，这里不重置，除非用户显式清除。
  };

  const setAdditionalFilter = (dimension: string, value: string) => {
    if (!additionalFilters.value[dimension]) {
      additionalFilters.value[dimension] = [];
    }
    const index = additionalFilters.value[dimension].indexOf(value);
    if (index > -1) {
      additionalFilters.value[dimension].splice(index, 1);
      if (additionalFilters.value[dimension].length === 0) {
        delete additionalFilters.value[dimension];
      }
    } else {
      additionalFilters.value[dimension].push(value);
    }
  };

  const clearAdditionalFilters = () => {
    additionalFilters.value = {};
    keyword.value = '';
  };

  const resetAll = () => {
    currentFilter.value = null;
    additionalFilters.value = {};
    keyword.value = '';
  };

  const copyButtonPosition = ref(localStorage.getItem('copy_button_position') || 'footer');
  watch(copyButtonPosition, (val) => {
    localStorage.setItem('copy_button_position', val);
  });

  return {
    models,
    navigationTree,
    dimensions,
    docTypes,
    loading,
    currentFilter,
    additionalFilters,
    keyword,
    copyButtonPosition,
    serverConnected,
    serverError,
    fetchNavigation,
    fetchModels,
    fetchConfig,
    init,
    setFilter,
    setAdditionalFilter,
    clearAdditionalFilters,
    resetAll
  };
});
