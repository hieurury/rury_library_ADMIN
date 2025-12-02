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
    NConfigProvider,
    NModal,
    NForm,
    NFormItem,
    NInputNumber,
    NDatePicker,
    NUpload,
    NUploadDragger,
    NText,
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
import {
    updateBook
}                       from '../../services/apiBook.js';
import { isDark } from '../../hooks/useDark';

//=========================== VRIABLES ===========================//
const BASE_API                  =       import.meta.env.VITE_BASE_API;
const message                   =       useMessage();
const loading                   =       ref(true);



//==========> Number animation
const numberAnimation           =       ref(null);
const totalBooks                =       computed(() => allBooks.value.filter(b => b.TINHTRANG !== false).length);
const totalHiddenBooks          =       computed(() => allBooks.value.filter(b => b.TINHTRANG === false).length);
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
const deletingBook              =       ref(null); //state cho xóa sách
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
    if (deletingBook.value) return; // Ngăn double click
    
    try {
        deletingBook.value      =       maSach;
        const response          =       await axios.delete(`${BASE_API}/sach/admin/delete/${maSach}`);
        message[response.data.status](response.data.message);
        await getAllBooks();
    } catch (error) {
        message.error(error.response?.data?.message || 'Xóa sách thất bại');
    } finally {
        deletingBook.value      =       null;
    }
};

//==========> Kích hoạt lại sách
const activatingBook            =       ref(null);

const activateBook              =       async (maSach) => {
    if (activatingBook.value) return;
    
    try {
        activatingBook.value    =       maSach;
        const response          =       await axios.put(`${BASE_API}/sach/admin/activate/${maSach}`);
        message[response.data.status](response.data.message);
        await getAllBooks();
    } catch (error) {
        message.error(error.response?.data?.message || 'Kích hoạt sách thất bại');
    } finally {
        activatingBook.value    =       null;
    }
};
//<========== Kích hoạt lại sách

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
        icon: `${BASE_API}${category.Icon}`,
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

//==========> Liên quan đến form sửa sách
const editModalShow             =       ref(false);
const editFormRef               =       ref(null);
const selectedBook              =       ref(null);
const fileListEdit              =       ref([]);
const previewImageUrlEdit       =       ref('');
const submittingEdit            =       ref(false);

const editForm                  =       ref({
    bookName: '',
    bookDescription: '',
    bookAuthor: '',
    bookPublisher: null,
    bookPublishedDate: Date.now(),
    bookCategory: [],
    bookQuantity: 1,
    bookPrice: 1000,
    bookImage: ''
});

const openEditModal = (book) => {
    selectedBook.value = book;
    editForm.value = {
        bookName: book.TENSACH,
        bookDescription: book.MOTA,
        bookAuthor: book.TACGIA,
        bookPublisher: book.MAXB.MANXB,
        bookPublishedDate: new Date(book.NAMXUATBAN).getTime(),
        bookCategory: book.THELOAI.map(t => t.MaLoai),
        bookQuantity: book.SOQUYEN,
        bookPrice: book.DONGIA,
        bookImage: book.HINHANH
    };
    previewImageUrlEdit.value = `${BASE_API}${book.HINHANH}`;
    fileListEdit.value = [];
    editModalShow.value = true;
};

const createPreviewImageUrlEdit = (file) => {
    fileListEdit.value = file;
    const raw = file[0]?.file;
    if(raw) {
        previewImageUrlEdit.value = URL.createObjectURL(raw);
    }
};

const handleRemoveEdit = (file) => {
    previewImageUrlEdit.value = `${BASE_API}${selectedBook.value.HINHANH}`;
    return true;
};

const beforeUploadEdit = (data) => {
    const types = ['image/jpeg', 'image/png', 'image/svg+xml'];
    const isJpgOrPng = types.includes(data.file.type);
    if (!isJpgOrPng) {
        message.error('Chỉ hỗ trợ file JPG/PNG/SVG!');
    }
    return isJpgOrPng;
};

const uploadImgEdit = async () => {
    if(fileListEdit.value.length === 0) {
        return selectedBook.value.HINHANH;
    }
    const formData = new FormData();
    formData.append('image', fileListEdit.value[0].file);
    const response = await axios.post(`${BASE_API}/sach/admin/upload-image`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    if(response.data.status == 'success') {
        return response.data.imagePath;
    } else {
        message.error('Tải ảnh thất bại!');
        return selectedBook.value.HINHANH;
    }
};

const selectedPublisherEdit = computed(() => {
    if (!selectedBook.value) return 'Chưa chọn NXB';
    return allPublishers.value.find(publisher => publisher.MANXB === editForm.value.bookPublisher)?.TENNXB || 'Chưa chọn NXB';
});

const previewCategoriesEdit = computed(() => {
    return allcategories.value.filter(category => editForm.value.bookCategory.includes(category.MaLoai));
});

const bookCategoryValidatorEdit = () => {
    if(!editForm.value.bookCategory || editForm.value.bookCategory.length === 0) {
        return new Error('Vui lòng chọn ít nhất một thể loại');
    }
    return true;
};

const bookPublisherValidatorEdit = () => {
    if(!editForm.value.bookPublisher) {
        return new Error('Vui lòng chọn nhà xuất bản');
    }
    return true;
};

const quantityValidatorEdit = (value) => {
    if(editForm.value.bookQuantity <= 0) {
        return new Error('Số lượng sách phải lớn hơn 0');
    }
    return true;
};

const numberValidatorEdit = (value) => {
    return value > 0;
};

const rulesEdit = {
    bookName: [
        { required: true, message: 'Vui lòng nhập tên sách', trigger: 'blur' },
        { min: 3, max: 100, message: 'Tên sách phải từ 3-100 ký tự', trigger: 'blur' }
    ],
    bookDescription: [
        { required: true, message: 'Vui lòng nhập mô tả sách', trigger: 'blur' },
        { min: 10, max: 500, message: 'Mô tả sách phải từ 10-500 ký tự', trigger: 'blur' }
    ],
    bookAuthor: [
        { required: true, message: 'Vui lòng nhập tên tác giả', trigger: 'blur' },
        { min: 3, max: 100, message: 'Tên tác giả phải từ 3-100 ký tự', trigger: 'blur' }
    ],
    bookPublisher: [
        { validator: bookPublisherValidatorEdit, trigger: 'change' }
    ],
    bookCategory: [
        { validator: bookCategoryValidatorEdit, trigger: 'change' }
    ],
    bookQuantity: [
        { validator: quantityValidatorEdit, trigger: 'blur' }
    ]
};

const submitEditForm = async () => {
    if (submittingEdit.value) return; // Ngăn double click
    
    editFormRef.value.validate(async (error) => {
        if (!error) {
            try {
                submittingEdit.value = true;
                let imagePath = editForm.value.bookImage;
                
                if(fileListEdit.value.length > 0) {
                    imagePath = await uploadImgEdit();
                }

                const updatedBook = {
                    TENSACH: editForm.value.bookName,
                    MOTA: editForm.value.bookDescription,
                    DONGIA: editForm.value.bookPrice,
                    SOQUYEN: editForm.value.bookQuantity,
                    NAMXUATBAN: editForm.value.bookPublishedDate,
                    MANXB: editForm.value.bookPublisher,
                    TACGIA: editForm.value.bookAuthor,
                    HINHANH: imagePath,
                    THELOAI: editForm.value.bookCategory
                };

                const response = await updateBook(selectedBook.value.MASACH, updatedBook);
                message[response.status](response.message);

                if(response.status == 'success') {
                    editModalShow.value = false;
                    await getAllBooks();
                }
            } catch (error) {
                message.error('Cập nhật sách thất bại!');
                console.log(error);
            } finally {
                submittingEdit.value = false;
            }
        } else {
            message.error('Vui lòng điền đầy đủ thông tin!');
        }
    });
};
//<========== Liên quan đến form sửa sách

const formatCurrency = (value) => {
    return value.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
};

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
                            label="Sách bị ẩn"
                            class="relative w-full ring-2 ring-red-500 bg-gradient-to-r from-red-600 to-red-700 dark:from-red-600/50 dark:to-red-700/50 shadow-md text-white rounded-md p-4"
                        >
                            <NNumberAnimation :from="0" :to="totalHiddenBooks" :active="true"/>
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
                            <NListItem 
                                class="dark:bg-gray-600/20 h-full group bg-transparent shadow rounded-md p-2 relative"
                                :class="{ 'ring-2 ring-red-500 opacity-70': book.TINHTRANG === false }"
                            >
                                <!-- Badge trạng thái -->
                                <span 
                                    v-if="book.TINHTRANG === false" 
                                    class="absolute top-2 left-2 z-20"
                                >
                                    <NTag type="error" size="small">
                                        <i class="fa-solid fa-eye-slash mr-1"></i> Đã ẩn
                                    </NTag>
                                </span>
                                
                                <span class="absolute hidden group-hover:block top-0 right-2">
                                    <NSpace>
                                        <!-- Nút kích hoạt lại (chỉ hiện khi sách bị ẩn) -->
                                        <NPopconfirm
                                            v-if="book.TINHTRANG === false"
                                            @positive-click="activateBook(book.MASACH)"
                                            @negative-click="() => message.info('Đã hủy')"
                                            positive-text="Kích hoạt"
                                            negative-text="Hủy"
                                        >
                                            <template #trigger>
                                                <NIcon :class="{ 'opacity-50': activatingBook === book.MASACH }">
                                                    <i v-if="activatingBook === book.MASACH" class="fa-solid fa-spinner fa-spin text-green-500"></i>
                                                    <i v-else class="fa-solid fa-rotate-left text-green-500 hover:text-green-700 cursor-pointer"></i>
                                                </NIcon>
                                            </template>
                                            Bạn có chắc muốn kích hoạt lại sách này?
                                        </NPopconfirm>
                                        
                                        <!-- pop confirm -->
                                        <NPopconfirm
                                            @positive-click="deleteBook(book.MASACH)"
                                            @negative-click="() => message.info('Hủy xóa')"
                                            positive-text="Xoá"
                                            negative-text="Hủy"
                                            :disabled="deletingBook === book.MASACH"
                                        >
                                            <template #trigger>
                                            <NIcon :class="{ 'opacity-50': deletingBook === book.MASACH }">
                                                <i v-if="deletingBook === book.MASACH" class="fa-solid fa-spinner fa-spin text-red-500"></i>
                                                <i v-else class="fa-solid fa-trash text-red-500 hover:text-red-700 cursor-pointer"></i>
                                            </NIcon>
                                            </template>
                                            {{ book.TINHTRANG === false 
                                                ? 'Sách này đã bị ẩn. Xóa để xóa vĩnh viễn khỏi hệ thống?'
                                                : 'Hành động này sẽ ẩn sách. Nếu không còn ai mượn, xóa lần nữa sẽ xóa vĩnh viễn.' 
                                            }}
                                        </NPopconfirm>
                                        <!--  -->
                                        <NIcon @click="openEditModal(book)">
                                            <i class="fa-solid fa-pen-to-square text-blue-500 hover:text-blue-700 cursor-pointer"></i>
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
                                                    <NTag v-for="theLoai in book.THELOAI" :style="{background: theLoai.Color, color: '#fff'}" size="small">
                                                        {{ theLoai.TenLoai }}
                                                    </NTag>
                                                </NSpace>
                                                <NDivider/>
                                                <NTag type="warning">{{ formatCurrency(book.DONGIA) }} / quyển</NTag>
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

    <!-- Modal sửa sách với layout 2|1 -->
    <NModal 
        v-model:show="editModalShow" 
        title="Sửa thông tin sách" 
        preset="dialog"
        type="default"
        size="800"
        class="dark:bg-slate-700 min-w-[1000px]"
    >
        <NSpace vertical class="max-h-[70vh] overflow-y-auto">
            <NGrid cols="7" x-gap="12" y-gap="12" class="w-full">
                <!-- Form phần trái -->
                <NGi span="4">
                    <NSpace vertical class="dark:bg-slate-700/20 bg-slate-200/70 rounded-lg p-6">
                        <NForm ref="editFormRef" :model="editForm" :rules="rulesEdit" label-width="120px" class="w-full">
                            <NFormItem label="Tên sách" path="bookName" required>
                                <NInput v-model:value="editForm.bookName" placeholder="Nhập tên sách..." />
                            </NFormItem>
                            <NFormItem label="Mô tả" path="bookDescription" required>
                                <NInput v-model:value="editForm.bookDescription" placeholder="Nhập mô tả sách..." type="textarea" />
                            </NFormItem>
                            <NFormItem label="Tên tác giả" path="bookAuthor" required>
                                <NInput v-model:value="editForm.bookAuthor" placeholder="Nhập tên tác giả..." />
                            </NFormItem>
                            <NFormItem label="Nhà xuất bản" path="bookPublisher" required>
                                <NSelect
                                    v-model:value="editForm.bookPublisher"
                                    filterable
                                    placeholder="Chọn nhà xuất bản"
                                    :options="publishersOptions"
                                />
                            </NFormItem>
                            <NFormItem label="Năm xuất bản" path="bookPublishedDate" required>
                                <NDatePicker v-model:value="editForm.bookPublishedDate" type="year" clearable placeholder="Chọn năm xuất bản" class="w-full"/>
                            </NFormItem>
                            <NFormItem label="Thể loại" path="bookCategory" required>
                                <NSelect
                                    v-model:value="editForm.bookCategory"
                                    multiple
                                    filterable
                                    placeholder="Chọn thể loại"
                                    :options="categoriesOptions"
                                    :render-label="renderIconCategory"
                                />
                            </NFormItem>
                            <NFormItem label="Số lượng" path="bookQuantity" required>
                                <NInputNumber class="w-full" v-model:value="editForm.bookQuantity" :validator="numberValidatorEdit" placeholder="Nhập số lượng sách..." />
                            </NFormItem>
                            <NFormItem label="Đơn giá" path="bookPrice" required>
                                <NInputNumber class="w-full" v-model:value="editForm.bookPrice" :validator="numberValidatorEdit" placeholder="Nhập đơn giá..." />
                            </NFormItem>
                            <NFormItem label="Hình ảnh" path="bookImage">
                                <NUpload
                                    name="icon"
                                    v-model:file-list="fileListEdit"
                                    @remove="handleRemoveEdit"
                                    @before-upload="beforeUploadEdit"
                                    @update:file-list="createPreviewImageUrlEdit"
                                    :max="1"
                                >
                                    <NUploadDragger>
                                        <div style="margin-bottom: 12px">
                                            <NIcon class="text-3xl" :depth="3">
                                                <i class="fa-solid fa-cloud-arrow-up"></i>
                                            </NIcon>
                                        </div>
                                        <NText style="font-size: 16px">
                                            Kéo thả file vào đây hoặc nhấp để thay đổi ảnh
                                        </NText>
                                        <NText depth="3" style="margin: 8px 0 0 0">
                                            (Chỉ hỗ trợ file .svg .png .jpg, tối đa 1 file)
                                        </NText>
                                    </NUploadDragger>
                                </NUpload>
                            </NFormItem>
                        </NForm>
                    </NSpace>
                </NGi>

                <!-- Preview phần phải -->
                <NGi span="3">
                    <NSpace vertical class="dark:bg-slate-700/20 bg-slate-600/90 shadow rounded-lg p-6">
                        <h3 class="text-lg font-semibold">Xem trước</h3>
                        <NGrid :cols="3" x-gap="12" y-gap="12">
                            <NGi span="1" :style="{ backgroundImage: `url('${previewImageUrlEdit}')` }" class="bg-no-repeat bg-center bg-contain"></NGi>
                            <NGi span="2">
                                <NThing>
                                    <template #description>
                                        <h1 class="text-lg font-semibold dark:text-gray-300 text-white">{{ editForm.bookName || 'Tên sách' }}</h1>
                                        <NSpace class="text-sm">
                                            <NEllipsis :line-clamp="1">
                                                <span class="text-gray-300 text-xs">Tác giả: {{ editForm.bookAuthor || 'chưa điền'}}</span>
                                                <NDivider vertical />
                                                <span class="text-gray-300 text-xs">NXB: {{ selectedPublisherEdit }}</span>
                                            </NEllipsis>
                                        </NSpace>
                                        <NEllipsis class="text-white" expand-trigger="click" :line-clamp="2">
                                            {{ editForm.bookDescription || 'Mô tả đầu sách' }}
                                        </NEllipsis>
                                        <NDivider/>
                                        <NSpace wrap size="small">
                                            <NTag v-for="category in previewCategoriesEdit" :style="{background: category.Color, color: '#fff'}" size="small">
                                                {{ category.TenLoai }}
                                            </NTag>
                                        </NSpace>
                                    </template>
                                </NThing>
                            </NGi>
                        </NGrid>
                        <h3 class="text-lg font-semibold mt-4">Thông tin sách</h3>
                        <NSpace vertical class="text-sm text-gray-300">
                            <div>Số lượng: <strong>{{ editForm.bookQuantity }}</strong> quyển</div>
                            <div>Đơn giá: <strong>{{ editForm.bookPrice.toLocaleString('vi-VN') }}</strong> đ</div>
                            <div>Năm xuất bản: <strong>{{ new Date(editForm.bookPublishedDate).getFullYear() }}</strong></div>
                        </NSpace>
                    </NSpace>
                </NGi>
            </NGrid>
        </NSpace>

        <template #action>
            <NButton @click="editModalShow = false" :disabled="submittingEdit">Hủy</NButton>
            <NButton @click="submitEditForm" type="primary" :loading="submittingEdit" :disabled="submittingEdit">Lưu thay đổi</NButton>
        </template>
    </NModal>
</template>

<style scoped>

</style>