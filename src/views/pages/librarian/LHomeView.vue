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
    NPopconfirm,
    NCheckbox,
    NSpin,
    NSkeleton,
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
import {
    getPendingPickupBills,
    confirmPickup
}                           from '../../../services/apiBill.js'
import { currentAccount }   from '../../../hooks/useAccount.js'

//================== GLOBAL VARIABLES ==================//
const message               = useMessage();
const allBooks              = ref([]) //tất cả sách
const allBorrows            = ref([]) //tất cả mượn trả

// Loading states
const isPageLoading         = ref(true)
const isBorrowSubmitting    = ref(false)
const isReturnSubmitting    = ref(false)
const isPickupSubmitting    = ref(false)
const isLoadingReturnBooks  = ref(false)

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
const lostBooks             = ref([])

//==lấy sách
const pendingPickupBills    = ref([])
const selectedPickupBill    = ref(null)

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
    const today = new Date();
    
    return selectedReturnBook.value.map(maphieu => {
        const option = listSelectBookReturn.value.find(opt => opt.value === maphieu)
        const ngayHanTra = option?.ngayHanTra ? new Date(option.ngayHanTra) : null
        const soNgayTre = ngayHanTra && ngayHanTra < today 
            ? Math.ceil((today - ngayHanTra) / (1000 * 60 * 60 * 24)) 
            : 0
        
        return {
            maphieu: maphieu,
            label: option?.label || 'N/A',
            isOverdue: option?.isOverdue || false,
            soNgayTre: soNgayTre,
            gia: option?.gia || 0,
            phiTre: soNgayTre > 0 ? (option?.gia || 0) * 1.5 * soNgayTre : 0
        }
    })
})

// Computed cho tab lấy sách
const selectedPickupBillInfo = computed(() => {
    if (!selectedPickupBill.value) return null
    return pendingPickupBills.value.find(bill => bill.MABILL === selectedPickupBill.value)
})

// Computed cho phí vi phạm khi trả sách
const totalLateFee = computed(() => {
    return selectedReturnBooksInfo.value.reduce((sum, b) => sum + b.phiTre, 0)
})

const totalLostBookFee = computed(() => {
    return selectedReturnBooksInfo.value
        .filter(b => lostBooks.value.includes(b.maphieu))
        .reduce((sum, b) => sum + (b.gia * 20), 0)
})

const totalViolationFee = computed(() => {
    return totalLateFee.value + totalLostBookFee.value
})

const hasViolations = computed(() => {
    return selectedReturnBooksInfo.value.some(b => b.isOverdue) || lostBooks.value.length > 0
})

//<========== Computed để hiển thị thông tin đã chọn

const loadBorrowBookWithReader = async () => {
    isLoadingReturnBooks.value = true;
    try {
        const listBook = []
        const response = await getBorrowsWithUserId(selectedReturnReader.value);
        const borrowingBooks = response.data.filter(borrow => borrow.TINHTRANG === 'borrowing');
        const today = new Date();
    
    borrowingBooks.forEach(borrow => {
        const MASACH = borrow.MA_BANSAO.split('T')[0].trim();
        const BOOK = allBooks.value.find(book => book.MASACH === MASACH);
        const ngayHanTra = new Date(borrow.NGAYHANTRA);
        const isOverdue = ngayHanTra < today;
        
        listBook.push({
            label: `${BOOK.TENSACH} - ${borrow.MA_BANSAO}${isOverdue ? ' ⚠️ TRỄ HẠN' : ''}`,
            value: borrow.MAPHIEU,
            isOverdue: isOverdue,
            ngayHanTra: borrow.NGAYHANTRA,
            gia: borrow.GIA
        })
    })
    listSelectBookReturn.value = listBook;
    } catch (error) {
        message.error('Không thể tải danh sách sách đang mượn');
    } finally {
        isLoadingReturnBooks.value = false;
    }
}

watch(selectedReturnReader, async (newVal) => {
    if (newVal !== null) {
        await loadBorrowBookWithReader();
    } else {
        lostBooks.value = [];
    }
});

// Watch cho tab lấy sách - khi chọn bill khác thì reset selection
watch(selectedPickupBill, () => {
    // Không cần reset selection nữa vì lấy tất cả
})

onMounted(async () => {
    isPageLoading.value = true;
    try {
        await getAllBooksData()
        await getAllBorrowsData()
        await getAllReadersData()
        await loadPendingPickupBills()
        loadBooksSelect()
    } finally {
        isPageLoading.value = false;
    }
})


//==========> Liên quan đến thống kê sách

//lấy hết dữ liệu mượn trả
const getAllBorrowsData = async () => {
    try {
        const response = await getAllBorrows()
        allBorrows.value = response.data
    } catch (error) {
        message.error('Không thể tải dữ liệu mượn sách')
    }
}

//lấy hết dữ liệu sách
const getAllBooksData = async () => {
    try {
        const response = await getAllBooks()
        allBooks.value = response.data
    } catch (error) {
        message.error('Không thể tải dữ liệu sách')
    }
}


//lấy các sách đã mượn trong ngày
const borrowedBooksToday = computed(() => {
    if(allBorrows.value.length === 0) return []
    const today = new Date()
    const todayDate = today.toLocaleDateString('vi-VN').split('/').reverse().join('-')
    
    return allBorrows.value.filter(borrow => {
        const borrowDate = new Date(borrow.NGAYMUON)
        const borrowDateStr = borrowDate.toLocaleDateString('vi-VN').split('/').reverse().join('-')
        return borrowDateStr === todayDate && borrow.TINHTRANG === 'borrowing'
    })
})

//lấy các sách trả trong ngày
const returnedBooksToday = computed(() => {
    if(allBorrows.value.length === 0) return []
    const today = new Date()
    const todayDate = today.toLocaleDateString('vi-VN').split('/').reverse().join('-')
    
    return allBorrows.value.filter(borrow => {
        if (!borrow.NGAYTRA) return false
        const returnDate = new Date(borrow.NGAYTRA)
        const returnDateStr = returnDate.toLocaleDateString('vi-VN').split('/').reverse().join('-')
        return returnDateStr === todayDate && borrow.TINHTRANG === 'returned'
    })
})

//lấy sách quá hạn trả mà chưa trả
const overdueBooks = computed(() => {
    if(allBorrows.value.length === 0) return []
    const today = new Date()
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
        message.error('Không thể tải dữ liệu đọc giả')
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
        children: undefined
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
    booksSelect.value = [...booksSelect.value];
    return Promise.resolve();
}


//<========== Liên quan đến form mượn trả sách

//==========> Xác nhận mượn sách
const submitBorrow = async () => {
    if (!selectedReader.value || !listSelectedBooks.value?.length) {
        message.warning('Vui lòng chọn đọc giả và sách cần mượn');
        return;
    }
    isBorrowSubmitting.value = true;
    try {
        const data = {
            MANHANVIEN: currentAccount.value?.MSNV || 'system',
            MADOCGIA: selectedReader.value,
            LIST_MA_BANSAO: listSelectedBooks.value,
        }
        const response = await createBorrow(data);
        message[response.status](response.message);
        if (response.status === 'success') {
            selectedReader.value = null;
            listSelectedBooks.value = null;
            await getAllBorrowsData();
        }
    } catch (error) {
        message.error(error.response?.data?.message || 'Có lỗi xảy ra khi mượn sách');
    } finally {
        isBorrowSubmitting.value = false;
    }
}

const submitReturn = async () => {
    if (!selectedReturnBook.value?.length) {
        message.warning('Vui lòng chọn sách cần trả');
        return;
    }
    isReturnSubmitting.value = true;
    try {
        const LIST_MAPHIEU      = selectedReturnBook.value
        const LIST_LOST_BOOKS   = lostBooks.value
        
        const response = await returnBook(LIST_MAPHIEU, LIST_LOST_BOOKS);
        message[response.status](response.message);
        
        if (response.status === 'success') {
            selectedReturnReader.value = null;
            selectedReturnBook.value = null;
            lostBooks.value = [];
            listSelectBookReturn.value = [];
            await getAllBorrowsData();
        }
    } catch (error) {
        message.error(error.response?.data?.message || 'Có lỗi xảy ra khi trả sách');
    } finally {
        isReturnSubmitting.value = false;
    }
}
//<========== Xác nhận mượn sách

//==========> Xử lý tab lấy sách
const loadPendingPickupBills = async () => {
    try {
        const response = await getPendingPickupBills()
        pendingPickupBills.value = response.data
    } catch (error) {
        message.error('Không thể tải danh sách bills chờ lấy sách')
    }
}

const selectPendingBills = computed(() => {
    if(!pendingPickupBills.value || pendingPickupBills.value.length === 0) return []
    return pendingPickupBills.value.map(bill => ({
        label: `${bill.MABILL} - ${bill.DOCGIA?.HOLOT} ${bill.DOCGIA?.TEN} - ${bill.LOAITHANHTOAN === 'cash' ? 'Tiền mặt' : 'Online'}`,
        value: bill.MABILL
    }))
})

const handleConfirmPickupAll = async () => {
    if (!selectedPickupBill.value) {
        message.warning('Vui lòng chọn bill')
        return
    }
    
    const billInfo = selectedPickupBillInfo.value
    if (!billInfo || !billInfo.PHIEUWAITING || billInfo.PHIEUWAITING.length === 0) {
        message.warning('Bill này không có sách chờ lấy')
        return
    }
    
    isPickupSubmitting.value = true;
    try {
        // Lấy tất cả mã phiếu waiting
        const allPhieuMaList = billInfo.PHIEUWAITING.map(p => p.MAPHIEU)
        const confirmPayment = billInfo.LOAITHANHTOAN === 'cash' && billInfo.TRANGTHAI === false
        
        const data = {
            MABILL: selectedPickupBill.value,
            LIST_MAPHIEU: allPhieuMaList,
            confirmPayment: confirmPayment
        }
        
        const response = await confirmPickup(data)
        message[response.status](response.message)
        
        if (response.status === 'success') {
            selectedPickupBill.value = null
            await loadPendingPickupBills()
        }
    } catch (error) {
        message.error(error.response?.data?.message || 'Có lỗi xảy ra khi xác nhận lấy sách')
    } finally {
        isPickupSubmitting.value = false;
    }
}
//<========== Xử lý tab lấy sách

const customThemeLight = ref({
    Statistic: {
        valueTextColor: '#ffffff',
        labelTextColor: '#ffffff'
    },
});

const customThemeDark = ref({})

</script>


<template>
    <NConfigProvider :theme-overrides="isDark ? customThemeDark : customThemeLight">
        <NSpin :show="isPageLoading" description="Đang tải dữ liệu...">
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
                                    :disabled="isBorrowSubmitting"
                                    clearable 
                                    filterable 
                                    placeholder="Nhập tên hoặc mã đọc giả"/>
                                </n-form-item-row>
                                <n-form-item-row label="Sách">
                                    <NTreeSelect 
                                    v-model:value="listSelectedBooks"
                                    :options="booksSelect"
                                    :disabled="isBorrowSubmitting" 
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
                                <n-button 
                                    @click="submitBorrow" 
                                    type="primary" 
                                    block 
                                    secondary 
                                    strong
                                    :loading="isBorrowSubmitting"
                                    :disabled="isBorrowSubmitting || !selectedReader || !listSelectedBooks?.length"
                                >
                                    <template #icon v-if="!isBorrowSubmitting">
                                        <i class="fa-solid fa-check"></i>
                                    </template>
                                    {{ isBorrowSubmitting ? 'Đang xử lý...' : 'Xác nhận mượn' }}
                                </n-button>
                            </n-tab-pane>
                            <n-tab-pane name="return" tab="Trả sách">
                                <n-form>
                                <n-form-item-row label="Đọc giả">
                                    <NSelect 
                                    v-model:value="selectedReturnReader"
                                    :options="selectReaders"
                                    :loading="isLoadingReturnBooks"
                                    :disabled="isReturnSubmitting"
                                    clearable 
                                    filterable 
                                    placeholder="Nhập tên hoặc mã đọc giả"/>
                                </n-form-item-row>
                                <n-form-item-row label="Sách">
                                    <NSelect 
                                    v-model:value="selectedReturnBook"
                                    :options="listSelectBookReturn"
                                    :loading="isLoadingReturnBooks"
                                    :disabled="isReturnSubmitting || isLoadingReturnBooks"
                                    multiple
                                    filterable 
                                    clearable
                                    placeholder="Chọn các sách muốn trả"
                                    />
                                </n-form-item-row>
                                </n-form>
                                <NPopconfirm
                                    v-if="hasViolations"
                                    @positive-click="submitReturn"
                                    positive-text="Đã thu phí"
                                    negative-text="Hủy"
                                >
                                    <template #trigger>
                                        <n-button 
                                            type="primary" 
                                            block 
                                            secondary 
                                            strong
                                            :loading="isReturnSubmitting"
                                            :disabled="isReturnSubmitting || !selectedReturnBook?.length"
                                        >
                                            {{ isReturnSubmitting ? 'Đang xử lý...' : 'Xác nhận trả' }}
                                        </n-button>
                                    </template>
                                    <NSpace vertical size="small">
                                        <div class="font-semibold">Xác nhận đã thu phí vi phạm:</div>
                                        <div v-if="totalLateFee > 0">
                                            • Phí trễ: {{ totalLateFee.toLocaleString() }} đ
                                        </div>
                                        <div v-if="totalLostBookFee > 0">
                                            • Phí mất sách: {{ totalLostBookFee.toLocaleString() }} đ
                                        </div>
                                        <div class="font-semibold text-red-600">
                                            Tổng: {{ totalViolationFee.toLocaleString() }} đ
                                        </div>
                                    </NSpace>
                                </NPopconfirm>
                                <n-button 
                                    v-else
                                    @click="submitReturn" 
                                    type="primary" 
                                    block 
                                    secondary 
                                    strong
                                    :loading="isReturnSubmitting"
                                    :disabled="isReturnSubmitting || !selectedReturnBook?.length"
                                >
                                    {{ isReturnSubmitting ? 'Đang xử lý...' : 'Xác nhận trả' }}
                                </n-button>
                            </n-tab-pane>
                            <n-tab-pane name="pickup" tab="Lấy sách">
                                <n-form>
                                <n-form-item-row label="Bill">
                                    <NSelect 
                                    v-model:value="selectedPickupBill"
                                    :options="selectPendingBills"
                                    :disabled="isPickupSubmitting"
                                    clearable 
                                    filterable 
                                    placeholder="Chọn bill cần lấy sách"/>
                                </n-form-item-row>
                                </n-form>
                                <NPopconfirm
                                    v-if="selectedPickupBillInfo?.LOAITHANHTOAN === 'cash' && !selectedPickupBillInfo?.TRANGTHAI"
                                    @positive-click="handleConfirmPickupAll"
                                    positive-text="Đã thanh toán"
                                    negative-text="Hủy"
                                >
                                    <template #trigger>
                                        <n-button 
                                            type="primary" 
                                            block 
                                            secondary 
                                            strong
                                            :loading="isPickupSubmitting"
                                            :disabled="!selectedPickupBill || isPickupSubmitting"
                                        >
                                            {{ isPickupSubmitting ? 'Đang xử lý...' : 'Xác nhận lấy tất cả sách' }}
                                        </n-button>
                                    </template>
                                    Xác nhận đọc giả đã thanh toán tiền mặt?
                                </NPopconfirm>
                                <n-button 
                                    v-else
                                    @click="handleConfirmPickupAll" 
                                    type="primary" 
                                    block 
                                    secondary 
                                    strong
                                    :loading="isPickupSubmitting"
                                    :disabled="!selectedPickupBill || isPickupSubmitting"
                                >
                                    {{ isPickupSubmitting ? 'Đang xử lý...' : 'Xác nhận lấy tất cả sách' }}
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
                                        <NCard v-if="selectedReaderInfo" size="small" title="Thông tin đọc giả">
                                            <NSpace vertical size="small">
                                                <div><strong>Họ tên:</strong> {{ selectedReaderInfo.HOLOT }} {{ selectedReaderInfo.TEN }}</div>
                                                <div><strong>Mã đọc giả:</strong> {{ selectedReaderInfo.MADOCGIA }}</div>
                                            </NSpace>
                                        </NCard>
                                        <NEmpty v-else description="Chưa chọn đọc giả" />

                                        <NDivider />

                                        <!-- Danh sách sách đã chọn -->
                                        <NCard size="small">
                                            <template #header>
                                                <NSpace align="center">
                                                    <span>Sách đã chọn</span>
                                                    <NTag v-if="selectedBooksInfo.length > 0" size="small">
                                                        {{ selectedBooksInfo.length }}
                                                    </NTag>
                                                </NSpace>
                                            </template>
                                            <NList v-if="selectedBooksInfo.length > 0" bordered>
                                                <NListItem v-for="(book, index) in selectedBooksInfo" :key="book.key">
                                                    <NThing>
                                                        <template #header>
                                                            {{ index + 1 }}. {{ book.bookName }}
                                                        </template>
                                                        <template #description>
                                                            <NSpace size="small">
                                                                <span>Tác giả: {{ book.author }}</span>
                                                                <NDivider vertical />
                                                                <span>Mã: {{ book.key }}</span>
                                                            </NSpace>
                                                        </template>
                                                    </NThing>
                                                </NListItem>
                                            </NList>
                                            <NEmpty v-else description="Chưa chọn sách" />
                                        </NCard>
                                    </NSpace>
                                </NTabPane>

                                <!-- Tab trả sách -->
                                <NTabPane name="return" tab="Trả sách">
                                    <NSpace vertical>
                                        <!-- Thông tin đọc giả -->
                                        <NCard v-if="selectedReturnReaderInfo" size="small" title="Thông tin đọc giả">
                                            <NSpace vertical size="small">
                                                <div><strong>Họ tên:</strong> {{ selectedReturnReaderInfo.HOLOT }} {{ selectedReturnReaderInfo.TEN }}</div>
                                                <div><strong>Mã đọc giả:</strong> {{ selectedReturnReaderInfo.MADOCGIA }}</div>
                                            </NSpace>
                                        </NCard>
                                        <NEmpty v-else description="Chưa chọn đọc giả" />

                                        <NDivider />

                                        <!-- Danh sách sách trả -->
                                        <NCard size="small">
                                            <template #header>
                                                <NSpace align="center">
                                                    <span>Sách cần trả</span>
                                                    <NTag v-if="selectedReturnBooksInfo.length > 0" size="small">
                                                        {{ selectedReturnBooksInfo.length }}
                                                    </NTag>
                                                </NSpace>
                                            </template>
                                            <NList v-if="selectedReturnBooksInfo.length > 0" bordered>
                                                <NListItem v-for="(book, index) in selectedReturnBooksInfo" :key="book.maphieu">
                                                    <NThing>
                                                        <template #header>
                                                            <NSpace align="center">
                                                                <span>{{ index + 1 }}. {{ book.label }}</span>
                                                                <NTag v-if="book.isOverdue" type="error" size="small">
                                                                    Trễ {{ book.soNgayTre }} ngày
                                                                </NTag>
                                                            </NSpace>
                                                        </template>
                                                        <template #description>
                                                            <NSpace vertical size="small">
                                                                <div>Mã phiếu: {{ book.maphieu }}</div>
                                                                <div v-if="book.isOverdue">
                                                                    <NTag type="error" size="small">
                                                                        Phí trễ: {{ book.phiTre.toLocaleString() }} đ
                                                                    </NTag>
                                                                </div>
                                                                <NCheckbox 
                                                                    :checked="lostBooks?.includes(book.maphieu) || false"
                                                                    @update:checked="(checked) => {
                                                                        if (checked) {
                                                                            if (!lostBooks.includes(book.maphieu)) {
                                                                                lostBooks.push(book.maphieu)
                                                                            }
                                                                        } else {
                                                                            const index = lostBooks.indexOf(book.maphieu)
                                                                            if (index > -1) {
                                                                                lostBooks.splice(index, 1)
                                                                            }
                                                                        }
                                                                    }"
                                                                >
                                                                    <NTag type="error" size="small">
                                                                        Sách bị mất (Phí: {{ (book.gia * 20).toLocaleString() }} đ)
                                                                    </NTag>
                                                                </NCheckbox>
                                                            </NSpace>
                                                        </template>
                                                    </NThing>
                                                </NListItem>
                                            </NList>
                                            <NEmpty v-else description="Chưa chọn sách" />
                                        </NCard>
                                    </NSpace>
                                </NTabPane>

                                <!-- Tab lấy sách -->
                                <NTabPane name="pickup" tab="Lấy sách">
                                    <NSpace vertical>
                                        <!-- Thông tin bill và đọc giả -->
                                        <NCard v-if="selectedPickupBillInfo" size="small" title="Thông tin Bill">
                                            <NSpace vertical size="small">
                                                <div><strong>Mã Bill:</strong> {{ selectedPickupBillInfo.MABILL }}</div>
                                                <div><strong>Đọc giả:</strong> {{ selectedPickupBillInfo.DOCGIA?.HOLOT }} {{ selectedPickupBillInfo.DOCGIA?.TEN }}</div>
                                                <div><strong>Tổng tiền:</strong> {{ selectedPickupBillInfo.TONGTIEN?.toLocaleString() }} đ</div>
                                                <div>
                                                    <strong>Phương thức:</strong> 
                                                    <NTag 
                                                        :type="selectedPickupBillInfo.LOAITHANHTOAN === 'cash' ? 'warning' : 'success'" 
                                                        size="small"
                                                    >
                                                        {{ selectedPickupBillInfo.LOAITHANHTOAN === 'cash' ? 'Tiền mặt' : 'Online' }}
                                                    </NTag>
                                                </div>
                                                <div>
                                                    <strong>Trạng thái TT:</strong> 
                                                    <NTag 
                                                        :type="selectedPickupBillInfo.TRANGTHAI ? 'success' : 'error'" 
                                                        size="small"
                                                    >
                                                        {{ selectedPickupBillInfo.TRANGTHAI ? 'Đã thanh toán' : 'Chưa thanh toán' }}
                                                    </NTag>
                                                </div>
                                            </NSpace>
                                        </NCard>
                                        <NEmpty v-else description="Chưa chọn bill" />

                                        <NDivider />

                                        <!-- Danh sách TẤT CẢ sách chờ lấy -->
                                        <NCard size="small">
                                            <template #header>
                                                <NSpace align="center">
                                                    <span>Tất cả sách chờ lấy</span>
                                                    <NTag v-if="selectedPickupBillInfo?.PHIEUWAITING?.length > 0" size="small">
                                                        {{ selectedPickupBillInfo.PHIEUWAITING.length }}
                                                    </NTag>
                                                </NSpace>
                                            </template>
                                            <NList v-if="selectedPickupBillInfo?.PHIEUWAITING?.length > 0" bordered>
                                                <NListItem v-for="(phieu, index) in selectedPickupBillInfo.PHIEUWAITING" :key="phieu.MAPHIEU">
                                                    <NThing>
                                                        <template #header>
                                                            {{ index + 1 }}. {{ phieu.SACH?.TENSACH }}
                                                        </template>
                                                        <template #description>
                                                            <NSpace size="small">
                                                                <span>Tác giả: {{ phieu.SACH?.TACGIA }}</span>
                                                                <NDivider vertical />
                                                                <span>Mã bản sao: {{ phieu.MA_BANSAO }}</span>
                                                            </NSpace>
                                                        </template>
                                                    </NThing>
                                                </NListItem>
                                            </NList>
                                            <NEmpty v-else description="Không có sách chờ lấy" />
                                        </NCard>
                                    </NSpace>
                                </NTabPane>
                            </NTabs>
                        </NCard>
                    </NGi>
                </NGrid>
            </div>
        </div>
        </NSpin>
    </NConfigProvider>
</template>


<style scoped>
span.n-statistic-value__content {
    color: white !important;
}
</style>