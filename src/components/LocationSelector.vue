<script setup>
import {
    NSelect,
    NSpace,
}                           from    'naive-ui';
import axios                from    'axios';
import {
    ref,
    watch,
    onMounted
}                           from    'vue';
const LOCATION_API          =       import.meta.env.VITE_LOCATION_API;

const props = defineProps({
    selectedLocation: {
        type: Object,
        default: () => ({
            province: null,
            district: null,
            ward: null
        })
    }
});

// ============= VARIABLES =============//
const selectedProvince      =       ref(null);
const selectedDistrict      =       ref(null);
const selectedWard          =       ref(null);

const provinces             =       ref([]);
const districts             =       ref([]);
const wards                 =       ref([]);
const emit                  =       defineEmits(['update:selectedLocation']);
// ============= FUNCTIONS =============//

const emitLocation = () => {
    const select = (data, value) => {
        if(!value) return null;
        const locate = data.find(item => {
            return item.value === value;
        });
        return {
            type: locate.type,
            label: locate.label
        }
    }
    const location = {
        province: select(provinces.value, selectedProvince.value),
        district: select(districts.value, selectedDistrict.value),
        ward: select(wards.value, selectedWard.value)
    };
    emit('update:selectedLocation', location);
}

onMounted(async () => {
    //fetch provinces
    try {
        const response        =       await axios.get(`${LOCATION_API}/provinces`);
        const data = response.data.data;
        provinces.value = data.map(province => {
            return {
                label: province.name,
                value: province.id,
                type: province.typeText,
            }
        })
    } catch (error) {
        console.error('Error fetching provinces:', error);
    }
});

//lấy danh sách huyện
watch(selectedProvince, async (newVal) => {
    console.log(selectedProvince.value  );
    if(newVal) {
        //gọi api
        try {
            const response    =       await axios.get(`${LOCATION_API}/districts/${newVal}`);
            const data        =       response.data.data;
            districts.value   =       data.map(district => {
                return {
                    label: district.name,
                    value: district.id,
                    type: district.typeText,
                }
            });
            //reset xã huyện khi chọn một tỉnh mới
            wards.value         =       [];
            selectedDistrict.value =   null;
            selectedWard.value     =   null;
        } catch (error) {
            console.error('Error fetching districts:', error);
        }
    } else {
        districts.value         =       [];
        wards.value             =       [];
        selectedDistrict.value  =       null;
        selectedWard.value      =       null;
    }
    emitLocation();
})

//lấy danh sách xã
watch(selectedDistrict, async (newVal) => {
    if(newVal) {
        //gọi api
        try {
            const response    =       await axios.get(`${LOCATION_API}/wards/${newVal}`);
            const data        =       response.data.data;
            wards.value       =       data.map(ward => {
                return {
                    label: ward.name,
                    value: ward.id,
                    type: ward.typeText,
                }
            });
            selectedWard.value     =   null;
        } catch (error) {
            console.error('Error fetching wards:', error);
        }
    } else {
        wards.value         =       [];
        selectedWard.value  =       null;
    }
    emitLocation();
});

watch(selectedWard, (newVal) => {
    if(newVal) {
        selectedWard.value = newVal;
    }
    emitLocation();
});
</script>


<template>
    <NSpace vertical style="width: 100%;">
        <NSelect v-model:value="selectedProvince"
                :options="provinces"
                placeholder="Chọn tỉnh/thành phố"
                style="width: 100%; margin-bottom: 10px;" />
        <NSelect v-model:value="selectedDistrict"
                :options="districts"
                placeholder="Chọn quận/huyện"
                style="width: 100%; margin-bottom: 10px;" />
        <NSelect v-model:value="selectedWard"
                :options="wards"
                placeholder="Chọn phường/xã"
                style="width: 100%; margin-bottom: 10px;" />
    </NSpace>
</template>

<style scoped>
</style>