<script setup>
import {
    NRow,
    NCol,
    NStatistic,
    NIcon,
    NSpace,
    NDataTable,
    NButton,
    NTag,
    NConfigProvider,
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
    getAllBooks
}                           from '../../../services/apiBook.js'
import {
    getAllBorrows,
    getBorrowWithBillId
}                           from '../../../services/apiBorrow.js'

//================== GLOBAL VARIABLES ==================//
const message               =       useMessage();

onMounted(async () => {
    await getAllBooksData()//lấy hết sách ra
    await getAllBorrowsData()//lấy hết mượn sách ra
    await getAllBorrowsDetails()//lấy hết chi tiết muợn sách ra
})

//==========> Liên quan đến thống kê sách
const allBooks              = ref([])
const allBorrows            = ref([])
const allBorrowsDetails     = ref([])


const getAllBorrowsDetails = async () => {
    try {
        allBorrows.value.forEach(async borrow => {
            const billId = borrow.MAPHIEU;
            const response = await getBorrowWithBillId(billId)
            console.log(JSON.stringify(response.data));
            allBorrowsDetails.value.push(response.data)
        })
    } catch (error) {
        console.error('Lỗi khi lấy dữ liệu mượn sách:', error)
    }
}

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

// Computed property cho dữ liệu biểu đồ 7 ngày
const weekChartData = computed(() => {
    const today = new Date()
    const last7Days = []
    const dayLabels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
    
    // Hàm để so sánh ngày (bỏ qua timezone)
    const formatDateKey = (date) => {
        const d = new Date(date)
        const year = d.getFullYear()
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
    }
    
    // Tạo mảng 7 ngày trước đó
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        last7Days.push({
            dateKey: formatDateKey(date),
            label: dayLabels[date.getDay()],
            returned: 0,
            borrowed: 0
        })
    }
    
    // Đếm số lượng mượn và trả theo từng ngày
    allBorrows.value.forEach(borrow => {
        // Đếm sách mượn
        if (borrow.TINHTRANG === 'borrowing') {
            const borrowDateKey = formatDateKey(borrow.NGAYMUON)
            const borrowDayIndex = last7Days.findIndex(day => day.dateKey === borrowDateKey)
            if (borrowDayIndex !== -1) {
                last7Days[borrowDayIndex].borrowed++
            }
        }

        // Đếm sách trả
        if (borrow.TINHTRANG === 'returned' && borrow.NGAYTRA) {
            const returnDateKey = formatDateKey(borrow.NGAYTRA)
            const returnDayIndex = last7Days.findIndex(day => day.dateKey === returnDateKey)
            if (returnDayIndex !== -1) {
                last7Days[returnDayIndex].returned++
            }
        }
    })
    
    return {
        labels: last7Days.map(day => day.label),
        borrowed: last7Days.map(day => day.borrowed),
        returned: last7Days.map(day => day.returned)
    }
})


//<========== Liên quan đến thống kê sách


//<========== Liên quan đến bảng dữ liệu

// Computed property cho dữ liệu bảng mượn sách trong ngày
const borrowTableData = computed(() => {
    if (allBorrowsDetails.value.length === 0) return []
    
    const today = new Date()
    const todayDate = today.toLocaleDateString('vi-VN').split('/').reverse().join('-')
    
    return allBorrowsDetails.value
        .filter(borrow => {
            if (!borrow.SACH || !borrow.DOCGIA) return false
            const borrowDate = new Date(borrow.NGAYMUON)
            const borrowDateStr = borrowDate.toLocaleDateString('vi-VN').split('/').reverse().join('-')
            return borrowDateStr === todayDate && borrow.TINHTRANG === 'borrowing'
        })
        .map((borrow, index) => ({
            no: index + 1,
            billId: borrow.MAPHIEU,
            bookName: borrow.SACH?.TENSACH || 'N/A',
            author: borrow.SACH?.TACGIA || 'N/A',
            category: borrow.SACH?.THELOAI?.map(t => t.TenLoai).join(', ') || 'N/A',
            publisher: borrow.SACH?.NHAXUATBAN?.TENNXB || 'N/A',
            reader: `${borrow.DOCGIA?.HOLOT || ''} ${borrow.DOCGIA?.TEN || ''}`.trim(),
            phone: borrow.DOCGIA?.DIENTHOAI || 'N/A',
            borrowDate: new Date(borrow.NGAYMUON).toLocaleDateString('vi-VN'),
            dueDate: new Date(borrow.NGAYHANTRA).toLocaleDateString('vi-VN'),
            bookStatus: borrow.TRANGTHAISACH
        }))
})

// Tạo columns cho bảng
const columns = [
    {
        title: "STT",
        key: "no",
        width: 60,
        align: 'center'
    },
    {
        title: "Tên sách",
        key: "bookName",
        width: 200
    },
    {
        title: "Tác giả",
        key: "author",
        width: 120
    },
    {
        title: "Thể loại",
        key: "category",
        width: 150
    },
    {
        title: "Nhà xuất bản",
        key: "publisher",
        width: 150
    },
    {
        title: "Bạn đọc",
        key: "reader",
        width: 130
    },
    {
        title: "Số điện thoại",
        key: "phone",
        width: 110,
        align: 'center'
    },
    {
        title: "Ngày mượn",
        key: "borrowDate",
        width: 100,
        align: 'center'
    },
    {
        title: "Ngày hạn trả",
        key: "dueDate",
        width: 100,
        align: 'center'
    },
    {
        title: "Trạng thái sách",
        key: "bookStatus",
        width: 100,
        align: 'center',
        render: (row) => h(
            NTag,
            {
                type: row.bookStatus === 'new' ? 'success' : 'warning',
                round: true,
                size: 'small'
            },
            { default: () => row.bookStatus === 'new' ? 'Mới' : 'Cũ' }
        )
    }
]

const pagination = {
    pageSize: 10
}

//<========== Liên quan đến bảng dữ liệu














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
                <NCol :span="16" class="flex justify-center items-center">
                    <Chart class="w-full" :options="{
                        chart: {
                            type: 'line',
                            height: 350,
                            toolbar: {
                                show: false
                            },
                            sparkline: {
                                enabled: false
                            },
                            animations: {
                                enabled: true,
                                speed: 800,
                                animateGradually: {
                                    enabled: true,
                                    delay: 150
                                },
                                dynamicAnimation: {
                                    enabled: true,
                                    speed: 150
                                }
                            }
                        },
                        colors: ['green', 'red'],
                        stroke: {
                            curve: 'smooth',
                            width: 4,
                            lineCap: 'round',
                            lineJoin: 'round'
                        },
                        fill: {
                            type: 'gradient',
                            gradient: {
                                shadeIntensity: 0.8,
                                opacityFrom: 0.9,
                                opacityTo: 0.5,
                                stops: [0, 100]
                            }
                        },
                        series: [
                            {
                                name: 'Sách trả',
                                data: weekChartData.returned
                            },
                            {
                                name: 'Sách mượn',
                                data: weekChartData.borrowed
                            }
                        ],
                        xaxis: {
                            categories: weekChartData.labels,
                            title: {
                                text: 'Ngày trong tuần',
                                style: {
                                    fontSize: '14px',
                                    fontWeight: 600
                                }
                            },
                            axisBorder: {
                                show: true,
                                color: isDark ? '#404854' : '#e0e6ed'
                            },
                            axisTicks: {
                                show: true,
                                color: isDark ? '#404854' : '#e0e6ed'
                            },
                            labels: {
                                style: {
                                    fontSize: '13px',
                                    colors: isDark ? '#a8adb5' : '#626c7f'
                                }
                            }
                        },
                        yaxis: {
                            title: {
                                text: 'Số lượng sách',
                                style: {
                                    fontSize: '14px',
                                    fontWeight: 600
                                }
                            },
                            labels: {
                                style: {
                                    fontSize: '13px',
                                    colors: isDark ? '#a8adb5' : '#626c7f'
                                }
                            }
                        },
                        legend: {
                            position: 'top',
                            horizontalAlign: 'right',
                            labels: {
                                colors: isDark ? '#a8adb5' : '#626c7f'
                            },
                            markers: {
                                width: 12,
                                height: 12,
                                strokeWidth: 0,
                                radius: 2
                            }
                        },
                        grid: {
                            borderColor: isDark ? '#404854' : '#e0e6ed',
                            strokeDashArray: 4,
                            xaxis: {
                                lines: {
                                    show: false
                                }
                            },
                            yaxis: {
                                lines: {
                                    show: true
                                }
                            }
                        },
                        tooltip: {
                            theme: isDark ? 'dark' : 'light',
                            style: {
                                fontSize: '13px'
                            },
                            y: {
                                formatter(val) {
                                    return val + ' quyển'
                                }
                            }
                        },
                        dataLabels: {
                            enabled: false
                        }
                    }"/>
                </NCol>
                <NCol :span="8" class="flex justify-center items-center">
                    <Chart class="w-full" :options="{
                        chart: {
                            type: 'donut',
                            height: 350,
                            toolbar: {
                                show: false
                            },
                            animations: {
                                enabled: true,
                                speed: 800,
                                animateGradually: {
                                    enabled: true,
                                    delay: 150
                                },
                                dynamicAnimation: {
                                    enabled: true,
                                    speed: 150
                                }
                            }
                        },
                        colors: ['#3B82F6', '#10B981'],
                        series: [borrowedBooksToday.length, returnedBooksToday.length],
                        labels: ['Mượn trong ngày', 'Trả trong ngày'],
                        legend: {
                            position: 'bottom',
                            horizontalAlign: 'center',
                            labels: {
                                colors: isDark ? '#a8adb5' : '#626c7f'
                            }
                        },
                        fill: {
                            opacity: 0.9,
                            type: 'solid'
                        },
                        stroke: {
                            show: true,
                            width: 2,
                            colors: [isDark ? '#1f2937' : '#ffffff']
                        },
                        plotOptions: {
                            pie: {
                                donut: {
                                    size: '70%',
                                    background: 'transparent',
                                    labels: {
                                        show: true,
                                        name: {
                                            fontSize: '14px',
                                            fontWeight: 500,
                                            color: isDark ? '#a8adb5' : '#626c7f'
                                        },
                                        value: {
                                            fontSize: '20px',
                                            fontWeight: 600,
                                            color: isDark ? '#e5e7eb' : '#1f2937',
                                            formatter(val) {
                                                return val + ' quyển'
                                            }
                                        },
                                        total: {
                                            show: true,
                                            showAlways: true,
                                            label: 'Tổng',
                                            fontSize: '14px',
                                            fontWeight: 500,
                                            color: isDark ? '#a8adb5' : '#626c7f',
                                            formatter(w) {
                                                return w.globals.seriesTotals.reduce((a, b) => {
                                                    return a + b
                                                }, 0) + ' quyển'
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        tooltip: {
                            theme: isDark ? 'dark' : 'light',
                            style: {
                                fontSize: '13px'
                            },
                            y: {
                                formatter(val) {
                                    return val + ' quyển'
                                }
                            }
                        },
                        dataLabels: {
                            enabled: true,
                            distributed: true,
                            formatter(val) {
                                return Math.round(val) + '%'
                            },
                            style: {
                                fontSize: '13px',
                                fontWeight: 600,
                                colors: [isDark ? '#e5e7eb' : '#ffffff']
                            },
                            dropShadow: {
                                enabled: true,
                                top: 1,
                                left: 1,
                                blur: 2,
                                color: isDark ? '#000000' : '#000000',
                                opacity: 0.45
                            }
                        }
                    }" />
                </NCol>
            </NRow>
        </div>
        <div class="p-3">
            <div class="p-6 shadow-lg rounded-lg bg-white dark:bg-gray-800">
                <h2 class="text-2xl font-semibold uppercase my-4">Thông tin mượn sách trong ngày</h2>
                <NDataTable
                    :columns="columns"
                    :data="borrowTableData"
                    :pagination="pagination"
                    :bordered="true"
                    :single-line="false"
                    size="small"
                    striped
                />
                <div class="mt-4 text-sm text-gray-600 dark:text-gray-400">
                    <span class="font-semibold">Tổng số sách mượn trong ngày:</span> {{ borrowTableData.length }} quyển
                </div>
            </div>
        </div>
    </NConfigProvider>
</template>


<style scoped>
span.n-statistic-value__content {
    color: white !important;
}
</style>