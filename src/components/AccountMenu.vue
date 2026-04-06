<template>
  <Menu
    as="div"
    :class="[
      'relative inline-block text-left',
      variant === 'rail' ? 'w-full' : '',
    ]"
  >
    <div>
      <MenuButton
        :class="[
          variant === 'rail'
            ? 'btn-secondary w-full justify-center py-2.5'
            : 'btn-secondary p-2 rounded-lg',
        ]"
        :aria-label="variant === 'toolbar' ? 'Menu' : undefined"
      >
        <span v-if="variant === 'rail'">Account</span>
        <MoreVertical v-else class="w-5 h-5" />
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
        class="absolute z-50 mt-2 w-56 origin-top-right rounded-lg bg-card-cream py-1 shadow-editorial ring-1 ring-ink/10 focus:outline-none"
        :class="variant === 'rail' ? 'left-0' : 'right-0'"
      >
        <div class="px-1 py-1 border-b border-paper-dark">
          <div v-if="authStore.user" class="px-3 py-2 text-sm text-ink">
            <p class="font-medium">Signed in as</p>
            <p class="truncate text-ink-muted">{{ authStore.user.email }}</p>
          </div>
        </div>

        <div class="px-1 py-1">
          <MenuItem v-slot="{ active }">
            <button
              type="button"
              @click="goToChangePassword"
              :class="[
                active ? 'bg-editorial-accent text-white' : 'text-ink',
                'group flex w-full items-center rounded-md px-2 py-2 text-sm',
              ]"
            >
              <KeyRound class="mr-2 h-5 w-5" aria-hidden="true" />
              Change password
            </button>
          </MenuItem>
          <MenuItem v-slot="{ active }">
            <button
              type="button"
              @click="handleSignOut"
              :class="[
                active ? 'bg-editorial-accent text-white' : 'text-ink',
                'group flex w-full items-center rounded-md px-2 py-2 text-sm',
              ]"
            >
              <LogOut class="mr-2 h-5 w-5" aria-hidden="true" />
              Sign Out
            </button>
          </MenuItem>
        </div>
      </MenuItems>
    </transition>
  </Menu>
</template>

<script lang="ts" setup>
import { useRouter } from 'vue-router'
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue'
import { MoreVertical, LogOut, KeyRound } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

defineProps<{
  variant: 'rail' | 'toolbar'
}>()

const authStore = useAuthStore()
const router = useRouter()

const goToChangePassword = () => {
  router.push({ name: 'ChangePassword' })
}

const handleSignOut = async () => {
  await authStore.signOut()
  router.push({ name: 'Login' })
}
</script>
