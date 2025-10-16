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
    NPopconfirm,
    NSkeleton,
    NResult,
    NPagination,
    NNumberAnimation,
    NButton,
    NIcon,
    NConfigProvider
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

import BookMarkControll from '../../components/BookMarkControll.vue';
import { isDark } from '../../hooks/useDark';

//=========================== VRIABLES ===========================//
const BASE_API                  =       import.meta.env.VITE_BASE_API;
const message                   =       useMessage();
const loading                   =       ref(true);



//==========> Number animation
const numberAnimation           =       ref(null);
const totalBooks                =       computed(() => allBooks.value.length);
const totalBookTemplate         =       computed(() => allBooks.value.reduce((acc, book) => acc + book.SOQUYEN, 0));


//<========== Number animation

onMounted(async () => {
    await getAllCategories();
    await getAllBooks();
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
});


const getAllBooks               =       async () => {
    loading.value               =       true;
    const response              =       await axios.get(`${BASE_API}/sach/all`);
    allBooks.value              =       response.data.data;
    loading.value               =       false;
    //chạy number animation
    numberAnimation.value?.play();
};



const deleteBook                =       async (maSach) => {
    try {
        const response          =       await axios.delete(`${BASE_API}/sach/admin/delete/${maSach}`);
        message[response.data.status](response.data.message);
        await getAllBooks();
    } catch (error) {
        console.log(error);
    }
};

//lọc sách theo từ khoá
const filterBooksByQuery         =       (filter) => {
    const query                  =       filter.query ? filter.query.toLowerCase() : null;
    const category               =       filter.category;
    const publisher              =       filter.publisher;

    let resultBooks              =       [];

    //lọc theo từ khoá
    resultBooks                  =       allBooks.value.filter(book => {
        const titleMatch         =       query ? book.TENSACH.toLowerCase().includes(query) : true;
        const authorMatch        =       query ? book.TACGIA.toLowerCase().includes(query) : true;
        return titleMatch || authorMatch;
    });

    //lọc theo danh mục
    if (category) {
        resultBooks              =       resultBooks.filter(book => book.THELOAI.some(theLoai => theLoai.MaLoai === category));
    }

    //lọc theo nhà xuất bản
    if (publisher) {
        resultBooks              =       resultBooks.filter(book => book.MAXB.MANXB === publisher);
    }

    currentBooks.value           =       resultBooks;
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
const allcategories             =       ref([]);  //danh sách tất cả danh mục
const categoriesOptions         =       ref([]);  //danh sách các danh mục để chọn


const getAllCategories          =       async () => {
    const response              =       await axios.get(`${BASE_API}/the-loai/all`);
    allcategories.value         =       response.data.data;
    categoriesOptions.value     =       allcategories.value.map(category => ({
        label: category.TenLoai,
        value: category.MaLoai,
        icon: `${BASE_API}/${category.Icon}`,
    }));
};

const renderIconCategory        =       (option) => {
    return [
        h(NImage, {
            src: option.icon,
            style: { width: '1.5em', height: 'auto', 'margin-right': '8px', 'border-radius': '4px' }
        }), option.label
    ]
};

//<========== Liên quan đến danh mục

//==========> Liên quan đến nhà xuất bản
const allPublishers             =       ref([]);  //danh sách tất cả nhà xuất bản
const publishersOptions         =       ref([]);  //danh sách các nhà xuất bản để

const getAllPublishers          =       async () => {
    const response              =       await axios.get(`${BASE_API}/nha-xuat-ban/all`);
    allPublishers.value         =       response.data.data;
    publishersOptions.value     =       allPublishers.value.map(publisher => ({
        label: publisher.TENNXB,
        value: publisher.MANXB,
    }));
};
//<========== Liên quan đến nhà xuất bản

//==========> Liên quan đến phân trang
const booksPerPage              =       ref(6);  //số sách trên mỗi trang
const currentPage               =       ref(1);  //trang hiện tại
const totalPages                =       ref(null);  //tổng số trang


const pageHandle = (books) => {
    //tính tổng trang
    totalPages.value           =       Math.ceil(books.length / booksPerPage.value);

}

watch([currentBooks, currentPage], ([newBooks, currentPage]) => {
    if (newBooks) {
        //check trang hiện tại không quá số trang tổng
        pageHandle(newBooks);
        if(currentPage > totalPages.value) currentPage = totalPages.value;

        const startIndex         =       (currentPage - 1) * booksPerPage.value;
        const endIndex           =       startIndex + booksPerPage.value;
        booksView.value         =       newBooks.slice(startIndex, endIndex);
    }
});
//<========== Liên quan đến phân trang

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
            <!-- header page statistic -->
            <NSpace vertical class="p-8 shadow-md rounded-md bg-white dark:bg-slate-600/30">
                <h1 class="text-3xl uppercase font-semibold">Quản lý sách</h1>
                <NGrid :cols="4" x-gap="12" y-gap="12" class="my-4">
                    <NGi :span="1">
                        <NStatistic
                            label="Tổng số sách"
                            class="relative w-full ring-2 ring-blue-500 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-600/50 dark:to-blue-700/50 shadow-md text-white rounded-md p-4"
                        >
                            <NNumberAnimation ref="numberAnimation" :from="100" :to="totalBooks" :active="true"/>
                        </NStatistic>
                    </NGi>
                    <NGi :span="1">
                        <NStatistic
                            label="Tổng số bản sao"
                            class="relative w-full ring-2 ring-green-500 bg-gradient-to-r from-green-600 to-green-700 dark:from-green-600/50 dark:to-green-700/50 shadow-md rounded-md p-4"
                        >
                            <NNumberAnimation ref="numberAnimation" :from="100" :to="totalBookTemplate" :active="true"/>
                        </NStatistic>
                    </NGi>
                    <NGi :span="2">
                        <NStatistic
                            label="Chức năng"
                            class="relative w-full ring-2 ring-slate-500 bg-gradient-to-r from-green-600 to-green-700 dark:from-slate-700/90 dark:to-slate-500/60 shadow-md rounded-md p-4"
                        >
                            <NButton @click="$router.push('/admin/books/add')" type="success">
                                <i class="fa-solid fa-plus mr-2"></i> Thêm sách mới
                            </NButton>
                            <BookMarkControll :position="{top: '-4px', right: '0'}" :children="{ width: '40px' }" img="plus-bookmark" />
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
                            placeholder="Lọc theo loại..." >
                            </NSelect>
                        </NGi>
                        <NGi :span="1">
                            <NSelect 
                            v-model:value="filterData.publisher"
                            filterable
                            clearable
                            :options="publishersOptions" 
                            placeholder="lọc theo NXB..." >
                            </NSelect>
                        </NGi>
                    </NGrid>
                </NSpace>
                <!-- list book view -->
                <NList clickable hoverable show-divider="true">
                    <NGrid cols="3" x-gap="12" y-gap="12" class=" p-2">
                        <NGi v-if="currentBooks && currentBooks.length > 0" span="1" v-for="book in booksView" :key="book.MaSach">
                            <NListItem class="dark:bg-gray-600/20 h-full group bg-transparent shadow rounded-md p-2">
                                <span class="absolute hidden group-hover:block top-0 right-2">
                                    <NSpace>
                                        <!-- pop confirm -->
                                        <NPopconfirm
                                            @positive-click="deleteBook(book.MASACH)"
                                            @negative-click="() => message.info('Hủy xóa')"
                                            positive-text="Xoá"
                                            negative-text="Hủy"
                                        >
                                            <template #trigger>
                                            <NIcon>
                                                <i class="fa-solid fa-trash text-red-500 hover:text-red-700 cursor-pointer"></i>
                                            </NIcon>
                                            </template>
                                            Hành động này sẽ xoá đầu sách và toàn bộ bản sao ra khỏi hệ thống, bạn có chắc?
                                        </NPopconfirm>
                                        <!--  -->
                                        <NIcon>
                                            <i class="fa-solid fa-pen-to-square text-blue-500 hover:text-blue-700 cursor-pointer"></i>
                                        </NIcon>
                                        
                                    </NSpace>
                                </span>
                                <NGrid :cols="3" x-gap="12" y-gap="12">
                                    <NGi span="1" :style="`background-image: url(${BASE_API}/${book.HINHANH});`" class="bg-no-repeat bg-center bg-contain"></NGi>
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
                                                <NDivider/>
                                                <NSpace wrap size="small">
                                                <NTag v-for="theLoai in book.THELOAI" :style="{background: theLoai.Color, color: '#fff'}" size="small">
                                                    {{ theLoai.TenLoai }}
                                                </NTag>
                                            </NSpace>
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
                                    <NImage style="width: 100px;" :src="`${BASE_API}/public/imgs/default/not-found.svg`"></NImage>
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
</template>

<style scoped>

</style>