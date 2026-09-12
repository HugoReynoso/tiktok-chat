<script setup lang="ts">
defineProps<{
  label: string;
  value: number | string;
  icon: unknown;
  tone?: string;
}>();
</script>
<template>
  <div class="stat-card">
    <span class="stat-icon" :class="tone"
      ><component :is="icon" :size="19" /></span
    ><span class="stat-label">{{ label }}</span
    ><strong>{{
      typeof value === "number" ? value.toLocaleString() : value
    }}</strong>
  </div>
</template>
