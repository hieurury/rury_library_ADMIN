import { 
    createWebHistory, 
    createRouter 
}                           from "vue-router";
import { currentAccount }   from '../hooks/useAccount.js';
//layouts
import MainLayout           from "../views/layouts/MainLayout.vue";
import LoginLayout          from "../views/layouts/LoginLayout.vue";
import LibrarianLayout      from "../views/layouts/LibrarianLayout.vue";

//pages (admin)
import HomeView             from "../views/pages/admin/HomeView.vue";
import BooksView            from "../views/pages/BooksView.vue";
import AddNewBookView       from "../views/pages/admin/AddNewBookView.vue";
import AddNewNXBView        from "../views/pages/admin/AddNewNXBView.vue";
import AddNewPackageView       from "../views/pages/admin/AddNewPackageView.vue";
import UsersManagementView  from "../views/pages/admin/UsersManagementView.vue";
import StaffManagementView  from "../views/pages/admin/StaffManagementView.vue";
//librarian pages
import LHomeView            from "../views/pages/librarian/LHomeView.vue";
import LUsersManagerView    from "../views/pages/librarian/LUsersManagerView.vue";
import LBooksView           from "../views/pages/librarian/LBooksView.vue";

//both pages (admin & librarian)
import LoginView            from "../views/pages/LoginView.vue";
import PackagesView         from "../views/pages/PackageView.vue";
// import FirstTimeSetupView from "../views/pages/FirstTimeSetupView.vue";
import NotFoundView         from "../views/pages/NotFoundView.vue";
import CategoriesView       from "../views/pages/CategoriesView.vue";
import AddNewCategoryView   from "../views/pages/admin/AddNewCategoryView.vue";

// ================= Route Definitions ================= //
// roles: 'Admin' | 'Librarian'
const routes = [
    {
        path: '/',
        redirect: '/login'
    },
    {
        path: '/admin',
        component: MainLayout,
        meta: { requiresAuth: true, roles: ['Admin'] },
        children: [
            {
                path: '', // /admin
                name: 'admin-home',
                component: HomeView,
                meta: { requiresAuth: true, roles: ['Admin'], title: 'Dashboard' }
            },
            {
                path: 'books', // /admin/books
                name: 'admin-books',
                children: [
                    {
                        path: 'add',
                        name: 'add-new-book',
                        component: AddNewBookView,
                        meta: { requiresAuth: true, roles: ['Admin'], title: 'Add New Book' }
                    },
                    {
                        path: '',
                        name: 'books-list',
                        component: BooksView,
                        meta: { requiresAuth: true, roles: ['Admin'], title: 'Books' }
                    }
                ]
            },
            {
                path: 'categories',
                name: 'admin-categories',
                children: [
                    {
                        path: '',
                        name: 'categories-list',
                        component: CategoriesView,
                        meta: { requiresAuth: true, roles: ['Admin'], title: 'Categories' }
                    },
                    {
                        path: 'add',
                        name: 'add-new-category',
                        component: AddNewCategoryView,
                        meta: { requiresAuth: true, roles: ['Admin'], title: 'Add New Category' }
                    }
                ]
            },
            {
                path: 'nxb',
                name: 'admin-nxb',
                children: [
                    {
                        path: 'add',
                        name: 'add-new-nxb',
                        component: AddNewNXBView,
                        meta: { requiresAuth: true, roles: ['Admin'], title: 'Add New NXB' }
                    }
                ]
            },
            {
                path: 'packages',
                name: 'admin-packages',
                children: [
                    {
                        path: '',
                        name: 'packages-list',
                        component: PackagesView,
                        meta: { requiresAuth: true, roles: ['Admin'], title: 'Packages' }
                    },
                    {
                        path: 'add',
                        name: 'add-new-package',
                        component: AddNewPackageView,
                        meta: { requiresAuth: true, roles: ['Admin'], title: 'Add New Package' }
                    }
                ]
            },
            {
                path: 'users',
                name: 'admin-users',
                component: UsersManagementView,
                meta: { requiresAuth: true, roles: ['Admin'], title: 'Users Management' }
            },
            {
                path: 'staff',
                name: 'admin-staff',
                component: StaffManagementView,
                meta: { requiresAuth: true, roles: ['Admin'], title: 'Staff Management' }
            }
        ]
    },
    {
        path: '/librarian',
        name: 'librarian',
        component: LibrarianLayout,
        meta: { requiresAuth: true, roles: ['Librarian'] },
        children: [
            {
                path: '', // /librarian
                name: 'librarian-home',
                component: LHomeView,
                meta: { requiresAuth: true, roles: ['Librarian'], title: 'Librarian Home' }
            },
            {
                path: 'users', // /librarian/users
                name: 'librarian-users-manager',
                component: LUsersManagerView,
                meta: { requiresAuth: true, roles: ['Librarian'], title: 'Users Manager' }
            },
            {
                path: 'books', // /librarian/books
                name: 'librarian-books',
                component: LBooksView,
                meta: { requiresAuth: true, roles: ['Librarian'], title: 'Books Management' }
            }
        ]
    },
    {
        path: '/login',
        component: LoginLayout,
        children: [
            {
                path: '',
                name: 'login',
                component: LoginView,
                meta: { guest: true }
            }
        ]
    },
    {
        path: '/:pathMatch(.*)*',
        component: MainLayout,
        children: [
            {
                path: '',
                name: 'not-found',
                component: NotFoundView
            }
        ]
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior() {
        const el = document.getElementById('app');
        if (el) el.scrollIntoView();
    }
});

// ================= Global Guard ================= //
router.beforeEach((to, from, next) => {
    const account = currentAccount.value;
    const isLoggedIn = !!account;
    const role = account?.ChucVu;

    // nếu trang ko yêu cầu đăng nhập mà đã đăng nhập rồi thì chuyển hướng
    if (to.meta.guest && isLoggedIn) {
        if (role === 'Admin') return next({ name: 'admin-home' });
        if (role === 'Librarian') return next({ name: 'librarian-home' });
    }

    // yêu cầu đăng nhập mà chưa đn thì chuyển đến trang đn
    if (to.meta.requiresAuth && !isLoggedIn) {
        return next({ name: 'login', query: { redirect: to.fullPath } });
    }

    //ở đúng vai trò
    if (to.meta.roles && !to.meta.roles.includes(role)) {
        if (isLoggedIn) {
            //đăng nhập rồi nhưng không đúng vai trò
            if (role === 'Admin') return next({ name: 'admin-home' });
            if (role === 'Librarian') return next({ name: 'librarian-home' });
        }   
    }
    next();
});




export default router;