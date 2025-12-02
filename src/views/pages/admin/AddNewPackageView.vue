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
    NList,
    NListItem,
    NThing,
    NEllipsis,
    NTag,
    NInputNumber,
    NIcon,
    NScrollbar,
    useMessage,
    NDynamicInput,
    NCard,
    NUpload,
    NUploadDragger,
    NText,
    NP
}                           from    'naive-ui';

import {
    ref,
    onMounted,
    computed
}                           from    'vue';

import axios from 'axios';
import { createPackage, getAllPackages } from '../../../services/apiPackage.js';
import BookMarkControll from '../../../components/BookMarkControll.vue';

//=================== VARIABLES ===================//
const BASE_API              = import.meta.env.VITE_BASE_API;
const DEFAULT_BADGE         = '/public/imgs/badges/white-book-mark.svg';

const message               = useMessage();
const formRef               = ref(null);
const fileList              = ref([]);
const previewBadgeUrl       = ref(`${BASE_API}${DEFAULT_BADGE}`);

//dữ liệu form
const modelForm             = ref({
    packageName: '',
    maxBooks: 1,
    borrowDuration: 7,
    price: 0,
    benefits: [],
    packageDuration: 30,
    badge: ''
});

//all packages
const packages              = ref([]);

//submit loading
const submittingForm        = ref(false);

//=================== VALIDATE & RULES ===================//
const numberValidator = (value) => {
    return value > 0;
};

const benefitsValidator = () => {
    if (!modelForm.value.benefits || modelForm.value.benefits.length === 0) {
        return new Error('Vui lòng thêm ít nhất một quyền lợi');
    }
    return true;
};

const formRules             = {
    packageName: [
        {
            required: true,
            message: 'Vui lòng nhập tên gói',
            trigger: ['blur', 'input']
        },
        {
            min: 3,
            max: 50,
            message: 'Tên gói phải từ 3 đến 50 ký tự',
            trigger: ['blur', 'input']
        }
    ],
    maxBooks: [
        {
            required: true,
            type: 'number',
            message: 'Vui lòng nhập số sách tối đa',
            trigger: ['blur', 'input']
        }
    ],
    borrowDuration: [
        {
            required: true,
            type: 'number',
            message: 'Vui lòng nhập thời hạn mượn',
            trigger: ['blur', 'input']
        }
    ],
    price: [
        {
            required: true,
            type: 'number',
            message: 'Vui lòng nhập giá gói',
            trigger: ['blur', 'input']
        }
    ],
    benefits: [
        {
            validator: benefitsValidator,
            trigger: ['blur', 'change']
        }
    ],
    packageDuration: [
        {
            required: true,
            type: 'number',
            message: 'Vui lòng nhập thời hạn gói',
            trigger: ['blur', 'input']
        }
    ]
};

//=================== FUNCTIONS ===================//

//khi component được mount
onMounted(async () => {
    await loadPackages();
});

const loadPackages = async () => {
    try {
        const response = await getAllPackages();
        packages.value = response.data;
    } catch (error) {
        message.error('Lỗi khi tải danh sách gói');
    }
};

//xử lý hiển thị ảnh huy hiệu trước khi upload
const rawBadgeUrl = (file) => {
    fileList.value = file;
    const raw = file[0]?.file;
    if (raw) {
        previewBadgeUrl.value = URL.createObjectURL(raw);
    } else {
        previewBadgeUrl.value = `${BASE_API}${DEFAULT_BADGE}`;
    }
};

//xóa file đã chọn
const handleRemove = () => {
    modelForm.value.badge = '';
    previewBadgeUrl.value = `${BASE_API}${DEFAULT_BADGE}`;
    return true;
};

//kiểm tra file SVG/PNG/JPG
async function beforeUpload(data) {
    const types = ['image/svg+xml', 'image/png', 'image/jpeg'];
    if (!types.includes(data.file.file?.type)) {
        message.error("Huy hiệu chỉ có thể là ảnh SVG, PNG hoặc JPG.");
        return false;
    }
    return true;
}

//upload huy hiệu
const uploadBadge = async () => {
    if (fileList.value.length === 0) {
        return DEFAULT_BADGE;
    }
    
    const formData = new FormData();
    formData.append('badge', fileList.value[0].file);
    
    try {
        const response = await axios.post(`${BASE_API}/package/upload-badge`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        
        if (response.data.status === 'success') {
            return response.data.badgePath;
        } else {
            message.error('Tải huy hiệu thất bại!');
            return DEFAULT_BADGE;
        }
    } catch (error) {
        message.error('Lỗi khi tải huy hiệu!');
        return DEFAULT_BADGE;
    }
};

//check form trước khi gửi server
function submitForm() {
    if (submittingForm.value) return; // Ngăn double click
    
    formRef.value?.validate(async (error) => {
        if (!error) {
            try {
                submittingForm.value = true;
                const badge = await uploadBadge();
                
                const postData = {
                    TenGoi: modelForm.value.packageName,
                    SoSachToiDa: modelForm.value.maxBooks,
                    ThoiHanMuon: modelForm.value.borrowDuration,
                    Gia: modelForm.value.price,
                    QuyenLoi: modelForm.value.benefits.filter(b => b && b.trim() !== ''),
                    ThoiHanGoi: modelForm.value.packageDuration,
                    HuyHieu: badge
                };

                const response = await createPackage(postData);
                message.success(response.message || 'Tạo gói thành công');

                // Tải lại danh sách gói
                await loadPackages();
                
                // Reset form
                modelForm.value = {
                    packageName: '',
                    maxBooks: 1,
                    borrowDuration: 7,
                    price: 0,
                    benefits: [],
                    packageDuration: 30,
                    badge: ''
                };
                fileList.value = [];
                previewBadgeUrl.value = `${BASE_API}${DEFAULT_BADGE}`;
            } catch (error) {
                message.error(error.response?.data?.message || 'Lỗi khi tạo gói');
            } finally {
                submittingForm.value = false;
            }
        } else {
            message.error('Vui lòng kiểm tra lại thông tin!');
            return false;
        }
    });
}

// Computed cho preview
const previewDuration = computed(() => {
    if (modelForm.value.packageDuration >= 365) {
        return `${Math.floor(modelForm.value.packageDuration / 365)} năm`;
    } else if (modelForm.value.packageDuration >= 30) {
        return `${Math.floor(modelForm.value.packageDuration / 30)} tháng`;
    } else {
        return `${modelForm.value.packageDuration} ngày`;
    }
});

const previewBorrowDuration = computed(() => {
    return `${modelForm.value.borrowDuration} ngày`;
});
</script>


<template>
    <NSpace vertical class="p-4">
        <NGrid cols="8" x-gap="12" y-gap="12" class="w-full">
            <NGi span="4">
                <NSpace vertical class="dark:bg-slate-600/30 h-full bg-white shadow-md rounded-md p-8 px-18 w-full">
                    <NSpace vertical class="p-6 dark:bg-slate-600/20 bg-slate-200/50 rounded-lg">
                        <h1 class="text-2xl font-semibold uppercase">Thêm gói thành viên</h1>
                        <NDivider />
                        <NForm ref="formRef" :model="modelForm" :rules="formRules" label-width="140px" class="w-full">
                            <NFormItem label="Tên gói" path="packageName" required>
                                <NInput v-model:value="modelForm.packageName" placeholder="VD: Gói Vàng, Gói Premium..." />
                            </NFormItem>
                            
                            <NFormItem label="Số sách tối đa" path="maxBooks" required>
                                <NInputNumber 
                                    v-model:value="modelForm.maxBooks" 
                                    :validator="numberValidator"
                                    :min="1"
                                    class="w-full"
                                    placeholder="Số sách có thể mượn cùng lúc..." 
                                />
                            </NFormItem>
                            
                            <NFormItem label="Thời hạn mượn" path="borrowDuration" required>
                                <NInputNumber 
                                    v-model:value="modelForm.borrowDuration" 
                                    :validator="numberValidator"
                                    :min="1"
                                    class="w-full"
                                    placeholder="Số ngày được mượn sách..." 
                                >
                                    <template #suffix>
                                        ngày
                                    </template>
                                </NInputNumber>
                            </NFormItem>
                            
                            <NFormItem label="Giá gói" path="price" required>
                                <NInputNumber 
                                    v-model:value="modelForm.price" 
                                    :validator="numberValidator"
                                    :min="0"
                                    class="w-full"
                                    placeholder="Giá của gói..." 
                                >
                                    <template #suffix>
                                        VNĐ
                                    </template>
                                </NInputNumber>
                            </NFormItem>
                            
                            <NFormItem label="Thời hạn gói" path="packageDuration" required>
                                <NInputNumber 
                                    v-model:value="modelForm.packageDuration" 
                                    :validator="numberValidator"
                                    :min="1"
                                    class="w-full"
                                    placeholder="Thời gian hiệu lực của gói..." 
                                >
                                    <template #suffix>
                                        ngày
                                    </template>
                                </NInputNumber>
                            </NFormItem>
                            
                            <NFormItem label="Quyền lợi" path="benefits" required>
                                <NDynamicInput
                                    v-model:value="modelForm.benefits"
                                    placeholder="Nhập quyền lợi..."
                                    :min="1"
                                >
                                    <template #create-button-default>
                                        Thêm quyền lợi
                                    </template>
                                </NDynamicInput>
                            </NFormItem>
                            
                            <NFormItem label="Huy hiệu" path="badge">
                                <NUpload
                                    name="badge"
                                    v-model:file-list="fileList"
                                    @remove="handleRemove"
                                    @before-upload="beforeUpload"
                                    @update:file-list="rawBadgeUrl"
                                    :max="1"
                                >
                                    <NUploadDragger>
                                        <div style="margin-bottom: 12px">
                                            <NIcon class="text-3xl" :depth="3">
                                                <i class="fa-solid fa-cloud-arrow-up"></i>
                                            </NIcon>
                                        </div>
                                        <NText style="font-size: 16px">
                                            Kéo thả file vào đây hoặc nhấp để tải lên
                                        </NText>
                                        <NP depth="3" style="margin: 8px 0 0 0">
                                            (Chỉ hỗ trợ file .svg, .png, .jpg, tối đa 1 file)
                                        </NP>
                                    </NUploadDragger>
                                </NUpload>
                            </NFormItem>
                            
                            <NFormItem>
                                <NButton @click="submitForm" type="primary" size="large" class="w-full" :loading="submittingForm" :disabled="submittingForm">
                                    <i class="fa-solid fa-plus mr-2"></i>
                                    Tạo gói thành viên
                                </NButton>
                            </NFormItem>
                        </NForm>
                    </NSpace>
                </NSpace>
            </NGi>
            
            <NGi span="4">
                <NSpace vertical class="dark:bg-slate-600/30 h-full bg-white shadow-md rounded-md p-8 w-full">
                    <h1 class="text-2xl font-semibold uppercase">Xem trước</h1>
                    <NDivider />
                    
                    <NCard class="relative dark:bg-slate-600/20">
                        <template #default>
                            <h3 class="text-2xl uppercase">Gói {{ modelForm.packageName || 'chưa điền tên' }}</h3>
                            <NDivider />
                            <NThing title="Thông tin gói">
                                <template #description>
                                    <NSpace vertical class="my-2">
                                        <div class="flex items-center gap-2">
                                            <i class="fa-solid fa-book text-blue-500"></i>
                                            <span>Mượn tối đa: <strong>{{ modelForm.maxBooks }}</strong> quyển sách</span>
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <i class="fa-solid fa-clock text-green-500"></i>
                                            <span>Thời hạn mượn: <strong>{{ previewBorrowDuration }}</strong></span>
                                        </div>
                                    </NSpace>
                                </template>
                                <template #footer>
                                    <h3 class="text-lg font-semibold mb-2">Quyền lợi:</h3>
                                    <template v-if="modelForm.benefits && modelForm.benefits.length > 0">
                                        <div v-for="(benefit, index) in modelForm.benefits.filter(b => b && b.trim() !== '')" :key="index" class="flex items-center gap-2 my-1">
                                            <i class="fa-solid fa-check text-green-500"></i>
                                            <span>{{ benefit }}</span>
                                        </div>
                                    </template>
                                    <div v-else class="text-gray-500 text-sm italic">
                                        Chưa có quyền lợi nào
                                    </div>
                                    <NDivider />
                                    <NSpace class="my-2">
                                        <NTag type="warning">
                                            {{ modelForm.price > 0 ? modelForm.price.toLocaleString('vi-VN') + ' đ' : 'Miễn phí' }}
                                        </NTag>
                                        <NTag type="info">
                                            {{ previewDuration }}
                                        </NTag>
                                    </NSpace>
                                </template>
                            </NThing>
                            <BookMarkControll 
                                :url="previewBadgeUrl" 
                                :position="{ top: '10px', right: '10px' }" 
                                :children="{ width: '60px', height: '60px' }"
                            />
                        </template>
                    </NCard>

                    <h1 class="text-2xl my-4 font-semibold uppercase">Gói hiện có</h1>
                    <NScrollbar style="max-height: 400px;">
                        <NSpace vertical>
                            <NCard 
                                v-for="(pkg, index) in packages" 
                                :key="index"
                                class="relative dark:bg-slate-600/20 cursor-pointer hover:shadow-lg transition-shadow"
                            >
                                <template #default>
                                    <h3 class="text-xl font-semibold">{{ pkg.TenGoi }}</h3>
                                    <NDivider />
                                    <NSpace class="my-2">
                                        <NTag type="warning">
                                            {{ pkg.Gia > 0 ? pkg.Gia.toLocaleString('vi-VN') + ' đ' : 'Miễn phí' }}
                                        </NTag>
                                        <NTag type="info">
                                            {{ pkg.ThoiHanGoi > 0 ? pkg.ThoiHanGoi + ' ngày' : 'Vĩnh viễn' }}
                                        </NTag>
                                    </NSpace>
                                    <div class="text-sm text-gray-600 dark:text-gray-400">
                                        {{ pkg.SoSachToiDa }} sách • {{ pkg.ThoiHanMuon }} ngày mượn
                                    </div>
                                    <BookMarkControll :img="pkg.HuyHieu" />
                                </template>
                            </NCard>
                            
                            <div v-if="packages.length === 0" class="text-center text-gray-500 py-8">
                                Chưa có gói nào
                            </div>
                        </NSpace>
                    </NScrollbar>
                </NSpace>
            </NGi>
        </NGrid>
    </NSpace>
</template>


<style scoped>

</style>