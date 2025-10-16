<script setup>
import {
    NSpace,
    NSwitch,
    NIcon,
    NLayout,
    NLayoutHeader,
    NLayoutContent,
}                       from    'naive-ui';
import { isDark, toggleDark }    from  '../../hooks/useDark.js';

</script>


<template>
    <NLayout>
        <NLayoutHeader class="p-4 text-red-500">
            <NSpace justify="space-between" align="center" class="px-4">
                <h1 class="text-2xl font-bold">Admin</h1>
                <NSwitch v-model:value="isDark" >
                    <template #icon>
                        <NIcon v-if="isDark">
                            <i class="fa-solid fa-moon"></i>
                        </NIcon>
                        <NIcon v-else>
                            <i class="fa-solid fa-sun"></i>
                        </NIcon>
                    </template>
                </NSwitch>
            </NSpace>
        </NLayoutHeader>
        <NLayoutContent>
            <router-view />
        </NLayoutContent>
    </NLayout>
</template>

<style scoped>

</style>