<script setup>
import { 
    NForm, 
    NFormItem, 
    NInput, 
    NButton, 
    NSpace,
    NGrid,
    NGridItem,
    NDivider,
    NCard,
    NSpin,
    NScrollbar,
    NSkeleton,
    useMessage,
}                           from    'naive-ui';
import LocationSelector from '../../../components/LocationSelector.vue';
import { 
    ref, 
    watch,
    onMounted
} from 'vue';
import axios from 'axios';

// ============= VARIABLES =============//
const BASE_API = import.meta.env.VITE_BASE_API;
const message = useMessage();
const skeletonShow = ref(true);
const allNxb = ref([]);


//form 
const selectedLocation = ref({
    province: null,
    district: null,
    ward: null
});
const DiaChiCuThe = ref('');
const formRef = ref(null);
const form = ref({
    TenNXB: '',
    DiaChi: '',
});

// const checkLocation = () => {
//     //không cần check xã vì một số chổ ko có
//     if(!selectedLocation.value.province || !selectedLocation.value.district) {
//         return new Error('Vui lòng chọn địa chỉ');
//     }
// }

const formRules = ref({
    TenNXB: [
        { 
            required: true, 
            message: 'Vui lòng nhập tên NXB', 
            trigger: ['blur', 'input'] 
        }
    ],
    // DiaChi: [
    //     { 
    //         validator: checkLocation, 
    //         trigger: ['blur'] 
    //     }
    // ],
    // DiaChiCuThe: [
    //     { 
    //         validator: () => {
    //             if(!DiaChiCuThe.value) {
    //                 return new Error('Vui lòng nhập địa chỉ cụ thể');
    //             }
    //         },
    //         trigger: ['blur', 'input'] 
    //     }
    // ]
})


// ============= FUNCTIONS =============//
const getAllNxb = async () => {
    try {
        skeletonShow.value = true;
        const response = await axios.get(`${BASE_API}/nha-xuat-ban/all`);
        skeletonShow.value = false;
        if(response.data.status === 'success') {
            allNxb.value = response.data.data;
            console.log(allNxb.value);
        } else {
            message.error(response.data.message);
        }
    } catch (error) {
        message.error('Lỗi khi lấy danh sách NXB');
    }
}

onMounted(async () => {
    //fetch all NXB
    getAllNxb();
})

watch([selectedLocation, DiaChiCuThe], () => {
    form.value.DiaChi                       = `${DiaChiCuThe.value ? DiaChiCuThe.value + ', ' : ''}${selectedLocation.value.ward?.label}, ${selectedLocation.value.district?.label}, ${selectedLocation.value.province?.label}`;
});

//submit form
const submit = (e) => {
    e.preventDefault();
    formRef.value.validate( async (errors) => {
        if (!errors) {
            const response                  = await axios.post(`${BASE_API}/nha-xuat-ban/admin/create`, form.value);
            message[response.data.status](response.data.message);
            if(response.data.status === 'success') {
                form.value.TenNXB           =   '';
                selectedLocation.value      =   {
                    province: null,
                    district: null,
                    ward: null
                };
                DiaChiCuThe.value           =   '';
                //lấy lại danh sách NXB
                getAllNxb();
            }
        } else {
            message.error('Form tạo mới chưa hợp lệ!');
        }
    });
}
</script>


<template>
    <NGrid :cols="6" class="p-4 h-full">
        <NGridItem :span="4" class="p-4">
            <NSpace justify="center">
                <NSpace vertical
                class="   
                dark:bg-gradient-to-r dark:from-slate-800 dark:to-slate-600 dark:via-slate-700 shadow-md rounded-md">
                    <h2 class="text-3xl uppercase font-semibold mb-4 dark:bg-gray-900 bg-amber-500 p-4 rounded-t-md">Thêm nhà xuất bản mới</h2>
                    <NSpace class="p-4" vertical align="start" size="large">
                        <NForm class="max-w-md min-w-md" labelWidth="120px" ref="formRef" :model="form" :rules="formRules">
                            <NDivider />
                            <NFormItem class="text-lg" label="Tên nhà xuất bản" path="TenNXB">
                                <NInput v-model:value="form.TenNXB" placeholder="Nhập tên nhà xuất bản..." />
                            </NFormItem>
                            <NFormItem label="Địa chỉ" path="DiaChi">
                                <LocationSelector v-model:selectedLocation="selectedLocation" />
                            </NFormItem>
                            <NFormItem label="Nhập địa chỉ cụ thể" path="DiaChiCuThe">
                                <NInput v-model:value="DiaChiCuThe" placeholder="Nhập địa chỉ cụ thể..." />
                            </NFormItem>
                            <NDivider />
                        </NForm>
                        <NButton @click="submit" type="primary">Thêm NXB</NButton>
                    </NSpace>
                </NSpace>
            </NSpace>
        </NGridItem>
        <NGridItem :span="2" class="p-4">
            <h3 class="text-2xl uppercase font-semibold mb-4">Nhà xuất bản hiện có</h3>
            <NDivider />
            <NScrollbar class="max-h-[600px]">
                <NSkeleton v-show="skeletonShow" height="500px"/>
                <NSpace v-show="!skeletonShow" vertical class="">
                    <NCard v-for="nxb in allNxb" :key="nxb.MANXB" :title="`NXB: ${nxb.TENNXB}`" class="min-w-full mb-2 card-custom shadow-md">
                        <div class="font-semibold">Địa chỉ</div>
                        <div class="text-sm italic text-gray-600">{{ nxb.DIACHI || 'Chưa có địa chỉ' }}</div>
                    </NCard>
                </NSpace>
            </NScrollbar>
        </NGridItem>
    </NGrid>
</template>

<style scoped>
.card-custom {
    background: orange;
}
.dark .card-custom {
    background: #1e293b; /* bg-slate-800 */
}
</style>