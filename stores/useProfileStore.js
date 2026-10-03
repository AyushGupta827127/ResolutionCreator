import { defineStore } from "pinia";
import { ref } from "vue";
import { getAuthHeaders } from "@/composables/useAuthHeaders";

const API_URL = "https://temp.finaceindia.com/items/user";

export const useProfileStore = defineStore("profile", () => {
  const profile = ref({
    id: null,
    name: "",
    email: "",
    credits: 0,
  });
  const loaded = ref(false);

  const fetchProfile = async () => {
    if (typeof window === "undefined") return;
    const email = localStorage.getItem("user_email") || "";
    if (!email) return;
    try {
      const response = await fetch(`${API_URL}?filter[email][_eq]=${email}`);
      const data = await response.json();
      if (data.data?.length) {
        profile.value = data.data[0];
        loaded.value = true;
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  // Credits are re-read from the server after every generate/save so the
  // balance shown here always matches Directus, not an optimistic guess.
  const refreshCredits = async () => {
    if (!profile.value.id) return;
    try {
      const res = await fetch(`/api/credits?userId=${encodeURIComponent(profile.value.id)}`, { headers: await getAuthHeaders() });
      const json = await res.json();
      if (json.success) profile.value.credits = json.user.credits;
    } catch (error) {
      console.error("Error refreshing credits:", error);
    }
  };

  return { profile, loaded, fetchProfile, refreshCredits };
});
