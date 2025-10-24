<script setup>
import {
    NSpace,
    NButton,
    NGrid,
    NGi,
    NForm,
    NFormItem,
    NSelect,
    NCard,
    NThing,
    NTag,
    NDivider
}                          from    'naive-ui';
import {
    ref,
    onMounted,
    computed,
    watch
}                           from    'vue';
import {
    getAllReaders
}                           from    '../../../services/apiReader';
import {
    getAllPackages
}                           from    '../../../services/apiPackage';
import BookMarkControll from '../../../components/BookMarkControll.vue'


// variables
const selectedReader = ref(null);
const selectedPackage = ref(null);
const allReaders = ref([]);
const allPackages = ref([]);
//dữ liệu hiện tại
const currentPackageInfo = ref(null);

//==========> Liên quan đến dữ liệu đọc giả
const readerOptions = computed(() => {
    if(!allReaders.value) {
        return [];
    }
    return allReaders.value.map(reader => ({
        label: `${reader.HOLOT} ${reader.TEN} - ${reader.MADOCGIA}`,
        value: reader.MADOCGIA
    }));
})

//<========== Liên quan đến dữ liệu đọc giả

//==========>  title
const packageOptions = computed(() => {
    if(!allPackages.value) return []
    return allPackages.value.map(pack => ({
        label: `${pack.TenGoi} - ${pack.MaGoi}`,
        value: pack.MaGoi
    }))
})

//cập nhật gói liên tục
watch(selectedPackage, (newVal) => {
    if(!newVal) {
        currentPackageInfo.value = null;
        return;
    }
    const selectedPack = allPackages.value.find(pack => pack.MaGoi === newVal);
    currentPackageInfo.value = selectedPack || null;
    console.log(currentPackageInfo.value);
});
//<==========  title

onMounted(async () => {
    const readersResponse = await getAllReaders();
    const packageResponse = await getAllPackages();
    allPackages.value = packageResponse.data;
    allReaders.value = readersResponse.data;
    console.log(packageResponse);
});


const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}
</script>


<template>
    <NSpace vertical class="p-6">
        <div class="p-6 dark:bg-gray-800 rounded-md shadow-md">
            <h1 class="text-3xl uppercase my-4 font-semibold">Đăng kí thành viên</h1>
            <NGrid cols="2" x-gap="12" y-gap="12">
                <NGi span="1">
                    <NCard class="h-full" title="Điền thông tin đăng kí">
                        <template #default>
                            <NForm>
                            <NFormItem label="Mã độc giả">
                                <NSelect
                                    v-model:value="selectedReader"
                                    :options="readerOptions"
                                    placeholder="Nhập tên hoặc mã độc giả"
                                    filterable
                                    clearable
                                >
                                </NSelect>
                            </NFormItem>
                            <NFormItem label="Mã độc giả">
                                <NSelect
                                    v-model:value="selectedPackage"
                                    :options="packageOptions"
                                    placeholder="Nhập tên hoặc mã gói"
                                    filterable
                                    clearable
                                >
                                </NSelect>
                            </NFormItem>
                            <NButton type="primary">Đăng kí</NButton>
                        </NForm>
                        </template>
                    </NCard>
                </NGi>
                <NGi span="1">
                    <NCard class="relative h-full">
                        <template #default>
                            <h3 class="text-2xl uppercase">Gói {{ currentPackageInfo?.TenGoi || 'chưa chọn'}}</h3>
                            <NDivider />
                            <NThing title="Mô tả gói">
                                <template #footer>
                                    <h3 v-for="value in currentPackageInfo?.QuyenLoi" :key="value">{{ value }}</h3>
                                    <NDivider />
                                    <NSpace class="my-2">
                                        <NTag type="warning">{{ currentPackageInfo?.Gia > 0 ? (formatPrice(currentPackageInfo?.Gia)) : 'Miễn phí' }}</NTag>
                                        <NTag type="info">{{ currentPackageInfo?.ThoiHanGoi > 0 ? (currentPackageInfo?.ThoiHanGoi + ' ngày') : 'Vĩnh viễn' }}</NTag>
                                    </NSpace>
                                </template>
                            </NThing>
                            <BookMarkControll :img="currentPackageInfo?.HuyHieu" />
                        </template>
                    </NCard>
                </NGi>
            </NGrid>
        </div>
        <div></div>
    </NSpace>
</template>


<style scoped>

</style>