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
    NPagination
}                               from    'naive-ui';
import axios                    from    'axios';
import {
    onMounted,
    reactive,
    ref,
    watch
}                               from    'vue';

//=========================== VRIABLES ===========================//
const BASE_API                  =       import.meta.env.VITE_BASE_API;
const loading                   =       ref(false);

const statusOptions             =       [
    { label: 'Tăng dần', value: 'asc' },
    { label: 'Giảm dần', value: 'desc' },
];
const filterData = reactive({
    query: null,
    status: null //[ 'asc', 'desc' ]
})

onMounted(async () => {
    await getCategories();
});

//==========> Liên quan đến danh mục
const allCategories             =       ref([]);
const currentCategory           =       ref([]);
const categoryView              =       ref([]);

const getCategories             =       async () => {
    loading.value               =       true;
    const response              =       await axios.get(`${BASE_API}/the-loai/all`);
    allCategories.value         =       response.data.data;
    loading.value               =       false;
};

const handleFilter = (filter) => {
    const query = filter.query ? filter.query.toLowerCase() : null;
    const status = filter.status;
    
    console.log(filter);
    let result = [];

    result = allCategories.value.filter(category => {
        const nameMatch = query ? category.TenLoai.toLowerCase().includes(query) : true;
        return nameMatch;
    })

    if (status === 'asc') {
        result.sort((a, b) => (a.BookCount || 0) - (b.BookCount || 0));
    } else if (status === 'desc') {
        result.sort((a, b) => (b.BookCount || 0) - (a.BookCount || 0));
    }
    console.log(result, currentCategory.value, allCategories.value);
    currentCategory.value = result;
};

watch(allCategories, (newCategories) => {
    handleFilter(filterData);
});

watch(filterData, (newFilter) => {
    handleFilter(newFilter);
});

//<========== Liên quan đến danh mục


//==========> Liên quan đến phân trang
const currentPage               =       ref(1);
const totalPages                =       ref(null);
const categoriesPerPage         =       ref(6);

const handlePage = (categories) => {
    const total = Math.ceil(categories.length / categoriesPerPage.value);
    totalPages.value = total;
};


watch([currentCategory, currentPage], ([newCategories, currentPageValue]) => {
    if (newCategories) {
        //check trang hiện tại không quá số trang tổng
        handlePage(newCategories);
        if(currentPageValue > totalPages.value) currentPage.value = totalPages.value;

        const startIndex         =       (currentPageValue - 1) * categoriesPerPage.value;
        const endIndex           =       startIndex + categoriesPerPage.value;
        categoryView.value       =       newCategories.slice(startIndex, endIndex);
    }
});
//<========== Liên quan đến phân trang

</script>


<template>
    <NSpace vertical class="p-4">
        <NSpace vertical class="p-8 shadow-md rounded-md bg-white dark:bg-slate-600/30">
            <h1 class="text-3xl uppercase font-semibold">Quản lý danh mục</h1>
            <NGrid :cols="4" x-gap="12" y-gap="12" class="my-4">
                <NGi :span="1">
                    <NStatistic
                        label="Tổng số danh mục"
                        :value="allCategories.length"
                        class="w-full ring-2 ring-blue-500 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-600/50 dark:to-blue-700/50 shadow-md text-white rounded-md p-4"
                    />
                </NGi>
                <NGi :span="1">
                    <NStatistic
                        label="Số danh mục có sách"
                        :value="allCategories.filter(category => category.BookCount > 0).length"
                        class="w-full ring-2 ring-green-500 bg-gradient-to-r from-green-600 to-green-700 dark:from-green-600/50 dark:to-green-700/50 shadow-md rounded-md p-4"
                    />
                </NGi>
            </NGrid>
        </NSpace>
        <NSpace vertical class="p-8 shadow-md rounded-md bg-white dark:bg-slate-600/30">
            <h1 class="text-3xl uppercase font-semibold">Tất cả danh mục</h1>
            <NSpace class="my-4" align="center" justify="space-between">
                <NGrid cols="4" x-gap="12" y-gap="12" class="w-full">
                    <NGi :span="2">
                        <NInput 
                        v-model:value="filterData.query"
                        class="min-w-md"
                        placeholder="Tìm kiếm danh mục..."
                        clearable
                        >
                            <template #prefix>
                                <i class="fa-solid fa-magnifying-glass"></i>
                            </template>
                        </NInput>
                    </NGi>
                    <NGi :span="1">
                        <NSelect 
                        v-model:value="filterData.status" 
                        :options="statusOptions" 
                        class="w-full"
                        clearable
                        placeholder="Lọc theo..."
                        >
                        </NSelect>
                    </NGi>
                </NGrid>
            </NSpace>
            <NList clickable hoverable show-divider="true">
                <NGrid cols="3" x-gap="12" y-gap="12" class=" p-2">
                    <NGi span="1" v-for="category in categoryView" :key="category.MaLoai">
                        <NListItem class="dark:bg-gray-600/20 bg-transparent shadow rounded-md p-2">
                            <NGrid :cols="3" x-gap="12" y-gap="12">
                                <NGi span="1" :style="`background-image: url(${BASE_API}/${category.Icon});`" class="bg-no-repeat bg-center bg-contain"></NGi>
                                <NGi span="2">
                                    <NThing :title="category.TenLoai">
                                        <template #description>
                                            <NEllipsis expand-trigger="click" :line-clamp="2">
                                                {{ category.MoTa }}
                                            </NEllipsis>
                                            <NDivider/>
                                            <NTag :style="{ backgroundColor: category.Color }" size="small">{{ category.BookCount || 0 }} books</NTag>
                                        </template>
                                    </NThing>
                                </NGi>
                            </NGrid>
                        </NListItem>
                    </NGi>
                    <NGi v-if="!loading && currentCategory.length === 0" span="3" class="text-center text-gray-500">
                        <NResult
                            title="Không tìm thấy sách"
                            description="Thiệc sự là không tìm thấy sách nào y vậy thiệc á!"
                        >
                            <template #icon>
                                <NImage style="width: 100px;" :src="`${BASE_API}/public/imgs/default/not-found.svg`"></NImage>
                            </template>
                        </NResult>
                    </NGi>
                    <NGi v-if="loading" span="1" v-for="n in 4" :key="n">
                        <NSkeleton class="min-h-36"></NSkeleton>
                    </NGi>
                </NGrid>
            </NList>
            <NSpace v-show="totalPages > 1" justify="center">
                <NPagination v-model:page="currentPage" :page-count="totalPages" :page-size="categoriesPerPage"></NPagination>
            </NSpace>
        </NSpace>
    </NSpace>
</template>

<style scoped>

</style>