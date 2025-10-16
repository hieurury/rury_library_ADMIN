<script setup>
import {
    NLayout,
    NLayoutContent,
    NResult,
    NButton
} from 'naive-ui'
import { useRouter } from 'vue-router'
const router = useRouter()
</script>


<template>
    <NLayout>
        <NLayoutContent class="p-4">
            <NResult
                class=""
                status="404"
                title="404 Not Found"
                description="Có vẻ trang này không tồn tại"
            >
                <template #footer>
                    <NButton @click="router.go(-1)">Trở lại trang trước</NButton>
                </template>
            </NResult>
        </NLayoutContent>
    </NLayout>
</template>

<style scoped>

</style>