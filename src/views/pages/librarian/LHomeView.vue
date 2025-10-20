<script setup>
import {
    NRow,
    NCol,
    NStatistic,
    NButton,
    NConfigProvider,
    NForm,
    NFormItemRow,
    NInput,
    NCard,
    NTabs,
    NTabPane,
    NGrid,
    NGi,
    NSelect,
    NTreeSelect,
    NTag,
    useMessage
}                           from 'naive-ui'
import { 
    onMounted, 
    onBeforeUnmount, 
    ref, 
    watch, 
    h, 
    computed
}                           from 'vue'
import ApexCharts           from 'apexcharts'
import Chart                from '../../../components/Chart.vue'
import { isDark }           from '../../../hooks/useDark.js'
import {
    getAllBooks,
    getBookTemplate
}                           from '../../../services/apiBook.js'
import {
    getAllBorrows,
    createBorrow
}                           from '../../../services/apiBorrow.js'
import {
    getAllReaders
}                           from '../../../services/apiReader.js'

//================== GLOBAL VARIABLES ==================//
const message               =       useMessage();
const allBooks              = ref([])
const allBorrows            = ref([])
const allReaders            = ref([])
//các sách đã chọn,
const listSelectedBooks     = ref([])
//đọc giả đã chọn
const selectedReader        = ref(null)

onMounted(async () => {
    await getAllBooksData()//lấy hết sách ra
    await getAllBorrowsData()//lấy hết mượn sách ra
    await getAllReadersData()//lấy hết đọc giả ra
    console.log(allReaders.value);
})

//==========> Liên quan đến thống kê sách


const getAllBorrowsData = async () => {
    try {
        const response = await getAllBorrows()
        allBorrows.value = response.data
    } catch (error) {
        console.error('Lỗi khi lấy dữ liệu mượn sách:', error)
    }
}

const getAllBooksData = async () => {
    try {
        const response = await getAllBooks()
        allBooks.value = response.data
    } catch (error) {
        console.error('Lỗi khi lấy dữ liệu sách:', error)
    }
}


//lấy các sách đã mượn trong ngày

const borrowedBooksToday    = computed(() => {
    if(allBorrows.value.length === 0) return []
    const today               = new Date()
    const todayDate = today.toLocaleDateString('vi-VN').split('/').reverse().join('-')
    
    return allBorrows.value.filter(borrow => {
        const borrowDate = new Date(borrow.NGAYMUON)
        const borrowDateStr = borrowDate.toLocaleDateString('vi-VN').split('/').reverse().join('-')
        return borrowDateStr === todayDate && borrow.TINHTRANG === 'borrowing'
    })
})
//lấy các sách trả trong ngày

const returnedBooksToday    = computed(() => {
    if(allBorrows.value.length === 0) return []
    const today               = new Date()
    const todayDate = today.toLocaleDateString('vi-VN').split('/').reverse().join('-')
    
    return allBorrows.value.filter(borrow => {
        if (!borrow.NGAYTRA) return false
        const returnDate = new Date(borrow.NGAYTRA)
        const returnDateStr = returnDate.toLocaleDateString('vi-VN').split('/').reverse().join('-')
        return returnDateStr === todayDate && borrow.TINHTRANG === 'returned'
    })
})
//lấy sách quá hạn trả mà chưa trả
//NGAYTRA > NGAYHANTRA && TINHTRANG === 'borrowing'

const overdueBooks = computed(() => {
    if(allBorrows.value.length === 0) return []
    const today               = new Date()
    return allBorrows.value.filter(borrow => {
        const dueDate = new Date(borrow.NGAYHANTRA)
        return dueDate < today && borrow.TINHTRANG === 'borrowing'
    })
})


//<========== Liên quan đến thống kê sách

//==========> Liên quan đến đọc giả
const selectReaders = computed(() => {
    return allReaders.value.map(reader => ({
        label: `${reader.HOLOT} ${reader.TEN} - ${reader.MADOCGIA}`,
        value: reader.MADOCGIA,
    }))
})

const getAllReadersData = async () => {
    try {
        const response = await getAllReaders()
        allReaders.value = response.data
    } catch (error) {
        console.error('Lỗi khi lấy dữ liệu đọc giả:', error)
    }
}
//<========== Liên quan đến đọc giả


//<========== Liên quan đến form mượn trả sách
const booksSelect = computed(() => {
    return allBooks.value.map(book => ({
        label: `${book.TENSACH} - ${book.MASACH}`,
        key: book.MASACH,
        depth: 1,
        name: book.TENSACH,
        isLeaf: false
    }))
})
const loadTemplate = async (parent) => {
    const template = [];
    const response = await getBookTemplate(parent.key);
    response.data.forEach(item => {
        template.push({
            label: `Bản sao - ${item.MA_BANSAO}`,
            key: item.MA_BANSAO,
            depth: 2,
            TRANGTHAI: item.TRANGTHAI,
            TINHTRANG: item.TINHTRANG,
            disabled: item.TRANGTHAI,
            isLeaf: true
        });
    });
    return template;
}

// Render label với tag phía sau

const renderLabelSelect = (node) => {
    const option = node.option;
    console.log(option);
    if(option.depth === 2) {
        return [
            h(NTag, {
                type: option.TRANGTHAI ? 'warning' : 'success',
                size: 'small',
                style: { marginLeft: '8px' }
            }, option.TRANGTHAI ? 'Đang mượn' : 'Hiện có'),
            h(NTag, {
                type: option.TINHTRANG ? 'success' : 'warning',
                size: 'small',
                style: { marginLeft: '8px' }
            }, option.TINHTRANG ? 'Sách mới' : 'Sách cũ'),
        ]
    }
};

async function handleLoad(option) {
    return new Promise((resolve) => {
        loadTemplate(option).then((children) => {
            option.children = children;
            console.log(option);
            resolve();
        });
    });
}
    
//<========== Liên quan đến form mượn trả sách

//==========> Xác nhận mượn sách
const submitBorrow = async () => {
    //lập qua danh sách sách mượn, promise all
    const data = {
        MADOCGIA: selectedReader.value,
        LIST_MA_BANSAO: listSelectedBooks.value,
    }
    const response = await createBorrow(data);
    message[response.status](response.message);
    if(response.status === 'success') {
        message.success('Xác nhận mượn sách thành công!');
    } else {
    }
}
//<========== Xác nhận mượn sách



watch([selectedReader, listSelectedBooks], ([newReader, newBooks]) => {
    console.log('Đọc giả đã chọn:', newReader);
    console.log('Sách đã chọn:', newBooks);
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
        <div class="p-6">
            <h1 class="text-4xl font-semibold uppercase my-2">Thống kê trong ngày</h1>
            <NRow align="middle" gutter="24" class="p-2 shadow-md rounded-md dark:bg-gray-800 bg-white">
                <NRow class="my-4" :gutter="24">
                    <NCol :span="8">
                        <NStatistic
                            label="Sách mượn trong ngày"
                            :value="borrowedBooksToday.length"
                            labelTextColor="#fff"
                            class="w-full ring-2 ring-blue-600 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-600/50 dark:to-blue-700/50 shadow-md text-white rounded-md p-4"
                        />
                    </NCol>
                    <NCol :span="8">
                        <NStatistic
                            label="Sách trả trong ngày"
                            :value="returnedBooksToday.length"
                            class="w-full ring-2 ring-green-500 bg-gradient-to-r from-green-600 to-green-700 dark:from-green-600/50 dark:to-green-700/50 shadow-md rounded-md p-4"
                        />
                    </NCol>
                    <NCol :span="8">
                        <NStatistic
                            label="Sách quá hạn trong ngày"
                            :value="overdueBooks.length"
                            class="w-full ring-2 ring-red-500 bg-gradient-to-r from-red-600 to-red-700 dark:from-red-600/50 dark:to-red-700/50 shadow-md rounded-md p-4"
                        />
                    </NCol>
                </NRow>
            </NRow>
        </div>
        <div class="p-3">
            <div class="p-6 shadow-lg rounded-lg bg-white dark:bg-gray-800">
                <NGrid cols="2">
                    <NGi span="1">
                        <n-card>
                            <n-tabs
                            class="card-tabs"
                            default-value="borrow"
                            size="large"
                            animated
                            pane-wrapper-style="margin: 0 -4px"
                            pane-style="padding-left: 4px; padding-right: 4px; box-sizing: border-box;"
                            >
                            <n-tab-pane name="borrow" tab="Mượn sách">
                                <n-form>
                                <n-form-item-row label="Đọc giả">
                                    <NSelect 
                                    v-model:value="selectedReader"
                                    :options="selectReaders"
                                    clearable 
                                    filterable 
                                    placeholder="Nhập tên hoặc mã đọc giả"/>
                                </n-form-item-row>
                                <n-form-item-row label="Sách">
                                    <NTreeSelect 
                                    v-model:value="listSelectedBooks"
                                    :options="booksSelect" 
                                    :on-load="handleLoad"
                                    :render-suffix="renderLabelSelect"
                                    checkable
                                    check-strategy="child"
                                    clearable 
                                    multiple 
                                    filterable 
                                    placeholder="Nhập tên hoặc mã sách"/>
                                </n-form-item-row>
                                </n-form>
                                <n-button @click="submitBorrow" type="primary" block secondary strong>
                                Xác nhận mượn
                                </n-button>
                            </n-tab-pane>
                            <n-tab-pane name="return" tab="Trả sách">
                                <n-form>
                                <n-form-item-row label="Username">
                                    <n-input />
                                </n-form-item-row>
                                <n-form-item-row label="Password">
                                    <n-input />
                                </n-form-item-row>
                                <n-form-item-row label="Reenter Password">
                                    <n-input />
                                </n-form-item-row>
                                </n-form>
                                <n-button type="primary" block secondary strong>
                                Xác nhận trả
                                </n-button>
                            </n-tab-pane>
                            </n-tabs>
                        </n-card>
                    </NGi>
                    <NGi span="1"></NGi>
                </NGrid>
            </div>
        </div>
    </NConfigProvider>
</template>


<style scoped>
span.n-statistic-value__content {
    color: white !important;
}
</style>