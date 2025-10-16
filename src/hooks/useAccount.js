//lưu account đa đăng nhập
import {
    ref,
    onMounted,
    onUnmounted,
    watch,
} from 'vue';


const currentAccount = ref(sessionStorage.getItem('currentAccount') ? JSON.parse(sessionStorage.getItem('currentAccount')) : null);

const setAccount = (data) => {
    currentAccount.value = data;
    sessionStorage.setItem('currentAccount', JSON.stringify(data));
}

const removeAccount = () => {
    currentAccount.value = null;
    sessionStorage.removeItem('currentAccount');
}

export {
    currentAccount,
    setAccount,
    removeAccount
}