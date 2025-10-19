<script setup>
import {
    ref,
    onMounted,
    onBeforeUnmount,
    defineProps,
    watch,
    nextTick
}                   from 'vue'
import ApexCharts from 'apexcharts'
import { isDark } from '../hooks/useDark'

const chartEl = ref(null)
let chart = null

const props = defineProps({
    options: {
        type: Object,
        default: () => ({
            chart: {
                type: 'line',
                height: 350,
                background: 'transparent',
                toolbar: {
                    show: false
                },
                sparkline: {
                    enabled: false
                }
            },
            series: [],
            xaxis: {
                categories: []
            },
            dataLabels: {
                enabled: false,
            },
        })
    }
})

// Hàm khởi tạo chart
const initChart = async () => {
    await nextTick()
    
    if (chartEl.value && props.options) {
        // Nếu chart đã tồn tại, destroy nó trước
        if (chart) {
            chart.destroy()
            chart = null
        }
        
        // Xác định màu dựa vào theme
        const foreColor = isDark.value ? '#a8adb5' : '#626c7f'
        
        // Tạo chart mới
        const mergedOptions = {
            ...props.options,
            chart: {
                ...props.options.chart,
                background: 'transparent',
                foreColor: foreColor
            },
            theme: {
                mode: isDark.value ? 'dark' : 'light',
                palette: 'palette1'
            },
            tooltip: {
                theme: isDark.value ? 'dark' : 'light'
            },
            stroke: {
                ...props.options.stroke,
                width: props.options.stroke?.width || 3
            },
            fill: {
                ...props.options.fill,
                type: props.options.fill?.type || 'solid'
            },
            xaxis: {
                ...props.options.xaxis,
                labels: {
                    ...props.options.xaxis?.labels,
                    style: {
                        ...props.options.xaxis?.labels?.style,
                        colors: foreColor
                    }
                },
                axisBorder: {
                    ...props.options.xaxis?.axisBorder,
                    color: isDark.value ? '#404854' : '#e0e6ed'
                },
                axisTicks: {
                    ...props.options.xaxis?.axisTicks,
                    color: isDark.value ? '#404854' : '#e0e6ed'
                }
            },
            yaxis: {
                ...props.options.yaxis,
                labels: {
                    ...props.options.yaxis?.labels,
                    style: {
                        ...props.options.yaxis?.labels?.style,
                        colors: foreColor
                    }
                }
            },
            grid: {
                ...props.options.grid,
                borderColor: isDark.value ? '#404854' : '#e0e6ed'
            },
            legend: {
                ...props.options.legend,
                labels: {
                    ...props.options.legend?.labels,
                    colors: foreColor
                }
            }
        }
        
        chart = new ApexCharts(chartEl.value, mergedOptions)
        chart.render()
    }
}

// Hàm cập nhật chart
const updateChart = async () => {
    if (chart && props.options) {
        try {
            const foreColor = isDark.value ? '#a8adb5' : '#626c7f'
            
            const mergedOptions = {
                ...props.options,
                chart: {
                    ...props.options.chart,
                    background: 'transparent',
                    foreColor: foreColor
                },
                theme: {
                    mode: isDark.value ? 'dark' : 'light',
                    palette: 'palette1'
                },
                tooltip: {
                    theme: isDark.value ? 'dark' : 'light'
                },
                stroke: {
                    ...props.options.stroke,
                    width: props.options.stroke?.width || 3
                },
                fill: {
                    ...props.options.fill,
                    type: props.options.fill?.type || 'solid'
                },
                xaxis: {
                    ...props.options.xaxis,
                    labels: {
                        ...props.options.xaxis?.labels,
                        style: {
                            ...props.options.xaxis?.labels?.style,
                            colors: foreColor
                        }
                    },
                    axisBorder: {
                        ...props.options.xaxis?.axisBorder,
                        color: isDark.value ? '#404854' : '#e0e6ed'
                    },
                    axisTicks: {
                        ...props.options.xaxis?.axisTicks,
                        color: isDark.value ? '#404854' : '#e0e6ed'
                    }
                },
                yaxis: {
                    ...props.options.yaxis,
                    labels: {
                        ...props.options.yaxis?.labels,
                        style: {
                            ...props.options.yaxis?.labels?.style,
                            colors: foreColor
                        }
                    }
                },
                grid: {
                    ...props.options.grid,
                    borderColor: isDark.value ? '#404854' : '#e0e6ed'
                },
                legend: {
                    ...props.options.legend,
                    labels: {
                        ...props.options.legend?.labels,
                        colors: foreColor
                    }
                }
            }
            
            await chart.updateOptions(mergedOptions, false, true)
        } catch (error) {
            console.error('Lỗi khi cập nhật chart:', error)
            // Nếu updateOptions lỗi, re-init chart
            await initChart()
        }
    }
}

onMounted(async () => {
    await initChart()
})

// Watch options thay đổi
watch(() => props.options, async (newOptions) => {
    if (newOptions && newOptions.series && newOptions.series.length > 0) {
        await updateChart()
    }
}, { 
    deep: true,
    immediate: false 
})

// Watch dark mode thay đổi
watch(isDark, async (newVal) => {
    if (chart) {
        // Xác định palette màu cho theme
        const foreColor = newVal ? '#a8adb5' : '#626c7f'
        const backgroundColor = newVal ? 'transparent' : 'transparent'
        
        await chart.updateOptions({
            chart: {
                background: backgroundColor,
                foreColor: foreColor
            },
            theme: {
                mode: newVal ? 'dark' : 'light',
                palette: 'palette1'
            },
            tooltip: {
                theme: newVal ? 'dark' : 'light'
            },
            xaxis: {
                labels: {
                    style: {
                        colors: foreColor
                    }
                },
                axisBorder: {
                    color: newVal ? '#404854' : '#e0e6ed'
                },
                axisTicks: {
                    color: newVal ? '#404854' : '#e0e6ed'
                }
            },
            yaxis: [{
                labels: {
                    style: {
                        colors: [foreColor]
                    }
                }
            }],
            grid: {
                borderColor: newVal ? '#404854' : '#e0e6ed'
            },
            legend: {
                labels: {
                    colors: foreColor
                }
            }
        })
    }
})

onBeforeUnmount(() => {
    if (chart) {
        chart.destroy()
        chart = null
    }
})
</script>


<template>
    <div ref="chartEl" class="w-full"></div>
</template>


<style scoped>

</style>