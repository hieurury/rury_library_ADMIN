<script setup>
import {
    NGrid,
    NSpace,
    NStatistic,
    NGi,
    NList,
    NListItem,
    NThing,
    NInput,
    NSelect,
    NTag,
    NImage,
    NDivider,
    NEllipsis,
    useMessage,
    NSkeleton,
    NResult,
    NPagination,
    NNumberAnimation,
    NButton,
    NIcon,
    NConfigProvider,
    NModal,
    NText,
    NCard,
    NDescriptions,
    NDescriptionsItem,
    NDataTable,
    NInputNumber
}                               from    'naive-ui';
import axios                    from    'axios';
import {
    onMounted,
    ref,
    h,
    watch,
    reactive,
    computed
}                               from    'vue';

import BookMarkControll from '../../../components/BookMarkControll.vue';
import { isDark } from '../../../hooks/useDark';
import { getAllBooks, getBookTemplate } from '../../../services/apiBook';

//=========================== VARIABLES ===========================//
const BASE_API                  =       import.meta.env.VITE_BASE_API;
const message                   =       useMessage();
const loading                   =       ref(true);

//==========> Number animation
const numberAnimation           =       ref(null);
const totalBooks                =       computed(() => allBooks.value.length);
const totalBookTemplate         =       computed(() => allBooks.value.reduce((acc, book) => acc + book.SOQUYEN, 0));
const availableBooks            =       computed(() => {
    // Tính tổng số sách có sẵn (chưa mượn)
    return allBooks.value.reduce((acc, book) => acc + (book.SOQUYEN - (book.borrowedCount || 0)), 0);
});
//<========== Number animation

onMounted(async () => {
    await getAllCategories();
    await loadAllBooks();
    await getAllPublishers();
});

//==========> Liên quan đến Sách
const allBooks                  =       ref([]);
const currentBooks              =       ref([]); //danh sách sách đang hiển thị
const booksView                 =       ref(null); //tham chiếu đến view sách
const filterData                =       reactive({
    category: null,
    publisher: null,
    query: null,
    priceRange: null,
    yearRange: null,
    quantityRange: null,
    availability: null // 'all', 'available', 'unavailable'
});

const resetFilter = () => {
    filterData.category = null;
    filterData.publisher = null;
    filterData.query = null;
    filterData.priceRange = null;
    filterData.yearRange = null;
    filterData.quantityRange = null;
    filterData.availability = null;
};

const loadAllBooks = async () => {
    loading.value = true;
    const response = await getAllBooks();
    allBooks.value = response.data;
    loading.value = false;
    numberAnimation.value?.play();
};

//Nâng cao bộ lọc
const priceRangeOptions = [
    { label: 'Tất cả', value: null },
    { label: 'Dưới 50,000đ', value: '0-50000' },
    { label: '50,000đ - 100,000đ', value: '50000-100000' },
    { label: '100,000đ - 200,000đ', value: '100000-200000' },
    { label: 'Trên 200,000đ', value: '200000-999999999' }
];

const yearRangeOptions = [
    { label: 'Tất cả', value: null },
    { label: 'Trước 2000', value: '0-2000' },
    { label: '2000 - 2010', value: '2000-2010' },
    { label: '2010 - 2020', value: '2010-2020' },
    { label: '2020 - Hiện tại', value: '2020-2030' }
];

const availabilityOptions = [
    { label: 'Tất cả', value: null },
    { label: 'Còn sách', value: 'available' },
    { label: 'Hết sách', value: 'unavailable' }
];

//lọc sách theo từ khoá và các bộ lọc nâng cao
const filterBooksByQuery = (filter) => {
    const query = filter.query ? filter.query.toLowerCase() : null;
    const category = filter.category;
    const publisher = filter.publisher;
    const priceRange = filter.priceRange;
    const yearRange = filter.yearRange;
    const availability = filter.availability;

    let resultBooks = allBooks.value;

    // Lọc theo từ khoá
    if (query) {
        resultBooks = resultBooks.filter(book => {
            const titleMatch = book.TENSACH.toLowerCase().includes(query);
            const authorMatch = book.TACGIA.toLowerCase().includes(query);
            const idMatch = book.MASACH.toLowerCase().includes(query);
            return titleMatch || authorMatch || idMatch;
        });
    }

    // Lọc theo danh mục
    if (category) {
        resultBooks = resultBooks.filter(book => 
            book.THELOAI.some(theLoai => theLoai.MaLoai === category)
        );
    }

    // Lọc theo nhà xuất bản
    if (publisher) {
        resultBooks = resultBooks.filter(book => book.MAXB.MANXB === publisher);
    }

    // Lọc theo giá
    if (priceRange) {
        const [min, max] = priceRange.split('-').map(Number);
        resultBooks = resultBooks.filter(book => 
            book.DONGIA >= min && book.DONGIA <= max
        );
    }

    // Lọc theo năm xuất bản
    if (yearRange) {
        const [min, max] = yearRange.split('-').map(Number);
        resultBooks = resultBooks.filter(book => {
            const year = new Date(book.NAMXUATBAN).getFullYear();
            return year >= min && year <= max;
        });
    }

    // Lọc theo tình trạng còn sách
    if (availability === 'available') {
        resultBooks = resultBooks.filter(book => book.SOQUYEN > 0);
    } else if (availability === 'unavailable') {
        resultBooks = resultBooks.filter(book => book.SOQUYEN === 0);
    }

    currentBooks.value = resultBooks;
};

//theo dõi thay đổi của bộ lọc
watch(filterData, (newFilterData) => {
    filterBooksByQuery(newFilterData);
});

watch(allBooks, (newBooks) => {
    filterBooksByQuery(filterData);
});
//<========== Liên quan đến sách

//==========> Liên quan đến danh mục
const allcategories             =       ref([]);
const categoriesOptions         =       ref([]);

const getAllCategories = async () => {
    const response = await axios.get(`${BASE_API}/the-loai/all`);
    allcategories.value = response.data.data;
    categoriesOptions.value = allcategories.value.map(category => ({
        label: category.TenLoai,
        value: category.MaLoai,
        icon: `${BASE_API}${category.Icon}`,
    }));
};

const renderIconCategory = (option) => {
    return [
        h(NImage, {
            src: option.icon,
            style: { width: '1.5em', height: 'auto', 'margin-right': '8px', 'border-radius': '4px' }
        }), option.label
    ]
};
//<========== Liên quan đến danh mục

//==========> Liên quan đến nhà xuất bản
const allPublishers             =       ref([]);
const publishersOptions         =       ref([]);

const getAllPublishers = async () => {
    const response = await axios.get(`${BASE_API}/nha-xuat-ban/all`);
    allPublishers.value = response.data.data;
    publishersOptions.value = allPublishers.value.map(publisher => ({
        label: publisher.TENNXB,
        value: publisher.MANXB,
    }));
};
//<========== Liên quan đến nhà xuất bản

//==========> Liên quan đến phân trang
const booksPerPage              =       ref(6);
const currentPage               =       ref(1);
const totalPages                =       ref(null);

const pageHandle = (books) => {
    totalPages.value = Math.ceil(books.length / booksPerPage.value);
}

watch([currentBooks, currentPage], ([newBooks, currentPage]) => {
    if (newBooks) {
        pageHandle(newBooks);
        if(currentPage > totalPages.value) currentPage = totalPages.value;

        const startIndex = (currentPage - 1) * booksPerPage.value;
        const endIndex = startIndex + booksPerPage.value;
        booksView.value = newBooks.slice(startIndex, endIndex);
    }
});
//<========== Liên quan đến phân trang

//==========> Modal xem chi tiết bản sao
const showDetailModal = ref(false);
const selectedBook = ref(null);
const bookTemplates = ref([]);
const loadingTemplates = ref(false);

const openDetailModal = async (book) => {
    selectedBook.value = book;
    showDetailModal.value = true;
    loadingTemplates.value = true;
    
    try {
        const response = await getBookTemplate(book.MASACH);
        bookTemplates.value = response.data;
    } catch (error) {
        message.error('Lỗi khi tải thông tin bản sao');
        console.error(error);
    } finally {
        loadingTemplates.value = false;
    }
};

const templateColumns = [
    {
        title: 'Mã bản sao',
        key: 'MA_BANSAO',
        width: 150,
        render: (row) => h('strong', row.MA_BANSAO)
    },
    {
        title: 'Tình trạng sách',
        key: 'TINHTRANG',
        width: 120,
        render: (row) => h(NTag, {
            type: row.TINHTRANG === 'new' ? 'success' : 'warning',
            size: 'small'
        }, {
            default: () => row.TINHTRANG === 'new' ? 'Mới' : 'Cũ'
        })
    },
    {
        title: 'Trạng thái',
        key: 'TRANGTHAI',
        width: 130,
        render: (row) => h(NTag, {
            type: row.TRANGTHAI ? 'error' : 'success',
            size: 'small'
        }, {
            default: () => row.TRANGTHAI ? 'Đang mượn' : 'Có sẵn'
        })
    },
    {
        title: 'Ghi chú',
        key: 'GHICHU',
        ellipsis: {
            tooltip: true
        },
        render: (row) => row.GHICHU || '-'
    }
];

const availableTemplatesCount = computed(() => {
    return bookTemplates.value.filter(t => !t.TRANGTHAI).length;
});

const borrowedTemplatesCount = computed(() => {
    return bookTemplates.value.filter(t => t.TRANGTHAI).length;
});
//<========== Modal xem chi tiết bản sao

const customThemeLight = ref({
  Statistic: {
    valueTextColor: '#ffffff',
    labelTextColor: '#ffffff'
  },
});

const customThemeDark = ref({});

const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};
</script>

<template>
    <NConfigProvider :theme-overrides="isDark ? customThemeDark : customThemeLight">
        <NSpace vertical class="p-4">
            <!-- header page statistic -->
            <NSpace vertical class="p-8 shadow-md rounded-md bg-white dark:bg-slate-600/30">
                <h1 class="text-3xl uppercase font-semibold">Quản lý sách - Thủ thư</h1>
                <NGrid :cols="5" x-gap="12" y-gap="12" class="my-4">
                    <NGi :span="1">
                        <NStatistic
                            label="Tổng số sách"
                            class="relative w-full ring-2 ring-blue-500 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-600/50 dark:to-blue-700/50 shadow-md text-white rounded-md p-4"
                        >
                            <NNumberAnimation ref="numberAnimation" :from="0" :to="totalBooks" :active="true"/>
                        </NStatistic>
                    </NGi>
                    <NGi :span="1">
                        <NStatistic
                            label="Sách có sẵn"
                            class="relative w-full ring-2 ring-purple-500 bg-gradient-to-r from-purple-600 to-purple-700 dark:from-purple-600/50 dark:to-purple-700/50 shadow-md rounded-md p-4"
                        >
                            <NNumberAnimation ref="numberAnimation" :from="0" :to="availableBooks" :active="true"/>
                        </NStatistic>
                    </NGi>
                    <NGi :span="1">
                        <NStatistic
                            label="Tổng số bản sao"
                            class="relative w-full ring-2 ring-green-500 bg-gradient-to-r from-green-600 to-green-700 dark:from-green-600/50 dark:to-green-700/50 shadow-md rounded-md p-4"
                        >
                            <NNumberAnimation ref="numberAnimation" :from="0" :to="totalBookTemplate" :active="true"/>
                        </NStatistic>
                    </NGi>
                    <NGi :span="2">
                        <NStatistic
                            label="Chức năng"
                            class="relative w-full ring-2 ring-slate-500 bg-gradient-to-r from-green-600 to-green-700 dark:from-slate-700/90 dark:to-slate-500/60 shadow-md rounded-md p-4"
                        >
                            <NButton @click="resetFilter" type="warning">
                                <i class="fa-solid fa-rotate-right mr-2"></i> Đặt lại bộ lọc
                            </NButton>
                            <BookMarkControll :position="{top: '-4px', right: '0'}" :children="{ width: '40px' }" img="book-bookmark" />
                        </NStatistic>
                    </NGi>
                </NGrid>
            </NSpace>

            <!-- filter book -->
            <NSpace vertical class="p-8 shadow-md rounded-md bg-white dark:bg-slate-600/30">
                <h1 class="text-3xl uppercase font-semibold">Tất cả sách</h1>
                <NSpace class="my-4" align="center" justify="space-between">
                    <NGrid cols="4" x-gap="12" y-gap="12" class="w-full">
                        <NGi :span="2">
                            <NInput 
                                v-model:value="filterData.query" 
                                clearable
                                class="min-w-md" 
                                placeholder="Tìm kiếm sách, tác giả...">
                                <template #prefix>
                                    <i class="fa-solid fa-magnifying-glass"></i>
                                </template>
                            </NInput>
                        </NGi>
                        <NGi :span="1">
                            <NSelect 
                                v-model:value="filterData.category"
                                filterable
                                clearable
                                :options="categoriesOptions" 
                                :render-label="renderIconCategory" 
                                placeholder="Lọc theo loại..." 
                            />
                        </NGi>
                        <NGi :span="1">
                            <NSelect 
                                v-model:value="filterData.publisher"
                                filterable
                                clearable
                                :options="publishersOptions" 
                                placeholder="Lọc theo NXB..." 
                            />
                        </NGi>
                    </NGrid>
                </NSpace>
                <!-- list book view -->
                <NList clickable hoverable show-divider="true">
                    <NGrid cols="3" x-gap="12" y-gap="12" class=" p-2">
                        <NGi v-if="currentBooks && currentBooks.length > 0" span="1" v-for="book in booksView" :key="book.MASACH">
                            <NListItem 
                                class="dark:bg-gray-600/20 h-full group bg-transparent shadow rounded-md p-2 relative cursor-pointer"
                                @click="openDetailModal(book)"
                            >
                                <span class="absolute hidden group-hover:block top-0 right-2">
                                    <NSpace>
                                        <NIcon @click.stop="openDetailModal(book)">
                                            <i class="fa-solid fa-eye text-blue-500 hover:text-blue-700 cursor-pointer"></i>
                                        </NIcon>
                                    </NSpace>
                                </span>
                                <NGrid :cols="3" x-gap="12" y-gap="12">
                                    <NGi span="1" :style="`background-image: url(${BASE_API}${book.HINHANH});`" class="bg-no-repeat bg-center bg-contain"></NGi>
                                    <NGi span="2">
                                        <NThing>
                                            <template #description>
                                                <NEllipsis line-clamp="1">
                                                    <h3 class="text-lg font-semibold">{{ book.TENSACH }}</h3>
                                                </NEllipsis>
                                                <NSpace class="text-sm">
                                                    <NEllipsis :line-clamp="1">
                                                        <NText class="text-gray-500 text-xs">Tác giả: {{ book.TACGIA }}</NText>
                                                        <NDivider vertical />
                                                        <NText class="text-gray-500 text-xs">NXB: {{ book.MAXB.TENNXB }}</NText>
                                                    </NEllipsis>
                                                </NSpace>
                                                <NEllipsis expand-trigger="click" :line-clamp="2">
                                                    {{ book.MOTA }}
                                                </NEllipsis>
                                                <NSpace wrap size="small">
                                                    <NTag v-for="theLoai in book.THELOAI" :key="theLoai.MaLoai" :style="{background: theLoai.Color, color: '#fff'}" size="small">
                                                        {{ theLoai.TenLoai }}
                                                    </NTag>
                                                </NSpace>
                                                <NDivider/>
                                                <NTag type="warning">{{ formatPrice(book.DONGIA) }} / quyển</NTag>
                                            </template>
                                        </NThing>
                                    </NGi>
                                </NGrid>
                            </NListItem>
                        </NGi>
                        <NGi span="3" class="min-h-36" v-if="!loading && currentBooks.length === 0">
                            <NResult
                                title="Không tìm thấy sách"
                                description="Thiệc sự là không tìm thấy sách nào y vậy thiệc á!"
                            >
                                <template #icon>
                                    <NImage style="width: 100px;" :src="`${BASE_API}public/imgs/default/not-found.svg`"></NImage>
                                </template>
                            </NResult>
                        </NGi>
                        <NGi v-if="loading" v-for="n in 5" :key="n">
                            <NSkeleton class="min-h-36"></NSkeleton>
                        </NGi>
                    </NGrid>
                </NList>
                <NSpace v-show="totalPages > 1" justify="center">
                    <NPagination v-model:page="currentPage" :page-count="totalPages" :page-size="booksPerPage"></NPagination>
                </NSpace>
                
            </NSpace>
        </NSpace>
    </NConfigProvider>

    <!-- Modal chi tiết bản sao -->
    <NModal 
        v-model:show="showDetailModal" 
        preset="card"
        title="Chi tiết sách và bản sao"
        size="huge"
        class="dark:bg-slate-700 max-w-[1200px]"
        :bordered="false"
    >
        <NSpace vertical v-if="selectedBook">
            <!-- Thông tin sách -->
            <NCard title="Thông tin đầu sách" :bordered="false" class="dark:bg-slate-600/30">
                <NGrid cols="4" x-gap="12" y-gap="12">
                    <NGi span="1">
                        <NImage 
                            :src="`${BASE_API}${selectedBook.HINHANH}`" 
                            class="w-full rounded-lg shadow-lg"
                            :img-props="{ style: 'object-fit: cover;' }"
                        />
                    </NGi>
                    <NGi span="3">
                        <NDescriptions label-placement="left" :column="2" bordered size="small">
                            <NDescriptionsItem label="Mã sách">
                                <NTag type="info">{{ selectedBook.MASACH }}</NTag>
                            </NDescriptionsItem>
                            <NDescriptionsItem label="Tên sách">
                                <strong>{{ selectedBook.TENSACH }}</strong>
                            </NDescriptionsItem>
                            <NDescriptionsItem label="Tác giả">
                                {{ selectedBook.TACGIA }}
                            </NDescriptionsItem>
                            <NDescriptionsItem label="Nhà xuất bản">
                                {{ selectedBook.MAXB.TENNXB }}
                            </NDescriptionsItem>
                            <NDescriptionsItem label="Năm xuất bản">
                                {{ new Date(selectedBook.NAMXUATBAN).getFullYear() }}
                            </NDescriptionsItem>
                            <NDescriptionsItem label="Đơn giá">
                                <NTag type="warning">{{ formatPrice(selectedBook.DONGIA) }}</NTag>
                            </NDescriptionsItem>
                            <NDescriptionsItem label="Số lượng bản sao">
                                <NTag type="success">{{ selectedBook.SOQUYEN }} quyển</NTag>
                            </NDescriptionsItem>
                            <NDescriptionsItem label="Thể loại">
                                <NSpace wrap size="small">
                                    <NTag 
                                        v-for="theLoai in selectedBook.THELOAI" 
                                        :key="theLoai.MaLoai" 
                                        :style="{background: theLoai.Color, color: '#fff'}" 
                                        size="small"
                                    >
                                        {{ theLoai.TenLoai }}
                                    </NTag>
                                </NSpace>
                            </NDescriptionsItem>
                            <NDescriptionsItem label="Mô tả" :span="2">
                                {{ selectedBook.MOTA }}
                            </NDescriptionsItem>
                        </NDescriptions>
                    </NGi>
                </NGrid>
            </NCard>

            <NDivider />

            <!-- Thống kê bản sao -->
            <NGrid cols="3" x-gap="12" y-gap="12">
                <NGi>
                    <NCard :bordered="false" class="dark:bg-green-600/20 bg-green-100">
                        <NStatistic label="Tổng bản sao" :value="bookTemplates.length">
                            <template #prefix>
                                <i class="fa-solid fa-book text-green-600"></i>
                            </template>
                        </NStatistic>
                    </NCard>
                </NGi>
                <NGi>
                    <NCard :bordered="false" class="dark:bg-blue-600/20 bg-blue-100">
                        <NStatistic label="Có sẵn" :value="availableTemplatesCount">
                            <template #prefix>
                                <i class="fa-solid fa-circle-check text-blue-600"></i>
                            </template>
                        </NStatistic>
                    </NCard>
                </NGi>
                <NGi>
                    <NCard :bordered="false" class="dark:bg-red-600/20 bg-red-100">
                        <NStatistic label="Đang mượn" :value="borrowedTemplatesCount">
                            <template #prefix>
                                <i class="fa-solid fa-circle-xmark text-red-600"></i>
                            </template>
                        </NStatistic>
                    </NCard>
                </NGi>
            </NGrid>

            <!-- Danh sách bản sao -->
            <NCard title="Danh sách bản sao" :bordered="false" class="dark:bg-slate-600/30">
                <NDataTable
                    :columns="templateColumns"
                    :data="bookTemplates"
                    :loading="loadingTemplates"
                    :pagination="{ pageSize: 10 }"
                    :bordered="false"
                    striped
                    size="small"
                    :row-class-name="(row) => row.TRANGTHAI ? 'opacity-60' : ''"
                />
            </NCard>
        </NSpace>

        <template #footer>
            <NSpace justify="end">
                <NButton @click="showDetailModal = false">Đóng</NButton>
            </NSpace>
        </template>
    </NModal>
</template>

<style scoped>
.n-list-item:hover {
    transform: translateY(-2px);
    transition: transform 0.2s ease-in-out;
}
</style>
