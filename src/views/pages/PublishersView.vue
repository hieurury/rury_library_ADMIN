<script setup>
import {
    NGrid,
    NSpace,
    NResult,
    NImage,
    NStatistic,
    NGi,
    NList,
    NListItem,
    NThing,
    NInput,
    NSelect,
    NTag,
    NDivider,
    NEllipsis,
    NSkeleton,
    NPagination,
    NPopconfirm,
    NIcon,
    useMessage,
    NModal,
    NForm,
    NFormItem,
    NButton,
    NNumberAnimation,
    NConfigProvider
} from 'naive-ui';
import axios from 'axios';
import {
    onMounted,
    reactive,
    ref,
    watch,
    computed
} from 'vue';
import { isDark } from '../../hooks/useDark';
import Chart from '../../components/Chart.vue';

//=========================== VARIABLES ===========================//
const BASE_API = import.meta.env.VITE_BASE_API;
const loading = ref(false);
const message = useMessage();
const numberAnimation = ref(null);

const statusOptions = [
    { label: 'Số sách tăng dần', value: 'asc' },
    { label: 'Số sách giảm dần', value: 'desc' },
];

const filterData = reactive({
    query: null,
    status: null
});

onMounted(async () => {
    await getPublishers();
});

//==========> Liên quan đến nhà xuất bản
const allPublishers = ref([]);
const currentPublisher = ref([]);
const publisherView = ref([]);

// Statistics
const totalPublishers = computed(() => allPublishers.value.filter(p => p.TINHTRANG !== false).length);
const totalHiddenPublishers = computed(() => allPublishers.value.filter(p => p.TINHTRANG === false).length);
const totalBooks = computed(() => allPublishers.value.reduce((acc, pub) => acc + (pub.BookCount || 0), 0));

const getPublishers = async () => {
    loading.value = true;
    try {
        const response = await axios.get(`${BASE_API}/nha-xuat-ban/all-with-stats`);
        allPublishers.value = response.data.data;
        numberAnimation.value?.play();
    } catch (error) {
        message.error('Lỗi khi tải danh sách nhà xuất bản');
    }
    loading.value = false;
};

const handleFilter = (filter) => {
    const query = filter.query ? filter.query.toLowerCase() : null;
    const status = filter.status;
    
    let result = [];

    result = allPublishers.value.filter(publisher => {
        const nameMatch = query ? publisher.TENNXB.toLowerCase().includes(query) : true;
        const addressMatch = query ? (publisher.DIACHI?.toLowerCase().includes(query) || false) : true;
        return nameMatch || addressMatch;
    });

    if (status === 'asc') {
        result.sort((a, b) => (a.BookCount || 0) - (b.BookCount || 0));
    } else if (status === 'desc') {
        result.sort((a, b) => (b.BookCount || 0) - (a.BookCount || 0));
    }
    
    currentPublisher.value = result;
};

watch(allPublishers, (newPublishers) => {
    handleFilter(filterData);
});

watch(filterData, (newFilter) => {
    handleFilter(newFilter);
});

//==========> Liên quan đến phân trang
const currentPage = ref(1);
const totalPages = ref(null);
const publishersPerPage = ref(6);

const handlePage = (publishers) => {
    const total = Math.ceil(publishers.length / publishersPerPage.value);
    totalPages.value = total;
};

watch([currentPublisher, currentPage], ([newPublishers, currentPageValue]) => {
    if (newPublishers) {
        handlePage(newPublishers);
        if(currentPageValue > totalPages.value) currentPage.value = totalPages.value;

        const startIndex = (currentPageValue - 1) * publishersPerPage.value;
        const endIndex = startIndex + publishersPerPage.value;
        publisherView.value = newPublishers.slice(startIndex, endIndex);
    }
});

//==========> Liên quan đến xóa nhà xuất bản
const deletingPublisher = ref(null);

const deletePublisher = async (maNXB) => {
    if (deletingPublisher.value) return;
    
    try {
        deletingPublisher.value = maNXB;
        const response = await axios.delete(`${BASE_API}/nha-xuat-ban/delete/${maNXB}`);
        message[response.data.status](response.data.message);
        await getPublishers();
    } catch (error) {
        message.error(error.response?.data?.message || 'Xóa nhà xuất bản thất bại');
    } finally {
        deletingPublisher.value = null;
    }
};

//==========> Liên quan đến kích hoạt nhà xuất bản
const activatingPublisher = ref(null);

const activatePublisher = async (maNXB) => {
    if (activatingPublisher.value) return;
    
    try {
        activatingPublisher.value = maNXB;
        const response = await axios.put(`${BASE_API}/nha-xuat-ban/activate/${maNXB}`);
        message[response.data.status](response.data.message);
        await getPublishers();
    } catch (error) {
        message.error(error.response?.data?.message || 'Kích hoạt nhà xuất bản thất bại');
    } finally {
        activatingPublisher.value = null;
    }
};

//==========> Liên quan đến sửa nhà xuất bản
const editModalShow = ref(false);
const editFormRef = ref(null);
const selectedPublisher = ref(null);
const submittingEdit = ref(false);

const editForm = ref({
    publisherName: '',
    publisherAddress: ''
});

const openEditModal = (publisher) => {
    selectedPublisher.value = publisher;
    editForm.value = {
        publisherName: publisher.TENNXB,
        publisherAddress: publisher.DIACHI || ''
    };
    editModalShow.value = true;
};

const rulesEdit = {
    publisherName: [
        { required: true, message: 'Vui lòng nhập tên nhà xuất bản', trigger: 'blur' },
        { min: 2, max: 100, message: 'Tên nhà xuất bản phải từ 2-100 ký tự', trigger: 'blur' }
    ]
};

const submitEditForm = async () => {
    if (submittingEdit.value) return;
    
    editFormRef.value.validate(async (error) => {
        if (!error) {
            try {
                submittingEdit.value = true;
                
                const response = await axios.put(`${BASE_API}/nha-xuat-ban/update/${selectedPublisher.value.MANXB}`, {
                    TenNXB: editForm.value.publisherName,
                    DiaChi: editForm.value.publisherAddress
                });
                
                message[response.data.status](response.data.message);
                
                if (response.data.status === 'success') {
                    editModalShow.value = false;
                    await getPublishers();
                }
            } catch (error) {
                message.error(error.response?.data?.message || 'Cập nhật nhà xuất bản thất bại');
            } finally {
                submittingEdit.value = false;
            }
        } else {
            message.error('Vui lòng điền đầy đủ thông tin!');
        }
    });
};

//==========> Biểu đồ thống kê
const chartOptions = computed(() => {
    const top10 = [...allPublishers.value]
        .sort((a, b) => (b.BookCount || 0) - (a.BookCount || 0))
        .slice(0, 10);
    
    return {
        chart: {
            type: 'bar',
            height: 300,
            toolbar: { show: false }
        },
        series: [{
            name: 'Số đầu sách',
            data: top10.map(pub => pub.BookCount || 0)
        }],
        plotOptions: {
            bar: {
                borderRadius: 4,
                horizontal: true,
                dataLabels: { position: 'top' },
                distributed: true
            }
        },
        colors: [
            '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
            '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1'
        ],
        dataLabels: {
            enabled: true,
            formatter: (val) => val,
            offsetX: 30,
            style: { fontSize: '12px', colors: ['#304758'] }
        },
        xaxis: {
            categories: top10.map(pub => pub.TENNXB),
            labels: { show: true }
        },
        yaxis: {
            labels: { show: true }
        },
        title: {
            text: 'Top 10 nhà xuất bản có nhiều sách nhất',
            floating: false,
            align: 'center',
            style: { fontSize: '16px', fontWeight: 600 }
        },
        legend: { show: false }
    };
});

const customThemeLight = ref({
    Statistic: {
        valueTextColor: '#ffffff',
        labelTextColor: '#ffffff'
    },
});

const customThemeDark = ref({});
</script>

<template>
    <NConfigProvider :theme-overrides="isDark ? customThemeDark : customThemeLight">
        <NSpace vertical class="p-4">
            <!-- Header statistics -->
            <NSpace vertical class="p-8 shadow-md rounded-md bg-white dark:bg-slate-600/30">
                <h1 class="text-3xl uppercase font-semibold">Quản lý nhà xuất bản</h1>
                <NGrid :cols="5" x-gap="12" y-gap="12" class="my-4">
                    <NGi :span="1">
                        <NStatistic
                            label="Tổng số NXB"
                            class="relative w-full ring-2 ring-blue-500 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-600/50 dark:to-blue-700/50 shadow-md text-white rounded-md p-4"
                        >
                            <NNumberAnimation ref="numberAnimation" :from="0" :to="totalPublishers" :active="true"/>
                        </NStatistic>
                    </NGi>
                    <NGi :span="1">
                        <NStatistic
                            label="NXB bị ẩn"
                            class="relative w-full ring-2 ring-red-500 bg-gradient-to-r from-red-600 to-red-700 dark:from-red-600/50 dark:to-red-700/50 shadow-md text-white rounded-md p-4"
                        >
                            <NNumberAnimation :from="0" :to="totalHiddenPublishers" :active="true"/>
                        </NStatistic>
                    </NGi>
                    <NGi :span="1">
                        <NStatistic
                            label="Tổng số đầu sách"
                            class="relative w-full ring-2 ring-green-500 bg-gradient-to-r from-green-600 to-green-700 dark:from-green-600/50 dark:to-green-700/50 shadow-md text-white rounded-md p-4"
                        >
                            <NNumberAnimation ref="numberAnimation" :from="0" :to="totalBooks" :active="true"/>
                        </NStatistic>
                    </NGi>
                    <NGi :span="2">
                        <NStatistic
                            label="Chức năng"
                            class="relative w-full ring-2 ring-slate-500 bg-gradient-to-r from-slate-700/90 to-slate-500/60 shadow-md text-white rounded-md p-4"
                        >
                            <NButton @click="$router.push('/admin/nxb/add')" type="success">
                                <i class="fa-solid fa-plus mr-2"></i> Thêm NXB mới
                            </NButton>
                        </NStatistic>
                    </NGi>
                </NGrid>
            </NSpace>

            <!-- Chart -->
            <NSpace vertical class="p-8 shadow-md rounded-md bg-white dark:bg-slate-600/30">
                <div style="height: 400px;">
                    <Chart v-if="!loading && allPublishers.length > 0" :options="chartOptions" />
                    <NResult v-else-if="!loading && allPublishers.length === 0" title="Chưa có dữ liệu" description="Chưa có nhà xuất bản nào">
                        <template #icon>
                            <NImage style="width: 100px;" :src="`${BASE_API}public/imgs/default/not-found.svg`"></NImage>
                        </template>
                    </NResult>
                </div>
            </NSpace>

            <!-- Filter & List -->
            <NSpace vertical class="p-8 shadow-md rounded-md bg-white dark:bg-slate-600/30">
                <h1 class="text-3xl uppercase font-semibold">Tất cả nhà xuất bản</h1>
                <NSpace class="my-4" align="center" justify="space-between">
                    <NGrid cols="4" x-gap="12" y-gap="12" class="w-full">
                        <NGi :span="2">
                            <NInput 
                                v-model:value="filterData.query" 
                                clearable
                                class="min-w-md" 
                                placeholder="Tìm kiếm nhà xuất bản...">
                                <template #prefix>
                                    <i class="fa-solid fa-magnifying-glass"></i>
                                </template>
                            </NInput>
                        </NGi>
                        <NGi :span="2">
                            <NSelect 
                                v-model:value="filterData.status"
                                clearable
                                :options="statusOptions" 
                                placeholder="Sắp xếp theo..." >
                            </NSelect>
                        </NGi>
                    </NGrid>
                </NSpace>

                <!-- List publishers -->
                <NList clickable hoverable show-divider="true">
                    <NGrid cols="3" x-gap="12" y-gap="12" class="p-2">
                        <NGi v-if="currentPublisher && currentPublisher.length > 0" span="1" v-for="publisher in publisherView" :key="publisher.MANXB">
                            <NListItem 
                                class="dark:bg-gray-600/20 h-full group bg-transparent shadow rounded-md p-4 relative"
                                :class="{ 'ring-2 ring-red-500': !publisher.TINHTRANG }"
                            >
                                <span class="absolute hidden group-hover:block top-2 right-2 z-10">
                                    <NSpace>
                                        <!-- Nút kích hoạt lại nếu NXB đã bị ẩn -->
                                        <NPopconfirm
                                            v-if="!publisher.TINHTRANG"
                                            @positive-click="activatePublisher(publisher.MANXB)"
                                            @negative-click="() => message.info('Hủy kích hoạt')"
                                            positive-text="Kích hoạt"
                                            negative-text="Hủy"
                                            :disabled="activatingPublisher === publisher.MANXB"
                                        >
                                            <template #trigger>
                                                <NIcon :class="{ 'opacity-50': activatingPublisher === publisher.MANXB }">
                                                    <i v-if="activatingPublisher === publisher.MANXB" class="fa-solid fa-spinner fa-spin text-green-500"></i>
                                                    <i v-else class="fa-solid fa-rotate-left text-green-500 hover:text-green-700 cursor-pointer"></i>
                                                </NIcon>
                                            </template>
                                            Bạn có chắc muốn kích hoạt lại nhà xuất bản này?
                                        </NPopconfirm>

                                        <NPopconfirm
                                            @positive-click="deletePublisher(publisher.MANXB)"
                                            @negative-click="() => message.info('Hủy xóa')"
                                            positive-text="Xoá"
                                            negative-text="Hủy"
                                            :disabled="deletingPublisher === publisher.MANXB"
                                        >
                                            <template #trigger>
                                                <NIcon :class="{ 'opacity-50': deletingPublisher === publisher.MANXB }">
                                                    <i v-if="deletingPublisher === publisher.MANXB" class="fa-solid fa-spinner fa-spin text-red-500"></i>
                                                    <i v-else class="fa-solid fa-trash text-red-500 hover:text-red-700 cursor-pointer"></i>
                                                </NIcon>
                                            </template>
                                            {{ !publisher.TINHTRANG 
                                                ? 'NXB đã bị ẩn. Xoá lần nữa sẽ xoá vĩnh viễn NXB này và tất cả sách liên quan!' 
                                                : 'Bạn có chắc muốn ẩn nhà xuất bản này?' 
                                            }}
                                        </NPopconfirm>
                                        
                                        <NIcon @click="openEditModal(publisher)">
                                            <i class="fa-solid fa-pen-to-square text-blue-500 hover:text-blue-700 cursor-pointer"></i>
                                        </NIcon>
                                    </NSpace>
                                </span>

                                <NThing>
                                    <template #avatar>
                                        <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-xl font-bold">
                                            {{ publisher.TENNXB.charAt(0).toUpperCase() }}
                                        </div>
                                    </template>
                                    <template #header>
                                        <NEllipsis :line-clamp="1">
                                            <span class="font-semibold text-lg">{{ publisher.TENNXB }}</span>
                                        </NEllipsis>
                                    </template>
                                    <template #header-extra>
                                        <NSpace size="small">
                                            <NTag v-if="!publisher.TINHTRANG" type="error" size="small">Đã ẩn</NTag>
                                            <NTag type="info" size="small">{{ publisher.MANXB }}</NTag>
                                        </NSpace>
                                    </template>
                                    <template #description>
                                        <NSpace vertical size="small">
                                            <div class="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                                <i class="fa-solid fa-location-dot"></i>
                                                <NEllipsis :line-clamp="1">
                                                    {{ publisher.DIACHI || 'Chưa cập nhật địa chỉ' }}
                                                </NEllipsis>
                                            </div>
                                            <NDivider class="!my-2" />
                                            <div class="flex items-center gap-2">
                                                <i class="fa-solid fa-book text-green-500"></i>
                                                <span>Số đầu sách: <strong class="text-green-600">{{ publisher.BookCount || 0 }}</strong></span>
                                            </div>
                                        </NSpace>
                                    </template>
                                </NThing>
                            </NListItem>
                        </NGi>

                        <NGi span="3" class="min-h-36" v-if="!loading && currentPublisher.length === 0">
                            <NResult
                                title="Không tìm thấy nhà xuất bản"
                                description="Thử tìm kiếm với từ khóa khác"
                            >
                                <template #icon>
                                    <NImage style="width: 100px;" :src="`${BASE_API}public/imgs/default/not-found.svg`"></NImage>
                                </template>
                            </NResult>
                        </NGi>

                        <NGi v-if="loading" v-for="n in 6" :key="n">
                            <NSkeleton class="min-h-36"></NSkeleton>
                        </NGi>
                    </NGrid>
                </NList>

                <NSpace v-show="totalPages > 1" justify="center">
                    <NPagination v-model:page="currentPage" :page-count="totalPages" :page-size="publishersPerPage"></NPagination>
                </NSpace>
            </NSpace>
        </NSpace>
    </NConfigProvider>

    <!-- Modal sửa NXB -->
    <NModal 
        v-model:show="editModalShow" 
        title="Sửa thông tin nhà xuất bản" 
        preset="dialog"
        type="default"
        class="dark:bg-slate-700 max-w-lg"
    >
        <NSpace vertical>
            <NForm ref="editFormRef" :model="editForm" :rules="rulesEdit" label-width="120px">
                <NFormItem label="Tên NXB" path="publisherName" required>
                    <NInput v-model:value="editForm.publisherName" placeholder="Nhập tên nhà xuất bản..." />
                </NFormItem>
                <NFormItem label="Địa chỉ" path="publisherAddress">
                    <NInput v-model:value="editForm.publisherAddress" placeholder="Nhập địa chỉ..." type="textarea" />
                </NFormItem>
            </NForm>
        </NSpace>

        <template #action>
            <NButton @click="editModalShow = false" :disabled="submittingEdit">Hủy</NButton>
            <NButton @click="submitEditForm" type="primary" :loading="submittingEdit" :disabled="submittingEdit">Lưu thay đổi</NButton>
        </template>
    </NModal>
</template>

<style scoped>
</style>
