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
    NColorPicker,
    NList,
    NListItem,
    NThing,
    NEllipsis,
    NTag,
    NUpload,
    NUploadDragger,
    NText,
    NIcon,
    NP,
    NScrollbar,
    useMessage,
}                           from    'naive-ui';

import axios                from    'axios';

import {
    ref,
    onMounted
}                           from    'vue';

//=================== VARIABLES ===================//
const BASE_API              = import.meta.env.VITE_BASE_API;
const DEFAULT_IMAGE         = '/imgs/book.svg';

const message               =       useMessage();
//ảnh xem trước
const previewUrl            =       ref('/imgs/book.svg');
//danh sách file
const fileList              =       ref([]);
//form
const formRef               =       ref(null);
//dữ liệu form
const modelForm             =       ref({
    categoryName: '',
    categoryDescription: '',
    categoryColor: '#4E3603',
    categoryImage: ''
});

//all categories
const categories            =       ref([]);

//=================== VALIDATE & RULES ===================//
const imageHandleValidate   =       () => {
    if(!previewUrl.value) {
        return new Error('Vui lòng tải lên hình ảnh cho danh mục');
    }
    return true;
}
const colorHandleValidate   =       () => {
    if(!modelForm.value.categoryColor) {
        return new Error('Vui lòng chọn màu sắc cho danh mục');
    }
    return true;
}

const formRules             =       {
    categoryName: [
        {
            required: true,
            message: 'Vui lòng nhập tên danh mục',
            trigger: ['blur', 'input']
        },
        {
            min: 3,
            max: 50,
            message: 'Tên danh mục phải từ 3 đến 50 ký tự',
            trigger: ['blur', 'input']
        }
    ],
    categoryDescription: [
        {
            required: true,
            message: 'Vui lòng nhập mô tả danh mục',
            trigger: ['blur', 'input']
        },
        {
            min: 10,
            max: 200,
            message: 'Mô tả danh mục phải từ 10 đến 200 ký tự',
            trigger: ['blur', 'input']
        }
    ],
    categoryColor: [
        {
            required: true,
            validator: colorHandleValidate,
            trigger: ['blur', 'input']
        }
    ],
    categoryImage: [
        {
            required: true,
            validator: imageHandleValidate,
            trigger: ['blur', 'input']
        }
    ]
}

//=================== FUNCTIONS ===================//

//khi component được mount
onMounted(async () => {
    //lấy danh sách danh mục hiện có
    await loadCategories();
});

const loadCategories       =       async () => {
    const response          =       await axios.get(`${BASE_API}/the-loai/all`);
    categories.value        =       response.data.data;
};

//xử lý hiển thị ảnh trước khi upload
const rawImageUrl           =       (file) => {
    fileList.value          =       file;
    const raw               =       file[0]?.file
    if (raw) {
        previewUrl.value    =       URL.createObjectURL(raw);
    } else {
        previewUrl.value    =       DEFAULT_IMAGE;
    }
}

//lấy đường dẫn file sau khi thất sự tải lên server
const uploadIcon            =       async () => {
    if(fileList.value.length === 0) {
        message.error('Vui lòng tải lên hình ảnh cho danh mục');
        return;
    } else {
        const icon          =       fileList.value[0]?.file;
        const formData      =       new FormData();
        formData.append('icon', icon);
        const response      =       await axios.post(`${BASE_API}/the-loai/upload-icon`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data.filePath;
    }
}

//xóa file đã chọn
const handleRemove          =       () => {
  modelForm.value.categoryImage = '';
  previewUrl.value          =       '/imgs/book.svg';
};



//kiểm tra file SVG
async function beforeUpload(data) {
  if (data.file.file?.type !== "image/svg+xml") {
    message.error("Thumnail cho danh mục chỉ có thể là ảnh SVG.");
    return false;
  }
  return true;
}

//check form trước khi gửi server
function submitForm() {
    formRef.value?.validate(async (error) => {
        if (!error) {
            //lấy đường dẫn icon và gán vào modelForm
            const icon      =       await uploadIcon();
            modelForm.value.categoryImage = icon;
            //tạo một danh mục để gửi
            const postData  =       {
                TenLoai: modelForm.value.categoryName,
                MoTa: modelForm.value.categoryDescription,
                Color: modelForm.value.categoryColor,
                Icon: modelForm.value.categoryImage
            }
            //gửi dữ liệu đi
            const response  =       await axios.post(`${BASE_API}/the-loai/create`, postData);
            message[response.data.status](response.data.message);

            //kiểm tra thành công
            if(response.data.status === 'success') {
                //tải lại danh sách danh mục
                await loadCategories();
                //reset form
                modelForm.value = {
                    categoryName: '',
                    categoryDescription: '',
                    categoryColor: '#4E3603',
                    categoryImage: ''
                };
                fileList.value = [];
                previewUrl.value = '/imgs/book.svg';
            }
        } else {
            message.error('Vui lòng kiểm tra lại thông tin!');
            return false;
        }
    });
}
</script>


<template>
    <NSpace vertical class="p-4">
        <NGrid cols="8" x-gap="12" y-gap="12" class="w-full">
            <NGi span="4">
                <NSpace vertical class="dark:bg-slate-600/30 h-full bg-white shadow-md rounded-md p-8 px-18 w-full">
                    <NSpace vertical class="p-6 dark:bg-slate-600/20 bg-slate-200/50 rounded-lg">
                        <h1 class="text-2xl font-semibold uppercase">Thêm danh mục</h1>
                        <NDivider />
                        <NForm ref="formRef" :model="modelForm" :rules="formRules" label-width="120px" class="w-full">
                            <NFormItem label="Tên danh mục" path="categoryName" required>
                                <NInput v-model:value="modelForm.categoryName" placeholder="Nhập tên danh mục..." />
                            </NFormItem>
                            <NFormItem label="Mô tả" path="categoryDescription" required>
                                <NInput v-model:value="modelForm.categoryDescription" placeholder="Nhập mô tả danh mục..." />
                            </NFormItem>
                            <NFormItem label="Màu sắc" path="categoryColor" required>
                                <NColorPicker v-model:value="modelForm.categoryColor" :show-alpha="false"></NColorPicker>
                            </NFormItem>
                            <NFormItem label="Hình ảnh" path="categoryImage" required>
                                <n-upload
                                    name="icon"
                                    v-model:file-list="fileList"
                                    @remove="handleRemove"
                                    @before-upload="beforeUpload"
                                    @update:file-list="rawImageUrl"
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
                                    <n-p depth="3" style="margin: 8px 0 0 0">
                                        (Chỉ hỗ trợ file .svg, tối đa 1 file)
                                    </n-p>
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
            <NGi span="4">
                <NSpace vertical class="dark:bg-slate-600/30 h-full bg-white shadow-md rounded-md p-8 w-full">
                    <h1 class="text-2xl font-semibold uppercase">Xem trước</h1>
                    <NDivider />
                    <NSpace vertical class="p-6 dark:bg-slate-600/20 bg-slate-600/90 rounded-lg">
                        <NGrid :cols="3" x-gap="12" y-gap="12">
                            <NGi span="1" :style="{ backgroundImage: `url('${previewUrl}')` }" class="bg-no-repeat bg-center bg-contain"></NGi>
                            <NGi span="2">
                                <NThing :style="{ color: '#fff' }">
                                    <template #description>
                                        <h3 class="text-lg font-semibold dark:text-gray-300">{{ modelForm.categoryName || 'Tên danh mục' }}</h3>
                                        <NEllipsis expand-trigger="click" :line-clamp="1">
                                            {{ modelForm.categoryDescription || 'Mô tả danh mục' }}
                                        </NEllipsis>
                                        <NDivider/>
                                        <NTag :style="{background: modelForm.categoryColor, color: '#fff'}" size="small">0 books</NTag>
                                    </template>
                                </NThing>
                            </NGi>
                        </NGrid>
                    </NSpace>

                    <h1 class="text-2xl my-2 font-semibold uppercase">Danh mục hiện tại</h1>
                    <NList clickable hoverable show-divider="true">
                        <NScrollbar style="max-height: 400px;">
                            <NGrid cols="2" x-gap="12" y-gap="12" class=" p-2">
                                <NGi v-for="(category, index) in categories" :key="index" :span="categories.length == 1 ? 2 : 1">
                                    <NListItem class="dark:bg-gray-600/20 bg-transparent shadow rounded-md p-2">
                                        <NGrid :cols="3" x-gap="12" y-gap="12">
                                            <NGi span="1" :style="{backgroundImage: `url('${BASE_API}/${category.Icon}')`}" class="bg-no-repeat bg-center bg-contain"></NGi>
                                            <NGi span="2">
                                                <NThing :title="category.TenLoai">
                                                    <template #description>
                                                        <NEllipsis expand-trigger="click" :line-clamp="2">
                                                            {{ category.MoTa }}
                                                        </NEllipsis>
                                                        <NDivider/>
                                                        <NTag :style="{background: category.Color, color: '#fff'}" size="small">12 books</NTag>
                                                    </template>
                                                </NThing>
                                            </NGi>
                                        </NGrid>
                                    </NListItem>
                                </NGi>
                            </NGrid>
                        </NScrollbar>
                    </NList>
                </NSpace>
            </NGi>
        </NGrid>
    </NSpace>
</template>

<style scoped>

</style>