<script setup>
import { 
    NSpace, 
    NButton,
    NSwitch, 
    NIcon,
    NLayout, 
    NLayoutHeader,
    NLayoutContent,
    NLayoutFooter,
    NLayoutSider,
    NMenu,
    useMessage,
    useNotification
}                           from    'naive-ui';
import { 
    isDark, 
    toggleDark 
}                           from  '../../hooks/useDark.js';

import { 
    h,
    onMounted,
    ref, 
    watch
}                           from    'vue';
import { 
    useRoute,
    useRouter,
    RouterLink
}                           from    'vue-router';
// import icon                 from    '../../hooks/useIcon';
import { 
    currentAccount, 
    removeAccount 
}                           from    '../../hooks/useAccount.js';

import icon                 from    '../../hooks/useIcon.js';
import Search               from '../../components/Search.vue';



//============= VARIABLES =============//
//route
const route                 =       useRoute();
const router                =       useRouter();
const message               =       useMessage();
const notification          =       useNotification();
const BASE_API              =       import.meta.env.VITE_BASE_API;
//=====================================//

//naive ui - menu
const menuRef               =       ref(null);
const selectedKey           =       ref('home');
function handleSelect(key) {
    selectedKey.value       =       key;
}
//=====================================//

onMounted(() => {
    //set name page
    document.title = "Admin";
    //set logo


    //thong bao khi lan dau vao trang
    notification.info({
        title: `Chào mừng ${currentAccount.value?.HoTenNV}`,
        content: () => h('span', [
            'Bạn đã đăng nhập với quyền ',
            h('span', { class: 'text-orange-600 italic' }, 'Người quản trị'),
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

const menuOptions           =       [
    {
        label: () => h(
            RouterLink,
            {
                to: {
                    name: 'admin-home',
                }
            },
            {
                default: () => 'Dashboard'
            }
        ),
        key:   'admin-home',
        icon:  () => icon('fa-solid fa-gauge'),
    },
    {
        label: 'Books',
        key:   'books',
        icon:  () => icon('fa-solid fa-book'),
        children: [
            {
                label: () => h(
                    RouterLink,
                    {
                        to: {
                            name: 'books-list',
                        }
                    },
                    {
                        default: () => 'Tất cả'
                    }
                ),
                key:   'books-list',
                icon:  () => icon('fa-solid fa-list'),
            },
            {
                label: () => h(
                    RouterLink,
                    {
                        to: {
                            name: 'add-new-book',
                        }
                    },
                    {
                        default: () => 'Add New Book'
                    }
                ),
                key:   'add-new-book',
                icon: () => icon('fa-solid fa-plus'),
            },
        ]
    },
    {
        label: 'Danh mục',
        key:   'categories',
        icon: () => icon('fa-solid fa-tags'),
        children: [
            {
                label: () => h(
                    RouterLink,
                    {
                        to: {
                            name: 'categories-list',
                        }
                    },
                    {
                        default: () => 'Tất cả'
                    }
                ),
                key:   'categories',
                icon:  () => icon('fa-solid fa-list'),
            }, {
                label: () => h(
                    RouterLink,
                    {
                        to: {
                            name: 'add-new-category',
                        }
                    },
                    {
                        default: () => 'Thêm mới'
                    }
                ),
                key:   'add-new-category',
                icon:  () => icon('fa-solid fa-plus'),
            }
        ]
    },
    {
        label: 'Nhà Xuất Bản',
        key:   'nxb',
        icon:  () => icon('fa-solid fa-building'),
        children: [
            {
                label: () => h(
                    RouterLink,
                    {
                        to: {
                            name: 'add-new-nxb',
                        }
                    },
                    {
                        default: () => 'Add New NXB'
                    }
                ),
                key:   'add-new-nxb',
                icon: () => icon('fa-solid fa-plus'),
            },
        ]
    },
    {
        label: 'Gói thành viên',
        key:   'packages',
        icon:  () => icon('fa-solid fa-address-card'),
        children: [
            {
                label: () => h(
                    RouterLink,
                    {
                        to: {
                            name: 'packages-list',
                        }
                    },
                    {
                        default: () => 'Tất cả'
                    }
                ),
                key:   'packages-list',
                icon:  () => icon('fa-solid fa-list'),
            }, {
                label: () => h(
                    RouterLink,
                    {
                        to: {
                            name: 'add-new-package',
                        }
                    },
                    {
                        default: () => 'Thêm mới'
                    }
                ),
                key:   'add-new-package',
                icon:  () => icon('fa-solid fa-plus'),
            }
        ]
    },
    {
        label: () => h(
            RouterLink,
            {
                to: {
                    name: 'admin-users',
                }
            },
            {
                default: () => 'Người dùng'
            }
        ),
        key:   'admin-users',
        icon:  () => icon('fa-solid fa-users'),
    }
]

</script>


<template>
<NLayout>
    <NLayoutHeader class="px-6 py-4 border-b border-b-gray-200">
        <NSpace justify="space-between" align="center">
            <NSpace align="center" size="large">
                <h1 class="text-xl uppercase font-semibold">Admin Dashboard</h1>
            </NSpace> 
            <Search />
            <NSpace align="center" size="large">
                <span class="flex space-x-1 border-r border-r-gray-300 pr-4">
                    <h3>Quản trị viên</h3>
                    <h3 class="text-orange-600 italic">{{ currentAccount?.HoTenNV}}</h3>
                </span>
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
                <NButton @click="() => {
                    removeAccount();
                    message.success('Đăng xuất thành công');
                    router.push({ name: 'login' });
                }">
                    <template #icon>
                        <NIcon>
                            <i class="fa-solid fa-right-from-bracket"></i>
                        </NIcon>
                    </template>
                    Logout
                </NButton>
            </NSpace>
        </NSpace>
    </NLayoutHeader>
    <!-- content -->
    <NLayout :has-sider="true">
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
    <NLayoutFooter>

    </NLayoutFooter>
</NLayout>
</template>

<style scoped>
.custom-header {
    background-color: #E28929;
    color: white;
}
.custom-header--dark {
    color: white;
}

</style>