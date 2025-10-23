<script setup>
import {
    NSpace,
    NSelect
}                           from    'naive-ui';
import {
    ref,
    computed
}                           from    'vue';
import features             from '../services/searchSupport'

const options = computed(() => {
    return features.map(feature => ({
        label: feature.name,
        value: feature.id
    }));
});

</script>


<template>
    <NSpace vertical size="large" class="w-full">
        <NSelect
            v-model="selectedOption"
            :options="options"
            placeholder="Chọn tính năng"
            clearable
        />
    </NSpace>
</template>


<style scoped>

</style>