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
    NSpace,
    NDivider,
    NList,
    NListItem,
    NThing,
    NEllipsis,
    NEmpty,
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
    getBorrowsWithUserId,
    createBorrow,
    returnBook
}                           from '../../../services/apiBorrow.js'
import {
    getAllReaders
}                           from '../../../services/apiReader.js'

//================== GLOBAL VARIABLES ==================//
const message               = useMessage();
const allBooks              = ref([]) //tất cả sách
const allBorrows            = ref([]) //tất cả mượn trả

const allReaders            = ref([]) //nguyên dàn reader cho chọn
const booksSelect           = ref([]) //nguyên dàn sách cho chọn - cấu hình cho select
//các sách đã chọn,
const listSelectedBooks     = ref(null)
//đọc giả đã chọn
const selectedReader        = ref(null)

//==trả sách
const selectedReturnReader  = ref(null)
const selectedReturnBook    = ref(null)
const listSelectBookReturn  = ref([])

//==đồng bộ tab
const activeTab             = ref('borrow')

//==========> Computed để hiển thị thông tin đã chọn
const selectedReaderInfo = computed(() => {
    if (!selectedReader.value) return null
    return allReaders.value.find(reader => reader.MADOCGIA === selectedReader.value)
})

const selectedBooksInfo = computed(() => {
    if (!listSelectedBooks.value || listSelectedBooks.value.length === 0) return []
    return listSelectedBooks.value.map(bookKey => {
        const MASACH = bookKey.split('T')[0].trim()
        const book = allBooks.value.find(b => b.MASACH === MASACH)
        return {
            key: bookKey,
            bookName: book?.TENSACH || 'N/A',
            author: book?.TACGIA || 'N/A'
        }
    })
})

const selectedReturnReaderInfo = computed(() => {
    if (!selectedReturnReader.value) return null
    return allReaders.value.find(reader => reader.MADOCGIA === selectedReturnReader.value)
})

const selectedReturnBooksInfo = computed(() => {
    if (!selectedReturnBook.value || selectedReturnBook.value.length === 0) return []
    return selectedReturnBook.value.map(maphieu => {
        const option = listSelectBookReturn.value.find(opt => opt.value === maphieu)
        return {
            maphieu: maphieu,
            label: option?.label || 'N/A'
        }
    })
})
//<========== Computed để hiển thị thông tin đã chọn

const loadBorrowBookWithReader = async () => {
    const listBook = []
    const response = await getBorrowsWithUserId(selectedReturnReader.value);
    // Chỉ lấy những sách đang mượn (chưa trả)
    const borrowingBooks = response.data.filter(borrow => borrow.TINHTRANG === 'borrowing');
    borrowingBooks.forEach(borrow => {
        const MASACH = borrow.MA_BANSAO.split('T')[0].trim();
        const BOOK = allBooks.value.find(book => book.MASACH === MASACH);
        listBook.push({
            label: `${BOOK.TENSACH} - ${borrow.MA_BANSAO}`,
            value: borrow.MAPHIEU,
        })
    })
    console.log(listBook);
    listSelectBookReturn.value = listBook;
}

watch(selectedReturnReader, async (newVal) => {
    if (newVal !== null) {
        await loadBorrowBookWithReader();
    }
});

onMounted(async () => {
    await getAllBooksData()
    await getAllBorrowsData()
    await getAllReadersData()
    loadBooksSelect()
})


//==========> Liên quan đến thống kê sách

//lấy hết dữ liệu mượn trả
const getAllBorrowsData = async () => {
    try {
        const response = await getAllBorrows()
        allBorrows.value = response.data
    } catch (error) {
        console.error('Lỗi khi lấy dữ liệu mượn sách:', error)
    }
}

//lấy hết dữ liệu sách
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

// Load dữ liệu sách ban đầu
const loadBooksSelect = () => {
    booksSelect.value = allBooks.value.map(book => ({
        label: `${book.TENSACH} - ${book.MASACH}`,
        key: book.MASACH,
        depth: 1,
        name: book.TENSACH,
        isLeaf: false,
        children: undefined // Thêm này để Naive UI biết cần load
    }))
}


const loadTemplate = async (parent) => {
    const response = await getBookTemplate(parent.key);
    const template = response.data.map(item => ({
        label: `${parent.name} - ${item.MA_BANSAO}`,
        key: item.MA_BANSAO,
        depth: 2,
        TRANGTHAI: item.TRANGTHAI,
        TINHTRANG: item.TINHTRANG,
        disabled: item.TRANGTHAI,
        isLeaf: true
    }));
    return template;
}

// Render label với tag phía sau
const renderLabelSelect = (node) => {
    const option = node.option;
    if(option.depth === 2) {
        return [
            h(NTag, {
                type: option.TRANGTHAI ? 'warning' : 'success',
                size: 'small',
                style: { marginLeft: '8px' }
            }, {
                default: () => option.TRANGTHAI ? 'Đang mượn' : 'Hiện có'
            }),
            h(NTag, {
                type: option.TINHTRANG ? 'success' : 'warning',
                size: 'small',
                style: { marginLeft: '8px' }
            }, {
                default: () => option.TINHTRANG ? 'Sách mới' : 'Sách cũ'
            }),
        ]
    }
};

async function handleLoad(option) {
    const children = await loadTemplate(option);
    option.children = children;
    
    // Trigger reactivity bằng cách tạo một bản copy mới
    booksSelect.value = [...booksSelect.value];
    
    return Promise.resolve();
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

const submitReturn = async () => {
    //lập qua danh sách sách mượn, promise all
    const data = {
        LIST_MAPHIEU: selectedReturnBook.value,
    }
    const response = await returnBook(data);
    message[response.status](response.message);
    if(response.status === 'success') {
        message.success('Xác nhận trả sách thành công!');
    } else {
    }
}
//<========== Xác nhận mượn sách









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
            <h1 class="text-4xl font-semibold uppercase my-2">Quản lý mượn trả sách</h1>
            <div class="p-6 shadow-lg rounded-lg bg-white dark:bg-gray-800">
                <NGrid cols="2" x-gap="24" y-gap="24">
                    <NGi span="1">
                        <n-card class="h-full">
                            <n-tabs
                            v-model:value="activeTab"
                            class="card-tabs"
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
                                <n-form-item-row label="Đọc giả">
                                    <NSelect 
                                    v-model:value="selectedReturnReader"
                                    :options="selectReaders"
                                    clearable 
                                    filterable 
                                    placeholder="Nhập tên hoặc mã đọc giả"/>
                                </n-form-item-row>
                                <n-form-item-row label="Sách">
                                    <NSelect 
                                    v-model:value="selectedReturnBook"
                                    :options="listSelectBookReturn"
                                    multiple
                                    filterable 
                                    clearable
                                    placeholder="Chọn các sách muốn trả"
                                    />
                                </n-form-item-row>
                                </n-form>
                                <n-button @click="submitReturn" type="primary" block secondary strong>
                                Xác nhận trả
                                </n-button>
                            </n-tab-pane>
                            </n-tabs>
                        </n-card>
                    </NGi>
                    <NGi span="1">
                        <!-- Preview dữ liệu đã chọn -->
                        <NCard title="Xem trước thông tin" class="h-full">
                            <NTabs v-model:value="activeTab" type="segment" animated>
                                <!-- Tab mượn sách -->
                                <NTabPane name="borrow" tab="Mượn sách">
                                    <NSpace vertical>
                                        <!-- Thông tin đọc giả -->
                                        <div v-if="selectedReaderInfo" class="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                                            <h4 class="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2">Thông tin đọc giả</h4>
                                            <NSpace vertical size="small">
                                                <div class="text-sm">
                                                    <span class="font-medium">Họ tên:</span> 
                                                    <span class="ml-2">{{ selectedReaderInfo.HOLOT }} {{ selectedReaderInfo.TEN }}</span>
                                                </div>
                                                <div class="text-sm">
                                                    <span class="font-medium">Mã đọc giả:</span> 
                                                    <span class="ml-2">{{ selectedReaderInfo.MADOCGIA }}</span>
                                                </div>
                                            </NSpace>
                                        </div>
                                        <NEmpty v-else description="Chưa chọn đọc giả" size="small" />

                                        <NDivider />

                                        <!-- Danh sách sách đã chọn -->
                                        <div>
                                            <h4 class="text-sm font-semibold mb-3">
                                                Sách đã chọn 
                                                <NTag v-if="selectedBooksInfo.length > 0" type="info" size="small" :bordered="false">
                                                    {{ selectedBooksInfo.length }}
                                                </NTag>
                                            </h4>
                                            <NList v-if="selectedBooksInfo.length > 0" bordered>
                                                <NListItem v-for="(book, index) in selectedBooksInfo" :key="book.key">
                                                    <NThing>
                                                        <template #header>
                                                            <span class="text-sm font-medium">{{ index + 1 }}. {{ book.bookName }}</span>
                                                        </template>
                                                        <template #description>
                                                            <div class="text-xs text-gray-500 dark:text-gray-400">
                                                                <span>Tác giả: {{ book.author }}</span>
                                                                <NDivider vertical />
                                                                <span>Mã: {{ book.key }}</span>
                                                            </div>
                                                        </template>
                                                    </NThing>
                                                </NListItem>
                                            </NList>
                                            <NEmpty v-else description="Chưa chọn sách" size="small" />
                                        </div>
                                    </NSpace>
                                </NTabPane>

                                <!-- Tab trả sách -->
                                <NTabPane name="return" tab="Trả sách">
                                    <NSpace vertical>
                                        <!-- Thông tin đọc giả -->
                                        <div v-if="selectedReturnReaderInfo" class="p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                                            <h4 class="text-sm font-semibold text-green-600 dark:text-green-400 mb-2">Thông tin đọc giả</h4>
                                            <NSpace vertical size="small">
                                                <div class="text-sm">
                                                    <span class="font-medium">Họ tên:</span> 
                                                    <span class="ml-2">{{ selectedReturnReaderInfo.HOLOT }} {{ selectedReturnReaderInfo.TEN }}</span>
                                                </div>
                                                <div class="text-sm">
                                                    <span class="font-medium">Mã đọc giả:</span> 
                                                    <span class="ml-2">{{ selectedReturnReaderInfo.MADOCGIA }}</span>
                                                </div>
                                            </NSpace>
                                        </div>
                                        <NEmpty v-else description="Chưa chọn đọc giả" size="small" />

                                        <NDivider />

                                        <!-- Danh sách sách trả -->
                                        <div>
                                            <h4 class="text-sm font-semibold mb-3">
                                                Sách cần trả 
                                                <NTag v-if="selectedReturnBooksInfo.length > 0" type="success" size="small" :bordered="false">
                                                    {{ selectedReturnBooksInfo.length }}
                                                </NTag>
                                            </h4>
                                            <NList v-if="selectedReturnBooksInfo.length > 0" bordered>
                                                <NListItem v-for="(book, index) in selectedReturnBooksInfo" :key="book.maphieu">
                                                    <NThing>
                                                        <template #header>
                                                            <span class="text-sm font-medium">{{ index + 1 }}. {{ book.label }}</span>
                                                        </template>
                                                        <template #description>
                                                            <div class="text-xs text-gray-500 dark:text-gray-400">
                                                                Mã phiếu: {{ book.maphieu }}
                                                            </div>
                                                        </template>
                                                    </NThing>
                                                </NListItem>
                                            </NList>
                                            <NEmpty v-else description="Chưa chọn sách" size="small" />
                                        </div>
                                    </NSpace>
                                </NTabPane>
                            </NTabs>
                        </NCard>
                    </NGi>
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