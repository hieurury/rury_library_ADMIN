<script setup>
import { 
    NForm, 
    NFormItem, 
    NInput, 
    NButton, 
    NSpace,
    NGrid,
    NGi,
    NDivider,
    NList,
    NListItem,
    NThing,
    NEllipsis,
    NScrollbar,
    useMessage,
}                           from    'naive-ui';
import LocationSelector     from '../../../components/LocationSelector.vue';
import { 
    ref, 
    watch,
    onMounted,
    computed
}                           from 'vue';
import axios                from 'axios';

// ============= VARIABLES =============//
const BASE_API = import.meta.env.VITE_BASE_API;
const message = useMessage();
const allNxb = ref([]);


//form 
const selectedLocation = ref({
    province: null,
    district: null,
    ward: null
});
const DiaChiCuThe = ref('');
const formRef = ref(null);
const submittingForm = ref(false);
const form = ref({
    TenNXB: '',
    DiaChi: '',
});

//=================== COMPUTED ===================//
const previewAddress = computed(() => {
    if (!selectedLocation.value.province) return 'Chưa chọn địa chỉ';
    
    const parts = [];
    if (DiaChiCuThe.value) parts.push(DiaChiCuThe.value);
    if (selectedLocation.value.ward?.label) parts.push(selectedLocation.value.ward.label);
    if (selectedLocation.value.district?.label) parts.push(selectedLocation.value.district.label);
    if (selectedLocation.value.province?.label) parts.push(selectedLocation.value.province.label);
    
    return parts.join(', ');
});

//=================== VALIDATE & RULES ===================//
const checkLocation = () => {
    if(!selectedLocation.value.province || !selectedLocation.value.district) {
        return new Error('Vui lòng chọn tỉnh/thành phố và quận/huyện');
    }
    return true;
}

const checkDiaChiCuThe = () => {
    if(!DiaChiCuThe.value || DiaChiCuThe.value.trim() === '') {
        return new Error('Vui lòng nhập địa chỉ cụ thể');
    }
    if(DiaChiCuThe.value.trim().length < 5) {
        return new Error('Địa chỉ cụ thể phải có ít nhất 5 ký tự');
    }
    return true;
}

const formRules = ref({
    TenNXB: [
        { 
            required: true, 
            message: 'Vui lòng nhập tên nhà xuất bản', 
            trigger: ['blur', 'input'] 
        },
        {
            min: 3,
            max: 100,
            message: 'Tên nhà xuất bản phải từ 3-100 ký tự',
            trigger: ['blur', 'input']
        }
    ],
    DiaChi: [
        { 
            validator: checkLocation, 
            trigger: ['blur', 'change'] 
        }
    ],
})

//=================== FUNCTIONS ===================//
const getAllNxb = async () => {
    try {
        const response = await axios.get(`${BASE_API}/nha-xuat-ban/all`);
        if(response.data.status === 'success') {
            allNxb.value = response.data.data;
        } else {
            message.error(response.data.message);
        }
    } catch (error) {
        message.error('Lỗi khi lấy danh sách nhà xuất bản');
    }
}

onMounted(async () => {
    document.title = 'Thêm nhà xuất bản | RuryLib Admin';
    await getAllNxb();
})

watch([selectedLocation, DiaChiCuThe], () => {
    const parts = [];
    if (DiaChiCuThe.value) parts.push(DiaChiCuThe.value);
    if (selectedLocation.value.ward?.label) parts.push(selectedLocation.value.ward.label);
    if (selectedLocation.value.district?.label) parts.push(selectedLocation.value.district.label);
    if (selectedLocation.value.province?.label) parts.push(selectedLocation.value.province.label);
    
    form.value.DiaChi = parts.join(', ');
});

//submit form
const submit = (e) => {
    e.preventDefault();
    if (submittingForm.value) return; // Ngăn double click
    
    formRef.value.validate( async (errors) => {
        if (!errors) {
            // Validate địa chỉ cụ thể
            const diaChiCheck = checkDiaChiCuThe();
            if (diaChiCheck instanceof Error) {
                message.error(diaChiCheck.message);
                return;
            }

            try {
                submittingForm.value = true;
                const response = await axios.post(`${BASE_API}/nha-xuat-ban/admin/create`, form.value);
                message[response.data.status](response.data.message);
                
                if(response.data.status === 'success') {
                    // Reset form
                    form.value.TenNXB = '';
                    selectedLocation.value = {
                        province: null,
                        district: null,
                        ward: null
                    };
                    DiaChiCuThe.value = '';
                    formRef.value.restoreValidation();
                    
                    // Lấy lại danh sách NXB
                    await getAllNxb();
                }
            } catch (error) {
                message.error(error.response?.data?.message || 'Lỗi khi thêm nhà xuất bản');
            } finally {
                submittingForm.value = false;
            }
        } else {
            message.error('Vui lòng kiểm tra lại thông tin!');
        }
    });
}
</script>


<template>
    <NSpace vertical class="p-4">
        <NGrid cols="8" x-gap="12" y-gap="12" class="w-full">
            <!-- Form Section -->
            <NGi span="4">
                <NSpace vertical class="dark:bg-slate-600/30 h-full bg-white shadow-md rounded-md p-8 px-18 w-full">
                    <NSpace vertical class="p-6 dark:bg-slate-600/20 bg-slate-200/50 rounded-lg">
                        <h1 class="text-2xl font-semibold uppercase">Thêm nhà xuất bản</h1>
                        <NDivider />
                        <NForm ref="formRef" :model="form" :rules="formRules" label-width="140px" class="w-full">
                            <NFormItem label="Tên nhà xuất bản" path="TenNXB" required>
                                <NInput v-model:value="form.TenNXB" placeholder="Nhập tên nhà xuất bản..." />
                            </NFormItem>
                            <NFormItem label="Địa chỉ" path="DiaChi" required>
                                <LocationSelector v-model:selectedLocation="selectedLocation" />
                            </NFormItem>
                            <NFormItem label="Địa chỉ cụ thể" required>
                                <NInput v-model:value="DiaChiCuThe" placeholder="Số nhà, tên đường..." />
                            </NFormItem>
                            <NFormItem>
                                <NButton @click="submit" type="primary" :loading="submittingForm" :disabled="submittingForm">Thêm nhà xuất bản</NButton>
                            </NFormItem>
                        </NForm>
                    </NSpace>
                </NSpace>
            </NGi>

            <!-- Preview & List Section -->
            <NGi span="4">
                <NSpace vertical class="dark:bg-slate-600/30 h-full bg-white shadow-md rounded-md p-8 w-full">
                    <h1 class="text-2xl font-semibold uppercase">Xem trước</h1>
                    <NDivider />
                    <NSpace vertical class="p-6 dark:bg-slate-600/20 bg-slate-600/90 rounded-lg">
                        <NThing :style="{ color: '#fff' }">
                            <template #header>
                                <h3 class="text-lg font-semibold dark:text-gray-300 text-white">
                                    {{ form.TenNXB || 'Tên nhà xuất bản' }}
                                </h3>
                            </template>
                            <template #description>
                                <div class="text-gray-300 text-sm mt-2">
                                    <div class="font-semibold">Địa chỉ:</div>
                                    <NEllipsis :line-clamp="2" class="text-gray-200 italic">
                                        {{ previewAddress }}
                                    </NEllipsis>
                                </div>
                            </template>
                        </NThing>
                    </NSpace>

                    <h1 class="text-2xl my-2 font-semibold uppercase">Nhà xuất bản hiện có</h1>
                    <NList clickable hoverable show-divider="true">
                        <NScrollbar style="max-height: 400px;">
                            <NGrid cols="1" x-gap="12" y-gap="12" class="p-2">
                                <NGi v-for="nxb in allNxb" :key="nxb.MANXB">
                                    <NListItem class="dark:bg-gray-600/20 bg-transparent shadow rounded-md p-4">
                                        <NThing :title="nxb.TENNXB">
                                            <template #description>
                                                <div class="text-sm mt-2">
                                                    <span class="font-semibold">Mã NXB:</span> 
                                                    <span class="text-gray-600 dark:text-gray-400">{{ nxb.MANXB }}</span>
                                                </div>
                                                <div class="text-sm mt-1">
                                                    <span class="font-semibold">Địa chỉ:</span>
                                                    <NEllipsis :line-clamp="2" class="text-gray-600 dark:text-gray-400 italic">
                                                        {{ nxb.DIACHI || 'Chưa có địa chỉ' }}
                                                    </NEllipsis>
                                                </div>
                                            </template>
                                        </NThing>
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