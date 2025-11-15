<script setup>
import { 
  NConfigProvider, 
  NMessageProvider,
  NNotificationProvider,
  NDialogProvider,
  darkTheme, 
}                     from  'naive-ui';
import { isDark, toggleDark }    from  './hooks/useDark.js';
import {
  onMounted,
  ref
}                     from  'vue';

const customThemeLight = ref({
  // Statistic: {
  //   valueTextColor: '#ffffff',
  //   labelTextColor: '#ffffff'
  // },
  Input: {
  },
  Layout: {
    headerColor: '#E28929',
    headerTextColor: '#fff',
  },
});

const customThemeDark = ref({
  Statistic: {
    valueTextColor: '#fff',
    labelTextColor: '#fff'
  },
});

onMounted(() => {
  //khoi tao giao dien
  if(isDark.value) {
    document.documentElement.classList.toggle('dark', isDark.value);
  }
});

</script>


<template>
<NConfigProvider 
  :theme-overrides="isDark ? customThemeDark : customThemeLight" 
  :theme="isDark ? darkTheme : null">
    <NMessageProvider>
      <NNotificationProvider>
      <NDialogProvider>

        <router-view />
      </NDialogProvider>
      </NNotificationProvider>
    </NMessageProvider>
</NConfigProvider>
</template>

<style scoped>

</style>