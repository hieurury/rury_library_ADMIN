<script setup>
const BASE_API                  =       import.meta.env.VITE_BASE_API;
const IMG_ASSETS                =       import.meta.env.VITE_IMG_ASSETS;
const BADGE_DIR                 =       import.meta.env.VITE_BADGE_DIR;
import { NImage }               from    'naive-ui';
import {
    ref,
    defineProps
}                               from    'vue';

//====================== VARIABLES ======================//

//props
const props                      =       defineProps({
    img: {
        type: String,
    },
    url: {
        type: String,
    },
    children: {
        type: Object,
        required: false,
        default: () => ({
            width: '50px',
            height: '50px',
        })
    },
    position: {
        type: Object,
        required: false,
        default: () => ({
            top: '0px', 
            right: '0px',
        })
    },
});


</script>


<template>
    <span 
    class="absolute" 
    :style="{
        top: position.top, 
        right: position.right,
        left: position.left,
        bottom: position.bottom,
        }">
        <NImage :style="children" :src=" img ? `${BASE_API}${img}` : url"></NImage>
    </span>
</template>


<style scoped>

</style>