<script setup>
import {
    NSpace,
    NSelect,
    NIcon
}                           from    'naive-ui';
import {
    ref,
    computed,
    watch,
    nextTick
}                           from    'vue';
import {
    useRouter
}                           from    'vue-router';
import features             from '../services/searchSupport'

const router            = useRouter();
const selectedOption    = ref(null);
const selectShow        = ref(false);
const selectRef         = ref(null);

const options = computed(() => {
    return features.map(feature => ({
        label: feature.name,
        value: feature.route
    }));
});


watch(selectedOption, (newOptions) => {
    if(newOptions) {
        router.push({ path: newOptions });
        selectedOption.value = null;
    }
}, { immediate: true });

window.addEventListener('keypress', (e) => {
    if(e.key === '/') {
        e.preventDefault();
        selectRef.value.focusInput();
    }
});
</script>


<template>
    <NSpace vertical size="large" class="min-w-lg">
        <NSelect
            ref="selectRef"
            v-model:show="selectShow"
            v-model:value="selectedOption"
            :options="options"
            placeholder="Chọn tính năng ( hoặc ấn / )"
            filterable
            clearable
        >
            <template #arrow>
                <NIcon>
                    <i class="fa fa-search"></i>
                </NIcon>
            </template>
        </NSelect>
    </NSpace>
</template>


<style scoped>

</style>