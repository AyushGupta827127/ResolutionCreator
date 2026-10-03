<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/60 px-4">
    <div class="card flex w-full max-w-4xl overflow-hidden p-0">
      <!-- Branding panel — same image `template`'s own login/signup modal uses -->
      <div class="hidden w-1/2 flex-col justify-between bg-gradient-to-br from-ink-900 to-ink-950 p-10 lg:flex">
        <img src="/brand/logo.png" alt="" class="h-9 w-9 object-contain" />
        <img src="/brand/auth-panel.png" alt="" class="mx-auto w-[88%] rounded-2xl shadow-2xl" />
        <div>
          <p class="text-lg font-medium leading-snug text-white">
            Draft board &amp; shareholder resolutions with
            <span class="text-orange-400">built-in compliance checks</span>.
          </p>
          <p class="mt-3 text-sm text-ink-300">Section-cited, AI-assisted, ready for professional review.</p>
        </div>
      </div>

      <div class="relative w-full p-8 lg:w-1/2">
        <button
          class="absolute right-4 top-4 text-ink-400 hover:text-ink-700"
          aria-label="Close"
          @click="$emit('close')"
        >
          <Icon name="ph:x-bold" class="h-5 w-5" />
        </button>

        <h2 class="text-xl font-semibold">
        {{ mode === "signup" ? "Create your account" : "Welcome back" }}
      </h2>
      <p class="mt-1 text-sm text-ink-500">
        {{
          mode === "signup"
            ? "25 free credits to start drafting resolutions."
            : "Sign in to continue where you left off."
        }}
      </p>

      <p v-if="errorMessage" class="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{{ errorMessage }}</p>
      <p v-if="successMessage" class="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{{ successMessage }}</p>

      <!-- LOGIN -->
      <form v-if="mode === 'login' && !resetMode" class="mt-6 space-y-4" @submit.prevent="handleLogin">
        <div>
          <label class="mb-1 block text-sm font-medium">Email</label>
          <input v-model="email" type="email" required class="field-input" placeholder="you@company.com" />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium">Password</label>
          <input v-model="password" type="password" required class="field-input" placeholder="••••••••" />
          <button type="button" class="mt-1 text-xs text-ink-500 hover:underline" @click="resetMode = true">
            Forgot password?
          </button>
        </div>
        <button type="submit" :disabled="busy" class="btn-primary w-full">
          {{ busy ? "Signing in…" : "Sign in" }}
        </button>
      </form>

      <!-- RESET -->
      <div v-else-if="mode === 'login' && resetMode" class="mt-6 space-y-4">
        <div v-if="resetStep === 1">
          <label class="mb-1 block text-sm font-medium">Email</label>
          <input v-model="email" type="email" class="field-input" placeholder="you@company.com" />
          <button class="btn-primary mt-3 w-full" :disabled="busy" @click="requestOtp('reset')">Send OTP</button>
        </div>
        <div v-else-if="resetStep === 2">
          <label class="mb-1 block text-sm font-medium">Enter the OTP sent to {{ email }}</label>
          <input v-model="otp" type="text" class="field-input" placeholder="6-digit code" />
          <button class="btn-primary mt-3 w-full" :disabled="busy" @click="verifyReset">Verify</button>
        </div>
        <div v-else class="space-y-3">
          <div>
            <label class="mb-1 block text-sm font-medium">New password</label>
            <input v-model="newPassword" type="password" class="field-input" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium">Confirm new password</label>
            <input v-model="confirmNewPassword" type="password" class="field-input" />
          </div>
          <button class="btn-primary w-full" :disabled="busy" @click="submitNewPassword">Set new password</button>
        </div>
        <button class="text-xs text-ink-500 hover:underline" @click="resetMode = false; resetStep = 1">
          Back to sign in
        </button>
      </div>

      <!-- SIGNUP -->
      <form v-else class="mt-6 space-y-4" @submit.prevent="signupStep === 3 ? handleSignup() : null">
        <template v-if="signupStep === 1">
          <div>
            <label class="mb-1 block text-sm font-medium">Name</label>
            <input v-model="name" type="text" required class="field-input" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium">Email</label>
            <input v-model="email" type="email" required class="field-input" />
          </div>
          <button type="button" class="btn-primary w-full" :disabled="busy" @click="startSignup">Get OTP</button>
        </template>
        <template v-else-if="signupStep === 2">
          <label class="mb-1 block text-sm font-medium">Enter the OTP sent to {{ email }}</label>
          <input v-model="otp" type="text" class="field-input" placeholder="6-digit code" />
          <button type="button" class="btn-primary w-full" :disabled="busy" @click="verifySignup">Verify OTP</button>
        </template>
        <template v-else>
          <div>
            <label class="mb-1 block text-sm font-medium">Password</label>
            <input v-model="password" type="password" required class="field-input" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium">Confirm password</label>
            <input v-model="confirmPassword" type="password" required class="field-input" />
          </div>
          <button type="submit" class="btn-primary w-full" :disabled="busy">Create account</button>
        </template>
      </form>

      <div v-if="!resetMode" class="mt-5 flex items-center gap-3 text-xs text-ink-400">
        <div class="h-px flex-1 bg-ink-100" /> OR <div class="h-px flex-1 bg-ink-100" />
      </div>
      <button
        v-if="!resetMode"
        class="btn-secondary mt-4 w-full"
        :disabled="busy"
        @click="handleGoogle"
      >
        Continue with Google
      </button>

      <p v-if="!resetMode" class="mt-6 text-center text-sm text-ink-500">
        <template v-if="mode === 'login'">
          New here?
          <button class="font-semibold text-ink-800 hover:underline" @click="mode = 'signup'">Create an account</button>
        </template>
        <template v-else>
          Already have an account?
          <button class="font-semibold text-ink-800 hover:underline" @click="mode = 'login'">Sign in</button>
        </template>
      </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useAuth } from "@/composables/useAuth";

const props = defineProps({ initialMode: { type: String, default: "login" } });
const emit = defineEmits(["close"]);

const { signIn, signUp, signInWithGoogle, checkUserExists } = useAuth();

const mode = ref(props.initialMode);
const busy = ref(false);
const errorMessage = ref("");
const successMessage = ref("");

const name = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const otp = ref("");

const signupStep = ref(1);
const resetMode = ref(false);
const resetStep = ref(1);
const newPassword = ref("");
const confirmNewPassword = ref("");

const withBusy = async (fn) => {
  busy.value = true;
  errorMessage.value = "";
  try {
    await fn();
  } catch (error) {
    errorMessage.value = error?.data?.statusMessage || error.message || "Something went wrong.";
  } finally {
    busy.value = false;
  }
};

const handleLogin = () =>
  withBusy(async () => {
    await signIn(email.value, password.value);
    emit("close");
  });

const handleGoogle = () =>
  withBusy(async () => {
    await signInWithGoogle();
    emit("close");
  });

const startSignup = () =>
  withBusy(async () => {
    if (await checkUserExists(email.value)) {
      errorMessage.value = "That email already has an account — sign in instead.";
      mode.value = "login";
      return;
    }
    await $fetch("/api/send-otp", { method: "POST", body: { email: email.value, purpose: "signup" } });
    signupStep.value = 2;
  });

const verifySignup = () =>
  withBusy(async () => {
    await $fetch("/api/verify-otp", { method: "POST", body: { email: email.value, purpose: "signup", code: otp.value } });
    signupStep.value = 3;
  });

const handleSignup = () =>
  withBusy(async () => {
    if (password.value !== confirmPassword.value) {
      errorMessage.value = "Passwords do not match.";
      return;
    }
    await signUp(email.value, password.value);
    emit("close");
  });

const requestOtp = (purpose) =>
  withBusy(async () => {
    await $fetch("/api/send-otp", { method: "POST", body: { email: email.value, purpose } });
    resetStep.value = 2;
  });

const verifyReset = () =>
  withBusy(async () => {
    await $fetch("/api/verify-otp", { method: "POST", body: { email: email.value, purpose: "reset", code: otp.value } });
    resetStep.value = 3;
  });

const submitNewPassword = () =>
  withBusy(async () => {
    if (!newPassword.value || newPassword.value !== confirmNewPassword.value) {
      errorMessage.value = "Passwords do not match.";
      return;
    }
    if (newPassword.value.length < 8) {
      errorMessage.value = "Password must be at least 8 characters long.";
      return;
    }
    await $fetch("/api/admin-reset", {
      method: "POST",
      body: { email: email.value, otp: otp.value, newPassword: newPassword.value },
    });
    successMessage.value = "Password updated — sign in with your new password.";
    resetMode.value = false;
    resetStep.value = 1;
  });
</script>
