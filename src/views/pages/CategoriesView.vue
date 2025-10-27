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
    NUpload,
    NUploadDragger,
    NText,
    NButton,
    NColorPicker
}                               from    'naive-ui';
import axios                    from    'axios';
import {
    onMounted,
    reactive,
    ref,
    watch,
    h,
    computed
}                               from    'vue';

//=========================== VRIABLES ===========================//
const BASE_API                  =       import.meta.env.VITE_BASE_API;
const loading                   =       ref(false);
const message                   =       useMessage();

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

//==========> Liên quan đến xóa danh mục
const deletingCategory = ref(null);

const deleteCategory = async (maLoai) => {
    if (deletingCategory.value) return; // Ngăn double click
    
    try {
        deletingCategory.value = maLoai;
        const response = await axios.delete(`${BASE_API}/the-loai/delete/${maLoai}`);
        message[response.data.status](response.data.message);
        await getCategories();
    } catch (error) {
        message.error(error.response?.data?.message || 'Xóa danh mục thất bại');
        console.log(error);
    } finally {
        deletingCategory.value = null;
    }
};
//<========== Liên quan đến xóa danh mục

//==========> Liên quan đến sửa danh mục
const editModalShow = ref(false);
const editFormRef = ref(null);
const selectedCategory = ref(null);
const fileListEdit = ref([]);
const previewIconUrlEdit = ref('');
const submittingEdit = ref(false);

const editForm = ref({
    categoryName: '',
    categoryDescription: '',
    categoryIcon: '',
    categoryColor: ''
});

const openEditModal = (category) => {
    selectedCategory.value = category;
    editForm.value = {
        categoryName: category.TenLoai,
        categoryDescription: category.MoTa,
        categoryIcon: category.Icon,
        categoryColor: category.Color
    };
    previewIconUrlEdit.value = `${BASE_API}${category.Icon}`;
    fileListEdit.value = [];
    editModalShow.value = true;
};

const createPreviewIconUrlEdit = (file) => {
    fileListEdit.value = file;
    const raw = file[0]?.file;
    if(raw) {
        previewIconUrlEdit.value = URL.createObjectURL(raw);
    }
};

const handleRemoveEdit = (file) => {
    previewIconUrlEdit.value = `${BASE_API}${selectedCategory.value.Icon}`;
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

const uploadIconEdit = async () => {
    if(fileListEdit.value.length === 0) {
        return selectedCategory.value.Icon;
    }
    const formData = new FormData();
    formData.append('icon', fileListEdit.value[0].file);
    const response = await axios.post(`${BASE_API}/the-loai/upload-icon`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    if(response.data.status == 'success') {
        return response.data.filePath;
    } else {
        message.error('Tải ảnh thất bại!');
        return selectedCategory.value.Icon;
    }
};

const rulesEdit = {
    categoryName: [
        { required: true, message: 'Vui lòng nhập tên danh mục', trigger: 'blur' },
        { min: 2, max: 50, message: 'Tên danh mục phải từ 2-50 ký tự', trigger: 'blur' }
    ],
    categoryDescription: [
        { required: true, message: 'Vui lòng nhập mô tả danh mục', trigger: 'blur' },
        { min: 10, max: 200, message: 'Mô tả danh mục phải từ 10-200 ký tự', trigger: 'blur' }
    ],
    categoryColor: [
        { required: true, message: 'Vui lòng chọn màu danh mục', trigger: 'change' }
    ]
};

const submitEditForm = async () => {
    if (submittingEdit.value) return; // Ngăn double click
    
    editFormRef.value.validate(async (error) => {
        if (!error) {
            try {
                submittingEdit.value = true;
                let iconPath = editForm.value.categoryIcon;
                
                if(fileListEdit.value.length > 0) {
                    iconPath = await uploadIconEdit();
                }

                const updatedCategory = {
                    TenLoai: editForm.value.categoryName,
                    MoTa: editForm.value.categoryDescription,
                    Icon: iconPath,
                    Color: editForm.value.categoryColor
                };

                const response = await axios.put(`${BASE_API}/the-loai/update/${selectedCategory.value.MaLoai}`, updatedCategory);
                message[response.data.status](response.data.message);

                if(response.data.status == 'success') {
                    editModalShow.value = false;
                    await getCategories();
                }
            } catch (error) {
                message.error(error.response?.data?.message || 'Cập nhật danh mục thất bại');
                console.log(error);
            } finally {
                submittingEdit.value = false;
            }
        } else {
            message.error('Vui lòng điền đầy đủ thông tin!');
        }
    });
};
//<========== Liên quan đến sửa danh mục

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
                        <NListItem class="dark:bg-gray-600/20 bg-transparent shadow rounded-md p-2 h-full group">
                            <span class="absolute hidden group-hover:block top-0 right-2">
                                <NSpace>
                                    <!-- pop confirm xóa -->
                                    <NPopconfirm
                                        @positive-click="deleteCategory(category.MaLoai)"
                                        @negative-click="() => message.info('Hủy xóa')"
                                        positive-text="Xoá"
                                        negative-text="Hủy"
                                        :disabled="deletingCategory === category.MaLoai"
                                    >
                                        <template #trigger>
                                        <NIcon :class="{ 'opacity-50': deletingCategory === category.MaLoai }">
                                            <i v-if="deletingCategory === category.MaLoai" class="fa-solid fa-spinner fa-spin text-red-500"></i>
                                            <i v-else class="fa-solid fa-trash text-red-500 hover:text-red-700 cursor-pointer"></i>
                                        </NIcon>
                                        </template>
                                        Hành động này sẽ xoá danh mục ra khỏi hệ thống, bạn có chắc?
                                    </NPopconfirm>
                                    <!-- nút sửa -->
                                    <NIcon @click="openEditModal(category)">
                                        <i class="fa-solid fa-pen-to-square text-blue-500 hover:text-blue-700 cursor-pointer"></i>
                                    </NIcon>
                                </NSpace>
                            </span>
                            <NGrid :cols="3" x-gap="12" y-gap="12">
                                <NGi span="1" :style="`background-image: url(${BASE_API}${category.Icon});`" class="bg-no-repeat bg-center bg-contain"></NGi>
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
                                <NImage style="width: 100px;" :src="`${BASE_API}public/imgs/default/not-found.svg`"></NImage>
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

    <!-- Modal sửa danh mục -->
    <NModal 
        v-model:show="editModalShow" 
        title="Sửa thông tin danh mục" 
        preset="dialog"
        type="default"
        size="800"
        class="dark:bg-slate-700 min-w-[800px]"
    >
        <NSpace vertical class="max-h-[70vh] overflow-y-auto">
            <NGrid cols="2" x-gap="12" y-gap="12" class="w-full">
                <!-- Form phần trái -->
                <NGi span="1">
                    <NSpace vertical class="dark:bg-slate-700/20 bg-slate-200/70 rounded-lg p-6">
                        <NForm ref="editFormRef" :model="editForm" :rules="rulesEdit" label-width="120px" class="w-full">
                            <NFormItem label="Tên danh mục" path="categoryName" required>
                                <NInput v-model:value="editForm.categoryName" placeholder="Nhập tên danh mục..." />
                            </NFormItem>
                            <NFormItem label="Mô tả" path="categoryDescription" required>
                                <NInput v-model:value="editForm.categoryDescription" placeholder="Nhập mô tả danh mục..." type="textarea" :rows="3" />
                            </NFormItem>
                            <NFormItem label="Màu sắc" path="categoryColor" required>
                                <NColorPicker v-model:value="editForm.categoryColor" :show-alpha="false" />
                            </NFormItem>
                            <NFormItem label="Icon" path="categoryIcon">
                                <NUpload
                                    name="icon"
                                    v-model:file-list="fileListEdit"
                                    @remove="handleRemoveEdit"
                                    @before-upload="beforeUploadEdit"
                                    @update:file-list="createPreviewIconUrlEdit"
                                    :max="1"
                                >
                                    <NUploadDragger>
                                        <div style="margin-bottom: 12px">
                                            <NIcon class="text-3xl" :depth="3">
                                                <i class="fa-solid fa-cloud-arrow-up"></i>
                                            </NIcon>
                                        </div>
                                        <NText style="font-size: 16px">
                                            Kéo thả file vào đây hoặc nhấp để thay đổi icon
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
                <NGi span="1">
                    <NSpace vertical class="dark:bg-slate-700/20 bg-slate-600/90 shadow rounded-lg p-6">
                        <h3 class="text-lg font-semibold">Xem trước</h3>
                        <NGrid :cols="3" x-gap="12" y-gap="12">
                            <NGi span="1" :style="{ backgroundImage: `url('${previewIconUrlEdit}')` }" class="bg-no-repeat bg-center bg-contain min-h-20"></NGi>
                            <NGi span="2">
                                <NThing>
                                    <template #description>
                                        <h1 class="text-lg font-semibold dark:text-gray-300 text-white">{{ editForm.categoryName || 'Tên danh mục' }}</h1>
                                        <NEllipsis class="text-white" expand-trigger="click" :line-clamp="3">
                                            {{ editForm.categoryDescription || 'Mô tả danh mục' }}
                                        </NEllipsis>
                                        <NDivider/>
                                        <NTag :style="{ backgroundColor: editForm.categoryColor }" size="small">Màu mẫu</NTag>
                                    </template>
                                </NThing>
                            </NGi>
                        </NGrid>
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