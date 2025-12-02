<script setup>
import {
    NSpace,
    NButton,
    NForm,
    NFormItem,
    NInput,
    NModal,
    NTabs,
    NTabPane,
    NSpin,
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

// Forgot Password Modal
const showForgotModal   =       ref(false);
const forgotLoading     =       ref(false);
const forgotStep        =       ref(1); // 1: Enter MSNV, 2: Enter OTP, 3: New Password
const forgotForm        =       ref({
    MSNV: '',
    otp: '',
    newPassword: '',
    confirmPassword: ''
});

// Master Key Recovery
const masterKeyForm     =       ref({
    masterKey: ''
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
          // Save token to localStorage
          if (response.data.token) {
            localStorage.setItem('adminToken', response.data.token);
          }
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

//<========== Forgot Password Functions

// Request OTP
const requestOTP = async () => {
    if (!forgotForm.value.MSNV) {
        message.error('Vui lòng nhập mã nhân viên');
        return;
    }
    
    try {
        forgotLoading.value = true;
        const response = await axios.post(`${BASE_API}/account/admin/forgot-password`, {
            MSNV: forgotForm.value.MSNV
        });
        
        if (response.data.status === 'success') {
            message.success(response.data.message);
            forgotStep.value = 2;
        } else {
            message.error(response.data.message);
        }
    } catch (error) {
        message.error(error.response?.data?.message || 'Gửi OTP thất bại');
    } finally {
        forgotLoading.value = false;
    }
};

// Verify OTP
const verifyOTP = async () => {
    if (!forgotForm.value.otp) {
        message.error('Vui lòng nhập mã OTP');
        return;
    }
    
    try {
        forgotLoading.value = true;
        const response = await axios.post(`${BASE_API}/account/admin/verify-otp`, {
            MSNV: forgotForm.value.MSNV,
            otp: forgotForm.value.otp
        });
        
        if (response.data.status === 'success') {
            message.success(response.data.message);
            forgotStep.value = 3;
        } else {
            message.error(response.data.message);
        }
    } catch (error) {
        message.error(error.response?.data?.message || 'Xác thực OTP thất bại');
    } finally {
        forgotLoading.value = false;
    }
};

// Reset Password
const resetPassword = async () => {
    if (!forgotForm.value.newPassword || !forgotForm.value.confirmPassword) {
        message.error('Vui lòng nhập đầy đủ thông tin');
        return;
    }
    
    if (forgotForm.value.newPassword !== forgotForm.value.confirmPassword) {
        message.error('Mật khẩu xác nhận không khớp');
        return;
    }
    
    if (forgotForm.value.newPassword.length < 6) {
        message.error('Mật khẩu phải có ít nhất 6 ký tự');
        return;
    }
    
    try {
        forgotLoading.value = true;
        const response = await axios.post(`${BASE_API}/account/admin/reset-password`, {
            MSNV: forgotForm.value.MSNV,
            otp: forgotForm.value.otp,
            newPassword: forgotForm.value.newPassword
        });
        
        if (response.data.status === 'success') {
            message.success(response.data.message);
            // Reset form and close modal
            showForgotModal.value = false;
            forgotStep.value = 1;
            forgotForm.value = {
                MSNV: '',
                otp: '',
                newPassword: '',
                confirmPassword: ''
            };
        } else {
            message.error(response.data.message);
        }
    } catch (error) {
        message.error(error.response?.data?.message || 'Đặt lại mật khẩu thất bại');
    } finally {
        forgotLoading.value = false;
    }
};

// Master Key Recovery
const masterRecovery = async () => {
    if (!masterKeyForm.value.masterKey) {
        message.error('Vui lòng nhập Master key');
        return;
    }
    
    try {
        forgotLoading.value = true;
        const response = await axios.post(`${BASE_API}/account/admin/master-recovery`, {
            masterKey: masterKeyForm.value.masterKey
        });
        
        if (response.data.status === 'success') {
            message.success(response.data.message);
            setAccount(response.data.account);
            // Save token
            if (response.data.token) {
                localStorage.setItem('adminToken', response.data.token);
            }
            showForgotModal.value = false;
            router.push({ name: 'admin-home' });
        } else {
            message.error(response.data.message);
        }
    } catch (error) {
        message.error(error.response?.data?.message || 'Master key không hợp lệ');
    } finally {
        forgotLoading.value = false;
    }
};

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
                    <NSpace justify="space-between" class="w-full">
                        <NButton @click="buttonValidate" type="primary" :loading="loggingIn" :disabled="loggingIn">Login</NButton>
                        <NButton text type="info" @click="showForgotModal = true">Quên mật khẩu?</NButton>
                    </NSpace>
                </NFormItem>
            </NForm>
        </NSpace>

        <!-- Forgot Password Modal -->
        <NModal
            v-model:show="showForgotModal"
            preset="card"
            title="Khôi phục mật khẩu"
            :style="{ width: '500px' }"
            :mask-closable="false"
        >
            <NTabs type="line" animated>
                <!-- Tab 1: OTP Recovery -->
                <NTabPane name="otp" tab="Khôi phục qua Email">
                    <NSpin :show="forgotLoading">
                        <!-- Step 1: Enter MSNV -->
                        <NSpace v-if="forgotStep === 1" vertical class="w-full">
                            <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                Nhập mã nhân viên của bạn để nhận mã OTP qua email.
                            </p>
                            <NInput 
                                v-model:value="forgotForm.MSNV" 
                                placeholder="Nhập mã nhân viên (MSNV)"
                                size="large"
                            />
                            <NButton 
                                type="primary" 
                                block 
                                @click="requestOTP"
                                :loading="forgotLoading"
                            >
                                Gửi mã OTP
                            </NButton>
                            <div class="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                                <p class="text-xs text-yellow-700 dark:text-yellow-400">
                                    <strong>⚠️ Lưu ý:</strong> Nếu bạn chưa cập nhật email, vui lòng liên hệ IT Support.
                                </p>
                            </div>
                        </NSpace>

                        <!-- Step 2: Enter OTP -->
                        <NSpace v-if="forgotStep === 2" vertical class="w-full">
                            <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.
                            </p>
                            <NInput 
                                v-model:value="forgotForm.otp" 
                                placeholder="Nhập mã OTP (6 chữ số)"
                                size="large"
                                maxlength="6"
                            />
                            <NSpace class="w-full">
                                <NButton 
                                    type="primary" 
                                    @click="verifyOTP"
                                    :loading="forgotLoading"
                                >
                                    Xác thực OTP
                                </NButton>
                                <NButton 
                                    @click="forgotStep = 1"
                                >
                                    Gửi lại
                                </NButton>
                            </NSpace>
                        </NSpace>

                        <!-- Step 3: New Password -->
                        <NSpace v-if="forgotStep === 3" vertical class="w-full">
                            <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                Nhập mật khẩu mới của bạn.
                            </p>
                            <NInput 
                                v-model:value="forgotForm.newPassword" 
                                type="password"
                                placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
                                size="large"
                                show-password-on="click"
                            />
                            <NInput 
                                v-model:value="forgotForm.confirmPassword" 
                                type="password"
                                placeholder="Xác nhận mật khẩu mới"
                                size="large"
                                show-password-on="click"
                            />
                            <NButton 
                                type="primary" 
                                block
                                @click="resetPassword"
                                :loading="forgotLoading"
                            >
                                Đặt lại mật khẩu
                            </NButton>
                        </NSpace>
                    </NSpin>
                </NTabPane>

                <!-- Tab 2: Master Key Recovery -->
                <NTabPane name="master" tab="Khôi phục Master">
                    <NSpin :show="forgotLoading">
                        <NSpace vertical class="w-full">
                            <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                Dành cho chủ thư viện: Nhập Master key để đăng nhập trực tiếp.
                            </p>
                            <NInput 
                                v-model:value="masterKeyForm.masterKey" 
                                type="password"
                                placeholder="Nhập Master key"
                                size="large"
                                show-password-on="click"
                            />
                            <NButton 
                                type="primary" 
                                block
                                @click="masterRecovery"
                                :loading="forgotLoading"
                            >
                                Đăng nhập bằng Master key
                            </NButton>
                            <div class="mt-2 p-3 bg-red-50 dark:bg-red-900/20 rounded">
                                <p class="text-xs text-red-700 dark:text-red-400">
                                    <strong>🔒 Bảo mật:</strong> Master key chỉ dành cho chủ thư viện. Không chia sẻ với bất kỳ ai.
                                </p>
                            </div>
                        </NSpace>
                    </NSpin>
                </NTabPane>
            </NTabs>
        </NModal>
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