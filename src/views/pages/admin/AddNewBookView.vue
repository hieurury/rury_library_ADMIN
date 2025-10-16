<script setup>
import {
    NSpace,
    NButton,
    NForm,
    NInput,
    NFormItem,
    NGrid,
    NGi,
    NDivider,
    NImage,
    NList,
    NListItem,
    NThing,
    NEllipsis,
    NTag,
    NUpload,
    NUploadDragger,
    NText,
    NIcon,
    useMessage,
    NSelect,
    NDatePicker,
    NInputNumber,
    NNumberAnimation,
    NGradientText,
    NProgress,
    NStatistic
}                           from    'naive-ui';

import axios                from    'axios';

import {
    ref,
    onMounted,
    h,
    watch,
    computed
}                           from    'vue';  

import {
    RouterLink
}                           from    'vue-router';

//=================== VARIABLES ===================//
const BASE_API              = import.meta.env.VITE_BASE_API;
const message               =       useMessage();
//ảnh xem trước


onMounted(async () => {
    document.title           =       'Thêm sách mới | RuryLib Admin';
    await getAllBooks();
    await getPublishers();
    await getCategories();
});



//==========> Form
//danh sách file
//form
const formRef               =       ref(null);
//dữ liệu form
const modelForm             =       ref({
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
//<========== Form

//==========> Liên quan đến sách
const allBooks               =       ref([]);
const totalBookTemplate      =       computed(() => allBooks.value.reduce((total, book) => total + book.SOQUYEN, 0));
const totalBooks             =       computed(() => allBooks.value.length);

const getAllBooks            =       async () => {
    const response           =       await axios.get(`${BASE_API}/sach/all`);
    allBooks.value           =       response.data.data;
};

const percentageComputer = (value, total) => {
    const percent = (value / total) * 100
    return percent.toFixed(2);
}
//<========== Liên quan đến sách

//==========> Liên quan đến NXB

//---- Biến lưu trữ ----//
const allPublishers         =       ref([]);
const PublisherOptions      =       ref([]);
const selectedPublisher     =       computed(() => {
    return allPublishers.value.find(publisher => publisher.MANXB === modelForm.value.bookPublisher)?.TENNXB || 'Chưa chọn NXB';
});

const getPublishers        =       async () => {
    const response          =       await axios.get(`${BASE_API}/nha-xuat-ban/all`);
    allPublishers.value     =       response.data.data;
    PublisherOptions.value  =       allPublishers.value.map(publisher => ({
        label: `${publisher.TENNXB} - ${publisher.MANXB}`,
        value: publisher.MANXB
    }));
};
//<========== Liên quan đến NXB


//==========> Liên quan đến thể loại
const allcategories          =       ref([]);
const CategoriesOptions      =       ref([]);

const previewCategories       =       computed(() => {
    return allcategories.value.filter(category => modelForm.value.bookCategory.includes(category.MaLoai));
})

const getCategories          =       async () => {
    const response           =       await axios.get(`${BASE_API}/the-loai/all`);
    allcategories.value      =       response.data.data;
    CategoriesOptions.value  =       allcategories.value.map(category => ({
        label: `${category.TenLoai}`,
        value: category.MaLoai,
        Icon: `${BASE_API}/${category.Icon}` 
    }));
};

const renderIconCategory = (option) => {
    return [
        h(NImage, {
            src: option.Icon,
            style: { width: '1.5em', height: 'auto', 'margin-right': '8px', 'border-radius': '4px' }
        }), option.label
    ]
};
//<========== Liên quan đến thể loại




//==========> Liên quan đển upload ảnh

//---- Biến lưu trữ ----//
const fileList              =       ref([]);
const previewImageUrl       =       ref('');

//upload lên server để lấy link
const uploadImg             =       async () => {
    if(fileList.value.length === 0) {
        message.error('Vui lòng chọn ảnh!');
        return;
    }
    const formData            =       new FormData();
    formData.append('image', fileList.value[0].file);
    const response            =       await axios.post(`${BASE_API}/sach/admin/upload-image`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    if(response.data.status == 'success') {
        return response.data.imagePath;
    } else {
        message.error('Tải ảnh thất bại!');
        return null;
    }
};

const createPreviewImageUrl     =       (file) => {
    fileList.value       =       file;
    const raw =      file[0]?.file;

    if(raw) {
        previewImageUrl.value   =       URL.createObjectURL(raw);
    } else {
        previewImageUrl.value   =       '';
    }
  
};

//cập nhật ảnh xem trước
const handleRemove          =       (file) => {
    previewImageUrl.value       =       '';
    return true;
};

const beforeUpload          =       (data) => {
    console.log(data.file);
    const types = ['image/jpeg', 'image/png', 'image/svg+xml'];
    const isJpgOrPng        =       types.includes(data.file.type);

    if (!isJpgOrPng) {
        message.error('Chỉ hỗ trợ file JPG/PNG/SVG!');
    }
    return isJpgOrPng;
};
//<========== Liên quan đến upload ảnh



//==========> Liên quan đến form rules

const bookCategoryValidator = () => {
    if(!modelForm.value.bookCategory || modelForm.value.bookCategory.length === 0) {
        return new Error('Vui lòng chọn ít nhất một thể loại');
    }
    return true;
}

const bookPublisherValidator = () => {
    if(!modelForm.value.bookPublisher) {
        return new Error('Vui lòng chọn nhà xuất bản');
    }
    return true;
}

const bookImageValidator    = () => {
    if(!fileList.value || fileList.value.length === 0) {
        return new Error('Vui lòng tải lên ảnh bìa sách');
    }
    return true;
}

const quantityValidator     = (value) => {
    if(modelForm.value.bookQuantity <= 0) {
        return new Error('Số lượng sách phải lớn hơn 0');
    }
    return true;
}

const numberValidator = (value) => {
    return value > 0;
}

const rules = {
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
        { validator: bookPublisherValidator, trigger: 'change' }
    ],
    bookCategory: [
        { validator: bookCategoryValidator, trigger: 'change' }
    ],
    bookImage: [
        { validator: bookImageValidator, trigger: 'change' }
    ],
    bookQuantity: [
        { validator: quantityValidator, trigger: 'blur' }
    ]
}
//<========== Liên quan đến form rules



//==========> Liên quan đến submit form
const submitForm            =       async () => {
    formRef.value.validate(async (error) => {
        if (!error) {
            const imagePath   =       await uploadImg();
            modelForm.value.bookImage    =       imagePath;

            const newBook    =       {
                TENSACH: modelForm.value.bookName,
                MOTA: modelForm.value.bookDescription,
                DONGIA: modelForm.value.bookPrice,
                SOQUYEN: modelForm.value.bookQuantity,
                NAMXUATBAN: modelForm.value.bookPublishedDate,
                MANXB: modelForm.value.bookPublisher,
                TACGIA: modelForm.value.bookAuthor,
                HINHANH: modelForm.value.bookImage,
                THELOAI: modelForm.value.bookCategory
            };

            const response    =       await axios.post(`${BASE_API}/sach/admin/create`, newBook);
            message[response.data.status](response.data.message);
            if(response.data.status == 'success') {
                //reset form
                modelForm.value  =       {
                    bookName: '',
                    bookDescription: '',
                    bookAuthor: '',
                    bookPublisher: null,
                    bookPublishedDate: Date.now(),
                    bookCategory: [],
                    bookQuantity: 1,
                    bookPrice: 1000,
                    bookImage: ''
                };
                fileList.value          =       [];
                previewImageUrl.value   =       '';
                formRef.value.resetFields();
            }
        } else {
            message.error('Vui lòng điền đầy đủ thông tin!');
        }
    });
};
//<========== Liên quan đến submit form

</script>


<template>
    <NSpace vertical class="p-4">
        <NGrid cols="7" x-gap="12" y-gap="12" class="w-full">
            <NGi span="4">
                <NSpace vertical class="dark:bg-slate-600/30 h-full bg-white shadow-md rounded-md p-8 px-32 w-full">
                    <NSpace vertical class="p-6 dark:bg-slate-700/20 bg-slate-200/70 rounded-lg">
                        <h1 class="text-2xl font-semibold uppercase">Thêm sách</h1>
                        <NDivider />
                        <NForm ref="formRef" :model="modelForm" :rules="rules" label-width="120px" class="w-full">
                            <NFormItem label="Tên sách" path="bookName" required>
                                <NInput v-model:value="modelForm.bookName" placeholder="Nhập tên sách..." />
                            </NFormItem>
                            <NFormItem label="Mô tả" path="bookDescription" required>
                                <NInput v-model:value="modelForm.bookDescription" placeholder="Nhập mô tả sách..." />
                            </NFormItem>
                            <NFormItem label="Tên tác giả" path="bookAuthor" required>
                                <NInput v-model:value="modelForm.bookAuthor" placeholder="Nhập tên tác giả..." />
                            </NFormItem>
                            <NFormItem label="Nhà xuất bản" path="bookPublisher" required>
                                <NSelect
                                v-model:value="modelForm.bookPublisher"
                                filterable
                                placeholder="Chọn nhà xuất bản"
                                :options="PublisherOptions"
                                >
                                    <template #action>
                                        <RouterLink to="/admin/nxb/add" class="text-blue-600 hover:underline">
                                            + Thêm nhà xuất bản mới
                                        </RouterLink>
                                    </template>
                                </NSelect>
                            </NFormItem>
                            <NFormItem label="Năm xuất bản" path="bookPublishedDate" required>
                                <NDatePicker v-model:value="modelForm.bookPublishedDate" type="year" clearable placeholder="Chọn ngày xuất bản" class="w-full"/>
                            </NFormItem>
                            <NFormItem label="Thể loại" path="bookCategory" required>
                                <n-select
                                v-model:value="modelForm.bookCategory"
                                multiple
                                filterable
                                placeholder="Please Select Songs"
                                :options="CategoriesOptions"
                                :render-label="renderIconCategory"
                                >
                                <template #action>
                                    <RouterLink to="/admin/categories/add" class="text-blue-600 hover:underline">
                                        + Thêm thể loại mới
                                    </RouterLink>
                                </template>
                                </n-select>
                            </NFormItem>
                            <NFormItem label="Số lượng" path="bookQuantity" required>
                                <NInputNumber class="w-full" v-model:value="modelForm.bookQuantity" :validator="numberValidator" placeholder="Nhập số lượng sách..." />
                            </NFormItem>
                            <NFormItem label="Đơn giá" path="bookPrice" required>
                                <NInputNumber class="w-full" v-model:value="modelForm.bookPrice" :validator="numberValidator" placeholder="Nhập đơn giá..." />
                            </NFormItem>
                            <NFormItem label="Hình ảnh" path="bookImage" required>
                                <n-upload
                                    name="icon"
                                    v-model:file-list="fileList"
                                    @remove="handleRemove"
                                    @before-upload="beforeUpload"
                                    @update:file-list="createPreviewImageUrl"
                                    :max="1"
                                >
                                    <n-upload-dragger>
                                    <div style="margin-bottom: 12px">
                                        <n-icon class="text-3xl" :depth="3">
                                            <i class="fa-solid fa-cloud-arrow-up"></i>
                                        </n-icon>
                                    </div>
                                    <n-text style="font-size: 16px">
                                        Kéo thả file vào đây hoặc nhấp để tải lên
                                    </n-text>
                                    <n-text depth="3" style="margin: 8px 0 0 0">
                                        (Chỉ hỗ trợ file .svg .png .jpg, tối đa 1 file)
                                    </n-text>
                                    </n-upload-dragger>
                                </n-upload>
                            </NFormItem>
                            <NFormItem>
                                <NButton @click="submitForm" type="primary">Tạo danh mục</NButton>
                            </NFormItem>
                        </NForm>
                    </NSpace>
                </NSpace>
            </NGi>

            <!-- preview -->
            <NGi span="3">
                <NSpace vertical class="dark:bg-slate-600/30 h-full bg-white shadow-md rounded-md p-8 w-full">
                    <h1 class="text-2xl font-semibold uppercase">Xem trước</h1>
                    <NDivider />
                    <NSpace vertical class="p-6 dark:bg-slate-600/20 bg-slate-600/90 shadow rounded-lg">
                        <NGrid :cols="3" x-gap="12" y-gap="12">
                            <NGi span="1" :style="{ backgroundImage: `url('${previewImageUrl}')` }" class="bg-no-repeat bg-center bg-contain"></NGi>
                            <NGi span="2">
                                <NThing>
                                    <template #description>
                                        <h1 class="text-lg font-semibold dark:text-gray-300 text-white">{{ modelForm.bookName || 'Tên sách' }}</h1>
                                        <NSpace class="text-sm">
                                            <NEllipsis :line-clamp="1">
                                                <span class="text-gray-300 text-xs">Tác giả: {{ modelForm.bookAuthor || 'chưa điền'}}</span>
                                                <NDivider vertical />
                                                <span class="text-gray-300 text-xs">NXB: {{ selectedPublisher }}</span>
                                            </NEllipsis>
                                        </NSpace>
                                        <NEllipsis class="text-white" expand-trigger="click" :line-clamp="2">
                                            {{ modelForm.bookDescription || 'Mô tả đầu sách' }}
                                        </NEllipsis>
                                        <NDivider/>
                                        <NSpace wrap size="small">
                                            <NTag v-for="category in previewCategories" :style="{background: category.Color, color: '#fff'}" size="small">
                                                {{ category.TenLoai }}
                                            </NTag>
                                        </NSpace>
                                    </template>
                                </NThing>
                            </NGi>
                        </NGrid>
                    </NSpace>
                    <h1 class="text-2xl my-2 font-semibold uppercase">Tổng quát số sách hiện tại</h1>
                    <NList clickable hoverable show-divider>
                        <NGrid cols="2">
                            <NGi span="2">
                                <NListItem>
                                    <NThing>
                                        <template #header>
                                            <span class="text-xl font-semibold">Số lượng sách</span>
                                        </template>
                                        <template #description>
                                            <span class="text-gray-700 dark:text-gray-300 italic text-lg">{{ totalBooks || 0 }} cuốn</span>
                                            <NDivider vertical />
                                            <span class="text-gray-700 dark:text-gray-300 italic text-lg">{{ totalBookTemplate || 0 }} đầu sách</span>
                                        </template>
                                    </NThing>
                                </NListItem>
                            </NGi>
                            <NGi span="1">
                                <NListItem class="h-full">
                                    <NStatistic label="Tỷ lệ sách">
                                        <NNumberAnimation :from="0" :to="totalBookTemplate || 0" />
                                        <NDivider vertical/>
                                        <span>900</span>
                                    </NStatistic>
                                </NListItem>
                            </NGi>
                            <NGi span="1">
                                <NListItem>
                                    <NSpace class="text-4xl" justify="center">
                                        <NProgress type="dashboard" gap-position="bottom" :percentage="percentageComputer(totalBookTemplate, 900)" />
                                    </NSpace>
                                </NListItem>
                            </NGi>

                            <!-- đầu sách -->
                             <NGi span="1">
                                <NListItem class="h-full">
                                    <NStatistic label="Tỷ lệ đầu sách">
                                        <NNumberAnimation :from="0" :to="totalBooks || 0" />
                                        <NDivider vertical/>
                                        <span>100</span>
                                    </NStatistic>
                                </NListItem>
                            </NGi>
                            <NGi span="1">
                                <NListItem>
                                    <NSpace class="text-4xl" justify="center">
                                        <NProgress color="orange" type="dashboard" gap-position="bottom" :percentage="percentageComputer(totalBooks, 100)" />
                                    </NSpace>
                                </NListItem>
                            </NGi>
                        </NGrid>
                    </NList>
                </NSpace>
            </NGi>
        </NGrid>
    </NSpace>
</template>

<style scoped>

</style>