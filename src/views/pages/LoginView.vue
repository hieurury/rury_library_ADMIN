<script setup>
import {
    NSpace,
    NButton,
    NForm,
    NFormItem,
    NInput,
    useMessage,
}                       from    'naive-ui';

import {
    ref,
    onMounted,
    watch,
}                       from    'vue';

import axios            from    'axios';
import {
    useRouter,
}                       from    'vue-router';
import {
    setAccount,
    currentAccount
}                       from    '../../hooks/useAccount.js';


const router            =       useRouter();

const BASE_API          =       import.meta.env.VITE_BASE_API;
console.log(BASE_API);
const message           =       useMessage();

const formRef           =       ref(null);
const loggingIn         =       ref(false);
const modelRef          =       ref({
    msnv: null,
    password: null,
});


onMounted(() => {
    //set name page
    document.title = "Login - Rury Lib Admin";
}) 


//==========> Liên quan đến form

function buttonValidate(e) {
  if (loggingIn.value) return; // Ngăn double click
  
  e.preventDefault();
  formRef.value?.validate(async (errors) => {
    if (!errors) {
      try {
        loggingIn.value = true;
        //post data to server
        const response    =   await axios.post(`${BASE_API}/account/admin/login`, modelRef.value);
        message[response.data.status](response.data.message);

        //check phan hoi
        if (response.data.status === "success") {
          setAccount(response.data.account);
          if(response.data.account.ChucVu === "Admin") {
              router.push({ name: 'admin-home' });
          } else if (response.data.account.ChucVu === "Librarian") {
              router.push({ name: 'librarian-home' });
          }
        }
      } catch (error) {
        message.error("Đăng nhập thất bại");
        console.log(error);
      } finally {
        loggingIn.value = false;
      }
    } else {
      message.error("Thông tin không hợp lệ");
    }
  });
}

const rules             =       {
    msnv: [
        {
            required: true,
            message: 'Vui lòng nhập MSNV',
            trigger: ['blur', 'input']
        },
        {
            type: 'string',
            message: 'MSNV phải là một chuỗi',
            trigger: ['blur', 'input']
        }
    ],
    password: [
        {
            required: true,
            message: 'Vui lòng nhập mật khẩu',
            trigger: ['blur', 'input']
        },
        {
            min: 6,
            message: 'Mật khẩu phải có ít nhất 6 ký tự',
            trigger: ['blur', 'input']
        }
    ],
}

//<========== Liên quan đến form




</script>

<template>
    <NSpace justify="center" align="center" class="min-h-screen">
        <NSpace class="shadow rounded-md dark:bg-gray-800 bg-transparent" vertical>
            <NSpace vertical align="center" class="py-2 mb-4 bg-amber-500 rounded-t-md">
                <h1 class="text-4xl font-bold">Rury Lib Admin</h1>
                <p class="text-gray-500">Please login to continue</p>
            </NSpace >
            <NForm class="min-w-xs p-4" ref="formRef" :model="modelRef" :rules="rules">
                <NFormItem label="MSNV" path="msnv">
                    <NInput class="bg-transparent" v-model:value="modelRef.msnv" placeholder="Enter your MSNV" />
                </NFormItem>
                <NFormItem label="Password" path="password">
                    <NInput class="bg-transparent" v-model:value="modelRef.password" type="password" placeholder="Enter your password" />
                </NFormItem>
                <NFormItem>
                    <NButton @click="buttonValidate" type="primary" :loading="loggingIn" :disabled="loggingIn">Login</NButton>
                </NFormItem>
            </NForm>
        </NSpace>
    </NSpace>
</template>

<style scoped>
.bg-pattern {
    background-color: #e5e5f7;
    opacity: 0.8;
    background-image:  repeating-radial-gradient( circle at 0 0, transparent 0, #f7f3e5 150px ), repeating-linear-gradient( #fff, #fff );
    background-blend-mode: multiply;
    
}
</style>