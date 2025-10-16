import { h } from "vue"
import { NIcon } from "naive-ui"

const useIcon = (className) => {
    return h(NIcon, null, { default: () => h('i', { class: className }) });
}

export default useIcon;