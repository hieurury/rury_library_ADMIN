<script setup>
import {
    NGrid,
    NSpace,
    NStatistic,
    NGi,
    NList,
    NListItem,
    NThing,
    NTag,
    NDivider,
    useMessage,
    NPopconfirm,
    NSkeleton,
    NResult,
    NImage,
    NButton,
    NIcon,
    NModal,
    NForm,
    NFormItem,
    NInput,
    NInputNumber,
    NDynamicInput,
    NCard,
    NUpload,
    NUploadDragger,
    NText,
    NP,
    NNumberAnimation,
    NConfigProvider
} from 'naive-ui';

import axios from 'axios';
import { onMounted, ref, computed } from 'vue';
import { getAllPackages, deletePackage, updatePackage } from '../../services/apiPackage.js';
import BookMarkControll from '../../components/BookMarkControll.vue';
import Chart from '../../components/Chart.vue';

//=========================== VARIABLES ===========================//
const BASE_API = import.meta.env.VITE_BASE_API;
const message = useMessage();
const loading = ref(true);

//==========> Liên quan đến gói
const allPackages = ref([]);
const numberAnimation = ref(null);

const totalPackages = computed(() => allPackages.value.length);
const totalSubscribers = computed(() => 
    allPackages.value.reduce((acc, pkg) => acc + (pkg.SubscriberCount || 0), 0)
);

const loadPackages = async () => {
    loading.value = true;
    try {
        const response = await getAllPackages();
        allPackages.value = response.data;
        numberAnimation.value?.play();
    } catch (error) {
        message.error('Lỗi khi tải danh sách gói');
    }
    loading.value = false;
};

onMounted(async () => {
    await loadPackages();
});

//==========> Xóa gói
const deletingPackage = ref(null);

const handleDeletePackage = async (id, packageName) => {
    if (deletingPackage.value) return; // Ngăn double click
    
    try {
        deletingPackage.value = id;
        const response = await deletePackage(id);
        message[response.status](response.message);
        await loadPackages();
    } catch (error) {
        message.error('Lỗi khi xóa gói');
    } finally {
        deletingPackage.value = null;
    }
};
//<========== Xóa gói

//==========> Sửa gói
const editModalShow = ref(false);
const editFormRef = ref(null);
const selectedPackage = ref(null);
const fileListEdit = ref([]);
const previewBadgeUrlEdit = ref('');
const submittingEdit = ref(false);

const editForm = ref({
    packageName: '',
    maxBooks: 1,
    borrowDuration: 7,
    price: 0,
    benefits: [],
    packageDuration: 30,
    badge: ''
});

const openEditModal = (pkg) => {
    selectedPackage.value = pkg;
    editForm.value = {
        packageName: pkg.TenGoi,
        maxBooks: pkg.SoSachToiDa,
        borrowDuration: pkg.ThoiHanMuon,
        price: pkg.Gia,
        benefits: [...pkg.QuyenLoi],
        packageDuration: pkg.ThoiHanGoi,
        badge: pkg.HuyHieu
    };
    previewBadgeUrlEdit.value = `${BASE_API}${pkg.HuyHieu}`;
    fileListEdit.value = [];
    editModalShow.value = true;
};

const createPreviewBadgeUrlEdit = (file) => {
    fileListEdit.value = file;
    const raw = file[0]?.file;
    if (raw) {
        previewBadgeUrlEdit.value = URL.createObjectURL(raw);
    }
};

const handleRemoveEdit = () => {
    previewBadgeUrlEdit.value = `${BASE_API}${selectedPackage.value.HuyHieu}`;
    return true;
};

const beforeUploadEdit = (data) => {
    const types = ['image/jpeg', 'image/png', 'image/svg+xml'];
    const isValid = types.includes(data.file.type);
    if (!isValid) {
        message.error('Chỉ hỗ trợ file JPG/PNG/SVG!');
    }
    return isValid;
};

const uploadBadgeEdit = async () => {
    if (fileListEdit.value.length === 0) {
        return selectedPackage.value.HuyHieu;
    }
    const formData = new FormData();
    formData.append('badge', fileListEdit.value[0].file);
    
    try {
        const response = await axios.post(`${BASE_API}/package/upload-badge`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (response.data.status === 'success') {
            return response.data.badgePath;
        } else {
            message.error('Tải huy hiệu thất bại!');
            return selectedPackage.value.HuyHieu;
        }
    } catch (error) {
        message.error('Lỗi khi tải huy hiệu!');
        return selectedPackage.value.HuyHieu;
    }
};

const numberValidator = (value) => value > 0;

const benefitsValidator = () => {
    if (!editForm.value.benefits || editForm.value.benefits.length === 0) {
        return new Error('Vui lòng thêm ít nhất một quyền lợi');
    }
    return true;
};

const rulesEdit = {
    packageName: [
        { required: true, message: 'Vui lòng nhập tên gói', trigger: 'blur' },
        { min: 3, max: 50, message: 'Tên gói phải từ 3-50 ký tự', trigger: 'blur' }
    ],
    maxBooks: [
        { required: true, type: 'number', message: 'Vui lòng nhập số sách tối đa', trigger: 'blur' }
    ],
    borrowDuration: [
        { required: true, type: 'number', message: 'Vui lòng nhập thời hạn mượn', trigger: 'blur' }
    ],
    price: [
        { required: true, type: 'number', message: 'Vui lòng nhập giá gói', trigger: 'blur' }
    ],
    benefits: [
        { validator: benefitsValidator, trigger: ['blur', 'change'] }
    ],
    packageDuration: [
        { required: true, type: 'number', message: 'Vui lòng nhập thời hạn gói', trigger: 'blur' }
    ]
};

const submitEditForm = async () => {
    if (submittingEdit.value) return; // Ngăn double click
    
    editFormRef.value.validate(async (error) => {
        if (!error) {
            try {
                submittingEdit.value = true;
                let badgePath = editForm.value.badge;
                
                if (fileListEdit.value.length > 0) {
                    badgePath = await uploadBadgeEdit();
                }

                const updatedData = {
                    TenGoi: editForm.value.packageName,
                    SoSachToiDa: editForm.value.maxBooks,
                    ThoiHanMuon: editForm.value.borrowDuration,
                    Gia: editForm.value.price,
                    QuyenLoi: editForm.value.benefits.filter(b => b && b.trim() !== ''),
                    ThoiHanGoi: editForm.value.packageDuration,
                    HuyHieu: badgePath
                };

                const response = await updatePackage(selectedPackage.value._id, updatedData);
                message[response.status](response.message);
                
                if (response.status === 'success') {
                    editModalShow.value = false;
                    await loadPackages();
                }
            } catch (error) {
                message.error(error.response?.data?.message || 'Lỗi khi cập nhật gói');
            } finally {
                submittingEdit.value = false;
            }
        } else {
            message.error('Vui lòng điền đầy đủ thông tin!');
        }
    });
};
//<========== Sửa gói

//==========> Biểu đồ thống kê - ApexCharts
const chartOptions = computed(() => {
    return {
        chart: {
            type: 'bar',
            height: 300,
            toolbar: {
                show: false
            }
        },
        series: [{
            name: 'Số người đăng ký',
            data: allPackages.value.map(pkg => pkg.SubscriberCount || 0)
        }],
        plotOptions: {
            bar: {
                borderRadius: 4,
                dataLabels: {
                    position: 'top'
                },
                distributed: true
            }
        },
        colors: [
            '#3b82f6',
            '#eab308',
            '#10b981',
            '#8b5cf6',
            '#f59e0b',
            '#ef4444'
        ],
        dataLabels: {
            enabled: true,
            formatter: function (val) {
                return val;
            },
            offsetY: -20,
            style: {
                fontSize: '12px',
                colors: ['#304758']
            }
        },
        xaxis: {
            categories: allPackages.value.map(pkg => pkg.TenGoi),
            position: 'bottom',
            labels: {
                offsetY: 0,
            },
            axisBorder: {
                show: false
            },
            axisTicks: {
                show: false
            }
        },
        yaxis: {
            axisBorder: {
                show: false
            },
            axisTicks: {
                show: false,
            },
            labels: {
                show: true,
                formatter: function (val) {
                    return val.toFixed(0);
                }
            }
        },
        title: {
            text: 'Thống kê người đăng ký theo gói',
            floating: false,
            offsetY: 0,
            align: 'center',
            style: {
                fontSize: '16px',
                fontWeight: 600
            }
        },
        legend: {
            show: false
        }
    };
});
//<========== Biểu đồ thống kê

const previewDurationEdit = computed(() => {
    if (editForm.value.packageDuration >= 365) {
        return `${Math.floor(editForm.value.packageDuration / 365)} năm`;
    } else if (editForm.value.packageDuration >= 30) {
        return `${Math.floor(editForm.value.packageDuration / 30)} tháng`;
    } else {
        return `${editForm.value.packageDuration} ngày`;
    }
});

const previewBorrowDurationEdit = computed(() => {
    return `${editForm.value.borrowDuration} ngày`;
});

const customThemeLight = ref({
  Statistic: {
    valueTextColor: '#ffffff',
    labelTextColor: '#ffffff'
  },
});

const customThemeDark = ref({

})
</script>

<template>
    <NConfigProvider :theme-overrides="isDark ? customThemeDark : customThemeLight">

        <NSpace vertical class="p-4">
            <!-- Header statistics -->
            <NSpace vertical class="p-8 shadow-md rounded-md bg-white dark:bg-slate-600/30">
                <h1 class="text-3xl uppercase font-semibold">Quản lý gói thành viên</h1>
                <NGrid :cols="4" x-gap="12" y-gap="12" class="my-4">
                    <NGi :span="1">
                        <NStatistic
                            label="Tổng số gói"
                            class="relative w-full ring-2 ring-blue-500 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-600/50 dark:to-blue-700/50 shadow-md text-white rounded-md p-4"
                        >
                            <NNumberAnimation ref="numberAnimation" :from="0" :to="totalPackages" :active="true"/>
                        </NStatistic>
                    </NGi>
                    <NGi :span="1">
                        <NStatistic
                            label="Tổng người đăng ký"
                            class="relative w-full ring-2 ring-green-500 bg-gradient-to-r from-green-600 to-green-700 dark:from-green-600/50 dark:to-green-700/50 shadow-md text-white rounded-md p-4"
                        >
                            <NNumberAnimation ref="numberAnimation" :from="0" :to="totalSubscribers" :active="true"/>
                        </NStatistic>
                    </NGi>
                    <NGi :span="2">
                        <NStatistic
                            label="Chức năng"
                            class="relative w-full ring-2 ring-slate-500 bg-gradient-to-r from-slate-700/90 to-slate-500/60 shadow-md text-white rounded-md p-4"
                        >
                            <NButton @click="$router.push('/admin/packages/add')" type="success">
                                <i class="fa-solid fa-plus mr-2"></i> Thêm gói mới
                            </NButton>
                        </NStatistic>
                    </NGi>
                </NGrid>
            </NSpace>
    
            <!-- Chart -->
            <NSpace vertical class="p-8 shadow-md rounded-md bg-white dark:bg-slate-600/30">
                <div style="height: 350px;">
                    <Chart v-if="!loading && allPackages.length > 0" :options="chartOptions" />
                    <NResult v-else-if="!loading && allPackages.length === 0" title="Chưa có dữ liệu" description="Chưa có gói nào để thống kê">
                        <template #icon>
                            <NImage style="width: 100px;" :src="`${BASE_API}public/imgs/default/not-found.svg`"></NImage>
                        </template>
                    </NResult>
                </div>
            </NSpace>
    
            <!-- List packages -->
            <NSpace vertical class="p-8 shadow-md rounded-md bg-white dark:bg-slate-600/30">
                <h1 class="text-3xl uppercase font-semibold">Tất cả gói thành viên</h1>
                
                <NList clickable hoverable show-divider="true">
                    <NGrid cols="3" x-gap="12" y-gap="12" class="p-2">
                        <NGi v-if="allPackages && allPackages.length > 0" span="1" v-for="pkg in allPackages" :key="pkg._id">
                            <NListItem class="dark:bg-gray-600/20 h-full group bg-transparent shadow rounded-md p-4 relative">
                                <span class="absolute hidden group-hover:block top-2 right-2 z-10">
                                    <NSpace>
                                        <NPopconfirm
                                            @positive-click="handleDeletePackage(pkg._id, pkg.TenGoi)"
                                            @negative-click="() => message.info('Hủy xóa')"
                                            positive-text="Xóa"
                                            negative-text="Hủy"
                                            :disabled="deletingPackage === pkg._id"
                                        >
                                            <template #trigger>
                                                <NIcon :class="{ 'opacity-50': deletingPackage === pkg._id }">
                                                    <i v-if="deletingPackage === pkg._id" class="fa-solid fa-spinner fa-spin text-red-500"></i>
                                                    <i v-else class="fa-solid fa-trash text-red-500 hover:text-red-700 cursor-pointer"></i>
                                                </NIcon>
                                            </template>
                                            {{ pkg.SubscriberCount > 0 
                                                ? `Gói này có ${pkg.SubscriberCount} người đang sử dụng. Hành động này sẽ ẩn gói thay vì xóa hẳn.` 
                                                : 'Bạn có chắc muốn xóa gói này?' 
                                            }}
                                        </NPopconfirm>
                                        
                                        <NIcon @click="openEditModal(pkg)">
                                            <i class="fa-solid fa-pen-to-square text-blue-500 hover:text-blue-700 cursor-pointer"></i>
                                        </NIcon>
                                    </NSpace>
                                </span>
                                
                                <NCard class="relative dark:bg-slate-600/20">
                                    <h3 class="text-xl font-semibold mb-2">{{ pkg.TenGoi }}</h3>
                                    <NDivider />
                                    
                                    <NThing title="Thông tin gói">
                                        <template #description>
                                            <NSpace vertical class="my-2">
                                                <div class="flex items-center gap-2">
                                                    <i class="fa-solid fa-book text-blue-500"></i>
                                                    <span>Mượn tối đa: <strong>{{ pkg.SoSachToiDa }}</strong> quyển</span>
                                                </div>
                                                <div class="flex items-center gap-2">
                                                    <i class="fa-solid fa-clock text-green-500"></i>
                                                    <span>Thời hạn mượn: <strong>{{ pkg.ThoiHanMuon }} ngày</strong></span>
                                                </div>
                                                <div class="flex items-center gap-2">
                                                    <i class="fa-solid fa-users text-purple-500"></i>
                                                    <span>Người đăng ký: <strong>{{ pkg.SubscriberCount || 0 }}</strong></span>
                                                </div>
                                            </NSpace>
                                        </template>
                                        <template #footer>
                                            <h3 class="text-sm font-semibold mb-1 text-gray-600 dark:text-gray-400">Quyền lợi:</h3>
                                            <div v-for="(benefit, index) in pkg.QuyenLoi" :key="index" class="flex items-center gap-2 my-1 text-sm">
                                                <i class="fa-solid fa-check text-green-500"></i>
                                                <span>{{ benefit }}</span>
                                            </div>
                                            <NDivider />
                                            <NSpace class="my-2">
                                                <NTag type="warning">
                                                    {{ pkg.Gia > 0 ? pkg.Gia.toLocaleString('vi-VN') + ' đ' : 'Miễn phí' }}
                                                </NTag>
                                                <NTag type="info">
                                                    {{ pkg.ThoiHanGoi > 0 ? pkg.ThoiHanGoi + ' ngày' : 'Vĩnh viễn' }}
                                                </NTag>
                                            </NSpace>
                                        </template>
                                    </NThing>
                                    <BookMarkControll :img="pkg.HuyHieu" />
                                </NCard>
                            </NListItem>
                        </NGi>
                        
                        <NGi span="3" class="min-h-36" v-if="!loading && allPackages.length === 0">
                            <NResult
                                title="Chưa có gói nào"
                                description="Hãy thêm gói thành viên mới để bắt đầu!"
                            >
                                <template #icon>
                                    <NImage style="width: 100px;" :src="`${BASE_API}public/imgs/default/not-found.svg`"></NImage>
                                </template>
                            </NResult>
                        </NGi>
                        
                        <NGi v-if="loading" v-for="n in 3" :key="n">
                            <NSkeleton class="min-h-64"></NSkeleton>
                        </NGi>
                    </NGrid>
                </NList>
            </NSpace>
        </NSpace>
    
        <!-- Modal sửa gói -->
        <NModal 
            v-model:show="editModalShow" 
            title="Sửa thông tin gói" 
            preset="dialog"
            type="default"
            class="dark:bg-slate-700 min-w-[1000px]"
        >
            <NSpace vertical class="max-h-[70vh] overflow-y-auto">
                <NGrid cols="7" x-gap="12" y-gap="12" class="w-full">
                    <!-- Form phần trái -->
                    <NGi span="4">
                        <NSpace vertical class="dark:bg-slate-700/20 bg-slate-200/70 rounded-lg p-6">
                            <NForm ref="editFormRef" :model="editForm" :rules="rulesEdit" label-width="140px" class="w-full">
                                <NFormItem label="Tên gói" path="packageName" required>
                                    <NInput v-model:value="editForm.packageName" placeholder="VD: Gói Vàng..." />
                                </NFormItem>
                                
                                <NFormItem label="Số sách tối đa" path="maxBooks" required>
                                    <NInputNumber 
                                        v-model:value="editForm.maxBooks" 
                                        :validator="numberValidator"
                                        :min="1"
                                        class="w-full"
                                    />
                                </NFormItem>
                                
                                <NFormItem label="Thời hạn mượn" path="borrowDuration" required>
                                    <NInputNumber 
                                        v-model:value="editForm.borrowDuration" 
                                        :validator="numberValidator"
                                        :min="1"
                                        class="w-full"
                                    >
                                        <template #suffix>ngày</template>
                                    </NInputNumber>
                                </NFormItem>
                                
                                <NFormItem label="Giá gói" path="price" required>
                                    <NInputNumber 
                                        v-model:value="editForm.price" 
                                        :validator="numberValidator"
                                        :min="0"
                                        class="w-full"
                                    >
                                        <template #suffix>VNĐ</template>
                                    </NInputNumber>
                                </NFormItem>
                                
                                <NFormItem label="Thời hạn gói" path="packageDuration" required>
                                    <NInputNumber 
                                        v-model:value="editForm.packageDuration" 
                                        :validator="numberValidator"
                                        :min="1"
                                        class="w-full"
                                    >
                                        <template #suffix>ngày</template>
                                    </NInputNumber>
                                </NFormItem>
                                
                                <NFormItem label="Quyền lợi" path="benefits" required>
                                    <NDynamicInput
                                        v-model:value="editForm.benefits"
                                        placeholder="Nhập quyền lợi..."
                                        :min="1"
                                    >
                                        <template #create-button-default>
                                            Thêm quyền lợi
                                        </template>
                                    </NDynamicInput>
                                </NFormItem>
                                
                                <NFormItem label="Huy hiệu" path="badge">
                                    <NUpload
                                        name="badge"
                                        v-model:file-list="fileListEdit"
                                        @remove="handleRemoveEdit"
                                        @before-upload="beforeUploadEdit"
                                        @update:file-list="createPreviewBadgeUrlEdit"
                                        :max="1"
                                    >
                                        <NUploadDragger>
                                            <div style="margin-bottom: 12px">
                                                <NIcon class="text-3xl" :depth="3">
                                                    <i class="fa-solid fa-cloud-arrow-up"></i>
                                                </NIcon>
                                            </div>
                                            <NText style="font-size: 16px">
                                                Kéo thả file vào đây hoặc nhấp để thay đổi
                                            </NText>
                                            <NP depth="3" style="margin: 8px 0 0 0">
                                                (Chỉ hỗ trợ .svg, .png, .jpg)
                                            </NP>
                                        </NUploadDragger>
                                    </NUpload>
                                </NFormItem>
                            </NForm>
                        </NSpace>
                    </NGi>
    
                    <!-- Preview phần phải -->
                    <NGi span="3">
                        <NSpace vertical class="dark:bg-slate-700/20 bg-slate-200/70 rounded-lg p-6">
                            <h3 class="text-lg font-semibold">Xem trước</h3>
                            
                            <NCard class="relative dark:bg-slate-600/20">
                                <h3 class="text-xl uppercase font-semibold">{{ editForm.packageName || 'Tên gói' }}</h3>
                                <NDivider />
                                <NThing title="Thông tin gói">
                                    <template #description>
                                        <NSpace vertical class="my-2">
                                            <div class="flex items-center gap-2">
                                                <i class="fa-solid fa-book text-blue-500"></i>
                                                <span>Mượn tối đa: <strong>{{ editForm.maxBooks }}</strong> quyển</span>
                                            </div>
                                            <div class="flex items-center gap-2">
                                                <i class="fa-solid fa-clock text-green-500"></i>
                                                <span>Thời hạn mượn: <strong>{{ previewBorrowDurationEdit }}</strong></span>
                                            </div>
                                        </NSpace>
                                    </template>
                                    <template #footer>
                                        <h3 class="text-sm font-semibold mb-1">Quyền lợi:</h3>
                                        <template v-if="editForm.benefits && editForm.benefits.length > 0">
                                            <div v-for="(benefit, index) in editForm.benefits.filter(b => b && b.trim() !== '')" :key="index" class="flex items-center gap-2 my-1 text-sm">
                                                <i class="fa-solid fa-check text-green-500"></i>
                                                <span>{{ benefit }}</span>
                                            </div>
                                        </template>
                                        <div v-else class="text-gray-500 text-sm italic">
                                            Chưa có quyền lợi nào
                                        </div>
                                        <NDivider />
                                        <NSpace class="my-2">
                                            <NTag type="warning">
                                                {{ editForm.price > 0 ? editForm.price.toLocaleString('vi-VN') + ' đ' : 'Miễn phí' }}
                                            </NTag>
                                            <NTag type="info">
                                                {{ previewDurationEdit }}
                                            </NTag>
                                        </NSpace>
                                    </template>
                                </NThing>
                                <BookMarkControll 
                                    :img="previewBadgeUrlEdit.startsWith('blob:') ? previewBadgeUrlEdit : previewBadgeUrlEdit" 
                                />
                            </NCard>
                        </NSpace>
                    </NGi>
                </NGrid>
            </NSpace>
    
            <template #action>
                <NButton @click="editModalShow = false" :disabled="submittingEdit">Hủy</NButton>
                <NButton @click="submitEditForm" type="primary" :loading="submittingEdit" :disabled="submittingEdit">Lưu thay đổi</NButton>
            </template>
        </NModal>
    </NConfigProvider>
</template>

<style scoped>

</style>