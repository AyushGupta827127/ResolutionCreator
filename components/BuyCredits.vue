<template>
  <div class="rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
    <div class="flex items-center gap-2.5">
      <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
        <Icon name="ph:coins-bold" class="h-[18px] w-[18px]" />
      </span>
      <h3 class="font-sans text-[17px] font-semibold text-ink-950">Buy credits</h3>
    </div>
    <p class="mt-2 text-sm text-ink-500">Same account, same balance as the main Finace India app.</p>

    <div v-if="!razorpayEnabled" class="mt-4 rounded-lg bg-ink-50 px-3 py-2 text-sm text-ink-500">
      Online payment is currently switched off — contact support.
    </div>

    <div v-else class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <button
        v-for="pkg in packages"
        :key="pkg.credits"
        class="rounded-xl border px-3 py-3 text-center transition-all duration-150 hover:-translate-y-0.5"
        :class="selected?.credits === pkg.credits ? 'border-ink-900 bg-ink-900 text-white shadow-md' : 'border-ink-200 hover:border-ink-400 hover:shadow-sm'"
        @click="selected = pkg"
      >
        <p class="text-lg font-semibold">{{ pkg.credits }}</p>
        <p class="text-xs opacity-70">₹{{ (pkg.credits * pkg.price).toFixed(0) }}</p>
      </button>
    </div>

    <button v-if="razorpayEnabled" class="btn-accent mt-4 w-full" :disabled="!selected || processing" @click="pay">
      {{ processing ? "Processing…" : selected ? `Pay ₹${(selected.credits * selected.price).toFixed(0)}` : "Choose a pack" }}
    </button>
    <p v-if="message" class="mt-2 text-sm text-ink-600">{{ message }}</p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { storeToRefs } from "pinia";
import { useProfileStore } from "@/stores/useProfileStore";

const config = useRuntimeConfig();
const razorpayEnabled = computed(() => config.public.RAZORPAY_ENABLED);
const razorpayKeyId = computed(() => config.public.RAZORPAY_KEY_ID);

const { profile } = storeToRefs(useProfileStore());

const packages = [
  { credits: 10, price: 10 },
  { credits: 50, price: 9 },
  { credits: 100, price: 8 },
  { credits: 500, price: 7 },
];

const selected = ref(null);
const processing = ref(false);
const message = ref("");

onMounted(() => {
  const script = document.createElement("script");
  script.src = "https://checkout.razorpay.com/v1/checkout.js";
  script.async = true;
  document.head.appendChild(script);
});

async function pay() {
  if (!selected.value) return;
  processing.value = true;
  message.value = "";
  try {
    const amountInPaise = Math.round(selected.value.credits * selected.value.price * 100);
    const order = await $fetch("/api/create-order", {
      method: "POST",
      body: { credits: selected.value.credits }, // the server prices the order
    });

    if (!razorpayKeyId.value) throw new Error("Payment is not configured.");

    const rzp = new window.Razorpay({
      key: razorpayKeyId.value,
      amount: amountInPaise,
      currency: "INR",
      order_id: order.order_id,
      name: "Resolution Creator",
      description: `${selected.value.credits} Credits`,
      handler: async (response) => {
        const result = await $fetch("/api/verify-payment", {
          method: "POST",
          body: { ...response, email: profile.value.email },
        });
        profile.value.credits = result.new_balance;
        message.value = `Added ${result.credits} credits. New balance: ${result.new_balance}.`;
        selected.value = null;
      },
      theme: { color: "#141b26" },
    });
    rzp.open();
  } catch (error) {
    message.value = error.message || "Payment failed.";
  } finally {
    processing.value = false;
  }
}
</script>
