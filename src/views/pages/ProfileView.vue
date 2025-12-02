<script setup>
import {
    NCard,
    NForm,
    NFormItem,
    NInput,
    NButton,
    NSpace,
    NSelect,
    NTabs,
    NTabPane,
    useMessage,
    NIcon,
    NSpin
} from 'naive-ui';
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { currentAccount } from '../../hooks/useAccount.js';

const BASE_API = import.meta.env.VITE_BASE_API;
const message = useMessage();

const loading = ref(false);
const loadingProfile = ref(true);
const profileForm = ref({
    HoTenNV: '',
    DiaChi: '',
    soDienThoai: '',
    Email: '',
    GioiTinh: null
});

const passwordForm = ref({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
});

const genderOptions = [
    { label: 'Nam', value: 'Nam' },
    { label: 'Nữ', value: 'Nữ' },
    { label: 'Khác', value: 'Khác' }
];

// Fetch profile data
const fetchProfile = async () => {
    try {
        loadingProfile.value = true;
        const token = localStorage.getItem('adminToken');
        const response = await axios.get(`${BASE_API}/account/admin/profile`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (response.data.status === 'success') {
            const { HoTenNV, DiaChi, soDienThoai, Email, GioiTinh } = response.data.data;
            profileForm.value = {
                HoTenNV,
                DiaChi: DiaChi || '',
                soDienThoai,
                Email: Email || '',
                GioiTinh: GioiTinh || null
            };
        }
    } catch (error) {
        message.error('Không thể tải thông tin cá nhân');
        console.error(error);
    } finally {
        loadingProfile.value = false;
    }
};

// Update profile
const handleUpdateProfile = async () => {
    try {
        loading.value = true;
        const token = localStorage.getItem('adminToken');
        const response = await axios.put(
            `${BASE_API}/account/admin/profile`,
            profileForm.value,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (response.data.status === 'success') {
            message.success(response.data.message);
            // Update local account info
            const account = currentAccount.value;
            account.HoTenNV = profileForm.value.HoTenNV;
            account.Email = profileForm.value.Email;
            account.GioiTinh = profileForm.value.GioiTinh;
            localStorage.setItem('account', JSON.stringify(account));
        } else {
            message.error(response.data.message);
        }
    } catch (error) {
        message.error(error.response?.data?.message || 'Cập nhật thất bại');
        console.error(error);
    } finally {
        loading.value = false;
    }
};

// Change password
const handleChangePassword = async () => {
    if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
        message.error('Mật khẩu xác nhận không khớp');
        return;
    }

    if (passwordForm.value.newPassword.length < 6) {
        message.error('Mật khẩu mới phải có ít nhất 6 ký tự');
        return;
    }

    try {
        loading.value = true;
        const token = localStorage.getItem('adminToken');
        const response = await axios.put(
            `${BASE_API}/account/admin/change-password`,
            {
                currentPassword: passwordForm.value.currentPassword,
                newPassword: passwordForm.value.newPassword
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (response.data.status === 'success') {
            message.success(response.data.message);
            // Reset password form
            passwordForm.value = {
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            };
        } else {
            message.error(response.data.message);
        }
    } catch (error) {
        message.error(error.response?.data?.message || 'Đổi mật khẩu thất bại');
        console.error(error);
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    fetchProfile();
});
</script>

<template>
    <div class="p-6 max-w-4xl mx-auto">
        <h1 class="text-3xl font-bold mb-6 dark:text-white">Thông tin cá nhân</h1>

        <NSpin :show="loadingProfile">
            <NTabs type="line" animated>
                <!-- Tab 1: Profile Info -->
                <NTabPane name="profile" tab="Thông tin cơ bản">
                    <NCard>
                        <NForm
                            :model="profileForm"
                            label-placement="left"
                            label-width="140"
                            require-mark-placement="right-hanging"
                        >
                            <NFormItem label="Mã nhân viên" path="MSNV">
                                <NInput 
                                    :value="currentAccount?.MSNV" 
                                    disabled 
                                    placeholder="Mã nhân viên"
                                />
                            </NFormItem>

                            <NFormItem label="Chức vụ" path="ChucVu">
                                <NInput 
                                    :value="currentAccount?.ChucVu" 
                                    disabled 
                                    placeholder="Chức vụ"
                                />
                            </NFormItem>

                            <NFormItem label="Họ và tên" path="HoTenNV" required>
                                <NInput 
                                    v-model:value="profileForm.HoTenNV" 
                                    placeholder="Nhập họ và tên"
                                />
                            </NFormItem>

                            <NFormItem label="Giới tính" path="GioiTinh">
                                <NSelect 
                                    v-model:value="profileForm.GioiTinh" 
                                    :options="genderOptions"
                                    placeholder="Chọn giới tính"
                                />
                            </NFormItem>

                            <NFormItem label="Số điện thoại" path="soDienThoai" required>
                                <NInput 
                                    v-model:value="profileForm.soDienThoai" 
                                    placeholder="Nhập số điện thoại"
                                />
                            </NFormItem>

                            <NFormItem label="Email" path="Email">
                                <NInput 
                                    v-model:value="profileForm.Email" 
                                    placeholder="Nhập email (dùng để khôi phục mật khẩu)"
                                    type="email"
                                />
                            </NFormItem>

                            <NFormItem label="Địa chỉ" path="DiaChi">
                                <NInput 
                                    v-model:value="profileForm.DiaChi" 
                                    placeholder="Nhập địa chỉ"
                                    type="textarea"
                                    :rows="3"
                                />
                            </NFormItem>

                            <NFormItem>
                                <NSpace>
                                    <NButton 
                                        type="primary" 
                                        @click="handleUpdateProfile"
                                        :loading="loading"
                                    >
                                        Cập nhật thông tin
                                    </NButton>
                                </NSpace>
                            </NFormItem>
                        </NForm>
                    </NCard>
                </NTabPane>

                <!-- Tab 2: Change Password -->
                <NTabPane name="password" tab="Đổi mật khẩu">
                    <NCard>
                        <NForm
                            :model="passwordForm"
                            label-placement="left"
                            label-width="180"
                            require-mark-placement="right-hanging"
                        >
                            <NFormItem label="Mật khẩu hiện tại" path="currentPassword" required>
                                <NInput 
                                    v-model:value="passwordForm.currentPassword" 
                                    type="password"
                                    placeholder="Nhập mật khẩu hiện tại"
                                    show-password-on="click"
                                />
                            </NFormItem>

                            <NFormItem label="Mật khẩu mới" path="newPassword" required>
                                <NInput 
                                    v-model:value="passwordForm.newPassword" 
                                    type="password"
                                    placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                                    show-password-on="click"
                                />
                            </NFormItem>

                            <NFormItem label="Xác nhận mật khẩu mới" path="confirmPassword" required>
                                <NInput 
                                    v-model:value="passwordForm.confirmPassword" 
                                    type="password"
                                    placeholder="Nhập lại mật khẩu mới"
                                    show-password-on="click"
                                />
                            </NFormItem>

                            <NFormItem>
                                <NSpace>
                                    <NButton 
                                        type="primary" 
                                        @click="handleChangePassword"
                                        :loading="loading"
                                    >
                                        Đổi mật khẩu
                                    </NButton>
                                </NSpace>
                            </NFormItem>
                        </NForm>

                        <div class="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <p class="text-sm text-blue-600 dark:text-blue-400">
                                <strong>💡 Lưu ý:</strong> Nếu bạn quên mật khẩu, vui lòng cập nhật email để có thể sử dụng chức năng "Quên mật khẩu" khi đăng nhập.
                            </p>
                        </div>
                    </NCard>
                </NTabPane>
            </NTabs>
        </NSpin>
    </div>
</template>

<style scoped>
:deep(.n-form-item-label) {
    font-weight: 500;
}
</style>
