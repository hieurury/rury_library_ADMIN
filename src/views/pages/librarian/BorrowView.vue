<script setup>
import {
    NSpace,
    NButton,
    NIcon,
    NRow,
    NCol,
    NStatistic,
    NForm,
    NFormItem,
}                           from 'naive-ui';
</script>


<template>
    <NSpace vertical size="large" class="w-full">
        <NSpace>
            <NRow class="my-4" :gutter="24">
                <NCol :span="8">
                    <NStatistic
                        label="Sách mượn trong ngày"
                        :value="borrowedBooksToday.length"
                        labelTextColor="#fff"
                        class="w-full ring-2 ring-blue-600 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-600/50 dark:to-blue-700/50 shadow-md text-white rounded-md p-4"
                    />
                </NCol>
                <NCol :span="8">
                    <NStatistic
                        label="Sách trả trong ngày"
                        :value="returnedBooksToday.length"
                        class="w-full ring-2 ring-green-500 bg-gradient-to-r from-green-600 to-green-700 dark:from-green-600/50 dark:to-green-700/50 shadow-md rounded-md p-4"
                    />
                </NCol>
                <NCol :span="8">
                    <NStatistic
                        label="Sách quá hạn trong ngày"
                        :value="overdueBooks.length"
                        class="w-full ring-2 ring-red-500 bg-gradient-to-r from-red-600 to-red-700 dark:from-red-600/50 dark:to-red-700/50 shadow-md rounded-md p-4"
                    />
                </NCol>
            </NRow>
        </NSpace>
        <NForm>
            <NFormItem label="Search Books">
                <NButton>Search</NButton>
            </NFormItem>
        </NForm>
    </NSpace>
</template>


<style scoped>

</style>