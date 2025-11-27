<script setup>
import {
    NSpace,
    NStatistic,
    NIcon,
    NDataTable,
    NButton,
    NTag,
    NModal,
    NForm,
    NFormItem,
    NInput,
    NGrid,
    NGi,
    NSpin,
    NEmpty,
    NNumberAnimation,
    NSelect,
    NPopconfirm,
    useMessage,
    useDialog
} from 'naive-ui';
import { ref, onMounted, h, computed, watch, reactive } from 'vue';
import { 
    getAllStaff, 
    getStaffStatistics, 
    createStaff, 
    updateStaff, 
    deleteStaff 
} from '../../../services/apiStaff';
import Chart from '../../../components/Chart.vue';

const message = useMessage();
const dialog = useDialog();

// State
const loading = ref(false);
const isMaster = ref(false);
const masterKey = ref('');
const showMasterKeyInput = ref(false);
const statistics = ref({
    totalStaff: 0,
    totalAdmins: 0,
    totalLibrarians: 0,
    totalBorrows: 0,
    systemBorrows: 0,
    staffBorrows: 0,
    staffBorrowRate: 0,
    staffBorrowStats: []
});
const allStaff = ref([]);
const currentStaff = ref([]);
const showModal = ref(false);
const modalMode = ref('create'); // 'create' | 'edit'
const selectedStaff = ref(null);
const submitting = ref(false);

// Form data
const formData = ref({
    HoTenNV: '',
    soDienThoai: '',
    DiaChi: '',
    Password: ''
});

// Filter data
const filterData = reactive({
    query: null,
    chucVu: null
});

// Number animation ref
const numberAnimation = ref(null);

// Position filter options
const positionOptions = [
    { label: 'Tất cả', value: null },
    { label: 'Admin', value: 'Admin' },
    { label: 'Thủ thư', value: 'Librarian' }
];

// Form rules
const rules = {
    HoTenNV: {
        required: true,
        message: 'Vui lòng nhập họ tên',
        trigger: 'blur'
    },
    soDienThoai: {
        required: true,
        pattern: /^[0-9]{10}$/,
        message: 'Số điện thoại phải có 10 chữ số',
        trigger: 'blur'
    },
    DiaChi: {
        required: true,
        message: 'Vui lòng nhập địa chỉ',
        trigger: 'blur'
    },
    Password: {
        required: true,
        message: 'Vui lòng nhập mật khẩu',
        trigger: 'blur'
    }
};

// Lifecycle
onMounted(async () => {
    await Promise.all([
        loadStatistics(),
        loadStaff()
    ]);
    numberAnimation.value?.play();
});

// Methods
const loadStatistics = async () => {
    try {
        const response = await getStaffStatistics(masterKey.value || null);
        statistics.value = response.data;
        isMaster.value = response.isMaster || false;
    } catch (error) {
        message.error('Không thể tải thống kê nhân viên');
    }
};

const loadStaff = async () => {
    loading.value = true;
    try {
        const response = await getAllStaff(masterKey.value || null);
        allStaff.value = response.data || [];
        isMaster.value = response.isMaster || false;
    } catch (error) {
        message.error('Không thể tải danh sách nhân viên');
    } finally {
        loading.value = false;
    }
};

// Apply master key
const applyMasterKey = async () => {
    if (!masterKey.value.trim()) {
        message.warning('Vui lòng nhập Master Key');
        return;
    }
    
    await Promise.all([
        loadStatistics(),
        loadStaff()
    ]);
    
    if (isMaster.value) {
        message.success('Đã kích hoạt quyền Master! Bạn có toàn quyền quản lý.');
        showMasterKeyInput.value = false;
    } else {
        message.error('Master Key không hợp lệ!');
        masterKey.value = '';
    }
};

// Clear master key
const clearMasterKey = async () => {
    masterKey.value = '';
    isMaster.value = false;
    message.info('Đã thoát chế độ Master');
    await Promise.all([
        loadStatistics(),
        loadStaff()
    ]);
};

// Filter staff
const filterStaff = (filters) => {
    const query = filters.query ? filters.query.toLowerCase() : null;
    const chucVu = filters.chucVu;

    let resultStaff = allStaff.value;

    // Filter by query
    if (query) {
        resultStaff = resultStaff.filter(staff => {
            const name = staff.HoTenNV ? staff.HoTenNV.toLowerCase() : '';
            const phone = staff.soDienThoai || '';
            const msnv = staff.MSNV || '';
            
            return name.includes(query) || 
                   phone.includes(query) ||
                   msnv.includes(query);
        });
    }

    // Filter by position
    if (chucVu) {
        resultStaff = resultStaff.filter(staff => staff.ChucVu === chucVu);
    }

    currentStaff.value = resultStaff;
};

// Watch for filter changes
watch(filterData, (newFilterData) => {
    filterStaff(newFilterData);
});

watch(allStaff, () => {
    filterStaff(filterData);
});

// Handle create staff
const handleCreateStaff = () => {
    modalMode.value = 'create';
    formData.value = {
        HoTenNV: '',
        soDienThoai: '',
        DiaChi: '',
        Password: ''
    };
    showModal.value = true;
};

// Handle edit staff
const handleEditStaff = (staff) => {
    modalMode.value = 'edit';
    selectedStaff.value = staff;
    formData.value = {
        HoTenNV: staff.HoTenNV,
        soDienThoai: staff.soDienThoai,
        DiaChi: staff.DiaChi || '',
        Password: ''
    };
    showModal.value = true;
};

// Submit form
const submitForm = async () => {
    submitting.value = true;
    try {
        if (modalMode.value === 'create') {
            await createStaff(formData.value);
            message.success('Thêm nhân viên thành công');
        } else {
            const updateData = { ...formData.value };
            if (!updateData.Password) {
                delete updateData.Password;
            }
            await updateStaff(selectedStaff.value.MSNV, updateData, masterKey.value || null);
            message.success('Cập nhật nhân viên thành công');
        }
        showModal.value = false;
        await loadStaff();
        await loadStatistics();
    } catch (error) {
        message.error(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
        submitting.value = false;
    }
};

// Handle delete staff
const handleDeleteStaff = async (staff) => {
    try {
        await deleteStaff(staff.MSNV, masterKey.value || null);
        message.success('Xóa nhân viên thành công');
        await loadStaff();
        await loadStatistics();
    } catch (error) {
        message.error(error.response?.data?.message || 'Không thể xóa nhân viên');
    }
};

// Table columns
const columns = [
    {
        title: 'MSNV',
        key: 'MSNV',
        width: 120,
        fixed: 'left'
    },
    {
        title: 'Họ tên',
        key: 'HoTenNV',
        width: 200
    },
    {
        title: 'Chức vụ',
        key: 'ChucVu',
        width: 120,
        render: (row) => {
            return h(
                NTag,
                { 
                    type: row.ChucVu === 'Admin' ? 'error' : 'info', 
                    size: 'small' 
                },
                { default: () => row.ChucVu === 'Admin' ? 'Admin' : 'Thủ thư' }
            );
        }
    },
    {
        title: 'Số điện thoại',
        key: 'soDienThoai',
        width: 130
    },
    {
        title: 'Địa chỉ',
        key: 'DiaChi',
        width: 250,
        ellipsis: {
            tooltip: true
        }
    },
    {
        title: 'Số phiếu lập',
        key: 'borrowCount',
        width: 120,
        align: 'center',
        render: (row) => {
            const stat = statistics.value.staffBorrowStats.find(s => s.MSNV === row.MSNV);
            return stat ? stat.borrowCount : 0;
        }
    },
    {
        title: 'Tỷ lệ (%)',
        key: 'borrowRate',
        width: 100,
        align: 'center',
        render: (row) => {
            const stat = statistics.value.staffBorrowStats.find(s => s.MSNV === row.MSNV);
            return stat ? `${stat.borrowRate}%` : '0%';
        }
    },
    {
        title: 'Thao tác',
        key: 'actions',
        width: 180,
        fixed: 'right',
        render: (row) => {
            return h(
                NSpace,
                { size: 'small' },
                {
                    default: () => [
                        h(
                            NButton,
                            {
                                size: 'small',
                                type: 'info',
                                secondary: true,
                                onClick: () => handleEditStaff(row),
                                disabled: row.ChucVu === 'Admin' && !isMaster.value
                            },
                            {
                                default: () => 'Sửa',
                                icon: () => h(NIcon, null, {
                                    default: () => h('i', { class: 'fa-solid fa-pen-to-square' })
                                })
                            }
                        ),
                        (row.ChucVu !== 'Admin' || isMaster.value) ? h(
                            NPopconfirm,
                            {
                                onPositiveClick: () => handleDeleteStaff(row),
                                positiveText: 'Xóa',
                                negativeText: 'Hủy'
                            },
                            {
                                trigger: () => h(
                                    NButton,
                                    {
                                        size: 'small',
                                        type: 'error',
                                        secondary: true
                                    },
                                    {
                                        default: () => 'Xóa',
                                        icon: () => h(NIcon, null, {
                                            default: () => h('i', { class: 'fa-solid fa-trash' })
                                        })
                                    }
                                ),
                                default: () => 'Bạn có chắc muốn xóa nhân viên này?'
                            }
                        ) : null
                    ].filter(Boolean)
                }
            );
        }
    }
];

// Pagination
const pagination = {
    pageSize: 10
};

// Chart data - Staff vs System borrows
const borrowDistributionChartOptions = computed(() => ({
    series: [statistics.value.staffBorrows, statistics.value.systemBorrows],
    chart: {
        type: 'donut',
        height: 280
    },
    labels: ['Thủ thư lập', 'Hệ thống lập'],
    colors: ['#2080f0', '#18a058'],
    legend: {
        position: 'bottom'
    },
    dataLabels: {
        enabled: true,
        formatter: function (val, opts) {
            return opts.w.config.series[opts.seriesIndex];
        }
    },
    plotOptions: {
        pie: {
            donut: {
                labels: {
                    show: true,
                    total: {
                        show: true,
                        label: 'Tổng phiếu',
                        formatter: () => statistics.value.totalBorrows
                    }
                }
            }
        }
    }
}));

// Chart data - Individual staff performance
const staffPerformanceChartOptions = computed(() => {
    const topStaff = statistics.value.staffBorrowStats.slice(0, 5);
    return {
        series: [{
            name: 'Số phiếu lập',
            data: topStaff.map(s => s.borrowCount)
        }],
        chart: {
            type: 'bar',
            height: 280,
            toolbar: {
                show: false
            }
        },
        plotOptions: {
            bar: {
                borderRadius: 8,
                horizontal: true,
                distributed: true
            }
        },
        colors: ['#2080f0', '#18a058', '#f0a020', '#d03050', '#8b5cf6'],
        dataLabels: {
            enabled: true,
            formatter: (val) => val + ' phiếu'
        },
        xaxis: {
            categories: topStaff.map(s => s.HoTenNV)
        },
        legend: {
            show: false
        }
    };
});
</script>

<template>
    <NSpace vertical class="p-4">
        <!-- Header with statistics -->
        <NSpace vertical class="p-8 shadow-md rounded-md bg-white dark:bg-slate-600/30">
            <h1 class="text-3xl uppercase font-semibold">Quản lý nhân viên</h1>
            <NGrid :cols="isMaster ? 4 : 3" x-gap="12" y-gap="12" class="my-4">
                <NGi :span="1">
                    <NStatistic
                        label="Tổng nhân viên"
                        class="relative w-full ring-2 ring-blue-500 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-600/50 dark:to-blue-700/50 shadow-md text-white rounded-md p-4"
                    >
                        <NNumberAnimation 
                            ref="numberAnimation" 
                            :from="0" 
                            :to="statistics.totalStaff" 
                            :active="true"
                        />
                        <template #prefix>
                            <NIcon size="28" class="mr-2">
                                <i class="fa-solid fa-users"></i>
                            </NIcon>
                        </template>
                    </NStatistic>
                </NGi>
                <NGi :span="1" v-if="isMaster">
                    <NStatistic
                        label="Admin"
                        class="relative w-full ring-2 ring-red-500 bg-gradient-to-r from-red-600 to-red-700 dark:from-red-600/50 dark:to-red-700/50 shadow-md text-white rounded-md p-4"
                    >
                        <NNumberAnimation 
                            :from="0" 
                            :to="statistics.totalAdmins" 
                            :active="true"
                        />
                        <template #prefix>
                            <NIcon size="28" class="mr-2">
                                <i class="fa-solid fa-user-shield"></i>
                            </NIcon>
                        </template>
                    </NStatistic>
                </NGi>
                <NGi :span="1">
                    <NStatistic
                        label="Thủ thư"
                        class="relative w-full ring-2 ring-green-500 bg-gradient-to-r from-green-600 to-green-700 dark:from-green-600/50 dark:to-green-700/50 shadow-md text-white rounded-md p-4"
                    >
                        <NNumberAnimation 
                            :from="0" 
                            :to="statistics.totalLibrarians" 
                            :active="true"
                        />
                        <template #prefix>
                            <NIcon size="28" class="mr-2">
                                <i class="fa-solid fa-user-tie"></i>
                            </NIcon>
                        </template>
                    </NStatistic>
                </NGi>
                <NGi :span="1">
                    <NStatistic
                        label="Tỷ lệ lập phiếu"
                        class="relative w-full ring-2 ring-purple-500 bg-gradient-to-r from-purple-600 to-purple-700 dark:from-purple-600/50 dark:to-purple-700/50 shadow-md text-white rounded-md p-4"
                    >
                        <template #default>
                            <span class="text-2xl font-semibold">{{ statistics.staffBorrowRate }}%</span>
                        </template>
                        <template #prefix>
                            <NIcon size="28" class="mr-2">
                                <i class="fa-solid fa-chart-pie"></i>
                            </NIcon>
                        </template>
                    </NStatistic>
                </NGi>
            </NGrid>
        </NSpace>

        <!-- Charts Section -->
        <NGrid :cols="2" x-gap="12" y-gap="12">
            <NGi :span="1">
                <NSpace vertical class="p-8 shadow-md rounded-md bg-white dark:bg-slate-600/30 h-full">
                    <h1 class="text-2xl uppercase font-semibold">Phân bổ phiếu mượn</h1>
                    <div class="my-4">
                        <Chart
                            v-if="statistics.totalBorrows > 0"
                            :options="borrowDistributionChartOptions"
                        />
                        <NEmpty v-else description="Chưa có dữ liệu" />
                    </div>
                </NSpace>
            </NGi>
            <NGi :span="1">
                <NSpace vertical class="p-8 shadow-md rounded-md bg-white dark:bg-slate-600/30 h-full">
                    <h1 class="text-2xl uppercase font-semibold">Top 5 thủ thư</h1>
                    <div class="my-4">
                        <Chart
                            v-if="statistics.staffBorrowStats.length > 0"
                            :options="staffPerformanceChartOptions"
                        />
                        <NEmpty v-else description="Chưa có dữ liệu" />
                    </div>
                </NSpace>
            </NGi>
        </NGrid>

        <!-- Master Key Section -->
        <NSpace vertical class="p-8 shadow-md rounded-md bg-gradient-to-r from-slate-600 to-slate-700 text-white">
            <div class="flex justify-between items-center">
                <div>
                    <h2 class="text-2xl font-bold flex items-center gap-2">
                        <NIcon size="28">
                            <i class="fa-solid fa-key"></i>
                        </NIcon>
                        Chế độ Master
                    </h2>
                </div>
                <NSpace>
                    <NButton 
                        v-if="!isMaster"
                        type="warning" 
                        size="large"
                        @click="showMasterKeyInput = !showMasterKeyInput"
                    >
                        <template #icon>
                            <NIcon><i class="fa-solid fa-unlock"></i></NIcon>
                        </template>
                        {{ showMasterKeyInput ? 'Ẩn' : 'Kích hoạt Master' }}
                    </NButton>
                    <NButton 
                        v-if="isMaster"
                        type="error" 
                        size="large"
                        @click="clearMasterKey"
                    >
                        <template #icon>
                            <NIcon><i class="fa-solid fa-lock"></i></NIcon>
                        </template>
                        Thoát Master
                    </NButton>
                </NSpace>
            </div>
            
            <div v-if="showMasterKeyInput && !isMaster" class="mt-4">
                <NSpace>
                    <NInput
                        v-model:value="masterKey"
                        type="password"
                        show-password-on="click"
                        placeholder="Nhập Master Key..."
                        style="width: 400px;"
                        @keyup.enter="applyMasterKey"
                    >
                        <template #prefix>
                            <NIcon><i class="fa-solid fa-key"></i></NIcon>
                        </template>
                    </NInput>
                    <NButton type="success" @click="applyMasterKey">
                        <template #icon>
                            <NIcon><i class="fa-solid fa-check"></i></NIcon>
                        </template>
                        Xác nhận
                    </NButton>
                </NSpace>
            </div>
        </NSpace>

        <!-- Staff List Section -->
        <NSpace vertical class="p-8 shadow-md rounded-md bg-white dark:bg-slate-600/30">
            <div class="flex justify-between items-center">
                <h1 class="text-3xl uppercase font-semibold">
                    Danh sách {{ isMaster ? 'tất cả nhân viên' : 'thủ thư' }}
                </h1>
                <NButton type="success" @click="handleCreateStaff">
                    <template #icon>
                        <NIcon><i class="fa-solid fa-plus"></i></NIcon>
                    </template>
                    Thêm nhân viên
                </NButton>
            </div>
            
            <!-- Filter Controls -->
            <NSpace class="my-4" align="center" justify="space-between">
                <NGrid cols="3" x-gap="12" y-gap="12" class="w-full">
                    <NGi :span="2">
                        <NInput 
                            v-model:value="filterData.query" 
                            clearable
                            class="w-full" 
                            placeholder="Tìm kiếm theo tên, SĐT, MSNV..."
                        >
                            <template #prefix>
                                <i class="fa-solid fa-magnifying-glass"></i>
                            </template>
                        </NInput>
                    </NGi>
                    <NGi :span="1">
                        <NSelect 
                            v-model:value="filterData.chucVu"
                            clearable
                            :options="positionOptions" 
                            placeholder="Lọc theo chức vụ..."
                        />
                    </NGi>
                </NGrid>
            </NSpace>

            <!-- Staff Table -->
            <div v-if="loading" class="flex justify-center items-center py-12">
                <NSpin size="large" />
            </div>
            <div v-else-if="currentStaff.length === 0 && !filterData.query && filterData.chucVu === null">
                <NEmpty description="Chưa có nhân viên nào" />
            </div>
            <div v-else-if="currentStaff.length === 0">
                <NEmpty description="Không tìm thấy nhân viên phù hợp" />
            </div>
            <NDataTable
                v-else
                :columns="columns"
                :data="currentStaff"
                :bordered="false"
                :single-line="false"
                :scroll-x="1200"
                :max-height="600"
                :pagination="pagination"
            />
        </NSpace>

        <!-- Create/Edit Modal -->
        <NModal
            v-model:show="showModal"
            preset="card"
            :title="modalMode === 'create' ? 'Thêm nhân viên mới' : 'Cập nhật thông tin nhân viên'"
            :style="{ width: '600px' }"
            :bordered="false"
            :segmented="{
                content: true,
                footer: true
            }"
        >
            <NForm :model="formData" :rules="rules">
                <NFormItem label="Họ tên" path="HoTenNV" required>
                    <NInput
                        v-model:value="formData.HoTenNV"
                        placeholder="Nhập họ tên nhân viên"
                    />
                </NFormItem>

                <NFormItem label="Số điện thoại" path="soDienThoai" required>
                    <NInput
                        v-model:value="formData.soDienThoai"
                        placeholder="Nhập số điện thoại (10 chữ số)"
                        maxlength="10"
                    />
                </NFormItem>

                <NFormItem label="Địa chỉ" path="DiaChi" required>
                    <NInput
                        v-model:value="formData.DiaChi"
                        type="textarea"
                        placeholder="Nhập địa chỉ"
                        :rows="3"
                    />
                </NFormItem>

                <NFormItem 
                    label="Mật khẩu" 
                    path="Password" 
                    :required="modalMode === 'create'"
                >
                    <NInput
                        v-model:value="formData.Password"
                        type="password"
                        show-password-on="click"
                        :placeholder="modalMode === 'create' ? 'Nhập mật khẩu' : 'Để trống nếu không đổi'"
                    />
                </NFormItem>
            </NForm>

            <template #footer>
                <NSpace justify="end">
                    <NButton @click="showModal = false" :disabled="submitting">Hủy</NButton>
                    <NButton 
                        type="primary" 
                        @click="submitForm" 
                        :loading="submitting"
                        :disabled="submitting"
                    >
                        {{ modalMode === 'create' ? 'Thêm' : 'Cập nhật' }}
                    </NButton>
                </NSpace>
            </template>
        </NModal>
    </NSpace>
</template>

<style scoped>
/* Custom styles */
</style>
