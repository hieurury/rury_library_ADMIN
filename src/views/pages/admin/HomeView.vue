<script setup>
import {
    NRow,
    NCol,
    NStatistic,
    NIcon,
    NConfigProvider
} from 'naive-ui'
import { onMounted, onBeforeUnmount, ref, watch, h } from 'vue'
import ApexCharts from 'apexcharts'
import Chart from '../../../components/Chart.vue'
import { isDark } from '../../../hooks/useDark.js'

const customThemeLight = ref({
  Statistic: {
    valueTextColor: '#ffffff',
    labelTextColor: '#ffffff'
  },
});

const customThemeDark = ref({

})
</script>


<template>
    <NConfigProvider :theme-overrides="isDark ? customThemeDark : customThemeLight">
        <div class="p-6">
            <h1 class="text-4xl font-semibold uppercase my-2">Thống kê trong ngày</h1>
            <NRow align="middle" gutter="24" class="p-2 shadow-md rounded-md">
                <NRow class="my-4" :gutter="24">
                    <NCol :span="8">
                        <NStatistic
                            label="Sách mượn trong ngày"
                            :value="1234"
                            labelTextColor="#fff"
                            class="w-full ring-2 ring-blue-500 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-600/50 dark:to-blue-700/50 shadow-md text-white rounded-md p-4"
                        />
                    </NCol>
                    <NCol :span="8">
                        <NStatistic
                            label="Sách trả trong ngày"
                            :value="123"
                            class="w-full ring-2 ring-green-500 bg-gradient-to-r from-green-600 to-green-700 dark:from-green-600/50 dark:to-green-700/50 shadow-md rounded-md p-4"
                        />
                    </NCol>
                    <NCol :span="8">
                        <NStatistic
                            label="Sách quá hạn trong ngày"
                            :value="12"
                            class="w-full ring-2 ring-red-500 bg-gradient-to-r from-red-600 to-red-700 dark:from-red-600/50 dark:to-red-700/50 shadow-md rounded-md p-4"
                        />
                    </NCol>
                </NRow>
                <NCol :span="16" class="flex justify-center items-center">
                    <Chart class="w-full" :options="{
                        chart: {
                            type: 'area',
                            height: 300,
                            toolbar: {
                                show: false
                            },
                        },
                        colors: ['#00E396'],
                        series: [{
                            name: 'giá',
                            data: [31, 40, 28, 51, 42, 109, 100]
                        }],
                        xaxis: {
                            categories: [1991, 1992, 1993, 1994, 1995, 1996, 1997]
                        },
                    }"/>
                </NCol>
                <NCol :span="8" class="flex justify-center items-center">
                    <Chart class="w-full" :options="{
                        chart: {
                            type: 'donut',
                            toolbar: {
                                show: false
                            },
                        },
                        colors: ['orange', '#00E396'],
                        series: [16, 20],
                        labels: ['Mượn', 'Trả'],
                        legend: {
                            position: 'bottom'
                        },
                        fill: {opacity: 1, },
                        stroke: {width: 1},
                    }" />
                </NCol>
            </NRow>
        </div>
    </NConfigProvider>
</template>


<style scoped>
span.n-statistic-value__content {
    color: white !important;
}
</style>