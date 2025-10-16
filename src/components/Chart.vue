<script setup>
import {
    ref,
    onMounted,
    defineProps,
    watch
}                   from 'vue'
import {
    NSpace
} from 'naive-ui'
import ApexCharts from 'apexcharts'
import { isDark } from '../hooks/useDark'

const chartEl = ref(null)
let chart = null

onMounted(() => {
    chart = new ApexCharts(chartEl.value, props.options)
    chart.render()
})



const props = defineProps({
    options: {
        type: Object,
        default: () => ({
            chart: {
                type: 'bar',
                height: '100%',
                width: '100%',
                background: 'transparent',
                toolbar: {
                    show: false
                },
            },
            series: [{
                name: 'giá',
                data: [31, 40, 28, 51, 42, 109, 100],
            }],
            xaxis: {
                categories: [1991, 1992, 1993, 1994, 1995, 1996, 1997]
            },
            dataLabels: {
                enabled: false,
            },
        })
    }
})

watch(isDark, (newVal) => {
    if (chart) {
        chart.updateOptions({
            chart: {
                background: 'transparent',
            },
            theme: {
                mode: newVal ? 'dark' : 'light'
            }
        })
    }
})
</script>


<template>
    <div ref="chartEl"></div>
</template>


<style scoped>

</style>