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
    NDivider,
    useMessage,
    NPopconfirm,
    NSpin,
    NSkeleton
}                          from    'naive-ui';
import {
    ref,
    onMounted,
    computed,
    watch,
    h
}                           from    'vue';
import {
    getAllReaders
}                           from    '../../../services/apiReader';
import {
    getAllPackages,
    subscribePackage
}                           from    '../../../services/apiPackage';
import BookMarkControll from '../../../components/BookMarkControll.vue'


// variables
const message = useMessage();

const selectedReader = ref(null);
const selectedPackage = ref(null);
const allReaders = ref([]);
const allPackages = ref([]);

//form
const formRef = ref(null);
const form = ref({
    MADOCGIA: '',
    MaGoi: ''
});
//dữ liệu hiện tại
const currentPackageInfo = ref(null);
const currentReaderInfo = ref(null);

// Loading state
const isSubmitting = ref(false);
const isPageLoading = ref(true);

//==========> Liên quan đến dữ liệu đọc giả
const readerOptions = computed(() => {
    if(!allReaders.value) {
        return [];
    }
    return allReaders.value.map(reader => ({
        label: `${reader.HOLOT} ${reader.TEN} - ${reader.MADOCGIA}`,
        value: reader.MADOCGIA,
        reader: reader // Lưu thông tin reader để dùng sau
    }));
});

// Watch selectedReader để cập nhật currentReaderInfo
watch(selectedReader, (newVal) => {
    if(!newVal) {
        currentReaderInfo.value = null;
        selectedPackage.value = null;
        return;
    }
    const reader = allReaders.value.find(r => r.MADOCGIA === newVal);
    currentReaderInfo.value = reader || null;
    selectedPackage.value = null; // Reset package khi đổi reader
});

//<========== Liên quan đến dữ liệu đọc giả

//==========> Liên quan đến gói
const packageOptions = computed(() => {
    if(!allPackages.value || !currentReaderInfo.value) return [];
    
    // Lấy mã gói hiện tại của reader
    const currentPackageId = currentReaderInfo.value.GOI?.MaGoi;
    
    // Lọc các gói:
    // 1. Loại bỏ gói phổ thông (giả sử tên chứa "phổ thông" hoặc mã là PG001)
    // 2. Loại bỏ gói đang dùng
    return allPackages.value
        .filter(pack => {
            // Loại bỏ gói phổ thông
            const isDefaultPackage = pack.TenGoi.toLowerCase().includes('phổ thông') || pack.MaGoi === 'PG001';
            // Loại bỏ gói đang dùng
            const isCurrentPackage = pack.MaGoi === currentPackageId;
            
            return !isDefaultPackage && !isCurrentPackage;
        })
        .map(pack => ({
            label: pack.TenGoi,
            value: pack.MaGoi
        }));
});

// Render tag cho option (hiển thị gói đang dùng)
const renderTag = ({ option }) => {
    if(!currentReaderInfo.value) return option.label;
    
    const currentPackageId = currentReaderInfo.value.GOI?.MaGoi;
    const isCurrentPackage = option.value === currentPackageId;
    
    return h('div', { style: 'display: flex; align-items: center; gap: 8px;' }, [
        h('span', option.label),
        isCurrentPackage ? h(NTag, { 
            type: 'success', 
            size: 'small',
            round: true
        }, { default: () => 'Đang dùng' }) : null
    ]);
};

//cập nhật gói liên tục
watch(selectedPackage, (newVal) => {
    if(!newVal) {
        currentPackageInfo.value = null;
        return;
    }
    const selectedPack = allPackages.value.find(pack => pack.MaGoi === newVal);
    currentPackageInfo.value = selectedPack || null;
});
//<========== Liên quan đến gói

//==========> Đăng kí gói
const rules = {
    MADOCGIA: [
        {
            validator: () => {
                if(!selectedReader.value) {
                    return new Error('Vui lòng chọn độc giả');
                }
                return true;
            },
            required: true,
            trigger: 'blur'
        }
    ],
    MaGoi: [
        {
            validator: () => {
                if(!selectedPackage.value) {
                    return new Error('Vui lòng chọn gói');
                }
                return true;
            },
            required: true,
            trigger: 'blur'
        }
    ]
};

const handleConfirmSubscribe = async () => {
    form.value.MADOCGIA = selectedReader.value;
    form.value.MaGoi = selectedPackage.value;
    
    formRef.value.validate(async (error) => {
        if(!error) {
            isSubmitting.value = true;
            try {
                const response = await subscribePackage(selectedReader.value, selectedPackage.value);
                message[response.status](response.message);
                
                if(response.status === 'success') {
                    // Reload data
                    await loadData();
                    // Reset form
                    selectedReader.value = null;
                    selectedPackage.value = null;
                    currentPackageInfo.value = null;
                    currentReaderInfo.value = null;
                }
            } catch (error) {
                message.error(error.response?.data?.message || 'Lỗi khi đăng ký gói');
            } finally {
                isSubmitting.value = false;
            }
        }
    });
};

const handleCancelSubscribe = () => {
    message.info('Đã hủy đăng ký');
};
//<========== Đăng kí gói

const loadData = async () => {
    isPageLoading.value = true;
    try {
        const readersResponse = await getAllReaders();
        const packageResponse = await getAllPackages();
        allPackages.value = packageResponse.data;
        allReaders.value = readersResponse.data;
    } catch (error) {
        message.error('Không thể tải dữ liệu');
    } finally {
        isPageLoading.value = false;
    }
};

onMounted(async () => {
    await loadData();
});

const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};
</script>


<template>
    <NSpace vertical class="p-6">
        <NSpin :show="isPageLoading" description="Đang tải dữ liệu...">
        <div class="p-6 dark:bg-gray-800 rounded-md shadow-md">
            <h1 class="text-3xl uppercase my-4 font-semibold">Đăng kí thành viên</h1>
            <NGrid cols="2" x-gap="12" y-gap="12">
                <NGi span="1">
                    <NCard class="h-full" title="Điền thông tin đăng kí">
                        <template #default>
                            <NForm :model="form" :rules="rules" ref="formRef">
                                <NFormItem label="Chọn độc giả" path="MADOCGIA">
                                    <NSelect
                                        v-model:value="selectedReader"
                                        :options="readerOptions"
                                        placeholder="Nhập tên hoặc mã độc giả"
                                        filterable
                                        clearable
                                    />
                                </NFormItem>
                                
                                <NFormItem 
                                    label="Chọn gói đăng ký" 
                                    path="MaGoi"
                                    v-if="currentReaderInfo"
                                >
                                    <template #feedback>
                                        <div v-if="currentReaderInfo?.GOI" class="text-sm text-gray-600 dark:text-gray-400">
                                            <i class="fa-solid fa-info-circle mr-1"></i>
                                            Gói hiện tại: <strong>{{ allPackages.find(pkg => pkg.MaGoi === currentReaderInfo.GOI.MaGoi)?.TenGoi }}</strong>
                                        </div>
                                    </template>
                                    <NSelect
                                        v-model:value="selectedPackage"
                                        :options="packageOptions"
                                        placeholder="Chọn gói muốn đăng ký"
                                        filterable
                                        clearable
                                    />
                                </NFormItem>
                                
                                <NPopconfirm
                                    @positive-click="handleConfirmSubscribe"
                                    @negative-click="handleCancelSubscribe"
                                    positive-text="Đã thanh toán"
                                    negative-text="Hủy"
                                >
                                    <template #trigger>
                                        <NButton 
                                            type="primary" 
                                            :disabled="!selectedReader || !selectedPackage"
                                            :loading="isSubmitting"
                                        >
                                            <i class="fa-solid fa-user-plus mr-2"></i>
                                            Đăng kí
                                        </NButton>
                                    </template>
                                    <div class="max-w-xs">
                                        <p class="font-semibold mb-2">Xác nhận thanh toán</p>
                                        <p class="text-sm">
                                            Vui lòng xác nhận rằng độc giả đã thanh toán 
                                            <strong>{{ currentPackageInfo?.Gia > 0 ? formatPrice(currentPackageInfo?.Gia) : 'Miễn phí' }}</strong>
                                            cho gói <strong>{{ currentPackageInfo?.TenGoi }}</strong>
                                        </p>
                                    </div>
                                </NPopconfirm>
                            </NForm>
                        </template>
                    </NCard>
                </NGi>
                <NGi span="1">
                    <NCard class="relative h-full">
                        <template #default>
                            <h3 class="text-2xl uppercase">Gói {{ currentPackageInfo?.TenGoi || 'chưa chọn'}}</h3>
                            <NDivider />
                            <NThing title="Thông tin gói">
                                <template #description v-if="currentPackageInfo">
                                    <NSpace vertical class="my-2">
                                        <div class="flex items-center gap-2">
                                            <i class="fa-solid fa-book text-blue-500"></i>
                                            <span>Mượn tối đa: <strong>{{ currentPackageInfo.SoSachToiDa }}</strong> quyển</span>
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <i class="fa-solid fa-clock text-green-500"></i>
                                            <span>Thời hạn mượn: <strong>{{ currentPackageInfo.ThoiHanMuon }} ngày</strong></span>
                                        </div>
                                    </NSpace>
                                </template>
                                <template #footer>
                                    <h3 class="text-sm font-semibold mb-1 text-gray-600 dark:text-gray-400">Quyền lợi:</h3>
                                    <div v-for="value in currentPackageInfo?.QuyenLoi" :key="value" class="flex items-center gap-2 my-1 text-sm">
                                        <i class="fa-solid fa-check text-green-500"></i>
                                        <span>{{ value }}</span>
                                    </div>
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
        </NSpin>
    </NSpace>
</template>


<style scoped>

</style>