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
    NInputNumber,
    NRadioGroup,
    NRadio,
    NGrid,
    NGi,
    NSpin,
    NEmpty,
    NNumberAnimation,
    NSelect,
    NDrawer,
    NDrawerContent,
    NDescriptions,
    NDescriptionsItem,
    useMessage,
    useDialog
} from 'naive-ui';
import { ref, onMounted, h, computed, watch, reactive } from 'vue';
import { getUserStatistics, getAllUsers, lockUser, unlockUser } from '../../../services/apiUser';
import Chart from '../../../components/Chart.vue';

const message = useMessage();
const dialog = useDialog();

// State
const loading = ref(false);
const statistics = ref({
    totalUsers: 0,
    activeUsers: 0,
    lockedUsers: 0,
    newUsers: 0,
    usersWithViolations: 0
});
const allUsers = ref([]);
const currentUsers = ref([]);
const showLockModal = ref(false);
const lockFormData = ref({
    userId: '',
    reason: '',
    duration: 0,
    durationType: 'permanent' // 'permanent' | 'temporary'
});
const showUserDetail = ref(false);
const selectedUser = ref(null);


// Filter data
const filterData = reactive({
    query: null,
    status: null
});

// Number animation ref
const numberAnimation = ref(null);

// Status filter options
const statusOptions = [
    { label: 'Tất cả', value: null },
    { label: 'Hoạt động', value: true },
    { label: 'Bị khóa', value: false }
];

// Lifecycle
onMounted(async () => {
    await Promise.all([
        loadStatistics(),
        loadUsers()
    ]);
    numberAnimation.value?.play();
});

// Methods
const loadStatistics = async () => {
    try {
        const response = await getUserStatistics();
        statistics.value = response.data;
    } catch (error) {
        message.error('Không thể tải thống kê người dùng');
    }
};

const loadUsers = async () => {
    loading.value = true;
    try {
        const response = await getAllUsers();
        allUsers.value = response.data || [];
    } catch (error) {
        message.error('Không thể tải danh sách người dùng');
    } finally {
        loading.value = false;
    }
};

// Filter users
const filterUsers = (filters) => {
    const query = filters.query ? filters.query.toLowerCase() : null;
    const status = filters.status;

    let resultUsers = allUsers.value;

    // Filter by query (search by name, email, phone, ID)
    if (query) {
        resultUsers = resultUsers.filter(user => {
            const fullName = `${user.HOLOT || ''} ${user.TEN}`.toLowerCase();
            const email = user.EMAIL ? user.EMAIL.toLowerCase() : '';
            const phone = user.DIENTHOAI || '';
            const id = user.MADOCGIA || '';
            
            return fullName.includes(query) || 
                   email.includes(query) || 
                   phone.includes(query) ||
                   id.includes(query);
        });
    }

    // Filter by status
    if (status !== null) {
        resultUsers = resultUsers.filter(user => user.TRANGTHAI === status);
    }

    currentUsers.value = resultUsers;
};

// Watch for filter changes
watch(filterData, (newFilterData) => {
    filterUsers(newFilterData);
});

watch(allUsers, () => {
    filterUsers(filterData);
});

// Format date
const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
};

// Handle lock user
const handleLockUser = (user) => {
    lockFormData.value = {
        userId: user.MADOCGIA,
        reason: '',
        duration: 7,
        durationType: 'temporary'
    };
    showLockModal.value = true;
};

// Submit lock
const submitLock = async () => {
    if (!lockFormData.value.reason.trim()) {
        message.warning('Vui lòng nhập lý do khóa tài khoản');
        return;
    }
    
    try {
        const duration = lockFormData.value.durationType === 'permanent' 
            ? 0 
            : lockFormData.value.duration;
            
        await lockUser(
            lockFormData.value.userId, 
            lockFormData.value.reason,
            duration
        );
        
        message.success('Khóa tài khoản thành công');
        showLockModal.value = false;
        await loadUsers();
        await loadStatistics();
    } catch (error) {
        message.error(error.response?.data?.message || 'Không thể khóa tài khoản');
    }
};

// Handle unlock user
const handleUnlockUser = (user) => {
    dialog.warning({
        title: 'Xác nhận mở khóa',
        content: `Bạn có chắc muốn mở khóa tài khoản "${user.HOLOT} ${user.TEN}" (${user.MADOCGIA})?`,
        positiveText: 'Xác nhận',
        negativeText: 'Hủy',
        onPositiveClick: async () => {
            try {
                await unlockUser(user.MADOCGIA);
                message.success('Mở khóa tài khoản thành công');
                await loadUsers();
                await loadStatistics();
            } catch (error) {
                message.error(error.response?.data?.message || 'Không thể mở khóa tài khoản');
            }
        }
    });
};

// Handle view user detail
const handleViewUserDetail = (user) => {
    selectedUser.value = user;
    showUserDetail.value = true;
};

// Table columns
const columns = [
    {
        title: 'Mã ĐG',
        key: 'MADOCGIA',
        width: 100,
        fixed: 'left',
        render: (row) => {
            return h(
                'span',
                {
                    class: 'cursor-pointer text-blue-600 hover:text-blue-800 hover:underline',
                    onClick: () => handleViewUserDetail(row)
                },
                row.MADOCGIA
            );
        }
    },
    {
        title: 'Họ tên',
        key: 'fullName',
        width: 200,
        render: (row) => `${row.HOLOT || ''} ${row.TEN}`
    },
    {
        title: 'Email',
        key: 'EMAIL',
        width: 200,
        ellipsis: {
            tooltip: true
        }
    },
    {
        title: 'Điện thoại',
        key: 'DIENTHOAI',
        width: 120
    },
    {
        title: 'Gói dịch vụ',
        key: 'package',
        width: 150,
        render: (row) => {
            return h(
                NTag,
                { type: 'info', size: 'small' },
                { default: () => row.GOI?.MaGoi || 'N/A' }
            );
        }
    },
    {
        title: 'Ngày đăng ký',
        key: 'registerDate',
        width: 120,
        render: (row) => formatDate(row.GOI?.NgayDangKy)
    },
    {
        title: 'Hạn dùng',
        key: 'expiryDate',
        width: 120,
        render: (row) => formatDate(row.GOI?.NgayHetHan)
    },
    {
        title: 'Trạng thái',
        key: 'TRANGTHAI',
        width: 120,
        fixed: 'right',
        render: (row) => {
            if (row.TRANGTHAI) {
                return h(
                    NTag,
                    { type: 'success', size: 'small' },
                    { 
                        default: () => 'Hoạt động',
                        icon: () => h(NIcon, null, {
                            default: () => h('i', { class: 'fa-solid fa-check-circle' })
                        })
                    }
                );
            } else {
                const unlockDate = row.NGAYMOKHOA 
                    ? formatDate(row.NGAYMOKHOA)
                    : 'Vĩnh viễn';
                return h(
                    NTag,
                    { type: 'error', size: 'small' },
                    {
                        default: () => `Đã khóa${row.NGAYMOKHOA ? ` (${unlockDate})` : ''}`,
                        icon: () => h(NIcon, null, {
                            default: () => h('i', { class: 'fa-solid fa-lock' })
                        })
                    }
                );
            }
        }
    },
    {
        title: 'Thao tác',
        key: 'actions',
        width: 100,
        fixed: 'right',
        render: (row) => {
            if (row.TRANGTHAI) {
                return h(
                    NButton,
                    {
                        size: 'small',
                        type: 'error',
                        secondary: true,
                        onClick: () => handleLockUser(row)
                    },
                    {
                        default: () => 'Khóa',
                        icon: () => h(NIcon, null, {
                            default: () => h('i', { class: 'fa-solid fa-lock' })
                        })
                    }
                );
            } else {
                return h(
                    NButton,
                    {
                        size: 'small',
                        type: 'success',
                        secondary: true,
                        onClick: () => handleUnlockUser(row)
                    },
                    {
                        default: () => 'Mở khóa',
                        icon: () => h(NIcon, null, {
                            default: () => h('i', { class: 'fa-solid fa-lock-open' })
                        })
                    }
                );
            }
        }
    }
];

// Pagination
const pagination = {
    pageSize: 10
};

// Chart data - Biểu đồ cột tỷ lệ người dùng vi phạm
const violationChartOptions = computed(() => {
    const violationRate = statistics.value.totalUsers > 0 
        ? ((statistics.value.usersWithViolations / statistics.value.totalUsers) * 100).toFixed(1)
        : 0;
    const normalRate = (100 - parseFloat(violationRate)).toFixed(1);
    
    return {
        series: [{
            name: 'Số lượng',
            data: [
                statistics.value.totalUsers - statistics.value.usersWithViolations,
                statistics.value.usersWithViolations
            ]
        }],
        chart: {
            type: 'bar',
            height: 300,
            toolbar: {
                show: false
            }
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '50%',
                dataLabels: {
                    position: 'top'
                }
            }
        },
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
            categories: ['Không vi phạm', 'Có vi phạm'],
            labels: {
                style: {
                    fontSize: '12px'
                }
            }
        },
        yaxis: {
            title: {
                text: 'Số lượng người dùng'
            }
        },
        colors: ['#18a058', '#f0a020'],
        legend: {
            show: false
        },
        title: {
            text: `Tỷ lệ vi phạm: ${violationRate}%`,
            align: 'center',
            style: {
                fontSize: '14px',
                fontWeight: 600
            }
        }
    };
});

// Biểu đồ radar trạng thái người dùng
const userRadarChartOptions = computed(() => ({
    series: [{
        name: 'Số lượng',
        data: [
            statistics.value.activeUsers,
            statistics.value.lockedUsers,
            statistics.value.usersWithViolations,
            statistics.value.newUsers,
            statistics.value.totalUsers - statistics.value.newUsers
        ]
    }],
    chart: {
        type: 'radar',
        height: 300,
        toolbar: {
            show: false
        }
    },
    xaxis: {
        categories: ['Hoạt động', 'Bị khóa', 'Vi phạm', 'Mới', 'Cũ']
    },
    colors: ['#18a058'],
    stroke: {
        width: 2
    },
    fill: {
        opacity: 0.2
    },
    markers: {
        size: 4
    },
    yaxis: {
        stepSize: Math.ceil(statistics.value.totalUsers / 5)
    },
    title: {
        text: 'Phân tích trạng thái người dùng',
        align: 'center',
        style: {
            fontSize: '14px',
            fontWeight: 600
        }
    }
}));
</script>

<template>
    <NSpace vertical class="p-4">
        <!-- Header with statistics -->
        <NSpace vertical class="p-8 shadow-md rounded-md bg-white dark:bg-slate-600/30">
            <h1 class="text-3xl uppercase font-semibold">Quản lý người dùng</h1>
            <NGrid :cols="3" x-gap="12" y-gap="12" class="my-4">
                <NGi :span="1">
                    <NStatistic
                        label="Tổng người dùng"
                        class="relative w-full ring-2 ring-blue-500 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-600/50 dark:to-blue-700/50 shadow-md text-white rounded-md p-4"
                    >
                        <NNumberAnimation 
                            ref="numberAnimation" 
                            :from="0" 
                            :to="statistics.totalUsers" 
                            :active="true"
                        />
                        <template #prefix>
                            <NIcon size="28" class="mr-2">
                                <i class="fa-solid fa-users"></i>
                            </NIcon>
                        </template>
                    </NStatistic>
                </NGi>
                <NGi :span="1">
                    <NStatistic
                        label="Bị khóa"
                        class="relative w-full ring-2 ring-red-500 bg-gradient-to-r from-red-600 to-red-700 dark:from-red-600/50 dark:to-red-700/50 shadow-md text-white rounded-md p-4"
                    >
                        <NNumberAnimation 
                            :from="0" 
                            :to="statistics.lockedUsers" 
                            :active="true"
                        />
                        <template #prefix>
                            <NIcon size="28" class="mr-2">
                                <i class="fa-solid fa-user-lock"></i>
                            </NIcon>
                        </template>
                    </NStatistic>
                </NGi>
                <NGi :span="1">
                    <NStatistic
                        label="Có vi phạm"
                        class="relative w-full ring-2 ring-orange-500 bg-gradient-to-r from-orange-600 to-orange-700 dark:from-orange-600/50 dark:to-orange-700/50 shadow-md text-white rounded-md p-4"
                    >
                        <NNumberAnimation 
                            :from="0" 
                            :to="statistics.usersWithViolations" 
                            :active="true"
                        />
                        <template #prefix>
                            <NIcon size="28" class="mr-2">
                                <i class="fa-solid fa-triangle-exclamation"></i>
                            </NIcon>
                        </template>
                    </NStatistic>
                </NGi>
            </NGrid>
        </NSpace>

        <!-- User Chart Section -->
        <NSpace vertical class="p-8 shadow-md rounded-md bg-white dark:bg-slate-600/30">
            <h1 class="text-2xl uppercase font-semibold">Biểu đồ trạng thái</h1>
            <div v-if="statistics.totalUsers > 0">
                <NGrid :cols="2" x-gap="24" y-gap="12" class="my-4">
                    <NGi :span="1">
                        <Chart :options="violationChartOptions" />
                    </NGi>
                    <NGi :span="1">
                        <Chart :options="userRadarChartOptions" />
                    </NGi>
                </NGrid>
            </div>
            <NEmpty v-else description="Chưa có dữ liệu" class="my-4" />
        </NSpace>

        <!-- Users List Section -->
        <NSpace vertical class="p-8 shadow-md rounded-md bg-white dark:bg-slate-600/30">
            <h1 class="text-3xl uppercase font-semibold">Danh sách người dùng</h1>
            
            <!-- Filter Controls -->
            <NSpace class="my-4" align="center" justify="space-between">
                <NGrid cols="3" x-gap="12" y-gap="12" class="w-full">
                    <NGi :span="2">
                        <NInput 
                            v-model:value="filterData.query" 
                            clearable
                            class="min-w-md" 
                            placeholder="Tìm kiếm theo tên, email, SĐT, mã ĐG..."
                        >
                            <template #prefix>
                                <i class="fa-solid fa-magnifying-glass"></i>
                            </template>
                        </NInput>
                    </NGi>
                    <NGi :span="1">
                        <NSelect 
                            v-model:value="filterData.status"
                            clearable
                            :options="statusOptions" 
                            placeholder="Lọc theo trạng thái..."
                        />
                    </NGi>
                </NGrid>
            </NSpace>

            <!-- Users Table -->
            <div v-if="loading" class="flex justify-center items-center py-12">
                <NSpin size="large" />
            </div>
            <div v-else-if="currentUsers.length === 0 && !filterData.query && filterData.status === null">
                <NEmpty description="Chưa có người dùng nào" />
            </div>
            <div v-else-if="currentUsers.length === 0">
                <NEmpty description="Không tìm thấy người dùng phù hợp" />
            </div>
            <NDataTable
                v-else
                :columns="columns"
                :data="currentUsers"
                :bordered="false"
                :single-line="false"
                :scroll-x="1400"
                :max-height="600"
                :pagination="pagination"
            />
        </NSpace>

        <!-- Lock User Modal -->
        <NModal
            v-model:show="showLockModal"
            preset="card"
            title="Khóa tài khoản người dùng"
            :style="{ width: '600px' }"
            :bordered="false"
            :segmented="{
                content: true,
                footer: true
            }"
        >
            <NForm>
                <NFormItem label="Loại khóa" required>
                    <NRadioGroup v-model:value="lockFormData.durationType">
                        <NSpace>
                            <NRadio value="temporary">Tạm thời</NRadio>
                            <NRadio value="permanent">Vĩnh viễn</NRadio>
                        </NSpace>
                    </NRadioGroup>
                </NFormItem>

                <NFormItem 
                    v-if="lockFormData.durationType === 'temporary'"
                    label="Thời gian khóa (ngày)" 
                    required
                >
                    <NInputNumber
                        v-model:value="lockFormData.duration"
                        :min="1"
                        :max="365"
                        placeholder="Nhập số ngày"
                        class="w-full"
                    />
                </NFormItem>

                <NFormItem label="Lý do khóa" required>
                    <NInput
                        v-model:value="lockFormData.reason"
                        type="textarea"
                        placeholder="Nhập lý do khóa tài khoản..."
                        :rows="4"
                        maxlength="500"
                        show-count
                    />
                </NFormItem>
            </NForm>

            <template #footer>
                <NSpace justify="end">
                    <NButton @click="showLockModal = false">Hủy</NButton>
                    <NButton type="error" @click="submitLock">
                        <template #icon>
                            <NIcon><i class="fa-solid fa-lock"></i></NIcon>
                        </template>
                        Khóa tài khoản
                    </NButton>
                </NSpace>
            </template>
        </NModal>

        <!-- User Detail Drawer -->
        <NDrawer
            v-model:show="showUserDetail"
            :width="500"
            placement="right"
        >
            <NDrawerContent 
                v-if="selectedUser"
                title="Thông tin chi tiết người dùng"
                closable
            >
                <NSpace vertical size="large">
                    <!-- Thông tin cá nhân -->
                    <div>
                        <h3 class="text-lg font-semibold mb-3 flex items-center">
                            <NIcon size="20" class="mr-2">
                                <i class="fa-solid fa-user"></i>
                            </NIcon>
                            Thông tin cá nhân
                        </h3>
                        <NDescriptions :column="1" bordered size="small">
                            <NDescriptionsItem label="Mã độc giả">
                                {{ selectedUser.MADOCGIA }}
                            </NDescriptionsItem>
                            <NDescriptionsItem label="Họ tên">
                                {{ selectedUser.HOLOT }} {{ selectedUser.TEN }}
                            </NDescriptionsItem>
                            <NDescriptionsItem label="Email">
                                {{ selectedUser.EMAIL || "Chưa cập nhật"}}
                            </NDescriptionsItem>
                            <NDescriptionsItem label="Điện thoại">
                                {{ selectedUser.DIENTHOAI || 'N/A' }}
                            </NDescriptionsItem>
                            <NDescriptionsItem label="Ngày sinh">
                                {{ formatDate(selectedUser.NGAYSINH) }}
                            </NDescriptionsItem>
                            <NDescriptionsItem label="Địa chỉ">
                                {{ selectedUser.DIACHI || 'N/A' }}
                            </NDescriptionsItem>
                        </NDescriptions>
                    </div>

                    <!-- Thông tin gói dịch vụ -->
                    <div>
                        <h3 class="text-lg font-semibold mb-3 flex items-center">
                            <NIcon size="20" class="mr-2">
                                <i class="fa-solid fa-box"></i>
                            </NIcon>
                            Gói dịch vụ
                        </h3>
                        <NDescriptions :column="1" bordered size="small">
                            <NDescriptionsItem label="Gói hiện tại">
                                <NTag type="info" size="small">
                                    {{ selectedUser.GOI?.MaGoi || 'N/A' }}
                                </NTag>
                            </NDescriptionsItem>
                            <NDescriptionsItem label="Ngày đăng ký">
                                {{ formatDate(selectedUser.GOI?.NgayDangKy) }}
                            </NDescriptionsItem>
                            <NDescriptionsItem label="Ngày hết hạn">
                                {{ formatDate(selectedUser.GOI?.NgayHetHan) }}
                            </NDescriptionsItem>
                        </NDescriptions>
                    </div>

                    <!-- Thông tin vi phạm -->
                    <div>
                        <h3 class="text-lg font-semibold mb-3 flex items-center">
                            <NIcon size="20" class="mr-2">
                                <i class="fa-solid fa-triangle-exclamation"></i>
                            </NIcon>
                            Thông tin vi phạm
                        </h3>
                        <NDescriptions :column="1" bordered size="small">
                            <NDescriptionsItem label="Số lần vi phạm">
                                <NTag 
                                    :type="(selectedUser.CACVIPHAM?.length || 0) > 0 ? 'warning' : 'success'"
                                    size="small"
                                >
                                    {{ selectedUser.CACVIPHAM?.length || 0 }} lần
                                </NTag>
                            </NDescriptionsItem>
                            <NDescriptionsItem 
                                v-if="selectedUser.CACVIPHAM?.length > 0" 
                                label="Chi tiết vi phạm"
                            >
                                <NSpace vertical size="small">
                                    <div 
                                        v-for="(vp, index) in selectedUser.CACVIPHAM" 
                                        :key="index"
                                        class="text-sm p-2 bg-orange-50 dark:bg-orange-900/20 rounded"
                                    >
                                        <div class="flex justify-between items-center">
                                            <NTag 
                                                :type="vp.LOAI === 'delay' ? 'warning' : 'error'" 
                                                size="tiny"
                                            >
                                                {{ vp.LOAI === 'delay' ? 'Trả trễ' : 'Mất sách' }}
                                            </NTag>
                                            <span class="text-gray-500 dark:text-gray-400">
                                                {{ formatDate(vp.NGAYVIPHAM) }}
                                            </span>
                                        </div>
                                        <div class="mt-1 text-orange-600 dark:text-orange-400 font-medium">
                                            Tiền phạt: {{ vp.TIENPHAT?.toLocaleString('vi-VN') || 0 }}đ
                                        </div>
                                    </div>
                                </NSpace>
                            </NDescriptionsItem>
                        </NDescriptions>
                    </div>

                    <!-- Trạng thái tài khoản -->
                    <div>
                        <h3 class="text-lg font-semibold mb-3 flex items-center">
                            <NIcon size="20" class="mr-2">
                                <i class="fa-solid fa-circle-info"></i>
                            </NIcon>
                            Trạng thái tài khoản
                        </h3>
                        <NDescriptions :column="1" bordered size="small">
                            <NDescriptionsItem label="Trạng thái">
                                <NTag 
                                    :type="selectedUser.TRANGTHAI ? 'success' : 'error'"
                                    size="small"
                                >
                                    {{ selectedUser.TRANGTHAI ? 'Hoạt động' : 'Bị khóa' }}
                                </NTag>
                            </NDescriptionsItem>
                            <NDescriptionsItem 
                                v-if="!selectedUser.TRANGTHAI && selectedUser.LYDO_KHOA"
                                label="Lý do khóa"
                            >
                                {{ selectedUser.LYDO_KHOA }}
                            </NDescriptionsItem>
                            <NDescriptionsItem 
                                v-if="!selectedUser.TRANGTHAI && selectedUser.NGAYMOKHOA"
                                label="Ngày mở khóa"
                            >
                                {{ formatDate(selectedUser.NGAYMOKHOA) }}
                            </NDescriptionsItem>
                        </NDescriptions>
                    </div>
                </NSpace>

                <template #footer>
                    <NSpace justify="end">
                        <NButton @click="showUserDetail = false">Đóng</NButton>
                        <NButton 
                            v-if="selectedUser.TRANGTHAI"
                            type="error"
                            @click="() => { showUserDetail = false; handleLockUser(selectedUser); }"
                        >
                            <template #icon>
                                <NIcon><i class="fa-solid fa-lock"></i></NIcon>
                            </template>
                            Khóa tài khoản
                        </NButton>
                        <NButton 
                            v-else
                            type="success"
                            @click="() => { showUserDetail = false; handleUnlockUser(selectedUser); }"
                        >
                            <template #icon>
                                <NIcon><i class="fa-solid fa-lock-open"></i></NIcon>
                            </template>
                            Mở khóa
                        </NButton>
                    </NSpace>
                </template>
            </NDrawerContent>
        </NDrawer>
    </NSpace>
</template>

<style scoped>
/* Custom styles for statistics */
</style>
