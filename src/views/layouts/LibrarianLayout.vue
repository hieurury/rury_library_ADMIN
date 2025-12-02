<script setup>
import {
    NLayout,
    NLayoutHeader,
    NLayoutContent,
    NLayoutFooter,
    NLayoutSider,
    NSpace,
    NButton,
    NSwitch,
    NIcon,
    NMenu,
    NDropdown,
    NAvatar,
    useNotification,
    useMessage
}                           from    'naive-ui';
import {
    ref,
    onMounted,
    watch,
    h,
}                           from    'vue';
import {
    isDark,
}                           from     '../../hooks/useDark.js';
import {
    useRoute,
    useRouter,
    RouterLink
}                           from    'vue-router';
import icon                 from    '../../hooks/useIcon';
import { 
    removeAccount,
    currentAccount
}                           from    '../../hooks/useAccount.js';

//============= VARIABLES =============//
const route                 =       useRoute();
const router                =       useRouter();
const message               =       useMessage();
const notification          =       useNotification();
//=====================================//
const handleSelect = (key) => {
    selectedKey.value       =       key;
};
onMounted(() => {
    //thong bao khi lan dau vao trang
    notification.info({
        title: `Chào mừng ${currentAccount.value?.HoTenNV}`,
        content: () => h('span', [
            'Bạn đã đăng nhập với quyền ',
            h('span', { class: 'text-orange-600 italic' }, 'Thủ thư thư viện'),
        ]),
        duration: 2500,
        keepAliveOnHover: true
    });
    if(route.name) {
        handleSelect(route.name.toString());
    }
});

watch(() => route.name, (newVal) => {
    if(newVal) {
        handleSelect(newVal.toString());
    }
});
const menuRef               =       ref(null);
const selectedKey           =       ref('librarian-home');
const menuOptions           =       [
    {
        label: () => h(RouterLink, 
            { to: { name: 'librarian-home' } }, 
            { default: () => 'Quản lý' }
        ),
        key:   'librarian-home',
        icon:  () => icon('fa-solid fa-home'),
    },
    {
        label: () => h(RouterLink, { to: { name: 'librarian-users-manager' } }, { default: () => 'Thành viên' }),
        key:   'librarian-users-manager',
        icon:  () => icon('fa-solid fa-users'),
    },
    {
        label: () => h(RouterLink, { to: { name: 'librarian-books' } }, { default: () => 'Quản lý sách' }),
        key:   'librarian-books',
        icon:  () => icon('fa-solid fa-book'),
    },
]
</script>


<template>
    <n-layout>
        <!-- header -->
        <n-layout-header class="px-6 py-4 border-b border-b-gray-200">
            <NSpace justify="space-between" align="center">
                <NSpace vertical size="large">
                    <h1 class="text-xl uppercase font-semibold">Quản lý thư viện</h1>
                </NSpace> 
                <NSpace align="center" size="large">
                    <NDropdown
                        trigger="click"
                        :options="[
                            {
                                label: 'Thông tin cá nhân',
                                key: 'profile',
                                icon: () => h(NIcon, null, { default: () => h('i', { class: 'fa-solid fa-user' }) })
                            },
                            {
                                label: 'Đăng xuất',
                                key: 'logout',
                                icon: () => h(NIcon, null, { default: () => h('i', { class: 'fa-solid fa-right-from-bracket' }) })
                            }
                        ]"
                        @select="(key) => {
                            if (key === 'profile') {
                                router.push({ name: 'librarian-profile' });
                            } else if (key === 'logout') {
                                removeAccount();
                                localStorage.removeItem('adminToken');
                                message.success('Đăng xuất thành công');
                                router.push({ name: 'login' });
                            }
                        }"
                    >
                        <div class="flex items-center space-x-3 cursor-pointer hover:opacity-80 border-r border-r-gray-300 pr-4">
                            <NAvatar round size="small" style="background-color: #0ea5e9;">
                                {{ currentAccount?.HoTenNV?.charAt(0)?.toUpperCase() }}
                            </NAvatar>
                            <div class="flex flex-col">
                                <span class="text-xs text-gray-500 dark:text-gray-400">Thủ thư thư viện</span>
                                <span class="text-sm font-semibold text-sky-600">{{ currentAccount?.HoTenNV }}</span>
                            </div>
                        </div>
                    </NDropdown>
                    <NSwitch v-model:value="isDark">
                        <template #icon>
                            <NIcon v-if="isDark">
                                <i class="fa-solid fa-moon"></i>
                            </NIcon>
                            <NIcon v-else>
                                <i class="fa-solid fa-sun"></i>
                            </NIcon>
                        </template>
                    </NSwitch>
                </NSpace>
            </NSpace>
        </n-layout-header>

        <!-- body -->
        <NLayout has-sider>
            <NLayoutSider
            content-style="padding: 24px;"
            :native-scrollbar="false"
            bordered
            >
                <NMenu 
                v-model:value="selectedKey"
                ref="menuRef"
                :options="menuOptions">
                    
                </NMenu>
            </NLayoutSider>
            <NLayoutContent class="min-h-screen">
                <router-view></router-view>
            </NLayoutContent>
        </NLayout>

        <!-- footer -->
        <n-layout-footer>

        </n-layout-footer>
    </n-layout>
    

</template>

<style scoped>

</style>