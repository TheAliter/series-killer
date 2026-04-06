<template>
  <div
    class="min-h-screen flex flex-col"
    :class="
      showSeriesRail
        ? 'lg:max-w-7xl lg:mx-auto lg:px-6 lg:py-8 lg:grid lg:grid-cols-[14rem_1fr] lg:gap-8 lg:items-start'
        : ''
    "
  >
    <aside
      v-if="showSeriesRail"
      class="hidden lg:flex flex-col gap-5 sticky top-8"
    >
      <div>
        <h1 class="font-serif text-2xl font-semibold text-ink leading-tight m-0">
          Series Killer
        </h1>
        <p class="text-[0.8rem] text-ink-muted mt-1 m-0">
          Track series and reading progress
        </p>
      </div>
      <router-link
        to="/app/series/add"
        class="btn-primary flex items-center justify-center gap-2 w-full mt-2"
      >
        <Plus class="w-4 h-4 shrink-0" />
        <span>Add Series</span>
      </router-link>
      <AccountMenu variant="rail" />
    </aside>
    <div
      :class="
        showSeriesRail
          ? 'min-w-0 flex-1 lg:col-start-2 px-4 pb-20 pt-0 lg:px-0 lg:pb-8'
          : 'mobile-container flex flex-col flex-1'
      "
    >
      <router-view />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Plus } from 'lucide-vue-next'
import AccountMenu from '@/components/AccountMenu.vue'

const route = useRoute()
const showSeriesRail = computed(() => route.name === 'Series')
</script>
