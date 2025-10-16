import {onMounted, ref, watch} from 'vue';

const isDark = ref(localStorage.getItem('dark') === 'true');

watch(isDark, (newValue) => {
    localStorage.setItem('dark', newValue);
    document.documentElement.classList.toggle('dark', newValue);
});

const toggleDark = () => {
    isDark.value = !isDark.value;
}

export {
    isDark,
    toggleDark
}
