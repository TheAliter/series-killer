<template>
  <div class="relative py-2">
    <!-- Lock Overlay for Future Release Dates -->
    <div
      v-if="isFutureRelease"
      class="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-md bg-ink/80 p-4"
    >
      <Lock class="absolute left-2 top-2 h-4 w-4 text-white" />
      <h3 class="text-center text-base font-semibold text-white">{{ book.title }}</h3>
      <p class="mt-2 text-sm font-medium text-white/95">
        Releases {{ formatReleaseDate(book.release_date!) }}
      </p>
    </div>

    <!-- Primary row: thumb, title, badge, menu -->
    <div class="flex items-center gap-3">
      <div class="h-12 w-8 shrink-0 overflow-hidden rounded-sm bg-[#ddd5c8]">
        <img
          v-if="book.cover_url"
          :src="book.cover_url"
          :alt="book.title"
          class="h-full w-full object-cover"
        />
        <div v-else class="flex h-full w-full items-center justify-center">
          <BookIcon class="h-4 w-4 text-ink-muted/60" />
        </div>
      </div>

      <div class="min-w-0 flex-1">
        <div
          class="flex min-w-0 items-baseline gap-1"
          :class="{ 'opacity-0': isFutureRelease }"
        >
          <h3 class="truncate text-[0.8125rem] font-medium text-ink" :title="book.title">
            {{ book.title }}
          </h3>
          <span
            v-if="book.series_order"
            class="shrink-0 text-[0.8125rem] font-normal text-ink-muted"
          >
            · Book {{ book.series_order }}
          </span>
        </div>
      </div>

      <span
        :class="[
          statusBadgeClass,
          'ml-auto shrink-0 rounded-full px-2 py-0.5 text-[0.65rem] font-medium',
          { 'opacity-0': isFutureRelease },
        ]"
      >
        {{ formattedStatus }}
      </span>

      <div class="relative z-20 shrink-0">
        <Menu as="div" class="relative inline-block text-left">
          <div>
            <MenuButton
              type="button"
              class="rounded-md p-1.5 transition-colors"
              :class="
                isFutureRelease ? 'hover:bg-white/15' : 'hover:bg-paper-dark/70 text-ink-muted'
              "
            >
              <MoreVertical
                class="h-4 w-4"
                :class="isFutureRelease ? 'text-white' : 'text-ink-muted'"
              />
            </MenuButton>
          </div>

          <transition
            enter-active-class="transition duration-100 ease-out"
            enter-from-class="transform scale-95 opacity-0"
            enter-to-class="transform scale-100 opacity-100"
            leave-active-class="transition duration-75 ease-in"
            leave-from-class="transform scale-100 opacity-100"
            leave-to-class="transform scale-95 opacity-0"
          >
            <MenuItems
              class="absolute right-0 z-30 mt-2 w-48 origin-top-right rounded-lg bg-card-cream py-1 shadow-editorial ring-1 ring-ink/10 focus:outline-none"
            >
              <div class="px-1 py-1">
                <MenuItem v-slot="{ active }">
                  <button
                    type="button"
                    @click="$emit('edit', book)"
                    :class="[
                      active ? 'bg-paper-dark/50' : '',
                      'group flex w-full items-center rounded-md px-2 py-2 text-sm text-ink',
                    ]"
                  >
                    <Edit class="mr-2 h-4 w-4 text-ink-muted" />
                    Edit Book
                  </button>
                </MenuItem>
              </div>
              <div class="px-1 py-1">
                <MenuItem v-slot="{ active }">
                  <button
                    type="button"
                    @click="$emit('delete', book)"
                    :class="[
                      active ? 'bg-red-50' : '',
                      'group flex w-full items-center rounded-md px-2 py-2 text-sm text-red-600',
                    ]"
                  >
                    <Trash2 class="mr-2 h-4 w-4" />
                    Delete Book
                  </button>
                </MenuItem>
              </div>
            </MenuItems>
          </transition>
        </Menu>
      </div>
    </div>

    <!-- Status actions & rating -->
    <div
      class="ml-11 mt-2 flex flex-wrap items-center gap-2 text-sm text-ink-muted"
      :class="{ 'opacity-0': isFutureRelease }"
    >
      <label
        v-if="book.status !== 'completed' && !isFutureRelease"
        class="inline-flex cursor-pointer select-none items-center gap-2"
      >
        <input
          type="checkbox"
          @change="$emit('updateStatus', book.id, 'completed')"
          class="form-checkbox h-4 w-4 shrink-0 cursor-pointer rounded border-paper-dark text-editorial-accent focus:ring-editorial-accent"
        />
        <span class="text-sm text-ink-muted">Mark as completed</span>
      </label>
      <div v-if="book.rating" class="flex items-center gap-0.5">
        <Star
          v-for="ratingStarIndex in 5"
          :key="ratingStarIndex"
          class="h-4 w-4"
          :class="
            ratingStarIndex <= book.rating!
              ? 'fill-current text-amber-400'
              : 'text-paper-dark'
          "
        />
      </div>
    </div>

    <!-- Footer: Notes and Read Date -->
    <div
      v-if="shouldShowFooter"
      class="ml-11 mt-3 space-y-2 border-t border-paper-dark/80 pt-3 text-sm text-ink-muted"
      :class="{ 'opacity-0': isFutureRelease }"
    >
      <p v-if="book.notes" class="flex items-start gap-2 italic">
        <MessageSquare class="mt-0.5 h-4 w-4 shrink-0 text-ink-muted/70" />
        <span>"{{ book.notes }}"</span>
      </p>
      <div v-if="book.read_date" class="flex items-center gap-2 text-xs text-ink-muted">
        <CalendarCheck class="h-3.5 w-3.5 shrink-0" />
        <span>Finished on {{ formatDate(book.read_date) }}</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import {
  Edit,
  Trash2,
  Star,
  Book as BookIcon,
  CalendarCheck,
  MessageSquare,
  MoreVertical,
  Lock,
} from 'lucide-vue-next'
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue'
import type { Book } from '@/types'

type BookStatus = 'reading' | 'completed' | 'want_to_read' | 'dropped'

interface Props {
  book: Book
}

const props = defineProps<Props>()

defineEmits<{
  edit: [book: Book]
  delete: [book: Book]
  updateStatus: [bookId: string, status: BookStatus]
}>()

const shouldShowFooter = computed(() => !!props.book.notes || !!props.book.read_date)

const isFutureRelease = computed(() => {
  if (!props.book.release_date) return false
  const releaseDate = new Date(props.book.release_date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return releaseDate > today
})

const formattedStatus = computed(() => {
  if (!props.book.status) return ''
  const statusText = props.book.status.replace(/_/g, ' ')
  return statusText.charAt(0).toUpperCase() + statusText.slice(1)
})

const statusBadgeClass = computed(() => {
  switch (props.book.status) {
    case 'completed':
      return 'bg-emerald-50 text-emerald-800'
    case 'reading':
      return 'bg-sky-50 text-sky-900'
    case 'want_to_read':
      return 'bg-paper-dark text-ink'
    case 'dropped':
      return 'bg-red-50 text-red-700'
    default:
      return 'bg-paper-dark text-ink-muted'
  }
})

const formatDate = (dateString: string) => {
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' }
  return new Date(dateString).toLocaleDateString(undefined, options)
}

const formatReleaseDate = (dateString: string) => {
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' }
  return new Date(dateString).toLocaleDateString(undefined, options)
}
</script>
