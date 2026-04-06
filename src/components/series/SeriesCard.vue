<template>
  <div
    class="bg-card-cream rounded-xl shadow-editorial border border-editorial-accent/15 transition-shadow duration-300 hover:shadow-lg"
  >
    <div
      @click="!isClickOnAction ? $emit('toggleExpand') : null"
      class="flex items-start gap-4 p-4 pt-[1.125rem] px-[1.125rem] cursor-pointer"
      @mousedown="isClickOnAction = false"
    >
      <!-- Cover Image -->
      <img
        v-if="series.cover_url"
        :src="series.cover_url"
        alt="Series Cover"
        class="w-[5.5rem] h-32 object-cover rounded-[0.35rem] flex-shrink-0 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]"
      />
      <div
        v-else
        class="w-[5.5rem] h-32 rounded-[0.35rem] flex-shrink-0 bg-gradient-to-br from-editorial-accent to-[#5c4d3a] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]"
        aria-hidden="true"
      />

      <div class="flex-grow min-w-0">
        <!-- Header -->
        <div class="flex justify-between items-start gap-2">
          <div class="min-w-0">
            <h3 class="font-serif text-lg font-semibold text-ink truncate m-0 mb-1">
              {{ series.name }}
            </h3>
            <p v-if="series.authors?.name" class="text-[0.8125rem] text-ink-muted m-0 mb-2">
              by {{ series.authors.name }}
            </p>
            <p
              v-if="series.description"
              class="text-xs text-ink-muted m-0 leading-[1.45] line-clamp-2"
            >
              {{ series.description }}
            </p>
          </div>
          <div
            @mousedown.stop="isClickOnAction = true"
            v-if="showActions"
            class="flex items-center flex-shrink-0"
          >
            <button
              type="button"
              @click="$emit('addBook', series)"
              title="Add Book"
              class="p-2 rounded-lg hover:bg-paper-dark/60 text-ink-muted hover:text-ink"
            >
              <BookPlus class="w-5 h-5" />
            </button>

            <Menu as="div" class="relative inline-block text-left">
              <div>
                <MenuButton
                  class="p-2 rounded-lg hover:bg-paper-dark/60 text-ink-muted hover:text-ink"
                >
                  <MoreVertical class="w-5 h-5" />
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
                  class="absolute right-0 mt-2 w-48 origin-top-right rounded-lg bg-card-cream py-1 shadow-editorial ring-1 ring-ink/10 focus:outline-none z-20"
                >
                  <div class="px-1 py-1">
                    <MenuItem v-slot="{ active }">
                      <button
                        type="button"
                        @click="$emit('edit', series)"
                        :class="[
                          active ? 'bg-paper-dark/50' : '',
                          'group flex w-full items-center rounded-md px-2 py-2 text-sm text-ink',
                        ]"
                      >
                        <Edit class="mr-2 h-5 w-5 text-ink-muted" />
                        Edit Series
                      </button>
                    </MenuItem>
                  </div>
                  <div class="px-1 py-1">
                    <MenuItem v-slot="{ active }">
                      <button
                        type="button"
                        @click="$emit('delete', series)"
                        :class="[
                          active ? 'bg-red-50' : '',
                          'group flex w-full items-center rounded-md px-2 py-2 text-sm text-red-600',
                        ]"
                      >
                        <Trash2 class="mr-2 h-5 w-5" />
                        Delete Series
                      </button>
                    </MenuItem>
                  </div>
                </MenuItems>
              </transition>
            </Menu>
          </div>
        </div>

        <!-- Bookmark progress -->
        <div class="flex items-center gap-3 mt-4">
          <div class="flex-1 h-1 rounded-sm bg-paper-dark overflow-hidden">
            <div
              :class="[
                'h-full rounded-sm transition-all duration-500 ease-out',
                progressPercentage === 100
                  ? 'bg-accent-600'
                  : progressPercentage > 0
                    ? 'bg-bookmark'
                    : 'bg-paper-dark',
              ]"
              :style="{ width: `${progressPercentage}%` }"
            />
          </div>
          <span class="text-xs font-medium text-ink-muted whitespace-nowrap">
            {{ completedBooks }} / {{ series.total_books }}
          </span>
        </div>
      </div>
    </div>
    <!-- Expanded Book List -->
    <transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div v-if="isExpanded && sortedBooks.length > 0" class="px-[1.125rem] pb-4">
        <div class="border-t border-paper-dark pt-4 mt-4">
          <h4
            class="text-[0.7rem] font-semibold uppercase tracking-[0.06em] text-ink-muted m-0 mb-3"
          >
            Books in this series
          </h4>
          <div class="divide-y divide-paper-dark/80">
            <BookItemCard
              v-for="book in sortedBooks"
              :key="book.id"
              :book="book"
              @edit="$emit('editBook', $event)"
              @delete="$emit('deleteBook', $event)"
              @update-status="(bookId, status) => $emit('updateBookStatus', bookId, status)"
            />
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import type { Series, ReadonlySeries, Book } from '@/types'
import { Edit, BookPlus, MoreVertical, Trash2 } from 'lucide-vue-next'
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue'
import BookItemCard from '@/components/books/BookItemCard.vue'

interface Props {
  series: Series | ReadonlySeries
  showActions?: boolean
  isExpanded?: boolean
}

const props = defineProps<Props>()
defineEmits<{
  edit: [series: Series | ReadonlySeries]
  delete: [series: Series | ReadonlySeries]
  addBook: [series: Series | ReadonlySeries]
  toggleExpand: []
  editBook: [book: Book]
  deleteBook: [book: Book]
  updateBookStatus: [bookId: string, status: 'reading' | 'completed' | 'want_to_read' | 'dropped']
}>()

const isClickOnAction = ref(false)

const sortedBooks = computed(() => {
  if (!props.series.books) return []
  // Convert readonly array to mutable array for sorting
  const books = [...props.series.books] as Book[]
  return books.sort((a, b) => (a.series_order || 0) - (b.series_order || 0))
})

const completedBooks = computed(() => {
  if (!props.series.books) return 0
  return props.series.books.filter(book => book.status === 'completed').length
})

const progressPercentage = computed(() => {
  if (!props.series.total_books || props.series.total_books === 0) return 0
  return Math.round((completedBooks.value / props.series.total_books) * 100)
})
</script>
